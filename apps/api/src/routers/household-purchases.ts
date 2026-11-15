import { TRPCError } from '@trpc/server';
import { and, desc, eq, ne } from 'drizzle-orm';
import { z } from 'zod';
import type { db as database } from '../db';
import { users } from '../db/schema/users';
import {
    familyPurchaseProposals as proposals,
    familyWalletTransactions as transactions,
    familyWallets as wallets,
    householdMembers as members,
    households,
    type PurchaseProposalEvent,
} from '../db/schema/households';
import { protectedProcedure } from '../lib/trpc';
import { householdDisplayName } from '../lib/household/display-name';
import { assertWalletAccess, getMembership } from '../lib/household/policy';
import { DEFAULT_SHARED_PURCHASE_LIMIT, purchaseAmountSchema, purchaseLimitSchema } from '../lib/household/purchases';
import { fromCents, toCents } from '../lib/household/limits';

type DB = typeof database;
type Transaction = Parameters<Parameters<DB['transaction']>[0]>[0];
type Proposal = typeof proposals.$inferSelect;

async function adultMembership(db: Pick<DB, 'select'>, userId: string) {
    const member = await getMembership(db, userId);
    if (!member) throw new TRPCError({ code: 'NOT_FOUND', message: 'Family not found' });
    if (member.role === 'child') throw new TRPCError({ code: 'FORBIDDEN', message: 'Only adults can make shared purchase decisions.' });
    return member;
}

/** Shared locks keep both sides active until the decision transaction commits. */
export async function lockPurchaseAdults(db: Pick<DB, 'select'>, householdId: string) {
    return db.select().from(members).where(and(
        eq(members.householdId, householdId), eq(members.status, 'active'), ne(members.role, 'child'),
    )).for('share');
}

export async function createPurchaseProposal(
    tx: Transaction,
    wallet: typeof wallets.$inferSelect,
    userId: string,
    input: { amount: string; categoryId?: string | null; description?: string; date: string },
) {
    const adults = await lockPurchaseAdults(tx, wallet.householdId);
    if (!adults.some(member => member.userId === userId)) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Only active adult family members can propose a shared purchase.' });
    }
    if (!adults.some(member => member.userId !== userId)) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'Invite another adult to the family before proposing a purchase above the shared limit.' });
    }
    const now = new Date();
    const [proposal] = await tx.insert(proposals).values({
        householdId: wallet.householdId, walletId: wallet.id,
        proposerUserId: userId, lastActorUserId: userId,
        originalAmount: input.amount, amount: input.amount,
        categoryId: input.categoryId ?? null, description: input.description, date: input.date,
        timeline: [{ action: 'proposed', byUserId: userId, amount: input.amount, at: now.toISOString() }],
    }).returning();
    return proposal;
}

function mayRespond(proposal: Proposal, userId: string): boolean {
    return ['pending', 'countered'].includes(proposal.status)
        && proposal.lastActorUserId !== userId
        && (!proposal.awaitingUserId || proposal.awaitingUserId === userId);
}

async function agreement(db: DB, userId: string) {
    const member = await adultMembership(db, userId);
    const household = member.household;
    const lastEditor = household.sharedPurchaseLimitUpdatedByUserId
        ? await db.query.users.findFirst({ where: eq(users.id, household.sharedPurchaseLimitUpdatedByUserId) }) : null;
    return {
        limit: household.sharedPurchaseLimit ?? DEFAULT_SHARED_PURCHASE_LIMIT,
        currencyRule: 'wallet' as const,
        canEdit: member.role === 'owner' || member.isGuardian,
        updatedAt: household.sharedPurchaseLimitUpdatedAt,
        updatedByName: lastEditor ? householdDisplayName(lastEditor.name, lastEditor.email) : null,
    };
}

