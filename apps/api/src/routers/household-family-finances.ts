import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import { protectedProcedure } from '../lib/trpc';
import { baseConverter, dashboardMembership, householdBaseCurrency, memberName, moneyAmount, orderFamilyMembers, readFamilyMembers } from '../lib/household/dashboard';
import { readFamilyInvestments } from '../lib/household/investment-reads';
import { readBankHierarchy, readMemberProducts } from '../lib/household/finance-reads';
import { canViewMemberFinances } from '../lib/household/policy';
import { currencyInput } from '../lib/household/query-input';
import { fromCents, toCents } from '../lib/household/limits';
import { nextSubscriptionDate } from '../lib/household/subscription-date';
import type { CurrencyAmount, FamilyFinances, InternalDebt, MemberHoldings } from '../lib/household/family-types';
import { currencyExchangeService } from '../services/currency-exchange-service';

function amounts() {
    const values = new Map<string, number>();
    return {
        add: (amount: string, currency: string) => values.set(currency, (values.get(currency) ?? 0) + toCents(amount)),
        rows: (): CurrencyAmount[] => [...values].sort(([a], [b]) => a.localeCompare(b)).map(([currencyCode, cents]) => ({ currencyCode, amount: fromCents(cents) })),
    };
}
// Annualized monthly equivalents, rounded per subscription before aggregation.
function monthlyAmount(amount: string, frequency: MemberHoldings['subscriptions'][number]['frequency']) {
    const factor = { daily: 365 / 12, weekly: 52 / 12, monthly: 1, yearly: 1 / 12 }[frequency];
    return fromCents(Math.round(toCents(amount) * factor));
}
/** linkedUserId is authoritative. Names are deliberately never used for identity. */
function internalDebtsOf(members: MemberHoldings[]): InternalDebt[] {
    const groups = new Map<string, { borrower: InternalDebt[]; lender: InternalDebt[] }>();
    for (const member of members) for (const debt of member.debts) {
        if (!debt.counterpartyMemberId) continue;
        const fromMemberId = debt.type === 'i_owe' ? member.memberId : debt.counterpartyMemberId;
        const toMemberId = debt.type === 'i_owe' ? debt.counterpartyMemberId : member.memberId;
        const key = JSON.stringify([fromMemberId, toMemberId, debt.currencyCode, debt.remaining, debt.dueDate]);
        const group = groups.get(key) ?? { borrower: [], lender: [] };
        group[debt.type === 'i_owe' ? 'borrower' : 'lender'].push({ id: debt.id, fromMemberId, toMemberId, remaining: debt.remaining, currencyCode: debt.currencyCode });
        groups.set(key, group);
    }
    // Pair reciprocal copies one-for-one. Two distinct same-amount debts on one
    // side must not collapse into one; prefer the borrower's id for each pair.
    return [...groups.values()].flatMap(({ borrower, lender }) => {
        borrower.sort((a, b) => a.id.localeCompare(b.id)); lender.sort((a, b) => a.id.localeCompare(b.id));
        return Array.from({ length: Math.max(borrower.length, lender.length) }, (_, i) => borrower[i] ?? lender[i]!);
    }).sort((a, b) => a.fromMemberId.localeCompare(b.fromMemberId) || a.toMemberId.localeCompare(b.toMemberId) || a.id.localeCompare(b.id));
}
export const householdFamilyFinanceProcedures = {
    familyFinances: protectedProcedure.input(z.object({ currency: currencyInput.optional(), memberId: z.string().uuid().optional() }))
        .query(async ({ ctx, input }): Promise<FamilyFinances> => {
            const viewer = await dashboardMembership(ctx.db, ctx.userId);
            if (viewer.role === 'child') throw new TRPCError({ code: 'FORBIDDEN' });
            const all = await readFamilyMembers(ctx.db, viewer.householdId);
            const visible = all.filter(r => canViewMemberFinances(viewer, r.member) && (!input.memberId || input.memberId === r.member.id));
            if (input.memberId && !visible.length) throw new TRPCError({ code: 'NOT_FOUND', message: 'Member not found' });
            const displayCurrency = input.currency ?? await householdBaseCurrency(ctx.db, viewer.household.ownerUserId);
            const { convert, missing } = baseConverter(displayCurrency, await currencyExchangeService.getExchangeRates(displayCurrency, { storedOnly: true }));
            const members: MemberHoldings[] = [];
            for (const row of orderFamilyMembers(visible, ctx.userId)) {
                const { member } = row;
                const hierarchy = await readBankHierarchy(ctx.db, member.userId, false);
                const products = await readMemberProducts(ctx.db, member.userId, hierarchy.flatMap(b => b.accounts.map(a => a.id)));
                members.push({
                    memberId: member.id, name: memberName(row), role: member.role, isGuardian: member.isGuardian, isMe: member.userId === ctx.userId,
                    accounts: hierarchy.flatMap(bank => bank.accounts.map(account => ({ id: account.id, bankName: bank.name, bankIcon: bank.icon,
                        accountName: account.name, type: account.type, last4: account.last4Digits,
                        balances: account.currencyBalances.map(b => ({ currencyCode: b.currencyCode, balance: moneyAmount(b.balance) })) }))),
                    debts: products.debtRows.flatMap(debt => {
                        const remaining = fromCents(Math.max(0, toCents(String(debt.amount)) - toCents(String(debt.paidAmount))));
                        if (toCents(remaining) === 0 || debt.status === 'paid' || !['i_owe', 'they_owe'].includes(debt.type)) return [];
                        const counterparty = all.find(r => r.member.userId === debt.linkedUserId && r.member.id !== member.id);
                        return [{ id: debt.id, type: debt.type as 'i_owe' | 'they_owe', personName: debt.personName,
                            counterpartyMemberId: counterparty?.member.id ?? null, remaining,
                            currencyCode: debt.currencyBalance?.currencyCode ?? debt.currencyCode ?? 'USD', dueDate: debt.dueDate }];
                    }),
                    credits: products.creditRows.filter(c => c.status === 'active').map(c => ({ id: c.id, name: c.name, remaining: moneyAmount(c.remainingBalance), monthlyPayment: moneyAmount(c.monthlyPayment), currency: c.currency, endDate: c.endDate })),
                    mortgages: products.mortgageRows.filter(m => m.status === 'active').map(m => ({ id: m.id, name: m.propertyName, remaining: moneyAmount(m.remainingBalance), monthlyPayment: moneyAmount(m.monthlyPayment), currency: m.currency, paymentDay: m.paymentDay })),
                    deposits: products.depositRows.filter(d => d.status === 'active').map(d => ({ id: d.id, name: d.depositName, balance: moneyAmount(d.currentBalance), currency: d.currency, interestRate: d.interestRate })),
                    subscriptions: products.activeSubscriptions.map(sub => {
                        const frequency = z.enum(['daily', 'weekly', 'monthly', 'yearly']).parse(sub.frequency);
                        return { id: sub.id, name: sub.name, amount: moneyAmount(sub.amount), monthlyAmount: monthlyAmount(String(sub.amount), frequency), currency: sub.currency,
                            frequency, nextPaymentDate: nextSubscriptionDate(sub), linkedEntityType: sub.linkedEntityType === 'credit' || sub.linkedEntityType === 'mortgage' ? sub.linkedEntityType : null };
                    }),
                    investments: await readFamilyInvestments(ctx.db, member.userId),
                });
            }
            const balances = amounts(), owes = amounts(), owed = amounts(), monthlyPayments = amounts();
            let accountsCount = 0, creditsCount = 0, mortgagesCount = 0, depositsCount = 0, subscriptionsCount = 0;
            for (const member of members) {
                accountsCount += member.accounts.length; creditsCount += member.credits.length; mortgagesCount += member.mortgages.length; depositsCount += member.deposits.length;
                for (const a of member.accounts) for (const b of a.balances) balances.add(b.balance, b.currencyCode);
                for (const d of member.debts) {
                    if (!d.counterpartyMemberId) (d.type === 'i_owe' ? owes : owed).add(d.remaining, d.currencyCode);
                }
                for (const c of [...member.credits, ...member.mortgages]) monthlyPayments.add(c.monthlyPayment, c.currency);
                for (const sub of member.subscriptions) if (!sub.linkedEntityType) {
                    monthlyPayments.add(sub.monthlyAmount, sub.currency); subscriptionsCount++;
                }
            }
            const sumConverted = (rows: CurrencyAmount[]) => fromCents(rows.reduce((sum, r) => sum + toCents(convert(r.amount, r.currencyCode) ?? '0'), 0));
            const summary = {
                balances: balances.rows(), balancesConverted: sumConverted(balances.rows()), accountsCount,
                owes: owes.rows(), owesConverted: sumConverted(owes.rows()), owed: owed.rows(), owedConverted: sumConverted(owed.rows()),
                monthlyPayments: monthlyPayments.rows(), monthlyPaymentsConverted: sumConverted(monthlyPayments.rows()),
                creditsCount, mortgagesCount, depositsCount, subscriptionsCount, investmentsValueConverted: sumConverted(members.flatMap(m => m.investments?.value ?? [])),
            };
            return { displayCurrency, unconvertedCurrencies: [...missing].sort(), members, summary, internalDebts: internalDebtsOf(members) };
        }),
};
