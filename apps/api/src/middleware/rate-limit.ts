import type { Context, Next } from 'hono';
import { getAuth } from '@hono/clerk-auth';
import { redis } from '../lib/redis';

const WINDOW_SIZE_MS = 60 * 1000; // 1 minute
// Override only for local load or browser QA runs; production keeps the default.
const MAX_REQUESTS = Number(process.env.RATE_LIMIT_MAX_REQUESTS) > 0 ? Number(process.env.RATE_LIMIT_MAX_REQUESTS) : 100;

export const rateLimitMiddleware = async (c: Context, next: Next) => {
    const userId = getAuth(c)?.userId;
    const ip = c.req.header('x-forwarded-for')?.split(',')[0].trim() || c.req.header('x-real-ip') || 'anonymous';
    const identifier = userId ? `user:${userId}` : `ip:${ip}`;
    const key = `ratelimit:${identifier}`;
    const now = Date.now();

    try {
        // Remove old entries and count current window
        await redis.zremrangebyscore(key, 0, now - WINDOW_SIZE_MS);
        const count = await redis.zcard(key);

        c.header('X-RateLimit-Limit', MAX_REQUESTS.toString());
        c.header('X-RateLimit-Remaining', Math.max(0, MAX_REQUESTS - count - 1).toString());
        c.header('X-RateLimit-Reset', Math.ceil((now + WINDOW_SIZE_MS) / 1000).toString());

        if (count >= MAX_REQUESTS) {
            console.warn(`Rate limit exceeded for ${identifier}`);
            const error = {
                error: {
                    json: {
                        message: 'Too many requests. Try again in a minute.',
                        code: -32029,
                        data: { code: 'TOO_MANY_REQUESTS', httpStatus: 429 },
                    },
                },
            };
            // tRPC's SuperJSON transformer unwraps `error.json` for each call.
            const body = c.req.query('batch') === '1'
                ? c.req.path.slice(c.req.path.lastIndexOf('/') + 1).split(',').map(() => error)
                : error;
            return c.json(body, 429);
        }

        // Add current request
        await redis.zadd(key, now, `${now}:${Math.random()}`);
        await redis.expire(key, 60);

        await next();
    } catch (error) {
        // If Redis fails, reject the request to fail closed
        console.error('Rate limiting error:', error);
        return c.json({ error: 'Service temporarily unavailable' }, 503);
    }
};
