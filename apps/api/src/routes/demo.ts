import { createHash } from 'node:crypto';
import { createClerkClient } from '@clerk/backend';
import { getAuth } from '@hono/clerk-auth';
import { eq } from 'drizzle-orm';
import { Hono, type Context } from 'hono';
import { z } from 'zod';
import { db } from '../db';
import { users } from '../db/schema';
import { DEMO_EMAIL_SUFFIX, DEMO_ROLES, getDemoActors, getDemoRole, isDemoEnabled } from '../lib/demo';
import { redis } from '../lib/redis';

const inputSchema = z.object({ role: z.enum(DEMO_ROLES).default('owner') }).strict();
const rateLimitScript = `
local count = redis.call('INCR', KEYS[1])
if count == 1 then redis.call('EXPIRE', KEYS[1], ARGV[1]) end
return count
`;

type Dependencies = {
    findUser: (userId: string) => Promise<{ email: string } | undefined>;
    createToken: (userId: string) => Promise<string>;
    takeRateLimit: (identifier: string, seconds: number, limit: number) => Promise<boolean>;
    signedInUserId: (c: Context) => string | null;
};
const defaults: Dependencies = {
    findUser: userId => db.query.users.findFirst({ where: eq(users.id, userId), columns: { email: true } }),
    createToken: async userId => {
        const clerk = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY });
        const ticket = await clerk.signInTokens.createSignInToken({ userId, expiresInSeconds: 60 });
        return ticket.token;
    },
    takeRateLimit: async (identifier, seconds, limit) => Number(await redis.eval(rateLimitScript, 1, `demo:signin:${identifier}`, seconds)) <= limit,
    signedInUserId: c => getAuth(c)?.userId ?? null,
};

export function createDemoRoutes(overrides: Partial<Dependencies> = {}) {
    const dependencies = { ...defaults, ...overrides };
    const app = new Hono();
    app.use('*', async (c, next) => {
        c.header('Cache-Control', 'no-store');
        await next();
    });
    app.get('/status', c => c.json({ enabled: isDemoEnabled() }));
    app.post('/start', async c => {
        if (!isDemoEnabled()) return c.json({ error: 'Demo is not available.' }, 404);
        let allowedOrigin: string;
        try {
            const configured = process.env.WEB_URL?.trim();
            if (!configured) throw new Error('Missing web origin');
            const parsed = new URL(configured.includes('://') ? configured : `https://${configured}`);
            if (!['https:', 'http:'].includes(parsed.protocol) || parsed.username || parsed.password) throw new Error('Invalid web origin');
            allowedOrigin = parsed.origin;
        }
        catch { return c.json({ error: 'Demo is not configured.' }, 503); }
        if (c.req.header('origin') !== allowedOrigin) return c.json({ error: 'Invalid request origin.' }, 403);
        const signedInUserId = dependencies.signedInUserId(c);
        if (signedInUserId && !getDemoRole(signedInUserId)) {
            return c.json({ error: 'Sign out of your personal account before opening the demo.' }, 403);
        }
        const input = inputSchema.safeParse(await c.req.json().catch(() => null));
        if (!input.success) return c.json({ error: 'Choose a valid demo role.' }, 400);
        try {
            const ip = c.req.header('x-real-ip') || c.req.header('x-forwarded-for')?.split(',')[0].trim() || 'unknown';
            const ipHash = createHash('sha256').update(ip).digest('hex').slice(0, 24);
            const allowed = await dependencies.takeRateLimit(ipHash, 60, 12);
            const globallyAllowed = await dependencies.takeRateLimit('global', 3600, 300);
            if (!allowed || !globallyAllowed) {
                c.header('Retry-After', '60');
                return c.json({ error: 'Please wait a minute before reopening the demo.' }, 429);
            }
            const userId = getDemoActors()![input.data.role];
            const user = await dependencies.findUser(userId);
            if (!user?.email.toLowerCase().endsWith(DEMO_EMAIL_SUFFIX)) {
                return c.json({ error: 'The sample family is not ready yet.' }, 503);
            }
            const token = await dependencies.createToken(userId);
            return c.json({ token, role: input.data.role });
        } catch {
            // Never log the Clerk ticket, secret, or provider response.
            return c.json({ error: 'Unable to open the demo right now. Please try again.' }, 503);
        }
    });
    return app;
}
