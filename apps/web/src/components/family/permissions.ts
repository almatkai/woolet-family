type Role = 'owner' | 'adult' | 'child';
export function familyPermissions(me: {
    role: Role;
    isGuardian: boolean;
    canManageMembers: boolean;
    canEditSettings: boolean;
}) {
    return {
        isOwner: me.role === 'owner',
        isChild: me.role === 'child',
        canManageMembers: me.canManageMembers,
        canEditSettings: me.canEditSettings,
        canManageWallets:
            me.role === 'owner' || (me.role === 'adult' && me.isGuardian),
    };
}

export function isFull(family: {
    activeMembers: number;
    pendingInvites: number;
    maxMembers: number;
}) {
    return family.activeMembers + family.pendingInvites >= family.maxMembers;
}

export function canEditWallet(wallet: { canManage: boolean }) {
    return wallet.canManage;
}

export function isChildActor(mode: string, wallet?: { canManage: boolean }) {
    return mode === 'child' && !wallet?.canManage;
}

export function canUseFamilyView(me: { role: Role } | null | undefined) {
    return !!me && me.role !== 'child';
}
export function canEditFamilyBudget(me: { role: Role; isGuardian: boolean }) {
    return me.role === 'owner' || me.isGuardian;
}
export function canOpenMember(
    _viewerMe: { role: Role },
    member: { canOpen: boolean },
) {
    return member.canOpen;
}
export function isMine(item: { isMe: boolean }) {
    return item.isMe;
}
export function visibleFamilyMember(
    me: { role: Role; isGuardian: boolean },
    member: { role: Role },
) {
    return member.role !== 'child' || canEditFamilyBudget(me);
}

export function orderFamilyMembers<
    T extends { isMe: boolean; role: Role; name: string },
>(me: { role: Role; isGuardian: boolean }, members: T[]) {
    return members
        .filter((member) => visibleFamilyMember(me, member))
        .sort(
            (a, b) =>
                Number(b.isMe) - Number(a.isMe) ||
                Number(a.role === 'child') - Number(b.role === 'child') ||
                a.name.localeCompare(b.name),
        );
}

export function canShowChildWallet(
    me: { role: Role; isGuardian: boolean },
    member: { role: Role },
) {
    return member.role === 'child' && canEditFamilyBudget(me);
}

export function isChildMember(member: { role: Role }) {
    return member.role === 'child';
}
