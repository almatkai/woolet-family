import { afterEach, expect, spyOn, test } from 'bun:test';
import { PgDialect } from 'drizzle-orm/pg-core';
import { householdRouter } from '../../src/routers/household';
import { currencyExchangeService } from '../../src/services/currency-exchange-service';
import { familyWalletTransactions, householdBudgets, householdMembers } from '../../src/db/schema';
import { createMockContext } from '../utils';

const home = '11111111-1111-4111-8111-111111111111';
const categoryId = '22222222-2222-4222-8222-222222222222';
const dialect = new PgDialect();
let ratesSpy: ReturnType<typeof spyOn>;
afterEach(() => ratesSpy?.mockRestore());
function setup({ role = 'owner', guardian = false, rates = { USD: 1, EUR: 2 }, empty = false }: { role?: string; guardian?: boolean; rates?: Record<string, number>; empty?: boolean } = {}) {
    const member = (id: string, role: string) => ({ id, householdId: home, userId: id, role, isGuardian: id === 'viewer' && guardian, status: 'active', showBalanceToChildren: false });
    const viewer = member('viewer', role);
    const adult = member('adult', 'adult'); const child = member('child', 'child');
    const all = [viewer, adult, child].map(m => ({ member: m, name: m.id === 'adult' ? '  ' : m.id, email: `${m.id}@example.com` }));
    const reads: { table: string; sql: string; params: any[] }[] = [];
    const record = (table: string, where: any) => { const query = dialect.sqlToQuery(where); reads.push({ table, ...query }); return query; };
    const tx = (id: string, balance: string, amount: string, currencyCode = 'USD', date = '2026-02-12', type = 'expense', extra: any = {}) => ({
        id, currencyBalanceId: balance, amount, fee: '10.00', currencyBalance: { currencyCode }, categoryId, category: { name: 'Food' }, date, type, lifecycleStatus: 'active', excludeFromMonthlyStats: false, ...extra,
    });
    const personal = empty ? [] : [tx('viewer-tx', 'viewer-b', '10.00'), tx('adult-tx', 'adult-b', '20.00', 'EUR'), tx('child-tx', 'child-b', '30.00'),
        tx('test-tx', 'test-b', '999.00'), tx('previous', 'adult-b', '6.00', 'EUR', '2026-01-12'), tx('outside', 'adult-b', '999.00', 'USD', '2025-12-31'),
        tx('deleted', 'adult-b', '999.00', 'USD', undefined, undefined, { lifecycleStatus: 'deleting' }),
        tx('excluded', 'adult-b', '999.00', 'USD', undefined, undefined, { excludeFromMonthlyStats: true }),
        tx('transfer', 'viewer-b', '100.00', 'USD', undefined, 'transfer')];
    const w = { id: 'wallet', householdId: home, kind: 'child', childMemberId: 'child', currencyCode: 'USD', archivedAt: null };
    const wallets = empty ? [] : [
        { wallet: w, transaction: { id: 'viewer-tx', type: 'expense', amount: '5.00', date: '2026-02-12', categoryId, createdByUserId: 'viewer' }, categoryName: 'Food' },
        ...['transfer_in', 'transfer_out'].map(type => ({ wallet: w, transaction: { id: type, type, amount: '50.00', date: '2026-02-12', categoryId: null, createdByUserId: 'viewer' }, categoryName: null })),
    ];
    const db: any = {
        query: {
            users: { findFirst: async () => ({ defaultCurrency: 'USD' }) },
            banks: { findMany: async ({ where }: any) => {
                const { params } = record('banks', where); expect(params[1]).toBe(false);
                if (empty) return [];
                return [{ accounts: [{ currencyBalances: [{ id: `${params[0]}-b`, currencyCode: params[0] === 'adult' ? 'EUR' : 'USD', balance: '100.00' }] }] }];
            } },
            transactions: { findMany: async ({ where }: any) => {
                const { params, sql } = record('transactions', where);
                expect(sql).toContain('"date" >='); expect(sql).toContain('"date" <=');
                expect(params).toContain('active'); expect(params).toContain(false);
                const dates = params.filter((p): p is string => typeof p === 'string' && /^\d{4}-/.test(p));
                return personal.filter(t => params.includes(t.currencyBalanceId) && t.date >= dates[0] && t.date <= dates[1] && t.lifecycleStatus === 'active' && !t.excludeFromMonthlyStats);
            } },
        },
        select: (fields: any) => ({ from: (table: any) => {
            let where: any;
            const value = () => {
                if (fields?.membership) return [{ membership: viewer, household: { ownerUserId: 'owner' } }];
                if (table === householdMembers) { record('members', where); return all; }
                if (table === familyWalletTransactions) { const q = record('wallets', where); expect(q.params).toEqual([home, '2026-01-01', '2026-02-28']); return wallets; }
                if (table === householdBudgets) return [{ budget: { categoryId: null, currencyCode: 'USD', amount: '100.00' }, categoryName: null }, { budget: { categoryId, currencyCode: 'USD', amount: '50.00' }, categoryName: 'Food' }];
                throw Error('Unexpected table');
            };
            const chain: any = { innerJoin: () => chain, leftJoin: () => chain, where: (w: any) => { where = w; return chain; }, limit: async () => value(), then: (resolve: any, reject: any) => Promise.resolve().then(value).then(resolve, reject) }; return chain;
        } }),
    };
    ratesSpy = spyOn(currencyExchangeService, 'getExchangeRates').mockResolvedValue(rates);
    const caller = householdRouter.createCaller(createMockContext({ userId: 'viewer', user: { testMode: true } as any, db }));
    return { caller, reads, personal, wallets, all };
}
test('adults see live personal money, transfer-free child wallet totals, budgets and previous month', async () => {
    const { caller, reads } = setup();
    const result = await caller.overview({ month: '2026-02' });
    expect(result.baseCurrency).toBe('USD');
    expect(result.byCurrency.currencies).toEqual([
        { currencyCode: 'EUR', income: '0.00', expense: '20.00', budget: null, remaining: null },
        { currencyCode: 'USD', income: '0.00', expense: '45.00', budget: '100.00', remaining: '55.00' },
    ]);
    expect(result.converted.currencies[0]).toMatchObject({ expense: '55.00', remaining: '45.00' });
    expect(result.previousMonthExpense).toBe('3.00');
    expect(result.categoryBudgets).toEqual([{ categoryId, categoryName: 'Food', amount: '50.00', spent: '55.00' }]);
    expect(result.members.find(m => m.memberId === 'adult')).toMatchObject({ name: 'adult', netWorth: '50.00', spent: '10.00', transactionsCount: 1 });
    expect(result.members.find(m => m.memberId === 'child')).toMatchObject({ spent: '35.00', transactionsCount: 4 });
    expect(reads.filter(r => r.table === 'banks').map(r => r.params)).toEqual([['viewer', false], ['adult', false], ['child', false]]);
    expect(ratesSpy).toHaveBeenCalledTimes(1); expect(ratesSpy).toHaveBeenCalledWith('USD');
});
test('non-guardian adult excludes child personal banks but includes child wallet expense', async () => {
    const { caller, reads } = setup({ role: 'adult' });
    const result = await caller.overview({ month: '2026-02' });
    expect(result.members.map(m => m.memberId)).toEqual(['viewer', 'adult']);
    expect(result.converted.currencies[0].expense).toBe('25.00');
    expect(reads.filter(r => r.table === 'banks')).toHaveLength(2);
    expect(result.converted.members.find(m => m.memberId === 'child')?.totals[0].amount).toBe('5.00');
    // The child is labelled by name, not as a former member, even without guardian access.
    expect(result.converted.members.find(m => m.memberId === 'child')).toMatchObject({ name: 'child', status: 'active' });
});
test('guardian adult sees child banks', async () => {
    expect((await setup({ role: 'adult', guardian: true }).caller.overview({ month: '2026-02' })).members).toHaveLength(3);
});
test('child overview is forbidden before rate or financial reads', async () => {
    const { caller, reads } = setup({ role: 'child' });
    await expect(caller.overview({ month: '2026-02' })).rejects.toMatchObject({ code: 'FORBIDDEN' });
    expect(reads).toHaveLength(0); expect(ratesSpy).not.toHaveBeenCalled();
});
test('missing rates retain raw currency and omit converted amounts', async () => {
    const result = await setup({ rates: { USD: 1 } }).caller.overview({ month: '2026-02' });
    expect(result.unconvertedCurrencies).toEqual(['EUR']);
    expect(result.converted.currencies[0].expense).toBe('45.00');
    expect(result.previousMonthExpense).toBe('0.00');
    expect(result.members.find(m => m.memberId === 'adult')?.netWorth).toBe('0.00');
});
test('conversion rounds each row, including rows that round to zero', async () => {
    const { caller, personal } = setup();
    personal.find(t => t.id === 'adult-tx')!.amount = '0.01';
    personal.push({ ...personal.find(t => t.id === 'adult-tx')!, id: 'tiny', amount: '0.01' });
    const result = await caller.overview({ month: '2026-02' });
    expect(result.converted.currencies[0].expense).toBe('45.02');
    ratesSpy.mockResolvedValue({ USD: 1, EUR: 100 });
    expect((await caller.overview({ month: '2026-02' })).converted.currencies[0].expense).toBe('45.00');
});
test('empty overview has a single base currency', async () => {
    expect((await setup({ empty: true }).caller.overview({ month: '2026-02' })).converted.currencies).toHaveLength(1);
});
for (const month of ['2026-00', '2026-13', '2026-2', 'invalid']) test(`reject invalid month ${month}`, async () => {
    await expect(setup().caller.overview({ month })).rejects.toMatchObject({ code: 'BAD_REQUEST' });
});
