export type Period = 'weekly' | 'monthly';
export type BudgetLimit = { id: string; period: Period; amount: string; categoryId: string | null };
export function toCents(amount: string): number {
    if (!/^-?\d+(\.\d{1,2})?$/.test(amount)) throw new Error('Invalid money amount');
    const negative = amount.startsWith('-');
    const [whole, fraction = ''] = amount.replace(/^-/, '').split('.');
    const cents = Number(whole) * 100 + Number(fraction.padEnd(2, '0'));
    if (!Number.isSafeInteger(cents)) throw new Error('Money amount out of range');
    return negative ? -cents : cents;
}
export function fromCents(cents: number): string {
    if (!Number.isSafeInteger(cents)) throw new Error('Invalid cents');
    return `${cents < 0 ? '-' : ''}${Math.floor(Math.abs(cents) / 100)}.${String(Math.abs(cents) % 100).padStart(2, '0')}`;
}
export function periodBounds(period: Period, today: string): { start: string; end: string } {
    const date = new Date(`${today}T00:00:00.000Z`);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(today) || !Number.isFinite(date.getTime()) || date.toISOString().slice(0, 10) !== today) throw new Error('Invalid date');
    const start = new Date(date), end = new Date(date);
    if (period === 'weekly') {
        start.setUTCDate(date.getUTCDate() - (date.getUTCDay() + 6) % 7);
        end.setTime(start.getTime()); end.setUTCDate(start.getUTCDate() + 6);
    } else {
        start.setUTCDate(1); end.setUTCMonth(end.getUTCMonth() + 1, 0);
    }
    return { start: start.toISOString().slice(0, 10), end: end.toISOString().slice(0, 10) };
}
// spentByLimit includes expense + transfer_out within each limit's period.
// Category limits include only expenses in that category; transfers count only toward totals.
export function evaluateLimits(limits: readonly BudgetLimit[], spentByLimit: Readonly<Record<string, string>>, expense: { amount: string; categoryId: string | null }) {
    return limits.filter(l => l.categoryId === null || l.categoryId === expense.categoryId).flatMap(l => {
        const spent = spentByLimit[l.id] ?? '0';
        const remaining = toCents(l.amount) - toCents(spent);
        return toCents(expense.amount) > remaining ? [{ limitId: l.id, period: l.period, amount: l.amount, spent, remaining: fromCents(remaining) }] : [];
    });
}
