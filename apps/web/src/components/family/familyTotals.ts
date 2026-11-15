import type { CurrencyAmount } from './types';

const toCents = (amount: string | number) => Math.round(Number(amount) * 100);
const fromCents = (cents: number) => {
    const sign = cents < 0 ? '-' : '';
    const abs = Math.abs(cents);
    return `${sign}${Math.floor(abs / 100)}.${String(abs % 100).padStart(2, '0')}`;
};

/** Sums amounts per currency in integer cents. Never adds different currencies together. */
export function familyTotals(items: CurrencyAmount[]): CurrencyAmount[] {
    const totals = new Map<string, number>();
    for (const item of items)
        totals.set(item.currencyCode, (totals.get(item.currencyCode) ?? 0) + toCents(item.amount));
    return Array.from(totals, ([currencyCode, cents]) => ({
        currencyCode,
        amount: fromCents(cents),
    }));
}
