import { z } from 'zod';
import { format } from 'date-fns';
import { and, eq, gte, lte, inArray, isNull } from 'drizzle-orm';
import { TRPCError } from '@trpc/server';
import { router, protectedProcedure } from '../lib/trpc';
import {
    taxProfiles,
    taxEstimatedPayments,
    transactions,
    currencyBalances,
    accounts,
    banks,
    categories,
} from '../db/schema';
import { taxProfileSchema, taxYearSchema, paymentSchema, type TaxProfile } from '../lib/tax/input';
import { annualizationFactor, estimateTax } from '../lib/tax/estimate';
import { states, getState } from '../lib/tax/states';
import { CurrencyService } from '../services/currency';
import type { Context } from '../lib/trpc';
const yearInput = z.object({ taxYear: taxYearSchema });
const datedYearInput = yearInput.extend({
    today: paymentSchema.shape.paidOn.optional(),
});
// Treat the supplied calendar day as UTC only inside the date-based calculator.
const calculationDate = (today?: string) =>
    new Date(`${today ?? format(new Date(), 'yyyy-MM-dd')}T00:00:00Z`);
const moneyFields = [
    'wageIncome',
    'selfEmploymentIncome',
    'interestIncome',
    'ordinaryDividends',
    'qualifiedDividends',
    'longTermCapitalGains',
    'shortTermCapitalGains',
    'otherIncome',
    'preTaxContributions',
    'iraDeduction',
    'hsaDeduction',
    'studentLoanInterest',
    'tipsDeduction',
    'overtimeDeduction',
    'federalWithholdingYtd',
    'stateWithholdingYtd',
    'priorYearTax',
    'priorYearAgi',
    'stateEffectiveRate',
] as const;
function fromRow(row: typeof taxProfiles.$inferSelect): TaxProfile {
    return taxProfileSchema.parse({
        ...row,
        ...Object.fromEntries(moneyFields.map((k) => [k, row[k] === null ? null : Number(row[k])])),
    });
}
async function transactionIncome(
    ctx: Pick<Context, 'db' | 'userId'> & { user: { testMode: boolean } },
    taxYear: 2025 | 2026,
    today: Date,
) {
    const rows = await ctx.db
        .select({
            amount: transactions.amount,
            currency: currencyBalances.currencyCode,
            category: categories.name,
        })
        .from(transactions)
        .innerJoin(currencyBalances, eq(transactions.currencyBalanceId, currencyBalances.id))
        .innerJoin(accounts, eq(currencyBalances.accountId, accounts.id))
        .innerJoin(banks, eq(accounts.bankId, banks.id))
        .innerJoin(categories, eq(transactions.categoryId, categories.id))
        .where(
            and(
                eq(banks.userId, ctx.userId!),
                eq(banks.isTest, ctx.user.testMode),
                eq(transactions.type, 'income'),
                eq(transactions.lifecycleStatus, 'active'),
                isNull(transactions.parentTransactionId),
                inArray(categories.name, ['Salary', 'Bonuses', 'Freelance Work']),
                gte(transactions.date, `${taxYear}-01-01`),
                lte(transactions.date, `${taxYear}-12-31`),
                lte(transactions.date, today.toISOString().slice(0, 10)),
            ),
        );
    let wageYtd = 0,
        selfEmploymentYtd = 0;
    // Resolve each currency once, using the app's cached conversion helper.
    const rates = new Map<string, number>();
    for (const row of rows) {
        if (!rates.has(row.currency))
            rates.set(row.currency, await CurrencyService.getRate(row.currency, 'USD'));
        const amount = Number(row.amount) * rates.get(row.currency)!;
        if (row.category === 'Freelance Work') selfEmploymentYtd += amount;
        else wageYtd += amount;
    }
    const factor = annualizationFactor(taxYear, today);
    return {
        wageYtd,
        selfEmploymentYtd,
        wageProjected: wageYtd * factor,
        selfEmploymentProjected: selfEmploymentYtd * factor,
    };
}
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
        const row = await ctx.db.query.taxProfiles.findFirst({
            where: and(eq(taxProfiles.userId, ctx.userId), eq(taxProfiles.taxYear, input.taxYear)),
        });
        if (!row) return null;
        const profile = fromRow(row),
            today = calculationDate(input.today);
        const derivedIncome = profile.useTransactionsForIncome
            ? await transactionIncome(ctx, input.taxYear, today)
            : null;
        if (derivedIncome) {
            profile.wageIncome = derivedIncome.wageProjected;
            profile.selfEmploymentIncome = derivedIncome.selfEmploymentProjected;
        }
        const payments = await ctx.db.query.taxEstimatedPayments.findMany({
            where: and(
                eq(taxEstimatedPayments.userId, ctx.userId),
                eq(taxEstimatedPayments.taxYear, input.taxYear),
            ),
        });
        return {
            ...estimateTax(
                profile,
                payments.map((p) => ({ ...p, amount: Number(p.amount) })),
                today,
            ),
            derivedIncome,
        };
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
