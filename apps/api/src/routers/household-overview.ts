import { z } from 'zod';
import { protectedProcedure } from '../lib/trpc';
import { getHouseholdOverview } from '../lib/household/overview';
import { categoryInput, currencyInput, dayInput, monthInput } from '../lib/household/query-input';

export const householdOverviewProcedures = {
    overview: protectedProcedure.input(z.object({ month: monthInput, currency: currencyInput.optional(), memberId: z.string().uuid().optional(), categoryId: categoryInput.optional(), today: dayInput.optional() }))
        .query(({ ctx, input }) => getHouseholdOverview(ctx.db, ctx.userId, input)),
};
