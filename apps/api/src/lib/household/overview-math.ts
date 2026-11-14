import { fromCents, periodBounds, toCents } from './limits';

type CurrencyAmount = { currencyCode: string; amount: string };
type LedgerRow = {
    id: string;
    date: string;
    kind: 'income' | 'expense' | 'transfer';
    amount: string;
    currencyCode: string;
    memberId: string | null;
    categoryId: string | null;
    categoryName: string | null;
};

type MemberSpending = {
    memberId: string | null;
    name: string;
    status: 'active' | 'former' | 'unassigned';
    amounts: Map<string, number>;
};

const compare = (a: string, b: string) => a < b ? -1 : a > b ? 1 : 0;

function add(a: number, b: number): number {
    const total = a + b;
    if (!Number.isSafeInteger(total)) throw new Error('Money total out of range');
    return total;
}

function addAmount(amounts: Map<string, number>, currencyCode: string, cents: number) {
    amounts.set(currencyCode, add(amounts.get(currencyCode) ?? 0, cents));
}

function amountsOf(amounts: Map<string, number>): CurrencyAmount[] {
    return [...amounts].sort(([a], [b]) => compare(a, b))
        .map(([currencyCode, cents]) => ({ currencyCode, amount: fromCents(cents) }));
}

function validateCurrency(currencyCode: string) {
    if (!/^[A-Z][A-Z0-9]*$/.test(currencyCode)) throw new Error('Invalid currency code');
}

/**
 * Builds a monthly view of already-authorized, normalized ledger rows.
 * IDs must be unique across sources; memberId is the spender, not necessarily
 * the person who entered the transaction. No currency conversion is performed.
 */
export function buildFamilyOverview({
    month,
    transactions,
    members,
    budgets = [],
}: {
    month: string;
    transactions: readonly LedgerRow[];
    members: readonly { id: string; name: string }[];
    budgets?: readonly CurrencyAmount[];
}) {
    if (!/^\d{4}-\d{2}$/.test(month)) throw new Error('Invalid month');
    const { start: periodStart, end: periodEnd } = periodBounds('monthly', `${month}-01`);
    const totals = new Map<string, { income: number; expense: number; budget: number | null }>();
    const memberAmounts = new Map<string | null, MemberSpending>();
    const categoryAmounts = new Map<string | null, { name: string; amounts: Map<string, number> }>();
    const dailyAmounts = new Map<string, Map<string, number>>();
    const ids = new Set<string>();

    const currencyTotals = (currencyCode: string) => {
        let total = totals.get(currencyCode);
        if (!total) {
            total = { income: 0, expense: 0, budget: null };
            totals.set(currencyCode, total);
        }
        return total;
    };

    for (const member of members) {
        if (!member.id || !member.name.trim() || memberAmounts.has(member.id)) {
            throw new Error('Invalid or duplicate member');
        }
        memberAmounts.set(member.id, {
            memberId: member.id,
            name: member.name,
            status: 'active',
            amounts: new Map(),
        });
    }

    for (const budget of budgets) {
        validateCurrency(budget.currencyCode);
        const amount = toCents(budget.amount);
        const total = currencyTotals(budget.currencyCode);
        if (amount < 0 || total.budget !== null) throw new Error('Invalid or duplicate budget');
        total.budget = amount;
    }

    for (const row of transactions) {
        if (!row.id || ids.has(row.id)) throw new Error('Invalid or duplicate transaction');
        ids.add(row.id);
        periodBounds('monthly', row.date);
        validateCurrency(row.currencyCode);
        const amount = toCents(row.amount);
        if (amount <= 0) throw new Error('Transaction amount must be greater than zero');
        if (!['income', 'expense', 'transfer'].includes(row.kind)) throw new Error('Invalid transaction kind');
        if (row.date < periodStart || row.date > periodEnd || row.kind === 'transfer') continue;

        const total = currencyTotals(row.currencyCode);
        total[row.kind] = add(total[row.kind], amount);
        if (row.kind !== 'expense') continue;

        let member = memberAmounts.get(row.memberId);
        if (!member) {
            member = {
                memberId: row.memberId,
                name: row.memberId === null ? 'Unassigned' : 'Former member',
                status: row.memberId === null ? 'unassigned' : 'former',
                amounts: new Map(),
            };
            memberAmounts.set(row.memberId, member);
        }
        addAmount(member.amounts, row.currencyCode, amount);

        let category = categoryAmounts.get(row.categoryId);
        const categoryName = row.categoryId === null ? 'Uncategorized' : row.categoryName?.trim() || 'Unnamed category';
        if (!category) {
            category = { name: categoryName, amounts: new Map() };
            categoryAmounts.set(row.categoryId, category);
        } else if (compare(categoryName, category.name) < 0) {
            // Stable output even if source rows carry different historical names.
            category.name = categoryName;
        }
        addAmount(category.amounts, row.currencyCode, amount);

        const daily = dailyAmounts.get(row.date) ?? new Map<string, number>();
        addAmount(daily, row.currencyCode, amount);
        dailyAmounts.set(row.date, daily);
    }

    const currencies = [...totals].sort(([a], [b]) => compare(a, b)).map(([currencyCode, total]) => ({
        currencyCode,
        income: fromCents(total.income),
        expense: fromCents(total.expense),
        budget: total.budget === null ? null : fromCents(total.budget),
        remaining: total.budget === null ? null : fromCents(add(total.budget, -total.expense)),
    }));
    const statusOrder = { active: 0, former: 1, unassigned: 2 };
    const spendingByMember = [...memberAmounts.values()]
        .sort((a, b) => statusOrder[a.status] - statusOrder[b.status] || compare(a.name, b.name) || compare(a.memberId ?? '', b.memberId ?? ''))
        .map(({ amounts, ...member }) => ({ ...member, totals: amountsOf(amounts) }));
    const spendingByCategory = [...categoryAmounts]
        .sort(([a], [b]) => a === b ? 0 : a === null ? 1 : b === null ? -1 : compare(a, b))
        .map(([categoryId, category]) => ({ categoryId, categoryName: category.name, totals: amountsOf(category.amounts) }));
    const dailyExpenses = Array.from({ length: Number(periodEnd.slice(-2)) }, (_, index) => {
        const date = `${month}-${String(index + 1).padStart(2, '0')}`;
        return {
            date,
            totals: currencies.map(({ currencyCode }) => ({
                currencyCode,
                amount: fromCents(dailyAmounts.get(date)?.get(currencyCode) ?? 0),
            })),
        };
    });

    return { month, periodStart, periodEnd, currencies, members: spendingByMember, categories: spendingByCategory, dailyExpenses };
}
