import { z } from 'zod';
import { format } from 'date-fns';
import { and, eq } from 'drizzle-orm';
import { TRPCError } from '@trpc/server';
import { router, protectedProcedure } from '../lib/trpc';
import {
    taxProfiles,
    taxEstimatedPayments,
    transactions,
    currencyBalances,
    accounts,
    banks,
} from '../db/schema';
import { taxProfileSchema, taxYearSchema, paymentSchema } from '../lib/tax/input';
import { fromRow, transactionIncome, readTaxEstimate } from '../lib/tax/reads';
import { states, getState } from '../lib/tax/states';
const yearInput = z.object({ taxYear: taxYearSchema });
const datedYearInput = yearInput.extend({
    today: paymentSchema.shape.paidOn.optional(),
});
// Treat the supplied calendar day as UTC only inside the date-based calculator.
const calculationDate = (today?: string) =>
    new Date(`${today ?? format(new Date(), 'yyyy-MM-dd')}T00:00:00Z`);
export const taxRouter = router({
    getStates: protectedProcedure
        .input(z.object({ taxYear: taxYearSchema }).optional())
        .query(({ input }) => states.map((s) => getState(s.code, input?.taxYear ?? 2026))),
    getProfile: protectedProcedure.input(yearInput).query(async ({ ctx, input }) => {
        const row = await ctx.db.query.taxProfiles.findFirst({
            where: and(eq(taxProfiles.userId, ctx.userId), eq(taxProfiles.taxYear, input.taxYear)),
        });
        return row ? fromRow(row) : null;
    }),
    upsertProfile: protectedProcedure.input(taxProfileSchema).mutation(async ({ ctx, input }) => {
        const values = {
            ...input,
            userId: ctx.userId,
            wageIncome: String(input.wageIncome),
            selfEmploymentIncome: String(input.selfEmploymentIncome),
            interestIncome: String(input.interestIncome),
            ordinaryDividends: String(input.ordinaryDividends),
            qualifiedDividends: String(input.qualifiedDividends),
            longTermCapitalGains: String(input.longTermCapitalGains),
            shortTermCapitalGains: String(input.shortTermCapitalGains),
            otherIncome: String(input.otherIncome),
            preTaxContributions: String(input.preTaxContributions),
            iraDeduction: String(input.iraDeduction),
            hsaDeduction: String(input.hsaDeduction),
            studentLoanInterest: String(input.studentLoanInterest),
            tipsDeduction: String(input.tipsDeduction),
            overtimeDeduction: String(input.overtimeDeduction),
            federalWithholdingYtd: String(input.federalWithholdingYtd),
            stateWithholdingYtd: String(input.stateWithholdingYtd),
            priorYearTax: input.priorYearTax === null ? null : String(input.priorYearTax),
            priorYearAgi: input.priorYearAgi === null ? null : String(input.priorYearAgi),
            stateEffectiveRate: input.stateEffectiveRate === null ? null : String(input.stateEffectiveRate),
        };
        const [row] = await ctx.db
            .insert(taxProfiles)
            .values(values)
            .onConflictDoUpdate({
                target: [taxProfiles.userId, taxProfiles.taxYear],
                set: { ...values, updatedAt: new Date() },
            })
            .returning();
        return fromRow(row);
    }),
    getTransactionIncome: protectedProcedure
        .input(datedYearInput)
        .query(({ ctx, input }) => transactionIncome(ctx, input.taxYear, calculationDate(input.today))),
    estimate: protectedProcedure.input(datedYearInput).query(async ({ ctx, input }) => {
        return readTaxEstimate(ctx, input.taxYear, calculationDate(input.today));
    }),
    listEstimatedPayments: protectedProcedure
        .input(yearInput)
        .query(({ ctx, input }) =>
            ctx.db.query.taxEstimatedPayments.findMany({
                where: and(
                    eq(taxEstimatedPayments.userId, ctx.userId),
                    eq(taxEstimatedPayments.taxYear, input.taxYear),
                ),
                orderBy: (p, { desc }) => [desc(p.paidOn), desc(p.createdAt)],
            }),
        ),
    addEstimatedPayment: protectedProcedure.input(paymentSchema).mutation(async ({ ctx, input }) => {
        // The client sends its local date; the latest calendar day on Earth is UTC+14.
        const latestLocalToday = new Date(Date.now() + 14 * 3600 * 1000).toISOString().slice(0, 10);
        if (input.paidOn > latestLocalToday)
            throw new TRPCError({ code: 'BAD_REQUEST', message: 'Paid on cannot be in the future' });
        if (input.transactionId) {
            const [owned] = await ctx.db
                .select({ id: transactions.id })
                .from(transactions)
                .innerJoin(currencyBalances, eq(transactions.currencyBalanceId, currencyBalances.id))
                .innerJoin(accounts, eq(currencyBalances.accountId, accounts.id))
                .innerJoin(banks, eq(accounts.bankId, banks.id))
                .where(
                    and(
                        eq(transactions.id, input.transactionId),
                        eq(transactions.type, 'expense'),
                        eq(transactions.lifecycleStatus, 'active'),
                        eq(banks.userId, ctx.userId),
                        eq(banks.isTest, ctx.user.testMode),
                    ),
                )
                .limit(1);
            if (!owned)
                throw new TRPCError({
                    code: 'BAD_REQUEST',
                    message: 'Select an expense transaction from your current accounts',
                });
        }
        const [row] = await ctx.db
            .insert(taxEstimatedPayments)
            .values({ ...input, amount: String(input.amount), userId: ctx.userId })
            .returning();
        return row;
    }),
    deleteEstimatedPayment: protectedProcedure
        .input(z.object({ id: z.string().uuid() }))
        .mutation(async ({ ctx, input }) => {
            const [row] = await ctx.db
                .delete(taxEstimatedPayments)
                .where(
                    and(eq(taxEstimatedPayments.id, input.id), eq(taxEstimatedPayments.userId, ctx.userId)),
                )
                .returning();
            if (!row) throw new TRPCError({ code: 'NOT_FOUND', message: 'Payment not found' });
            return { success: true };
        }),
});
