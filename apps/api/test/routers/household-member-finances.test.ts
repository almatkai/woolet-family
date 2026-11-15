import { afterEach, expect, spyOn, test } from 'bun:test';
import { PgDialect } from 'drizzle-orm/pg-core';
import { householdRouter } from '../../src/routers/household';
import { currencyExchangeService } from '../../src/services/currency-exchange-service';
import { createMockContext } from '../utils';

const home = '11111111-1111-4111-8111-111111111111';
const viewerId = '22222222-2222-4222-8222-222222222222';
const targetId = '33333333-3333-4333-8333-333333333333';
const dialect = new PgDialect();
let ratesSpy: ReturnType<typeof spyOn>;
afterEach(() => ratesSpy?.mockRestore());
function setup({ viewerRole = 'adult', targetRole = 'adult', guardian = false, foreign = false, self = false, inactive = false, absent = false, empty = false }: {
    viewerRole?: string; targetRole?: string; guardian?: boolean; foreign?: boolean; self?: boolean; inactive?: boolean; absent?: boolean; empty?: boolean;
} = {}) {
    const viewer = { id: viewerId, householdId: home, userId: 'viewer-user', role: viewerRole, isGuardian: guardian, status: 'active' };
    const target = { ...viewer, id: self ? viewerId : targetId, userId: self ? 'viewer-user' : 'target-user', role: targetRole, householdId: foreign ? 'foreign-home' : home, status: inactive ? 'removed' : 'active' };
    const reads: { table: string; sql: string; params: unknown[] }[] = [];
    const record = (table: string, where: any) => { const q = dialect.sqlToQuery(where); reads.push({ table, ...q }); return q; };
    const allTransactions = Array.from({ length: 52 }, (_, i) => ({
        id: `00000000-0000-4000-8000-${String(52-i).padStart(12, '0')}`, date: '2026-02-12', createdAt: new Date('2026-02-12T12:00:00.123Z'), cursorCreatedAt: '2026-02-12T12:00:00.123456Z',
        type: 'expense', amount: 12.34, currencyBalance: { currencyCode: 'EUR', account: { name: 'Main' } }, category: { name: 'Food', icon: 'food' }, description: null,
    }));
    const db: any = {
        select: () => { const chain: any = { from: () => chain, innerJoin: () => chain, where: () => chain, limit: async () => [{ membership: viewer, household: { ownerUserId: 'owner-user' } }] }; return chain; },
        query: {
            householdMembers: { findFirst: async ({ where }: any) => { expect(record('target', where).params).toEqual([target.id, home, 'active']); return absent ? null : target; } },
            users: { findFirst: async ({ where, columns }: any) => {
                if (!columns) return { id: viewer.userId, email: 'viewer@example.com', defaultCurrency: 'EUR', testMode: true };
                const q = record('user', where);
                if (q.params[0] === 'owner-user') { expect(columns).toEqual({ defaultCurrency: true }); return { defaultCurrency: 'USD' }; }
                expect(q.params).toEqual([target.userId]); expect(columns).toEqual({ name: true, email: true });
                return { name: ' ', email: 'target@example.com', paddleCustomerId: 'secret' };
            } },
            banks: { findMany: async ({ where }: any) => {
                expect(record('banks', where).params).toEqual([target.userId, false]);
                return empty ? [] : [{ name: 'Bank', icon: null, accounts: [{ id: 'account', name: 'Main', type: 'card', last4Digits: '1234', currencyBalances: [{ id: 'balance', balance: 100, currencyCode: 'EUR' }] }] }];
            } },
            transactions: { findMany: async ({ where, orderBy, limit }: any) => {
                const q = record('transactions', where); expect(q.params.slice(0, 2)).toEqual(['balance', 'active']); expect(limit).toBe(51);
                expect(orderBy.map((o: any) => dialect.sqlToQuery(o).sql)).toEqual(['"transactions"."date" desc', '"transactions"."created_at" desc', '"transactions"."id" desc']);
                if (q.params.length === 2) return allTransactions.slice(0, limit);
                expect(q.sql).toContain(' or '); expect(q.sql).toContain('"created_at" <'); expect(q.sql).toContain('"id" <');
                expect(q.params.slice(2, 7)).toEqual(['2026-02-12', '2026-02-12', '2026-02-12T12:00:00.123456Z', '2026-02-12', '2026-02-12T12:00:00.123456Z']);
                return allTransactions.filter(t => t.id < (q.params.at(-1) as string)).slice(0, limit);
            } },
            subscriptions: { findMany: async ({ where }: any) => {
                expect(record('subscriptions', where).params).toEqual([target.userId, 'active']);
                return [{ name: 'Phone', amount: 10, currency: 'USD', frequency: 'monthly', startDate: '2020-01-01', endDate: null, billingDay: 15, userId: target.userId, description: 'not returned' }];
            } },
            debts: { findMany: async ({ where }: any) => {
                expect(record('debts', where).params).toEqual([target.userId, false, 'active']);
                return [{ amount: 100, paidAmount: 40, type: 'i_owe', currencyCode: 'USD', currencyBalance: null },
                    { amount: '50.00', paidAmount: '10.00', type: 'they_owe', currencyBalance: { currencyCode: 'EUR' } },
                    { amount: '5.00', paidAmount: '10.00', type: 'they_owe', currencyCode: 'USD', currencyBalance: null }];
            } },
            credits: { findMany: async ({ where }: any) => { expect(record('credits', where).params).toEqual(['account']); return [{ name: 'Loan', remainingBalance: 300, monthlyPayment: 10, currency: 'USD' }]; } },
            mortgages: { findMany: async ({ where }: any) => { expect(record('mortgages', where).params).toEqual(['account']); return [{ propertyName: 'Home', remainingBalance: 1000, monthlyPayment: 100, currency: 'USD' }]; } },
            deposits: { findMany: async ({ where }: any) => { expect(record('deposits', where).params).toEqual(['account']); return [{ depositName: 'Savings', currentBalance: 500, currency: 'USD' }]; } },
        },
    };
    ratesSpy = spyOn(currencyExchangeService, 'getExchangeRates').mockResolvedValue({ USD: 1, EUR: 2 });
    return { caller: householdRouter.createCaller(createMockContext({ userId: viewer.userId, user: { testMode: true } as any, db })), reads, memberId: target.id };
}
test('adult reads another adult with scoped, non-test data and curated fields', async () => {
    const { caller, memberId } = setup();
    const result = await caller.memberFinances({ memberId });
    expect(result.member).toEqual({ memberId, name: 'target', role: 'adult', isMe: false });
    expect(result.baseCurrency).toBe('USD'); expect(result.netWorth).toBe('50.00');
    expect(result.accounts).toEqual([{ bankName: 'Bank', bankIcon: null, accountName: 'Main', type: 'card', last4: '1234', balances: [{ currencyCode: 'EUR', balance: '100.00' }] }]);
    expect(result.transactions.items[0]).toEqual({ id: '00000000-0000-4000-8000-000000000052', date: '2026-02-12', type: 'expense', amount: '12.34', currencyCode: 'EUR', categoryName: 'Food', categoryIcon: 'food', description: null, accountName: 'Main' });
    expect(result.liabilities).toEqual({ debts: [{ currencyCode: 'EUR', iOwe: '0.00', theyOwe: '40.00' }, { currencyCode: 'USD', iOwe: '60.00', theyOwe: '0.00' }],
        credits: [{ name: 'Loan', remaining: '300.00', monthlyPayment: '10.00', currency: 'USD' }], mortgages: [{ name: 'Home', remaining: '1000.00', monthlyPayment: '100.00', currency: 'USD' }], deposits: [{ name: 'Savings', balance: '500.00', currency: 'USD' }] });
    expect(Object.keys(result.subscriptions[0]).sort()).toEqual(['amount', 'currency', 'frequency', 'name', 'nextPaymentDate']);
    expect(result.investments).toBeNull(); expect(JSON.stringify(result)).not.toContain('secret');
    expect(ratesSpy).toHaveBeenCalledTimes(1);
});
for (const options of [
    { targetRole: 'child' }, { viewerRole: 'child' }, { foreign: true }, { inactive: true }, { absent: true },
]) test(`inaccessible member is NOT_FOUND ${JSON.stringify(options)}`, async () => {
    const { caller, memberId, reads } = setup(options);
    await expect(caller.memberFinances({ memberId })).rejects.toMatchObject({ code: 'NOT_FOUND' });
    expect(reads.map(r => r.table)).toEqual(['target']); expect(ratesSpy).not.toHaveBeenCalled();
});
for (const viewerRole of ['owner', 'adult']) test(`${viewerRole} guardian reads child finances`, async () => {
    const { caller, memberId } = setup({ viewerRole, targetRole: 'child', guardian: viewerRole === 'adult' });
    expect((await caller.memberFinances({ memberId })).member.role).toBe('child');
});
test('child can read self', async () => {
    const { caller, memberId } = setup({ viewerRole: 'child', targetRole: 'child', self: true });
    expect((await caller.memberFinances({ memberId })).member.isMe).toBe(true);
});
test('opaque cursor pages without duplicates even when dates and timestamps tie', async () => {
    const { caller, memberId } = setup();
    const first = await caller.memberFinances({ memberId });
    expect(first.transactions.items).toHaveLength(50); expect(first.transactions.nextCursor).toBeString();
    const second = await caller.memberFinances({ memberId, cursor: first.transactions.nextCursor! });
    expect(second.transactions.items).toHaveLength(2); expect(second.transactions.nextCursor).toBeNull();
    expect(new Set([...first.transactions.items, ...second.transactions.items].map(t => t.id)).size).toBe(52);
});
test('invalid cursor is rejected', async () => {
    const { caller, memberId } = setup();
    await expect(caller.memberFinances({ memberId, cursor: 'malformed' })).rejects.toMatchObject({ code: 'BAD_REQUEST' });
});
test('no accounts skips account-dependent reads', async () => {
    const { caller, memberId, reads } = setup({ empty: true });
    const result = await caller.memberFinances({ memberId });
    expect(result.accounts).toEqual([]); expect(result.netWorth).toBe('0.00');
    expect(result.transactions).toEqual({ items: [], nextCursor: null });
    expect(reads.some(r => ['transactions', 'credits', 'mortgages', 'deposits'].includes(r.table))).toBe(false);
});
test('unavailable conversion is reported with raw account balances retained', async () => {
    const { caller, memberId } = setup(); ratesSpy.mockResolvedValue({ USD: 1 });
    const result = await caller.memberFinances({ memberId });
    expect(result.netWorth).toBe('0.00'); expect(result.unconvertedCurrencies).toEqual(['EUR']);
    expect(result.accounts[0].balances[0].balance).toBe('100.00');
});
