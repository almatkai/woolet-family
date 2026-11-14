import type { StockPrice } from '@woolet/shared';
export declare class PriceService {
    private twelveData;
    /**
     * Get stock prices for a date range
     * Uses database as permanent storage, LRU cache for hot data
     */
    getStockPrices(stockId: string, startDate: string, endDate: string): Promise<StockPrice[]>;
    /**
     * Get latest price for a stock (with shorter cache TTL)
     */
    getLatestPrice(stockId: string): Promise<{
        price: number;
        date: string;
    }>;
    /**
     * Initial backfill when adding a new stock
     * Fetches maximum history (5000 days = ~20 years)
     */
    backfillStockHistory(stockId: string, ticker: string): Promise<void>;
    /**
     * Get date range for price queries based on range string
     */
    getDateRange(range: string): {
        start: string;
        end: string;
    };
}
export declare const priceService: PriceService;
