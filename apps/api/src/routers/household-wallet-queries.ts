import { TRPCError } from '@trpc/server';
import { and, eq, isNull, inArray, gte, lte, desc, sql } from 'drizzle-orm';
import { z } from 'zod';
import { protectedProcedure } from '../lib/trpc';
import { getMembership, assertWalletAccess, canViewWallet, canWriteWallet, canManageChildWallet } from '../lib/household/policy';
import { periodBounds, toCents, fromCents } from '../lib/household/limits';
import { familyWallets as W, familyWalletTransactions as T, familyBudgetLimits as L, householdMembers as M } from '../db/schema/households';
import { users, categories, banks, accounts, currencyBalances } from '../db/schema';
import type { db } from '../db';
const day = z.string().refine(v => { try { periodBounds('monthly', v); return true; } catch { return false; } }, 'Invalid date');
const todayInput = z.object({ today: day.optional() });
const walletInput = todayInput.extend({ walletId: z.string().uuid() });
const todayOf = (v?: string) => v ?? new Date().toISOString().slice(0, 10);
async function membership(database: typeof db, userId: string) {
    const m = await getMembership(database, userId);
    if (!m) throw new TRPCError({ code: 'NOT_FOUND', message: 'Family not found' });
    return m;
}
async function access(database: typeof db, userId: string, id: string) {
    const m = await membership(database, userId);
    const [w] = await database.select().from(W).where(eq(W.id, id)).limit(1);
    if (!w) throw new TRPCError({ code: 'NOT_FOUND' });
    assertWalletAccess(m, w, 'view'); return { m, w };
}
const money = (v: string) => fromCents(toCents(v));
export const householdWalletQueries = {
    wallets: protectedProcedure.input(todayInput.optional()).query(async ({ ctx, input }) => {
        const m = await membership(ctx.db, ctx.userId), today = todayOf(input?.today);
        const all = await ctx.db.select({ wallet: W, childName: users.name }).from(W)
            .leftJoin(M, eq(M.id, W.childMemberId)).leftJoin(users, eq(users.id, M.userId))
            .where(and(eq(W.householdId, m.householdId), isNull(W.archivedAt)));
        const visible = all.filter(({ wallet }) => canViewWallet(m, wallet));
        const ids = visible.filter(r => r.wallet.kind === 'child').map(r => r.wallet.id);
        const limits = ids.length ? await ctx.db.select().from(L).where(and(inArray(L.walletId, ids), isNull(L.categoryId))) : [];
        const summaries = new Map<string, { limitId: string; period: 'weekly' | 'monthly'; amount: string; spent: string; remaining: string; periodStart: string; periodEnd: string }>();
        for (const period of ['weekly', 'monthly'] as const) {
            const relevant = limits.filter(l => l.period === period); if (!relevant.length) continue;
            const { start, end } = periodBounds(period, today);
            const totals = await ctx.db.select({ walletId: T.walletId, spent: sql<string>`sum(${T.amount})` }).from(T)
                .where(and(inArray(T.walletId, relevant.map(l => l.walletId)), inArray(T.type, ['expense', 'transfer_out']), gte(T.date, start), lte(T.date, end))).groupBy(T.walletId);
            for (const l of relevant) {
                const spent = money(totals.find(t => t.walletId === l.walletId)?.spent ?? '0');
                const remaining = fromCents(Math.max(0, toCents(l.amount) - toCents(spent)));
                if (!summaries.has(l.walletId) || toCents(remaining) < toCents(summaries.get(l.walletId)!.remaining)) summaries.set(l.walletId, { limitId: l.id, period, amount: money(l.amount), spent, remaining, periodStart: start, periodEnd: end });
            }
        }
        const adultBalances: { memberId: string; name: string; totals: { currencyCode: string; amount: string }[] }[] = [];
        if (m.role === 'child') {
            const adults = await ctx.db.select({ memberId: M.id, name: users.name, email: users.email, userId: M.userId }).from(M).innerJoin(users, eq(users.id, M.userId)).where(and(eq(M.householdId, m.householdId), eq(M.status, 'active'), inArray(M.role, ['owner', 'adult']), eq(M.showBalanceToChildren, true)));
            if (adults.length) {
                const totals = await ctx.db.select({ userId: banks.userId, currencyCode: currencyBalances.currencyCode, amount: sql<string>`sum(${currencyBalances.balance})` }).from(banks).innerJoin(accounts, eq(accounts.bankId, banks.id)).innerJoin(currencyBalances, eq(currencyBalances.accountId, accounts.id)).where(and(inArray(banks.userId, adults.map(a => a.userId)), eq(banks.isTest, false))).groupBy(banks.userId, currencyBalances.currencyCode);
                for (const a of adults) adultBalances.push({ memberId: a.memberId, name: a.name || a.email.split('@')[0]!, totals: totals.filter(t => t.userId === a.userId).map(t => ({ currencyCode: t.currencyCode, amount: money(t.amount) })) });
            }
        }
        return { wallets: visible.map(({ wallet: w, childName }) => ({ id: w.id, kind: w.kind, name: w.name, currencyCode: w.currencyCode, balance: money(w.balance), childMemberId: w.childMemberId, childName, canWrite: canWriteWallet(m, w, 'expense'), canManage: w.kind === 'child' ? canManageChildWallet(m, w) : m.role !== 'child', canDeleteTransactions: m.role !== 'child' && (w.kind === 'shared' || canManageChildWallet(m, w)), limitSummary: summaries.get(w.id) ?? null })), sharedWalletsVisible: m.role === 'child' && m.household.childrenCanSeeSharedWallets ? all.filter(r => r.wallet.kind === 'shared').map(({ wallet: w }) => ({ id: w.id, name: w.name, currencyCode: w.currencyCode, balance: money(w.balance) })) : [], adultBalances };
    }),
    walletTransactions: protectedProcedure.input(z.object({ walletId: z.string().uuid(), cursor: z.string().optional(), limit: z.number().int().min(1).max(100).default(30) })).query(async ({ ctx, input }) => {
        const { m } = await access(ctx.db, ctx.userId, input.walletId);
        let cursor: { date: string; createdAt: string; id: string } | undefined;
        if (input.cursor) { try { cursor = z.object({ date: day, createdAt: z.string().datetime(), id: z.string().uuid() }).parse(JSON.parse(Buffer.from(input.cursor, 'base64').toString())); } catch { throw new TRPCError({ code: 'BAD_REQUEST', message: 'Invalid cursor' }); } }
        const rows = await ctx.db.select({ transaction: T, categoryName: categories.name, creator: users.name }).from(T).leftJoin(categories, eq(categories.id, T.categoryId)).leftJoin(users, eq(users.id, T.createdByUserId)).where(and(eq(T.walletId, input.walletId), cursor ? sql`(${T.date}, ${T.createdAt}, ${T.id}) < (${cursor.date}, ${new Date(cursor.createdAt)}, ${cursor.id})` : undefined)).orderBy(desc(T.date), desc(T.createdAt), desc(T.id)).limit(input.limit + 1);
        const page = rows.slice(0, input.limit), groups = page.flatMap(r => r.transaction.transferGroupId ? [r.transaction.transferGroupId] : []);
        const legs = groups.length ? await ctx.db.select({ transaction: T, wallet: W }).from(T).innerJoin(W, eq(W.id, T.walletId)).where(inArray(T.transferGroupId, groups)) : [];
        // Children may see a shared wallet's name (not its transactions) when the owner allows it.
        const canSeeName = (w: typeof W.$inferSelect) => canViewWallet(m, w) || (m.role === 'child' && m.household.childrenCanSeeSharedWallets && w.kind === 'shared' && w.householdId === m.householdId && !w.archivedAt);
        const items = page.map(({ transaction: t, categoryName, creator }) => {
            const other = legs.find(l => l.transaction.transferGroupId === t.transferGroupId && l.wallet.id !== t.walletId && canSeeName(l.wallet));
            return { id: t.id, type: t.type, amount: money(t.amount), categoryId: t.categoryId, categoryName, description: t.description, date: t.date, transferGroupId: t.transferGroupId, counterpartWalletId: other?.wallet.id ?? null, counterpartWalletName: other?.wallet.name ?? null, createdByName: creator?.trim().split(/\s+/)[0] || null, createdAt: t.createdAt };
        });
        const last = page.at(-1)?.transaction;
        return { items, nextCursor: rows.length > input.limit && last ? Buffer.from(JSON.stringify({ date: last.date, createdAt: last.createdAt.toISOString(), id: last.id })).toString('base64') : null };
    }),
    walletSummary: protectedProcedure.input(walletInput).query(async ({ ctx, input }) => {
        await access(ctx.db, ctx.userId, input.walletId);
        const { start, end } = periodBounds('monthly', todayOf(input.today));
        const rows = await ctx.db.select().from(T).where(and(eq(T.walletId, input.walletId), gte(T.date, start), lte(T.date, end)));
        let income = 0, outflow = 0;
        for (const t of rows) { if (t.type === 'income' || t.type === 'transfer_in') income += toCents(t.amount); else outflow += toCents(t.amount); }
        return { monthIncome: fromCents(income), monthOutflow: fromCents(outflow), monthStart: start, monthEnd: end };
    }),
    limits: protectedProcedure.input(walletInput).query(async ({ ctx, input }) => {
        const { w } = await access(ctx.db, ctx.userId, input.walletId);
        if (w.kind !== 'child') return [];
        const limits = await ctx.db.select({ limit: L, categoryName: categories.name }).from(L).leftJoin(categories, eq(categories.id, L.categoryId)).where(eq(L.walletId, w.id));
        if (!limits.length) return [];
        const today = todayOf(input.today);
        const bounds = limits.map(({ limit: l }) => periodBounds(l.period, today));
        const rows = await ctx.db.select().from(T).where(and(eq(T.walletId, w.id), inArray(T.type, ['expense', 'transfer_out']), gte(T.date, bounds.map(b => b.start).sort()[0]!), lte(T.date, bounds.map(b => b.end).sort().at(-1)!)));
        return limits.map(({ limit: l, categoryName }, i) => {
            const { start, end } = bounds[i]!;
            const spent = rows.filter(t => t.date >= start && t.date <= end && (l.categoryId === null || (t.type === 'expense' && t.categoryId === l.categoryId))).reduce((sum, t) => sum + toCents(t.amount), 0);
            return { id: l.id, categoryId: l.categoryId, categoryName, period: l.period, amount: money(l.amount), spent: fromCents(spent), remaining: fromCents(Math.max(0, toCents(l.amount) - spent)), periodStart: start, periodEnd: end };
        });
    }),
};
