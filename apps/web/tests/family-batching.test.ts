import { mock, test } from 'bun:test';
import assert from 'node:assert/strict';
import { createTRPCUntypedClient, httpBatchLink, TRPCClientError } from '@trpc/client';
import { QueryClient } from '@tanstack/react-query';
import superjson from 'superjson';
import { Hono } from '../../api/node_modules/hono';
import { trpcServer } from '../../api/node_modules/@hono/trpc-server';
import { initTRPC } from '../../api/node_modules/@trpc/server';

let limited = false;
mock.module('../../api/src/lib/redis', () => ({ redis: {
    zremrangebyscore: async () => 0, zcard: async () => limited ? 100 : 0,
    zadd: async () => 1, expire: async () => 1,
} }));
mock.module('@hono/clerk-auth', () => ({ getAuth: () => ({ userId: 'batch-check' }) }));
const { rateLimitMiddleware } = await import('../../api/src/middleware/rate-limit');
const t = initTRPC.create({ transformer: superjson });
const query = () => t.procedure.query(() => ({ ok: true }));
const app = new Hono();
app.use('/trpc/*', rateLimitMiddleware);
app.use('/trpc/*', trpcServer({ router: t.router({
    household: t.router({ get: query(), overview: query(), familyTransactions: query(), wallets: query(), familyTax: query(), familyFinances: query() }),
    user: t.router({ me: query(), getLimits: query(), getSettings: query() }),
    notification: t.router({ list: query() }),
}) }));
const requests: string[] = [];
const client = createTRPCUntypedClient({
    transformer: superjson,
    links: [httpBatchLink({ url: 'http://qa.invalid/trpc', maxURLLength: 2083,
        headers: async () => ({ Authorization: 'Bearer fixture' }),
        fetch: async (url, options) => {
            requests.push(String(url));
            return app.request(String(url), options as RequestInit);
        },
    })],
});
const input = { month: '2026-11', today: '2026-11-15', currency: undefined, memberId: undefined, categoryId: undefined };

test('cold Family home query waves use two HTTP batches', async () => {
    const cache = new QueryClient({ defaultOptions: { queries: { staleTime: 60_000, retry: false, cacheTime: 0 } } });
    const call = (path: string, input?: unknown) => cache.fetchQuery({ queryKey: [path, input], queryFn: () => client.query(path, input) });
    await Promise.all([
        call('household.get'), call('user.me'), call('user.getLimits'), call('user.getSettings'), call('notification.list', { limit: 20 }),
    ]);
    await Promise.all([
        call('household.overview', input),
        call('household.overview', { month: input.month, today: input.today, currency: undefined, categoryId: undefined }),
        call('household.overview', { month: input.month, today: input.today, currency: undefined, memberId: undefined }),
        call('household.familyTransactions', { month: input.month, memberId: undefined, categoryId: undefined, date: undefined, limit: 8 }),
        call('household.wallets', { today: input.today }),
        call('household.familyTax', { taxYear: 2026 }),
        call('household.familyFinances', { currency: undefined }),
    ]);
    assert.equal(requests.length, 2);
    assert(requests.every(url => url.length <= 2083));
    console.log(JSON.stringify({ scenario: 'cold shell then unfiltered Family home, real QueryClient + httpBatchLink + Hono adapter', requests: requests.length, batchSizes: requests.map(url => new URL(url).pathname.split('/').at(-1)!.split(',').length), urlLengths: requests.map(url => url.length) }));
    cache.clear();
});

test('real client decodes every rate-limit error in an HTTP 429 batch', async () => {
    limited = true;
    const denials = await Promise.allSettled([
        client.query('household.get'), client.query('household.overview', input), client.query('household.familyFinances', {}),
    ]);
    for (const result of denials) {
        assert.equal(result.status, 'rejected');
        if (result.status !== 'rejected') continue;
        assert(result.reason instanceof TRPCClientError);
        assert.equal(result.reason.message, 'Too many requests. Try again in a minute.');
        assert.equal(result.reason.data.code, 'TOO_MANY_REQUESTS');
        assert.equal(result.reason.data.httpStatus, 429);
    }
    limited = false;
});
