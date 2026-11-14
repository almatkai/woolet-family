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
    transaction: { id: string };
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
