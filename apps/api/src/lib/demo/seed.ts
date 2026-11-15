import { z } from 'zod';
import { and, eq, inArray, isNull } from 'drizzle-orm';
import type { db as database } from '../../db';
import * as tables from '../../db/schema';
import transactionData from './transactions.json';
import { fromCents, toCents } from '../household/limits';

export const DEMO_SEED_VERSION = 1;
export const demoActors = ['owner', 'partner', 'child'] as const;
export type DemoActor = typeof demoActors[number];
export type DemoActorIds = Record<DemoActor, string>;
export const demoNames = { owner: 'Alex', partner: 'Jordan', child: 'Maya' } as const;
export const demoEmail = (role: DemoActor) => `${demoNames[role].toLowerCase()}@demo.woolet.cc`;
const rowSchema = z.object({
    actor: z.enum(demoActors), daysAgo: z.number().int().min(0).max(89),
    type: z.enum(['income', 'expense']), amount: z.string().regex(/^\d+\.\d{2}$/).refine(value => toCents(value) > 0),
    category: z.string(), description: z.string().min(6).max(100),
}).strict();
export const demoTransactions = z.array(rowSchema).length(100).parse(transactionData);
type SeedTransaction = Parameters<Parameters<typeof database.transaction>[0]>[0];

async function seedPurchaseExample(tx: SeedTransaction, householdId: string, actors: DemoActorIds, now: Date) {
    const existing = await tx.query.familyPurchaseProposals.findFirst({ where: eq(tables.familyPurchaseProposals.householdId, householdId) });
    if (existing) return false;
    const wallet = await tx.query.familyWallets.findFirst({ where: and(eq(tables.familyWallets.householdId, householdId), eq(tables.familyWallets.name, 'House & groceries'), eq(tables.familyWallets.kind, 'shared')) });
    if (!wallet) return false;
    const category = await tx.query.categories.findFirst({ where: and(isNull(tables.categories.userId), eq(tables.categories.name, 'Shopping')) });
    await tx.insert(tables.familyPurchaseProposals).values({
        householdId, walletId: wallet.id, proposerUserId: actors.partner, lastActorUserId: actors.partner,
        originalAmount: '1200.00', amount: '1200.00', categoryId: category?.id,
        description: 'New washing machine', date: demoDate(0, now),
        timeline: [{ action: 'proposed', byUserId: actors.partner, amount: '1200.00', at: now.toISOString() }],
    });
    return true;
}

export function demoDate(daysAgo: number, today = new Date()): string {
    const result = new Date(`${today.toISOString().slice(0, 10)}T12:00:00Z`);
    result.setUTCDate(result.getUTCDate() - daysAgo);
    return result.toISOString().slice(0, 10);
}

