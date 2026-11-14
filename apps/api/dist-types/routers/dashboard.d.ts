export declare const WIDGET_REGISTRY: Record<string, {
    name: string;
    description: string;
    createdAt: string;
    version: string;
}>;
export declare const dashboardRouter: import("@trpc/server").CreateRouterInner<import("@trpc/server").RootConfig<{
    ctx: import("../lib/trpc").Context;
    meta: object;
    errorShape: import("@trpc/server").DefaultErrorShape;
    transformer: typeof import("superjson").default;
}>, {
    getSummary: import("@trpc/server").BuildProcedure<"query", {
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
    }, any>;
    getLayout: import("@trpc/server").BuildProcedure<"query", {
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
    }, any>;
    saveLayout: import("@trpc/server").BuildProcedure<"mutation", {
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
            layouts: {
                lg: {
                    i: string;
                    x: number;
                    y: number;
                    w: number;
                    h: number;
                    minW?: number | undefined;
                    maxW?: number | undefined;
                    minH?: number | undefined;
                    maxH?: number | undefined;
                }[];
                md: {
                    i: string;
                    x: number;
                    y: number;
                    w: number;
                    h: number;
                    minW?: number | undefined;
                    maxW?: number | undefined;
                    minH?: number | undefined;
                    maxH?: number | undefined;
                }[];
                sm: {
                    i: string;
                    x: number;
                    y: number;
                    w: number;
                    h: number;
                    minW?: number | undefined;
                    maxW?: number | undefined;
                    minH?: number | undefined;
                    maxH?: number | undefined;
                }[];
                xs: {
                    i: string;
                    x: number;
                    y: number;
                    w: number;
                    h: number;
                    minW?: number | undefined;
                    maxW?: number | undefined;
                    minH?: number | undefined;
                    maxH?: number | undefined;
                }[];
            };
            hiddenWidgets?: string[] | undefined;
        };
        _input_out: {
            layouts: {
                lg: {
                    i: string;
                    x: number;
                    y: number;
                    w: number;
                    h: number;
                    minW?: number | undefined;
                    maxW?: number | undefined;
                    minH?: number | undefined;
                    maxH?: number | undefined;
                }[];
                md: {
                    i: string;
                    x: number;
                    y: number;
                    w: number;
                    h: number;
                    minW?: number | undefined;
                    maxW?: number | undefined;
                    minH?: number | undefined;
                    maxH?: number | undefined;
                }[];
                sm: {
                    i: string;
                    x: number;
                    y: number;
                    w: number;
                    h: number;
                    minW?: number | undefined;
                    maxW?: number | undefined;
                    minH?: number | undefined;
                    maxH?: number | undefined;
                }[];
                xs: {
                    i: string;
                    x: number;
                    y: number;
                    w: number;
                    h: number;
                    minW?: number | undefined;
                    maxW?: number | undefined;
                    minH?: number | undefined;
                    maxH?: number | undefined;
                }[];
            };
            hiddenWidgets?: string[] | undefined;
        };
        _output_in: typeof import("@trpc/server").unsetMarker;
        _output_out: typeof import("@trpc/server").unsetMarker;
    }, {
        success: boolean;
    }>;
    getWidgetRegistry: import("@trpc/server").BuildProcedure<"query", {
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
    }, Record<string, {
        name: string;
        description: string;
        createdAt: string;
        version: string;
    }>>;
    getNewWidgets: import("@trpc/server").BuildProcedure<"query", {
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
        newWidgets: string[];
        showAllWidgets: boolean;
    }>;
}>;
