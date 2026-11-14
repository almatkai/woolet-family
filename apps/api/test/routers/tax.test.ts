import { describe, test, expect, mock, spyOn, setSystemTime } from 'bun:test';
import { PgDialect } from 'drizzle-orm/pg-core';
import type { SQL } from 'drizzle-orm';
import { taxRouter } from '../../src/routers/tax';
import { userRouter } from '../../src/routers/user';
import { taxProfiles, taxEstimatedPayments, transactions } from '../../src/db/schema';
import { taxProfileSchema } from '../../src/lib/tax/input';
import { CurrencyService } from '../../src/services/currency';
import { investingCache } from '../../src/lib/investing-cache';
import { createMockContext } from '../utils';
const id = 'd46f107f-96b0-4e51-bd72-9a2f90ea9864';
const otherId = '5f468dc8-b775-463c-84e5-ad3c3b6ee701';
const toSql = (query: SQL) => new PgDialect().sqlToQuery(query);
const profile = taxProfileSchema.parse({
    taxYear: 2026,
    filingStatus: 'single',
    state: 'TX',
    wageIncome: 85000,
});
const row = { ...profile, id, userId: 'test-user-id', createdAt: new Date(), updatedAt: new Date() };
function joinQuery(rows: object[]) {
    const where = mock((_condition: SQL) =>
        Object.assign(Promise.resolve(rows), { limit: mock(() => Promise.resolve(rows)) }),
    );
    const join = { innerJoin: mock((_table: unknown, _on: unknown) => join), where };
    return { select: mock(() => ({ from: mock(() => join) })), where };
}
describe('Tax router', () => {
    test('profiles are scoped to user/year and decimals converted to numbers', async () => {
        const findFirst = mock((_options: unknown) => Promise.resolve({ ...row, wageIncome: '85000.00' }));
        const caller = taxRouter.createCaller(
            createMockContext({ db: { query: { taxProfiles: { findFirst } } } as any }),
        );
        expect((await caller.getProfile({ taxYear: 2026 }))?.wageIncome).toBe(85000);
        const query = toSql((findFirst.mock.calls[0][0] as { where: SQL }).where);
        expect(query.params).toContain('test-user-id');
        expect(query.params).toContain(2026);
        expect(await caller.getStates()).toHaveLength(51);
    });
    test('upsert writes USD decimal strings and conflicts only on user/year', async () => {
        let values: any, conflict: any;
        const ctx = createMockContext({
            db: {
                insert: mock(() => ({
                    values: mock((v: any) => {
                        values = v;
                        return {
                            onConflictDoUpdate: mock((c: any) => {
                                conflict = c;
                                return { returning: mock(() => Promise.resolve([row])) };
                            }),
                        };
                    }),
                })),
            } as any,
        });
        await taxRouter.createCaller(ctx).upsertProfile(profile);
        expect(values.userId).toBe('test-user-id');
        expect(values.wageIncome).toBe('85000');
        expect(conflict.target).toEqual([taxProfiles.userId, taxProfiles.taxYear]);
        expect(conflict.set.updatedAt).toBeInstanceOf(Date);
    });
    test('transaction income filters ownership, test mode, category and year in USD', async () => {
        const query = joinQuery([
            { amount: '1000', currency: 'USD', category: 'Salary' },
            { amount: '500', currency: 'USD', category: 'Bonuses' },
            { amount: '200', currency: 'USD', category: 'Freelance Work' },
        ]);
        const ctx = createMockContext({ db: query as any, user: { id: 'test-user-id', testMode: true } });
        const income = await taxRouter.createCaller(ctx).getTransactionIncome({ taxYear: 2025 });
        expect(income.wageYtd).toBe(1500);
        expect(income.selfEmploymentYtd).toBe(200);
        expect(income.wageProjected).toBe(1500);
        const sql = toSql(query.where.mock.calls[0][0]);
        expect(sql.sql).toContain('"banks"."is_test"');
        expect(sql.params).toContain(true);
        expect(sql.params).toContain('test-user-id');
        expect(sql.params).toContain('Salary');
        expect(sql.params).toContain('Freelance Work');
        expect(sql.params).toContain('2025-01-01');
        expect(sql.params).toContain('2025-12-31');
    });
    test('foreign transaction income converts to USD using the existing rate helper', async () => {
        const rateSpy = spyOn(CurrencyService, 'getRate').mockResolvedValue(1.1);
        try {
            const query = joinQuery([
                { amount: '1000', currency: 'EUR', category: 'Salary' },
                { amount: '200', currency: 'EUR', category: 'Freelance Work' },
            ]);
            const caller = taxRouter.createCaller(createMockContext({ db: query as any }));
            const income = await caller.getTransactionIncome({ taxYear: 2025 });
            expect(income.wageYtd).toBe(1100);
            expect(income.selfEmploymentYtd).toBeCloseTo(220, 8);
            expect(rateSpy).toHaveBeenCalledTimes(1);
            expect(rateSpy).toHaveBeenCalledWith('EUR', 'USD');
        } finally {
            rateSpy.mockRestore();
        }
    });
    test('estimate replaces saved annual wages with transaction projection', async () => {
        const query = joinQuery([{ amount: '50000', currency: 'USD', category: 'Salary' }]);
        const caller = taxRouter.createCaller(
            createMockContext({
                db: {
                    ...query,
                    query: {
                        taxProfiles: {
                            findFirst: mock(() =>
                                Promise.resolve({ ...row, taxYear: 2025, useTransactionsForIncome: true }),
                            ),
                        },
                        taxEstimatedPayments: { findMany: mock(() => Promise.resolve([])) },
                    },
                } as any,
            }),
        );
        const result = await caller.estimate({ taxYear: 2025 });
        expect(result?.derivedIncome?.wageYtd).toBe(50000);
        expect(result?.grossIncome).toBe(50000);
        expect(result?.tablesVerified).toBe(false);
    });
    test('estimate and transaction projection honor the client calendar date', async () => {
        const query = joinQuery([{ amount: '50000', currency: 'USD', category: 'Salary' }]);
        const caller = taxRouter.createCaller(
            createMockContext({
                db: {
                    ...query,
                    query: {
                        taxProfiles: {
                            findFirst: mock(() => Promise.resolve({ ...row, useTransactionsForIncome: true })),
                        },
                        taxEstimatedPayments: { findMany: mock(() => Promise.resolve([])) },
                    },
                } as any,
            }),
        );
        const input = { taxYear: 2026 as const, today: '2026-04-15' };
        const result = await caller.estimate(input);
        expect(result?.nextPayment?.quarter).toBe(1);
        expect(result?.nextPayment?.daysUntil).toBe(0);
        expect(result?.grossIncome).toBeCloseTo((50000 * 365) / 105, 2);
        expect(toSql(query.where.mock.calls[0][0]).params).toContain(input.today);
        const income = await caller.getTransactionIncome(input);
        expect(income.wageProjected).toBeCloseTo((50000 * 365) / 105, 2);
        await expect(caller.estimate({ ...input, today: '2026-02-30' })).rejects.toMatchObject({
            code: 'BAD_REQUEST',
        });
    });
    test('manual payment records USD without changing account balances', async () => {
        let saved: any;
        const caller = taxRouter.createCaller(
            createMockContext({
                db: {
                    insert: mock(() => ({
                        values: mock((v: any) => {
                            saved = v;
                            return { returning: mock(() => Promise.resolve([{ id, ...v }])) };
                        }),
                    })),
                } as any,
            }),
        );
        await caller.addEstimatedPayment({
            taxYear: 2026,
            jurisdiction: 'federal',
            quarter: 2,
            amount: 250,
            paidOn: '2026-06-15',
        });
        expect(saved.amount).toBe('250');
        expect(saved.transactionId).toBeNull();
        expect(saved.userId).toBe('test-user-id');
    });
    test('payment date may be the local today ahead of UTC, but not later', async () => {
        const insert = mock(() => ({
            values: mock((v: any) => ({ returning: mock(() => Promise.resolve([{ id, ...v }])) })),
        }));
        const caller = taxRouter.createCaller(createMockContext({ db: { insert } as any }));
        const base = { taxYear: 2026 as const, jurisdiction: 'federal' as const, quarter: 4 as const, amount: 100 };
        setSystemTime(new Date('2026-11-14T20:30:00Z'));
        try {
            await expect(caller.addEstimatedPayment({ ...base, paidOn: '2026-11-15' })).resolves.toBeDefined();
            await expect(caller.addEstimatedPayment({ ...base, paidOn: '2026-11-16' })).rejects.toMatchObject({
                code: 'BAD_REQUEST',
            });
        } finally {
            setSystemTime();
        }
    });
    test('linked payment rejects expense transactions outside current ownership/mode', async () => {
        const query = joinQuery([]);
        const ctx = createMockContext({ db: query as any, user: { id: 'test-user-id', testMode: true } });
        await expect(
            taxRouter.createCaller(ctx).addEstimatedPayment({
                taxYear: 2026,
                jurisdiction: 'federal',
                quarter: 1,
                amount: 100,
                paidOn: '2026-04-15',
                transactionId: id,
            }),
        ).rejects.toMatchObject({ code: 'BAD_REQUEST' });
        const sql = toSql(query.where.mock.calls[0][0]);
        expect(sql.params).toContain(true);
        expect(sql.params).toContain('expense');
        expect(sql.params).toContain('test-user-id');
    });
    test('deletion is user-scoped and reports missing payments', async () => {
        const where = mock((_condition: SQL) => ({ returning: mock(() => Promise.resolve([])) }));
        const caller = taxRouter.createCaller(
            createMockContext({ db: { delete: mock(() => ({ where })) } as any }),
        );
        await expect(caller.deleteEstimatedPayment({ id })).rejects.toMatchObject({ code: 'NOT_FOUND' });
        expect(toSql(where.mock.calls[0][0]).params).toEqual([id, 'test-user-id']);
    });
    test('unconfigured year returns null', async () => {
        const caller = taxRouter.createCaller(createMockContext());
        expect(await caller.getProfile({ taxYear: 2026 })).toBeNull();
        expect(await caller.estimate({ taxYear: 2026 })).toBeNull();
    });
});
describe('Tax data sync', () => {
    test('export includes tax rows and clears links omitted by export history limits', async () => {
        const ctx = createMockContext({
            db: {
                select: mock(() => ({
                    from: mock(() => ({ where: mock(() => Promise.resolve([{ value: 0 }])) })),
                })),
                query: {
                    taxProfiles: { findMany: mock(() => Promise.resolve([row])) },
                    taxEstimatedPayments: {
                        findMany: mock(() =>
                            Promise.resolve([
                                {
                                    id: otherId,
                                    userId: 'test-user-id',
                                    transactionId: id,
                                    quarter: 1,
                                    amount: '100',
                                },
                            ]),
                        ),
                    },
                },
            } as any,
        });
        const result = await userRouter.createCaller(ctx).exportAllData();
        expect(result.data.taxProfiles[0]).toMatchObject({ id, taxYear: 2026 });
        expect(result.data.taxProfiles[0]).not.toHaveProperty('userId');
        expect(result.data.taxEstimatedPayments[0]).toMatchObject({ id: otherId, transactionId: null });
    });
    test('import remaps IDs, restores timestamps/user and detaches missing transactions', async () => {
        const inserted = new Map<unknown, any[]>(),
            deleted: unknown[] = [];
        const tx = {
            query: { categories: { findMany: mock(() => Promise.resolve([])) } },
            delete: mock((table: unknown) => {
                deleted.push(table);
                return { where: mock(() => Promise.resolve()) };
            }),
            insert: mock((table: unknown) => ({
                values: mock((values: any[]) => {
                    inserted.set(table, values);
                    return Promise.resolve();
                }),
            })),
        };
        const ctx = createMockContext({
            db: { transaction: mock((callback: (tx: any) => Promise<unknown>) => callback(tx)) } as any,
        });
        const cacheSpy = spyOn(investingCache, 'invalidatePattern').mockResolvedValue();
        try {
            await userRouter.createCaller(ctx).importData({
                data: {
                    taxProfiles: [
                        {
                            ...row,
                            createdAt: '2026-01-01T00:00:00.000Z',
                            updatedAt: '2026-01-01T00:00:00.000Z',
                        },
                    ],
                    taxEstimatedPayments: [
                        {
                            id: otherId,
                            userId: 'another-user',
                            taxYear: 2026,
                            quarter: 1,
                            jurisdiction: 'federal',
                            amount: '100',
                            paidOn: '2026-04-15',
                            transactionId: id,
                        },
                    ],
                },
            });
            const savedProfile = inserted.get(taxProfiles)![0],
                savedPayment = inserted.get(taxEstimatedPayments)![0];
            expect(savedProfile.id).not.toBe(id);
            expect(savedPayment.id).not.toBe(otherId);
            expect(savedProfile.userId).toBe('test-user-id');
            expect(savedPayment.userId).toBe('test-user-id');
            expect(savedProfile.createdAt).toBeInstanceOf(Date);
            expect(savedPayment.paidOn).toBe('2026-04-15');
            expect(savedPayment.transactionId).toBeNull();
            expect(deleted).toEqual([taxProfiles, taxEstimatedPayments]);
        } finally {
            cacheSpy.mockRestore();
        }
    });
    test('import preserves a payment link to its remapped expense transaction', async () => {
        const [bankId, accountId, balanceId, categoryId, transactionId, paymentId] = Array.from(
            { length: 6 },
            () => crypto.randomUUID(),
        );
        const inserted = new Map<unknown, any[]>();
        const tx = createMockContext({
            db: {
                query: { currencies: { findMany: mock(() => Promise.resolve([{ code: 'USD' }])) } },
                insert: mock((table: unknown) => ({
                    values: mock((values: any[]) => {
                        inserted.set(table, values);
                        return Promise.resolve();
                    }),
                })),
            } as any,
        }).db;
        const ctx = createMockContext({
            db: { transaction: mock((callback: (tx: any) => Promise<unknown>) => callback(tx)) } as any,
        });
        const cacheSpy = spyOn(investingCache, 'invalidatePattern').mockResolvedValue();
        try {
            await userRouter.createCaller(ctx).importData({
                data: {
                    banks: [{ id: bankId, name: 'Bank' }],
                    accounts: [{ id: accountId, bankId, name: 'Checking', type: 'checking' }],
                    currencyBalances: [{ id: balanceId, accountId, currencyCode: 'USD', balance: '100' }],
                    categories: [
                        { id: categoryId, name: 'Taxes', type: 'expense', icon: '$', color: '#A1A1AA' },
                    ],
                    transactions: [
                        {
                            id: transactionId,
                            currencyBalanceId: balanceId,
                            categoryId,
                            amount: '100',
                            type: 'expense',
                            date: '2026-04-15',
                        },
                    ],
                    taxEstimatedPayments: [
                        {
                            id: paymentId,
                            taxYear: 2026,
                            quarter: 1,
                            jurisdiction: 'federal',
                            amount: '100',
                            paidOn: '2026-04-15',
                            transactionId,
                        },
                    ],
                },
            });
            const savedTransaction = inserted.get(transactions)![0];
            const savedPayment = inserted.get(taxEstimatedPayments)![0];
            expect(savedTransaction.id).not.toBe(transactionId);
            expect(savedPayment.transactionId).toBe(savedTransaction.id);
        } finally {
            cacheSpy.mockRestore();
        }
    });
});
