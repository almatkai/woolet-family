import { z } from 'zod';
import { eq, and, desc, asc, sql, inArray, ne, gte } from 'drizzle-orm';
import { TRPCError } from '@trpc/server';
import { router, protectedProcedure } from '../lib/trpc';
import { notifications } from '../db/schema';
import type { NotificationType, NotificationPriority } from '../db/schema/notifications';
import { deliverNotificationChannels } from '../services/notification-delivery-service';

const notificationTypeSchema = z.enum([
    'subscription_due',
    'subscription_overdue',
    'subscription_paid',
    'payment_reminder',
    'budget_alert',
    'spending_anomaly',
    'investment_update',
    'credit_limit',
    'debt_reminder',
    'general',
]);

const notificationPrioritySchema = z.enum(['low', 'medium', 'high', 'urgent']);
const NOTIFICATION_LIFETIME_MS = 7 * 24 * 60 * 60 * 1000;

function getActiveNotificationCutoff() {
    return new Date(Date.now() - NOTIFICATION_LIFETIME_MS);
}

const linksSchema = z.object({
    web: z.string().optional(),
    mobile: z.string().optional(),
    universal: z.string().optional(),
}).optional();

export function generateNotificationLinks(params: {
    entityType: string;
    entityId?: string;
    page?: string;
}): { web?: string; mobile?: string; universal?: string } {
    const { entityType, entityId, page } = params;
    
    const baseWebPath = page || getDefaultPageForEntity(entityType);
    const baseMobilePath = page || getDefaultMobileRouteForEntity(entityType);
    
    const webPath = entityId ? `${baseWebPath}/${entityId}` : baseWebPath;
    const mobilePath = entityId ? `${baseMobilePath}/${entityId}` : baseMobilePath;
    
    return {
        web: webPath,
        mobile: `woolet://${mobilePath}`,
        universal: `https://woolet.app${webPath}`,
    };
}

function getDefaultPageForEntity(entityType: string): string {
    const pageMap: Record<string, string> = {
        subscription: '/subscriptions',
        credit: '/financial/credits',
        mortgage: '/financial/mortgages',
        debt: '/debts',
        transaction: '/spending',
        investment: '/investing',
        account: '/accounts',
        general: '/',
    };
    return pageMap[entityType] || '/';
}

function getDefaultMobileRouteForEntity(entityType: string): string {
    const routeMap: Record<string, string> = {
        subscription: 'subscriptions',
        credit: 'financial/credits',
        mortgage: 'financial/mortgages',
        debt: 'financial/debts',
        transaction: 'spending',
        investment: 'investing',
        account: 'accounts',
        general: '',
    };
    return routeMap[entityType] || '';
}

