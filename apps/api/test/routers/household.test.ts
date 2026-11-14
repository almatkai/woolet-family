import { afterEach, describe, expect, spyOn, test } from 'bun:test';
import { createHash } from 'node:crypto';
import { PgDialect } from 'drizzle-orm/pg-core';
import { householdRouter } from '../../src/routers/household';
import * as clerkEmail from '../../src/lib/household/clerk-email';
import { familyWallets, householdInvitations, householdMembers, households } from '../../src/db/schema/households';
import { createMockContext } from '../utils';

const householdId = '11111111-1111-4111-8111-111111111111';
const memberId = '22222222-2222-4222-8222-222222222222';
const otherId = '33333333-3333-4333-8333-333333333333';
const inviteId = '44444444-4444-4444-8444-444444444444';
const household = { id: householdId, name: 'Home', ownerUserId: 'user' };
const owner = { id: memberId, householdId, userId: 'user', role: 'owner', isGuardian: true, showBalanceToChildren: false, status: 'active' };
const invitation = { id: inviteId, householdId, emailNormalized: 'alice@example.com', role: 'adult', isGuardian: true, invitedByUserId: 'owner', tokenHash: 'secret-hash', expiresAt: new Date(Date.now() + 86400000), acceptedAt: null, acceptedByUserId: null, revokedAt: null, createdAt: new Date() };
const dialect = new PgDialect();

// A small query builder fake: records writes and SQL predicates while preserving
// the transaction, row-lock, returning and thenable shapes used by Drizzle.
let emailSpy: ReturnType<typeof spyOn> | undefined;
function setup(options: { member?: any; invite?: any; target?: any; count?: number; pending?: any[]; existing?: any[]; rows?: any[]; email?: string | null } = {}) {
    const state = { member: options.member === undefined ? owner : options.member, invite: options.invite === undefined ? invitation : options.invite, target: options.target, count: options.count ?? 1, pending: options.pending ?? [], existing: options.existing ?? [], rows: options.rows ?? [] };
    const writes: { operation: string; table: any; values?: any; where?: any }[] = [];
    const events: string[] = [];
    const db: any = {
        query: {
            householdInvitations: { findFirst: async () => state.invite, findMany: async () => state.pending },
            households: { findFirst: async () => household },
            householdMembers: { findFirst: async () => state.target },
            users: { findFirst: async () => ({ name: 'Owner', email: 'owner@example.com' }) },
        },
        transaction: async (fn: any) => fn(db),
        select: (fields?: any) => ({ from: (table: any) => {
            const joined = fields?.membership ? 'membership' : fields?.member ? 'rows' : fields?.id ? 'existing' : fields?.count ? 'count' : 'lock';
            const value = () => joined === 'membership' ? (state.member ? [{ membership: state.member, household }] : []) : joined === 'rows' ? state.rows : joined === 'existing' ? state.existing : joined === 'count' ? [{ count: state.count }] : [];
            const chain: any = { innerJoin: () => chain, where: () => chain, limit: async () => value(), for: async () => value(), then: (resolve: any, reject: any) => Promise.resolve(value()).then(resolve, reject) };
            return chain;
        } }),
        insert: (table: any) => ({ values: (values: any) => {
            events.push('insert'); writes.push({ operation: 'insert', table, values });
            const result = [{ id: table === households ? householdId : table === householdInvitations ? inviteId : memberId, ...values }];
            const chain: any = { returning: async () => result, onConflictDoUpdate: () => chain };
            return chain;
        } }),
        update: (table: any) => ({ set: (values: any) => ({ where: (where: any) => {
            events.push('update'); writes.push({ operation: 'update', table, values, where });
            const result = [{ ...(state.target ?? owner), ...values }];
            return { returning: async () => result, then: (resolve: any, reject: any) => Promise.resolve(result).then(resolve, reject) };
        } }) }),
        delete: (table: any) => ({ where: async (where: any) => { writes.push({ operation: 'delete', table, where }); } }),
    };
    emailSpy = spyOn(clerkEmail, 'getVerifiedPrimaryEmail').mockResolvedValue(options.email === undefined ? 'alice@example.com' : options.email);
    const caller = householdRouter.createCaller(createMockContext({ userId: 'user', db }));
    return { caller, state, writes, events, emailSpy };
}
afterEach(() => { emailSpy?.mockRestore(); emailSpy = undefined; });
function predicate(where: any) { return dialect.sqlToQuery(where); }
const inviteInput = { email: ' Alice@Example.com ', role: 'adult' as const, isGuardian: true };

