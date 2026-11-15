import { TRPCError } from '@trpc/server';
import { and, eq, gte, inArray, lte } from 'drizzle-orm';
import { z } from 'zod';
import { protectedProcedure } from '../lib/trpc';
import { householdMembers, users, householdBudgets, categories, transactions, familyWallets, familyWalletTransactions } from '../db/schema';
import { canViewMemberFinances, canViewWallet } from '../lib/household/policy';
import { baseConverter, dashboardMembership, householdBaseCurrency } from '../lib/household/dashboard';
import { readBankHierarchy } from '../lib/household/finance-reads';
import { buildFamilyOverview, type LedgerRow } from '../lib/household/overview-math';
import { fromCents, periodBounds, toCents } from '../lib/household/limits';
import { currencyExchangeService } from '../services/currency-exchange-service';

const monthInput = z.string().regex(/^\d{4}-\d{2}$/).refine(month => {
    try { periodBounds('monthly', `${month}-01`); return month > '0000-01'; } catch { return false; }
}, 'Invalid month');
export const householdOverviewProcedures = {
    overview: protectedProcedure.input(z.object({ month: monthInput })).query(async ({ ctx, input }) => {
        const viewer = await dashboardMembership(ctx.db, ctx.userId);
        if (viewer.role === 'child') throw new TRPCError({ code: 'FORBIDDEN' });
        const baseCurrency = await householdBaseCurrency(ctx.db, viewer.household.ownerUserId);
        const rates = await currencyExchangeService.getExchangeRates(baseCurrency);
        const { convert, missing } = baseConverter(baseCurrency, rates);
        const { end } = periodBounds('monthly', `${input.month}-01`);
        const previousDate = new Date(`${input.month}-01T00:00:00Z`);
        previousDate.setUTCMonth(previousDate.getUTCMonth() - 1);
        const previousMonth = previousDate.toISOString().slice(0, 7);
        const start = `${previousMonth}-01`;
        const allMembers = await ctx.db.select({ member: householdMembers, name: users.name, email: users.email }).from(householdMembers)
            .innerJoin(users, eq(users.id, householdMembers.userId))
            .where(and(eq(householdMembers.householdId, viewer.householdId), eq(householdMembers.status, 'active')));
        const visible = allMembers.filter(({ member }) => canViewMemberFinances(viewer, member));
        // Label every active member: child-wallet spending is attributed to the child even
        // for adults who can't open the child's personal finances.
        const names = allMembers.map(({ member, name, email }) => ({ id: member.id, name: name?.trim() || email.split('@')[0] }));
        const nameOf = (id: string) => names.find(n => n.id === id)?.name ?? 'Former member';
        const rows: LedgerRow[] = [];
        const netWorth = new Map<string, string>();
        for (const { member } of visible) {
            const hierarchy = await readBankHierarchy(ctx.db, member.userId, false);
            const balances = hierarchy.flatMap(b => b.accounts.flatMap(a => a.currencyBalances));
            netWorth.set(member.id, fromCents(balances.reduce((sum, b) => sum + toCents(convert(b.balance, b.currencyCode) ?? '0'), 0)));
            if (!balances.length) continue;
            const personal = await ctx.db.query.transactions.findMany({
                where: and(inArray(transactions.currencyBalanceId, balances.map(b => b.id)), gte(transactions.date, start), lte(transactions.date, end),
                    eq(transactions.lifecycleStatus, 'active'), eq(transactions.excludeFromMonthlyStats, false), inArray(transactions.type, ['income', 'expense', 'transfer'])),
                with: { category: true, currencyBalance: true },
            });
            for (const tx of personal) rows.push({ id: `p:${tx.id}`, date: tx.date, kind: tx.type as LedgerRow['kind'], amount: String(tx.amount),
                currencyCode: tx.currencyBalance.currencyCode, memberId: member.id, categoryId: tx.categoryId, categoryName: tx.category?.name ?? null });
        }
        const walletRows = await ctx.db.select({ wallet: familyWallets, transaction: familyWalletTransactions, categoryName: categories.name }).from(familyWalletTransactions)
            .innerJoin(familyWallets, eq(familyWalletTransactions.walletId, familyWallets.id))
            .leftJoin(categories, eq(familyWalletTransactions.categoryId, categories.id))
            .where(and(eq(familyWallets.householdId, viewer.householdId), gte(familyWalletTransactions.date, start), lte(familyWalletTransactions.date, end)));
        for (const { wallet, transaction: tx, categoryName } of walletRows) {
            // The dashboard spec explicitly includes child-wallet spending in every
            // adult's totals. Personal child banks still require guardian access.
            const childWalletInAdultTotals = wallet.kind === 'child' && wallet.householdId === viewer.householdId;
            if (!canViewWallet(viewer, wallet) && !childWalletInAdultTotals) continue;
            rows.push({ id: `w:${tx.id}`, date: tx.date, kind: tx.type === 'income' || tx.type === 'expense' ? tx.type : 'transfer',
                amount: String(tx.amount), currencyCode: wallet.currencyCode,
                memberId: wallet.kind === 'child' ? wallet.childMemberId : allMembers.find(({ member }) => member.userId === tx.createdByUserId)?.member.id ?? null,
                categoryId: tx.categoryId, categoryName });
        }
        const budgetRows = await ctx.db.select({ budget: householdBudgets, categoryName: categories.name }).from(householdBudgets)
            .leftJoin(categories, eq(householdBudgets.categoryId, categories.id)).where(eq(householdBudgets.householdId, viewer.householdId));
        const totalBudget = budgetRows.find(({ budget }) => budget.categoryId === null)?.budget;
        const convertedRows = rows.flatMap(row => {
            const amount = convert(row.amount, row.currencyCode);
            // A positive foreign amount can round to zero; it contributes no cents.
            return amount !== null && toCents(amount) > 0 ? [{ ...row, amount, currencyCode: baseCurrency }] : [];
        });
        const convertedBudget = totalBudget ? convert(totalBudget.amount, totalBudget.currencyCode) : null;
        const converted = buildFamilyOverview({ month: input.month, transactions: convertedRows, members: names,
            budgets: convertedBudget === null ? [] : [{ currencyCode: baseCurrency, amount: convertedBudget }] });
        if (!converted.currencies.length) {
            converted.currencies.push({ currencyCode: baseCurrency, income: '0.00', expense: '0.00', budget: null, remaining: null });
            for (const day of converted.dailyExpenses) day.totals.push({ currencyCode: baseCurrency, amount: '0.00' });
        }
        const categoryBudgets = budgetRows.flatMap(({ budget, categoryName }) => {
            if (budget.categoryId === null) return [];
            const amount = convert(budget.amount, budget.currencyCode);
            return amount === null ? [] : [{ categoryId: budget.categoryId, categoryName: categoryName ?? 'Unnamed category', amount,
                spent: converted.categories.find(c => c.categoryId === budget.categoryId)?.totals[0]?.amount ?? '0.00' }];
        });
        const previous = buildFamilyOverview({ month: previousMonth, transactions: convertedRows, members: names });
        return {
            baseCurrency,
            byCurrency: buildFamilyOverview({ month: input.month, transactions: rows, members: names,
                budgets: totalBudget ? [{ currencyCode: totalBudget.currencyCode, amount: totalBudget.amount }] : [] }),
            converted, unconvertedCurrencies: [...missing].sort(), categoryBudgets,
            previousMonthExpense: previous.currencies[0]?.expense ?? '0.00',
            members: visible.map(({ member }) => ({ memberId: member.id, userId: member.userId, name: nameOf(member.id), role: member.role,
                isGuardian: member.isGuardian, isMe: member.userId === ctx.userId, netWorth: netWorth.get(member.id) ?? '0.00',
                spent: converted.members.find(m => m.memberId === member.id)?.totals[0]?.amount ?? '0.00',
                transactionsCount: rows.filter(r => r.memberId === member.id && r.date >= `${input.month}-01` && r.date <= end).length })),
        };
    }),
};
