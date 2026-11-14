import { expect, test } from 'bun:test';
import { periodBounds, toCents, fromCents, evaluateLimits, type Period } from '../src/lib/household/limits';
for (const [period, today, start, end] of [
    ['weekly', '2026-11-15', '2026-11-09', '2026-11-15'],
    ['weekly', '2026-11-16', '2026-11-16', '2026-11-22'],
    ['weekly', '2027-01-01', '2026-12-28', '2027-01-03'],
    ['monthly', '2028-02-29', '2028-02-01', '2028-02-29'],
    ['monthly', '2027-02-28', '2027-02-01', '2027-02-28'],
    ['monthly', '2026-12-31', '2026-12-01', '2026-12-31'],
    ['monthly', '2027-01-31', '2027-01-01', '2027-01-31'],
] as const) test(`${period} ${today}`, () => expect(periodBounds(period as Period, today)).toEqual({ start, end }));
test('integer cents and combined limits', () => {
    expect(fromCents(toCents('0.1') + toCents('0.2'))).toBe('0.30');
    const limits = [{ id: 'total', period: 'weekly' as const, amount: '1.00', categoryId: null }, { id: 'cat', period: 'monthly' as const, amount: '0.30', categoryId: 'food' }];
    expect(evaluateLimits(limits, { total: '0.80', cat: '0.10' }, { amount: '0.20', categoryId: 'food' })).toEqual([]);
    expect(evaluateLimits(limits, { total: '0.80', cat: '0.10' }, { amount: '0.21', categoryId: 'food' }).map(v => v.limitId)).toEqual(['total', 'cat']);
    expect(evaluateLimits(limits, {}, { amount: '0.40', categoryId: 'other' })).toEqual([]);
    expect(evaluateLimits(limits, {}, { amount: '0.40', categoryId: 'food' })[0].remaining).toBe('0.30');
});
