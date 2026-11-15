import { describe, expect, test } from 'bun:test';
import { buildFamilyOverview } from '../src/lib/household/overview-math';

type Input = Parameters<typeof buildFamilyOverview>[0];
type Row = Input['transactions'][number];

const members = [{ id: 'parent', name: 'Parent' }, { id: 'child', name: 'Child' }];
const expense = (id: string, overrides: Partial<Row> = {}): Row => ({
    id,
    date: '2024-02-15',
    kind: 'expense',
    amount: '1.00',
    currencyCode: 'USD',
    memberId: 'parent',
    categoryId: 'food',
    categoryName: 'Food',
    ...overrides,
});

describe('family overview calculations', () => {
    test('keeps currencies separate and reconciles member, category and daily expense totals', () => {
        const overview = buildFamilyOverview({
            month: '2024-02',
            members,
            budgets: [{ currencyCode: 'USD', amount: '10.00' }, { currencyCode: 'KZT', amount: '5000' }],
            transactions: [
                expense('lunch', { amount: '2.10' }),
                expense('snack', { amount: '0.20', memberId: 'child' }),
                expense('fare', { amount: '1000', currencyCode: 'KZT', categoryId: 'transport', categoryName: 'Transport' }),
                expense('salary', { kind: 'income', amount: '20.00' }),
            ],
        });

        expect(overview.currencies).toEqual([
            { currencyCode: 'KZT', income: '0.00', expense: '1000.00', budget: '5000.00', remaining: '4000.00' },
            { currencyCode: 'USD', income: '20.00', expense: '2.30', budget: '10.00', remaining: '7.70' },
        ]);
        expect(overview.members).toEqual([
            { memberId: 'child', name: 'Child', status: 'active', totals: [{ currencyCode: 'USD', amount: '0.20' }] },
            { memberId: 'parent', name: 'Parent', status: 'active', totals: [{ currencyCode: 'KZT', amount: '1000.00' }, { currencyCode: 'USD', amount: '2.10' }] },
        ]);
        expect(overview.categories).toEqual([
            { categoryId: 'food', categoryName: 'Food', totals: [{ currencyCode: 'USD', amount: '2.30' }] },
            { categoryId: 'transport', categoryName: 'Transport', totals: [{ currencyCode: 'KZT', amount: '1000.00' }] },
        ]);
        expect(overview.dailyExpenses[14]).toEqual({
            date: '2024-02-15',
            totals: [{ currencyCode: 'KZT', amount: '1000.00' }, { currencyCode: 'USD', amount: '2.30' }],
        });
    });

    test('internal transfers do not inflate income, spending or create statistical currency buckets', () => {
        const overview = buildFamilyOverview({
            month: '2024-02',
            members,
            transactions: [
                expense('purchase', { amount: '3.00' }),
                expense('move-out', { kind: 'transfer', amount: '100', currencyCode: 'EUR' }),
                expense('move-in', { kind: 'transfer', amount: '100', currencyCode: 'EUR', memberId: 'child' }),
            ],
        });
        expect(overview.currencies).toEqual([{ currencyCode: 'USD', income: '0.00', expense: '3.00', budget: null, remaining: null }]);
        expect(overview.members.find(member => member.memberId === 'child')?.totals).toEqual([]);
        expect(overview.categories).toHaveLength(1);
        expect(overview.dailyExpenses[14].totals).toEqual([{ currencyCode: 'USD', amount: '3.00' }]);
    });

    test('includes both calendar boundaries, ignores adjacent months and zero-fills leap February', () => {
        const overview = buildFamilyOverview({
            month: '2024-02',
            members,
            transactions: [
                expense('before', { date: '2024-01-31', amount: '100' }),
                expense('first', { date: '2024-02-01', amount: '0.10' }),
                expense('last', { date: '2024-02-29', amount: '0.20' }),
                expense('after', { date: '2024-03-01', amount: '100' }),
            ],
        });
        expect(overview.periodStart).toBe('2024-02-01');
        expect(overview.periodEnd).toBe('2024-02-29');
        expect(overview.currencies[0].expense).toBe('0.30');
        expect(overview.dailyExpenses).toHaveLength(29);
        expect(overview.dailyExpenses[0].totals[0].amount).toBe('0.10');
        expect(overview.dailyExpenses[1].totals[0].amount).toBe('0.00');
        expect(overview.dailyExpenses[28].totals[0].amount).toBe('0.20');
    });

    test('handles year boundaries and budget-only currencies without inventing expenses', () => {
        const overview = buildFamilyOverview({
            month: '2025-01',
            members,
            budgets: [{ currencyCode: 'EUR', amount: '25' }],
            transactions: [expense('previous-year', { date: '2024-12-31' })],
        });
        expect(overview.currencies).toEqual([{ currencyCode: 'EUR', income: '0.00', expense: '0.00', budget: '25.00', remaining: '25.00' }]);
        expect(overview.dailyExpenses).toHaveLength(31);
        expect(overview.dailyExpenses.every(day => day.totals[0].amount === '0.00')).toBe(true);
        expect(overview.members.every(member => member.totals.length === 0)).toBe(true);
    });

    test('distinguishes no budget, a zero budget and an exceeded budget', () => {
        const overview = buildFamilyOverview({
            month: '2024-02', members,
            budgets: [{ currencyCode: 'USD', amount: '1.00' }, { currencyCode: 'EUR', amount: '0' }],
            transactions: [expense('usd', { amount: '1.01' }), expense('eur', { currencyCode: 'EUR' }), expense('kzt', { currencyCode: 'KZT' })],
        });
        expect(overview.currencies).toMatchObject([
            { currencyCode: 'EUR', budget: '0.00', remaining: '-1.00' },
            { currencyCode: 'KZT', budget: null, remaining: null },
            { currencyCode: 'USD', budget: '1.00', remaining: '-0.01' },
        ]);
    });

    test('retains former and unassigned spending, including uncategorized expenses', () => {
        const overview = buildFamilyOverview({
            month: '2024-02', members,
            transactions: [
                expense('former', { memberId: 'left-family', amount: '2', categoryId: null, categoryName: null }),
                expense('unassigned', { memberId: null, amount: '3', categoryId: null, categoryName: null }),
            ],
        });
        expect(overview.members.filter(member => member.status !== 'active')).toEqual([
            { memberId: 'left-family', name: 'Former member', status: 'former', totals: [{ currencyCode: 'USD', amount: '2.00' }] },
            { memberId: null, name: 'Unassigned', status: 'unassigned', totals: [{ currencyCode: 'USD', amount: '3.00' }] },
        ]);
        expect(overview.categories).toEqual([{ categoryId: null, categoryName: 'Uncategorized', totals: [{ currencyCode: 'USD', amount: '5.00' }] }]);
        expect(overview.currencies[0].expense).toBe('5.00');
    });

    test('output does not depend on source transaction order and never mutates input', () => {
        const transactions = [expense('a', { categoryName: 'Meals', amount: '0.10' }), expense('b', { categoryName: 'Food', amount: '0.20' })];
        const input = { month: '2024-02', members, transactions };
        const original = JSON.stringify(input);
        expect(buildFamilyOverview(input)).toEqual(buildFamilyOverview({ ...input, transactions: [...transactions].reverse(), members: [...members].reverse() }));
        expect(JSON.stringify(input)).toBe(original);
        expect(buildFamilyOverview(input).currencies[0].expense).toBe('0.30');
    });

    test('rejects invalid months, dates, money, currencies and duplicate identities', () => {
        const input: Input = { month: '2024-02', members, transactions: [] };
        for (const month of ['2024-2', '2024-13', 'not-a-month']) {
            expect(() => buildFamilyOverview({ ...input, month })).toThrow();
        }
        for (const row of [
            expense('invalid', { date: '2024-02-30' }),
            expense('invalid', { amount: '0' }),
            expense('invalid', { amount: '-1' }),
            expense('invalid', { amount: '0.001' }),
            expense('invalid', { currencyCode: 'usd' }),
        ]) {
            expect(() => buildFamilyOverview({ ...input, transactions: [row] })).toThrow();
        }
        expect(() => buildFamilyOverview({ ...input, transactions: [expense('same'), expense('same')] })).toThrow('duplicate transaction');
        expect(() => buildFamilyOverview({ ...input, members: [members[0], members[0]] })).toThrow('duplicate member');
        expect(() => buildFamilyOverview({ ...input, budgets: [{ currencyCode: 'USD', amount: '1' }, { currencyCode: 'USD', amount: '2' }] })).toThrow('duplicate budget');
        expect(() => buildFamilyOverview({ ...input, budgets: [{ currencyCode: 'USD', amount: '-1' }] })).toThrow('budget');
    });

    test('rejects an unsafe aggregate instead of returning rounded money', () => {
        expect(() => buildFamilyOverview({
            month: '2024-02', members,
            transactions: [expense('a', { amount: '90071992547409.90' }), expense('b', { amount: '0.02' })],
        })).toThrow('Money total out of range');
    });
});
