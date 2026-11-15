import { TRPCError } from '@trpc/server';
import { and, desc, eq, gte, inArray, isNull, lte, or, sql } from 'drizzle-orm';
import { z } from 'zod';
import { protectedProcedure } from '../lib/trpc';
import { categories, familyWallets as W, familyWalletTransactions as T, householdMembers, transactions, users } from '../db/schema';
import { dashboardMembership, moneyAmount } from '../lib/household/dashboard';
import { readBankHierarchy } from '../lib/household/finance-reads';
import { canViewMemberFinances, canViewWallet } from '../lib/household/policy';
import { categoryInput, dayInput, monthInput } from '../lib/household/query-input';
import { periodBounds } from '../lib/household/limits';

export type FamilyLedgerItem = {
    id: string; source: 'personal' | 'wallet'; date: string; kind: 'income' | 'expense';
    amount: string; currencyCode: string; categoryId: string | null; categoryName: string | null; categoryIcon: string | null;
    description: string | null;
    spender: { memberId: string | null; name: string; isMe: boolean } | null;
    author: { memberId: string | null; name: string; isMe: boolean } | null;
    place: { kind: 'account'; accountName: string; bankName: string }
        | { kind: 'wallet'; walletId: string; walletName: string; walletKind: 'shared' | 'child' };
};
const cursorSchema = z.object({ date: dayInput, createdAt: z.string().datetime({ precision: 6 }), id: z.string().regex(/^[pw]:[0-9a-f-]{36}$/) });
const cursorInput = z.string().max(1024).transform(value => {
    try { return cursorSchema.parse(JSON.parse(Buffer.from(value, 'base64url').toString())); }
    catch { throw new TRPCError({ code: 'BAD_REQUEST', message: 'Invalid cursor' }); }
});
// Keep PostgreSQL microseconds; JS Date would lose rows when timestamps nearly tie.
const timestamp = (column: typeof transactions.createdAt | typeof T.createdAt) =>
    sql<string>`to_char(${column}, 'YYYY-MM-DD"T"HH24:MI:SS.US"Z"')`;
const before = (table: typeof transactions | typeof T, prefix: 'p:' | 'w:', cursor?: z.infer<typeof cursorSchema>) => cursor
    ? sql`(${table.date}, ${table.createdAt}, ${prefix} || ${table.id}::text) < (${cursor.date}::date, ${cursor.createdAt}::timestamp, ${cursor.id})`
    : undefined;

