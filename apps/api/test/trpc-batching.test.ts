import { expect, test } from 'bun:test';
import { Hono } from 'hono';
import { trpcServer } from '@hono/trpc-server';
import { initTRPC } from '@trpc/server';
import superjson from 'superjson';

test('Hono fetch adapter accepts batches with the default server options', async () => {
    const t = initTRPC.create({ transformer: superjson });
    const router = t.router({
        first: t.procedure.query(() => ({ value: 'first' })),
        second: t.procedure.query(() => ({ value: 'second' })),
        third: t.procedure.query(() => ({ value: 'third' })),
    });
    const app = new Hono();
    app.use('/trpc/*', trpcServer({ router }));
    const input = encodeURIComponent(JSON.stringify({ 0: superjson.serialize(null), 1: superjson.serialize(null), 2: superjson.serialize(null) }));
    const response = await app.request(`/trpc/first,second,third?batch=1&input=${input}`);
    expect(response.status).toBe(200);
    const results = await response.json() as { result: { data: ReturnType<typeof superjson.serialize> } }[];
    expect(results.map(result => superjson.deserialize(result.result.data))).toEqual([
        { value: 'first' }, { value: 'second' }, { value: 'third' },
    ]);
});
