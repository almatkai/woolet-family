import type { Context, Next } from 'hono';
export declare const requireAuth: (c: Context, next: Next) => Promise<(Response & import("hono").TypedResponse<{
    error: string;
}, 401, "json">) | undefined>;
