import { and, eq, gte, lte, inArray, isNull } from 'drizzle-orm';
import { taxProfiles, taxEstimatedPayments, transactions, currencyBalances, accounts, banks, categories } from '../../db/schema';
import { taxProfileSchema, type TaxProfile } from './input';
import { annualizationFactor, estimateTax } from './estimate';
import { CurrencyService } from '../../services/currency';
import type { Context } from '../trpc';

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
export function fromRow(row: typeof taxProfiles.$inferSelect): TaxProfile {
    return taxProfileSchema.parse({
        ...row,
        ...Object.fromEntries(moneyFields.map((k) => [k, row[k] === null ? null : Number(row[k])])),
    });
}
export async function transactionIncome(
    ctx: Pick<Context, 'db'> & { userId: string; user: { testMode: boolean } },
    taxYear: 2025 | 2026,
    today: Date,
    rateFor: (currency: string) => Promise<number> = currency => CurrencyService.getRate(currency, 'USD'),
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
            rates.set(row.currency, await rateFor(row.currency));
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

/** Shared uncached estimate read. Authorization and sandbox choice belong to the caller. */
export async function readTaxEstimate(
    ctx: Pick<Context, 'db'> & { userId: string; user: { testMode: boolean } },
    taxYear: 2025 | 2026,
    today: Date,
    rateFor: (currency: string) => Promise<number> = currency => CurrencyService.getRate(currency, 'USD'),
) {
    const row = await ctx.db.query.taxProfiles.findFirst({
        where: and(eq(taxProfiles.userId, ctx.userId), eq(taxProfiles.taxYear, taxYear)),
    });
    if (!row) return null;
    const profile = fromRow(row);
    const derivedIncome = profile.useTransactionsForIncome
        ? await transactionIncome(ctx, taxYear, today, rateFor)
        : null;
    if (derivedIncome) {
        profile.wageIncome = derivedIncome.wageProjected;
        profile.selfEmploymentIncome = derivedIncome.selfEmploymentProjected;
    }
    const payments = await ctx.db.query.taxEstimatedPayments.findMany({
        where: and(
            eq(taxEstimatedPayments.userId, ctx.userId),
            eq(taxEstimatedPayments.taxYear, taxYear),
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
}
