// Response shapes of the `household` tRPC router (apps/api/src/routers/household*.ts).
// The web tRPC client is untyped (`trpc: any`), so family screens cast query data to these.
// Money values are 2-decimal strings; dates are YYYY-MM-DD strings unless noted.

export type HouseholdRole = 'owner' | 'adult' | 'child';
export type LimitPeriod = 'weekly' | 'monthly';
export type WalletKind = 'shared' | 'child';
export type FamilyTransactionType =
    'income' | 'expense' | 'transfer_in' | 'transfer_out';

export type HouseholdMember = {
    id: string;
    userId: string;
    name: string;
    /** Only present for adult/owner callers. */
    email?: string;
    role: HouseholdRole;
    isGuardian: boolean;
    showBalanceToChildren: boolean;
    joinedAt: string;
};

/** `household.get` → null when the user isn't in a family. */
export type HouseholdOverview = {
    household: {
        id: string;
        name: string;
        ownerUserId: string;
        childrenCanSeeSharedWallets: boolean;
    };
    me: {
        id: string;
        userId: string;
        role: HouseholdRole;
        isGuardian: boolean;
        showBalanceToChildren: boolean;
        canManageMembers: boolean;
        canEditSettings: boolean;
    };
    members: HouseholdMember[];
    activeMembers: number;
    pendingInvites: number;
    maxMembers: number;
} | null;

/** `household.invitations` (owner only). */
export type PendingInvitation = {
    id: string;
    emailNormalized: string;
    role: 'adult' | 'child';
    isGuardian: boolean;
    expiresAt: string;
    createdAt: string;
};

/** `household.invite` */
export type InviteResult = {
    invitationId: string;
    token: string;
    expiresAt: string;
};

export type InvitationReason =
    | 'expired'
    | 'revoked'
    | 'accepted'
    | 'wrong_email'
    | 'already_in_family'
    | 'full'
    | 'not_found';

/** `household.previewInvitation({ token })` */
export type InvitationPreview = {
    canAccept: boolean;
    reason?: InvitationReason;
    householdName?: string;
    inviterName?: string;
    role?: 'adult' | 'child';
    isGuardian?: boolean;
    expiresAt?: string;
    /** Present for reason 'wrong_email': masked like a***@gmail.com */
    invitedEmail?: string;
    callerEmail?: string | null;
    /** Present for reason 'already_in_family'. */
    currentFamilyName?: string;
};

export type LimitSummary = {
    limitId: string;
    period: LimitPeriod;
    amount: string;
    spent: string;
    remaining: string;
    periodStart: string;
    periodEnd: string;
};

export type FamilyWallet = {
    id: string;
    kind: WalletKind;
    name: string;
    currencyCode: string;
    balance: string;
    childMemberId: string | null;
    childName: string | null;
    canWrite: boolean;
    canManage: boolean;
    canDeleteTransactions: boolean;
    /** Child wallets: the total limit with the least remaining; null if none. */
    limitSummary: LimitSummary | null;
};

/** `household.wallets({ today })` */
export type FamilyWalletsResponse = {
    wallets: FamilyWallet[];
    /** Children only, when the owner allows it: names and balances, no transactions. */
    sharedWalletsVisible: {
        id: string;
        name: string;
        currencyCode: string;
        balance: string;
    }[];
    /** Children only: adults who chose to show their balance; totals per currency. */
    adultBalances: {
        memberId: string;
        name: string;
        totals: { currencyCode: string; amount: string }[];
    }[];
};

export type FamilyTransaction = {
    id: string;
    type: FamilyTransactionType;
    amount: string;
    categoryId: string | null;
    categoryName: string | null;
    description: string | null;
    date: string;
    transferGroupId: string | null;
    /** null when the caller may not see the other wallet → show "Top-up from family" / "Moved to family". */
    counterpartWalletId: string | null;
    counterpartWalletName: string | null;
    createdByName: string | null;
    createdAt: string;
};

/** `household.walletTransactions({ walletId, cursor?, limit? })` */
export type FamilyTransactionsPage = {
    items: FamilyTransaction[];
    nextCursor: string | null;
};

