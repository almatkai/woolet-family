export declare const depositRouter: import("@trpc/server").CreateRouterInner<import("@trpc/server").RootConfig<{
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
        createdAt: Date;
        accountId: string;
        status: string;
        currency: string;
        principalAmount: string;
        interestRate: string;
        startDate: string;
        bankName: string;
        depositName: string;
        currentBalance: string;
        compoundingFrequency: string;
        maturityDate: string | null;
        isFlexible: boolean;
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
        createdAt: Date;
        accountId: string;
        status: string;
        currency: string;
        principalAmount: string;
        interestRate: string;
        startDate: string;
        bankName: string;
        depositName: string;
        currentBalance: string;
        compoundingFrequency: string;
        maturityDate: string | null;
        isFlexible: boolean;
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
            accountId: string;
            currencyBalanceId: string;
            currency: string;
            principalAmount: number;
            interestRate: number;
            startDate: string;
            depositName: string;
            currentBalance: number;
            status?: "active" | "matured" | "withdrawn" | undefined;
            compoundingFrequency?: "monthly" | "daily" | "annually" | "quarterly" | undefined;
            maturityDate?: string | undefined;
            isFlexible?: boolean | undefined;
            skipWithdrawal?: boolean | undefined;
        };
        _input_out: {
            accountId: string;
            currencyBalanceId: string;
            status: "active" | "matured" | "withdrawn";
            currency: string;
            principalAmount: number;
            interestRate: number;
            startDate: string;
            depositName: string;
            currentBalance: number;
            compoundingFrequency: "monthly" | "daily" | "annually" | "quarterly";
            isFlexible: boolean;
            skipWithdrawal: boolean;
            maturityDate?: string | undefined;
        };
        _output_in: typeof import("@trpc/server").unsetMarker;
        _output_out: typeof import("@trpc/server").unsetMarker;
    }, {
        id: string;
        createdAt: Date;
        accountId: string;
        status: string;
        currency: string;
        principalAmount: string;
        interestRate: string;
        startDate: string;
        bankName: string;
        depositName: string;
        currentBalance: string;
        compoundingFrequency: string;
        maturityDate: string | null;
        isFlexible: boolean;
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
            status?: "active" | "matured" | "withdrawn" | undefined;
            interestRate?: number | undefined;
            depositName?: string | undefined;
            currentBalance?: number | undefined;
            maturityDate?: string | undefined;
        };
        _input_out: {
            id: string;
            status?: "active" | "matured" | "withdrawn" | undefined;
            interestRate?: number | undefined;
            depositName?: string | undefined;
            currentBalance?: number | undefined;
            maturityDate?: string | undefined;
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
    calculateInterest: import("@trpc/server").BuildProcedure<"query", {
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
            months?: number | undefined;
        };
        _input_out: {
            id: string;
            months: number;
        };
        _output_in: typeof import("@trpc/server").unsetMarker;
        _output_out: typeof import("@trpc/server").unsetMarker;
    }, {
        currentBalance: number;
        futureValue: number;
        interestEarned: number;
        months: number;
        effectiveRate: number;
    }>;
}>;
