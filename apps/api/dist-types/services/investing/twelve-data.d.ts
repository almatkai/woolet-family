import type { StockSearchResult, StockPrice } from '@woolet/shared';
export declare class TwelveDataService {
    private lastRequestTime;
    /**
     * Rate limit helper (8 requests/minute = 7.5 seconds between requests)
     */
    private rateLimitDelay;
    /**
     * Search for stocks by ticker or company name
     * Uses LRU cache with 24-hour TTL
     */
    searchStocks(query: string): Promise<StockSearchResult[]>;
    /**
     * Get daily historical prices
     * Uses LRU cache with 24-hour TTL
     *
     * @param ticker Stock ticker symbol
     * @param startDate Optional start date (YYYY-MM-DD), defaults to maximum history
     * @param endDate Optional end date (YYYY-MM-DD), defaults to today
     * @param outputSize Number of data points (default 5000, max 5000)
     */
    getDailyPrices(ticker: string, startDate?: string, endDate?: string, outputSize?: number, userId?: string): Promise<StockPrice[]>;
    /**
     * Helper to save prices to DB
     */
    private saveToDb;
    /**
     * Get current/latest quote for a stock
     * Uses LRU cache with 24-hour TTL (EOD data updates once daily)
     */
    getQuote(ticker: string): Promise<StockPrice>;
    /**
     * Get End-of-Day price for a specific date
     * Uses LRU cache with 7-day TTL (historical data doesn't change)
     */
    getEODPrice(ticker: string, date: string): Promise<number>;
}
export declare function getTwelveDataService(): TwelveDataService;