/** `household.walletSummary({ walletId, today })` */
export type FamilyWalletSummary = {
    monthIncome: string;
    monthOutflow: string;
    monthStart: string;
    monthEnd: string;
};

/** `household.limits({ walletId, today })` */
export type FamilyLimit = {
    id: string;
    categoryId: string | null;
    categoryName: string | null;
    period: LimitPeriod;
    amount: string;
    spent: string;
    remaining: string;
    periodStart: string;
    periodEnd: string;
};

/**
 * Child over-limit rejection: TRPC BAD_REQUEST "This is more than you have left" with
 * `error.data.limitViolation`. Adult over a child's limit: same objects in `limitWarnings`.
 */
export type LimitViolation = {
    code: 'LIMIT_EXCEEDED';
    limitId: string;
    categoryId: string | null;
    categoryName: string | null;
    period: LimitPeriod;
    remaining: string;
    periodEnd: string;
};

/** `household.addTransaction` */
export type AddTransactionResult = {
    transaction: { id: string } | null;
    approvalRequired?: boolean;
    proposal?: { id: string } | null;
    balance: string;
    limitWarnings: LimitViolation[];
};
/** `household.transfer` */
export type TransferResult = {
    transferGroupId: string;
    fromBalance: string;
    toBalance: string;
    limitWarnings: LimitViolation[];
};

/** Client's local date for `today` inputs (the server computes periods from it). */
export const localToday = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

export const limitViolationOf = (error: unknown): LimitViolation | null =>
    (error as { data?: { limitViolation?: LimitViolation } } | null)?.data
        ?.limitViolation ?? null;

/** Exact tRPC input/result types generated from the TypeScript checker at ca768b1.
 * Input strings retain their Zod runtime validation:
 * - month YYYY-MM; today/date valid YYYY-MM-DD; member/category ids UUID.
 * - categoryId also accepts 'none'. Currency is an uppercase supported code.
 * - familyTransactions limit: integer 1..50, default 30; cursor: opaque string.
 * - taxYear: 2025 | 2026. All procedures are queries.
 * Output aliases describe resolved results, before the Promise wrapper.
 * Includes unchanged public contracts of the three refactored personal procedures.
 */
