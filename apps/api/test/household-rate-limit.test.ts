import { expect, mock, test } from 'bun:test';
import { Hono } from 'hono';
const keys: string[] = [];
const originalRedis = await import('../src/lib/redis');
const originalClerk = await import('@hono/clerk-auth');
mock.module('../src/lib/redis', () => ({ ...originalRedis, redis: {
    zremrangebyscore: async (key: string) => { keys.push(key); },
    zcard: async () => 0, zadd: async () => 1, expire: async () => 1,
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