describe('household membership and invitations', () => {
    test('create makes the caller an owner and guardian', async () => {
        const { caller, writes } = setup({ member: null });
        await caller.create({ name: ' Home ' });
        expect(writes[0].values).toEqual({ name: 'Home', ownerUserId: 'user' });
        expect(writes[1].values).toEqual({ householdId, userId: 'user', role: 'owner', isGuardian: true });
    });
    test('create rejects existing members', async () => {
        await expect(setup().caller.create({ name: 'Home' })).rejects.toThrow("You're already in a family");
    });
    test('update lets the owner change household settings', async () => {
        const { caller, writes } = setup();
        await caller.update({ name: ' New name ', childrenCanSeeSharedWallets: true });
        expect(writes[0]).toMatchObject({ table: households, values: { name: 'New name', childrenCanSeeSharedWallets: true } });
        expect(predicate(writes[0].where).params).toEqual([householdId]);
    });
    test('invitations omit token hashes', async () => {
        const result = await setup({ pending: [invitation] }).caller.invitations();
        expect(result).toHaveLength(1);
        expect(result[0]).not.toHaveProperty('tokenHash');
    });
    test('revokeInvitation targets an invitation in the owner household', async () => {
        const { caller, writes } = setup();
        expect(await caller.revokeInvitation({ invitationId: inviteId })).toEqual({ success: true });
        expect(writes[0].values.revokedAt).toBeInstanceOf(Date);
        expect(predicate(writes[0].where).params).toEqual([inviteId, householdId]);
    });
    test('invite stores only the token hash and expires after seven days', async () => {
        const { caller, writes, events } = setup(); const start = Date.now();
        const result = await caller.invite(inviteInput);
        const insert = writes.find(w => w.operation === 'insert')!;
        expect(insert.values.emailNormalized).toBe('alice@example.com');
        expect(insert.values.tokenHash).toMatch(/^[0-9a-f]{64}$/);
        expect(insert.values.tokenHash).toBe(createHash('sha256').update(result.token).digest('hex'));
        expect(JSON.stringify(insert.values)).not.toContain(result.token);
        expect(result.expiresAt.getTime()).toBeGreaterThanOrEqual(start + 7 * 86400000);
        expect(result.expiresAt.getTime()).toBeLessThanOrEqual(Date.now() + 7 * 86400000);
        expect(events.indexOf('update')).toBeLessThan(events.indexOf('insert'));
        const revoke = writes.find(w => w.table === householdInvitations && w.operation === 'update')!;
        expect(revoke.values.revokedAt).toBeInstanceOf(Date);
        expect(predicate(revoke.where).params).toContain('alice@example.com');
    });
    test('invite rejects a full family including pending invites', async () => {
        await expect(setup({ count: 4, pending: [{}, {}] }).caller.invite(inviteInput)).rejects.toThrow('This family is full');
    });
    test('invite rejects child guardians', async () => {
        await expect(setup().caller.invite({ ...inviteInput, role: 'child' })).rejects.toThrow("Children can't be guardians");
    });
    test('invite rejects non-owner', async () => {
        await expect(setup({ member: { ...owner, role: 'adult' } }).caller.invite(inviteInput)).rejects.toMatchObject({ code: 'FORBIDDEN' });
    });
    test('invite rejects an email already belonging to an active member', async () => {
        await expect(setup({ existing: [{ id: otherId }] }).caller.invite(inviteInput)).rejects.toThrow('This email is already a family member');
    });
    const token = { token: 'raw-token' };
    const failures: [string, any, string][] = [
        ['expired', { invite: { ...invitation, expiresAt: new Date(0) } }, 'This invite has expired'],
        ['revoked', { invite: { ...invitation, revokedAt: new Date() } }, 'This invite was revoked'],
        ['accepted', { invite: { ...invitation, acceptedAt: new Date(), acceptedByUserId: 'other' } }, 'This invite was already accepted'],
        ['wrong email', { email: 'other@example.com' }, 'This invite is for a different email'],
        ['unverified email', { email: null }, 'Verify your primary email before joining'],
        ['already in another family', { member: owner }, "You're already in a family"],
        ['full', { count: 6 }, 'This family is full'],
    ];
    for (const [label, options, message] of failures) test(`accept rejects ${label}`, async () => {
        await expect(setup({ member: null, ...options }).caller.acceptInvitation(token)).rejects.toThrow(message);
    });
    test('accept inserts invited role and marks the invitation accepted', async () => {
        const { caller, writes } = setup({ member: null, invite: { ...invitation, role: 'child', isGuardian: false } });
        const result = await caller.acceptInvitation(token);
        expect(result).toMatchObject({ householdId, userId: 'user', role: 'child', isGuardian: false });
        const accepted = writes.find(w => w.table === householdInvitations)!;
        expect(accepted.values).toMatchObject({ acceptedByUserId: 'user', acceptedAt: expect.any(Date) });
    });
    test('accept is idempotent for the same user', async () => {
        const { caller, writes } = setup({ invite: { ...invitation, acceptedAt: new Date(), acceptedByUserId: 'user' } });
        expect(await caller.acceptInvitation(token)).toMatchObject(owner);
        expect(writes).toHaveLength(0);
    });
    for (const [reason, options] of [
        ['expired', { invite: { ...invitation, expiresAt: new Date(0) } }],
        ['revoked', { invite: { ...invitation, revokedAt: new Date() } }],
        ['accepted', { invite: { ...invitation, acceptedAt: new Date() } }],
        ['wrong_email', { email: 'other@example.com' }],
        ['already_in_family', { member: owner }],
        ['full', { count: 6 }],
        ['not_found', { invite: null }],
    ] as const) test(`preview reports ${reason} without token hash`, async () => {
        const result = await setup({ member: null, ...options }).caller.previewInvitation(token);
        expect(result).toMatchObject({ canAccept: false, reason });
        expect(result).not.toHaveProperty('tokenHash');
        if (reason === 'wrong_email') expect(result).toMatchObject({ invitedEmail: 'a***@example.com', callerEmail: 'other@example.com' });
        if (reason === 'already_in_family') expect(result).toMatchObject({ currentFamilyName: 'Home' });
    });
    test('preview allows a valid invitation without exposing its hash', async () => {
        const result = await setup({ member: null }).caller.previewInvitation(token);
        expect(result).toMatchObject({ householdName: 'Home', role: 'adult', canAccept: true });
        expect(result).not.toHaveProperty('tokenHash');
    });
    test('updateMember cannot change the owner', async () => {
        await expect(setup({ target: owner }).caller.updateMember({ memberId, role: 'child' })).rejects.toThrow("The owner's role cannot be changed");
    });
    test('updateMember rejects child guardian', async () => {
        await expect(setup({ target: { ...owner, id: otherId, role: 'child' } }).caller.updateMember({ memberId: otherId, isGuardian: true })).rejects.toThrow("Children can't be guardians");
    });
    test('updateMember changing to child clears guardian and balance visibility', async () => {
        const { caller, writes } = setup({ target: { ...owner, id: otherId, role: 'adult', showBalanceToChildren: true } });
        await caller.updateMember({ memberId: otherId, role: 'child' });
        expect(writes[0].values).toEqual({ role: 'child', isGuardian: false, showBalanceToChildren: false });
    });
    test('removeMember rejects removing self', async () => {
        await expect(setup().caller.removeMember({ memberId })).rejects.toThrow('Use leave to remove yourself');
    });
    test('removeMember archives the removed member child wallets', async () => {
        const { caller, writes } = setup({ target: { ...owner, id: otherId, role: 'child' } });
        await caller.removeMember({ memberId: otherId });
        expect(writes[0].values).toMatchObject({ status: 'removed', leftAt: expect.any(Date) });
        expect(writes[1].table).toBe(familyWallets);
        expect(writes[1].values.archivedAt).toBeInstanceOf(Date);
        expect(predicate(writes[1].where).params).toEqual([householdId, otherId, 'child']);
    });
    test('removeMember rejects non-owner', async () => {
        await expect(setup({ member: { ...owner, role: 'adult' } }).caller.removeMember({ memberId: otherId })).rejects.toMatchObject({ code: 'FORBIDDEN' });
    });
    test('owner cannot leave while other members remain', async () => {
        await expect(setup({ count: 2 }).caller.leave()).rejects.toThrow('Remove other members before leaving');
    });
    test('owner alone deletes household on leave', async () => {
        const { caller, writes } = setup(); await caller.leave();
        expect(writes[0]).toMatchObject({ operation: 'delete', table: households });
        expect(predicate(writes[0].where).params).toContain(householdId);
    });
    test('adult leaves and archives their child wallets', async () => {
        const { caller, writes } = setup({ member: { ...owner, role: 'adult' } }); await caller.leave();
        expect(writes[0].values).toMatchObject({ status: 'left', leftAt: expect.any(Date) });
        expect(writes[1]).toMatchObject({ table: familyWallets, values: { archivedAt: expect.any(Date) } });
        expect(predicate(writes[1].where).params).toEqual([householdId, memberId, 'child']);
    });
    test('child cannot share balance', async () => {
        await expect(setup({ member: { ...owner, role: 'child' } }).caller.setShowBalanceToChildren({ value: true })).rejects.toMatchObject({ code: 'FORBIDDEN' });
    });
    test('adult shares only their own balance', async () => {
        const { caller, writes } = setup({ member: { ...owner, role: 'adult' } });
        await caller.setShowBalanceToChildren({ value: true });
        expect(writes[0].values).toEqual({ showBalanceToChildren: true });
        expect(predicate(writes[0].where).params).toEqual([memberId]);
    });
    test('get returns null without membership', async () => {
        expect(await setup({ member: null }).caller.get()).toBeNull();
    });
    test('get hides email from children and reports counts', async () => {
        const { caller } = setup({ member: { ...owner, role: 'child' }, rows: [{ member: owner, name: 'Owner', email: 'owner@example.com' }, { member: { ...owner, id: otherId }, name: 'Child', email: 'child@example.com' }], pending: [{}, {}] });
        const result = await caller.get();
        expect(result).toMatchObject({ activeMembers: 2, pendingInvites: 2, maxMembers: 6, me: { canManageMembers: false, canEditSettings: false } });
        expect(result!.members.every(m => !('email' in m))).toBe(true);
    });
});
