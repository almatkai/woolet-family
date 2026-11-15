import { TRPCError } from '@trpc/server';
import { format } from 'date-fns';
import { z } from 'zod';
import { protectedProcedure } from '../lib/trpc';
import { dashboardMembership, memberName, orderFamilyMembers, readFamilyMembers } from '../lib/household/dashboard';
import { canViewMemberFinances } from '../lib/household/policy';
import { taxYearSchema } from '../lib/tax/input';
import { currencyExchangeService } from '../services/currency-exchange-service';
import { readTaxEstimate } from '../lib/tax/reads';

export type FamilyTaxRow = {
    memberId: string; name: string; isMe: boolean; hasProfile: boolean;
    estimatedTax: string | null; paid: string | null; nextDue: { date: string; amount: string } | null; currency: string;
};
export const householdFamilyTaxProcedures = {
    familyTax: protectedProcedure.input(z.object({ taxYear: taxYearSchema })).query(async ({ ctx, input }): Promise<FamilyTaxRow[]> => {
        const viewer = await dashboardMembership(ctx.db, ctx.userId);
        if (viewer.role === 'child') throw new TRPCError({ code: 'FORBIDDEN' });
        const all = await readFamilyMembers(ctx.db, viewer.householdId);
        const visible = orderFamilyMembers(all.filter(r => canViewMemberFinances(viewer, r.member)), ctx.userId);
        const today = new Date(`${format(new Date(), 'yyyy-MM-dd')}T00:00:00Z`);
        const rows: FamilyTaxRow[] = [];
        let storedRates: Record<string, number> | undefined;
        const incomeRate = async (currency: string) => {
            if (currency === 'USD') return 1;
            storedRates ??= await currencyExchangeService.getExchangeRates('USD', { storedOnly: true });
            const rate = storedRates[currency];
            // The tax row contract has no partial-conversion field. Preserve the
            // personal estimate's failure on unavailable rates rather than understate tax.
            if (!Number.isFinite(rate) || rate <= 0) throw new TRPCError({ code: 'PRECONDITION_FAILED', message: `No stored exchange rate for ${currency}` });
            return 1 / rate;
        };
        for (const row of visible) {
            const estimate = await readTaxEstimate({ db: ctx.db, userId: row.member.userId, user: { testMode: false } }, input.taxYear, today, incomeRate);
            rows.push({ memberId: row.member.id, name: memberName(row), isMe: row.member.userId === ctx.userId, hasProfile: estimate !== null,
                estimatedTax: estimate ? estimate.total.toFixed(2) : null, paid: estimate ? estimate.paidSoFar.toFixed(2) : null,
                nextDue: estimate?.nextPayment ? { date: estimate.nextPayment.dueDate, amount: estimate.nextPayment.suggestedAmount.toFixed(2) } : null,
                // The existing tax profiles and calculator are US tax / USD only.
                currency: 'USD' });
        }
        return rows;
    }),
};
