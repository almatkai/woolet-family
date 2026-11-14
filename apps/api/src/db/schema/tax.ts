import {
    pgTable,
    pgEnum,
    uuid,
    text,
    integer,
    boolean,
    decimal,
    timestamp,
    date,
    unique,
    check,
    index,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { users } from './users';
import { transactions } from './transactions';
import { filingStatuses } from '../../lib/tax/tables';
export const taxFilingStatus = pgEnum('tax_filing_status', filingStatuses);
export const taxJurisdiction = pgEnum('tax_jurisdiction', ['federal', 'state']);
const money = (name: string) => decimal(name, { precision: 14, scale: 2 }).default('0').notNull();
export const taxProfiles = pgTable(
    'tax_profiles',
    {
        id: uuid('id').defaultRandom().primaryKey(),
        userId: text('user_id')
            .notNull()
            .references(() => users.id, { onDelete: 'cascade' }),
        taxYear: integer('tax_year').notNull(),
        filingStatus: taxFilingStatus('filing_status').notNull(),
        state: text('state').notNull(),
        stateEffectiveRate: decimal('state_effective_rate', { precision: 5, scale: 2 }),
        taxpayerAge65: boolean('taxpayer_age_65').default(false).notNull(),
        taxpayerBlind: boolean('taxpayer_blind').default(false).notNull(),
        spouseAge65: boolean('spouse_age_65').default(false).notNull(),
        spouseBlind: boolean('spouse_blind').default(false).notNull(),
        qualifyingChildren: integer('qualifying_children').default(0).notNull(),
        otherDependents: integer('other_dependents').default(0).notNull(),
        wageIncome: money('wage_income'),
        selfEmploymentIncome: money('self_employment_income'),
        interestIncome: money('interest_income'),
        ordinaryDividends: money('ordinary_dividends'),
        qualifiedDividends: money('qualified_dividends'),
        longTermCapitalGains: money('long_term_capital_gains'),
        shortTermCapitalGains: money('short_term_capital_gains'),
        otherIncome: money('other_income'),
        preTaxContributions: money('pre_tax_contributions'),
        iraDeduction: money('ira_deduction'),
        hsaDeduction: money('hsa_deduction'),
        studentLoanInterest: money('student_loan_interest'),
        tipsDeduction: money('tips_deduction'),
        overtimeDeduction: money('overtime_deduction'),
        federalWithholdingYtd: money('federal_withholding_ytd'),
        stateWithholdingYtd: money('state_withholding_ytd'),
        priorYearTax: decimal('prior_year_tax', { precision: 14, scale: 2 }),
        priorYearAgi: decimal('prior_year_agi', { precision: 14, scale: 2 }),
        useTransactionsForIncome: boolean('use_transactions_for_income').default(false).notNull(),
        createdAt: timestamp('created_at').defaultNow().notNull(),
        updatedAt: timestamp('updated_at').defaultNow().notNull(),
    },
    (t) => ({ userYear: unique('tax_profiles_user_year_unique').on(t.userId, t.taxYear) }),
);
export const taxEstimatedPayments = pgTable(
    'tax_estimated_payments',
    {
        id: uuid('id').defaultRandom().primaryKey(),
        userId: text('user_id')
            .notNull()
            .references(() => users.id, { onDelete: 'cascade' }),
        taxYear: integer('tax_year').notNull(),
        jurisdiction: taxJurisdiction('jurisdiction').notNull(),
        quarter: integer('quarter').notNull(),
        amount: decimal('amount', { precision: 14, scale: 2 }).notNull(),
        paidOn: date('paid_on').notNull(),
        transactionId: uuid('transaction_id').references(() => transactions.id, { onDelete: 'set null' }),
        note: text('note'),
        createdAt: timestamp('created_at').defaultNow().notNull(),
        updatedAt: timestamp('updated_at').defaultNow().notNull(),
    },
    (t) => ({
        userYear: index('tax_payments_user_year_idx').on(t.userId, t.taxYear),
        quarterRange: check('tax_payments_quarter_range', sql`${t.quarter} between 1 and 4`),
        positiveAmount: check('tax_payments_positive_amount', sql`${t.amount} > 0`),
    }),
);
