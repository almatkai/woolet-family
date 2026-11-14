export declare const debtRouter: import("@trpc/server").CreateRouterInner<import("@trpc/server").RootConfig<{
    ctx: import("../lib/trpc").Context;
    meta: object;
    errorShape: import("@trpc/server").DefaultErrorShape;
    transformer: typeof import("superjson").default;
}>, {
    list: import("@trpc/server").BuildProcedure<"query", {
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
            cursor?: string | null | undefined;
        };
        _input_out: {
            cursor?: string | null | undefined;
        };
        _output_in: typeof import("@trpc/server").unsetMarker;
        _output_out: typeof import("@trpc/server").unsetMarker;
    }, {
        debts: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            userId: string | null;
            type: string;
            description: string | null;
            isTest: boolean;
            currencyCode: string | null;
            currencyBalanceId: string | null;
            personName: string;
            linkedUserId: string | null;
            personContact: string | null;
            amount: string;
            paidAmount: string;
            dueDate: string | null;
            status: string;
            lifecycleStatus: string;
            imgUrl: string | null;
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
            } | null;
            linkedUser: {
                id: string;
                name: string | null;
                username: string | null;
            } | null;
            payments: {
                id: string;
                amount: string;
                debtId: string;
                paidAt: Date;
                note: string | null;
                transactions: {
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
                    };
                }[];
            }[];
        }[];
        total: number;
    }>;
    create: import("@trpc/server").BuildProcedure<"mutation", {
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
            type: "i_owe" | "they_owe";
            personName: string;
            amount: number;
            description?: string | undefined;
            currencyCode?: string | null | undefined;
            currencyBalanceId?: string | null | undefined;
            linkedUserId?: string | null | undefined;
            dueDate?: string | undefined;
        };
        _input_out: {
            type: "i_owe" | "they_owe";
            personName: string;
            amount: number;
            description?: string | undefined;
            currencyCode?: string | null | undefined;
            currencyBalanceId?: string | null | undefined;
            linkedUserId?: string | null | undefined;
            dueDate?: string | undefined;
        };
        _output_in: typeof import("@trpc/server").unsetMarker;
        _output_out: typeof import("@trpc/server").unsetMarker;
    }, {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        userId: string | null;
        type: string;
        description: string | null;
        isTest: boolean;
        currencyCode: string | null;
        currencyBalanceId: string | null;
        personName: string;
        linkedUserId: string | null;
        personContact: string | null;
        amount: string;
        paidAmount: string;
        dueDate: string | null;
        status: string;
        lifecycleStatus: string;
        imgUrl: string | null;
    }>;
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
        notificationId: string;
        debtId: string;
        debtType: any;
        amount: number;
        currencyCode: any;
        personName: string;
        description: string | null;
        requesterUserId: string;
        requesterName: any;
        createdAt: Date;
    }[]>;
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
            notificationId: string;
            decision: "approve" | "decline";
            currencyBalanceId?: string | undefined;
        };
        _input_out: {
            notificationId: string;
            decision: "approve" | "decline";
            currencyBalanceId?: string | undefined;
        };
        _output_in: typeof import("@trpc/server").unsetMarker;
        _output_out: typeof import("@trpc/server").unsetMarker;
    }, {
        success: boolean;
        outcome: "declined";
    } | {
        success: boolean;
        outcome: "approved";
    }>;
    addPayment: import("@trpc/server").BuildProcedure<"mutation", {
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
            debtId: string;
            paymentDate: string;
            distributions: {
                currencyBalanceId: string;
                amount: number;
            }[];
            note?: string | undefined;
        };
        _input_out: {
            amount: number;
            debtId: string;
            paymentDate: string;
            distributions: {
                currencyBalanceId: string;
                amount: number;
            }[];
            note?: string | undefined;
        };
        _output_in: typeof import("@trpc/server").unsetMarker;
        _output_out: typeof import("@trpc/server").unsetMarker;
    }, {
        success: boolean;
    }>;
    update: import("@trpc/server").BuildProcedure<"mutation", {
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
            description?: string | undefined;
            personName?: string | undefined;
            amount?: number | undefined;
            dueDate?: string | undefined;
        };
        _input_out: {
            id: string;
            description?: string | undefined;
            personName?: string | undefined;
            amount?: number | undefined;
            dueDate?: string | undefined;
        };
        _output_in: typeof import("@trpc/server").unsetMarker;
        _output_out: typeof import("@trpc/server").unsetMarker;
    }, {
        success: boolean;
    }>;
    updatePayment: import("@trpc/server").BuildProcedure<"mutation", {
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
            amount?: number | undefined;
            paidAt?: string | undefined;
            note?: string | undefined;
            distributions?: {
                currencyBalanceId: string;
                amount: number;
            }[] | undefined;
        };
        _input_out: {
            id: string;
            amount?: number | undefined;
            paidAt?: string | undefined;
            note?: string | undefined;
            distributions?: {
                currencyBalanceId: string;
                amount: number;
            }[] | undefined;
        };
        _output_in: typeof import("@trpc/server").unsetMarker;
        _output_out: typeof import("@trpc/server").unsetMarker;
    }, {
        success: boolean;
    }>;
    delete: import("@trpc/server").BuildProcedure<"mutation", {
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
    deletePayment: import("@trpc/server").BuildProcedure<"mutation", {
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
    softDelete: import("@trpc/server").BuildProcedure<"mutation", {
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
        message: string;
    } | {
        success: boolean;
        message?: undefined;
    }>;
    undoDelete: import("@trpc/server").BuildProcedure<"mutation", {
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
        message: string;
    } | {
        success: boolean;
        message?: undefined;
    }>;
}>;
