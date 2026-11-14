import { PgDialect } from 'drizzle-orm/pg-core';
import { test, expect } from 'bun:test';
import { householdRouter } from '../../src/routers/household';
import { createMockContext } from '../utils';
const id = '11111111-1111-4111-8111-111111111111';
function caller(results: any[][], predicates: any[] = []) {
 const db: any = { select: () => { const rows = results.shift() ?? []; const chain: any = {}; for (const k of ['from','where','leftJoin','innerJoin','orderBy','groupBy','limit']) chain[k] = (...args: any[]) => { if (k === 'where') predicates.push(args[0]); return chain; }; chain.then = (a: any,b: any) => Promise.resolve(rows).then(a,b); return chain; } };
 return householdRouter.createCaller(createMockContext({ userId: 'user', db }));
}
const m = { membership: { id, householdId: id, role: 'child' }, household: { childrenCanSeeSharedWallets: false } };
const w = { id, householdId: id, kind: 'child', childMemberId: id, archivedAt: null, name: 'Mine', balance: '1', currencyCode: 'USD' };
test('child only receives own wallet', async () => {
 const r = await caller([[m], [{ wallet: w, childName: 'Kid' }, { wallet: { ...w, childMemberId: 'sibling' } }], [], []]).wallets({});
 expect(r.wallets).toHaveLength(1); expect(r.sharedWalletsVisible).toEqual([]);
});
test('sibling transactions are inaccessible', async () => {
 await expect(caller([[m], [{ ...w, childMemberId: 'sibling' }]]).walletTransactions({ walletId: id })).rejects.toMatchObject({ code: 'NOT_FOUND' });
});
test('limits clamp remaining and exclude transfers from category spending', async () => {
 const r = await caller([[m], [w], [{ limit: { id, categoryId: id, period: 'monthly', amount: '5' }, categoryName: 'Food' }], [
 { date: '2026-11-02', type: 'expense', categoryId: id, amount: '6' },
 { date: '2026-11-02', type: 'transfer_out', categoryId: id, amount: '4' },
 { date: '2026-11-02', type: 'expense', categoryId: null, amount: '3' },
 ]]).limits({ walletId: id, today: '2026-11-15' });
 expect(r[0]).toMatchObject({ spent: '6.00', remaining: '0.00' });
});

