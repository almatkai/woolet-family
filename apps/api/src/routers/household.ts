import { createHash, randomBytes } from 'node:crypto';
import { TRPCError } from '@trpc/server';
import { and, eq, gt, isNull, ne, sql } from 'drizzle-orm';
import { z } from 'zod';
import { protectedProcedure, router } from '../lib/trpc';
import { db as database } from '../db';
import { users } from '../db/schema/users';
import { familyWallets, householdInvitations as invites, householdMembers as members, households, MAX_HOUSEHOLD_MEMBERS } from '../db/schema/households';
import { canEditHouseholdSettings, canManageMembers, getMembership } from '../lib/household/policy';
import * as clerkEmail from '../lib/household/clerk-email';
import { householdWalletProcedures } from './household-wallets';
import { householdOverviewProcedures } from './household-overview';
import { householdBudgetProcedures } from './household-budgets';
import { householdWalletQueries } from './household-wallet-queries';

type DB = typeof database;
const name = z.string().trim().min(1).max(60);
const tokenInput = z.object({ token: z.string().min(1).max(256) });
const hash = (token: string) => createHash('sha256').update(token).digest('hex');
const fail = (message: string, code: 'BAD_REQUEST' | 'FORBIDDEN' | 'NOT_FOUND' = 'BAD_REQUEST'): never => { throw new TRPCError({ code, message }); };
const pending = (householdId: string, now = new Date()) => and(eq(invites.householdId, householdId), isNull(invites.acceptedAt), isNull(invites.revokedAt), gt(invites.expiresAt, now));
async function membership(db: DB, userId: string, owner = false) {
    const m = await getMembership(db, userId);
    if (!m) return fail('Family not found', 'NOT_FOUND');
    if (owner && !canManageMembers(m)) return fail('Only the family owner can do this', 'FORBIDDEN');
    return m;
}
async function activeCount(db: DB, householdId: string) {
    const [row] = await db.select({ count: sql<number>`count(*)::int` }).from(members).where(and(eq(members.householdId, householdId), eq(members.status, 'active')));
    return row.count;
}
const safeInvite = (i: typeof invites.$inferSelect) => ({ id: i.id, emailNormalized: i.emailNormalized, role: i.role, isGuardian: i.isGuardian, expiresAt: i.expiresAt, createdAt: i.createdAt });
const reasonMessage = { not_found: 'Invite not found', expired: 'This invite has expired', revoked: 'This invite was revoked', accepted: 'This invite was already accepted', wrong_email: 'This invite is for a different email', already_in_family: "You're already in a family", full: 'This family is full', unverified_email: 'Verify your primary email before joining' };
async function invitationState(db: DB, userId: string, token: string) {
    const i = await db.query.householdInvitations.findFirst({ where: eq(invites.tokenHash, hash(token)) });
    if (!i) return { reason: 'not_found' as const };
    const household = await db.query.households.findFirst({ where: eq(households.id, i.householdId) });
    if (!household) return { reason: 'not_found' as const };
    const m = await getMembership(db, userId);
    const email = await clerkEmail.getVerifiedPrimaryEmail(userId);
    const reason = i.revokedAt ? 'revoked' : i.acceptedAt ? 'accepted' : i.expiresAt <= new Date() ? 'expired' : !email || email.trim().toLowerCase() !== i.emailNormalized ? 'wrong_email' : m ? 'already_in_family' : await activeCount(db, i.householdId) >= MAX_HOUSEHOLD_MEMBERS ? 'full' : undefined;
    return { i, household, m, email, reason };
}