export const householdPurchaseProcedures = {
    purchaseAgreement: protectedProcedure.query(({ ctx }) => agreement(ctx.db, ctx.userId)),

    updatePurchaseAgreement: protectedProcedure.input(z.object({ limit: purchaseLimitSchema })).mutation(async ({ ctx, input }) => {
        await ctx.db.transaction(async tx => {
            const member = await adultMembership(tx, ctx.userId);
            const adults = await lockPurchaseAdults(tx, member.householdId);
            const current = adults.find(person => person.userId === ctx.userId);
            if (!current || (current.role !== 'owner' && !current.isGuardian)) {
                throw new TRPCError({ code: 'FORBIDDEN', message: 'Only the family owner or a guardian can change the shared purchase limit.' });
            }
            await tx.select().from(households).where(eq(households.id, member.householdId)).for('update');
            await tx.update(households).set({
                sharedPurchaseLimit: input.limit, sharedPurchaseLimitUpdatedByUserId: ctx.userId,
                sharedPurchaseLimitUpdatedAt: new Date(), updatedAt: new Date(),
            }).where(eq(households.id, member.householdId));
        });
        return agreement(ctx.db, ctx.userId);
    }),

    purchaseProposals: protectedProcedure.input(z.object({
        status: z.enum(['pending', 'countered', 'approved', 'declined']).optional(),
    }).optional()).query(async ({ ctx, input }) => {
        const member = await adultMembership(ctx.db, ctx.userId);
        const rows = await ctx.db.select({ proposal: proposals, walletName: wallets.name, currencyCode: wallets.currencyCode, walletBalance: wallets.balance, walletArchivedAt: wallets.archivedAt })
            .from(proposals).innerJoin(wallets, eq(wallets.id, proposals.walletId))
            .where(and(eq(proposals.householdId, member.householdId), input?.status ? eq(proposals.status, input.status) : undefined))
            .orderBy(desc(proposals.createdAt));
        const people = await ctx.db.select({ userId: members.userId, name: users.name, email: users.email, role: members.role, status: members.status })
            .from(members).innerJoin(users, eq(users.id, members.userId)).where(eq(members.householdId, member.householdId));
        const personName = (userId: string | null) => {
            const person = people.find(person => person.userId === userId);
            return person ? householdDisplayName(person.name, person.email) : 'Former family member';
        };
        const activeAdult = (id: string | null) => people.some(person => person.userId === id && person.status === 'active' && person.role !== 'child');
        let decidedCount = 0;
        return { proposals: rows.filter(({ proposal }) => ['pending', 'countered'].includes(proposal.status) || decidedCount++ < 100).map(({ proposal, ...wallet }) => {
            const open = ['pending', 'countered'].includes(proposal.status);
            const missingAdult = !activeAdult(proposal.lastActorUserId) || (proposal.status === 'countered' && !activeAdult(proposal.awaitingUserId));
            return {
                ...proposal, ...wallet,
                proposerName: personName(proposal.proposerUserId),
                lastActorName: personName(proposal.lastActorUserId),
                awaitingName: proposal.awaitingUserId ? personName(proposal.awaitingUserId) : null,
                canRespond: mayRespond(proposal, ctx.userId) && !missingAdult && !wallet.walletArchivedAt,
                canWithdraw: open && proposal.lastActorUserId === ctx.userId,
                canDecline: open && (mayRespond(proposal, ctx.userId) || proposal.lastActorUserId === ctx.userId || missingAdult),
                unavailableReason: wallet.walletArchivedAt ? 'This wallet is archived. Close this proposal without spending.' : missingAdult ? 'An adult in this conversation is no longer active. Close this proposal without spending.' : null,
            };
        }) };
    }),

    respondToPurchaseProposal: protectedProcedure.input(z.object({
        proposalId: z.string().uuid(), action: z.enum(['approve', 'decline', 'counter']), amount: purchaseAmountSchema.optional(),
    }).superRefine((value, ctx) => {
        if (value.action === 'counter' && value.amount === undefined) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['amount'], message: 'Enter a counter amount.' });
        if (value.action !== 'counter' && value.amount !== undefined) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['amount'], message: 'Only a counter can change the amount.' });
    })).mutation(async ({ ctx, input }) => ctx.db.transaction(async tx => {
        const member = await adultMembership(tx, ctx.userId);
        const [proposal] = await tx.select().from(proposals)
            .where(and(eq(proposals.id, input.proposalId), eq(proposals.householdId, member.householdId))).for('update');
        if (!proposal) throw new TRPCError({ code: 'NOT_FOUND', message: 'Purchase proposal not found.' });
        const adults = await lockPurchaseAdults(tx, member.householdId);
        if (!adults.some(person => person.userId === ctx.userId)) throw new TRPCError({ code: 'FORBIDDEN' });
        // A retried identical terminal decision succeeds without repeating its writes.
        if (['approved', 'declined'].includes(proposal.status)) {
            if (proposal.decidedByUserId === ctx.userId && proposal.status === (input.action === 'approve' ? 'approved' : input.action === 'decline' ? 'declined' : '')) {
                return { proposal, transactionId: proposal.transactionId, alreadyDecided: true };
            }
            throw new TRPCError({ code: 'CONFLICT', message: 'This proposal has already been decided.' });
        }
        const missingAdult = !adults.some(person => person.userId === proposal.lastActorUserId)
            || (proposal.status === 'countered' && !adults.some(person => person.userId === proposal.awaitingUserId));
        const mayClose = input.action === 'decline' && (proposal.lastActorUserId === ctx.userId || missingAdult);
        if (!mayRespond(proposal, ctx.userId) && !mayClose) {
            throw new TRPCError({ code: 'FORBIDDEN', message: 'The other adult must respond to this offer. You cannot approve your own offer.' });
        }
        if (missingAdult && input.action !== 'decline') {
            throw new TRPCError({ code: 'BAD_REQUEST', message: 'The adult who made this offer is no longer active in the family.' });
        }
        if (input.action === 'counter' && input.amount === proposal.amount) {
            throw new TRPCError({ code: 'BAD_REQUEST', message: 'Enter a different amount for your counteroffer.' });
        }
        if (proposal.timeline.length >= 100) throw new TRPCError({ code: 'BAD_REQUEST', message: 'This proposal has too many revisions. Start a new purchase proposal.' });
        const now = new Date();
        const amount = input.action === 'counter' ? input.amount! : proposal.amount;
        const event: PurchaseProposalEvent = { action: input.action === 'counter' ? 'countered' : input.action === 'approve' ? 'approved' : 'declined', byUserId: ctx.userId, amount, at: now.toISOString() };
        let transactionId: string | null = null;
        if (input.action === 'approve') {
            const [wallet] = await tx.select().from(wallets).where(and(eq(wallets.id, proposal.walletId), eq(wallets.householdId, member.householdId))).for('update');
            if (!wallet || wallet.kind !== 'shared') throw new TRPCError({ code: 'NOT_FOUND', message: 'Shared wallet not found.' });
            if (wallet.archivedAt) throw new TRPCError({ code: 'BAD_REQUEST', message: 'This shared wallet is archived. Decline the proposal without spending.' });
            assertWalletAccess(member, wallet, 'expense');
            const balance = toCents(wallet.balance) - toCents(proposal.amount);
            if (balance < 0) throw new TRPCError({ code: 'BAD_REQUEST', message: 'Not enough money in the shared wallet now. No money has been spent.' });
            const [transaction] = await tx.insert(transactions).values({
                walletId: wallet.id, type: 'expense', amount: proposal.amount,
                categoryId: proposal.categoryId, description: proposal.description, date: proposal.date,
                createdByUserId: proposal.proposerUserId,
            }).returning();
            transactionId = transaction.id;
            await tx.update(wallets).set({ balance: fromCents(balance), updatedAt: now }).where(eq(wallets.id, wallet.id));
        }
        const [updated] = await tx.update(proposals).set({
            amount, status: input.action === 'counter' ? 'countered' : input.action === 'approve' ? 'approved' : 'declined',
            lastActorUserId: ctx.userId,
            awaitingUserId: input.action === 'counter' ? proposal.lastActorUserId : null,
            decidedByUserId: input.action === 'counter' ? null : ctx.userId,
            decidedAt: input.action === 'counter' ? null : now,
            transactionId, timeline: [...proposal.timeline, event], updatedAt: now,
        }).where(eq(proposals.id, proposal.id)).returning();
        return { proposal: updated, transactionId, alreadyDecided: false };
    })),
};
