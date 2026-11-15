import { and, desc, eq, gt } from 'drizzle-orm';
import { portfolioHoldings, stockPrices } from '../../db/schema';
import type { DB } from './dashboard';
import type { FamilyInvestments } from './family-types';
import { fromCents, toCents } from './limits';

/** Both database numeric columns have scale 8. Multiply before rounding to cents. */
function holdingValue(quantity: string, price: string): string {
    const units = (value: string) => {
        if (!/^\d+(\.\d{1,8})?$/.test(value)) throw new Error('Invalid holding quantity or price');
        const [whole, fraction = ''] = value.split('.');
        return BigInt(whole) * 100000000n + BigInt(fraction.padEnd(8, '0'));
    };
    const centsDivisor = 100000000000000n;
    return fromCents(Number((units(quantity) * units(price) + centsDivisor / 2n) / centsDivisor));
}
/** Uncached, stored data only. Never call the quote/backfill/portfolio services here. */
export async function readFamilyInvestments(db: DB, userId: string): Promise<FamilyInvestments> {
    // Investing has no isTest column or bank association; holdings are user-scoped.
    const rows = await db.query.portfolioHoldings.findMany({
        where: and(eq(portfolioHoldings.userId, userId), gt(portfolioHoldings.quantity, '0')), with: { stock: true },
        orderBy: portfolioHoldings.id,
    });
    const holdings: FamilyInvestments['holdings'] = [];
    const totals = new Map<string, number>();
    for (const holding of rows) {
        if (holding.stock.userId !== userId) continue;
        const price = await db.query.stockPrices.findFirst({ where: eq(stockPrices.stockId, holding.stockId), orderBy: [desc(stockPrices.date), desc(stockPrices.id)] });
        // When no stored price exists, value the holding at its cost basis.
        const value = holdingValue(holding.quantity, price?.close ?? holding.averageCostBasis);
        const currency = holding.stock.currency;
        holdings.push({ symbol: holding.stock.ticker, quantity: holding.quantity, value, currency });
        totals.set(currency, (totals.get(currency) ?? 0) + toCents(value));
    }
    holdings.sort((a, b) => a.symbol.localeCompare(b.symbol) || a.currency.localeCompare(b.currency));
    return { holdings, value: [...totals].sort(([a], [b]) => a.localeCompare(b)).map(([currencyCode, cents]) => ({ currencyCode, amount: fromCents(cents) })) };
}