export const householdRouter = router({
    ...householdOverviewProcedures,
    ...householdBudgetProcedures,
    ...householdWalletProcedures,
    ...householdWalletQueries,
    get: protectedProcedure.query(async ({ ctx }) => {
        const m = await getMembership(ctx.db, ctx.userId);
        if (!m) return null;
        const rows = await ctx.db.select({ member: members, name: users.name, email: users.email }).from(members).innerJoin(users, eq(users.id, members.userId)).where(and(eq(members.householdId, m.householdId), eq(members.status, 'active')));
        const pendingInvites = await ctx.db.query.householdInvitations.findMany({ where: pending(m.householdId) });
        const { household, ...me } = m;
        return { household, me: { ...me, canManageMembers: canManageMembers(m), canEditSettings: canEditHouseholdSettings(m) }, members: rows.map(({ member: r, name, email }) => ({ id: r.id, userId: r.userId, name: name?.trim() || email.split('@')[0], ...(m.role !== 'child' ? { email } : {}), role: r.role, isGuardian: r.isGuardian, showBalanceToChildren: r.showBalanceToChildren, joinedAt: r.joinedAt })), activeMembers: rows.length, pendingInvites: pendingInvites.length, maxMembers: MAX_HOUSEHOLD_MEMBERS };
    }),
    invitations: protectedProcedure.query(async ({ ctx }) => {
        const m = await membership(ctx.db, ctx.userId, true);
        return (await ctx.db.query.householdInvitations.findMany({ where: pending(m.householdId) })).map(safeInvite);
    }),
    previewInvitation: protectedProcedure.input(tokenInput).query(async ({ ctx, input }) => {
        const s = await invitationState(ctx.db, ctx.userId, input.token);
        if (!s.i) return { canAccept: false, reason: 'not_found' as const };
        const inviter = s.i.invitedByUserId ? await ctx.db.query.users.findFirst({ where: eq(users.id, s.i.invitedByUserId) }) : null;
        return { householdName: s.household.name, inviterName: inviter?.name?.trim() || inviter?.email.split('@')[0] || 'Family owner', role: s.i.role, isGuardian: s.i.isGuardian, expiresAt: s.i.expiresAt, canAccept: !s.reason, ...(s.reason ? { reason: s.reason } : {}), ...(s.reason === 'wrong_email' ? { invitedEmail: s.i.emailNormalized.replace(/^(.).*(@.*)$/, '$1***$2'), callerEmail: s.email } : {}), ...(s.reason === 'already_in_family' ? { currentFamilyName: s.m?.household.name } : {}) };
    }),
    create: protectedProcedure.input(z.object({ name })).mutation(async ({ ctx, input }) => ctx.db.transaction(async tx => {
        const db = tx as unknown as DB;
        // Serialize creation and acceptance for this user, including their first membership.
        await tx.select().from(users).where(eq(users.id, ctx.userId)).for('update');
        if (await getMembership(db, ctx.userId)) return fail("You're already in a family");
        const [household] = await tx.insert(households).values({ name: input.name, ownerUserId: ctx.userId }).returning();
        const [membership] = await tx.insert(members).values({ householdId: household.id, userId: ctx.userId, role: 'owner', isGuardian: true }).returning();
        return { household, membership };
    })),
    update: protectedProcedure.input(z.object({ name: name.optional(), childrenCanSeeSharedWallets: z.boolean().optional() })).mutation(async ({ ctx, input }) => {
        const m = await membership(ctx.db, ctx.userId, true);
        const [household] = await ctx.db.update(households).set({ ...input, updatedAt: new Date() }).where(eq(households.id, m.householdId)).returning();
        return household;
    }),
    invite: protectedProcedure.input(z.object({ email: z.string().trim().toLowerCase().email(), role: z.enum(['adult', 'child']), isGuardian: z.boolean() })).mutation(async ({ ctx, input }) => ctx.db.transaction(async tx => {
        const db = tx as unknown as DB;
        const m = await membership(db, ctx.userId, true);
        await tx.select().from(households).where(eq(households.id, m.householdId)).for('update');
        if (input.role === 'child' && input.isGuardian) return fail("Children can't be guardians");
        const existing = await tx.select({ id: members.id }).from(members).innerJoin(users, eq(users.id, members.userId)).where(and(eq(members.householdId, m.householdId), eq(members.status, 'active'), sql`lower(trim(${users.email})) = ${input.email}`));
        if (existing.length) return fail('This email is already a family member');
        const now = new Date();
        // Resending replaces any pending invite for this email; old links stop working.
        await tx.update(invites).set({ revokedAt: now }).where(and(pending(m.householdId, now), eq(invites.emailNormalized, input.email)));
        const invitations = await tx.query.householdInvitations.findMany({ where: pending(m.householdId, now) });
        if (await activeCount(db, m.householdId) + invitations.length >= MAX_HOUSEHOLD_MEMBERS) return fail('This family is full');
        const token = randomBytes(32).toString('base64url');
        const expiresAt = new Date(now.getTime() + 7 * 86400000);
        const [i] = await tx.insert(invites).values({ householdId: m.householdId, emailNormalized: input.email, role: input.role, isGuardian: input.isGuardian, invitedByUserId: ctx.userId, tokenHash: hash(token), expiresAt }).returning();
        return { invitationId: i.id, token, expiresAt };
    })),
    revokeInvitation: protectedProcedure.input(z.object({ invitationId: z.string().uuid() })).mutation(async ({ ctx, input }) => {
        const m = await membership(ctx.db, ctx.userId, true);
        const [i] = await ctx.db.update(invites).set({ revokedAt: new Date() }).where(and(eq(invites.id, input.invitationId), eq(invites.householdId, m.householdId), isNull(invites.acceptedAt))).returning();
        if (!i) return fail('Invite not found', 'NOT_FOUND');
        return { success: true };
    }),
    acceptInvitation: protectedProcedure.input(tokenInput).mutation(async ({ ctx, input }) => ctx.db.transaction(async tx => {
        const db = tx as unknown as DB;
        await tx.select().from(users).where(eq(users.id, ctx.userId)).for('update');
        const initial = await tx.query.householdInvitations.findFirst({ where: eq(invites.tokenHash, hash(input.token)) });
        if (!initial) return fail(reasonMessage.not_found, 'NOT_FOUND');
        await tx.select().from(households).where(eq(households.id, initial.householdId)).for('update');
        const s = await invitationState(db, ctx.userId, input.token);
        if (s.i?.acceptedByUserId === ctx.userId && s.i.acceptedAt && s.m?.householdId === s.i.householdId) { const { household, ...member } = s.m; return member; }
        if (s.reason) return fail(s.reason === 'wrong_email' && !s.email ? reasonMessage.unverified_email : reasonMessage[s.reason as keyof typeof reasonMessage], s.reason === 'not_found' ? 'NOT_FOUND' : 'BAD_REQUEST');
        const i = s.i!;
        const [member] = await tx.insert(members).values({ householdId: i.householdId, userId: ctx.userId, role: i.role, isGuardian: i.role === 'adult' && i.isGuardian }).onConflictDoUpdate({ target: [members.householdId, members.userId], set: { status: 'active', role: i.role, isGuardian: i.role === 'adult' && i.isGuardian, showBalanceToChildren: false, joinedAt: new Date(), leftAt: null } }).returning();
        await tx.update(invites).set({ acceptedAt: new Date(), acceptedByUserId: ctx.userId }).where(eq(invites.id, i.id));
        return member;
    })),
    updateMember: protectedProcedure.input(z.object({ memberId: z.string().uuid(), role: z.enum(['adult', 'child']).optional(), isGuardian: z.boolean().optional() })).mutation(async ({ ctx, input }) => {
        const m = await membership(ctx.db, ctx.userId, true);
        const target = await ctx.db.query.householdMembers.findFirst({ where: and(eq(members.id, input.memberId), eq(members.householdId, m.householdId), eq(members.status, 'active')) });
        if (!target) return fail('Member not found', 'NOT_FOUND');
        if (target.role === 'owner') return fail("The owner's role cannot be changed");
        const role = input.role ?? target.role;
        const isGuardian = input.isGuardian ?? (role === 'child' ? false : target.isGuardian);
        if (role === 'child' && isGuardian) return fail("Children can't be guardians");
        const [member] = await ctx.db.update(members).set({ role, isGuardian, ...(role === 'child' ? { showBalanceToChildren: false } : {}) }).where(eq(members.id, target.id)).returning();
        return member;
    }),
    removeMember: protectedProcedure.input(z.object({ memberId: z.string().uuid() })).mutation(async ({ ctx, input }) => ctx.db.transaction(async tx => {
        const m = await membership(tx as unknown as DB, ctx.userId, true);
        if (input.memberId === m.id) return fail('Use leave to remove yourself');
        const now = new Date();
        const [member] = await tx.update(members).set({ status: 'removed', leftAt: now }).where(and(eq(members.id, input.memberId), eq(members.householdId, m.householdId), eq(members.status, 'active'), ne(members.role, 'owner'))).returning();
        if (!member) return fail('Member not found', 'NOT_FOUND');
        await tx.update(familyWallets).set({ archivedAt: now }).where(and(eq(familyWallets.householdId, m.householdId), eq(familyWallets.childMemberId, member.id), eq(familyWallets.kind, 'child')));
        return { success: true };
    })),
    leave: protectedProcedure.mutation(async ({ ctx }) => ctx.db.transaction(async tx => {
        const db = tx as unknown as DB;
        const m = await membership(db, ctx.userId);
        await tx.select().from(households).where(eq(households.id, m.householdId)).for('update');
        if (m.role === 'owner') {
            if (await activeCount(db, m.householdId) > 1) return fail('Remove other members before leaving');
            await tx.delete(households).where(eq(households.id, m.householdId));
        } else {
            const now = new Date();
            await tx.update(members).set({ status: 'left', leftAt: now }).where(eq(members.id, m.id));
            await tx.update(familyWallets).set({ archivedAt: now }).where(and(eq(familyWallets.householdId, m.householdId), eq(familyWallets.childMemberId, m.id), eq(familyWallets.kind, 'child')));
        }
        return { success: true };
    })),
    setShowBalanceToChildren: protectedProcedure.input(z.object({ value: z.boolean() })).mutation(async ({ ctx, input }) => {
        const m = await membership(ctx.db, ctx.userId);
        if (m.role === 'child') return fail('Only adults can share their balance', 'FORBIDDEN');
        const [member] = await ctx.db.update(members).set({ showBalanceToChildren: input.value }).where(eq(members.id, m.id)).returning();
        return member;
    }),
});
