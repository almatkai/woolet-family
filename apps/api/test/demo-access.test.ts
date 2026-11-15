import { afterEach, beforeEach, describe, expect, test } from 'bun:test';
import { createDemoRoutes } from '../src/routes/demo';
import { getDemoRole, isDemoProcedureAllowed } from '../src/lib/demo';
import { protectedProcedure, router } from '../src/lib/trpc';
import { createMockContext } from './utils';
import { executeCapability } from '../src/services/ai/capability-registry';

const keys = ['DEMO_ENABLED', 'DEMO_OWNER_USER_ID', 'DEMO_PARTNER_USER_ID', 'DEMO_CHILD_USER_ID', 'CLERK_SECRET_KEY', 'WEB_URL'] as const;
let original: Record<string, string | undefined>;
beforeEach(() => {
    original = Object.fromEntries(keys.map(key => [key, process.env[key]]));
    Object.assign(process.env, { DEMO_ENABLED: 'true', DEMO_OWNER_USER_ID: 'user_demoOwner', DEMO_PARTNER_USER_ID: 'user_demoPartner', DEMO_CHILD_USER_ID: 'user_demoChild', CLERK_SECRET_KEY: 'test-placeholder', WEB_URL: 'https://app.woolet.example' });
});
afterEach(() => { for (const key of keys) { if (original[key] === undefined) delete process.env[key]; else process.env[key] = original[key]; } });

function fixture(options: { signedIn?: string | null; email?: string; rate?: boolean; unavailable?: boolean } = {}) {
    const minted: string[] = [];
    const app = createDemoRoutes({
        findUser: async () => options.unavailable ? undefined : { email: options.email ?? 'alex@demo.woolet.cc' },
        createToken: async userId => { minted.push(userId); return 'one-time-ticket'; },
        signedInUserId: () => options.signedIn ?? null,
        takeRateLimit: async () => options.rate ?? true,
    });
    const start = (body: unknown = {}, origin: string | null = 'https://app.woolet.example') => app.request('/start', {
        method: 'POST', headers: { 'content-type': 'application/json', ...(origin ? { origin } : {}) }, body: JSON.stringify(body),
    });
    return { app, minted, start };
}

describe('public demo tickets', () => {
    test('accepts the production bare-host WEB_URL without weakening origin checks', async () => {
        process.env.WEB_URL = 'app.woolet.cc';
        const { start, minted } = fixture();
        expect((await start({}, 'https://app.woolet.cc')).status).toBe(200);
        expect((await start({}, 'http://app.woolet.cc')).status).toBe(403);
        expect((await start({}, 'https://evil.example')).status).toBe(403);
        expect(minted).toHaveLength(1);
    });
    test('disabled demo exposes no ticket', async () => {
        process.env.DEMO_ENABLED = 'false';
        const { app, start, minted } = fixture();
        expect(await (await app.request('/status')).json()).toEqual({ enabled: false });
        expect((await start()).status).toBe(404);
        expect(minted).toEqual([]);
    });
    test('only fixed roles can mint a ticket; user IDs and extra properties are rejected', async () => {
        const { start, minted } = fixture();
        for (const body of [{ userId: 'user_real' }, { role: 'admin' }, { role: 'owner', userId: 'user_real' }]) expect((await start(body)).status).toBe(400);
        expect(minted).toEqual([]);
        const response = await start({ role: 'partner' });
        expect(response.status).toBe(200);
        expect(await response.json()).toEqual({ token: 'one-time-ticket', role: 'partner' });
        expect(response.headers.get('cache-control')).toBe('no-store');
        expect(minted).toEqual(['user_demoPartner']);
    });
    test('default owner works, existing demo actors can switch', async () => {
        const { start, minted } = fixture({ signedIn: 'user_demoChild' });
        expect((await start()).status).toBe(200);
        expect(minted).toEqual(['user_demoOwner']);
    });
    test('cross-origin, missing-origin and personal sessions cannot mint tickets', async () => {
        const { start, minted } = fixture();
        expect((await start({}, 'https://evil.example')).status).toBe(403);
        expect((await start({}, null)).status).toBe(403);
        const personal = fixture({ signedIn: 'user_real' });
        expect((await personal.start()).status).toBe(403);
        expect([...minted, ...personal.minted]).toEqual([]);
    });
    test('real/missing account, duplicate actor config and rate exhaustion fail closed', async () => {
        for (const options of [{ email: 'real@example.com' }, { unavailable: true }]) {
            const { start, minted } = fixture(options);
            expect((await start()).status).toBe(503);
            expect(minted).toEqual([]);
        }
        const limited = fixture({ rate: false });
        expect((await limited.start()).status).toBe(429);
        expect(limited.minted).toEqual([]);
        process.env.DEMO_PARTNER_USER_ID = process.env.DEMO_OWNER_USER_ID;
        expect((await fixture().start()).status).toBe(404);
        expect(getDemoRole('user_demoOwner')).toBeNull();
    });
    test('provider/Redis failures return a generic error without a ticket', async () => {
        const app = createDemoRoutes({ signedInUserId: () => null, takeRateLimit: async () => { throw Error('private infrastructure details'); } });
        const response = await app.request('/start', { method: 'POST', headers: { origin: 'https://app.woolet.example', 'content-type': 'application/json' }, body: '{}' });
        expect(response.status).toBe(503);
        expect(await response.text()).not.toContain('private infrastructure details');
    });
});

