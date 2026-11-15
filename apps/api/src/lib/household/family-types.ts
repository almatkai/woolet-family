import type { Membership } from './policy';

export type CurrencyAmount = { currencyCode: string; amount: string };
export type FamilyInvestments = {
    value: CurrencyAmount[];
    holdings: { symbol: string; quantity: string; value: string; currency: string }[];
};
export type MemberHoldings = {
    memberId: string; name: string; role: Membership['role']; isGuardian: boolean; isMe: boolean;
    accounts: { id: string; bankName: string; bankIcon: string | null; accountName: string; type: string; last4: string | null;
        balances: { currencyCode: string; balance: string }[] }[];
    debts: { id: string; type: 'i_owe' | 'they_owe'; personName: string; counterpartyMemberId: string | null;
        remaining: string; currencyCode: string; dueDate: string | null }[];
    credits: { id: string; name: string; remaining: string; monthlyPayment: string; currency: string; endDate: string }[];
    mortgages: { id: string; name: string; remaining: string; monthlyPayment: string; currency: string; paymentDay: number | null }[];
    deposits: { id: string; name: string; balance: string; currency: string; interestRate: string | null }[];
    subscriptions: { id: string; name: string; amount: string; monthlyAmount: string; currency: string;
        frequency: 'daily' | 'weekly' | 'monthly' | 'yearly'; nextPaymentDate: string | null; linkedEntityType: 'credit' | 'mortgage' | null }[];
    investments: FamilyInvestments | null;
};
export type InternalDebt = { id: string; fromMemberId: string; toMemberId: string; remaining: string; currencyCode: string };
export type FamilyFinances = {
    displayCurrency: string; unconvertedCurrencies: string[]; members: MemberHoldings[];
    summary: {
        balances: CurrencyAmount[]; balancesConverted: string; accountsCount: number;
        owes: CurrencyAmount[]; owesConverted: string; owed: CurrencyAmount[]; owedConverted: string;
        monthlyPayments: CurrencyAmount[]; monthlyPaymentsConverted: string;
        creditsCount: number; mortgagesCount: number; depositsCount: number; subscriptionsCount: number;
        investmentsValueConverted: string | null;
    };
    internalDebts: InternalDebt[];
};
