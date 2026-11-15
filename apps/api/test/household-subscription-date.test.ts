import { expect, test } from 'bun:test';
import { nextSubscriptionDate } from '../src/lib/household/subscription-date';
const sub = { startDate: '2024-01-31', endDate: null, frequency: 'monthly', billingDay: 31 };
test('monthly schedule clamps day and advances across year boundary', () => {
    expect(nextSubscriptionDate(sub, '2026-02-01')).toBe('2026-02-28');
    expect(nextSubscriptionDate({ ...sub, billingDay: 15 }, '2026-12-16')).toBe('2027-01-15');
});
test('daily and weekly schedules respect start and end dates', () => {
    expect(nextSubscriptionDate({ ...sub, frequency: 'daily' }, '2023-01-01')).toBe('2024-01-31');
    expect(nextSubscriptionDate({ ...sub, frequency: 'weekly', billingDay: 1 }, '2026-02-03')).toBe('2026-02-09');
    expect(nextSubscriptionDate({ ...sub, endDate: '2026-02-20' }, '2026-02-01')).toBeNull();
});
test('yearly schedule clamps leap days and unknown frequency is explicit', () => {
    expect(nextSubscriptionDate({ ...sub, startDate: '2024-02-29', frequency: 'yearly', billingDay: 29 }, '2026-01-01')).toBe('2026-02-28');
    expect(nextSubscriptionDate({ ...sub, frequency: 'unsupported' }, '2026-02-01')).toBeNull();
});
