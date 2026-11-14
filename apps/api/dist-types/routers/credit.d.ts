export declare const creditRouter: import("@trpc/server").CreateRouterInner<import("@trpc/server").RootConfig<{
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
        _input_in: typeof import("@trpc/server").unsetMarker;
        _input_out: typeof import("@trpc/server").unsetMarker;
        _output_in: typeof import("@trpc/server").unsetMarker;
        _output_out: typeof import("@trpc/server").unsetMarker;
    }, {
        id: string;
        name: string;
        createdAt: Date;
        accountId: string;
        status: string;
        currency: string;
        principalAmount: string;
        interestRate: string;
        monthlyPayment: string;
        remainingBalance: string;
        startDate: string;
        endDate: string;
        payments: {
            id: string;
            amount: string;
            paidAt: Date;
            note: string | null;
            creditId: string;
            monthYear: string;
        }[];
        account: {
            id: string;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            icon: string | null;
            type: string;
            bankId: string;
            last4Digits: string | null;
            currencyBalances: {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                accountId: string;
                currencyCode: string;
                balance: string;
            }[];
        };
    }[]>;
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
        accountId: string;
        status: string;
        currency: string;
        principalAmount: string;
        interestRate: string;
        monthlyPayment: string;
        remainingBalance: string;
        startDate: string;
        endDate: string;
        payments: {
            id: string;
            amount: string;
            paidAt: Date;
            note: string | null;
            creditId: string;
            monthYear: string;
        }[];
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
            currencyBalances: {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                accountId: string;
                currencyCode: string;
                balance: string;
            }[];
        };
    }>;
    getPaidMonths: import("@trpc/server").BuildProcedure<"query", {
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
            creditId: string;
        };
        _input_out: {
            creditId: string;
        };
        _output_in: typeof import("@trpc/server").unsetMarker;
        _output_out: typeof import("@trpc/server").unsetMarker;
    }, string[]>;
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
            accountId: string;
            currency: string;
            principalAmount: number;
            interestRate: number;
            monthlyPayment: number;
            remainingBalance: number;
            startDate: string;
            endDate: string;
            status?: "active" | "paid_off" | "defaulted" | undefined;
            markPastMonthsAsPaid?: boolean | undefined;
        };
        _input_out: {
            name: string;
            accountId: string;
            status: "active" | "paid_off" | "defaulted";
            currency: string;
            principalAmount: number;
            interestRate: number;
            monthlyPayment: number;
            remainingBalance: number;
            startDate: string;
            endDate: string;
            markPastMonthsAsPaid: boolean;
        };
        _output_in: typeof import("@trpc/server").unsetMarker;
        _output_out: typeof import("@trpc/server").unsetMarker;
    }, {
        id: string;
        name: string;
        createdAt: Date;
        accountId: string;
        status: string;
        currency: string;
        principalAmount: string;
        interestRate: string;
        monthlyPayment: string;
        remainingBalance: string;
        startDate: string;
        endDate: string;
    }>;
    markAsPaid: import("@trpc/server").BuildProcedure<"mutation", {
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
            creditId: string;
            months: string[];
        };
        _input_out: {
            creditId: string;
            months: string[];
        };
        _output_in: typeof import("@trpc/server").unsetMarker;
        _output_out: typeof import("@trpc/server").unsetMarker;
    }, {
        success: boolean;
        markedMonths: string[];
        newRemainingBalance: number;
        status: string;
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
            status?: "active" | "paid_off" | "defaulted" | undefined;
            monthlyPayment?: number | undefined;
            remainingBalance?: number | undefined;
        };
        _input_out: {
            id: string;
            name?: string | undefined;
            status?: "active" | "paid_off" | "defaulted" | undefined;
            monthlyPayment?: number | undefined;
            remainingBalance?: number | undefined;
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
    makeMonthlyPayment: import("@trpc/server").BuildProcedure<"mutation", {
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
            creditId: string;
            months: string[];
        };
        _input_out: {
            creditId: string;
            months: string[];
        };
        _output_in: typeof import("@trpc/server").unsetMarker;
        _output_out: typeof import("@trpc/server").unsetMarker;
    }, {
        success: boolean;
        paidMonths: string[];
        totalAmount: number;
        newAccountBalance: number;
        newRemainingBalance: number;
        status: string;
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
            id: string;
            amount: number;
        };
        _input_out: {
            id: string;
            amount: number;
        };
        _output_in: typeof import("@trpc/server").unsetMarker;
        _output_out: typeof import("@trpc/server").unsetMarker;
    }, {
        success: boolean;
        newBalance: number;
        status: string;
    }>;
}>;