export const householdFamilyTransactionProcedures = {
    familyTransactions: protectedProcedure.input(z.object({
        month: monthInput, memberId: z.string().uuid().optional(), categoryId: categoryInput.optional(), date: dayInput.optional(),
        cursor: cursorInput.optional(), limit: z.number().int().min(1).max(50).default(30),
    })).query(async ({ ctx, input }): Promise<{ items: FamilyLedgerItem[]; nextCursor: string | null; hiddenChildRows: boolean }> => {
        const viewer = await dashboardMembership(ctx.db, ctx.userId);
        if (viewer.role === 'child') throw new TRPCError({ code: 'FORBIDDEN' });
        const all = await ctx.db.select({ member: householdMembers, name: users.name, email: users.email }).from(householdMembers)
            .innerJoin(users, eq(users.id, householdMembers.userId))
            .where(and(eq(householdMembers.householdId, viewer.householdId), eq(householdMembers.status, 'active')));
        const person = (id: string | null) => {
            const row = all.find(r => r.member.id === id);
            return row ? { memberId: row.member.id, name: row.name?.trim() || row.email.split('@')[0], isMe: row.member.userId === ctx.userId } : null;
        };
        const { start, end } = periodBounds('monthly', `${input.month}-01`);
        const categoryId = input.categoryId === 'none' ? null : input.categoryId;
        const merged: { item: FamilyLedgerItem; createdAt: string }[] = [];
        for (const { member } of all.filter(r => canViewMemberFinances(viewer, r.member) && (!input.memberId || input.memberId === r.member.id))) {
            const hierarchy = await readBankHierarchy(ctx.db, member.userId, false);
            const balances = hierarchy.flatMap(bank => bank.accounts.flatMap(account => account.currencyBalances.map(balance => ({ balance, account, bank }))));
            if (!balances.length) continue;
            const rows = await ctx.db.query.transactions.findMany({
                where: and(inArray(transactions.currencyBalanceId, balances.map(b => b.balance.id)), eq(transactions.lifecycleStatus, 'active'),
                    eq(transactions.excludeFromMonthlyStats, false), inArray(transactions.type, ['income', 'expense']),
                    gte(transactions.date, start), lte(transactions.date, end), input.date ? eq(transactions.date, input.date) : undefined,
                    categoryId === null ? isNull(transactions.categoryId) : categoryId ? eq(transactions.categoryId, categoryId) : undefined,
                    before(transactions, 'p:', input.cursor)),
                orderBy: [desc(transactions.date), desc(transactions.createdAt), desc(transactions.id)], limit: input.limit + 1,
                extras: { cursorCreatedAt: timestamp(transactions.createdAt).as('cursor_created_at') }, with: { category: true },
            });
            for (const tx of rows) {
                const place = balances.find(b => b.balance.id === tx.currencyBalanceId)!;
                const spender = person(member.id);
                merged.push({ createdAt: tx.cursorCreatedAt, item: {
                    id: `p:${tx.id}`, source: 'personal', date: tx.date, kind: tx.type as 'income' | 'expense', amount: moneyAmount(tx.amount),
                    currencyCode: place.balance.currencyCode, categoryId: tx.categoryId, categoryName: tx.category?.name ?? null, categoryIcon: tx.category?.icon ?? null,
                    description: tx.description, spender, author: spender,
                    place: { kind: 'account', accountName: place.account.name, bankName: place.bank.name },
                } });
            }
        }
        const target = all.find(r => r.member.id === input.memberId)?.member;
        const walletFilter = and(eq(W.householdId, viewer.householdId), inArray(T.type, ['income', 'expense']), gte(T.date, start), lte(T.date, end),
            input.date ? eq(T.date, input.date) : undefined,
            categoryId === null ? isNull(T.categoryId) : categoryId ? eq(T.categoryId, categoryId) : undefined,
            input.memberId ? or(and(eq(W.kind, 'child'), eq(W.childMemberId, input.memberId)),
                // Shared-wallet spending belongs to its author, not the wallet owner.
                target ? and(eq(W.kind, 'shared'), eq(T.createdByUserId, target.userId)) : sql`false`) : undefined);
        const canReadChildren = viewer.role === 'owner' || viewer.isGuardian;
        // Existence uses the complete filtered query, independent of page/cursor.
        const hidden = canReadChildren ? [] : await ctx.db.select({ id: T.id }).from(T).innerJoin(W, eq(T.walletId, W.id))
            .where(and(walletFilter, eq(W.kind, 'child'))).limit(1);
        const rows = await ctx.db.select({ wallet: W, transaction: T, categoryName: categories.name, categoryIcon: categories.icon,
            cursorCreatedAt: timestamp(T.createdAt).as('cursor_created_at') }).from(T).innerJoin(W, eq(T.walletId, W.id))
            .leftJoin(categories, eq(T.categoryId, categories.id))
            .where(and(walletFilter, canReadChildren ? undefined : eq(W.kind, 'shared'), before(T, 'w:', input.cursor)))
            .orderBy(desc(T.date), desc(T.createdAt), desc(T.id)).limit(input.limit + 1);
        for (const { wallet, transaction: tx, categoryName, categoryIcon, cursorCreatedAt } of rows) {
            if (!canViewWallet(viewer, wallet)) continue;
            const authorMember = all.find(r => r.member.userId === tx.createdByUserId)?.member;
            const author = person(authorMember?.id ?? null);
            merged.push({ createdAt: cursorCreatedAt, item: {
                id: `w:${tx.id}`, source: 'wallet', date: tx.date, kind: tx.type as 'income' | 'expense', amount: moneyAmount(tx.amount), currencyCode: wallet.currencyCode,
                categoryId: tx.categoryId, categoryName, categoryIcon, description: tx.description,
                spender: wallet.kind === 'child' ? person(wallet.childMemberId) : author, author,
                place: { kind: 'wallet', walletId: wallet.id, walletName: wallet.name, walletKind: wallet.kind },
            } });
        }
        const compare = (a: string, b: string) => a < b ? 1 : a > b ? -1 : 0;
        merged.sort((a, b) => compare(a.item.date, b.item.date) || compare(a.createdAt, b.createdAt) || compare(a.item.id, b.item.id));
        const page = merged.slice(0, input.limit), last = page.at(-1);
        return { items: page.map(r => r.item), hiddenChildRows: hidden.length > 0,
            nextCursor: merged.length > input.limit && last ? Buffer.from(JSON.stringify({ date: last.item.date, createdAt: last.createdAt, id: last.item.id })).toString('base64url') : null };
    }),
};
