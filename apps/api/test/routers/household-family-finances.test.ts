import { afterEach, expect, spyOn, test } from 'bun:test';
import { PgDialect } from 'drizzle-orm/pg-core';
import { householdRouter } from '../../src/routers/household';
import { householdMembers } from '../../src/db/schema';
import { currencyExchangeService } from '../../src/services/currency-exchange-service';
import { createMockContext } from '../utils';

const uuid = (n: number) => `00000000-0000-4000-8000-${String(n).padStart(12, '0')}`;
const home = uuid(1), viewerId = uuid(2), adultId = uuid(3), childId = uuid(4);
const dialect = new PgDialect();
let ratesSpy: ReturnType<typeof spyOn>;
afterEach(() => ratesSpy?.mockRestore());
function setup(role = 'owner', guardian = false) {
    const viewer = { id: viewerId, userId: 'viewer', householdId: home, role, isGuardian: guardian, status: 'active' };
    const all = [
        { member: { ...viewer, id: childId, userId: 'child', role: 'child' }, name: 'Child', email: 'child@test.com' },
        { member: { ...viewer, id: adultId, userId: 'adult', role: 'adult' }, name: 'Alpha', email: 'adult@test.com' },
        { member: viewer, name: 'Zara', email: 'viewer@test.com' },
    ];
    const reads: { table: string; params: any[]; sql: string }[] = [];
    const record = (table: string, where: any) => { const q = dialect.sqlToQuery(where); reads.push({ table, ...q }); return q; };
    const debt = (n: number, userId: string, type: string, amount: string, linkedUserId: string | null = null) => ({ id: uuid(n), userId, type, amount, paidAmount: '0', linkedUserId,
        personName: linkedUserId === 'adult' ? 'Alpha' : 'Someone', currencyCode: 'USD', currencyBalance: null, dueDate: '2026-12-01', status: 'pending', lifecycleStatus: 'active' });
    const debts = [debt(10, 'viewer', 'i_owe', '50', 'adult'), debt(11, 'adult', 'they_owe', '50', 'viewer'),
        debt(12, 'viewer', 'i_owe', '100'), debt(13, 'adult', 'they_owe', '60'), debt(14, 'child', 'i_owe', '999'),
        { ...debt(15, 'viewer', 'i_owe', '20'), paidAmount: '20', status: 'paid' }];
    const sub = (n: number, frequency: string, amount: string, linkedEntityType: string | null = null) => ({ id: uuid(n), userId: 'viewer', name: frequency, frequency, amount,
        linkedEntityType, currency: 'USD', startDate: '2020-01-01', endDate: null, billingDay: 1, status: 'active' });
    const subscriptions = [sub(20, 'daily', '1'), sub(21, 'weekly', '12'), sub(22, 'monthly', '20'), sub(23, 'yearly', '120'), sub(24, 'monthly', '900', 'credit'), sub(25, 'monthly', '800', 'mortgage')];
    const db: any = {
        select: (fields: any) => { let where: any;
            const chain: any = { from: (table: any) => { if (!fields.membership) expect(table).toBe(householdMembers); return chain; }, innerJoin: () => chain,
                where: (w: any) => { where = w; return chain; }, limit: async () => [{ membership: viewer, household: { ownerUserId: 'owner' } }],
                then: (resolve: any, reject: any) => Promise.resolve().then(() => { expect(record('members', where).params).toEqual([home, 'active']); return all; }).then(resolve, reject) };
            return chain;
        },
        query: {
            users: { findFirst: async () => ({ defaultCurrency: 'USD' }) },
            banks: { findMany: async ({ where }: any) => {
                const q = record('banks', where); expect(q.params[1]).toBe(false); const user = q.params[0];
                return [{ name: 'Bank', icon: null, accounts: [{ id: `${user}-account`, name: 'Main', type: 'card', last4Digits: '1234',
                    currencyBalances: [{ id: `${user}-balance`, currencyCode: user === 'adult' ? 'EUR' : user === 'child' ? 'GBP' : 'USD', balance: user === 'adult' ? '200' : '100' }] }] }];
            } },
            debts: { findMany: async ({ where }: any) => { const q = record('debts', where); expect(q.params.slice(1)).toEqual([false, 'active']); return debts.filter(d => d.userId === q.params[0]); } },
            subscriptions: { findMany: async ({ where }: any) => { const q = record('subscriptions', where); expect(q.params[1]).toBe('active'); return subscriptions.filter(s => s.userId === q.params[0]); } },
            credits: { findMany: async ({ where }: any) => { const q = record('credits', where); return q.params[0] === 'viewer-account' ? [{ id: uuid(30), name: 'Loan', remainingBalance: '500', monthlyPayment: '10', currency: 'USD', endDate: '2027-01-01', status: 'active' },
                { id: uuid(31), name: 'Closed', remainingBalance: '100', monthlyPayment: '10', currency: 'USD', endDate: '2027-01-01', status: 'paid_off' }] : []; } },
            mortgages: { findMany: async ({ where }: any) => { const q = record('mortgages', where); return q.params[0] === 'viewer-account' ? [{ id: uuid(32), propertyName: 'Home', remainingBalance: '5000', monthlyPayment: '100', currency: 'USD', paymentDay: 15, status: 'active' }] : []; } },
            deposits: { findMany: async ({ where }: any) => { const q = record('deposits', where); return q.params[0] === 'viewer-account' ? [{ id: uuid(33), depositName: 'Savings', currentBalance: '500', currency: 'USD', interestRate: '5.00', status: 'active' }] : []; } },
        },
    };
    ratesSpy?.mockRestore();
    ratesSpy = spyOn(currencyExchangeService, 'getExchangeRates').mockResolvedValue({ USD: 1, EUR: 2, GBP: 4 });
    return { caller: householdRouter.createCaller(createMockContext({ userId: 'viewer', user: { testMode: true } as any, db })), reads, all, debts, subscriptions, debt };
}
test('family finances returns curated item ids, member order and converted summaries', async () => {
    const { caller } = setup();
    const result = await caller.familyFinances({});
    expect(result.members.map(m => m.memberId)).toEqual([viewerId, adultId, childId]);
    expect(result.members[0].accounts[0]).toEqual({ id: 'viewer-account', bankName: 'Bank', bankIcon: null, accountName: 'Main', type: 'card', last4: '1234', balances: [{ currencyCode: 'USD', balance: '100.00' }] });
    expect(result.members[0].credits[0]).toMatchObject({ id: uuid(30), remaining: '500.00', endDate: '2027-01-01' });
    expect(result.members[0].mortgages[0]).toMatchObject({ id: uuid(32), paymentDay: 15 });
    expect(result.members[0].deposits[0]).toMatchObject({ id: uuid(33), interestRate: '5.00' });
    expect(result.summary).toEqual({ balances: [{ currencyCode: 'EUR', amount: '200.00' }, { currencyCode: 'GBP', amount: '100.00' }, { currencyCode: 'USD', amount: '100.00' }],
        balancesConverted: '225.00', accountsCount: 3, owes: [{ currencyCode: 'USD', amount: '1099.00' }], owesConverted: '1099.00', owed: [{ currencyCode: 'USD', amount: '60.00' }], owedConverted: '60.00',
        monthlyPayments: [{ currencyCode: 'USD', amount: '222.42' }], monthlyPaymentsConverted: '222.42', creditsCount: 1, mortgagesCount: 1, depositsCount: 1, subscriptionsCount: 4, investmentsValueConverted: null });
    expect(result.unconvertedCurrencies).toEqual([]); expect(ratesSpy).toHaveBeenCalledTimes(1);
});
test('internal linked-user debts appear once and are excluded from owes and owed', async () => {
    const { caller, debts, debt } = setup('adult');
    // A matching name without a linked user is still external.
    debts.push({ ...debt(40, 'viewer', 'i_owe', '7'), personName: 'Alpha' });
    const result = await caller.familyFinances({});
    expect(result.internalDebts).toEqual([{ id: uuid(10), fromMemberId: viewerId, toMemberId: adultId, remaining: '50.00', currencyCode: 'USD' }]);
    expect(result.summary.owesConverted).toBe('107.00'); expect(result.summary.owedConverted).toBe('60.00');
    expect(result.members[0].debts.find(d => d.id === uuid(10))?.counterpartyMemberId).toBe(adultId);
    expect(result.members[0].debts.find(d => d.id === uuid(40))?.counterpartyMemberId).toBeNull();
    debts.push(debt(41, 'viewer', 'i_owe', '50', 'adult'), debt(42, 'adult', 'they_owe', '50', 'viewer'));
    expect((await caller.familyFinances({})).internalDebts).toHaveLength(2);
});
test('subscriptions normalize monthly amounts and loan links never inflate payments or subscription total', async () => {
    const result = await setup().caller.familyFinances({ memberId: viewerId });
    expect(result.members[0].subscriptions.map(s => s.monthlyAmount)).toEqual(['30.42', '52.00', '20.00', '10.00', '900.00', '800.00']);
    expect(result.members[0].subscriptions.map(s => s.linkedEntityType)).toEqual([null, null, null, null, 'credit', 'mortgage']);
    expect(result.summary.monthlyPaymentsConverted).toBe('222.42'); expect(result.summary.subscriptionsCount).toBe(4);
    expect(result.summary.accountsCount).toBe(1); expect(result.internalDebts).toHaveLength(1);
});
test('non-guardian omits child groups and reads; guardian includes them; child endpoint is forbidden', async () => {
    const { caller, reads } = setup('adult');
    expect((await caller.familyFinances({})).members.map(m => m.memberId)).toEqual([viewerId, adultId]);
    expect(reads.filter(r => r.table !== 'members').some(r => r.params[0] === 'child' || r.params[0] === 'child-account')).toBe(false);
    expect((await setup('adult', true).caller.familyFinances({})).members).toHaveLength(3);
    const child = setup('child');
    await expect(child.caller.familyFinances({ memberId: childId })).rejects.toMatchObject({ code: 'FORBIDDEN' });
    expect(child.reads).toEqual([]); expect(ratesSpy).not.toHaveBeenCalled();
});
test('single hidden, foreign, inactive and absent members all get NOT_FOUND before money reads', async () => {
    for (const kind of ['hidden', 'foreign', 'inactive', 'absent']) {
        const { caller, all, reads } = setup('adult');
        if (kind === 'foreign') all.find(r => r.member.id === childId)!.member.householdId = uuid(999);
        if (kind === 'inactive') all.find(r => r.member.id === childId)!.member.status = 'removed';
        if (kind === 'absent') all.splice(all.findIndex(r => r.member.id === childId), 1);
        await expect(caller.familyFinances({ memberId: childId })).rejects.toMatchObject({ code: 'NOT_FOUND' });
        expect(reads.map(r => r.table)).toEqual(['members']); expect(ratesSpy).not.toHaveBeenCalled();
    }
});
test('display currency and missing rates preserve raw figures without cross-currency addition', async () => {
    const { caller } = setup('adult');
    ratesSpy.mockResolvedValue({ EUR: 1, USD: 0.5 });
    const eur = await caller.familyFinances({ currency: 'EUR' });
    expect(eur.displayCurrency).toBe('EUR'); expect(eur.summary.balancesConverted).toBe('400.00'); expect(eur.summary.monthlyPaymentsConverted).toBe('444.84');
    ratesSpy.mockResolvedValue({ USD: 1 });
    const missing = await caller.familyFinances({});
    expect(missing.summary.balancesConverted).toBe('100.00'); expect(missing.unconvertedCurrencies).toEqual(['EUR']);
    expect(missing.summary.balances).toHaveLength(2);
});
