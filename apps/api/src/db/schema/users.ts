import { pgTable, text, timestamp, boolean, jsonb } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
    id: text('id').primaryKey(), // Clerk user ID
    email: text('email').notNull(),
    name: text('name'),
    username: text('username').unique(),
    defaultCurrency: text('default_currency').default('USD').notNull(),
    subscriptionTier: text('subscription_tier', { enum: ['free', 'pro', 'premium'] }).default('free').notNull(),
    paddleCustomerId: text('paddle_customer_id'),
    paddleSubscriptionId: text('paddle_subscription_id'),
    paddlePriceId: text('paddle_price_id'),
    paddleSubscriptionStatus: text('paddle_subscription_status'),
    paddleScheduledChangeAt: timestamp('paddle_scheduled_change_at'),
    paddleEventOccurredAt: timestamp('paddle_event_occurred_at'),
    testMode: boolean('test_mode').default(false).notNull(),
    preferences: jsonb('preferences'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
