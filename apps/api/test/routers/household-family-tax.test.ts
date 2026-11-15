import { afterEach, expect, setSystemTime, spyOn, test } from 'bun:test';
import { PgDialect } from 'drizzle-orm/pg-core';
import { householdRouter } from '../../src/routers/household';
import { householdMembers, transactions } from '../../src/db/schema';
import { taxProfileSchema } from '../../src/lib/tax/input';
import { annualizationFactor, estimateTax } from '../../src/lib/tax/estimate';
import { CurrencyService } from '../../src/services/currency';
import { createMockContext } from '../utils';

const home = '11111111-1111-4111-8111-111111111111';
const dialect = new PgDialect();
let rateSpy: ReturnType<typeof spyOn>;
afterEach(() => { rateSpy?.mockRestore(); setSystemTime(); });
function setup(role = 'owner', guardian = false) {
    setSystemTime(new Date('2026-06-15T12:00:00Z'));
    const viewer = { id: 'viewer-member', userId: 'viewer', householdId: home, role, isGuardian: guardian, status: 'active' };
    const all = [{ member: { ...viewer, id: 'child-member', userId: 'child', role: 'child' }, name: 'Child', email: 'child@test.com' },
        { member: { ...viewer, id: 'adult-member', userId: 'adult', role: 'adult' }, name: 'Adult', email: 'adult@test.com' },
        { member: viewer, name: 'Viewer', email: 'viewer@test.com' }];
    const profile = taxProfileSchema.parse({ taxYear: 2026, filingStatus: 'single', state: 'TX', wageIncome: 85000, federalWithholdingYtd: 1000 });
    const profiles: Record<string, any> = { viewer: profile, adult: { ...profile, wageIncome: 999999, federalWithholdingYtd: 0, useTransactionsForIncome: true } };
    const payments = [{ quarter: 1, jurisdiction: 'federal' as const, paidOn: '2026-04-15', amount: '100.00' },
        { quarter: 1, jurisdiction: 'state' as const, paidOn: '2026-04-15', amount: '200.00' },
        { quarter: 4, jurisdiction: 'federal' as const, paidOn: '2027-01-15', amount: '500.00' }];
    const reads: { table: string; params: any[]; sql: string }[] = [];
    const record = (table: string, where: any) => { const q = dialect.sqlToQuery(where); reads.push({ table, ...q }); return q; };
    const db: any = {
        query: {
            taxProfiles: { findFirst: async ({ where }: any) => { const q = record('profile', where); expect(q.params[1]).toBe(2026); return profiles[String(q.params[0])] ?? null; } },
            taxEstimatedPayments: { findMany: async ({ where }: any) => { const q = record('payments', where); expect(q.params[1]).toBe(2026); return payments; } },
        },
        select: (fields: any) => ({ from: (table: any) => {
            let where: any;
            const value = () => {
                if (fields.membership) return [{ membership: viewer, household: {} }];
                if (table === householdMembers) { expect(record('members', where).params).toEqual([home, 'active']); return all; }
                expect(table).toBe(transactions);
                const q = record('income', where);
                expect(q.params).toContain('adult'); expect(q.params).toContain(false); expect(q.params).not.toContain(true);
                expect(q.params).toContain('income'); expect(q.params).toContain('active'); expect(q.params).toContain('2026-01-01'); expect(q.params).toContain('2026-12-31'); expect(q.params).toContain('2026-06-15');
                expect(q.sql).toContain('"parent_transaction_id" is null');
                return [{ amount: '1000', currency: 'EUR', category: 'Salary' }, { amount: '500', currency: 'EUR', category: 'Freelance Work' }];
            };
            const chain: any = { innerJoin: () => chain, where: (w: any) => { where = w; return chain; }, limit: async () => value(),
                then: (resolve: any, reject: any) => Promise.resolve().then(value).then(resolve, reject) };
            return chain;
        } }),
    };
    rateSpy?.mockRestore(); rateSpy = spyOn(CurrencyService, 'getRate').mockResolvedValue(2);
    return { caller: householdRouter.createCaller(createMockContext({ userId: 'viewer', user: { testMode: true } as any, db })), reads, all, profile, profiles, payments };
}
test('family tax has one ordered row per visible member with the canonical estimate and paid amounts', async () => {
    const { caller, profile, payments } = setup();
    const result = await caller.familyTax({ taxYear: 2026 });
    const estimate = estimateTax(profile, payments.map(p => ({ ...p, amount: Number(p.amount) })), new Date('2026-06-15T00:00:00Z'));
    expect(result.map(r => r.memberId)).toEqual(['viewer-member', 'adult-member', 'child-member']);
    expect(result[0]).toEqual({ memberId: 'viewer-member', name: 'Viewer', isMe: true, hasProfile: true, estimatedTax: estimate.total.toFixed(2), paid: '1300.00',
        nextDue: estimate.nextPayment ? { date: estimate.nextPayment.dueDate, amount: estimate.nextPayment.suggestedAmount.toFixed(2) } : null, currency: 'USD' });
    expect(result[2]).toEqual({ memberId: 'child-member', name: 'Child', isMe: false, hasProfile: false, estimatedTax: null, paid: null, nextDue: null, currency: 'USD' });
});
test('transaction-based estimates use only the target non-test income and cached currency conversion', async () => {
    const { caller, profiles, payments } = setup('adult');
    const row = (await caller.familyTax({ taxYear: 2026 }))[1];
    const today = new Date('2026-06-15T00:00:00Z');
    const factor = annualizationFactor(2026, today);
    const expected = estimateTax({ ...profiles.adult, wageIncome: 2000 * factor, selfEmploymentIncome: 1000 * factor }, payments.map(p => ({ ...p, amount: Number(p.amount) })), today);
    expect(row.estimatedTax).toBe(expected.total.toFixed(2)); expect(row.paid).toBe(expected.paidSoFar.toFixed(2));
    expect(rateSpy).toHaveBeenCalledTimes(1); expect(rateSpy).toHaveBeenCalledWith('EUR', 'USD');
});
test('non-guardian cannot read child tax profiles or payments; guardian can', async () => {
    const { caller, reads } = setup('adult');
    expect((await caller.familyTax({ taxYear: 2026 }))).toHaveLength(2);
    expect(reads.filter(r => r.table !== 'members').some(r => r.params.includes('child'))).toBe(false);
    const guardian = setup('adult', true);
    expect(await guardian.caller.familyTax({ taxYear: 2026 })).toHaveLength(3);
    expect(guardian.reads.find(r => r.table === 'profile' && r.params.includes('child'))).toBeDefined();
});
test('child callers are forbidden before any member or tax reads', async () => {
    const { caller, reads } = setup('child');
    await expect(caller.familyTax({ taxYear: 2026 })).rejects.toMatchObject({ code: 'FORBIDDEN' });
    expect(reads).toEqual([]); expect(rateSpy).not.toHaveBeenCalled();
});
test('family tax validates the same supported years as the personal router', async () => {
    const { caller, reads } = setup();
    await expect(caller.familyTax({ taxYear: 2027 as any })).rejects.toMatchObject({ code: 'BAD_REQUEST' });
    expect(reads).toEqual([]);
});
