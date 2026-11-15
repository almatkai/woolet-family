import { afterEach, expect, spyOn, test } from 'bun:test';
import { PgDialect } from 'drizzle-orm/pg-core';
import { householdRouter } from '../../src/routers/household';
import { currencyExchangeService } from '../../src/services/currency-exchange-service';
import { familyWalletTransactions, householdBudgets, householdMembers } from '../../src/db/schema';
import { db as capabilityDb } from '../../src/db';
import { executeCapability, getCapabilityManifest, isCapabilityReadOnly } from '../../src/services/ai/capability-registry';
import { buildFamilyContext } from '../../src/services/ai/family-context';
import { buildSystemPrompt } from '../../src/services/ai/chat-service';
import { createMockContext } from '../utils';

const home = '11111111-1111-4111-8111-111111111111';
const categoryId = '22222222-2222-4222-8222-222222222222';
const dialect = new PgDialect();
let ratesSpy: ReturnType<typeof spyOn>;
const originalQuery = capabilityDb.query;
let selectSpy: ReturnType<typeof spyOn> | undefined;
afterEach(() => {
    ratesSpy?.mockRestore();
    selectSpy?.mockRestore();
    (capabilityDb as any).query = originalQuery;
});
function setup({ role = 'owner', guardian = false, rates = { USD: 1, EUR: 2 }, empty = false, noFamily = false, budgetAmount = '100.00' }: { role?: string; guardian?: boolean; rates?: Record<string, number>; empty?: boolean; noFamily?: boolean; budgetAmount?: string } = {}) {
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
                if (fields?.membership) return noFamily ? [] : [{ membership: viewer, household: { name: 'Martinez', ownerUserId: 'owner' } }];
                if (table === householdMembers) { record('members', where); return all; }
                if (table === familyWalletTransactions) { const q = record('wallets', where); expect(q.params[0]).toBe(home); expect(q.params).toHaveLength(3); return wallets; }
                if (table === householdBudgets) return [{ budget: { categoryId: null, currencyCode: 'USD', amount: budgetAmount }, categoryName: null }, { budget: { categoryId, currencyCode: 'USD', amount: '50.00' }, categoryName: 'Food' }];
                throw Error('Unexpected table');
            };
            const chain: any = { innerJoin: () => chain, leftJoin: () => chain, where: (w: any) => { where = w; return chain; }, limit: async () => value(), then: (resolve: any, reject: any) => Promise.resolve().then(value).then(resolve, reject) }; return chain;
        } }),
    };
    ratesSpy = spyOn(currencyExchangeService, 'getExchangeRates').mockResolvedValue(rates);
    const caller = householdRouter.createCaller(createMockContext({ userId: 'viewer', user: { testMode: true } as any, db }));
    return { caller, reads, personal, wallets, all, db };
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
    expect(ratesSpy).toHaveBeenCalledTimes(1); expect(ratesSpy).toHaveBeenCalledWith('USD', { storedOnly: true });
});
test('non-guardian adult excludes child personal banks but includes child wallet expense', async () => {
    const { caller, reads } = setup({ role: 'adult' });
    const result = await caller.overview({ month: '2026-02' });
    expect(result.members.map(m => m.memberId)).toEqual(['viewer', 'adult', 'child']);
    expect(result.members.find(m => m.memberId === 'child')).toMatchObject({ canOpen: false, netWorth: null, expenseCount: 1 });
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

test('display currency converts every figure without changing raw totals', async () => {
    const { caller } = setup({ rates: { EUR: 1, USD: 0.5 } });
    const result = await caller.overview({ month: '2026-02', currency: 'EUR' });
    expect(result.displayCurrency).toBe('EUR');
    expect(result.availableCurrencies).toEqual(['EUR', 'USD']);
    expect(result.filtered).toBeNull();
    expect(result.converted.currencies[0]).toMatchObject({ currencyCode: 'EUR', expense: '110.00', budget: '200.00' });
    expect(result.categoryBudgets[0]).toMatchObject({ amount: '100.00', spent: '110.00' });
    expect(result.previousMonthExpense).toBe('6.00');
    expect(result.members.find(m => m.memberId === 'viewer')).toMatchObject({ netWorth: '200.00', expenseCount: 1, transactionsCount: 2, canOpen: true });
    expect(ratesSpy).toHaveBeenCalledWith('EUR', { storedOnly: true });
});
test('filters hidden child amounts without exposing personal banks', async () => {
    const { caller, wallets, all, reads } = setup({ role: 'adult' });
    const childId = '33333333-3333-4333-8333-333333333333';
    all.find(r => r.member.id === 'child')!.member.id = childId;
    wallets.forEach(r => r.wallet.childMemberId = childId);
    const result = await caller.overview({ month: '2026-02', memberId: childId, categoryId });
    expect(result.filtered?.currencies[0].expense).toBe('5.00');
    expect(result.converted.currencies[0].expense).toBe('25.00');
    expect(result.members.find(m => m.memberId === childId)).toMatchObject({ canOpen: false, netWorth: null });
    expect(reads.filter(r => r.table === 'banks')).toHaveLength(2);
    expect((await caller.overview({ month: '2026-02', categoryId: 'none' })).filtered?.categories).toEqual([]);
});
test('current comparison uses matching day count, past comparison uses full month', async () => {
    const { caller, personal } = setup();
    personal.push({ ...personal.find(t => t.id === 'previous')!, id: 'late-previous', date: '2026-01-25', amount: '20.00' });
    const current = await caller.overview({ month: '2026-02', today: '2026-02-15' });
    expect(current.previousMonthToDateExpense).toBe('3.00');
    expect(current.previousMonthExpense).toBe('13.00');
    expect((await caller.overview({ month: '2026-02', today: '2026-03-15' })).previousMonthToDateExpense).toBe('13.00');
});
test('rejects invalid currency, member, category and calendar dates', async () => {
    for (const input of [{ currency: 'ZZZ' }, { memberId: 'child' }, { categoryId: 'food' }, { today: '2026-02-30' }]) {
        await expect(setup().caller.overview({ month: '2026-02', ...input })).rejects.toMatchObject({ code: 'BAD_REQUEST' });
    }
});

test('month-to-date comparison clamps to February end and handles year boundaries', async () => {
    const { caller, personal } = setup();
    personal.push({ ...personal[0], id: 'feb-end', date: '2026-02-28', amount: '7.00' });
    expect((await caller.overview({ month: '2026-03', today: '2026-03-31' })).previousMonthToDateExpense).toBe('62.00');
    personal.push({ ...personal[0], id: 'december', date: '2025-12-10', amount: '9.00' });
    expect((await caller.overview({ month: '2026-01', today: '2026-01-15' })).previousMonthToDateExpense).toBe('9.00');
});

// Exercise the real capability, query builder, policy, and converter with the
// same query-aware DB fixture as the dashboard. Only replace DB IO.
function familyToolFixture(options: Parameters<typeof setup>[0] = {}) {
    const fixture = setup(options);
    selectSpy = spyOn(capabilityDb, 'select').mockImplementation(fixture.db.select);
    (capabilityDb as any).query = fixture.db.query;
    return { ...fixture, analyze: (args: Record<string, unknown> = { month: '2026-02' }, capabilityId = 'analyze_family_spending') =>
        executeCapability({ userId: 'viewer', capabilityId, args }) };
}

test('family capability matches overview for a Martinez-like mixed-currency month including split and wallet rows', async () => {
    const fixture = familyToolFixture({ budgetAmount: '5000.00' });
    const { personal, wallets, all } = fixture;
    all.forEach((row, index) => { row.name = ['Alex Martinez', 'Jordan Martinez', 'Maya Martinez'][index]; });
    const prototype = personal[0];
    personal.splice(0, personal.length,
        { ...prototype, id: 'alex', amount: '3069.15', date: '2026-11-12' },
        { ...prototype, id: 'split-child', amount: '200.00', date: '2026-11-12', parentTransactionId: 'split-parent' },
        { ...prototype, id: 'jordan', currencyBalanceId: 'adult-b', amount: '1785.50', currencyBalance: { currencyCode: 'EUR' }, date: '2026-11-12' },
        { ...prototype, id: 'maya-personal', currencyBalanceId: 'child-b', amount: '30.00', date: '2026-11-12' },
        { ...prototype, id: 'salary', type: 'income', amount: '8000.00', date: '2026-11-01' },
    );
    wallets.forEach(row => { row.transaction.date = '2026-11-12'; });
    wallets[0].transaction.amount = '56.50';
    wallets.push({ wallet: { ...wallets[0].wallet, id: 'shared', kind: 'shared', childMemberId: null } as any,
        transaction: { ...wallets[0].transaction, id: 'alex-wallet', amount: '394.00', categoryId }, categoryName: 'Food' });
    const overview = await fixture.caller.overview({ month: '2026-11' });
    const result = await fixture.analyze({ month: '2026-11' });
    expect(result).toMatchObject({ success: true, capabilityId: 'family.spending.analyze.v1', aliasUsed: 'analyze_family_spending', readOnly: true });
    const data = result.data as any;
    const total = overview.converted.currencies[0];
    expect(data).toMatchObject({ spent: total.expense, income: total.income, budget: total.budget, remaining: total.remaining,
        displayCurrency: overview.displayCurrency, byCurrency: overview.byCurrency, unconvertedCurrencies: [] });
    expect(data).toMatchObject({ spent: '4642.40', income: '8000.00', budget: '5000.00', remaining: '357.60' });
    expect(data.spendingByMember).toEqual(overview.members.map(member => ({ memberId: member.memberId, name: member.name, spent: member.spent, purchases: member.expenseCount })));
    expect(data.spendingByMember.map((member: any) => [member.name, member.spent, member.purchases])).toEqual([
        ['Alex Martinez', '3663.15', 3], ['Jordan Martinez', '892.75', 1], ['Maya Martinez', '86.50', 2],
    ]);
    expect(data.spendingByCategory).toEqual([{ categoryId, name: 'Food', spent: '4642.40' }]);
    expect(data.note).toContain('latest stored rates');
    expect(data.note).toContain('transfers between family wallets excluded');
    expect(fixture.reads.filter(row => row.table === 'transactions').every(row => !row.sql.includes('parent_transaction_id'))).toBe(true);
});

for (const options of [{ role: 'child' }, { noFamily: true }]) test(`family capability denies access without financial reads: ${JSON.stringify(options)}`, async () => {
    const { analyze, reads } = familyToolFixture(options);
    const result = await analyze();
    expect(result).toMatchObject({ success: false, error: { message: 'Family spending is only available to adult family members.' } });
    expect(result.data).toBeUndefined();
    expect(reads).toHaveLength(0);
    expect(ratesSpy).not.toHaveBeenCalled();
});

test('non-guardian family capability includes child wallets but never reads child personal rows', async () => {
    const { analyze, caller, reads } = familyToolFixture({ role: 'adult' });
    const overview = await caller.overview({ month: '2026-02' });
    expect(await analyze({}, 'family.spending.analyze.v1')).toMatchObject({ success: false, error: { code: 'INVALID_ARGS' } });
    const data = (await analyze()).data as any;
    expect(data.spent).toBe(overview.converted.currencies[0].expense);
    expect(data.spendingByMember.find((m: any) => m.memberId === 'child')).toEqual({ memberId: 'child', name: 'child', spent: '5.00', purchases: 1 });
    expect(reads.filter(row => row.table === 'banks').every(row => row.params[0] !== 'child')).toBe(true);
    expect(reads.filter(row => row.table === 'transactions').every(row => !row.params.includes('child-b'))).toBe(true);
    expect(JSON.stringify(data)).not.toContain('child-tx');
});

test('family capability matches overview display currency and retains missing currencies without summing them', async () => {
    const { analyze, caller } = familyToolFixture({ rates: { USD: 1 } });
    const overview = await caller.overview({ month: '2026-02' });
    const data = (await analyze()).data as any;
    expect(data.spent).toBe(overview.converted.currencies[0].expense);
    expect(data.unconvertedCurrencies).toEqual(['EUR']);
    expect(data.byCurrency).toEqual(overview.byCurrency);
    expect(data.note).toContain('excluded from converted totals');
    ratesSpy.mockResolvedValue({ EUR: 1, USD: 0.5 });
    const inEuros = (await analyze({ month: '2026-02', currency: 'EUR' })).data as any;
    expect(inEuros).toMatchObject({ spent: '110.00', budget: '200.00', remaining: '90.00', displayCurrency: 'EUR', unconvertedCurrencies: [] });
});

test('member filter matches dashboard filtered totals and does not expose hidden personal finances', async () => {
    const { analyze, caller, all, wallets } = familyToolFixture({ role: 'adult' });
    const memberId = '33333333-3333-4333-8333-333333333333';
    all[2].member.id = memberId;
    wallets.forEach(row => { row.wallet.childMemberId = memberId; });
    const input = { month: '2026-02', memberId };
    const overview = await caller.overview(input);
    const data = (await analyze(input)).data as any;
    expect(data).toMatchObject({ spent: overview.filtered!.currencies[0].expense, income: '0.00', budget: null, remaining: null });
    expect(data.spendingByMember).toEqual([{ memberId, name: 'child', spent: '5.00', purchases: 1 }]);
    expect(data.byCurrency.currencies).toEqual([{ currencyCode: 'USD', expense: '5.00', income: '0.00', budget: null, remaining: null }]);
});

test('family context routes adults using member first names only; children and non-members get none', async () => {
    const { db, all } = setup();
    all[0].name = 'Alex Martinez'; all[1].name = 'Jordan Martinez'; all[2].name = 'Maya Martinez';
    const familyContext = await buildFamilyContext(db, 'viewer');
    expect(familyContext).toBe('The user is in a family (Martinez) with members Alex, Jordan, Maya; use analyze_family_spending for family questions.');
    const prompt = buildSystemPrompt({ familyContext, userName: 'Alex', userAliases: ['Alex'], defaultCurrency: 'USD', positionCount: 0, topHoldings: 'None', accounts: [], recommendedCategories: [], today: '2026-11-15' });
    expect(prompt).toContain(familyContext!);
    expect(prompt).toContain('family.spending.analyze.v1');
    expect(prompt).toContain("only the signed-in user's personal accounts");
    expect(familyContext).not.toContain('@');
    expect(familyContext).not.toContain('balance');
    all[0].member.role = 'child';
    expect(await buildFamilyContext(db, 'viewer')).toBeNull();
    all[0].member.role = 'owner';
    all[1].name = null as any;
    expect(await buildFamilyContext(db, 'viewer')).not.toContain('adult@example.com');
    ratesSpy.mockRestore();
    expect(await buildFamilyContext(setup({ noFamily: true }).db, 'viewer')).toBeNull();
});

test('manifest steers family questions away from personal spending and marks the family alias read-only', () => {
    const manifest = getCapabilityManifest();
    const family = manifest.capabilities.find(capability => capability.id === 'family.spending.analyze.v1')!;
    expect(family).toMatchObject({ readOnly: true, requiresConfirmation: false, aliases: ['analyze_family_spending'] });
    expect(family.argsSchema.required).toEqual(['month']);
    for (const phrase of ['family', 'we', 'us', 'household', 'wife/husband/kids', 'other family members']) expect(family.description).toContain(phrase);
    expect(manifest.capabilities.find(capability => capability.id === 'spending.analyze.v1')!.description).toContain("only the signed-in user's own personal accounts");
    expect(isCapabilityReadOnly('family.spending.analyze.v1')).toBe(true);
    expect(isCapabilityReadOnly('analyze_family_spending')).toBe(true);
});

test('read-only family capability is available by ID and alias to demo adults', async () => {
    familyToolFixture();
    const keys = ['DEMO_OWNER_USER_ID', 'DEMO_PARTNER_USER_ID', 'DEMO_CHILD_USER_ID'] as const;
    const previous = keys.map(key => process.env[key]);
    try {
        Object.assign(process.env, { DEMO_OWNER_USER_ID: 'user_demoOwner', DEMO_PARTNER_USER_ID: 'user_demoPartner', DEMO_CHILD_USER_ID: 'user_demoChild' });
        for (const capabilityId of ['family.spending.analyze.v1', 'analyze_family_spending']) {
            expect(await executeCapability({ userId: 'user_demoOwner', capabilityId, args: { month: '2026-02' } })).toMatchObject({ success: true, readOnly: true, data: { spent: '55.00' } });
        }
    } finally {
        keys.forEach((key, index) => { if (previous[index] === undefined) delete process.env[key]; else process.env[key] = previous[index]; });
    }
});

test('family capability validates month, display currency, and membership ID before querying', async () => {
    const { analyze, reads } = familyToolFixture();
    for (const args of [{ month: '2026-13' }, { month: '2026-2' }, { month: '2026-02', currency: 'ZZZ' }, { month: '2026-02', memberId: 'child' }]) {
        expect(await analyze(args)).toMatchObject({ success: false, error: { code: 'INVALID_ARGS' } });
    }
    expect(reads).toHaveLength(0);
    expect(ratesSpy).not.toHaveBeenCalled();
});
