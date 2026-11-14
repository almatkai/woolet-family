import { expect, test } from 'bun:test';
import { canViewWallet, canWriteWallet, canManageChildWallet, assertWalletAccess, canManageMembers, canEditHouseholdSettings, type Membership, type WalletRef } from '../src/lib/household/policy';
for (const role of ['owner', 'adult', 'guardian', 'child'] as const) {
    const m: Membership = { id: 'me', householdId: 'home', userId: 'u', role: role === 'guardian' ? 'adult' : role, isGuardian: role === 'guardian', showBalanceToChildren: false };
    test(`${role} owner permissions`, () => {
        expect(canManageMembers(m)).toBe(role === 'owner');
        expect(canEditHouseholdSettings(m)).toBe(role === 'owner');
    });
    for (const kind of ['shared', 'own', 'other'] as const) for (const archived of [false, true]) for (const foreign of [false, true]) {
        const w: WalletRef = { id: 'w', householdId: foreign ? 'foreign' : 'home', kind: kind === 'shared' ? 'shared' : 'child', childMemberId: kind === 'own' ? 'me' : 'other', archivedAt: archived ? new Date() : null };
        for (const action of ['view', 'income', 'expense', 'transfer', 'manage'] as const) test(`${role}/${kind}/${archived}/${foreign}/${action}`, () => {
            const guardian = role === 'owner' || role === 'guardian';
            const view = !foreign && (kind === 'shared' ? role !== 'child' : guardian || (role === 'child' && kind === 'own'));
            const expected = action === 'view' ? view : action === 'manage' ? !foreign && !archived && kind !== 'shared' && guardian : view && !archived && (role !== 'child' || action === 'expense');
            expect(action === 'view' ? canViewWallet(m, w) : action === 'manage' ? canManageChildWallet(m, w) : canWriteWallet(m, w, action)).toBe(expected);
            if (expected) expect(() => assertWalletAccess(m, w, action)).not.toThrow();
            else { try { assertWalletAccess(m, w, action); throw new Error('allowed'); } catch (e) { expect((e as {code: string}).code).toBe(!view ? 'NOT_FOUND' : 'FORBIDDEN'); } }
        });
    }
}
