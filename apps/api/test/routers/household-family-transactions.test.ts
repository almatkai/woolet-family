import { expect, test } from 'bun:test';
import { PgDialect } from 'drizzle-orm/pg-core';
import { householdRouter } from '../../src/routers/household';
import { familyWalletTransactions, householdMembers } from '../../src/db/schema';
import { createMockContext } from '../utils';

const uuid = (n: number) => `00000000-0000-4000-8000-${String(n).padStart(12, '0')}`;
const home = uuid(1), viewerId = uuid(2), adultId = uuid(3), childId = uuid(4), categoryId = uuid(5);
const dialect = new PgDialect();
function setup(role = 'owner', guardian = false) {
    const viewer = { id: viewerId, userId: 'viewer', householdId: home, role, isGuardian: guardian, status: 'active' };
    const all = [viewer, { ...viewer, id: adultId, userId: 'adult', role: 'adult' }, { ...viewer, id: childId, userId: 'child', role: 'child' }]
        .map(member => ({ member, name: member.userId, email: `${member.userId}@test.com` }));
    const reads: { table: string; sql: string; params: any[] }[] = [];
    const record = (table: string, where: any) => { const q = dialect.sqlToQuery(where); reads.push({ table, ...q }); return q; };
    const tx = (n: number, userId: string, extra: any = {}) => ({ id: uuid(n), currencyBalanceId: `${userId}-balance`, date: '2026-11-15',
        cursorCreatedAt: '2026-11-15T12:00:00.123456Z', amount: '10.00', type: 'expense', categoryId, category: { name: 'Food', icon: 'food' },
        description: null, lifecycleStatus: 'active', excludeFromMonthlyStats: false, ...extra });
    const personal = [tx(20, 'viewer'), tx(21, 'adult'), tx(22, 'child'), tx(23, 'test'), tx(24, 'viewer', { type: 'transfer' }),
        tx(25, 'viewer', { excludeFromMonthlyStats: true }), tx(26, 'viewer', { lifecycleStatus: 'deleting' })];
    const wallet = (kind: string) => ({ id: kind === 'child' ? uuid(8) : uuid(9), householdId: home, kind, childMemberId: kind === 'child' ? childId : null, name: `${kind} wallet`, currencyCode: 'EUR', archivedAt: null });
    const wallets = [{ wallet: wallet('child'), transaction: { ...tx(30, 'child'), createdByUserId: 'viewer' }, categoryName: 'Food', categoryIcon: 'food' },
        { wallet: wallet('shared'), transaction: { ...tx(31, 'adult'), createdByUserId: 'adult' }, categoryName: 'Food', categoryIcon: 'food' },
        { wallet: wallet('child'), transaction: { ...tx(32, 'child', { type: 'transfer_in' }), createdByUserId: 'viewer' }, categoryName: null, categoryIcon: null }];
    function filtered(rows: any[], q: any, prefix: string) {
        const dates = q.params.filter((p: any) => typeof p === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(p));
        const cursorId = q.params.at(-1)?.match?.(/^[pw]:/) ? q.params.at(-1) : null;
        const cursorTime = cursorId ? q.params.at(-2) : null;
        return rows.filter(t => t.date >= dates[0] && t.date <= dates[1] && (!q.sql.includes('"date" =') || t.date === dates[2])
            && ['income', 'expense'].includes(t.type)
            && (!q.sql.includes('"category_id" is null') || t.categoryId === null)
            && (!q.params.includes(categoryId) || t.categoryId === categoryId)
            && (!cursorId || t.date < q.params.at(-3) || (t.date === q.params.at(-3) && (t.cursorCreatedAt < cursorTime || (t.cursorCreatedAt === cursorTime && `${prefix}${t.id}` < cursorId)))))
            .sort((a, b) => b.date.localeCompare(a.date) || b.cursorCreatedAt.localeCompare(a.cursorCreatedAt) || b.id.localeCompare(a.id));
    }
    const db: any = {
        query: {
            banks: { findMany: async ({ where }: any) => {
                const q = record('banks', where); expect(q.params[1]).toBe(false);
                return [{ name: `${q.params[0]} bank`, accounts: [{ name: 'Main', currencyBalances: [{ id: `${q.params[0]}-balance`, currencyCode: 'USD' }] }] }];
            } },
            transactions: { findMany: async ({ where, limit, extras, orderBy }: any) => {
                const q = record('personal', where);
                expect(q.params).toContain('active'); expect(q.params).toContain(false); expect(q.params).toContain('income'); expect(q.params).toContain('expense');
                expect(dialect.sqlToQuery(extras.cursorCreatedAt.getSQL()).sql).toContain('SS.US'); expect(orderBy).toHaveLength(3);
                return filtered(personal.filter(t => q.params.includes(t.currencyBalanceId) && t.lifecycleStatus === 'active' && !t.excludeFromMonthlyStats), q, 'p:').slice(0, limit);
            } },
        },
        select: (fields: any) => ({ from: (table: any) => {
            let where: any, limit = Infinity;
            const value = () => {
                if (fields.membership) return [{ membership: viewer, household: {} }];
                if (table === householdMembers) return all;
                if (table !== familyWalletTransactions) throw Error('Unexpected table');
                const q = record(fields.id ? 'hidden' : 'wallets', where);
                expect(q.params).toContain(home); expect(q.params).toContain('income'); expect(q.params).toContain('expense');
                if (!fields.id && role === 'adult' && !guardian) expect(q.params).toContain('shared');
                const selected = wallets.filter(r => (fields.id ? r.wallet.kind === 'child' : role !== 'adult' || guardian || r.wallet.kind === 'shared')
                    && (!q.params.includes(childId) || r.wallet.childMemberId === childId || (r.wallet.kind === 'shared' && r.transaction.createdByUserId === 'child'))
                    && (!q.params.includes(adultId) || r.wallet.childMemberId === adultId || (r.wallet.kind === 'shared' && r.transaction.createdByUserId === 'adult')));
                const ids = new Set(filtered(selected.map(r => r.transaction), q, 'w:').slice(0, limit).map(t => t.id));
                return selected.filter(r => ids.has(r.transaction.id)).map(r => fields.id ? { id: r.transaction.id } : { ...r, cursorCreatedAt: r.transaction.cursorCreatedAt });
            };
            const chain: any = { innerJoin: () => chain, leftJoin: () => chain, where: (w: any) => { where = w; return chain; }, orderBy: () => chain,
                limit: (n: number) => { limit = n; return chain; }, then: (resolve: any, reject: any) => Promise.resolve().then(value).then(resolve, reject) };
            return chain;
        } }),
    };
    return { caller: householdRouter.createCaller(createMockContext({ userId: 'viewer', user: { testMode: true } as any, db })), reads, personal, wallets, tx };
}
test('family ledger merges non-test personal and wallet rows with spender, author and place', async () => {
    const { caller, reads } = setup();
    const result = await caller.familyTransactions({ month: '2026-11' });
    expect(result.items.map(r => r.id)).toEqual([`w:${uuid(31)}`, `w:${uuid(30)}`, `p:${uuid(22)}`, `p:${uuid(21)}`, `p:${uuid(20)}`]);
    expect(result.items[1]).toMatchObject({ spender: { memberId: childId, name: 'child', isMe: false }, author: { memberId: viewerId, name: 'viewer', isMe: true },
        place: { kind: 'wallet', walletKind: 'child', walletName: 'child wallet', walletId: uuid(8) } });
    expect(result.items[4]).toMatchObject({ spender: { memberId: viewerId }, author: { memberId: viewerId }, place: { kind: 'account', bankName: 'viewer bank', accountName: 'Main' } });
    expect(result.hiddenChildRows).toBe(false); expect(result.nextCursor).toBeNull();
    expect(reads.filter(r => r.table === 'banks').map(r => r.params)).toEqual([['viewer', false], ['adult', false], ['child', false]]);
});
test('non-guardian never reads child banks or returns child-wallet rows; hidden flag ignores pagination', async () => {
    const { caller, reads } = setup('adult');
    const result = await caller.familyTransactions({ month: '2026-11', limit: 1 });
    expect(result.hiddenChildRows).toBe(true);
    expect(result.items).toHaveLength(1);
    const next = await caller.familyTransactions({ month: '2026-11', cursor: result.nextCursor! });
    expect(next.hiddenChildRows).toBe(true);
    expect([...result.items, ...next.items].some(r => r.spender?.memberId === childId)).toBe(false);
    expect(reads.filter(r => r.table === 'banks').some(r => r.params[0] === 'child')).toBe(false);
    const child = await caller.familyTransactions({ month: '2026-11', memberId: childId });
    expect(child).toEqual({ items: [], nextCursor: null, hiddenChildRows: true });
});
test('guardian reads child ledger; child caller is forbidden before financial reads', async () => {
    expect((await setup('adult', true).caller.familyTransactions({ month: '2026-11', memberId: childId })).items).toHaveLength(2);
    const { caller, reads } = setup('child');
    await expect(caller.familyTransactions({ month: '2026-11' })).rejects.toMatchObject({ code: 'FORBIDDEN' });
    expect(reads).toEqual([]);
});
test('member, uncategorized and day filters apply to rows and hidden existence', async () => {
    const { caller } = setup('adult');
    const adult = await caller.familyTransactions({ month: '2026-11', memberId: adultId, categoryId, date: '2026-11-15' });
    expect(adult.items).toHaveLength(2); expect(adult.hiddenChildRows).toBe(false);
    for (const filter of [{ categoryId: 'none' }, { date: '2026-11-14' }]) {
        expect(await caller.familyTransactions({ month: '2026-11', ...filter })).toEqual({ items: [], nextCursor: null, hiddenChildRows: false });
    }
});
test('keyset cursor preserves microseconds and source/id tie order across pages', async () => {
    const { caller, personal, wallets, tx } = setup();
    personal.splice(0, personal.length, ...Array.from({ length: 53 }, (_, i) => tx(100 + i, 'viewer', { cursorCreatedAt: i % 2 ? '2026-11-15T12:00:00.123455Z' : '2026-11-15T12:00:00.123456Z' })));
    wallets.splice(0, wallets.length, { ...wallets[1], transaction: { ...tx(100, 'viewer'), createdByUserId: 'viewer' } });
    const items: string[] = []; let cursor: string | undefined;
    do {
        const page = await caller.familyTransactions({ month: '2026-11', limit: 7, cursor });
        items.push(...page.items.map(i => i.id)); cursor = page.nextCursor ?? undefined;
    } while (cursor);
    expect(items).toHaveLength(54); expect(new Set(items).size).toBe(54); expect(items[0]).toBe(`w:${uuid(100)}`);
});
test('invalid cursors, filters and limit over 50 are rejected', async () => {
    for (const input of [{ cursor: 'invalid' }, { limit: 51 }, { limit: 0 }, { date: '2026-02-30' }, { memberId: 'child' }, { categoryId: 'food' }]) {
        await expect(setup().caller.familyTransactions({ month: '2026-11', ...input })).rejects.toMatchObject({ code: 'BAD_REQUEST' });
    }
});