export type CurrencyAmount = {
    currencyCode: string;
    amount: string;
};
export type FamilyInvestments = {
    value: CurrencyAmount[];
    holdings: {
        symbol: string;
        quantity: string;
        value: string;
        currency: string;
    }[];
};
export type MemberHoldings = {
    memberId: string;
    name: string;
    role: 'owner' | 'adult' | 'child';
    isGuardian: boolean;
    isMe: boolean;
    accounts: {
        id: string;
        bankName: string;
        bankIcon: string | null;
        accountName: string;
        type: string;
        last4: string | null;
        balances: {
            currencyCode: string;
            balance: string;
        }[];
    }[];
    debts: {
        id: string;
        type: 'i_owe' | 'they_owe';
        personName: string;
        counterpartyMemberId: string | null;
        remaining: string;
        currencyCode: string;
        dueDate: string | null;
    }[];
    credits: {
        id: string;
        name: string;
        remaining: string;
        monthlyPayment: string;
        currency: string;
        endDate: string;
    }[];
    mortgages: {
        id: string;
        name: string;
        remaining: string;
        monthlyPayment: string;
        currency: string;
        paymentDay: number | null;
    }[];
    deposits: {
        id: string;
        name: string;
        balance: string;
        currency: string;
        interestRate: string | null;
    }[];
    subscriptions: {
        id: string;
        name: string;
        amount: string;
        monthlyAmount: string;
        currency: string;
        frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
        nextPaymentDate: string | null;
        linkedEntityType: 'credit' | 'mortgage' | null;
    }[];
    investments: FamilyInvestments | null;
};
export type InternalDebt = {
    id: string;
    fromMemberId: string;
    toMemberId: string;
    remaining: string;
    currencyCode: string;
};
export type FamilyFinances = {
    displayCurrency: string;
    unconvertedCurrencies: string[];
    members: MemberHoldings[];
    summary: {
        balances: CurrencyAmount[];
        balancesConverted: string;
        accountsCount: number;
        owes: CurrencyAmount[];
        owesConverted: string;
        owed: CurrencyAmount[];
        owedConverted: string;
        monthlyPayments: CurrencyAmount[];
        monthlyPaymentsConverted: string;
        creditsMonthlyConverted: string;
        creditsRemainingConverted: string;
        mortgagesMonthlyConverted: string;
        mortgagesRemainingConverted: string;
        depositsConverted: string;
        subscriptionsMonthlyConverted: string;
        creditsCount: number;
        mortgagesCount: number;
        depositsCount: number;
        subscriptionsCount: number;
        investmentsValueConverted: string | null;
    };
    internalDebts: InternalDebt[];
};
export type FamilyLedgerItem = {
    id: string;
    source: 'personal' | 'wallet';
    date: string;
    kind: 'income' | 'expense';
    amount: string;
    currencyCode: string;
    categoryId: string | null;
    categoryName: string | null;
    categoryIcon: string | null;
    description: string | null;
    spender: {
        memberId: string | null;
        name: string;
        isMe: boolean;
    } | null;
    author: {
        memberId: string | null;
        name: string;
        isMe: boolean;
    } | null;
    place:
        | {
              kind: 'account';
              accountName: string;
              bankName: string;
          }
        | {
              kind: 'wallet';
              walletId: string;
              walletName: string;
              walletKind: 'shared' | 'child';
          };
};
export type FamilyTaxRow = {
    memberId: string;
    name: string;
    isMe: boolean;
    hasProfile: boolean;
    estimatedTax: string | null;
    paid: string | null;
    nextDue: {
        date: string;
        amount: string;
    } | null;
    currency: string;
};
export type HouseholdOverviewInput = {
    month: string;
    categoryId?: string | undefined;
    currency?: string | undefined;
    memberId?: string | undefined;
    today?: string | undefined;
};
export type HouseholdOverviewOutput = {
    baseCurrency: string;
    displayCurrency: string;
    byCurrency: {
        month: string;
        periodStart: string;
        periodEnd: string;
        currencies: {
            currencyCode: string;
            income: string;
            expense: string;
            budget: string | null;
            remaining: string | null;
        }[];
        members: {
            totals: {
                currencyCode: string;
                amount: string;
            }[];
            memberId: string | null;
            name: string;
            status: 'active' | 'former' | 'unassigned';
        }[];
        categories: {
            categoryId: string | null;
            categoryName: string;
            totals: {
                currencyCode: string;
                amount: string;
            }[];
        }[];
        dailyExpenses: {
            date: string;
            totals: {
                currencyCode: string;
                amount: string;
            }[];
        }[];
    };
    filtered: {
        month: string;
        periodStart: string;
        periodEnd: string;
        currencies: {
            currencyCode: string;
            income: string;
            expense: string;
            budget: string | null;
            remaining: string | null;
        }[];
        members: {
            totals: {
                currencyCode: string;
                amount: string;
            }[];
            memberId: string | null;
            name: string;
            status: 'active' | 'former' | 'unassigned';
        }[];
        categories: {
            categoryId: string | null;
            categoryName: string;
            totals: {
                currencyCode: string;
                amount: string;
            }[];
        }[];
        dailyExpenses: {
            date: string;
            totals: {
                currencyCode: string;
                amount: string;
            }[];
        }[];
    } | null;
    availableCurrencies: string[];
    previousMonthToDateExpense: string;
    converted: {
        month: string;
        periodStart: string;
        periodEnd: string;
        currencies: {
            currencyCode: string;
            income: string;
            expense: string;
            budget: string | null;
            remaining: string | null;
        }[];
        members: {
            totals: {
                currencyCode: string;
                amount: string;
            }[];
            memberId: string | null;
            name: string;
            status: 'active' | 'former' | 'unassigned';
        }[];
        categories: {
            categoryId: string | null;
            categoryName: string;
            totals: {
                currencyCode: string;
                amount: string;
            }[];
        }[];
        dailyExpenses: {
            date: string;
            totals: {
                currencyCode: string;
                amount: string;
            }[];
        }[];
    };
    unconvertedCurrencies: string[];
    categoryBudgets: {
        categoryId: string;
        categoryName: string;
        amount: string;
        spent: string;
    }[];
    previousMonthExpense: string;
    members: {
        memberId: string;
        userId: string;
        name: string;
        role: 'owner' | 'adult' | 'child';
        isGuardian: boolean;
        isMe: boolean;
        canOpen: boolean;
        netWorth: string | null;
        expenseCount: number;
        spent: string;
        transactionsCount: number;
    }[];
};
export type FamilyTransactionsInput = {
    month: string;
    date?: string | undefined;
    categoryId?: string | undefined;
    limit?: number | undefined;
    memberId?: string | undefined;
    cursor?: string | undefined;
};
export type FamilyTransactionsOutput = {
    items: FamilyLedgerItem[];
    nextCursor: string | null;
    hiddenChildRows: boolean;
};
export type FamilyFinancesInput = {
    currency?: string | undefined;
    memberId?: string | undefined;
};
export type FamilyFinancesOutput = {
    displayCurrency: string;
    unconvertedCurrencies: string[];
    members: MemberHoldings[];
    summary: {
        balances: CurrencyAmount[];
        balancesConverted: string;
        accountsCount: number;
        owes: CurrencyAmount[];
        owesConverted: string;
        owed: CurrencyAmount[];
        owedConverted: string;
        monthlyPayments: CurrencyAmount[];
        monthlyPaymentsConverted: string;
        creditsMonthlyConverted: string;
        creditsRemainingConverted: string;
        mortgagesMonthlyConverted: string;
        mortgagesRemainingConverted: string;
        depositsConverted: string;
        subscriptionsMonthlyConverted: string;
        creditsCount: number;
        mortgagesCount: number;
        depositsCount: number;
        subscriptionsCount: number;
        investmentsValueConverted: string | null;
    };
    internalDebts: InternalDebt[];
};
export type FamilyTaxInput = {
    taxYear: 2026 | 2025;
};
export type FamilyTaxOutput = FamilyTaxRow[];
export type MemberFinancesInput = {
    memberId: string;
    cursor?: string | undefined;
};
export type MemberFinancesOutput = {
    baseCurrency: string;
    member: {
        memberId: string;
        name: string;
        role: 'owner' | 'adult' | 'child';
        isMe: boolean;
    };
    accounts: {
        bankName: string;
        bankIcon: string | null;
        accountName: string;
        type: string;
        last4: string | null;
        balances: {
            currencyCode: string;
            balance: string;
        }[];
    }[];
    netWorth: string;
    unconvertedCurrencies: string[];
    transactions: {
        items: {
            id: string;
            date: string;
            type: string;
            amount: string;
            currencyCode: string;
            categoryName: string;
            categoryIcon: string;
            description: string | null;
            accountName: string;
        }[];
        nextCursor: string | null;
    };
    subscriptions: {
        name: string;
        amount: string;
        currency: string;
        frequency: string;
        nextPaymentDate: string | null;
    }[];
    liabilities: {
        debts: {
            currencyCode: string;
            iOwe: string;
            theyOwe: string;
        }[];
        credits: {
            name: string;
            remaining: string;
            monthlyPayment: string;
            currency: string;
        }[];
        mortgages: {
            name: string;
            remaining: string;
            monthlyPayment: string;
            currency: string;
        }[];
        deposits: {
            name: string;
            balance: string;
            currency: string;
        }[];
    };
    investments: null;
};

/** Tax years the server has tables for (see @woolet/shared tax tables). */
export const SUPPORTED_TAX_YEARS = [2026, 2025] as const;
export type SupportedTaxYear = (typeof SUPPORTED_TAX_YEARS)[number];

/** The client's current year, clamped to a year the tax estimator supports. */
export const currentTaxYear = (): SupportedTaxYear => {
    const year = Number(localToday().slice(0, 4));
    const max = Math.max(...SUPPORTED_TAX_YEARS) as SupportedTaxYear;
    const min = Math.min(...SUPPORTED_TAX_YEARS) as SupportedTaxYear;
    return year >= max ? max : year <= min ? min : (year as SupportedTaxYear);
};
