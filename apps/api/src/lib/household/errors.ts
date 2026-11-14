// Structured payload for a child's expense that exceeds a family limit.
// Pass an instance as `cause` of a TRPCError; the tRPC errorFormatter copies
// `payload` to `error.data.limitViolation` so the UI can show remaining/periodEnd.
export type LimitViolationPayload = {
    code: 'LIMIT_EXCEEDED';
    limitId: string;
    categoryId: string | null;
    categoryName: string | null;
    period: 'weekly' | 'monthly';
    remaining: string;
    periodEnd: string;
};

export class FamilyLimitError extends Error {
    constructor(public readonly payload: LimitViolationPayload) {
        super('This is more than you have left');
        this.name = 'FamilyLimitError';
    }
}
