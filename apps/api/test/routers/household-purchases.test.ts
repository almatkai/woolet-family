import { expect, test } from 'bun:test';
import { getTableColumns } from 'drizzle-orm';
import { PgDialect } from 'drizzle-orm/pg-core';
import { householdRouter } from '../../src/routers/household';
import { categories, users } from '../../src/db/schema';
import { familyPurchaseProposals, familyWallets, familyWalletTransactions, households, householdMembers } from '../../src/db/schema/households';
import { createMockContext } from '../utils';
import { router } from '../../src/lib/trpc';

const householdId = '11111111-1111-4111-8111-111111111111';
const foreignHouseholdId = '11111111-1111-4111-8111-222222222222';
const walletId = '22222222-2222-4222-8222-222222222222';
const categoryId = '33333333-3333-4333-8333-333333333333';
const actorA = 'user_alex', actorB = 'user_jordan', child = 'user_maya', outsider = 'user_outside';
const makeId = (n: number) => `44444444-4444-4444-8444-${String(n).padStart(12, '0')}`;

type State = { households: any[]; members: any[]; wallets: any[]; proposals: any[]; ledger: any[]; people: any[] };

/** Models a transactional SQL boundary: real predicates, serialized locks and rollback. */
function fixture(options: { limit?: string; balance?: string; noPartner?: boolean; currency?: string; failProposalUpdate?: boolean } = {}) {
    let state: State = {
        households: [{ id: householdId, name: 'Martinez', sharedPurchaseLimit: options.limit ?? '1000.00', sharedPurchaseLimitUpdatedByUserId: null, sharedPurchaseLimitUpdatedAt: null }],
        members: [
            { id: makeId(1), householdId, userId: actorA, role: 'owner', isGuardian: true, status: 'active' },
            ...(!options.noPartner ? [{ id: makeId(2), householdId, userId: actorB, role: 'adult', isGuardian: false, status: 'active' }] : []),
            { id: makeId(3), householdId, userId: child, role: 'child', isGuardian: false, status: 'active' },
            { id: makeId(4), householdId: foreignHouseholdId, userId: outsider, role: 'owner', isGuardian: true, status: 'active' },
        ],
        wallets: [{ id: walletId, householdId, kind: 'shared', name: 'Household spending', currencyCode: options.currency ?? 'USD', balance: options.balance ?? '2020.00', archivedAt: null }],
        proposals: [], ledger: [],
        people: [
            { id: actorA, name: 'Alex Martinez', email: 'alex@example.com', subscriptionTier: 'premium', testMode: false },
            { id: actorB, name: 'Jordan Martinez', email: 'jordan@example.com', subscriptionTier: 'premium', testMode: false },
            { id: child, name: 'Maya Martinez', email: 'maya@example.com', subscriptionTier: 'premium', testMode: false },
            { id: outsider, name: 'Outsider', email: 'outside@example.com', subscriptionTier: 'premium', testMode: false },
        ],
    };
    const dialect = new PgDialect();
    const writes: { table: any; values: any }[] = [];
    const locks: { table: any; mode: string }[] = [];
    let idCounter = 100;
    const data = (table: any): any[] => table === households ? state.households : table === householdMembers ? state.members : table === familyWallets ? state.wallets : table === familyPurchaseProposals ? state.proposals : table === familyWalletTransactions ? state.ledger : table === users ? state.people : table === categories ? [{ id: categoryId, userId: null, name: 'Household' }] : [];
    const matches = (row: any, table: any, predicate: any) => {
        if (!predicate) return true;
        const query = dialect.sqlToQuery(predicate);
        const columns = getTableColumns(table);
        for (const match of query.sql.matchAll(/"([a-z_]+)"\."([a-z_]+)" (=|<>|!=) \$(\d+)/g)) {
            const property = Object.keys(columns).find(key => (columns as any)[key].name === match[2]);
            if (!property) continue;
            const expected = query.params[Number(match[4]) - 1];
            if (match[3] === '=' ? row[property] !== expected : row[property] === expected) return false;
        }
        return true;
    };
    let tail = Promise.resolve();
    const db: any = {
        transaction: (run: any) => {
            const next = tail.then(async () => {
                const snapshot = structuredClone(state), writeCount = writes.length;
                try { return await run(db); }
                catch (error) { state = snapshot; writes.splice(writeCount); throw error; }
            });
            tail = next.then(() => undefined, () => undefined);
            return next;
        },
        query: { users: { findFirst: async ({ where }: any) => state.people.find(row => matches(row, users, where)) } },
        select: (fields: any) => ({ from: (table: any) => {
            let predicate: any;
            const value = () => data(table).filter(row => matches(row, table, predicate)).map(row => {
                if (fields?.membership) return { membership: row, household: state.households.find(h => h.id === row.householdId) ?? { id: foreignHouseholdId } };
                if (table === familyPurchaseProposals && fields?.proposal) {
                    const wallet = state.wallets.find(w => w.id === row.walletId);
                    return { proposal: row, walletName: wallet.name, currencyCode: wallet.currencyCode, walletBalance: wallet.balance };
                }
                if (table === householdMembers && fields?.name) {
                    const person = state.people.find(p => p.id === row.userId);
                    return { ...row, name: person.name, email: person.email };
                }
                return row;
            });
            const chain: any = {
                innerJoin: () => chain, leftJoin: () => chain,
                where: (p: any) => { predicate = p; return chain; }, orderBy: () => chain,
                limit: async (n: number) => value().slice(0, n),
                for: async (mode: string) => { locks.push({ table, mode }); return value(); },
                then: (resolve: any, reject: any) => Promise.resolve(value()).then(resolve, reject),
            };
            return chain;
        } }),
        insert: (table: any) => ({ values: (values: any) => ({ returning: async () => {
            const defaults = table === familyPurchaseProposals ? { status: 'pending', awaitingUserId: null, decidedByUserId: null, decidedAt: null, transactionId: null, createdAt: new Date(), updatedAt: new Date() } : {};
            const row = { id: makeId(idCounter++), ...defaults, ...values };
            data(table).push(row); writes.push({ table, values });
            return [row];
        } }) }),
        update: (table: any) => ({ set: (values: any) => ({ where: (predicate: any) => {
            let applied: any[] | undefined;
            const apply = () => {
                if (applied) return applied;
                if (options.failProposalUpdate && table === familyPurchaseProposals) throw Error('Simulated proposal persistence failure');
                applied = data(table).filter(row => matches(row, table, predicate));
                for (const row of applied) Object.assign(row, values);
                writes.push({ table, values });
                return applied;
            };
            return { returning: async () => apply(), then: (resolve: any, reject: any) => Promise.resolve().then(apply).then(resolve, reject) };
        } }) }),
    };
    const api = router({ household: householdRouter });
    const caller = (userId: string) => api.createCaller(createMockContext({ userId, db })).household;
    const expense = (userId = actorB, amount = '1200.00') => caller(userId).addTransaction({ walletId, type: 'expense', amount, date: '2026-11-01', today: '2026-11-15', categoryId, description: 'Washing machine' });
    const proposal = async (userId = actorB, amount = '1200.00') => {
        const result = await expense(userId, amount);
        if (!result.proposal) throw Error('Expected proposal');
        return result.proposal;
    };
    return { caller, expense, proposal, get state() { return state; }, writes, locks };
}

