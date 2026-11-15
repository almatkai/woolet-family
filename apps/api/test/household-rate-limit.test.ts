import superjson from 'superjson';
import { expect, mock, test } from 'bun:test';
import { Hono } from 'hono';
const keys: string[] = [];
let requestCount = 0;
const originalRedis = await import('../src/lib/redis');
const originalClerk = await import('@hono/clerk-auth');
mock.module('../src/lib/redis', () => ({ ...originalRedis, redis: {
    zremrangebyscore: async (key: string) => { keys.push(key); },
    zcard: async () => requestCount, zadd: async () => 1, expire: async () => 1,
} }));
mock.module('@hono/clerk-auth', () => ({ ...originalClerk, getAuth: (c: any) => ({ userId: c.req.header('test-user') }) }));
const { rateLimitMiddleware } = await import('../src/middleware/rate-limit');
test('Clerk users have independent buckets behind one IP; anonymous uses IP', async () => {
    const app = new Hono();
    app.use('*', rateLimitMiddleware);
    app.get('/', c => c.text('ok'));
    for (const user of ['alice', 'bob', '']) {
        expect((await app.request('/', { headers: { 'test-user': user, 'x-forwarded-for': '192.0.2.1, 192.0.2.2' } })).status).toBe(200);
    }
    expect(keys).toEqual(['ratelimit:user:alice', 'ratelimit:user:bob', 'ratelimit:ip:192.0.2.1']);
});

for (const calls of [1, 3]) {
    test(`rate limit returns ${calls} readable SuperJSON tRPC error(s)`, async () => {
        requestCount = 100;
        try {
            const app = new Hono();
            app.use('*', rateLimitMiddleware);
            const path = calls === 1 ? '/trpc/household.get' : '/trpc/household.get,household.overview,household.familyFinances?batch=1';
            const response = await app.request(path);
            expect(response.status).toBe(429);
            const body = await response.json() as { error: ReturnType<typeof superjson.serialize> } | { error: ReturnType<typeof superjson.serialize> }[];
            const errors = Array.isArray(body) ? body : [body];
            expect(errors).toHaveLength(calls);
            for (const result of errors) {
                expect(superjson.deserialize<Record<string, unknown>>(result.error)).toEqual({
                    message: 'Too many requests. Try again in a minute.',
                    code: -32029,
                    data: { code: 'TOO_MANY_REQUESTS', httpStatus: 429 },
                });
            }
        } finally {
            requestCount = 0;
        }
    });
}
