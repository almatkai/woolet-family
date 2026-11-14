export declare const mortgageRouter: import("@trpc/server").CreateRouterInner<import("@trpc/server").RootConfig<{
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
        monthlyPayment: string;
        remainingBalance: string;
        startDate: string;
        endDate: string | null;
        propertyName: string;
        propertyAddress: string | null;
        termYears: number;
        paymentDay: number | null;
        payments: {
            id: string;
            amount: string;
            paidAt: Date;
            note: string | null;
            monthYear: string;
            mortgageId: string;
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
        createdAt: Date;
        accountId: string;
        status: string;
        currency: string;
        principalAmount: string;
        interestRate: string;
        monthlyPayment: string;
        remainingBalance: string;
        startDate: string;
        endDate: string | null;
        propertyName: string;
        propertyAddress: string | null;
        termYears: number;
        paymentDay: number | null;
        payments: {
            id: string;
            amount: string;
            paidAt: Date;
            note: string | null;
            monthYear: string;
            mortgageId: string;
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
            currency: string;
            principalAmount: number;
            interestRate: number;
            monthlyPayment: number;
            remainingBalance: number;
            startDate: string;
            propertyName: string;
            termYears: number;
            status?: "active" | "paid_off" | "defaulted" | undefined;
            endDate?: string | undefined;
            propertyAddress?: string | undefined;
            paymentDay?: number | undefined;
            markPastMonthsAsPaid?: boolean | undefined;
        };
        _input_out: {
            accountId: string;
            status: "active" | "paid_off" | "defaulted";
            currency: string;
            principalAmount: number;
            interestRate: number;
            monthlyPayment: number;
            remainingBalance: number;
            startDate: string;
            propertyName: string;
            termYears: number;
            paymentDay: number;
            markPastMonthsAsPaid: boolean;
            endDate?: string | undefined;
            propertyAddress?: string | undefined;
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
        monthlyPayment: string;
        remainingBalance: string;
        startDate: string;
        endDate: string | null;
        propertyName: string;
        propertyAddress: string | null;
        termYears: number;
        paymentDay: number | null;
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
            accountId?: string | undefined;
            status?: "active" | "paid_off" | "defaulted" | undefined;
            currency?: string | undefined;
            principalAmount?: number | undefined;
            interestRate?: number | undefined;
            monthlyPayment?: number | undefined;
            remainingBalance?: number | undefined;
            startDate?: string | undefined;
            endDate?: string | undefined;
            propertyName?: string | undefined;
            propertyAddress?: string | undefined;
            termYears?: number | undefined;
            paymentDay?: number | undefined;
        };
        _input_out: {
            id: string;
            accountId?: string | undefined;
            status?: "active" | "paid_off" | "defaulted" | undefined;
            currency?: string | undefined;
            principalAmount?: number | undefined;
            interestRate?: number | undefined;
            monthlyPayment?: number | undefined;
            remainingBalance?: number | undefined;
            startDate?: string | undefined;
            endDate?: string | undefined;
            propertyName?: string | undefined;
            propertyAddress?: string | undefined;
            termYears?: number | undefined;
            paymentDay?: number | undefined;
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
            mortgageId: string;
            months: string[];
            amountPerMonth?: number | undefined;
        };
        _input_out: {
            mortgageId: string;
            months: string[];
            amountPerMonth?: number | undefined;
        };
        _output_in: typeof import("@trpc/server").unsetMarker;
        _output_out: typeof import("@trpc/server").unsetMarker;
    }, {
        success: boolean;
        markedMonths: string[];
        newRemainingBalance: number;
        status: string;
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
            mortgageId: string;
            months: string[];
            amountPerMonth?: number | undefined;
        };
        _input_out: {
            mortgageId: string;
            months: string[];
            amountPerMonth?: number | undefined;
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
    getAmortizationSchedule: import("@trpc/server").BuildProcedure<"query", {
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
        month: number;
        monthYear: string;
        payment: number;
        principal: number;
        interest: number;
        balance: number;
        isPaid: boolean;
    }[]>;
}>;
