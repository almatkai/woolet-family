type SpendingStats = {
    timeSeriesData: Array<{
        date: string;
        amount: number;
    }>;
    categoryData: Array<{
        id: string;
        name: string;
        color: string;
        value: number;
    }>;
    total: number;
};
export declare const transactionRouter: import("@trpc/server").CreateRouterInner<import("@trpc/server").RootConfig<{
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
            type?: "income" | "expense" | "transfer" | undefined;
            currencyBalanceId?: string | undefined;
            startDate?: string | undefined;
            endDate?: string | undefined;
            limit?: number | undefined;
            cursor?: string | null | undefined;
            excludeFromStats?: boolean | undefined;
            hideAdjustments?: boolean | undefined;
            includeChildren?: boolean | undefined;
        };
        _input_out: {
            limit: number;
            type?: "income" | "expense" | "transfer" | undefined;
            currencyBalanceId?: string | undefined;
            startDate?: string | undefined;
            endDate?: string | undefined;
            cursor?: string | null | undefined;
            excludeFromStats?: boolean | undefined;
            hideAdjustments?: boolean | undefined;
            includeChildren?: boolean | undefined;
        };
        _output_in: typeof import("@trpc/server").unsetMarker;
        _output_out: typeof import("@trpc/server").unsetMarker;
    }, {
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
            childTransactions: {
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
            }[];
            splits: {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                paidAmount: string;
                status: "pending" | "partial" | "settled";
                note: string | null;
                transactionId: string;
                participantId: string;
                owedAmount: string;
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
            }[];
        }[];
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
            date: string;
            type: "income" | "expense" | "transfer";
            currencyBalanceId: string;
            amount: number;
            split?: {
                participantIds: string[];
                equalSplit?: boolean | undefined;
                paybackCurrencyBalanceId?: string | undefined;
                amounts?: {
                    amount: number;
                    participantId: string;
                    paybackCurrencyBalanceId?: string | undefined;
                }[] | undefined;
                includeSelf?: boolean | undefined;
                instantMoneyBack?: boolean | undefined;
            } | undefined;
            exchangeRate?: number | undefined;
            description?: string | undefined;
            categoryId?: string | undefined;
            fee?: number | undefined;
            cashbackAmount?: number | undefined;
            toCurrencyBalanceId?: string | undefined;
            parentTransactionId?: string | undefined;
            idempotencyKey?: string | undefined;
        };
        _input_out: {
            date: string;
            type: "income" | "expense" | "transfer";
            currencyBalanceId: string;
            amount: number;
            split?: {
                equalSplit: boolean;
                participantIds: string[];
                includeSelf: boolean;
                paybackCurrencyBalanceId?: string | undefined;
                amounts?: {
                    amount: number;
                    participantId: string;
                    paybackCurrencyBalanceId?: string | undefined;
                }[] | undefined;
                instantMoneyBack?: boolean | undefined;
            } | undefined;
            exchangeRate?: number | undefined;
            description?: string | undefined;
            categoryId?: string | undefined;
            fee?: number | undefined;
            cashbackAmount?: number | undefined;
            toCurrencyBalanceId?: string | undefined;
            parentTransactionId?: string | undefined;
            idempotencyKey?: string | undefined;
        };
        _output_in: typeof import("@trpc/server").unsetMarker;
        _output_out: typeof import("@trpc/server").unsetMarker;
    }, {
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
            date?: string | undefined;
            description?: string | undefined;
            currencyBalanceId?: string | undefined;
            amount?: number | undefined;
            categoryId?: string | undefined;
        };
        _input_out: {
            id: string;
            date?: string | undefined;
            description?: string | undefined;
            currencyBalanceId?: string | undefined;
            amount?: number | undefined;
            categoryId?: string | undefined;
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
    getSpendingStats: import("@trpc/server").BuildProcedure<"query", {
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
            startDate: string;
            endDate: string;
            currencyBalanceId?: string | undefined;
            categoryId?: string | undefined;
            categoryIds?: string[] | undefined;
        };
        _input_out: {
            startDate: string;
            endDate: string;
            currencyBalanceId?: string | undefined;
            categoryId?: string | undefined;
            categoryIds?: string[] | undefined;
        };
        _output_in: typeof import("@trpc/server").unsetMarker;
        _output_out: typeof import("@trpc/server").unsetMarker;
    }, SpendingStats>;
}>;
export {};
