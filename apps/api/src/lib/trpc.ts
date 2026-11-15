import { initTRPC, TRPCError } from '@trpc/server';
import type { Context as HonoContext } from 'hono';
import { getAuth } from '@hono/clerk-auth';
import { eq } from 'drizzle-orm';
import { db } from '../db';
import { users, admins, currencyBalances, accounts } from '../db/schema';
import superjson from 'superjson';
import { FamilyLimitError } from './household/errors';
import { PostHogErrorTracking } from './error-tracking';
import { DEMO_RESTRICTED_MESSAGE, getDemoRole, isDemoProcedureAllowed } from './demo';

export interface Context {
    db: typeof db;
    userId: string | null;
    honoContext: HonoContext;
    user?: {
        id: string;
        email?: string;
        name?: string;
        defaultCurrency?: string;
        subscriptionTier?: string;
        testMode?: boolean;
    };
}

import { FetchCreateContextFnOptions } from '@trpc/server/adapters/fetch';

export const createContext = async (opts: FetchCreateContextFnOptions, c: HonoContext): Promise<Record<string, unknown>> => {
    try {
        const auth = getAuth(c);
        return {
            db,
            userId: auth?.userId ?? null,
            honoContext: c,
        };
    } catch (err) {
        console.error('Error in createContext:', err);
        throw err;
    }
};

const t = initTRPC.context<Context>().create({
    transformer: superjson,
    errorFormatter({ shape, error }) {
        // Report specific errors to PostHog
        if (error.code === 'INTERNAL_SERVER_ERROR') {
            PostHogErrorTracking.captureException(error);
        }
        if (error.cause instanceof FamilyLimitError) {
            return { ...shape, data: { ...shape.data, limitViolation: error.cause.payload } };
        }
        return shape;
    },
});

export const router = t.router;
export const publicProcedure = t.procedure;

export const protectedProcedure = t.procedure.use(async ({ ctx, next, path, type, rawInput }) => {
    if (!ctx.userId) {
        throw new TRPCError({
            code: 'UNAUTHORIZED',
            message: 'You must be logged in to access this resource',
        });
    }

    if (getDemoRole(ctx.userId) && !isDemoProcedureAllowed(path, type)) {
        throw new TRPCError({ code: 'FORBIDDEN', message: DEMO_RESTRICTED_MESSAGE });
    }
    if (getDemoRole(ctx.userId) && type === 'mutation' && ['transaction.create', 'account.adjustBalance', 'account.addCurrency'].includes(path)) {
        const input = rawInput && typeof rawInput === 'object' ? rawInput as Record<string, unknown> : {};
        // Quick splits can notify other users; foreign transfers can change real
        // balances. Neither is part of the public, shared sample-money sandbox.
        if (input.split || input.parentTransactionId || input.idempotencyKey) {
            throw new TRPCError({ code: 'FORBIDDEN', message: DEMO_RESTRICTED_MESSAGE });
        }
        for (const key of ['currencyBalanceId', 'toCurrencyBalanceId']) {
            if (typeof input[key] !== 'string') continue;
            const balance = await ctx.db.query.currencyBalances.findFirst({
                where: eq(currencyBalances.id, input[key]),
                with: { account: { with: { bank: true } } },
            });
            if (!balance || balance.account.bank.userId !== ctx.userId) {
                throw new TRPCError({ code: 'FORBIDDEN', message: 'Demo transactions must use this demo account’s own balances.' });
            }
        }
        if (typeof input.accountId === 'string') {
            const account = await ctx.db.query.accounts.findFirst({ where: eq(accounts.id, input.accountId), with: { bank: true } });
            if (!account || account.bank.userId !== ctx.userId) {
                throw new TRPCError({ code: 'FORBIDDEN', message: 'Demo currencies must belong to this demo account.' });
            }
        }
    }

    // Identify user in PostHog
    PostHogErrorTracking.setUser({ id: ctx.userId });

    // Auto-sync user: ensure user exists in database
    let user = await ctx.db.query.users.findFirst({
        where: eq(users.id, ctx.userId),
    });

    if (!user) {
        // Get Clerk user info from the auth context
        const auth = getAuth(ctx.honoContext);

        // Create user with available info (email from Clerk session claims)
        const sessionClaims = auth?.sessionClaims as { email?: string; name?: string } | undefined;
        const email = sessionClaims?.email || `${ctx.userId}@placeholder.local`;
        const name = sessionClaims?.name;

        try {
            const [newUser] = await ctx.db.insert(users).values({
                id: ctx.userId,
                email: email,
                name: name,
                defaultCurrency: 'USD',
            }).returning();
            user = newUser;
            console.log(`✅ Auto-created user: ${ctx.userId}`);
        } catch (err) {
            // User might have been created by a concurrent request
            console.log(`User ${ctx.userId} already exists or creation failed:`, err);
            // Fetch again
            user = await ctx.db.query.users.findFirst({
                where: eq(users.id, ctx.userId),
            });
        }
    }

    if (!user) {
        throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Failed to find or create user',
        });
    }

    return next({
        ctx: {
            ...ctx,
            userId: ctx.userId,
            user,
        },
    });
});

export const adminProcedure = protectedProcedure.use(async ({ ctx, next }) => {
    if (getDemoRole(ctx.userId)) throw new TRPCError({ code: 'FORBIDDEN', message: DEMO_RESTRICTED_MESSAGE });
    // Check if the user is in the admins table
    const admin = await ctx.db.query.admins.findFirst({
        where: eq(admins.id, ctx.userId),
    });

    if (!admin) {
        throw new TRPCError({
            code: 'UNAUTHORIZED',
            message: 'You do not have administrative privileges',
        });
    }

    return next();
});
