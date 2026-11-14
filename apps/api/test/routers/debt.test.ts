import { describe, expect, test, mock } from "bun:test";
import { debtRouter } from "../../src/routers/debt";
import { createMockContext } from "../utils";
import { TRPCError } from "@trpc/server";

describe("Debt Router", () => {
    const mockUser = {
        id: "test-user-id",
        testMode: false
    };

    const balanceId = "123e4567-e89b-12d3-a456-426614174000";
    const debtId = "123e4567-e89b-12d3-a456-426614174001";
    const paymentId = "123e4567-e89b-12d3-a456-426614174002";
    const notificationId = "123e4567-e89b-12d3-a456-426614174003";
    const requesterDebtId = "123e4567-e89b-12d3-a456-426614174004";

    test("create should record debt and update balance", async () => {
        const mockBalance = {
            id: balanceId,
            balance: "1000",
            currencyCode: "USD",
            account: {
                bank: {
                    userId: "test-user-id"
                }
            }
        };

        const mockDb = {
            query: {
                users: {
                    findFirst: mock(() => Promise.resolve(mockUser)),
                },
                currencyBalances: {
                    findFirst: mock(() => Promise.resolve(mockBalance)),
                },
                categories: {
                    findFirst: mock(() => Promise.resolve({ id: 'cat-debt', name: 'Debt' }))
                },
                debts: {
                    findMany: mock(() => Promise.resolve([])), // for lazy cleanup
                }
            },
            insert: mock(() => ({
                values: mock(() => ({
                    returning: mock(() => Promise.resolve([{ id: debtId }]))
                }))
            })),
            update: mock(() => ({
                set: mock(() => ({
                    where: mock(() => Promise.resolve())
                }))
            })),
            select: mock(() => ({
                from: mock(() => ({
                    where: mock(() => Promise.resolve([{ count: 0 }]))
                }))
            }))
        };

        const ctx = createMockContext({ db: mockDb as any });
        const caller = debtRouter.createCaller(ctx);

        const result = await caller.create({
            personName: "John Doe",
            amount: 500,
            type: "they_owe",
            currencyBalanceId: balanceId
        });

        expect(result.id).toBe(debtId);
        expect(mockDb.insert).toHaveBeenCalled(); // Debt + Transaction
        expect(mockDb.update).toHaveBeenCalled(); // Balance update
    });

    test("create should allow a linked debt without tracking an account", async () => {
        const insert = mock(() => ({
            values: mock(() => ({
                returning: mock(() => Promise.resolve([{ id: debtId, currencyCode: "KZT" }]))
            }))
        }));
        const update = mock(() => ({
            set: mock(() => ({
                where: mock(() => Promise.resolve())
            }))
        }));
        const mockDb = {
            query: {
                users: {
                    findFirst: mock(() => Promise.resolve({ id: "linked-user-id" })),
                },
            },
            insert,
            update,
            select: mock(() => ({
                from: mock(() => ({
                    where: mock(() => Promise.resolve([{ count: 0 }]))
                }))
            }))
        };

        const ctx = createMockContext({ db: mockDb as any });
        const caller = debtRouter.createCaller(ctx);

        const result = await caller.create({
            personName: "@aknur",
            linkedUserId: "linked-user-id",
            amount: 300,
            type: "i_owe",
            currencyBalanceId: null,
            currencyCode: "KZT",
        });

        expect(result.id).toBe(debtId);
        expect(insert).toHaveBeenCalledTimes(3); // Sender debt + recipient debt + notification
        expect(update).not.toHaveBeenCalled(); // Historical debt must not affect an account
    });

    test("approve should not require or update an account for an untracked debt", async () => {
        const debtRecords = [
            {
                id: debtId,
                userId: "test-user-id",
                personName: "Aknur",
                type: "they_owe",
                currencyCode: "KZT",
            },
            {
                id: requesterDebtId,
                userId: "requester-user-id",
                personName: "Test User",
                type: "i_owe",
                currencyCode: "KZT",
            },
        ];
        const findBalance = mock(() => Promise.resolve(null));
        const findCategory = mock(() => Promise.resolve(null));
        const update = mock(() => ({
            set: mock(() => ({
                where: mock(() => Promise.resolve())
            }))
        }));
        const insert = mock(() => ({
            values: mock(() => Promise.resolve())
        }));
        const mockDb = {
            query: {
                notifications: {
                    findFirst: mock(() => Promise.resolve({
                        id: notificationId,
                        userId: "test-user-id",
                        actionTaken: false,
                        metadata: {
                            requestKind: "debt_transfer_request",
                            debtId,
                            senderDebtId: requesterDebtId,
                            requesterUserId: "requester-user-id",
                            amount: 300,
                            currencyCode: "KZT",
                            isTracked: false,
                            requesterCurrencyBalanceId: null,
                        },
                    })),
                },
                debts: {
                    findFirst: mock(() => Promise.resolve(debtRecords.shift())),
                },
                users: {
                    findFirst: mock(() => Promise.resolve({
                        id: "requester-user-id",
                        name: "Requester",
                        username: "requester",
                        testMode: false,
                    })),
                },
                currencyBalances: { findFirst: findBalance },
                categories: { findFirst: findCategory },
            },
            update,
            insert,
        };

        const ctx = createMockContext({ db: mockDb as any });
        const caller = debtRouter.createCaller(ctx);

        const result = await caller.respondToIncomingRequest({
            notificationId,
            decision: "approve",
        });

        expect(result).toEqual({ success: true, outcome: "approved" });
        expect(findBalance).not.toHaveBeenCalled();
        expect(findCategory).not.toHaveBeenCalled();
        expect(update).toHaveBeenCalledTimes(2); // Recipient debt + request notification
    });

    test("addPayment should update debt and balance", async () => {
        const mockDebt = {
            id: debtId,
            userId: "test-user-id",
            amount: "1000",
            paidAmount: "0",
            type: "they_owe",
            currencyBalanceId: balanceId,
            currencyBalance: {
                currencyCode: "USD"
            },
            createdAt: new Date()
        };

        const mockDb = {
            query: {
                users: {
                    findFirst: mock(() => Promise.resolve(mockUser)),
                },
                debts: {
                    findFirst: mock(() => Promise.resolve(mockDebt)),
                },
                currencyBalances: {
                    findMany: mock(() => Promise.resolve([{ id: balanceId, currencyCode: "USD" }])),
                    findFirst: mock(() => Promise.resolve({ id: balanceId, currencyCode: "USD" }))
                },
                categories: {
                    findFirst: mock(() => Promise.resolve({ id: 'cat-repay', name: 'Debt Repayment' }))
                }
            },
            insert: mock(() => ({
                values: mock(() => ({
                    returning: mock(() => Promise.resolve([{ id: paymentId }]))
                }))
            })),
            update: mock(() => ({
                set: mock(() => ({
                    where: mock(() => Promise.resolve())
                }))
            }))
        };

        const ctx = createMockContext({ db: mockDb as any });
        const caller = debtRouter.createCaller(ctx);

        const result = await caller.addPayment({
            debtId: debtId,
            amount: 500,
            paymentDate: new Date().toISOString(),
            distributions: [{
                currencyBalanceId: balanceId,
                amount: 500
            }]
        });

        expect(result.success).toBe(true);
        expect(mockDb.update).toHaveBeenCalled(); // Update debt paidAmount + update balance
    });
});
