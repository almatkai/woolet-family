import { afterEach, beforeEach, describe, expect, mock, setSystemTime, spyOn, test } from 'bun:test';
import { PgDialect } from 'drizzle-orm/pg-core';
import { dashboardRouter } from '../../src/routers/dashboard';
import { currencyExchangeService } from '../../src/services/currency-exchange-service';
import { cache } from '../../src/lib/redis';
import { createMockContext } from '../utils';

const dialect = new PgDialect();
let ratesSpy: ReturnType<typeof spyOn>;
let cacheSpy: ReturnType<typeof spyOn>;
beforeEach(() => {
    setSystemTime(new Date(2026, 1, 15, 12));
    ratesSpy = spyOn(currencyExchangeService, 'getExchangeRates').mockResolvedValue({ USD: 1, KZT: 500, EUR: 0.8 });
    cacheSpy = spyOn(cache, 'get').mockResolvedValue(null);
});
afterEach(() => { ratesSpy.mockRestore(); cacheSpy.mockRestore(); setSystemTime(); });

function transaction(id: string, type: string, amount: string, currencyCode: string, date = '2026-02-10', extra = {}) {
    return {
        id, type, amount, date, currencyBalanceId: `balance-${currencyCode}`,
        currencyBalance: { currencyCode }, categoryId: 'food',
        category: { name: 'Food', icon: '🍔', color: '#fff', type },
        parentTransactionId: null, lifecycleStatus: 'active', excludeFromMonthlyStats: false,
        childTransactions: [], ...extra,
    };
}
function setup({ preferred = 'USD', userCurrency = 'USD', empty = false, rows = [
    transaction('usd-expense', 'expense', '3000', 'USD'),
    transaction('kzt-expense', 'expense', '4200', 'KZT'),
    transaction('usd-income', 'income', '1000', 'USD'),
    transaction('kzt-income', 'income', '50000', 'KZT'),
    transaction('previous-usd', 'expense', '1000', 'USD', '2026-01-15'),
    transaction('previous-kzt', 'expense', '500000', 'KZT', '2026-01-31'),
    transaction('previous-income', 'income', '250000', 'KZT', '2026-01-31'),
] }: { preferred?: string | null; userCurrency?: string; empty?: boolean; rows?: ReturnType<typeof transaction>[] } = {}) {
    const reads: { sql: string; params: unknown[] }[] = [];
    const findTransactions = mock(async ({ where, limit }: any) => {
        const query = dialect.sqlToQuery(where); reads.push(query);
        expect(limit).toBeUndefined();
        const dates = query.params.filter((value): value is string => typeof value === 'string' && /^\d{4}-/.test(value));
        return rows.filter(row => query.params.includes(row.currencyBalanceId) && row.date >= dates[0] && row.date <= dates[1] && row.lifecycleStatus === 'active' && !row.excludeFromMonthlyStats);
    });
    const findBanks = mock(async ({ where }: any) => {
        expect(dialect.sqlToQuery(where).params).toEqual(['test-user-id', false]);
        return empty ? [] : [{ name: 'Bank', accounts: [
            { id: 'mixed', name: 'Mixed account', currencyBalances: [
                { id: 'balance-KZT', currencyCode: 'KZT', balance: '50000' },
                { id: 'balance-USD', currencyCode: 'USD', balance: '200' },
            ] },
            { id: 'usd', name: 'USD account', currencyBalances: [{ id: 'other-usd', currencyCode: 'USD', balance: '400' }] },
        ] }];
    });
    const ctx = createMockContext({ db: { query: {
        users: { findFirst: async () => ({ id: 'test-user-id', defaultCurrency: userCurrency, testMode: false }) },
        userSettings: { findFirst: async () => preferred ? { defaultCurrency: preferred } : null },
        banks: { findMany: findBanks }, transactions: { findMany: findTransactions },
    } } as any });
    return { caller: dashboardRouter.createCaller(ctx), reads, findTransactions };
}

