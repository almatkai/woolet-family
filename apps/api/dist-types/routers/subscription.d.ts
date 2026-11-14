export declare const subscriptionRouter: import("@trpc/server").CreateRouterInner<import("@trpc/server").RootConfig<{
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
            type?: "credit" | "mortgage" | "general" | "all" | "mobile" | undefined;
            status?: "active" | "all" | "paused" | "cancelled" | undefined;
            includeLinkedEntities?: boolean | undefined;
        } | undefined;
        _input_out: {
            type: "credit" | "mortgage" | "general" | "all" | "mobile";
            status: "active" | "all" | "paused" | "cancelled";
            includeLinkedEntities: boolean;
        } | undefined;
        _output_in: typeof import("@trpc/server").unsetMarker;
        _output_out: typeof import("@trpc/server").unsetMarker;
    }, {
        subscriptions: {
            isLinked: boolean;
            id: string;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            userId: string;
            icon: string | null;
            color: string | null;
            type: string;
            description: string | null;
            amount: string;
            status: string;
            currency: string;
            startDate: string;
            endDate: string | null;
            frequency: string;
            billingDay: number | null;
            linkedEntityId: string | null;
            linkedEntityType: string | null;
            payments: {
                id: string;
                createdAt: Date;
                currencyBalanceId: string | null;
                amount: string;
                dueDate: Date | null;
                paidAt: Date;
                note: string | null;
                transactionId: string | null;
                subscriptionId: string;
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
                    };
                } | null;
            }[];
        }[];
        linkedItems: any[];
        total: number;
    }>;
    getById: import("@trpc/server").BuildProcedure<"query", {
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
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        icon: string | null;
        color: string | null;
        type: string;
        description: string | null;
        amount: string;
        status: string;
        currency: string;
        startDate: string;
        endDate: string | null;
        frequency: string;
        billingDay: number | null;
        linkedEntityId: string | null;
        linkedEntityType: string | null;
        payments: {
            id: string;
            createdAt: Date;
            currencyBalanceId: string | null;
            amount: string;
            dueDate: Date | null;
            paidAt: Date;
            note: string | null;
            transactionId: string | null;
            subscriptionId: string;
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
            } | null;
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
            name: string;
            type: "credit" | "mortgage" | "general" | "mobile";
            amount: number;
            startDate: string;
            icon?: string | undefined;
            color?: string | undefined;
            description?: string | undefined;
            status?: "active" | "paused" | "cancelled" | undefined;
            currency?: string | undefined;
            endDate?: string | undefined;
            frequency?: "monthly" | "daily" | "weekly" | "yearly" | undefined;
            billingDay?: number | undefined;
            linkedEntityId?: string | undefined;
            linkedEntityType?: "credit" | "mortgage" | undefined;
        };
        _input_out: {
            name: string;
            icon: string;
            color: string;
            type: "credit" | "mortgage" | "general" | "mobile";
            amount: number;
            status: "active" | "paused" | "cancelled";
            currency: string;
            startDate: string;
            frequency: "monthly" | "daily" | "weekly" | "yearly";
            description?: string | undefined;
            endDate?: string | undefined;
            billingDay?: number | undefined;
            linkedEntityId?: string | undefined;
            linkedEntityType?: "credit" | "mortgage" | undefined;
        };
        _output_in: typeof import("@trpc/server").unsetMarker;
        _output_out: typeof import("@trpc/server").unsetMarker;
    }, {
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        icon: string | null;
        color: string | null;
        type: string;
        description: string | null;
        amount: string;
        status: string;
        currency: string;
        startDate: string;
        endDate: string | null;
        frequency: string;
        billingDay: number | null;
        linkedEntityId: string | null;
        linkedEntityType: string | null;
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
            name?: string | undefined;
            icon?: string | undefined;
            color?: string | undefined;
            description?: string | undefined;
            amount?: number | undefined;
            status?: "active" | "paused" | "cancelled" | undefined;
            startDate?: string | undefined;
            endDate?: string | null | undefined;
            frequency?: "monthly" | "daily" | "weekly" | "yearly" | undefined;
            billingDay?: number | undefined;
        };
        _input_out: {
            id: string;
            name?: string | undefined;
            icon?: string | undefined;
            color?: string | undefined;
            description?: string | undefined;
            amount?: number | undefined;
            status?: "active" | "paused" | "cancelled" | undefined;
            startDate?: string | undefined;
            endDate?: string | null | undefined;
            frequency?: "monthly" | "daily" | "weekly" | "yearly" | undefined;
            billingDay?: number | undefined;
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
    makePayment: import("@trpc/server").BuildProcedure<"mutation", {
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
            amount: number;
            subscriptionId: string;
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
            dueDate?: string | undefined;
            paidAt?: string | undefined;
            note?: string | undefined;
        };
        _input_out: {
            currencyBalanceId: string;
            amount: number;
            subscriptionId: string;
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
            dueDate?: string | undefined;
            paidAt?: string | undefined;
            note?: string | undefined;
        };
        _output_in: typeof import("@trpc/server").unsetMarker;
        _output_out: typeof import("@trpc/server").unsetMarker;
    }, {
        success: boolean;
        payment: {
            id: string;
            createdAt: Date;
            currencyBalanceId: string | null;
            amount: string;
            dueDate: Date | null;
            paidAt: Date;
            note: string | null;
            transactionId: string | null;
            subscriptionId: string;
        };
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
        };
        newBalance: number;
    }>;
    getUpcoming: import("@trpc/server").BuildProcedure<"query", {
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
            days?: number | undefined;
        } | undefined;
        _input_out: {
            days: number;
        } | undefined;
        _output_in: typeof import("@trpc/server").unsetMarker;
        _output_out: typeof import("@trpc/server").unsetMarker;
    }, {
        subscription: any;
        dueDate: Date;
        isPaid: boolean;
    }[]>;
    getCalendarView: import("@trpc/server").BuildProcedure<"query", {
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
            year: number;
            month: number;
        };
        _input_out: {
            year: number;
            month: number;
        };
        _output_in: typeof import("@trpc/server").unsetMarker;
        _output_out: typeof import("@trpc/server").unsetMarker;
    }, {
        year: number;
        month: number;
        daysInMonth: number;
        data: Record<number, {
            subscription: any;
            isPaid: boolean;
        }[]>;
    }>;
    checkAndNotifyDueSubscriptions: import("@trpc/server").BuildProcedure<"mutation", {
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
            daysAhead?: number | undefined;
        } | undefined;
        _input_out: {
            daysAhead: number;
        } | undefined;
        _output_in: typeof import("@trpc/server").unsetMarker;
        _output_out: typeof import("@trpc/server").unsetMarker;
    }, {
        success: boolean;
        notificationsCreated: number;
        subscriptionIds: string[];
    }>;
}>;
