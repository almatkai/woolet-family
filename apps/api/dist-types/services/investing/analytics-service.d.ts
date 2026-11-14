import type { PortfolioSummary, PortfolioChartPoint, BenchmarkComparison } from '@woolet/shared';
export declare class AnalyticsService {
    private twelveData;
    /**
     * Calculate portfolio summary with current P/L
     * Uses LRU cache with 15-minute TTL
     */
    calculatePortfolioSummary(userId: string): Promise<PortfolioSummary>;
    /**
     * Calculate realized P/L for a sell transaction using FIFO
     */
    calculateRealizedPL(userId: string, stockId: string, sellQuantity: number, sellPricePerShare: number): Promise<number>;
    /**
     * Generate portfolio value chart over time
     * Uses LRU cache with 1-hour TTL
     */
    getPortfolioChart(userId: string, range: string): Promise<PortfolioChartPoint[]>;
    /**
     * Compare portfolio performance against a benchmark (default SPY)
     */
    getPortfolioBenchmarkComparison(userId: string, range: string, benchmarkTicker?: string): Promise<BenchmarkComparison>;
    /**
     * Invalidate portfolio cache when data changes
     */
    invalidatePortfolioCache(userId: string): Promise<void>;
}
export declare const analyticsService: AnalyticsService;
