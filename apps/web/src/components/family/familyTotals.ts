import type { CurrencyAmount } from "./types";

export function familyTotals(items: CurrencyAmount[]): CurrencyAmount[] {
  const totals = new Map<string, number>();
  for (const item of items)
    totals.set(
      item.currencyCode,
      (totals.get(item.currencyCode) ?? 0) + Number(item.amount),
    );
  return Array.from(totals, ([currencyCode, amount]) => ({
    currencyCode,
    amount: String(amount),
  }));
}
