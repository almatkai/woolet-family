import { describe, expect, test, mock, spyOn } from 'bun:test';
import { investingCache } from '../../src/lib/investing-cache';
import { getTableConfig } from 'drizzle-orm/pg-core';
import { prepareFamilyForUserDeletion } from '../../src/lib/household/membership-cleanup';
import { familyWallets, familyWalletTransactions, householdMembers, households, users } from '../../src/db/schema';
import { userRouter } from '../../src/routers/user';
import { createMockContext } from '../utils';

function transactionFixture(options: { owner?: boolean; others?: boolean; role?: 'adult' | 'child'; wallet?: boolean } = {}) {
    const changes: { table: unknown; values: any }[] = [];
    const deleted: unknown[] = [];
    let householdSelects = 0;
    const member = { id: 'member', householdId: 'family', userId: 'test-user-id', status: 'active', role: options.role ?? 'adult' };
    const tx: any = {
        select: () => ({ from: (table: unknown) => ({ where: () => {
            let rows: any[] = [];
            if (table === households) rows = householdSelects++ === 0 && options.owner ? [{ id: 'family' }] : [];
            if (table === householdMembers) rows = options.owner ? (options.others ? [{ id: 'other' }] : []) : [member];
            if (table === familyWallets && options.wallet) rows = [{ id: 'wallet' }];
            return { for: async () => rows, limit: async () => rows, then: (fn: any) => Promise.resolve(rows).then(fn) };
        } }) }),
        update: (table: unknown) => ({ set: (values: any) => ({ where: async () => { changes.push({ table, values }); } }) }),
        delete: (table: unknown) => ({ where: async () => { deleted.push(table); } }),
        insert: (table: unknown) => ({ values: async (values: any) => { changes.push({ table, values }); } }),
    };
    return { tx, changes, deleted };
}

describe('family-aware user operations', () => {
    test.each(['deleteAllData', 'deleteAccount'] as const)('%s rejects an owner with active members', async operation => {
        const { tx, deleted } = transactionFixture({ owner: true, others: true });
        const ctx = createMockContext({ db: { transaction: (fn: any) => fn(tx) } as any });
        await expect(userRouter.createCaller(ctx)[operation]()).rejects.toMatchObject({ code: 'BAD_REQUEST', message: 'Remove family members or leave your family before deleting your data' });
        expect(deleted).toHaveLength(0);
    });
    test('owner alone removes the household', async () => {
        const { tx, deleted } = transactionFixture({ owner: true });
        await prepareFamilyForUserDeletion(tx, 'test-user-id');
        expect(deleted).toContain(households);
    });
    test.each(['adult', 'child'] as const)('%s leaves and child wallets are archived', async role => {
        const { tx, changes } = transactionFixture({ role });
        await prepareFamilyForUserDeletion(tx, 'test-user-id');
        expect(changes).toContainEqual({ table: householdMembers, values: { status: 'left', leftAt: expect.any(Date) } });
        expect(changes).toContainEqual({ table: familyWallets, values: { archivedAt: expect.any(Date) } });
    });
    test('account deletion archives child wallets without creating placeholder users; FKs keep history', async () => {
        const { tx, changes } = transactionFixture({ role: 'child', wallet: true });
        await prepareFamilyForUserDeletion(tx, 'test-user-id', { deleteAccount: true });
        expect(changes.find(c => c.table === users)).toBeUndefined();
        expect(changes).toContainEqual({ table: familyWallets, values: { archivedAt: expect.any(Date) } });
        const authorFk = getTableConfig(familyWalletTransactions).foreignKeys.find(fk => fk.reference().columns[0] === familyWalletTransactions.createdByUserId);
        expect(authorFk?.onDelete).toBe('set null');
        const childFk = getTableConfig(familyWallets).foreignKeys.find(fk => fk.reference().columns[0] === familyWallets.childMemberId);
        expect(childFk?.onDelete).toBe('set null');
    });
    test('export excludes family tables', async () => {
        const ctx = createMockContext({ db: {
            select: () => ({ from: () => ({ where: async () => [{ value: 0 }] }) }),
            insert: () => ({ values: async () => {} }),
        } as any });
        const result = await userRouter.createCaller(ctx).exportAllData();
        for (const key of ['households', 'householdMembers', 'householdInvitations', 'familyWallets', 'familyWalletTransactions', 'familyBudgetLimits']) expect(result.data).not.toHaveProperty(key);
    });
    test('import ignores family keys, including malformed family data', async () => {
        const ctx = createMockContext();
        const inserted = mock(() => { throw new Error('Unexpected insert'); });
        const tx = { query: ctx.db.query, insert: inserted };
        (ctx.db as any).transaction = (fn: any) => fn(tx);
        const cache = spyOn(investingCache, 'invalidatePattern').mockResolvedValue();
        try {
            await userRouter.createCaller(ctx).importData({ data: { households: { secret: true }, householdMembers: null, familyWallets: [{ id: 'other' }], family_wallet_transactions: 'invalid' } });
            expect(inserted).not.toHaveBeenCalled();
        } finally {
            cache.mockRestore();
        }
    });
});