test('exact shared purchase threshold is spent immediately; one cent above creates only a pending proposal', async () => {
    const exact = fixture();
    expect(await exact.expense(actorB, '1000')).toMatchObject({ approvalRequired: false, proposal: null, balance: '1020.00' });
    expect(exact.state.ledger).toHaveLength(1);
    const above = fixture();
    expect(await above.expense(actorB, '1000.01')).toMatchObject({ approvalRequired: true, transaction: null, balance: '2020.00', proposal: { status: 'pending', amount: '1000.01' } });
    expect(above.state.ledger).toEqual([]);
    expect(above.state.wallets[0].balance).toBe('2020.00');
});

test('the configured threshold applies in the shared wallet currency, without implicit USD conversion', async () => {
    const f = fixture({ currency: 'EUR', limit: '200.00' });
    expect((await f.expense(actorB, '200.01')).approvalRequired).toBe(true);
    expect(f.state.ledger).toEqual([]);
});

test('a family with no other active adult cannot silently spend above its limit', async () => {
    const f = fixture({ noPartner: true });
    await expect(f.expense(actorA)).rejects.toThrow('Invite another adult');
    expect(f.writes).toEqual([]);
});

test('self-approval, children and foreign households cannot decide a shared purchase', async () => {
    const f = fixture(), p = await f.proposal();
    for (const [actor, code] of [[actorB, 'FORBIDDEN'], [child, 'FORBIDDEN'], [outsider, 'NOT_FOUND']] as const) {
        await expect(f.caller(actor).respondToPurchaseProposal({ proposalId: p.id, action: 'approve' })).rejects.toMatchObject({ code });
    }
    expect(f.state.ledger).toEqual([]);
    expect(f.state.wallets[0].balance).toBe('2020.00');
});

