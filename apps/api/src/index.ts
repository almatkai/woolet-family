import './env';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger as honoLogger } from 'hono/logger';
import { secureHeaders } from 'hono/secure-headers';
import { trpcServer } from '@hono/trpc-server';
import { clerkMiddleware, getAuth } from '@hono/clerk-auth';
import notifier from 'node-notifier';

import { appRouter } from './routers';
import { createContext } from './lib/trpc';
import { rateLimitMiddleware } from './middleware/rate-limit';
import { startCurrencyRatesCron } from './jobs/currency-rates';
import { startSubscriptionNotificationsCron } from './jobs/subscription-notifications';
import { logger } from './lib/logger';
import { initErrorTracking, PostHogErrorTracking } from './lib/error-tracking';
import { runMigrations, seedDefaultCurrencies } from './db/migrate';
import { db } from './db';
import { users } from './db/schema';
import { eq } from 'drizzle-orm';
import { chatWithCapabilitiesStream } from './services/ai/chat-service';
import { persistChatAttachments } from './services/ai/attachment-storage-service';
import { createHmac, timingSafeEqual } from 'node:crypto';

// Test

// Initialize Error Tracking (PostHog)
initErrorTracking();

// Run migrations on startup
runMigrations()
    .catch((err) => {
        logger.error('Startup migration failed', err);
    })
    .finally(() => {
        seedDefaultCurrencies().catch(() => {});
    });

const app = new Hono();

// Global middleware
app.use('*', honoLogger((str) => {
    logger.info(str);
}));
app.use('*', secureHeaders());
app.use('*', cors({
    origin: process.env.WEB_URL || 'http://localhost:3000',
    credentials: true,
}));

// Clerk auth middleware. Bun loads dotenv values into process.env, while
// @hono/clerk-auth otherwise looks for bindings on the Hono context.
app.use('*', clerkMiddleware({
    secretKey: process.env.CLERK_SECRET_KEY,
    publishableKey: process.env.CLERK_PUBLISHABLE_KEY || process.env.VITE_CLERK_PUBLISHABLE_KEY,
}));

// Rate limiting
app.use('/trpc/*', rateLimitMiddleware);

// Health check
app.get('/health', (c) => c.json({ status: 'ok', timestamp: new Date().toISOString() }));