/** Only adds a fresh synthetic household. Re-running preserves edits and AI usage. */
export async function seedDemo(db: typeof database, actors: DemoActorIds, now = new Date()) {
    if (new Set(Object.values(actors)).size !== 3 || Object.values(actors).some(id => !/^user_[A-Za-z0-9]+$/.test(id))) {
        throw new Error('Three distinct Clerk demo users are required');
    }
    return db.transaction(async tx => {
        // Serialize provisioning without a new table or production schema migration.
        const { sql } = await import('drizzle-orm');
        await tx.execute(sql`select pg_advisory_xact_lock(hashtext('woolet-hackathon-demo-v1'))`);
        for (const actor of demoActors) {
            const existing = await tx.query.users.findFirst({ where: eq(tables.users.id, actors[actor]) });
            if (existing && existing.email !== demoEmail(actor)) throw new Error('Refusing to seed a non-demo user');
            if (!existing) await tx.insert(tables.users).values({
                id: actors[actor], email: demoEmail(actor), name: `${demoNames[actor]} Martinez`,
                username: `demo_martinez_${actor}`, defaultCurrency: 'USD', subscriptionTier: 'premium',
                preferences: { demoSeedVersion: DEMO_SEED_VERSION }, testMode: false,
            });
        }
        const existingFamily = await tx.query.households.findFirst({ where: eq(tables.households.ownerUserId, actors.owner) });
        if (existingFamily) return { created: false, householdId: existingFamily.id, actors, approvalCreated: await seedPurchaseExample(tx, existingFamily.id, actors, now) };
        const memberships = await tx.select().from(tables.householdMembers).where(inArray(tables.householdMembers.userId, Object.values(actors)));
        if (memberships.length) throw new Error('Demo actors already belong to a different household');
        // Unknown existing data must never be overwritten by a seed operation.
        const existingBanks = await tx.select().from(tables.banks).where(inArray(tables.banks.userId, Object.values(actors)));
        if (existingBanks.length) throw new Error('Demo users already contain unrecognized accounts');
        const categoryRows = await tx.select().from(tables.categories).where(isNull(tables.categories.userId));
        const category = (name: string) => {
            const found = categoryRows.find(row => row.name === name);
            if (!found) throw new Error(`Missing system category: ${name}`);
            return found.id;
        };
        demoTransactions.forEach(row => category(row.category));
        const primary: Record<DemoActor, string> = { owner: '', partner: '', child: '' };
        const accounts: Record<string, string> = {};
        for (const spec of [
            { actor: 'owner' as const, name: 'Chase', color: '#155AA8', accounts: [{ key: 'owner', name: 'Total Checking', type: 'checking', balance: '7500.00', digits: '4921' }, { key: 'savings', name: 'Emergency savings', type: 'savings', balance: '18500.00', digits: '1084' }] },
            { actor: 'owner' as const, name: 'Fidelity', color: '#39782C', accounts: [{ key: 'brokerage', name: 'Brokerage cash', type: 'investment', balance: '1000.00', digits: '6302' }, { key: 'deposit', name: 'Certificate of deposit', type: 'savings', balance: '0.00', digits: '8753' }] },
            { actor: 'partner' as const, name: 'Bank of America', color: '#B32930', accounts: [{ key: 'partner', name: 'Advantage Checking', type: 'checking', balance: '4200.00', digits: '7284' }, { key: 'travel', name: 'Travel savings', type: 'savings', balance: '3200.00', digits: '5048' }] },
            { actor: 'child' as const, name: 'Chase', color: '#155AA8', accounts: [{ key: 'child', name: "Maya's savings", type: 'savings', balance: '500.00', digits: '1139' }] },
        ]) {
            const [bank] = await tx.insert(tables.banks).values({ userId: actors[spec.actor], name: spec.name, color: spec.color, icon: '🏦', isTest: false }).returning();
            for (const accountSpec of spec.accounts) {
                const [account] = await tx.insert(tables.accounts).values({ bankId: bank.id, name: accountSpec.name, type: accountSpec.type, last4Digits: accountSpec.digits }).returning();
                const [balance] = await tx.insert(tables.currencyBalances).values({ accountId: account.id, currencyCode: 'USD', balance: accountSpec.balance }).returning();
                accounts[accountSpec.key] = account.id;
                if (demoActors.includes(accountSpec.key as DemoActor)) primary[accountSpec.key as DemoActor] = balance.id;
            }
        }
        const opening = { owner: 750000, partner: 420000, child: 50000 };
        const balances = { ...opening };
        await tx.insert(tables.transactions).values(demoTransactions.map(row => {
            balances[row.actor] += toCents(row.amount) * (row.type === 'income' ? 1 : -1);
            return { currencyBalanceId: primary[row.actor], categoryId: category(row.category), amount: row.amount,
                type: row.type, date: demoDate(row.daysAgo, now), description: row.description,
                createdAt: new Date(`${demoDate(row.daysAgo, now)}T12:00:00Z`), idempotencyKey: `demo-v1-${row.actor}-${crypto.randomUUID()}` };
        }));
        // Opening balances are explicit historical adjustments, excluded from spending charts.
        for (const actor of demoActors) {
            await tx.insert(tables.transactions).values({ currencyBalanceId: primary[actor], categoryId: category('Adjustment'), amount: fromCents(opening[actor]), type: 'income', date: demoDate(90, now), description: 'Sample opening balance', excludeFromMonthlyStats: true });
            await tx.update(tables.currencyBalances).set({ balance: fromCents(balances[actor]) }).where(eq(tables.currencyBalances.id, primary[actor]));
            await tx.insert(tables.userSettings).values({ userId: actors[actor], defaultCurrency: 'USD', notificationsEnabled: false, browserNotificationsEnabled: false, emailNotificationsEnabled: false });
            await tx.insert(tables.aiUsage).values({ userId: actors[actor], questionCountToday: 0, questionCountLifetime: 0, lastResetDate: demoDate(0, now) }).onConflictDoNothing();
        }
        const [household] = await tx.insert(tables.households).values({ name: 'Martinez Family', ownerUserId: actors.owner, childrenCanSeeSharedWallets: true }).returning();
        const memberIds: Record<DemoActor, string> = { owner: '', partner: '', child: '' };
        for (const actor of demoActors) {
            const [member] = await tx.insert(tables.householdMembers).values({ householdId: household.id, userId: actors[actor], role: actor === 'partner' ? 'adult' : actor, isGuardian: actor !== 'child', showBalanceToChildren: false }).returning();
            memberIds[actor] = member.id;
        }
        for (const spec of [
            { name: 'House & groceries', kind: 'shared' as const, actor: 'owner' as const, opening: '3000.00', expenses: [{ amount: '214.00', day: 1, description: 'Target — family essentials', category: 'Shopping', actor: 'partner' as const }, { amount: '286.00', day: 3, description: 'Costco — weekly groceries', category: 'Grocery', actor: 'owner' as const }, { amount: '132.00', day: 5, description: 'H-E-B — fresh groceries', category: 'Grocery', actor: 'partner' as const }, { amount: '40.00', day: 7, description: 'Pediatric appointment copay', category: 'Health', actor: 'partner' as const }, { amount: '48.00', day: 8, description: 'Chipotle — family dinner', category: 'Food', actor: 'owner' as const }, { amount: '260.00', day: 10, description: 'Austin Energy — utilities', category: 'Bills', actor: 'owner' as const }] },
            { name: 'Family vacation', kind: 'shared' as const, actor: 'owner' as const, opening: '1800.00', expenses: [] },
            { name: "Maya's allowance", kind: 'child' as const, actor: 'child' as const, opening: '150.00', expenses: [{ amount: '12.50', day: 1, description: 'BookPeople — reading club', category: 'Education', actor: 'child' as const }, { amount: '8.00', day: 4, description: 'School lunch', category: 'Food', actor: 'child' as const }, { amount: '18.00', day: 7, description: 'Art supplies', category: 'Shopping', actor: 'child' as const }] },
        ]) {
            const remaining = toCents(spec.opening) - spec.expenses.reduce((sum, row) => sum + toCents(row.amount), 0);
            const [wallet] = await tx.insert(tables.familyWallets).values({ householdId: household.id, name: spec.name, kind: spec.kind, currencyCode: 'USD', childMemberId: spec.kind === 'child' ? memberIds.child : null, balance: fromCents(remaining), createdByUserId: actors.owner }).returning();
            await tx.insert(tables.familyWalletTransactions).values({ walletId: wallet.id, type: 'income', amount: spec.opening, description: 'Sample wallet funding', date: demoDate(12, now), createdByUserId: actors.owner });
            if (spec.expenses.length) await tx.insert(tables.familyWalletTransactions).values(spec.expenses.map(row => ({ walletId: wallet.id, type: 'expense' as const, amount: row.amount, categoryId: category(row.category), description: row.description, date: demoDate(row.day, now), createdByUserId: actors[row.actor] })));
            if (spec.kind === 'child') await tx.insert(tables.familyBudgetLimits).values([
                { walletId: wallet.id, period: 'monthly', amount: '150.00', updatedByUserId: actors.owner },
                { walletId: wallet.id, period: 'weekly', amount: '45.00', updatedByUserId: actors.owner },
                { walletId: wallet.id, period: 'monthly', amount: '40.00', categoryId: category('Entertainment'), updatedByUserId: actors.owner },
            ]);
        }
        await tx.insert(tables.subscriptions).values([
            { userId: actors.owner, name: 'Netflix', type: 'general', amount: '15.49', currency: 'USD', frequency: 'monthly', billingDay: 20, startDate: demoDate(180, now), icon: '🎬', color: '#B32930' },
            { userId: actors.owner, name: 'Spotify Family', type: 'general', amount: '19.99', currency: 'USD', frequency: 'monthly', billingDay: 22, startDate: demoDate(120, now), icon: '🎵', color: '#39782C' },
            { userId: actors.partner, name: 'iCloud+', type: 'general', amount: '2.99', currency: 'USD', frequency: 'monthly', billingDay: 18, startDate: demoDate(120, now), icon: '☁️' },
            { userId: actors.partner, name: 'AT&T family plan', type: 'mobile', amount: '120.00', currency: 'USD', frequency: 'monthly', billingDay: 25, startDate: demoDate(200, now), icon: '📱' },
            { userId: actors.owner, name: 'Amazon Prime', type: 'general', amount: '139.00', currency: 'USD', frequency: 'yearly', billingDay: 26, startDate: `${now.getUTCFullYear()}-11-26`, icon: '📦' },
        ]);
        const [debt] = await tx.insert(tables.debts).values({ userId: actors.owner, currencyBalanceId: primary.owner, currencyCode: 'USD', personName: 'Jordan Martinez', linkedUserId: actors.partner, type: 'they_owe', amount: '240.00', paidAmount: '80.00', status: 'partial', description: 'Sample weekend cabin split', dueDate: demoDate(-7, now) }).returning();
        await tx.insert(tables.debtPayments).values({ debtId: debt.id, amount: '80.00', note: 'Sample partial repayment', paidAt: new Date(`${demoDate(4, now)}T12:00:00Z`) });
        await tx.insert(tables.debts).values({ userId: actors.partner, currencyBalanceId: primary.partner, currencyCode: 'USD', personName: 'Alex Martinez', linkedUserId: actors.owner, type: 'i_owe', amount: '240.00', paidAmount: '80.00', status: 'partial', description: 'Sample weekend cabin split', dueDate: demoDate(-7, now) });
        const source = await tx.query.transactions.findFirst({ where: and(eq(tables.transactions.currencyBalanceId, primary.owner), eq(tables.transactions.type, 'expense')) });
        if (source) {
            const [participant] = await tx.insert(tables.splitParticipants).values({ userId: actors.owner, name: 'Jordan Martinez', linkedUserId: actors.partner, linkedUsername: 'demo_martinez_partner', color: '#39782C' }).returning();
            await tx.insert(tables.transactionSplits).values({ transactionId: source.id, participantId: participant.id, owedAmount: fromCents(Math.round(toCents(source.amount) / 2)), note: 'Sample shared purchase', status: 'pending' });
        }
        await tx.insert(tables.credits).values({ accountId: accounts.owner, name: 'Toyota auto loan (sample)', principalAmount: '18000.00', remainingBalance: '12800.00', interestRate: '5.90', monthlyPayment: '480.00', currency: 'USD', startDate: demoDate(360, now), endDate: demoDate(-1080, now) });
        await tx.insert(tables.mortgages).values({ accountId: accounts.owner, propertyName: 'Rental condo (sample)', propertyAddress: 'Austin, TX — sample property', principalAmount: '180000.00', remainingBalance: '164000.00', interestRate: '4.25', monthlyPayment: '940.00', currency: 'USD', startDate: demoDate(1500, now), termYears: 30, paymentDay: 1 });
        await tx.insert(tables.deposits).values({ accountId: accounts.deposit, bankName: 'Fidelity', depositName: '12-month CD (sample)', principalAmount: '5000.00', currentBalance: '5075.00', interestRate: '4.50', compoundingFrequency: 'monthly', currency: 'USD', startDate: demoDate(120, now), maturityDate: demoDate(-245, now), isFlexible: false });
        const year = now.getUTCFullYear();
        await tx.insert(tables.taxProfiles).values({ userId: actors.owner, taxYear: year, filingStatus: 'married_joint', state: 'TX', qualifyingChildren: 1, wageIncome: '145200.00', interestIncome: '300.00', federalWithholdingYtd: '14000.00', priorYearTax: '15000.00', priorYearAgi: '140000.00', useTransactionsForIncome: false });
        await tx.insert(tables.taxEstimatedPayments).values({ userId: actors.owner, taxYear: year, quarter: 2, jurisdiction: 'federal', amount: '750.00', paidOn: `${year}-06-15`, note: 'Sample estimated federal payment' });
        const [stock] = await tx.insert(tables.stocks).values({ userId: actors.owner, ticker: 'VOO', name: 'Vanguard S&P 500 ETF (sample)', currency: 'USD', exchange: 'NYSE Arca', isManual: true }).returning();
        await tx.insert(tables.portfolioHoldings).values({ userId: actors.owner, stockId: stock.id, quantity: '10', averageCostBasis: '500.00' });
        await tx.insert(tables.investmentTransactions).values({ userId: actors.owner, stockId: stock.id, type: 'buy', date: demoDate(89, now), quantity: '10', pricePerShare: '500.00', totalAmount: '5000.00', currency: 'USD', cashFlow: '-5000.00', cashBalanceAfter: '1000.00', notes: 'Synthetic sample holding; prices are illustrative, not live market data' });
        await tx.insert(tables.stockPrices).values(Array.from({ length: 90 }, (_, index) => {
            const price = (500 + index * 0.55 + Math.sin(index / 5) * 4).toFixed(2);
            return { stockId: stock.id, date: demoDate(89 - index, now), open: price, high: price, low: price, close: price, adjustedClose: price, volume: '0' };
        }));
        await tx.insert(tables.investmentCashBalances).values({ userId: actors.owner, currency: 'USD', availableBalance: '1000.00', settledBalance: '1000.00' });
        await seedPurchaseExample(tx, household.id, actors, now);
        return { created: true, householdId: household.id, actors, personalTransactions: demoTransactions.length + 3, bankAccounts: 7, familyWallets: 3, approvalCreated: true };
    });
}