test('demo policy blocks destructive and external actions, allows own sample wallet edits', () => {
    for (const path of ['user.deleteAccount', 'user.deleteAllData', 'user.importData', 'user.update', 'household.invite', 'household.acceptInvitation', 'household.leave', 'household.removeMember', 'debt.create', 'splitBill.payIncomingRequestNow', 'notification.create', 'settings.updateUserSettings', 'ai.updateAiConfig', 'currency.addManualRate', 'investing.clearCache', 'investing.resetCacheStats', 'subscription.checkAndNotifyDueSubscriptions']) {
        expect(isDemoProcedureAllowed(path, 'mutation')).toBe(false);
    }
    expect(isDemoProcedureAllowed('user.searchByUsername', 'query')).toBe(false);
    for (const path of ['transaction.create', 'household.addTransaction', 'household.transfer', 'household.setLimit', 'ai.chat', 'ai.executeCapability']) expect(isDemoProcedureAllowed(path, 'mutation')).toBe(true);
});

test('direct and aliased AI capabilities cannot bypass the demo mutation policy', async () => {
    for (const capabilityId of ['transactions.create.v1', 'create_transaction']) {
        expect(await executeCapability({ userId: 'user_demoOwner', capabilityId, args: {} })).toMatchObject({ success: false, error: { code: 'DEMO_READ_ONLY' } });
    }
});

test('demo cannot bypass split/transfer isolation through the quick transaction endpoint', async () => {
    let called = false;
    const api = router({ transaction: router({ create: protectedProcedure.mutation(() => { called = true; return true; }) }) });
    const caller = api.createCaller(createMockContext({ userId: 'user_demoOwner', db: { query: { currencyBalances: { findFirst: async () => ({ account: { bank: { userId: 'user_real' } } }) } } } as any }));
    for (const input of [{ split: { participantIds: ['real'] } }, { currencyBalanceId: 'foreign' }, { toCurrencyBalanceId: 'foreign' }]) {
        await expect((caller.transaction.create as any)(input)).rejects.toMatchObject({ code: 'FORBIDDEN' });
    }
    expect(called).toBe(false);
});

test('tRPC enforces demo restrictions before resolver; personal users are unaffected', async () => {
    let called = false;
    const api = router({ user: router({ deleteAccount: protectedProcedure.mutation(() => { called = true; return true; }) }) });
    await expect(api.createCaller(createMockContext({ userId: 'user_demoOwner' })).user.deleteAccount()).rejects.toMatchObject({ code: 'FORBIDDEN' });
    expect(called).toBe(false);
    expect(await api.createCaller(createMockContext({ userId: 'user_real' })).user.deleteAccount()).toBe(true);
});

test('demo balance adjustments and added currencies cannot target another user', async () => {
    let called = false;
    const action = () => { called = true; return true; };
    const api = router({ account: router({ adjustBalance: protectedProcedure.mutation(action), addCurrency: protectedProcedure.mutation(action) }) });
    const caller = api.createCaller(createMockContext({ userId: 'user_demoOwner', db: { query: {
        currencyBalances: { findFirst: async () => ({ account: { bank: { userId: 'user_real' } } }) },
        accounts: { findFirst: async () => ({ bank: { userId: 'user_real' } }) },
    } } as any }));
    await expect((caller.account.adjustBalance as any)({ currencyBalanceId: 'foreign', newBalance: 1000 })).rejects.toMatchObject({ code: 'FORBIDDEN' });
    await expect((caller.account.addCurrency as any)({ accountId: 'foreign', currencyCode: 'USD' })).rejects.toMatchObject({ code: 'FORBIDDEN' });
    expect(called).toBe(false);
});
