export declare const splitBillRouter: import("@trpc/server").CreateRouterInner<import("@trpc/server").RootConfig<{
    ctx: import("../lib/trpc").Context;
    meta: object;
    errorShape: import("@trpc/server").DefaultErrorShape;
    transformer: typeof import("superjson").default;
}>, {
    listParticipants: import("@trpc/server").BuildProcedure<"query", {
        _config: import("@trpc/server").RootConfig<{
            ctx: import("../lib/trpc").Context;
            meta: object;
            errorShape: import("@trpc/server").DefaultErrorShape;
            transformer: typeof import("superjson").default;
        }>;
        _meta: object;
        _ctx_out: {
            userId: string;
            user: {
                id: string;
                email: string;
                name: string | null;
                username: string | null;
                defaultCurrency: string;
                subscriptionTier: "free" | "pro" | "premium";
                testMode: boolean;
                preferences: unknown;
                createdAt: Date;
                updatedAt: Date;
            };
            db: import("drizzle-orm/postgres-js").PostgresJsDatabase<typeof import("../db/schema")> & {
                $client: import("postgres").Sql<{}>;
            };
            honoContext: import("hono").Context<any, any, {}>;
        };
        _input_in: {
            includeInactive?: boolean | undefined;
        } | undefined;
        _input_out: {
            includeInactive: boolean;
        } | undefined;
        _output_in: typeof import("@trpc/server").unsetMarker;
        _output_out: typeof import("@trpc/server").unsetMarker;
    }, {
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        color: string | null;
        linkedUserId: string | null;
        linkedUsername: string | null;
        contactType: "email" | "telegram" | "whatsapp" | "phone" | "other" | null;
        contactValue: string | null;
        isActive: boolean;
        linkedUser: {
            id: string;
            name: string | null;
            username: string | null;
        } | null;
    }[]>;
    getPendingSplits: import("@trpc/server").BuildProcedure<"query", {
        _config: import("@trpc/server").RootConfig<{
            ctx: import("../lib/trpc").Context;
            meta: object;
            errorShape: import("@trpc/server").DefaultErrorShape;
            transformer: typeof import("superjson").default;
        }>;
        _meta: object;
        _ctx_out: {
            userId: string;
            user: {
                id: string;
                email: string;
                name: string | null;
                username: string | null;
                defaultCurrency: string;
                subscriptionTier: "free" | "pro" | "premium";
                testMode: boolean;
                preferences: unknown;
                createdAt: Date;
                updatedAt: Date;
            };
            db: import("drizzle-orm/postgres-js").PostgresJsDatabase<typeof import("../db/schema")> & {
                $client: import("postgres").Sql<{}>;
            };
            honoContext: import("hono").Context<any, any, {}>;
        };
        _input_in: {
            status?: "pending" | "partial" | "settled" | undefined;
        } | undefined;
        _input_out: {
            status?: "pending" | "partial" | "settled" | undefined;
        } | undefined;
        _output_in: typeof import("@trpc/server").unsetMarker;
        _output_out: typeof import("@trpc/server").unsetMarker;
    }, {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        paidAmount: string;
        status: "pending" | "partial" | "settled";
        note: string | null;
        transactionId: string;
        participantId: string;
        owedAmount: string;
        payments: {
            id: string;
            createdAt: Date;
            amount: string;
            paidAt: Date;
            note: string | null;
            splitId: string;
            receivedToCurrencyBalanceId: string | null;
            linkedTransactionId: string | null;
        }[];
        transaction: {
            date: string;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            exchangeRate: string;
            type: string;
            description: string | null;
            currencyBalanceId: string;
            amount: string;
            lifecycleStatus: string;
            debtId: string | null;
            categoryId: string;
            fee: string;
            cashbackAmount: string | null;
            toAmount: string | null;
            toCurrencyBalanceId: string | null;
            debtPaymentId: string | null;
            excludeFromMonthlyStats: boolean;
            parentTransactionId: string | null;
            idempotencyKey: string | null;
            currencyBalance: {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                accountId: string;
                currencyCode: string;
                balance: string;
                account: {
                    id: string;
                    name: string;
                    createdAt: Date;
                    updatedAt: Date;
                    icon: string | null;
                    type: string;
                    bankId: string;
                    last4Digits: string | null;
                    bank: {
                        id: string;
                        name: string;
                        createdAt: Date;
                        updatedAt: Date;
                        userId: string;
                        icon: string | null;
                        color: string | null;
                        isTest: boolean;
                    };
                };
                currency: {
                    symbol: string;
                    name: string;
                    code: string;
                    decimalPlaces: number;
                    exchangeRate: string;
                };
            };
            category: {
                id: string;
                name: string;
                createdAt: Date;
                userId: string | null;
                icon: string;
                color: string;
                type: string;
            };
        };
        participant: {
            id: string;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            userId: string;
            color: string | null;
            linkedUserId: string | null;
            linkedUsername: string | null;
            contactType: "email" | "telegram" | "whatsapp" | "phone" | "other" | null;
            contactValue: string | null;
            isActive: boolean;
        };
    }[]>;
    listIncomingRequests: import("@trpc/server").BuildProcedure<"query", {
        _config: import("@trpc/server").RootConfig<{
            ctx: import("../lib/trpc").Context;
            meta: object;
            errorShape: import("@trpc/server").DefaultErrorShape;
            transformer: typeof import("superjson").default;
        }>;
        _meta: object;
        _ctx_out: {
            userId: string;
            user: {
                id: string;
                email: string;
                name: string | null;
                username: string | null;
                defaultCurrency: string;
                subscriptionTier: "free" | "pro" | "premium";
                testMode: boolean;
                preferences: unknown;
                createdAt: Date;
                updatedAt: Date;
            };
            db: import("drizzle-orm/postgres-js").PostgresJsDatabase<typeof import("../db/schema")> & {
                $client: import("postgres").Sql<{}>;
            };
            honoContext: import("hono").Context<any, any, {}>;
        };
        _input_in: {
            limit?: number | undefined;
        } | undefined;
        _input_out: {
            limit: number;
        } | undefined;
        _output_in: typeof import("@trpc/server").unsetMarker;
        _output_out: typeof import("@trpc/server").unsetMarker;
    }, {
        fromUser: {
            id: string;
            name: string | null;
            username: string | null;
            testMode: boolean;
            preferences: unknown;
        } | null;
        remainingAmount: number;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        paidAmount: string;
        status: "pending" | "partial" | "settled";
        note: string | null;
        transactionId: string;
        participantId: string;
        owedAmount: string;
        payments: {
            id: string;
            createdAt: Date;
            amount: string;
            paidAt: Date;
            note: string | null;
            splitId: string;
            receivedToCurrencyBalanceId: string | null;
            linkedTransactionId: string | null;
        }[];
        transaction: {
            date: string;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            exchangeRate: string;
            type: string;
            description: string | null;
            currencyBalanceId: string;
            amount: string;
            lifecycleStatus: string;
            debtId: string | null;
            categoryId: string;
            fee: string;
            cashbackAmount: string | null;
            toAmount: string | null;
            toCurrencyBalanceId: string | null;
            debtPaymentId: string | null;
            excludeFromMonthlyStats: boolean;
            parentTransactionId: string | null;
            idempotencyKey: string | null;
            currencyBalance: {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                accountId: string;
                currencyCode: string;
                balance: string;
                account: {
                    id: string;
                    name: string;
                    createdAt: Date;
                    updatedAt: Date;
                    icon: string | null;
                    type: string;
                    bankId: string;
                    last4Digits: string | null;
                    bank: {
                        id: string;
                        name: string;
                        createdAt: Date;
                        updatedAt: Date;
                        userId: string;
                        icon: string | null;
                        color: string | null;
                        isTest: boolean;
                    };
                };
                currency: {
                    symbol: string;
                    name: string;
                    code: string;
                    decimalPlaces: number;
                    exchangeRate: string;
                };
            };
            category: {
                id: string;
                name: string;
                createdAt: Date;
                userId: string | null;
                icon: string;
                color: string;
                type: string;
            };
        };
        participant: {
            id: string;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            userId: string;
            color: string | null;
            linkedUserId: string | null;
            linkedUsername: string | null;
            contactType: "email" | "telegram" | "whatsapp" | "phone" | "other" | null;
            contactValue: string | null;
            isActive: boolean;
        };
        receivingAccountSharingEnabled: boolean;
        receivingAccounts: {
            id: string;
            label: string;
            currencyCode: string;
        }[];
        sourceCategory: {
            id: string;
            name: string;
            type: string;
            userId: string | null;
        } | null;
        hasCategoryInMyList: boolean;
    }[]>;
    importIncomingSplitCategory: import("@trpc/server").BuildProcedure<"mutation", {
        _config: import("@trpc/server").RootConfig<{
            ctx: import("../lib/trpc").Context;
            meta: object;
            errorShape: import("@trpc/server").DefaultErrorShape;
            transformer: typeof import("superjson").default;
        }>;
        _meta: object;
        _ctx_out: {
            userId: string;
            user: {
                id: string;
                email: string;
                name: string | null;
                username: string | null;
                defaultCurrency: string;
                subscriptionTier: "free" | "pro" | "premium";
                testMode: boolean;
                preferences: unknown;
                createdAt: Date;
                updatedAt: Date;
            };
            db: import("drizzle-orm/postgres-js").PostgresJsDatabase<typeof import("../db/schema")> & {
                $client: import("postgres").Sql<{}>;
            };
            honoContext: import("hono").Context<any, any, {}>;
        };
        _input_in: {
            splitId: string;
        };
        _input_out: {
            splitId: string;
        };
        _output_in: typeof import("@trpc/server").unsetMarker;
        _output_out: typeof import("@trpc/server").unsetMarker;
    }, {
        category: {
            id: string;
            name: string;
            createdAt: Date;
            userId: string | null;
            icon: string;
            color: string;
            type: string;
        };
        imported: boolean;
    }>;
    listPendingIncomingReceipts: import("@trpc/server").BuildProcedure<"query", {
        _config: import("@trpc/server").RootConfig<{
            ctx: import("../lib/trpc").Context;
            meta: object;
            errorShape: import("@trpc/server").DefaultErrorShape;
            transformer: typeof import("superjson").default;
        }>;
        _meta: object;
        _ctx_out: {
            userId: string;
            user: {
                id: string;
                email: string;
                name: string | null;
                username: string | null;
                defaultCurrency: string;
                subscriptionTier: "free" | "pro" | "premium";
                testMode: boolean;
                preferences: unknown;
                createdAt: Date;
                updatedAt: Date;
            };
            db: import("drizzle-orm/postgres-js").PostgresJsDatabase<typeof import("../db/schema")> & {
                $client: import("postgres").Sql<{}>;
            };
            honoContext: import("hono").Context<any, any, {}>;
        };
        _input_in: {
            limit?: number | undefined;
        } | undefined;
        _input_out: {
            limit: number;
        } | undefined;
        _output_in: typeof import("@trpc/server").unsetMarker;
        _output_out: typeof import("@trpc/server").unsetMarker;
    }, {
        paymentId: string;
        splitId: string;
        amount: number;
        paidAt: Date;
        transactionId: string;
        transactionDescription: string;
        currencyCode: string;
        fromUser: {
            id: string;
            name: string | null;
            username: string | null;
        } | null;
        sourceCategory: {
            id: string;
            name: string;
            type: string;
            userId: string | null;
        } | null;
    }[]>;
    assignIncomingReceipt: import("@trpc/server").BuildProcedure<"mutation", {
        _config: import("@trpc/server").RootConfig<{
            ctx: import("../lib/trpc").Context;
            meta: object;
            errorShape: import("@trpc/server").DefaultErrorShape;
            transformer: typeof import("superjson").default;
        }>;
        _meta: object;
        _ctx_out: {
            userId: string;
            user: {
                id: string;
                email: string;
                name: string | null;
                username: string | null;
                defaultCurrency: string;
                subscriptionTier: "free" | "pro" | "premium";
                testMode: boolean;
                preferences: unknown;
                createdAt: Date;
                updatedAt: Date;
            };
            db: import("drizzle-orm/postgres-js").PostgresJsDatabase<typeof import("../db/schema")> & {
                $client: import("postgres").Sql<{}>;
            };
            honoContext: import("hono").Context<any, any, {}>;
        };
        _input_in: {
            currencyBalanceId: string;
            paymentId: string;
        };
        _input_out: {
            currencyBalanceId: string;
            paymentId: string;
        };
        _output_in: typeof import("@trpc/server").unsetMarker;
        _output_out: typeof import("@trpc/server").unsetMarker;
    }, {
        success: boolean;
        transactionId: string;
    }>;
    respondToIncomingRequest: import("@trpc/server").BuildProcedure<"mutation", {
        _config: import("@trpc/server").RootConfig<{
            ctx: import("../lib/trpc").Context;
            meta: object;
            errorShape: import("@trpc/server").DefaultErrorShape;
            transformer: typeof import("superjson").default;
        }>;
        _meta: object;
        _ctx_out: {
            userId: string;
            user: {
                id: string;
                email: string;
                name: string | null;
                username: string | null;
                defaultCurrency: string;
                subscriptionTier: "free" | "pro" | "premium";
                testMode: boolean;
                preferences: unknown;
                createdAt: Date;
                updatedAt: Date;
            };
            db: import("drizzle-orm/postgres-js").PostgresJsDatabase<typeof import("../db/schema")> & {
                $client: import("postgres").Sql<{}>;
            };
            honoContext: import("hono").Context<any, any, {}>;
        };
        _input_in: {
            splitId: string;
            decision: "approve" | "disapprove";
            note?: string | undefined;
            settlement?: "debt" | "instant_payment" | undefined;
            payerCurrencyBalanceId?: string | undefined;
            receiverCurrencyBalanceId?: string | undefined;
        };
        _input_out: {
            splitId: string;
            decision: "approve" | "disapprove";
            note?: string | undefined;
            settlement?: "debt" | "instant_payment" | undefined;
            payerCurrencyBalanceId?: string | undefined;
            receiverCurrencyBalanceId?: string | undefined;
        };
        _output_in: typeof import("@trpc/server").unsetMarker;
        _output_out: typeof import("@trpc/server").unsetMarker;
    }, {
        success: boolean;
        outcome: "disapproved";
        debtIds?: undefined;
    } | {
        success: boolean;
        outcome: "instant_payment";
        debtIds?: undefined;
    } | {
        success: boolean;
        outcome: "debt";
        debtIds: {
            ownerDebtId: string;
            responderDebtId: string;
        };
    }>;
    payIncomingRequestNow: import("@trpc/server").BuildProcedure<"mutation", {
        _config: import("@trpc/server").RootConfig<{
            ctx: import("../lib/trpc").Context;
            meta: object;
            errorShape: import("@trpc/server").DefaultErrorShape;
            transformer: typeof import("superjson").default;
        }>;
        _meta: object;
        _ctx_out: {
            userId: string;
            user: {
                id: string;
                email: string;
                name: string | null;
                username: string | null;
                defaultCurrency: string;
                subscriptionTier: "free" | "pro" | "premium";
                testMode: boolean;
                preferences: unknown;
                createdAt: Date;
                updatedAt: Date;
            };
            db: import("drizzle-orm/postgres-js").PostgresJsDatabase<typeof import("../db/schema")> & {
                $client: import("postgres").Sql<{}>;
            };
            honoContext: import("hono").Context<any, any, {}>;
        };
        _input_in: {
            splitId: string;
            payerCurrencyBalanceId: string;
            amountNow: number;
            note?: string | undefined;
            receiverCurrencyBalanceId?: string | undefined;
        };
        _input_out: {
            splitId: string;
            payerCurrencyBalanceId: string;
            amountNow: number;
            note?: string | undefined;
            receiverCurrencyBalanceId?: string | undefined;
        };
        _output_in: typeof import("@trpc/server").unsetMarker;
        _output_out: typeof import("@trpc/server").unsetMarker;
    }, {
        success: boolean;
        outcome: "pay_now_full";
        debtIds?: undefined;
    } | {
        success: boolean;
        outcome: "pay_now_partial_to_debt";
        debtIds: {
            ownerDebtId: string;
            responderDebtId: string;
        };
    }>;
    getOwedSummary: import("@trpc/server").BuildProcedure<"query", {
        _config: import("@trpc/server").RootConfig<{
            ctx: import("../lib/trpc").Context;
            meta: object;
            errorShape: import("@trpc/server").DefaultErrorShape;
            transformer: typeof import("superjson").default;
        }>;
        _meta: object;
        _ctx_out: {
            userId: string;
            user: {
                id: string;
                email: string;
                name: string | null;
                username: string | null;
                defaultCurrency: string;
                subscriptionTier: "free" | "pro" | "premium";
                testMode: boolean;
                preferences: unknown;
                createdAt: Date;
                updatedAt: Date;
            };
            db: import("drizzle-orm/postgres-js").PostgresJsDatabase<typeof import("../db/schema")> & {
                $client: import("postgres").Sql<{}>;
            };
            honoContext: import("hono").Context<any, any, {}>;
        };
        _input_in: typeof import("@trpc/server").unsetMarker;
        _input_out: typeof import("@trpc/server").unsetMarker;
        _output_in: typeof import("@trpc/server").unsetMarker;
        _output_out: typeof import("@trpc/server").unsetMarker;
    }, {
        total: number;
        byParticipant: {
            participant: any;
            totalOwed: number;
            totalPaid: number;
            remaining: number;
        }[];
    }>;
    createParticipant: import("@trpc/server").BuildProcedure<"mutation", {
        _config: import("@trpc/server").RootConfig<{
            ctx: import("../lib/trpc").Context;
            meta: object;
            errorShape: import("@trpc/server").DefaultErrorShape;
            transformer: typeof import("superjson").default;
        }>;
        _meta: object;
        _ctx_out: {
            userId: string;
            user: {
                id: string;
                email: string;
                name: string | null;
                username: string | null;
                defaultCurrency: string;
                subscriptionTier: "free" | "pro" | "premium";
                testMode: boolean;
                preferences: unknown;
                createdAt: Date;
                updatedAt: Date;
            };
            db: import("drizzle-orm/postgres-js").PostgresJsDatabase<typeof import("../db/schema")> & {
                $client: import("postgres").Sql<{}>;
            };
            honoContext: import("hono").Context<any, any, {}>;
        };
        _input_in: {
            name: string;
            username?: string | undefined;
            color?: string | undefined;
            contactType?: "email" | "telegram" | "whatsapp" | "phone" | "other" | undefined;
            contactValue?: string | undefined;
        };
        _input_out: {
            name: string;
            username?: string | undefined;
            color?: string | undefined;
            contactType?: "email" | "telegram" | "whatsapp" | "phone" | "other" | undefined;
            contactValue?: string | undefined;
        };
        _output_in: typeof import("@trpc/server").unsetMarker;
        _output_out: typeof import("@trpc/server").unsetMarker;
    }, {
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        color: string | null;
        linkedUserId: string | null;
        linkedUsername: string | null;
        contactType: "email" | "telegram" | "whatsapp" | "phone" | "other" | null;
        contactValue: string | null;
        isActive: boolean;
    }>;
    updateParticipant: import("@trpc/server").BuildProcedure<"mutation", {
        _config: import("@trpc/server").RootConfig<{
            ctx: import("../lib/trpc").Context;
            meta: object;
            errorShape: import("@trpc/server").DefaultErrorShape;
            transformer: typeof import("superjson").default;
        }>;
        _meta: object;
        _ctx_out: {
            userId: string;
            user: {
                id: string;
                email: string;
                name: string | null;
                username: string | null;
                defaultCurrency: string;
                subscriptionTier: "free" | "pro" | "premium";
                testMode: boolean;
                preferences: unknown;
                createdAt: Date;
                updatedAt: Date;
            };
            db: import("drizzle-orm/postgres-js").PostgresJsDatabase<typeof import("../db/schema")> & {
                $client: import("postgres").Sql<{}>;
            };
            honoContext: import("hono").Context<any, any, {}>;
        };
        _input_in: {
            id: string;
            name?: string | undefined;
            username?: string | null | undefined;
            color?: string | undefined;
            contactType?: "email" | "telegram" | "whatsapp" | "phone" | "other" | null | undefined;
            contactValue?: string | null | undefined;
            isActive?: boolean | undefined;
        };
        _input_out: {
            id: string;
            name?: string | undefined;
            username?: string | null | undefined;
            color?: string | undefined;
            contactType?: "email" | "telegram" | "whatsapp" | "phone" | "other" | null | undefined;
            contactValue?: string | null | undefined;
            isActive?: boolean | undefined;
        };
        _output_in: typeof import("@trpc/server").unsetMarker;
        _output_out: typeof import("@trpc/server").unsetMarker;
    }, {
        id: string;
        userId: string;
        name: string;
        linkedUserId: string | null;
        linkedUsername: string | null;
        contactType: "email" | "telegram" | "whatsapp" | "phone" | "other" | null;
        contactValue: string | null;
        color: string | null;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
    }>;
    deleteParticipant: import("@trpc/server").BuildProcedure<"mutation", {
        _config: import("@trpc/server").RootConfig<{
            ctx: import("../lib/trpc").Context;
            meta: object;
            errorShape: import("@trpc/server").DefaultErrorShape;
            transformer: typeof import("superjson").default;
        }>;
        _meta: object;
        _ctx_out: {
            userId: string;
            user: {
                id: string;
                email: string;
                name: string | null;
                username: string | null;
                defaultCurrency: string;
                subscriptionTier: "free" | "pro" | "premium";
                testMode: boolean;
                preferences: unknown;
                createdAt: Date;
                updatedAt: Date;
            };
            db: import("drizzle-orm/postgres-js").PostgresJsDatabase<typeof import("../db/schema")> & {
                $client: import("postgres").Sql<{}>;
            };
            honoContext: import("hono").Context<any, any, {}>;
        };
        _input_in: {
            id: string;
        };
        _input_out: {
            id: string;
        };
        _output_in: typeof import("@trpc/server").unsetMarker;
        _output_out: typeof import("@trpc/server").unsetMarker;
    }, {
        success: boolean;
    }>;
    createSplits: import("@trpc/server").BuildProcedure<"mutation", {
        _config: import("@trpc/server").RootConfig<{
            ctx: import("../lib/trpc").Context;
            meta: object;
            errorShape: import("@trpc/server").DefaultErrorShape;
            transformer: typeof import("superjson").default;
        }>;
        _meta: object;
        _ctx_out: {
            userId: string;
            user: {
                id: string;
                email: string;
                name: string | null;
                username: string | null;
                defaultCurrency: string;
                subscriptionTier: "free" | "pro" | "premium";
                testMode: boolean;
                preferences: unknown;
                createdAt: Date;
                updatedAt: Date;
            };
            db: import("drizzle-orm/postgres-js").PostgresJsDatabase<typeof import("../db/schema")> & {
                $client: import("postgres").Sql<{}>;
            };
            honoContext: import("hono").Context<any, any, {}>;
        };
        _input_in: {
            transactionId: string;
            splits: {
                participantId: string;
                owedAmount: number;
                note?: string | undefined;
            }[];
            totalAmount?: number | undefined;
            equalSplit?: boolean | undefined;
        };
        _input_out: {
            transactionId: string;
            splits: {
                participantId: string;
                owedAmount: number;
                note?: string | undefined;
            }[];
            equalSplit: boolean;
            totalAmount?: number | undefined;
        };
        _output_in: typeof import("@trpc/server").unsetMarker;
        _output_out: typeof import("@trpc/server").unsetMarker;
    }, {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        paidAmount: string;
        status: "pending" | "partial" | "settled";
        note: string | null;
        transactionId: string;
        participantId: string;
        owedAmount: string;
    }[]>;
    getTransactionSplits: import("@trpc/server").BuildProcedure<"query", {
        _config: import("@trpc/server").RootConfig<{
            ctx: import("../lib/trpc").Context;
            meta: object;
            errorShape: import("@trpc/server").DefaultErrorShape;
            transformer: typeof import("superjson").default;
        }>;
        _meta: object;
        _ctx_out: {
            userId: string;
            user: {
                id: string;
                email: string;
                name: string | null;
                username: string | null;
                defaultCurrency: string;
                subscriptionTier: "free" | "pro" | "premium";
                testMode: boolean;
                preferences: unknown;
                createdAt: Date;
                updatedAt: Date;
            };
            db: import("drizzle-orm/postgres-js").PostgresJsDatabase<typeof import("../db/schema")> & {
                $client: import("postgres").Sql<{}>;
            };
            honoContext: import("hono").Context<any, any, {}>;
        };
        _input_in: {
            transactionId: string;
        };
        _input_out: {
            transactionId: string;
        };
        _output_in: typeof import("@trpc/server").unsetMarker;
        _output_out: typeof import("@trpc/server").unsetMarker;
    }, {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        paidAmount: string;
        status: "pending" | "partial" | "settled";
        note: string | null;
        transactionId: string;
        participantId: string;
        owedAmount: string;
        payments: {
            id: string;
            createdAt: Date;
            amount: string;
            paidAt: Date;
            note: string | null;
            splitId: string;
            receivedToCurrencyBalanceId: string | null;
            linkedTransactionId: string | null;
        }[];
        participant: {
            id: string;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            userId: string;
            color: string | null;
            linkedUserId: string | null;
            linkedUsername: string | null;
            contactType: "email" | "telegram" | "whatsapp" | "phone" | "other" | null;
            contactValue: string | null;
            isActive: boolean;
        };
    }[]>;
    updateSplit: import("@trpc/server").BuildProcedure<"mutation", {
        _config: import("@trpc/server").RootConfig<{
            ctx: import("../lib/trpc").Context;
            meta: object;
            errorShape: import("@trpc/server").DefaultErrorShape;
            transformer: typeof import("superjson").default;
        }>;
        _meta: object;
        _ctx_out: {
            userId: string;
            user: {
                id: string;
                email: string;
                name: string | null;
                username: string | null;
                defaultCurrency: string;
                subscriptionTier: "free" | "pro" | "premium";
                testMode: boolean;
                preferences: unknown;
                createdAt: Date;
                updatedAt: Date;
            };
            db: import("drizzle-orm/postgres-js").PostgresJsDatabase<typeof import("../db/schema")> & {
                $client: import("postgres").Sql<{}>;
            };
            honoContext: import("hono").Context<any, any, {}>;
        };
        _input_in: {
            id: string;
            note?: string | null | undefined;
            owedAmount?: number | undefined;
        };
        _input_out: {
            id: string;
            note?: string | null | undefined;
            owedAmount?: number | undefined;
        };
        _output_in: typeof import("@trpc/server").unsetMarker;
        _output_out: typeof import("@trpc/server").unsetMarker;
    }, {
        id: string;
        transactionId: string;
        participantId: string;
        owedAmount: string;
        paidAmount: string;
        status: "pending" | "partial" | "settled";
        note: string | null;
        createdAt: Date;
        updatedAt: Date;
    }>;
    deleteSplit: import("@trpc/server").BuildProcedure<"mutation", {
        _config: import("@trpc/server").RootConfig<{
            ctx: import("../lib/trpc").Context;
            meta: object;
            errorShape: import("@trpc/server").DefaultErrorShape;
            transformer: typeof import("superjson").default;
        }>;
        _meta: object;
        _ctx_out: {
            userId: string;
            user: {
                id: string;
                email: string;
                name: string | null;
                username: string | null;
                defaultCurrency: string;
                subscriptionTier: "free" | "pro" | "premium";
                testMode: boolean;
                preferences: unknown;
                createdAt: Date;
                updatedAt: Date;
            };
            db: import("drizzle-orm/postgres-js").PostgresJsDatabase<typeof import("../db/schema")> & {
                $client: import("postgres").Sql<{}>;
            };
            honoContext: import("hono").Context<any, any, {}>;
        };
        _input_in: {
            id: string;
        };
        _input_out: {
            id: string;
        };
        _output_in: typeof import("@trpc/server").unsetMarker;
        _output_out: typeof import("@trpc/server").unsetMarker;
    }, {
        success: boolean;
    }>;
    recordPayment: import("@trpc/server").BuildProcedure<"mutation", {
        _config: import("@trpc/server").RootConfig<{
            ctx: import("../lib/trpc").Context;
            meta: object;
            errorShape: import("@trpc/server").DefaultErrorShape;
            transformer: typeof import("superjson").default;
        }>;
        _meta: object;
        _ctx_out: {
            userId: string;
            user: {
                id: string;
                email: string;
                name: string | null;
                username: string | null;
                defaultCurrency: string;
                subscriptionTier: "free" | "pro" | "premium";
                testMode: boolean;
                preferences: unknown;
                createdAt: Date;
                updatedAt: Date;
            };
            db: import("drizzle-orm/postgres-js").PostgresJsDatabase<typeof import("../db/schema")> & {
                $client: import("postgres").Sql<{}>;
            };
            honoContext: import("hono").Context<any, any, {}>;
        };
        _input_in: {
            amount: number;
            splitId: string;
            date?: string | undefined;
            note?: string | undefined;
            receivedToCurrencyBalanceId?: string | undefined;
            createIncomeTransaction?: boolean | undefined;
        };
        _input_out: {
            amount: number;
            splitId: string;
            createIncomeTransaction: boolean;
            date?: string | undefined;
            note?: string | undefined;
            receivedToCurrencyBalanceId?: string | undefined;
        };
        _output_in: typeof import("@trpc/server").unsetMarker;
        _output_out: typeof import("@trpc/server").unsetMarker;
    }, {
        id: string;
        createdAt: Date;
        amount: string;
        paidAt: Date;
        note: string | null;
        splitId: string;
        receivedToCurrencyBalanceId: string | null;
        linkedTransactionId: string | null;
    }>;
    settleSplit: import("@trpc/server").BuildProcedure<"mutation", {
        _config: import("@trpc/server").RootConfig<{
            ctx: import("../lib/trpc").Context;
            meta: object;
            errorShape: import("@trpc/server").DefaultErrorShape;
            transformer: typeof import("superjson").default;
        }>;
        _meta: object;
        _ctx_out: {
            userId: string;
            user: {
                id: string;
                email: string;
                name: string | null;
                username: string | null;
                defaultCurrency: string;
                subscriptionTier: "free" | "pro" | "premium";
                testMode: boolean;
                preferences: unknown;
                createdAt: Date;
                updatedAt: Date;
            };
            db: import("drizzle-orm/postgres-js").PostgresJsDatabase<typeof import("../db/schema")> & {
                $client: import("postgres").Sql<{}>;
            };
            honoContext: import("hono").Context<any, any, {}>;
        };
        _input_in: {
            splitId: string;
            date?: string | undefined;
            note?: string | undefined;
            receivedToCurrencyBalanceId?: string | undefined;
            createIncomeTransaction?: boolean | undefined;
        };
        _input_out: {
            splitId: string;
            createIncomeTransaction: boolean;
            date?: string | undefined;
            note?: string | undefined;
            receivedToCurrencyBalanceId?: string | undefined;
        };
        _output_in: typeof import("@trpc/server").unsetMarker;
        _output_out: typeof import("@trpc/server").unsetMarker;
    }, {
        id: string;
        createdAt: Date;
        amount: string;
        paidAt: Date;
        note: string | null;
        splitId: string;
        receivedToCurrencyBalanceId: string | null;
        linkedTransactionId: string | null;
    }>;
}>;
