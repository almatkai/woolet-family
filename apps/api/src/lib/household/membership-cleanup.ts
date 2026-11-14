import { TRPCError } from '@trpc/server';
import { and, eq, ne } from 'drizzle-orm';
import { familyWallets, householdMembers, households, users } from '../../db/schema';
import type { db } from '../../db';

type Transaction = Parameters<Parameters<typeof db.transaction>[0]>[0];

/** Must run in the same transaction as the user's data/account deletion. */
export async function prepareFamilyForUserDeletion(tx: Transaction, userId: string, _options: { deleteAccount?: boolean } = {}) {
    // Serialize with family creation/acceptance, then with invitations/leave.
    await tx.select().from(users).where(eq(users.id, userId)).for('update');
    const owned = await tx.select().from(households).where(eq(households.ownerUserId, userId)).for('update');
    for (const household of owned) {
        const others = await tx.select({ id: householdMembers.id }).from(householdMembers).where(and(
            eq(householdMembers.householdId, household.id), eq(householdMembers.status, 'active'), ne(householdMembers.userId, userId),
        )).limit(1);
        if (others.length) throw new TRPCError({ code: 'BAD_REQUEST', message: 'Remove family members or leave your family before deleting your data' });
        await tx.delete(households).where(eq(households.id, household.id));
    }
    const memberships = await tx.select().from(householdMembers).where(eq(householdMembers.userId, userId));
    for (const member of memberships) {
        await tx.select().from(households).where(eq(households.id, member.householdId)).for('update');
        const now = new Date();
        if (member.status === 'active') {
            await tx.update(householdMembers).set({ status: 'left', leftAt: now }).where(eq(householdMembers.id, member.id));
            await tx.update(familyWallets).set({ archivedAt: now }).where(and(eq(familyWallets.childMemberId, member.id), eq(familyWallets.kind, 'child')));
        }
        // On account deletion the membership row cascades away with the user; the
        // already-archived child wallets keep their history (childMemberId -> null).
    }
    return { householdsDeleted: owned.length, membershipsProcessed: memberships.length };
}
