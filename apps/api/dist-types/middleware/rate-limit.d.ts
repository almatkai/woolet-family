import type { Context, Next } from 'hono';
export declare const rateLimitMiddleware: (c: Context, next: Next) => Promise<(Response & import("hono").TypedResponse<{
    error: string;
    message: string;
}, 429, "json">) | (Response & import("hono").TypedResponse<{
    error: string;
}, 503, "json">) | undefined>;