test('partner approval writes one expense with the original author/date/category and a retry never debits again', async () => {
    const f = fixture(), p = await f.proposal();
    const first = await f.caller(actorA).respondToPurchaseProposal({ proposalId: p.id, action: 'approve' });
    expect(first).toMatchObject({ alreadyDecided: false, proposal: { status: 'approved', decidedByUserId: actorA } });
    expect(f.state.wallets[0].balance).toBe('820.00');
    expect(f.state.ledger).toEqual([expect.objectContaining({ amount: '1200.00', date: '2026-11-01', categoryId, createdByUserId: actorB, description: 'Washing machine' })]);
    expect(await f.caller(actorA).respondToPurchaseProposal({ proposalId: p.id, action: 'approve' })).toMatchObject({ alreadyDecided: true, transactionId: first.transactionId });
    expect(f.state.ledger).toHaveLength(1);
    expect(f.state.wallets[0].balance).toBe('820.00');
    expect(f.locks).toEqual(expect.arrayContaining([{ table: familyPurchaseProposals, mode: 'update' }, { table: familyWallets, mode: 'update' }]));
});

test('counter keeps cash untouched and lets the original proposer approve the other adult’s new offer', async () => {
    const f = fixture(), p = await f.proposal();
    const counter = await f.caller(actorA).respondToPurchaseProposal({ proposalId: p.id, action: 'counter', amount: '1000' });
    expect(counter.proposal).toMatchObject({ status: 'countered', amount: '1000.00', originalAmount: '1200.00', awaitingUserId: actorB, lastActorUserId: actorA });
    expect(f.state.ledger).toEqual([]);
    expect(f.state.wallets[0].balance).toBe('2020.00');
    await expect(f.caller(actorA).respondToPurchaseProposal({ proposalId: p.id, action: 'approve' })).rejects.toMatchObject({ code: 'FORBIDDEN' });
    const approved = await f.caller(actorB).respondToPurchaseProposal({ proposalId: p.id, action: 'approve' });
    expect(approved.proposal).toMatchObject({ status: 'approved', decidedByUserId: actorB, amount: '1000.00' });
    expect(f.state.wallets[0].balance).toBe('1020.00');
    expect(f.state.ledger).toHaveLength(1);
    expect(approved.proposal.timeline.map(event => event.action)).toEqual(['proposed', 'countered', 'approved']);
});

test('same-amount and missing/invalid counter amounts are rejected', async () => {
    const f = fixture(), p = await f.proposal();
    await expect(f.caller(actorA).respondToPurchaseProposal({ proposalId: p.id, action: 'counter', amount: '1200' })).rejects.toThrow('different amount');
    for (const amount of [undefined, '0', '-1', '1.001', 'NaN']) await expect(f.caller(actorA).respondToPurchaseProposal({ proposalId: p.id, action: 'counter', amount })).rejects.toMatchObject({ code: 'BAD_REQUEST' });
    expect(f.state.proposals[0].status).toBe('pending');
    expect(f.state.ledger).toEqual([]);
});

test('approval rechecks current cash and leaves the pending proposal unchanged if funds are insufficient', async () => {
    const f = fixture(), p = await f.proposal();
    f.state.wallets[0].balance = '100.00';
    await expect(f.caller(actorA).respondToPurchaseProposal({ proposalId: p.id, action: 'approve' })).rejects.toThrow('No money has been spent');
    expect(f.state.proposals[0].status).toBe('pending');
    expect(f.state.wallets[0].balance).toBe('100.00');
    expect(f.state.ledger).toEqual([]);
});

