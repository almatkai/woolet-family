import { expect, test } from 'bun:test';
import { PgDialect } from 'drizzle-orm/pg-core';
import { householdRouter } from '../../src/routers/household';
import { createMockContext } from '../utils';

const home = '11111111-1111-4111-8111-111111111111';
const categoryId = '22222222-2222-4222-8222-222222222222';
function setup(role = 'owner', isGuardian = false, category: any = { userId: null }) {
    const writes: any[] = []; const stored = new Map();
    const member = { id: home, userId: 'viewer', householdId: home, role, isGuardian, status: 'active' };
    const db: any = {
        query: { users: { findFirst: async () => ({ defaultCurrency: 'KZT' }) }, categories: { findFirst: async () => category } },
        select: () => { const chain: any = { from: () => chain, innerJoin: () => chain, where: () => chain, limit: async () => [{ membership: member, household: { ownerUserId: 'owner' } }] }; return chain; },
        insert: (table: any) => ({ values: (value: any) => ({ onConflictDoUpdate: (conflict: any) => ({ returning: async () => {
            writes.push({ value, conflict });
            const key = value.categoryId; const prior = stored.get(key);
            const result = prior ? { ...prior, ...conflict.set } : { id: home, ...value };
            stored.set(key, result); return [result];
        } }) }) }),
        delete: () => ({ where: async (where: any) => writes.push({ where }) }),
    };
    return { caller: householdRouter.createCaller(createMockContext({ userId: 'viewer', db })), writes };
}
for (const role of ['adult', 'child']) test(`${role} cannot edit or delete family budget`, async () => {
    const { caller, writes } = setup(role);
    await expect(caller.setBudget({ categoryId: null, amount: '100' })).rejects.toMatchObject({ code: 'FORBIDDEN' });
    await expect(caller.deleteBudget({ categoryId: null })).rejects.toMatchObject({ code: 'FORBIDDEN' });
    expect(writes).toHaveLength(0);
});
for (const category of [null, { userId: 'viewer' }]) test('invalid/personal category rejected', async () => {
    await expect(setup('owner', false, category).caller.setBudget({ categoryId, amount: '100' })).rejects.toMatchObject({ code: 'BAD_REQUEST' });
});
for (const id of [null, categoryId]) test(`budget upsert ${id} uses base currency and partial index`, async () => {
    const { caller, writes } = setup('adult', true);
    const first = await caller.setBudget({ categoryId: id, amount: '100' });
    const second = await caller.setBudget({ categoryId: id, amount: '200.12' });
    expect(second).toMatchObject({ id: first.id, amount: '200.12', currencyCode: 'KZT', householdId: home, updatedByUserId: 'viewer' });
    const dialect = new PgDialect();
    expect(dialect.sqlToQuery(writes[0].conflict.targetWhere).sql).toContain(id ? 'IS NOT NULL' : 'is null');
    await caller.deleteBudget({ categoryId: id });
    expect(dialect.sqlToQuery(writes[2].where).params).toEqual(id ? [home, id] : [home]);
});
for (const amount of ['0', '-1', '1.001', '1000000000000', 'NaN']) test(`reject invalid budget ${amount}`, async () => {
    await expect(setup().caller.setBudget({ categoryId: null, amount })).rejects.toMatchObject({ code: 'BAD_REQUEST' });
});
