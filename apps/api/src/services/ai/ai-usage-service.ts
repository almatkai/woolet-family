import { db } from '../../db';
import { aiUsage, users } from '../../db/schema';
import { and, eq, lt, sql } from 'drizzle-orm';
import { TRPCError } from '@trpc/server';
import { DEMO_AI_QUESTION_LIMIT, getDemoRole } from '../../lib/demo';

export class AiUsageService {
    private static getTodayDate(): string {
        return new Date().toISOString().split('T')[0];
    }

    static async getUsage(userId: string) {
        if (getDemoRole(userId)) {
            return db.transaction(async tx => {
                const [user] = await tx.select({ id: users.id }).from(users).where(eq(users.id, userId)).for('update');
                if (!user) throw new TRPCError({ code: 'NOT_FOUND', message: 'Demo account is not available.' });
                let usage = await tx.query.aiUsage.findFirst({ where: eq(aiUsage.userId, userId) });
                const today = this.getTodayDate();
                if (!usage) [usage] = await tx.insert(aiUsage).values({ userId, lastResetDate: today }).returning();
                else if (usage.lastResetDate !== today) {
                    [usage] = await tx.update(aiUsage).set({ questionCountToday: 0, lastResetDate: today, updatedAt: new Date() })
                        .where(eq(aiUsage.id, usage.id)).returning();
                }
                return usage;
            });
        }
        const today = this.getTodayDate();
        let usage = await db.query.aiUsage.findFirst({
            where: eq(aiUsage.userId, userId),
        });

        if (!usage) {
            // Create new record
            [usage] = await db.insert(aiUsage).values({
                userId,
                questionCountToday: 0,
                questionCountLifetime: 0,
                lastResetDate: today,
            }).returning();
        } else if (usage.lastResetDate !== today) {
            // Reset daily count if it's a new day
            [usage] = await db.update(aiUsage)
                .set({
                    questionCountToday: 0,
                    lastResetDate: today,
                    updatedAt: new Date(),
                })
                .where(eq(aiUsage.id, usage.id))
                .returning();
        }

        return usage;
    }

    static async incrementUsage(userId: string) {
        // Public demo messages are reserved atomically before generation instead.
        if (getDemoRole(userId)) return;
        const today = this.getTodayDate();
        const usage = await this.getUsage(userId);

        await db.update(aiUsage)
            .set({
                questionCountToday: usage.questionCountToday + 1,
                questionCountLifetime: usage.questionCountLifetime + 1,
                updatedAt: new Date(),
            })
            .where(eq(aiUsage.id, usage.id));
    }

    static async reserveDemoQuestion(userId: string): Promise<string> {
        if (!getDemoRole(userId)) throw new Error('Not a configured demo actor');
        return db.transaction(async tx => {
            // ai_usage has no unique user constraint. Lock the stable user row so
            // two first requests cannot create independent lifetime counters.
            const [user] = await tx.select({ id: users.id }).from(users).where(eq(users.id, userId)).for('update');
            if (!user) throw new TRPCError({ code: 'NOT_FOUND', message: 'Demo account is not available.' });
            let usage = await tx.query.aiUsage.findFirst({ where: eq(aiUsage.userId, userId) });
            if (!usage) {
                [usage] = await tx.insert(aiUsage).values({ userId, lastResetDate: this.getTodayDate() }).returning();
            }
            const [reserved] = await tx.update(aiUsage).set({
                questionCountLifetime: sql`${aiUsage.questionCountLifetime} + 1`,
                questionCountToday: sql`case when ${aiUsage.lastResetDate} = ${this.getTodayDate()} then ${aiUsage.questionCountToday} + 1 else 1 end`,
                lastResetDate: this.getTodayDate(),
                updatedAt: new Date(),
            }).where(and(eq(aiUsage.id, usage.id), lt(aiUsage.questionCountLifetime, DEMO_AI_QUESTION_LIMIT))).returning({ id: aiUsage.id });
            if (!reserved) throw new TRPCError({ code: 'FORBIDDEN', message: 'The demo has used all 50 AI questions. You can still explore the sample family.' });
            return reserved.id;
        });
    }

    static async releaseDemoQuestion(reservationId: string, userId: string) {
        if (!getDemoRole(userId)) return;
        await db.update(aiUsage).set({
            questionCountLifetime: sql`greatest(${aiUsage.questionCountLifetime} - 1, 0)`,
            questionCountToday: sql`case when ${aiUsage.lastResetDate} = ${this.getTodayDate()} then greatest(${aiUsage.questionCountToday} - 1, 0) else ${aiUsage.questionCountToday} end`,
            updatedAt: new Date(),
        }).where(and(eq(aiUsage.id, reservationId), eq(aiUsage.userId, userId)));
    }
}