test('concurrent approval retries serialize and debit a proposal only once', async () => {
    const f = fixture(), p = await f.proposal();
    const results = await Promise.all([1, 2].map(() => f.caller(actorA).respondToPurchaseProposal({ proposalId: p.id, action: 'approve' })));
    expect(results.map(result => result.alreadyDecided)).toEqual([false, true]);
    expect(f.state.ledger).toHaveLength(1);
    expect(f.state.wallets[0].balance).toBe('820.00');
});

test('two pending purchases cannot both spend the same remaining cash', async () => {
    const f = fixture(), first = await f.proposal(), second = await f.proposal();
    const results = await Promise.allSettled([first, second].map(p => f.caller(actorA).respondToPurchaseProposal({ proposalId: p.id, action: 'approve' })));
    expect(results.filter(result => result.status === 'fulfilled')).toHaveLength(1);
    expect(results.filter(result => result.status === 'rejected')).toHaveLength(1);
    expect(f.state.ledger).toHaveLength(1);
    expect(f.state.wallets[0].balance).toBe('820.00');
    expect(f.state.proposals.map(p => p.status).sort()).toEqual(['approved', 'pending']);
});

test('proposal persistence failure rolls back both the ledger insert and balance debit', async () => {
    const f = fixture({ failProposalUpdate: true }), p = await f.proposal();
    await expect(f.caller(actorA).respondToPurchaseProposal({ proposalId: p.id, action: 'approve' })).rejects.toThrow('Simulated proposal persistence failure');
    expect(f.state.ledger).toEqual([]);
    expect(f.state.wallets[0].balance).toBe('2020.00');
    expect(f.state.proposals[0].status).toBe('pending');
});

test('decline spends nothing, an identical retry succeeds, and later approval conflicts', async () => {
    const f = fixture(), p = await f.proposal();
    expect(await f.caller(actorA).respondToPurchaseProposal({ proposalId: p.id, action: 'decline' })).toMatchObject({ proposal: { status: 'declined' }, transactionId: null });
    expect(await f.caller(actorA).respondToPurchaseProposal({ proposalId: p.id, action: 'decline' })).toMatchObject({ alreadyDecided: true });
    await expect(f.caller(actorA).respondToPurchaseProposal({ proposalId: p.id, action: 'approve' })).rejects.toMatchObject({ code: 'CONFLICT' });
    expect(f.state.ledger).toEqual([]);
});

test('offer authors can withdraw and remaining adults can close abandoned proposals without spending', async () => {
    const own = fixture(), ownProposal = await own.proposal();
    expect((await own.caller(actorB).respondToPurchaseProposal({ proposalId: ownProposal.id, action: 'decline' })).proposal.status).toBe('declined');
    expect(own.state.ledger).toEqual([]);
    const abandoned = fixture(), proposal = await abandoned.proposal();
    abandoned.state.members.find(member => member.userId === actorB).status = 'left';
    const row = (await abandoned.caller(actorA).purchaseProposals()).proposals[0];
    expect(row).toMatchObject({ canRespond: false, canDecline: true });
    await expect(abandoned.caller(actorA).respondToPurchaseProposal({ proposalId: proposal.id, action: 'approve' })).rejects.toMatchObject({ code: 'BAD_REQUEST' });
    expect((await abandoned.caller(actorA).respondToPurchaseProposal({ proposalId: proposal.id, action: 'decline' })).proposal.status).toBe('declined');
    expect(abandoned.state.ledger).toEqual([]);
});

test('pending proposals remain visible behind more than one hundred decided rows', async () => {
    const f = fixture(), pending = await f.proposal();
    for (let i = 0; i < 105; i++) f.state.proposals.unshift({ ...pending, id: makeId(1000 + i), status: 'approved' });
    const rows = (await f.caller(actorA).purchaseProposals()).proposals;
    expect(rows.some(row => row.id === pending.id)).toBe(true);
    expect(rows.filter(row => row.status === 'approved')).toHaveLength(100);
});

test('archived wallets allow closing proposals but cannot spend', async () => {
    const f = fixture(), proposal = await f.proposal();
    f.state.wallets[0].archivedAt = new Date();
    await expect(f.caller(actorA).respondToPurchaseProposal({ proposalId: proposal.id, action: 'approve' })).rejects.toThrow('archived');
    expect((await f.caller(actorA).respondToPurchaseProposal({ proposalId: proposal.id, action: 'decline' })).proposal.status).toBe('declined');
    expect(f.state.ledger).toEqual([]);
});

