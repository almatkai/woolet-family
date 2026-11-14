export declare const settingsRouter: import("@trpc/server").CreateRouterInner<import("@trpc/server").RootConfig<{
    ctx: import("../lib/trpc").Context;
    meta: object;
    errorShape: import("@trpc/server").DefaultErrorShape;
    transformer: typeof import("superjson").default;
}>, {
    getUserSettings: import("@trpc/server").BuildProcedure<"query", {
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
        defaultCurrency: string;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        paymentStatusLogic: string;
        paymentStatusPeriod: string;
        creditStatusLogic: string | null;
        creditStatusPeriod: string | null;
        mortgageStatusLogic: string | null;
        mortgageStatusPeriod: string | null;
        subscriptionStatusLogic: string | null;
        subscriptionStatusPeriod: string | null;
        notificationsEnabled: boolean;
        browserNotificationsEnabled: boolean;
        emailNotificationsEnabled: boolean;
        emailNotificationAddress: string | null;
        subscriptionReminderDays: number;
        creditReminderDays: number;
        mortgageReminderDays: number;
    }>;
    updateUserSettings: import("@trpc/server").BuildProcedure<"mutation", {
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
            defaultCurrency?: string | undefined;
            paymentStatusLogic?: string | undefined;
            paymentStatusPeriod?: string | undefined;
            creditStatusLogic?: string | null | undefined;
            creditStatusPeriod?: string | null | undefined;
            mortgageStatusLogic?: string | null | undefined;
            mortgageStatusPeriod?: string | null | undefined;
            subscriptionStatusLogic?: string | null | undefined;
            subscriptionStatusPeriod?: string | null | undefined;
            notificationsEnabled?: boolean | undefined;
            browserNotificationsEnabled?: boolean | undefined;
            emailNotificationsEnabled?: boolean | undefined;
            emailNotificationAddress?: string | null | undefined;
            subscriptionReminderDays?: number | undefined;
            creditReminderDays?: number | undefined;
            mortgageReminderDays?: number | undefined;
        };
        _input_out: {
            defaultCurrency?: string | undefined;
            paymentStatusLogic?: string | undefined;
            paymentStatusPeriod?: string | undefined;
            creditStatusLogic?: string | null | undefined;
            creditStatusPeriod?: string | null | undefined;
            mortgageStatusLogic?: string | null | undefined;
            mortgageStatusPeriod?: string | null | undefined;
            subscriptionStatusLogic?: string | null | undefined;
            subscriptionStatusPeriod?: string | null | undefined;
            notificationsEnabled?: boolean | undefined;
            browserNotificationsEnabled?: boolean | undefined;
            emailNotificationsEnabled?: boolean | undefined;
            emailNotificationAddress?: string | null | undefined;
            subscriptionReminderDays?: number | undefined;
            creditReminderDays?: number | undefined;
            mortgageReminderDays?: number | undefined;
        };
        _output_in: typeof import("@trpc/server").unsetMarker;
        _output_out: typeof import("@trpc/server").unsetMarker;
    }, {
        id: string;
        defaultCurrency: string;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        paymentStatusLogic: string;
        paymentStatusPeriod: string;
        creditStatusLogic: string | null;
        creditStatusPeriod: string | null;
        mortgageStatusLogic: string | null;
        mortgageStatusPeriod: string | null;
        subscriptionStatusLogic: string | null;
        subscriptionStatusPeriod: string | null;
        notificationsEnabled: boolean;
        browserNotificationsEnabled: boolean;
        emailNotificationsEnabled: boolean;
        emailNotificationAddress: string | null;
        subscriptionReminderDays: number;
        creditReminderDays: number;
        mortgageReminderDays: number;
    }>;
}>;
