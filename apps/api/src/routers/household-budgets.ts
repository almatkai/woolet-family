import { TRPCError } from '@trpc/server';
import { and, eq, isNull, sql } from 'drizzle-orm';
import { z } from 'zod';
import { protectedProcedure } from '../lib/trpc';
import { householdBudgets as budgets, categories } from '../db/schema';
import { canEditFamilyBudget } from '../lib/household/policy';
import { dashboardMembership, householdBaseCurrency } from '../lib/household/dashboard';
import { fromCents, toCents } from '../lib/household/limits';

const categoryInput = z.object({ categoryId: z.string().uuid().nullable() });
const amount = z.string().regex(/^\d{1,12}(\.\d{1,2})?$/).refine(v => Number(v) > 0).transform(v => fromCents(toCents(v)));
export const householdBudgetProcedures = {
    setBudget: protectedProcedure.input(categoryInput.extend({ amount })).mutation(async ({ ctx, input }) => {
        const m = await dashboardMembership(ctx.db, ctx.userId);
        if (!canEditFamilyBudget(m)) throw new TRPCError({ code: 'FORBIDDEN' });
        if (input.categoryId) {
            const category = await ctx.db.query.categories.findFirst({ where: eq(categories.id, input.categoryId) });
            if (!category || category.userId !== null) throw new TRPCError({ code: 'BAD_REQUEST', message: 'Invalid category' });
        }
        const currencyCode = await householdBaseCurrency(ctx.db, m.household.ownerUserId);
        const [budget] = await ctx.db.insert(budgets).values({ ...input, householdId: m.householdId, currencyCode, updatedByUserId: ctx.userId }).onConflictDoUpdate({
            target: input.categoryId ? [budgets.householdId, budgets.categoryId] : [budgets.householdId],
            targetWhere: input.categoryId ? sql`${budgets.categoryId} IS NOT NULL` : isNull(budgets.categoryId),
            set: { amount: input.amount, currencyCode, updatedByUserId: ctx.userId, updatedAt: new Date() },
        }).returning();
        return budget;
    }),
    deleteBudget: protectedProcedure.input(categoryInput).mutation(async ({ ctx, input }) => {
        const m = await dashboardMembership(ctx.db, ctx.userId);
        if (!canEditFamilyBudget(m)) throw new TRPCError({ code: 'FORBIDDEN' });
        await ctx.db.delete(budgets).where(and(eq(budgets.householdId, m.householdId), input.categoryId ? eq(budgets.categoryId, input.categoryId) : isNull(budgets.categoryId)));
        return { success: true };
    }),
};
