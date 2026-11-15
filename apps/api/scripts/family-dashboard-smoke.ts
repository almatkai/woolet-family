// Local-only, rollback-only integration smoke test for the family dashboard.
import config from '../drizzle.config';
import postgres from 'postgres';
import { sql } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/postgres-js';
import { strict as assert } from 'node:assert';
import * as schema from '../src/db/schema';
import { householdRouter } from '../src/routers/household';
import { currencyExchangeService } from '../src/services/currency-exchange-service';
import type { Context } from '../src/lib/trpc';

const url = (config.dbCredentials as { url: string }).url;
if (!['localhost', '127.0.0.1', '[::1]'].includes(new URL(url).hostname)) throw new Error('Local database required');
const client = postgres(url, { max: 1, connect_timeout: 3 });
const db = drizzle(client, { schema });
const rollback = new Error('rollback smoke fixtures');
const oldRates = currencyExchangeService.getExchangeRates;
let rateCalls = 0;
currencyExchangeService.getExchangeRates = async () => { rateCalls++; return { USD: 1, EUR: 2 }; };
let passed = false;
try {
    await db.transaction(async tx => {
        const prefix = `family-smoke-${crypto.randomUUID()}`;
        const [owner, adult, child] = await tx.insert(schema.users).values(['owner', 'adult', 'child'].map(name => ({ id: `${prefix}-${name}`, email: `${prefix}-${name}@example.com`, name, defaultCurrency: 'USD', testMode: true }))).returning();
        await tx.insert(schema.currencies).values([{ code: 'USD', name: 'Dollar', symbol: '$' }, { code: 'EUR', name: 'Euro', symbol: 'E' }]).onConflictDoNothing();
        const [home] = await tx.insert(schema.households).values({ name: prefix, ownerUserId: owner.id }).returning();
        const members = await tx.insert(schema.householdMembers).values([
            { householdId: home.id, userId: owner.id, role: 'owner' }, { householdId: home.id, userId: adult.id, role: 'adult' }, { householdId: home.id, userId: child.id, role: 'child' },
        ]).returning();
        const [category] = await tx.insert(schema.categories).values({ name: prefix, icon: 'food', color: '#000000', type: 'expense' }).returning();
        const [personalCategory] = await tx.insert(schema.categories).values({ userId: owner.id, name: `${prefix}-personal`, icon: 'food', color: '#000000', type: 'expense' }).returning();
        const balanceIds: string[] = [];
        for (const [index, user] of [owner, adult, child, adult].entries()) {
            const [bank] = await tx.insert(schema.banks).values({ userId: user.id, name: `${prefix}-${index}`, isTest: index === 3 }).returning();
            const [account] = await tx.insert(schema.accounts).values({ bankId: bank.id, name: 'Main', type: 'card' }).returning();
            const [balance] = await tx.insert(schema.currencyBalances).values({ accountId: account.id, currencyCode: index === 1 ? 'EUR' : 'USD', balance: '100.00' }).returning();
            balanceIds.push(balance.id);
            await tx.insert(schema.transactions).values({ currencyBalanceId: balance.id, categoryId: category.id, amount: index === 3 ? '999.00' : '10.00', fee: '5.00', type: 'expense', date: '2026-02-12' });
        }
        // Extra same-timestamp rows exercise cursor tie-breaking against PostgreSQL.
        await tx.insert(schema.transactions).values(Array.from({ length: 51 }, () => ({ currencyBalanceId: balanceIds[1], categoryId: category.id, amount: '1.00', type: 'expense', date: '2026-02-11', createdAt: sql`'2026-02-11T12:00:00.123456'::timestamp` })));
        const [wallet] = await tx.insert(schema.familyWallets).values({ householdId: home.id, name: 'Child', kind: 'child', childMemberId: members[2].id, currencyCode: 'USD' }).returning();
        await tx.insert(schema.familyWalletTransactions).values([
            { walletId: wallet.id, type: 'expense', amount: '5.00', categoryId: category.id, date: '2026-02-12', createdByUserId: owner.id },
            { walletId: wallet.id, type: 'transfer_in', amount: '100.00', date: '2026-02-12', createdByUserId: owner.id },
        ]);
        const caller = (userId: string) => householdRouter.createCaller({ db: tx as unknown as Context['db'], userId } as Context);
        const ownerCaller = caller(owner.id); const adultCaller = caller(adult.id); const childCaller = caller(child.id);
        const total = await ownerCaller.setBudget({ categoryId: null, amount: '100.00' });
        const updated = await ownerCaller.setBudget({ categoryId: null, amount: '120.00' }); assert.equal(updated.id, total.id);
        await ownerCaller.setBudget({ categoryId: category.id, amount: '50.00' });
        await assert.rejects(adultCaller.setBudget({ categoryId: null, amount: '10' }), { code: 'FORBIDDEN' });
        await assert.rejects(ownerCaller.setBudget({ categoryId: personalCategory.id, amount: '10' }), { code: 'BAD_REQUEST' });
        const overview = await ownerCaller.overview({ month: '2026-02' });
        assert.equal(overview.converted.currencies[0].expense, '55.50');
        assert.equal(overview.categoryBudgets[0].spent, '55.50');
        const adultOverview = await adultCaller.overview({ month: '2026-02' });
        assert.equal(adultOverview.converted.currencies[0].expense, '45.50'); assert.equal(adultOverview.members.length, 2);
        await assert.rejects(childCaller.overview({ month: '2026-02' }), { code: 'FORBIDDEN' });
        await assert.rejects(adultCaller.memberFinances({ memberId: members[2].id }), { code: 'NOT_FOUND' });
        const first = await ownerCaller.memberFinances({ memberId: members[1].id });
        assert.equal(first.netWorth, '50.00'); assert.equal(first.transactions.items.length, 50);
        const second = await ownerCaller.memberFinances({ memberId: members[1].id, cursor: first.transactions.nextCursor! });
        assert.equal(second.transactions.items.length, 2); assert.equal(second.transactions.nextCursor, null);
        assert.equal(new Set([...first.transactions.items, ...second.transactions.items].map(t => t.id)).size, 52);
        assert.equal((await childCaller.memberFinances({ memberId: members[2].id })).member.isMe, true);
        await ownerCaller.deleteBudget({ categoryId: category.id });
        assert.equal((await ownerCaller.overview({ month: '2026-02' })).categoryBudgets.length, 0);
        passed = true;
        throw rollback;
    });
} catch (error) {
    if (error !== rollback) throw error;
} finally {
    currencyExchangeService.getExchangeRates = oldRates;
    await client.end();
}
assert.equal(passed, true);
console.log(`PASS: live PostgreSQL queries, budget upserts, permissions, conversions and pagination (${rateCalls} rate calls); all fixtures rolled back`);
process.exit(0);