describe('Personal dashboard currency conversion', () => {
    test('converts current and previous months and daily series, retaining recent receipt currency', async () => {
        const result = await setup().caller.getSummary();
        expect(result.currency).toBe('USD');
        expect(result.monthlyExpenses.total).toBeCloseTo(3008.4);
        expect(result.monthlyExpenses.previousTotal).toBe(2000);
        expect(result.monthlyIncome.total).toBe(1100);
        expect(result.monthlyIncome.previousTotal).toBe(500);
        expect(result.monthlyExpenses.count).toBe(2);
        expect(result.monthlyExpenses.chartData.find((day: any) => day.date === '2026-02-10').amount).toBeCloseTo(3008.4);
        expect(result.monthlyExpenses.recent.find((row: any) => row.id === 'kzt-expense')).toMatchObject({ amount: 4200, currency: 'KZT' });
        expect(ratesSpy).toHaveBeenCalledTimes(1);
    });
    test('converts all account balances before sorting and summing', async () => {
        const result = await setup().caller.getSummary();
        expect(result.totalBalance).toBe(700);
        expect(result.totalBalances).toEqual({ KZT: 50000, USD: 600 });
        expect(result.accountCount).toBe(2);
        expect(result.accounts.map((account: any) => [account.accountId, account.totalBalance])).toEqual([['usd', 400], ['mixed', 300]]);
    });
    test('uses settings preference even without a balance in that currency', async () => {
        const result = await setup({ preferred: 'EUR' }).caller.getSummary();
        expect(result.currency).toBe('EUR');
        expect(result.totalBalance).toBeCloseTo(560);
        expect(result.monthlyIncome.total).toBeCloseTo(880);
        expect(result.monthlyExpenses.total).toBeCloseTo(2406.72);
    });
    test('falls back to the user currency without settings', async () => {
        const result = await setup({ preferred: null, userCurrency: 'KZT' }).caller.getSummary();
        expect(result.currency).toBe('KZT');
        expect(result.totalBalance).toBe(350000);
        expect(result.monthlyExpenses.total).toBe(1504200);
    });
    test('includes over 100 transactions and excludes transfers, paybacks, deleted, excluded and future rows', async () => {
        const rows = Array.from({ length: 120 }, (_, i) => transaction(`kzt-${i}`, 'expense', '500', 'KZT'));
        rows.push(
            transaction('transfer', 'transfer', '1000000', 'USD'),
            transaction('payback', 'income', '500', 'KZT', undefined, { parentTransactionId: 'kzt-0' }),
            transaction('deleted', 'expense', '999999', 'USD', undefined, { lifecycleStatus: 'deleting' }),
            transaction('excluded', 'expense', '999999', 'USD', undefined, { excludeFromMonthlyStats: true }),
            transaction('future', 'expense', '999999', 'USD', '2026-02-16'),
            transaction('other-user', 'expense', '999999', 'USD', undefined, { currencyBalanceId: 'foreign-balance' }),
        );
        const { caller, reads } = setup({ rows });
        const result = await caller.getSummary();
        expect(result.monthlyExpenses.total).toBe(120);
        expect(result.monthlyExpenses.count).toBe(120);
        expect(result.monthlyIncome.total).toBe(0);
        expect(reads[0].sql).toContain('"lifecycle_status" =');
        expect(reads[0].params).toContain('active');
        expect(reads[0].sql).toContain('"exclude_from_monthly_stats" =');
    });
    test('returns zero in the preferred currency without accounts', async () => {
        const { caller, findTransactions } = setup({ preferred: 'KZT', empty: true });
        const result = await caller.getSummary();
        expect(result.currency).toBe('KZT'); expect(result.totalBalance).toBe(0);
        expect(result.accounts).toEqual([]); expect(result.monthlyExpenses.total).toBe(0);
        expect(findTransactions).not.toHaveBeenCalled();
        expect(ratesSpy).not.toHaveBeenCalled();
    });
    test('converts category spending and cross-currency paybacks without changing gross monthly totals', async () => {
        const result = await setup({ rows: [
            transaction('usd', 'expense', '100', 'USD', undefined, {
                childTransactions: [{ amount: '5000', currencyBalance: { currencyCode: 'KZT' } }],
            }),
            transaction('kzt', 'expense', '5000', 'KZT'),
        ] }).caller.getSummary();
        expect(result.monthlyExpenses.total).toBe(110);
        expect(result.categoryTotal).toBe(100);
        expect(result.categoryData).toEqual([{ id: 'food', name: 'Food', color: '#fff', value: 100 }]);
    });
    test('uses December as the previous month in January', async () => {
        setSystemTime(new Date(2026, 0, 15, 12));
        const result = await setup({ rows: [
            transaction('current', 'expense', '5000', 'KZT', '2026-01-15'),
            transaction('previous', 'expense', '2500', 'KZT', '2025-12-31'),
        ] }).caller.getSummary();
        expect(result.monthlyExpenses.total).toBe(10);
        expect(result.monthlyExpenses.previousTotal).toBe(5);
        expect(result.monthlyExpenses.chartData).toHaveLength(15);
        expect(result.monthlyExpenses.chartData.at(-1)).toEqual({ date: '2026-01-15', amount: 10 });
    });
    test.each([0, -1, NaN, Infinity])('rejects an invalid KZT rate (%s)', async rate => {
        ratesSpy.mockResolvedValue({ USD: 1, KZT: rate });
        await expect(setup().caller.getSummary()).rejects.toThrow(/exchange rate/i);
    });
    test('rejects missing exchange rates instead of adding raw amounts', async () => {
        ratesSpy.mockResolvedValue({ USD: 1 });
        await expect(setup().caller.getSummary()).rejects.toThrow(/exchange rate/i);
    });
    test('separates cached summaries by currency and from the old raw-sum format', async () => {
        await setup().caller.getSummary(); const usdKey = cacheSpy.mock.calls.at(-1)![0];
        await setup({ preferred: 'KZT' }).caller.getSummary(); const kztKey = cacheSpy.mock.calls.at(-1)![0];
        expect(usdKey).not.toBe(kztKey); expect(usdKey).not.toBe('dashboard:test-user-id:live');
    });
});
