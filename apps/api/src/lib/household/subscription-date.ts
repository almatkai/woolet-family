import type { Subscription } from '../../db/schema/subscriptions';

/** Next scheduled date, inclusive of today; paid/unpaid status is not inferred. */
export function nextSubscriptionDate(sub: Pick<Subscription, 'startDate' | 'endDate' | 'frequency' | 'billingDay'>, today = new Date().toISOString().slice(0, 10)): string | null {
    const floor = sub.startDate > today ? sub.startDate : today;
    const date = new Date(`${floor}T00:00:00Z`);
    const start = new Date(`${sub.startDate}T00:00:00Z`);
    const day = sub.billingDay ?? start.getUTCDate();
    const monthlyDate = (year: number, month: number) => {
        const d = new Date(date);
        d.setUTCFullYear(year, month, 1);
        const end = new Date(d); end.setUTCMonth(end.getUTCMonth() + 1, 0);
        d.setUTCDate(Math.min(Math.max(day, 1), end.getUTCDate()));
        return d;
    };
    let due = new Date(date);
    if (sub.frequency === 'weekly') {
        const weekday = (sub.billingDay ?? (start.getUTCDay() || 7)) % 7;
        due.setUTCDate(due.getUTCDate() + (weekday - due.getUTCDay() + 7) % 7);
    } else if (sub.frequency === 'monthly') {
        due = monthlyDate(date.getUTCFullYear(), date.getUTCMonth());
        if (due < date) due = monthlyDate(date.getUTCFullYear(), date.getUTCMonth() + 1);
    } else if (sub.frequency === 'yearly') {
        due = monthlyDate(date.getUTCFullYear(), start.getUTCMonth());
        if (due < date) due = monthlyDate(date.getUTCFullYear() + 1, start.getUTCMonth());
    } else if (sub.frequency !== 'daily') return null;
    const value = due.toISOString().slice(0, 10);
    return sub.endDate && value > sub.endDate ? null : value;
}