export const notificationRouter = router({
    // List notifications with pagination and filters
    list: protectedProcedure
        .input(z.object({
            limit: z.number().int().min(1).max(100).default(50),
            cursor: z.string().uuid().optional(),
            unreadOnly: z.boolean().default(false),
            readStatus: z.enum(['unread', 'read']).optional(),
            type: notificationTypeSchema.optional(),
        }).optional())
        .query(async ({ ctx, input }) => {
            const limit = input?.limit || 50;
            const cursor = input?.cursor;
            const activeCutoff = getActiveNotificationCutoff();

            const conditions: any[] = [
                eq(notifications.userId, ctx.userId!),
                gte(notifications.createdAt, activeCutoff),
            ];

            if (input?.readStatus) {
                conditions.push(eq(notifications.isRead, input.readStatus === 'read'));
            } else if (input?.unreadOnly) {
                conditions.push(eq(notifications.isRead, false));
            }

            if (input?.type) {
                conditions.push(eq(notifications.type, input.type));
            }

            if (cursor) {
                const cursorNotification = await ctx.db.query.notifications.findFirst({
                    where: and(
                        eq(notifications.id, cursor),
                        eq(notifications.userId, ctx.userId!)
                    ),
                });
                if (cursorNotification) {
                    conditions.push(sql`(
                        ${notifications.createdAt}, ${notifications.id}
                    ) < (
                        ${cursorNotification.createdAt}, ${cursorNotification.id}
                    )`);
                }
            }

            const userNotifications = await ctx.db.query.notifications.findMany({
                where: and(...conditions),
                limit: limit + 1,
                orderBy: [desc(notifications.createdAt), desc(notifications.id)],
            });

            let nextCursor: string | undefined;
            if (userNotifications.length > limit) {
                userNotifications.pop();
                nextCursor = userNotifications[userNotifications.length - 1]?.id;
            }

            const unreadCount = await ctx.db
                .select({ count: sql<number>`count(*)` })
                .from(notifications)
                .where(and(
                    eq(notifications.userId, ctx.userId!),
                    eq(notifications.isRead, false),
                    gte(notifications.createdAt, activeCutoff)
                ))
                .then(res => res[0]?.count || 0);

            return {
                notifications: userNotifications,
                unreadCount,
                nextCursor,
            };
        }),

    // Get single notification by ID
    getById: protectedProcedure
        .input(z.object({ id: z.string().uuid() }))
        .query(async ({ ctx, input }) => {
            const notification = await ctx.db.query.notifications.findFirst({
                where: and(
                    eq(notifications.id, input.id),
                    eq(notifications.userId, ctx.userId!)
                ),
            });

            if (!notification) {
                throw new TRPCError({ code: 'NOT_FOUND', message: 'Notification not found' });
            }

            return notification;
        }),

    // Create a new notification
    create: protectedProcedure
        .input(z.object({
            type: notificationTypeSchema,
            title: z.string().min(1).max(200),
            message: z.string().min(1).max(1000),
            priority: notificationPrioritySchema.optional().default('medium'),
            links: linksSchema,
            entityType: z.string().optional(),
            entityId: z.string().optional(),
            metadata: z.record(z.any()).optional(),
            sendPush: z.boolean().optional().default(true),
        }))
        .mutation(async ({ ctx, input }) => {
            const links = input.links || generateNotificationLinks({
                entityType: input.entityType || 'general',
                entityId: input.entityId,
            });

            const [notification] = await ctx.db.insert(notifications).values({
                userId: ctx.userId!,
                type: input.type,
                title: input.title,
                message: input.message,
                priority: input.priority,
                links,
                entityType: input.entityType,
                entityId: input.entityId,
                metadata: input.metadata || {},
            }).returning();

            if (input.sendPush) {
                await deliverNotificationChannels({
                    userId: ctx.userId!,
                    title: input.title,
                    message: input.message,
                    url: links.web,
                    priority: input.priority,
                    entityType: input.entityType,
                    entityId: input.entityId,
                    metadata: input.metadata,
                });
            }

            return notification;
        }),

    // Mark notification as read
    markAsRead: protectedProcedure
        .input(z.object({ id: z.string().uuid() }))
        .mutation(async ({ ctx, input }) => {
            const existing = await ctx.db.query.notifications.findFirst({
                where: and(
                    eq(notifications.id, input.id),
                    eq(notifications.userId, ctx.userId!)
                ),
            });

            if (!existing) {
                throw new TRPCError({ code: 'NOT_FOUND', message: 'Notification not found' });
            }

            await ctx.db.update(notifications)
                .set({
                    isRead: true,
                    readAt: new Date(),
                    updatedAt: new Date(),
                })
                .where(eq(notifications.id, input.id));

            return { success: true };
        }),

    // Mark several notifications as read in one database update
    markAsReadBatch: protectedProcedure
        .input(z.object({
            ids: z.array(z.string().uuid()).min(1).max(100),
        }))
        .mutation(async ({ ctx, input }) => {
            const now = new Date();
            const updatedNotifications = await ctx.db.update(notifications)
                .set({
                    isRead: true,
                    readAt: now,
                    updatedAt: now,
                })
                .where(and(
                    eq(notifications.userId, ctx.userId!),
                    inArray(notifications.id, input.ids),
                    eq(notifications.isRead, false)
                ))
                .returning({ id: notifications.id });

            return {
                success: true,
                updatedCount: updatedNotifications.length,
            };
        }),

    // Mark all notifications as read
    markAllAsRead: protectedProcedure
        .mutation(async ({ ctx }) => {
            const activeCutoff = getActiveNotificationCutoff();
            await ctx.db.update(notifications)
                .set({
                    isRead: true,
                    readAt: new Date(),
                    updatedAt: new Date(),
                })
                .where(and(
                    eq(notifications.userId, ctx.userId!),
                    eq(notifications.isRead, false),
                    gte(notifications.createdAt, activeCutoff)
                ));

            return { success: true };
        }),

    // Mark notification action as taken
    markActionTaken: protectedProcedure
        .input(z.object({ id: z.string().uuid() }))
        .mutation(async ({ ctx, input }) => {
            const existing = await ctx.db.query.notifications.findFirst({
                where: and(
                    eq(notifications.id, input.id),
                    eq(notifications.userId, ctx.userId!)
                ),
            });

            if (!existing) {
                throw new TRPCError({ code: 'NOT_FOUND', message: 'Notification not found' });
            }

            await ctx.db.update(notifications)
                .set({
                    actionTaken: true,
                    actionTakenAt: new Date(),
                    isRead: true,
                    readAt: new Date(),
                    updatedAt: new Date(),
                })
                .where(eq(notifications.id, input.id));

            return { success: true };
        }),

    // Delete a notification
    delete: protectedProcedure
        .input(z.object({ id: z.string().uuid() }))
        .mutation(async ({ ctx, input }) => {
            const existing = await ctx.db.query.notifications.findFirst({
                where: and(
                    eq(notifications.id, input.id),
                    eq(notifications.userId, ctx.userId!)
                ),
            });

            if (!existing) {
                throw new TRPCError({ code: 'NOT_FOUND', message: 'Notification not found' });
            }

            await ctx.db.delete(notifications).where(eq(notifications.id, input.id));

            return { success: true };
        }),

    // Delete old read notifications
    cleanup: protectedProcedure
        .input(z.object({
            daysOld: z.number().int().min(1).default(30),
            keepUnread: z.boolean().default(true),
        }).optional())
        .mutation(async ({ ctx, input }) => {
            const options = input || { daysOld: 30, keepUnread: true };
            const cutoffDate = new Date();
            cutoffDate.setDate(cutoffDate.getDate() - options.daysOld);

            const conditions: any[] = [
                eq(notifications.userId, ctx.userId!),
                sql`${notifications.createdAt} < ${cutoffDate}`,
            ];

            if (options.keepUnread) {
                conditions.push(eq(notifications.isRead, true));
            }

            const result = await ctx.db
                .delete(notifications)
                .where(and(...conditions))
                .returning({ id: notifications.id });

            return { deleted: result.length };
        }),

    // Get unread count
    getUnreadCount: protectedProcedure
        .query(async ({ ctx }) => {
            const activeCutoff = getActiveNotificationCutoff();
            const result = await ctx.db
                .select({ count: sql<number>`count(*)` })
                .from(notifications)
                .where(and(
                    eq(notifications.userId, ctx.userId!),
                    eq(notifications.isRead, false),
                    gte(notifications.createdAt, activeCutoff)
                ));

            return { count: result[0]?.count || 0 };
        }),

    // Create subscription-related notification with automatic links
    createSubscriptionNotification: protectedProcedure
        .input(z.object({
            type: z.enum(['subscription_due', 'subscription_overdue', 'subscription_paid']),
            subscriptionId: z.string().uuid(),
            subscriptionName: z.string(),
            amount: z.number(),
            currency: z.string(),
            dueDate: z.string().optional(),
            daysUntilDue: z.number().optional(),
            sendPush: z.boolean().optional().default(true),
        }))
        .mutation(async ({ ctx, input }) => {
            const { type, subscriptionId, subscriptionName, amount, currency, dueDate, daysUntilDue, sendPush } = input;
            
            let title: string;
            let message: string;
            let priority: NotificationPriority = 'medium';
            
            switch (type) {
                case 'subscription_due':
                    if (daysUntilDue !== undefined && daysUntilDue <= 1) {
                        title = 'Subscription Due Tomorrow';
                        priority = 'high';
                    } else if (daysUntilDue !== undefined && daysUntilDue <= 3) {
                        title = 'Subscription Due Soon';
                        priority = 'medium';
                    } else {
                        title = 'Subscription Payment Due';
                        priority = 'low';
                    }
                    message = `${subscriptionName} payment of ${currency} ${amount.toLocaleString()} is due${dueDate ? ` on ${dueDate}` : ''}.`;
                    break;
                case 'subscription_overdue':
                    title = 'Subscription Overdue';
                    priority = 'urgent';
                    message = `${subscriptionName} payment of ${currency} ${amount.toLocaleString()} is overdue. Please make a payment soon.`;
                    break;
                case 'subscription_paid':
                    title = 'Subscription Paid';
                    priority = 'low';
                    message = `Payment of ${currency} ${amount.toLocaleString()} for ${subscriptionName} has been processed.`;
                    break;
                default:
                    title = 'Subscription Update';
                    message = `Update for ${subscriptionName}`;
            }
            
            const links = generateNotificationLinks({
                entityType: 'subscription',
                entityId: subscriptionId,
                page: '/subscriptions',
            });
            
            const [notification] = await ctx.db.insert(notifications).values({
                userId: ctx.userId!,
                type,
                title,
                message,
                priority,
                links,
                entityType: 'subscription',
                entityId: subscriptionId,
                metadata: { amount, currency, dueDate, daysUntilDue },
            }).returning();
            
            if (sendPush) {
                await deliverNotificationChannels({
                    userId: ctx.userId!,
                    title,
                    message,
                    url: links.web,
                    priority,
                    entityType: 'subscription',
                    entityId: subscriptionId,
                    metadata: { amount, currency, dueDate, daysUntilDue },
                });
            }
            
            return notification;
        }),
});