test('agreement is visible to adults; only owner/guardian can edit, and names appear in proposal responses', async () => {
    const f = fixture();
    expect(await f.caller(actorA).purchaseAgreement()).toMatchObject({ limit: '1000.00', currencyRule: 'wallet', canEdit: true });
    expect(await f.caller(actorB).purchaseAgreement()).toMatchObject({ canEdit: false });
    await expect(f.caller(child).purchaseAgreement()).rejects.toMatchObject({ code: 'FORBIDDEN' });
    await expect(f.caller(actorB).updatePurchaseAgreement({ limit: '1500' })).rejects.toMatchObject({ code: 'FORBIDDEN' });
    expect(await f.caller(actorA).updatePurchaseAgreement({ limit: '1500' })).toMatchObject({ limit: '1500.00', updatedByName: 'Alex Martinez' });
    const p = await f.proposal(actorB, '1600');
    const list = await f.caller(actorA).purchaseProposals();
    expect(list.proposals).toEqual([expect.objectContaining({ id: p.id, walletName: 'Household spending', currencyCode: 'USD', walletBalance: '2020.00', proposerName: 'Jordan Martinez', canRespond: true })]);
    expect((await f.caller(actorB).purchaseProposals()).proposals[0].canRespond).toBe(false);
    await expect(f.caller(child).purchaseProposals()).rejects.toMatchObject({ code: 'FORBIDDEN' });
});

test('an active guardian can edit the agreement and any other active adult can review an initial offer', async () => {
    const f = fixture();
    f.state.members.find(member => member.userId === actorB).isGuardian = true;
    expect(await f.caller(actorB).updatePurchaseAgreement({ limit: '900' })).toMatchObject({ limit: '900.00', updatedByName: 'Jordan Martinez' });
    const third = 'sam';
    f.state.members.push({ id: makeId(5), userId: third, householdId, role: 'adult', isGuardian: false, status: 'active' });
    f.state.people.push({ id: third, name: 'Sam', email: 'sam@example.com', subscriptionTier: 'premium', testMode: false });
    const p = await f.proposal();
    expect(await f.caller(third).respondToPurchaseProposal({ proposalId: p.id, action: 'approve' })).toMatchObject({ proposal: { status: 'approved', decidedByUserId: third } });
});

test('changing membership after proposal creation does not allow a child or former adult to approve', async () => {
    for (const change of [{ role: 'child' }, { status: 'left' }]) {
        const f = fixture(), p = await f.proposal();
        Object.assign(f.state.members.find(member => member.userId === actorA), change);
        await expect(f.caller(actorA).respondToPurchaseProposal({ proposalId: p.id, action: 'approve' })).rejects.toMatchObject({ code: change.role ? 'FORBIDDEN' : 'NOT_FOUND' });
        expect(f.state.ledger).toEqual([]);
    }
});

test('configured demo adults can use the new agreement and proposal APIs through the application router', async () => {
    const keys = ['DEMO_OWNER_USER_ID', 'DEMO_PARTNER_USER_ID', 'DEMO_CHILD_USER_ID'] as const;
    const previous = Object.fromEntries(keys.map(key => [key, process.env[key]]));
    Object.assign(process.env, { DEMO_OWNER_USER_ID: actorA, DEMO_PARTNER_USER_ID: actorB, DEMO_CHILD_USER_ID: child });
    try {
        const f = fixture();
        expect(await f.caller(actorA).updatePurchaseAgreement({ limit: '1000' })).toMatchObject({ limit: '1000.00' });
        const p = await f.proposal();
        expect((await f.caller(actorA).purchaseProposals()).proposals).toHaveLength(1);
        await f.caller(actorA).respondToPurchaseProposal({ proposalId: p.id, action: 'counter', amount: '950' });
        expect(await f.caller(actorB).respondToPurchaseProposal({ proposalId: p.id, action: 'approve' })).toMatchObject({ proposal: { status: 'approved' } });
    } finally {
        for (const key of keys) { if (previous[key] === undefined) delete process.env[key]; else process.env[key] = previous[key]; }
    }
});
