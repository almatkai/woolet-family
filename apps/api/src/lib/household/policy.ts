import { TRPCError } from '@trpc/server';
import { and, eq } from 'drizzle-orm';
import type { db as database } from '../../db';
import { householdMembers, households } from '../../db/schema/households';

export type Membership = Pick<typeof householdMembers.$inferSelect, 'id' | 'householdId' | 'userId' | 'role' | 'isGuardian' | 'showBalanceToChildren' | 'status'>;
export type WalletRef = { id: string; householdId: string; kind: 'shared' | 'child'; childMemberId: string | null; archivedAt: Date | null };
export async function getMembership(db: Pick<typeof database, 'select'>, userId: string) {
    const [row] = await db.select({ membership: householdMembers, household: households }).from(householdMembers)
        .innerJoin(households, eq(households.id, householdMembers.householdId))
        .where(and(eq(householdMembers.userId, userId), eq(householdMembers.status, 'active'))).limit(1);
    return row ? { ...row.membership, household: row.household } : null;
}
export const canManageMembers = (m: Membership) => m.role === 'owner';
export const canEditHouseholdSettings = canManageMembers;
const guardian = (m: Membership) => m.role === 'owner' || (m.role === 'adult' && m.isGuardian);
export function canViewWallet(m: Membership, w: WalletRef): boolean {
    return m.householdId === w.householdId && (w.kind === 'shared' ? m.role !== 'child' : guardian(m) || (m.role === 'child' && w.childMemberId === m.id));
}
export function canWriteWallet(m: Membership, w: WalletRef, type: 'income' | 'expense' | 'transfer'): boolean {
    return !w.archivedAt && canViewWallet(m, w) && (m.role !== 'child' || type === 'expense');
}
export function canManageChildWallet(m: Membership, w: WalletRef): boolean {
    return m.householdId === w.householdId && w.kind === 'child' && !w.archivedAt && guardian(m);
}
export function assertWalletAccess(m: Membership, w: WalletRef, action: 'view' | 'income' | 'expense' | 'transfer' | 'manage'): void {
    if (!canViewWallet(m, w)) throw new TRPCError({ code: 'NOT_FOUND' });
    const allowed = action === 'view' ? canViewWallet(m, w) : action === 'manage' ? canManageChildWallet(m, w) : canWriteWallet(m, w, action);
    if (!allowed) throw new TRPCError({ code: 'FORBIDDEN' });
}

export function canViewMemberFinances(viewer: Membership, target: Membership): boolean {
    if (viewer.householdId !== target.householdId || viewer.status !== 'active' || target.status !== 'active') return false;
    if (viewer.id === target.id) return true;
    if (viewer.role === 'child') return false;
    return target.role !== 'child' || guardian(viewer);
}
export const canEditFamilyBudget = (m: Membership): boolean => guardian(m);
