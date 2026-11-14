import { fromCents, periodBounds, toCents, type BudgetLimit } from './limits';
import type { LimitViolationPayload } from './errors';

type LedgerType = 'income' | 'expense' | 'transfer_in' | 'transfer_out';
export function applyDelta(balance: string, amount: string, type: LedgerType, reverse = false): string {
    const direction = type === 'income' || type === 'transfer_in' ? 1 : -1;
    return fromCents(toCents(balance) + direction * (reverse ? -1 : 1) * toCents(amount));
}
export function violationPayload(limit: BudgetLimit, remaining: string, categoryName: string | null, today: string): LimitViolationPayload {
    return { code: 'LIMIT_EXCEEDED', limitId: limit.id, categoryId: limit.categoryId, categoryName, period: limit.period, remaining, periodEnd: periodBounds(limit.period, today).end };
}
