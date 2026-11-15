import { describe, expect, test } from 'bun:test';
import { demoDate, demoTransactions } from '../src/lib/demo/seed';
import { householdDisplayName } from '../src/lib/household/display-name';
import { DEFAULT_CATEGORIES } from '../src/db/schema/categories';
import { toCents } from '../src/lib/household/limits';

describe('Martinez demo data integrity', () => {
    test('every row uses a known category and a valid positive cent amount', () => {
        const categories = new Set(DEFAULT_CATEGORIES.map(category => category.name));
        for (const row of demoTransactions) {
            expect(categories.has(row.category)).toBe(true);
            expect(toCents(row.amount)).toBeGreaterThan(0);
        }
    });
    test('90 days of salaries and spending remain solvent from the declared opening balances', () => {
        for (const [actor, opening] of [['owner', 750000], ['partner', 420000], ['child', 50000]] as const) {
            let balance = opening;
            const rows = demoTransactions.filter(row => row.actor === actor).sort((a, b) => b.daysAgo - a.daysAgo);
            for (const row of rows) {
                balance += toCents(row.amount) * (row.type === 'income' ? 1 : -1);
                expect(balance).toBeGreaterThanOrEqual(0);
            }
            expect(rows.some(row => row.daysAgo <= 14)).toBe(true);
        }
        expect(demoTransactions.filter(row => row.actor === 'owner' && row.category === 'Salary')).toHaveLength(6);
        expect(demoTransactions.filter(row => row.actor === 'partner' && row.category === 'Salary')).toHaveLength(6);
    });
    test('relative seed dates cross year and leap-day boundaries without timezone shifts', () => {
        expect(demoDate(1, new Date('2026-01-01T00:01:00Z'))).toBe('2025-12-31');
        expect(demoDate(1, new Date('2024-03-01T23:59:00Z'))).toBe('2024-02-29');
    });
});

test('family display names never expose a raw auth ID as the fallback', () => {
    expect(householdDisplayName('Alex Martinez', 'user_123@placeholder.local')).toBe('Alex Martinez');
    expect(householdDisplayName(null, 'user_3M7xyz@placeholder.local')).toBe('Family member');
    expect(householdDisplayName('user_3M7xyz', 'jordan@example.com')).toBe('jordan');
});
