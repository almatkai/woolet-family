import { TRPCError } from '@trpc/server';
import { and, desc, eq, inArray, lt, or, sql } from 'drizzle-orm';
import { z } from 'zod';
import { protectedProcedure } from '../lib/trpc';
import { householdMembers, users, transactions, subscriptions, credits, mortgages, deposits } from '../db/schema';
import { canViewMemberFinances } from '../lib/household/policy';
import { baseConverter, dashboardMembership, householdBaseCurrency, moneyAmount } from '../lib/household/dashboard';
import { ownedActiveDebts, readBankHierarchy } from '../lib/household/finance-reads';
import { nextSubscriptionDate } from '../lib/household/subscription-date';
import { fromCents, periodBounds, toCents } from '../lib/household/limits';
import { currencyExchangeService } from '../services/currency-exchange-service';

const cursorData = z.object({ id: z.string().uuid(), date: z.string().refine(v => { try { periodBounds('monthly', v); return true; } catch { return false; } }), createdAt: z.string().datetime() });
const cursor = z.string().max(512).transform((value, ctx) => {
    try { return cursorData.parse(JSON.parse(Buffer.from(value, 'base64url').toString('utf8'))); }
    catch { ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Invalid cursor' }); return z.NEVER; }
});
export const householdMemberFinanceProcedures = {
    memberFinances: protectedProcedure.input(z.object({ memberId: z.string().uuid(), cursor: cursor.optional() })).query(async ({ ctx, input }) => {
        const viewer = await dashboardMembership(ctx.db, ctx.userId);
        const target = await ctx.db.query.householdMembers.findFirst({ where: and(eq(householdMembers.id, input.memberId), eq(householdMembers.householdId, viewer.householdId), eq(householdMembers.status, 'active')) });
        if (!target || !canViewMemberFinances(viewer, target)) throw new TRPCError({ code: 'NOT_FOUND', message: 'Member not found' });
        const targetUser = await ctx.db.query.users.findFirst({ where: eq(users.id, target.userId), columns: { name: true, email: true } });
        if (!targetUser) throw new TRPCError({ code: 'NOT_FOUND', message: 'Member not found' });
        const baseCurrency = await householdBaseCurrency(ctx.db, viewer.household.ownerUserId);
        const { convert, missing } = baseConverter(baseCurrency, await currencyExchangeService.getExchangeRates(baseCurrency));
        const hierarchy = await readBankHierarchy(ctx.db, target.userId, false);
        const accountIds = hierarchy.flatMap(b => b.accounts.map(a => a.id));
        const balances = hierarchy.flatMap(b => b.accounts.flatMap(a => a.currencyBalances));
        const boundary = input.cursor;
        const page = balances.length ? await ctx.db.query.transactions.findMany({
            where: and(inArray(transactions.currencyBalanceId, balances.map(b => b.id)), eq(transactions.lifecycleStatus, 'active'),
                boundary ? or(lt(transactions.date, boundary.date), and(eq(transactions.date, boundary.date), sql`${transactions.createdAt} < ${boundary.createdAt}::timestamp`),
                    and(eq(transactions.date, boundary.date), sql`${transactions.createdAt} = ${boundary.createdAt}::timestamp`, lt(transactions.id, boundary.id))) : undefined),
            orderBy: [desc(transactions.date), desc(transactions.createdAt), desc(transactions.id)], limit: 51,
            // Preserve PostgreSQL microseconds: Date truncates these to milliseconds
            // and would skip rows sharing the cursor's original timestamp.
            extras: { cursorCreatedAt: sql<string>`to_char(${transactions.createdAt}, 'YYYY-MM-DD"T"HH24:MI:SS.US"Z"')`.as('cursor_created_at') },
            with: { category: true, currencyBalance: { with: { account: true } } },
        }) : [];
        const items = page.slice(0, 50);
        const last = items.at(-1);
        const nextCursor = page.length > 50 && last ? Buffer.from(JSON.stringify({ id: last.id, date: last.date, createdAt: last.cursorCreatedAt })).toString('base64url') : null;
        const [activeSubscriptions, debtRows, creditRows, mortgageRows, depositRows] = await Promise.all([
            ctx.db.query.subscriptions.findMany({ where: and(eq(subscriptions.userId, target.userId), eq(subscriptions.status, 'active')) }),
            ctx.db.query.debts.findMany({ where: ownedActiveDebts(target.userId, false), with: { currencyBalance: true } }),
            accountIds.length ? ctx.db.query.credits.findMany({ where: inArray(credits.accountId, accountIds) }) : [],
            accountIds.length ? ctx.db.query.mortgages.findMany({ where: inArray(mortgages.accountId, accountIds) }) : [],
            accountIds.length ? ctx.db.query.deposits.findMany({ where: inArray(deposits.accountId, accountIds) }) : [],
        ]);
        const debtTotals = new Map<string, { iOwe: number; theyOwe: number }>();
        for (const debt of debtRows) {
            const currencyCode = debt.currencyBalance?.currencyCode ?? debt.currencyCode ?? 'USD';
            const totals = debtTotals.get(currencyCode) ?? { iOwe: 0, theyOwe: 0 };
            const remaining = Math.max(0, toCents(String(debt.amount)) - toCents(String(debt.paidAmount)));
            if (debt.type === 'i_owe') totals.iOwe += remaining;
            if (debt.type === 'they_owe') totals.theyOwe += remaining;
            debtTotals.set(currencyCode, totals);
        }
        const netWorth = fromCents(balances.reduce((sum, balance) => sum + toCents(convert(balance.balance, balance.currencyCode) ?? '0'), 0));
        return {
            baseCurrency,
            member: { memberId: target.id, name: targetUser.name?.trim() || targetUser.email.split('@')[0], role: target.role, isMe: target.userId === ctx.userId },
            accounts: hierarchy.flatMap(bank => bank.accounts.map(account => ({ bankName: bank.name, bankIcon: bank.icon, accountName: account.name, type: account.type,
                last4: account.last4Digits, balances: account.currencyBalances.map(b => ({ currencyCode: b.currencyCode, balance: moneyAmount(b.balance) })) }))),
            netWorth, unconvertedCurrencies: [...missing].sort(),
            transactions: { items: items.map(tx => ({ id: tx.id, date: tx.date, type: tx.type, amount: moneyAmount(tx.amount), currencyCode: tx.currencyBalance.currencyCode,
                categoryName: tx.category?.name ?? null, categoryIcon: tx.category?.icon ?? null, description: tx.description, accountName: tx.currencyBalance.account.name })), nextCursor },
            subscriptions: activeSubscriptions.map(sub => ({ name: sub.name, amount: moneyAmount(sub.amount), currency: sub.currency, frequency: sub.frequency, nextPaymentDate: nextSubscriptionDate(sub) })),
            liabilities: {
                debts: [...debtTotals].sort(([a], [b]) => a.localeCompare(b)).map(([currencyCode, t]) => ({ currencyCode, iOwe: fromCents(t.iOwe), theyOwe: fromCents(t.theyOwe) })),
                credits: creditRows.map(c => ({ name: c.name, remaining: moneyAmount(c.remainingBalance), monthlyPayment: moneyAmount(c.monthlyPayment), currency: c.currency })),
                mortgages: mortgageRows.map(m => ({ name: m.propertyName, remaining: moneyAmount(m.remainingBalance), monthlyPayment: moneyAmount(m.monthlyPayment), currency: m.currency })),
                deposits: depositRows.map(d => ({ name: d.depositName, balance: moneyAmount(d.currentBalance), currency: d.currency })),
            },
            // TODO: add a cheap, uncached valuation helper that converts each holding
            // to the base currency. The existing personal summary does neither.
            investments: null,
        };
    }),
};
