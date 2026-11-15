import { afterEach, beforeEach, expect, test } from 'bun:test';
import { PgDialect } from 'drizzle-orm/pg-core';
import { db } from '../src/db';
import { AiUsageService } from '../src/services/ai/ai-usage-service';
import { chatWithCapabilities, chatWithCapabilitiesStream, getChatUsageStats } from '../src/services/ai/chat-service';

const mutableDb = db as any;
const environmentKeys = ['DEMO_OWNER_USER_ID', 'DEMO_PARTNER_USER_ID', 'DEMO_CHILD_USER_ID'] as const;
let originalEnvironment: Record<string, string | undefined>;
let originalTransaction: any;
let originalUpdate: any;
beforeEach(() => {
    originalEnvironment = Object.fromEntries(environmentKeys.map(key => [key, process.env[key]]));
    Object.assign(process.env, { DEMO_OWNER_USER_ID: 'user_demoOwner', DEMO_PARTNER_USER_ID: 'user_demoPartner', DEMO_CHILD_USER_ID: 'user_demoChild' });
    originalTransaction = mutableDb.transaction;
    originalUpdate = mutableDb.update;
});
afterEach(() => {
    mutableDb.transaction = originalTransaction;
    mutableDb.update = originalUpdate;
    for (const key of environmentKeys) { if (originalEnvironment[key] === undefined) delete process.env[key]; else process.env[key] = originalEnvironment[key]; }
});

/** Serialized row locks + real generated SQL predicates model the DB boundary. */
function installUsage(initial = 0, date = new Date().toISOString().slice(0, 10)) {
    const state = { id: 'usage-row', userId: 'user_demoOwner', questionCountLifetime: initial, questionCountToday: initial, lastResetDate: date };
    let tail = Promise.resolve();
    const dialect = new PgDialect();
    const tx = {
        select: () => ({ from: () => ({ where: () => ({ for: async () => [{ id: state.userId }] }) }) }),
        query: { aiUsage: { findFirst: async () => ({ ...state }) } },
        update: () => ({ set: (values: any) => ({ where: (predicate: any) => ({ returning: async () => {
            const query = dialect.sqlToQuery(predicate);
            if (query.sql.includes(' < ')) {
                expect(query.params).toEqual(['usage-row', 50]);
                if (state.questionCountLifetime >= 50) return [];
                state.questionCountLifetime += 1;
                state.questionCountToday += 1;
            } else if (values.questionCountToday === 0) {
                state.questionCountToday = 0;
                state.lastResetDate = values.lastResetDate;
            }
            return [{ ...state }];
        } }) }) }),
    };
    mutableDb.transaction = (run: any) => {
        const next = tail.then(() => run(tx));
        tail = next.then(() => undefined, () => undefined);
        return next;
    };
    mutableDb.update = () => ({ set: () => ({ where: async () => { state.questionCountLifetime -= 1; state.questionCountToday = Math.max(0, state.questionCountToday - 1); } }) });
    return state;
}

test('parallel demo questions cannot reserve more than 50 lifetime credits', async () => {
    const state = installUsage(49);
    const results = await Promise.allSettled(Array.from({ length: 4 }, () => AiUsageService.reserveDemoQuestion('user_demoOwner')));
    expect(results.filter(result => result.status === 'fulfilled')).toHaveLength(1);
    expect(results.filter(result => result.status === 'rejected')).toHaveLength(3);
    expect(state.questionCountLifetime).toBe(50);
});

test('a new day resets the daily display but never restores lifetime demo questions', async () => {
    const state = installUsage(50, '2000-01-01');
    const stats = await getChatUsageStats('user_demoOwner', 'premium');
    expect(stats).toMatchObject({ usageToday: 0, usageLifetime: 50, limit: 0, lifetimeLimit: 50, remaining: 0, isFull: false });
    await expect(AiUsageService.reserveDemoQuestion('user_demoOwner')).rejects.toMatchObject({ code: 'FORBIDDEN' });
    expect(state.questionCountLifetime).toBe(50);
});

test('failed demo generation can return its reserved credit', async () => {
    const state = installUsage(49);
    const reservation = await AiUsageService.reserveDemoQuestion('user_demoOwner');
    await AiUsageService.releaseDemoQuestion(reservation, 'user_demoOwner');
    expect(state.questionCountLifetime).toBe(49);
    expect(await AiUsageService.reserveDemoQuestion('user_demoOwner')).toBe('usage-row');
});

test('streaming and nonstreaming chats reject exhausted demo before provider work', async () => {
    installUsage(50);
    const request = { userId: 'user_demoOwner', userTier: 'premium', message: 'Where did our money go?' };
    await expect(chatWithCapabilities(request)).rejects.toMatchObject({ code: 'FORBIDDEN' });
    const events: unknown[] = [];
    await chatWithCapabilitiesStream(request, event => { events.push(event); });
    expect(events).toEqual([{ type: 'error', message: expect.stringContaining('50 AI questions') }]);
});