const shared = { ...w, id: '22222222-2222-4222-8222-222222222222', kind: 'shared', childMemberId: null, name: 'Shared' };
const adult = (isGuardian = false) => ({ ...m, membership: { ...m.membership, role: 'adult', isGuardian }, household: { childrenCanSeeSharedWallets: true } });
test('child wallet permissions allow writing but not management or deletion', async () => {
 const r = await caller([[m], [{ wallet: w }], [], []]).wallets({});
 expect(r.wallets[0]).toMatchObject({ canWrite: true, canManage: false, canDeleteTransactions: false, limitSummary: null });
});
test('shared visibility disabled hides shared wallets', async () => {
 expect((await caller([[m], [{ wallet: shared }], []]).wallets({})).sharedWalletsVisible).toEqual([]);
});
test('shared visibility enabled exposes exactly the safe fields', async () => {
 const r = await caller([[{ ...m, household: { childrenCanSeeSharedWallets: true } }], [{ wallet: shared }], []]).wallets({});
 expect(r.sharedWalletsVisible).toEqual([{ id: shared.id, name: 'Shared', currencyCode: 'USD', balance: '1.00' }]);
 expect(Object.keys(r.sharedWalletsVisible[0]!).sort()).toEqual(['balance', 'currencyCode', 'id', 'name']);
});
test('non guardian adult sees shared wallets without child visibility projections', async () => {
 const r = await caller([[adult()], [{ wallet: w }, { wallet: shared }]]).wallets({});
 expect(r.wallets.map(v => v.id)).toEqual([shared.id]);
 expect(r.sharedWalletsVisible).toEqual([]); expect(r.adultBalances).toEqual([]);
});
test('guardian adult can manage child wallets', async () => {
 const r = await caller([[adult(true)], [{ wallet: w }], []]).wallets({});
 expect(r.wallets[0]).toMatchObject({ canManage: true });
 expect(r.sharedWalletsVisible).toEqual([]); expect(r.adultBalances).toEqual([]);
});
test('limit summary selects smaller remaining across weekly and monthly totals', async () => {
 const r = await caller([[m], [{ wallet: w }], [
 { id, walletId: id, period: 'weekly', amount: '10' },
 { id: shared.id, walletId: id, period: 'monthly', amount: '20' },
 ], [{ walletId: id, spent: '3' }], [{ walletId: id, spent: '18' }], []]).wallets({ today: '2026-11-15' });
 expect(r.wallets[0]!.limitSummary).toMatchObject({ period: 'monthly', remaining: '2.00' });
});
test('limit summary remaining clamps to zero', async () => {
 const r = await caller([[m], [{ wallet: w }], [{ id, walletId: id, period: 'weekly', amount: '1' }], [{ walletId: id, spent: '2' }], []]).wallets({ today: '2026-11-15' });
 expect(r.wallets[0]!.limitSummary?.remaining).toBe('0.00');
});
test('foreign household transactions are inaccessible', async () => {
 await expect(caller([[m], [{ ...w, householdId: shared.id }]]).walletTransactions({ walletId: id })).rejects.toMatchObject({ code: 'NOT_FOUND' });
});
const transaction = { id, walletId: id, type: 'transfer_out', amount: '0.10', date: '2026-11-15', createdAt: new Date('2026-11-15T00:00:00Z'), transferGroupId: id, categoryId: null, description: null };
test('child cannot see shared transfer counterpart name', async () => {
 const r = await caller([[m], [w], [{ transaction }], [{ transaction, wallet: shared }]]).walletTransactions({ walletId: id });
 expect(r.items[0]!.counterpartWalletName).toBeNull();
});
test('child sees shared counterpart name when the owner allows shared wallets', async () => {
 const r = await caller([[{ ...m, household: { childrenCanSeeSharedWallets: true } }], [w], [{ transaction }], [{ transaction, wallet: shared }]]).walletTransactions({ walletId: id });
 expect(r.items[0]!.counterpartWalletName).toBe('Shared');
});
test('adult sees shared transfer counterpart name', async () => {
 const r = await caller([[adult(true)], [w], [{ transaction }], [{ transaction, wallet: shared }]]).walletTransactions({ walletId: id });
 expect(r.items[0]!.counterpartWalletName).toBe('Shared');
});
test('pagination returns cursor for the last included transaction', async () => {
 const t = { ...transaction, transferGroupId: null };
 const r = await caller([[m], [w], [{ transaction: t }, { transaction: { ...t, id: shared.id } }]]).walletTransactions({ walletId: id, limit: 1 });
 expect(r.items).toHaveLength(1);
 expect(JSON.parse(Buffer.from(r.nextCursor!, 'base64').toString())).toEqual({ id, date: t.date, createdAt: t.createdAt.toISOString() });
});
test('invalid transaction cursor is rejected', async () => {
 await expect(caller([[m], [w]]).walletTransactions({ walletId: id, cursor: 'bad' })).rejects.toMatchObject({ code: 'BAD_REQUEST' });
});
test('summary adds income and transfer in and expense and transfer out in cents', async () => {
 const rows = ['income', 'transfer_in', 'expense', 'transfer_out'].map((type, i) => ({ type, amount: i % 2 ? '0.20' : '0.10' }));
 const r = await caller([[m], [w], rows]).walletSummary({ walletId: id, today: '2026-11-15' });
 expect(r).toMatchObject({ monthIncome: '0.30', monthOutflow: '0.30' });
});
test('shared wallet has no limits', async () => {
 expect(await caller([[adult()], [shared]]).limits({ walletId: shared.id })).toEqual([]);
});
test('total limit counts expenses and outgoing transfers and clamps remaining', async () => {
 const r = await caller([[m], [w], [{ limit: { id, categoryId: null, period: 'monthly', amount: '0.25' } }], [
 { date: '2026-11-15', type: 'expense', amount: '0.10' },
 { date: '2026-11-15', type: 'transfer_out', amount: '0.20' },
 ]]).limits({ walletId: id, today: '2026-11-15' });
 expect(r[0]).toMatchObject({ spent: '0.30', remaining: '0.00' });
});

test('adult balances restrict opt in adults and non test banks and return currency totals', async () => {
 const predicates: any[] = [];
 const r = await caller([[m], [], [{ memberId: id, userId: 'adult-user', name: 'Parent', email: 'parent@example.com' }], [
 { userId: 'adult-user', currencyCode: 'USD', amount: '0.30' },
 { userId: 'adult-user', currencyCode: 'EUR', amount: '2.50' },
 ]], predicates).wallets({});
 expect(r.adultBalances).toEqual([{ memberId: id, name: 'Parent', totals: [{ currencyCode: 'USD', amount: '0.30' }, { currencyCode: 'EUR', amount: '2.50' }] }]);
 const dialect = new PgDialect();
 const adults = dialect.sqlToQuery(predicates[2]);
 expect(adults.sql).toContain('"show_balance_to_children" =');
 expect(adults.params).toEqual([id, 'active', 'owner', 'adult', true]);
 const totals = dialect.sqlToQuery(predicates[3]);
 expect(totals.sql).toContain('"is_test" =');
 expect(totals.params).toEqual(['adult-user', false]);
});
