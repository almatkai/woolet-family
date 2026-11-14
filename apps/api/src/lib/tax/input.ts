import { z } from 'zod';
import { filingStatuses } from './tables';
import { states } from './states';
export const taxYearSchema = z.union([z.literal(2026), z.literal(2025)]);
const money = z.number().finite().min(0).max(999999999);
const gain = z.number().finite().min(-999999999).max(999999999);
export const taxProfileSchema = z
    .object({
        taxYear: taxYearSchema,
        filingStatus: z.enum(filingStatuses),
        state: z.string().refine((v) => states.some((s) => s.code === v), 'Select a state'),
        stateEffectiveRate: z
            .number()
            .finite()
            .min(0, 'Enter a rate between 0 and 15%')
            .max(15, 'Enter a rate between 0 and 15%')
            .nullable()
            .default(null),
        taxpayerAge65: z.boolean().default(false),
        taxpayerBlind: z.boolean().default(false),
        spouseAge65: z.boolean().default(false),
        spouseBlind: z.boolean().default(false),
        qualifyingChildren: z.number().int().min(0).max(30).default(0),
        otherDependents: z.number().int().min(0).max(30).default(0),
        wageIncome: money.default(0),
        selfEmploymentIncome: gain.default(0),
        interestIncome: money.default(0),
        ordinaryDividends: money.default(0),
        qualifiedDividends: money.default(0),
        longTermCapitalGains: gain.default(0),
        shortTermCapitalGains: gain.default(0),
        otherIncome: gain.default(0),
        preTaxContributions: money.default(0),
        iraDeduction: money.default(0),
        hsaDeduction: money.default(0),
        studentLoanInterest: money.default(0),
        tipsDeduction: money.default(0),
        overtimeDeduction: money.default(0),
        federalWithholdingYtd: money.default(0),
        stateWithholdingYtd: money.default(0),
        priorYearTax: money.nullable().default(null),
        priorYearAgi: gain.nullable().default(null),
        useTransactionsForIncome: z.boolean().default(false),
    })
    .refine((p) => p.qualifiedDividends <= p.ordinaryDividends, {
        path: ['qualifiedDividends'],
        message: 'Qualified dividends must be included in ordinary dividends',
    });
export type TaxProfile = z.infer<typeof taxProfileSchema>;
export const paymentSchema = z.object({
    taxYear: taxYearSchema,
    jurisdiction: z.enum(['federal', 'state']),
    quarter: z.number().int().min(1).max(4),
    amount: money.positive(),
    paidOn: z
        .string()
        .regex(/^\d{4}-\d{2}-\d{2}$/)
        .refine((v) => {
            const d = new Date(v + 'T00:00:00Z');
            return Number.isFinite(d.getTime()) && d.toISOString().slice(0, 10) === v;
        }, 'Enter a valid date'),
    transactionId: z.string().uuid().nullable().default(null),
    note: z.string().max(1000).default(''),
});
