import type { Context as HonoContext } from 'hono';
import { db } from '../db';
import superjson from 'superjson';
export interface Context {
    db: typeof db;
    userId: string | null;
    honoContext: HonoContext;
    user?: {
        id: string;
        email?: string;
        name?: string;
        defaultCurrency?: string;
        subscriptionTier?: string;
        testMode?: boolean;
    };
}
import { FetchCreateContextFnOptions } from '@trpc/server/adapters/fetch';
export declare const createContext: (opts: FetchCreateContextFnOptions, c: HonoContext) => Promise<Record<string, unknown>>;
export declare const router: <TProcRouterRecord extends import("@trpc/server").ProcedureRouterRecord>(procedures: TProcRouterRecord) => import("@trpc/server").CreateRouterInner<import("@trpc/server").RootConfig<{
    ctx: Context;
    meta: object;
    errorShape: import("@trpc/server").DefaultErrorShape;
    transformer: typeof superjson;
}>, TProcRouterRecord>;
export declare const publicProcedure: import("@trpc/server").ProcedureBuilder<{
    _config: import("@trpc/server").RootConfig<{
        ctx: Context;
        meta: object;
        errorShape: import("@trpc/server").DefaultErrorShape;
        transformer: typeof superjson;
    }>;
    _ctx_out: Context;
    _input_in: typeof import("@trpc/server").unsetMarker;
    _input_out: typeof import("@trpc/server").unsetMarker;
    _output_in: typeof import("@trpc/server").unsetMarker;
    _output_out: typeof import("@trpc/server").unsetMarker;
    _meta: object;
}>;
export declare const protectedProcedure: import("@trpc/server").ProcedureBuilder<{
    _config: import("@trpc/server").RootConfig<{
        ctx: Context;
        meta: object;
        errorShape: import("@trpc/server").DefaultErrorShape;
        transformer: typeof superjson;
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
        honoContext: HonoContext<any, any, {}>;
    };
    _input_in: typeof import("@trpc/server").unsetMarker;
    _input_out: typeof import("@trpc/server").unsetMarker;
    _output_in: typeof import("@trpc/server").unsetMarker;
    _output_out: typeof import("@trpc/server").unsetMarker;
}>;
export declare const adminProcedure: import("@trpc/server").ProcedureBuilder<{
    _config: import("@trpc/server").RootConfig<{
        ctx: Context;
        meta: object;
        errorShape: import("@trpc/server").DefaultErrorShape;
        transformer: typeof superjson;
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
        honoContext: HonoContext<any, any, {}>;
    };
    _input_in: typeof import("@trpc/server").unsetMarker;
    _input_out: typeof import("@trpc/server").unsetMarker;
    _output_in: typeof import("@trpc/server").unsetMarker;
    _output_out: typeof import("@trpc/server").unsetMarker;
}>;
