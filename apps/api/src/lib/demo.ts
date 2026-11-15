export const DEMO_AI_QUESTION_LIMIT = 50;
export const DEMO_EMAIL_SUFFIX = '@demo.woolet.cc';
export const DEMO_ROLES = ['owner', 'partner', 'child'] as const;
export type DemoRole = typeof DEMO_ROLES[number];

/** Only server configuration can grant demo identity. User preferences cannot. */
export function getDemoActors(): Record<DemoRole, string> | null {
    const actors = {
        owner: process.env.DEMO_OWNER_USER_ID?.trim() || '',
        partner: process.env.DEMO_PARTNER_USER_ID?.trim() || '',
        child: process.env.DEMO_CHILD_USER_ID?.trim() || '',
    };
    const ids = Object.values(actors);
    return ids.every(id => /^user_[a-zA-Z0-9]+$/.test(id)) && new Set(ids).size === ids.length ? actors : null;
}

export function getDemoRole(userId: string | null | undefined): DemoRole | null {
    if (!userId) return null;
    const actors = getDemoActors();
    return actors ? DEMO_ROLES.find(role => actors[role] === userId) ?? null : null;
}

export function isDemoEnabled(): boolean {
    return process.env.DEMO_ENABLED === 'true' && Boolean(getDemoActors()) && Boolean(process.env.CLERK_SECRET_KEY);
}

export const DEMO_RESTRICTED_MESSAGE = 'This action is unavailable in the shared demo. You can explore the sample family, add transactions, and try Woo.';

const allowedDemoMutations = new Set([
    'bank.create', 'bank.update', 'bank.delete',
    'account.create', 'account.update', 'account.delete', 'account.addCurrency', 'account.adjustBalance',
    'category.create', 'category.update', 'category.delete',
    'transaction.create', 'transaction.update', 'transaction.delete',
    'dashboard.saveLayout',
    'household.addTransaction', 'household.transfer', 'household.deleteTransaction',
    'household.createWallet', 'household.updateWallet', 'household.archiveWallet',
    'household.setLimit', 'household.deleteLimit', 'household.setShowBalanceToChildren', 'household.update',
    'household.updatePurchaseAgreement', 'household.respondToPurchaseProposal',
    'ai.chat', 'ai.executeCapability', 'ai.deleteSession', 'ai.regenerateDigest',
]);

/** Shared public identities may edit their sample money, never identity or other users. */
export function isDemoProcedureAllowed(path: string, type: 'query' | 'mutation' | 'subscription'): boolean {
    if (path.startsWith('admin.') || path.startsWith('ai.admin') || path.startsWith('pushSubscription.')) return false;
    if (['user.searchByUsername', 'household.previewInvitation', 'household.invitations'].includes(path)) return false;
    if (type !== 'mutation') return true;
    return allowedDemoMutations.has(path);
}
