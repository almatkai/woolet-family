import { sql } from 'drizzle-orm';
import { pgTable, pgEnum, uuid, text, boolean, timestamp, decimal, date, jsonb, uniqueIndex, index, check } from 'drizzle-orm/pg-core';
import { users } from './users';
import { currencies } from './currencies';
import { categories } from './categories';

export const MAX_HOUSEHOLD_MEMBERS = 6;
export const householdRole = pgEnum('household_role', ['owner', 'adult', 'child']);
export const householdMemberStatus = pgEnum('household_member_status', ['active', 'left', 'removed']);
export const householdInvitationRole = pgEnum('household_invitation_role', ['adult', 'child']);
export const familyWalletKind = pgEnum('family_wallet_kind', ['shared', 'child']);
export const familyTransactionType = pgEnum('family_transaction_type', ['income', 'expense', 'transfer_in', 'transfer_out']);
export const familyLimitPeriod = pgEnum('family_limit_period', ['weekly', 'monthly']);
export const familyPurchaseProposalStatus = pgEnum('family_purchase_proposal_status', ['pending', 'countered', 'approved', 'declined']);
const id = () => uuid('id').defaultRandom().primaryKey();
const createdAt = () => timestamp('created_at').defaultNow().notNull();
const updatedAt = () => timestamp('updated_at').defaultNow().notNull();
export const households = pgTable('households', {
    id: id(), name: text('name').notNull(),
    ownerUserId: text('owner_user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
    childrenCanSeeSharedWallets: boolean('children_can_see_shared_wallets').default(false).notNull(),
    sharedPurchaseLimit: decimal('shared_purchase_limit', { precision: 12, scale: 2 }).default('1000.00').notNull(),
    sharedPurchaseLimitUpdatedByUserId: text('shared_purchase_limit_updated_by_user_id').references(() => users.id, { onDelete: 'set null' }),
    sharedPurchaseLimitUpdatedAt: timestamp('shared_purchase_limit_updated_at'),
    createdAt: createdAt(), updatedAt: updatedAt(),
}, t => ({ purchaseLimit: check('household_shared_purchase_limit_nonnegative', sql`${t.sharedPurchaseLimit} >= 0`) }));
export const householdMembers = pgTable('household_members', {
    id: id(), householdId: uuid('household_id').references(() => households.id, { onDelete: 'cascade' }).notNull(),
    userId: text('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
    role: householdRole('role').notNull(), isGuardian: boolean('is_guardian').default(false).notNull(),
    showBalanceToChildren: boolean('show_balance_to_children').default(false).notNull(),
    status: householdMemberStatus('status').default('active').notNull(), joinedAt: timestamp('joined_at').defaultNow().notNull(), leftAt: timestamp('left_at'),
}, t => ({ member: uniqueIndex('household_members_household_user_unique').on(t.householdId, t.userId), active: uniqueIndex('household_members_active_user_unique').on(t.userId).where(sql`${t.status} = 'active'`) }));
export const householdInvitations = pgTable('household_invitations', {
    id: id(), householdId: uuid('household_id').references(() => households.id, { onDelete: 'cascade' }).notNull(),
    emailNormalized: text('email_normalized').notNull(), role: householdInvitationRole('role').notNull(), isGuardian: boolean('is_guardian').default(false).notNull(),
    invitedByUserId: text('invited_by_user_id').references(() => users.id, { onDelete: 'set null' }),
    tokenHash: text('token_hash').notNull().unique(), expiresAt: timestamp('expires_at').notNull(),
    acceptedByUserId: text('accepted_by_user_id').references(() => users.id, { onDelete: 'set null' }),
    acceptedAt: timestamp('accepted_at'), revokedAt: timestamp('revoked_at'), createdAt: createdAt(),
});
export const familyWallets = pgTable('family_wallets', {
    id: id(), householdId: uuid('household_id').references(() => households.id, { onDelete: 'cascade' }).notNull(),
    kind: familyWalletKind('kind').notNull(), name: text('name').notNull(), currencyCode: text('currency_code').references(() => currencies.code).notNull(),
    childMemberId: uuid('child_member_id').references(() => householdMembers.id, { onDelete: 'set null' }), balance: decimal('balance', { precision: 14, scale: 2 }).default('0').notNull(),
    archivedAt: timestamp('archived_at'), createdByUserId: text('created_by_user_id').references(() => users.id, { onDelete: 'set null' }), createdAt: createdAt(), updatedAt: updatedAt(),
}, t => ({ // An archived child wallet may outlive the child's account (childMemberId set null on delete).
    child: check('family_wallet_child_member_check', sql`(${t.kind} = 'shared' AND ${t.childMemberId} IS NULL) OR (${t.kind} = 'child' AND (${t.childMemberId} IS NOT NULL OR ${t.archivedAt} IS NOT NULL))`) }));
export const familyWalletTransactions = pgTable('family_wallet_transactions', {
    id: id(), walletId: uuid('wallet_id').references(() => familyWallets.id, { onDelete: 'cascade' }).notNull(), type: familyTransactionType('type').notNull(),
    amount: decimal('amount', { precision: 12, scale: 2 }).notNull(), categoryId: uuid('category_id').references(() => categories.id, { onDelete: 'set null' }),
    description: text('description'), date: date('date').notNull(), transferGroupId: uuid('transfer_group_id'),
    createdByUserId: text('created_by_user_id').references(() => users.id, { onDelete: 'set null' }), createdAt: createdAt(),
}, t => ({ positive: check('family_transaction_positive', sql`${t.amount} > 0`), walletDate: index('family_transactions_wallet_date_idx').on(t.walletId, t.date) }));
export const familyBudgetLimits = pgTable('family_budget_limits', {
    id: id(), walletId: uuid('wallet_id').references(() => familyWallets.id, { onDelete: 'cascade' }).notNull(),
    categoryId: uuid('category_id').references(() => categories.id, { onDelete: 'set null' }), period: familyLimitPeriod('period').notNull(), amount: decimal('amount', { precision: 12, scale: 2 }).notNull(),
    updatedByUserId: text('updated_by_user_id').references(() => users.id, { onDelete: 'set null' }), createdAt: createdAt(), updatedAt: updatedAt(),
}, t => ({ positive: check('family_limit_positive', sql`${t.amount} > 0`), total: uniqueIndex('family_limits_total_unique').on(t.walletId, t.period).where(sql`${t.categoryId} IS NULL`), category: uniqueIndex('family_limits_category_unique').on(t.walletId, t.categoryId, t.period).where(sql`${t.categoryId} IS NOT NULL`) }));

export type PurchaseProposalEvent = { action: 'proposed' | 'countered' | 'approved' | 'declined'; byUserId: string; amount: string; at: string };
export const familyPurchaseProposals = pgTable('family_purchase_proposals', {
    id: id(), householdId: uuid('household_id').references(() => households.id, { onDelete: 'cascade' }).notNull(),
    walletId: uuid('wallet_id').references(() => familyWallets.id, { onDelete: 'cascade' }).notNull(),
    proposerUserId: text('proposer_user_id').references(() => users.id, { onDelete: 'set null' }),
    lastActorUserId: text('last_actor_user_id').references(() => users.id, { onDelete: 'set null' }),
    awaitingUserId: text('awaiting_user_id').references(() => users.id, { onDelete: 'set null' }),
    originalAmount: decimal('original_amount', { precision: 12, scale: 2 }).notNull(),
    amount: decimal('amount', { precision: 12, scale: 2 }).notNull(),
    categoryId: uuid('category_id').references(() => categories.id, { onDelete: 'set null' }),
    description: text('description'), date: date('date').notNull(),
    status: familyPurchaseProposalStatus('status').default('pending').notNull(),
    decidedByUserId: text('decided_by_user_id').references(() => users.id, { onDelete: 'set null' }),
    decidedAt: timestamp('decided_at'),
    transactionId: uuid('transaction_id').references(() => familyWalletTransactions.id, { onDelete: 'set null' }),
    timeline: jsonb('timeline').$type<PurchaseProposalEvent[]>().default([]).notNull(),
    createdAt: createdAt(), updatedAt: updatedAt(),
}, t => ({
    positive: check('family_purchase_proposal_positive', sql`${t.amount} > 0 AND ${t.originalAmount} > 0`),
    householdStatus: index('family_purchase_proposals_household_status_idx').on(t.householdId, t.status, t.createdAt),
    transaction: uniqueIndex('family_purchase_proposals_transaction_unique').on(t.transactionId).where(sql`${t.transactionId} IS NOT NULL`),
}));