// Mint a short-lived Paddle Customer Portal URL for the authenticated user.
// The customer ID comes from our database, never from the browser request.
app.post('/billing/paddle/portal', async (c) => {
    const auth = getAuth(c);
    const userId = auth?.userId;
    if (!userId) return c.json({ error: 'Unauthorized' }, 401);

    const user = await db.query.users.findFirst({ where: eq(users.id, userId) });
    if (!user?.paddleCustomerId) {
        return c.json({ error: 'No Paddle customer found. Complete a Paddle checkout first.' }, 404);
    }

    const apiKey = process.env.PADDLE_API_KEY;
    if (!apiKey) {
        logger.error({ event: 'paddle.portal.missing_api_key' }, 'Paddle API key is not configured');
        return c.json({ error: 'Paddle billing management is not configured.' }, 503);
    }

    const paddleEnvironment = process.env.PADDLE_ENV || process.env.VITE_PADDLE_ENV || 'sandbox';
    const paddleApiBase = paddleEnvironment === 'production'
        ? 'https://api.paddle.com'
        : 'https://sandbox-api.paddle.com';

    try {
        const response = await fetch(`${paddleApiBase}/customers/${encodeURIComponent(user.paddleCustomerId)}/portal-sessions`, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${apiKey}`,
                'Paddle-Version': '1',
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                subscription_ids: user.paddleSubscriptionId ? [user.paddleSubscriptionId] : [],
            }),
        });
        const payload = await response.json() as { data?: { urls?: { general?: { overview?: string } } } };
        const overviewUrl = payload.data?.urls?.general?.overview;

        if (!response.ok || !overviewUrl) {
            logger.error({ event: 'paddle.portal.create_failed', status: response.status }, 'Paddle portal session creation failed');
            return c.json({ error: 'Unable to open Paddle billing management.' }, 502);
        }

        return c.json({ url: overviewUrl });
    } catch (error) {
        logger.error({ event: 'paddle.portal.request_failed', error }, 'Paddle portal request failed');
        return c.json({ error: 'Unable to open Paddle billing management.' }, 502);
    }
});

// Match Paddle's default replay-protection tolerance.
const paddleWebhookToleranceSeconds = 5;

function verifyPaddleSignature(rawBody: string, signatureHeader: string | undefined, secret: string) {
    if (!signatureHeader || !secret) return false;

    let timestampValue = '';
    const receivedSignatures: string[] = [];
    for (const part of signatureHeader.split(';')) {
        const [key, ...value] = part.split('=');
        if (key === 'ts') timestampValue = value.join('=');
        if (key === 'h1') receivedSignatures.push(value.join('='));
    }

    const timestamp = Number(timestampValue);

    if (!Number.isFinite(timestamp) || receivedSignatures.length === 0) return false;
    if (Math.abs(Date.now() / 1000 - timestamp) > paddleWebhookToleranceSeconds) return false;

    const expectedSignature = createHmac('sha256', secret)
        .update(`${timestamp}:${rawBody}`, 'utf8')
        .digest('hex');
    const expectedBuffer = Buffer.from(expectedSignature, 'hex');
    return receivedSignatures.some((receivedSignature) => {
        const receivedBuffer = Buffer.from(receivedSignature, 'hex');
        return expectedBuffer.length === receivedBuffer.length && timingSafeEqual(expectedBuffer, receivedBuffer);
    });
}

function getPaddleTier(priceId: string | undefined): 'pro' | 'premium' | null {
    if (priceId && priceId === process.env.PADDLE_PREMIUM_PRICE_ID) return 'premium';
    if (priceId && priceId === process.env.PADDLE_PRO_PRICE_ID) return 'pro';
    return null;
}

app.post('/webhooks/paddle', async (c) => {
    const rawBody = await c.req.text();
    const signature = c.req.header('Paddle-Signature');
    const secret = process.env.PADDLE_NOTIFICATION_WEBHOOK_SECRET || '';

    if (!verifyPaddleSignature(rawBody, signature, secret)) {
        logger.warn({ event: 'paddle.webhook.invalid_signature' }, 'Rejected Paddle webhook');
        return c.json({ error: 'Invalid signature' }, 400);
    }

    try {
        const payload = JSON.parse(rawBody) as {
            event_type?: string;
            occurred_at?: string;
            data?: {
                id?: string;
                customer_id?: string;
                status?: string;
                custom_data?: { user_id?: string; tier?: 'pro' | 'premium' };
                items?: Array<{ price?: { id?: string; product_id?: string } }>;
                scheduled_change?: { effective_at?: string | null } | null;
            };
        };
        const data = payload.data;
        const eventType = payload.event_type;

        const supportedEventTypes = [
            'transaction.completed',
            'subscription.created',
            'subscription.updated',
            'subscription.canceled',
            'subscription.trialing',
            'subscription.activated',
            'subscription.past_due',
            'subscription.paused',
            'subscription.resumed',
        ];

        if (!data || !data.id || !supportedEventTypes.includes(eventType || '')) {
            return c.json({ received: true });
        }

        // transaction.completed is useful for audit/observability, but recurring
        // access is granted only from subscription state notifications below.
        if (eventType === 'transaction.completed') {
            logger.info({ event: 'paddle.transaction.completed', transactionId: data.id }, 'Received Paddle transaction completion');
            return c.json({ received: true });
        }

        const customUserId = data.custom_data?.user_id;
        if (!customUserId && !data.customer_id) {
            logger.warn({ event: 'paddle.webhook.missing_user_mapping', subscriptionId: data.id }, 'Paddle event has no user mapping');
            return c.json({ received: true });
        }

        const occurredAt = payload.occurred_at ? new Date(payload.occurred_at) : new Date();
        if (Number.isNaN(occurredAt.getTime())) {
            return c.json({ error: 'Invalid event timestamp' }, 400);
        }

        const user = await db.query.users.findFirst({
            where: customUserId
                ? eq(users.id, customUserId)
                : data.customer_id
                    ? eq(users.paddleCustomerId, data.customer_id)
                    : undefined,
        });

        if (!user) {
            logger.warn({ event: 'paddle.webhook.user_not_found', userId: customUserId, customerId: data.customer_id }, 'Paddle user not found');
            return c.json({ error: 'User not found' }, 404);
        }

        if (user.paddleEventOccurredAt && occurredAt <= user.paddleEventOccurredAt) {
            return c.json({ received: true, ignored: 'stale_event' });
        }

        const price = data.items?.[0]?.price;
        const tier = getPaddleTier(price?.id);
        const status = data.status || (eventType === 'subscription.canceled' ? 'canceled' : 'unknown');
        const shouldHaveAccess = status === 'active' || status === 'trialing' || status === 'past_due';

        if (shouldHaveAccess && !tier) {
            logger.error({ event: 'paddle.webhook.unknown_price', priceId: price?.id }, 'Paddle subscription price is not configured');
            return c.json({ error: 'Unknown Paddle price' }, 400);
        }

        await db.update(users)
            .set({
                subscriptionTier: shouldHaveAccess ? (tier || user.subscriptionTier) : 'free',
                paddleCustomerId: data.customer_id || user.paddleCustomerId,
                paddleSubscriptionId: data.id,
                paddlePriceId: price?.id || user.paddlePriceId,
                paddleSubscriptionStatus: status,
                paddleScheduledChangeAt: data.scheduled_change?.effective_at
                    ? new Date(data.scheduled_change.effective_at)
                    : null,
                paddleEventOccurredAt: occurredAt,
                updatedAt: new Date(),
            })
            .where(eq(users.id, user.id));

        logger.info({ event: 'paddle.webhook.processed', eventType, userId: user.id, status, tier }, 'Processed Paddle webhook');
        return c.json({ received: true });
    } catch (error) {
        logger.error({ event: 'paddle.webhook.failed', error }, 'Failed to process Paddle webhook');
        return c.json({ error: 'Webhook processing failed' }, 500);
    }
});

app.post('/ai/chat/stream', async (c) => {
    const auth = getAuth(c);
    const userId = auth?.userId;

    if (!userId) {
        return c.json({ error: 'Unauthorized' }, 401);
    }

    let user = await db.query.users.findFirst({
        where: eq(users.id, userId),
    });

    if (!user) {
        const sessionClaims = auth?.sessionClaims as { email?: string; name?: string } | undefined;
        const [newUser] = await db.insert(users).values({
            id: userId,
            email: sessionClaims?.email || `${userId}@placeholder.local`,
            name: sessionClaims?.name,
            defaultCurrency: 'USD',
        }).returning();
        user = newUser;
    }

    const body: {
        message?: string;
        sessionId?: string | null;
        attachments?: Array<{ name?: string; mimeType?: string; dataUrl?: string; qrText?: string }>;
        settings?: { allowAutonomousTransactions?: boolean };
    } = await c.req.json().catch(() => ({}));
    const message = body.message?.trim();

    if (!message) {
        return c.json({ error: 'Message is required' }, 400);
    }

    const attachments = (body.attachments || [])
        .filter((attachment) =>
            typeof attachment.name === 'string' &&
            typeof attachment.mimeType === 'string' &&
            typeof attachment.dataUrl === 'string' &&
            (attachment.mimeType.startsWith('image/') || attachment.mimeType === 'application/pdf') &&
            (attachment.dataUrl.startsWith('data:image/') || attachment.dataUrl.startsWith('data:application/pdf')) &&
            attachment.dataUrl.length <= 8_000_000
        )
        .slice(0, 5)
        .map((attachment) => ({
            name: attachment.name!,
            mimeType: attachment.mimeType!,
            dataUrl: attachment.dataUrl!,
            qrText: typeof attachment.qrText === 'string' ? attachment.qrText.slice(0, 4000) : undefined,
        }));

    const encoder = new TextEncoder();
    let streamClosed = false;
    const stream = new ReadableStream({
        start(controller) {
            let persistencePromise: Promise<unknown> | null = null;
            const send = (event: unknown) => {
                if (
                    !persistencePromise &&
                    attachments.length > 0 &&
                    event &&
                    typeof event === 'object' &&
                    (event as { type?: unknown }).type === 'session' &&
                    typeof (event as { sessionId?: unknown }).sessionId === 'string'
                ) {
                    persistencePromise = persistChatAttachments({
                        userId,
                        sessionId: (event as { sessionId: string }).sessionId,
                        attachments,
                    });
                }
                if (streamClosed) return;
                try {
                    controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
                } catch {
                    streamClosed = true;
                }
            };

            const run = chatWithCapabilitiesStream(
                {
                    userId,
                    userTier: user.subscriptionTier || 'free',
                    message,
                    sessionId: body.sessionId || null,
                    attachments,
                    settings: {
                        allowAutonomousTransactions: body.settings?.allowAutonomousTransactions === true,
                    },
                },
                send
            ).finally(async () => {
                await persistencePromise;
                if (!streamClosed) {
                    streamClosed = true;
                    controller.close();
                }
            });

            run.catch((error) => {
                logger.error({
                    event: 'ai.chat_stream_background_failed',
                    userId,
                    error: error instanceof Error ? error.message : String(error),
                });
            });
        },
        cancel() {
            streamClosed = true;
            // The browser connection can disappear; the chat run keeps persisting in the background.
        },
    });

    return new Response(stream, {
        headers: {
            'Content-Type': 'text/event-stream; charset=utf-8',
            'Cache-Control': 'no-cache, no-transform',
            Connection: 'keep-alive',
            'X-Accel-Buffering': 'no',
        },
    });
});

app.onError((err, c) => {
    logger.error({
        err,
        path: c.req.path,
        method: c.req.method,
    }, '❌ Application Error');

    // Capture exception in PostHog
    PostHogErrorTracking.captureException(err, {
        extra: {
            path: c.req.path,
            method: c.req.method,
        }
    });

    const isDev = process.env.NODE_ENV === 'development';

    if (isDev) {
        notifier.notify({
            title: 'Woolet API Error',
            message: `${c.req.method} ${c.req.path}: ${err.message}`,
            sound: 'Basso', // macOS specific sound
        });
    }

    return c.json({
        error: err.message,
        ...(isDev && { stack: err.stack })
    }, 500);
});

// tRPC handler
app.use('/trpc/*', trpcServer({
    router: appRouter,
    createContext,
}));

const port = parseInt(process.env.PORT || '3006');
const idleTimeout = Number(process.env.API_IDLE_TIMEOUT || '60');

// Start background jobs
startCurrencyRatesCron();
startSubscriptionNotificationsCron();

logger.info({
    event: 'server.start',
    url: `http://localhost:${port}`,
    port,
});

export default {
    port,
    idleTimeout,
    fetch: app.fetch,
};
