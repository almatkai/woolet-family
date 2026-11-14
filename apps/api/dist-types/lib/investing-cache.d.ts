export interface CacheStats {
    hits: number;
    misses: number;
    evictions: number;
    size: number;
    hitRate: number;
}
interface RefreshCallback<T> {
    (): Promise<T>;
}
declare class InvestingCache {
    /**
     * Get data from cache, or fetch from source if not cached
     * Implements stale-while-revalidate pattern
     */
    getOrFetch<T>(key: string, fetchFn: RefreshCallback<T>, ttl?: number, ticker?: string): Promise<T>;
    /**
     * Get cached entry
     */
    private get;
    /**
     * Set cache entry with LRU tracking
     */
    private set;
    /**
     * Update access time for LRU tracking
     */
    private updateAccessTime;
    /**
     * Refresh data in background (stale-while-revalidate)
     */
    private refreshInBackground;
    /**
     * Enforce LRU size limit by evicting oldest entries
     */
    private enforceSizeLimit;
    /**
     * Get full cache key with prefix
     */
    private getFullKey;
    /**
     * Record a cache hit
     */
    private recordHit;
    /**
     * Record a cache miss
     */
    private recordMiss;
    /**
     * Record evictions
     */
    private recordEvictions;
    /**
     * Get cache statistics
     */
    getStats(): Promise<CacheStats>;
    /**
     * Get all tickers in the refresh queue
     */
    getRefreshQueue(): Promise<string[]>;
    /**
     * Clear a specific cache entry
     */
    invalidate(key: string): Promise<void>;
    /**
     * Clear all cache entries with a pattern
     */
    invalidatePattern(pattern: string): Promise<void>;
    /**
     * Clear all investment cache
     */
    clearAll(): Promise<void>;
    /**
     * Reset statistics
     */
    resetStats(): Promise<void>;
}
export declare const investingCache: InvestingCache;
export declare const INVESTING_CACHE_KEYS: {
    stockSearch: (query: string) => string;
    stockQuote: (ticker: string) => string;
    stockPrices: (ticker: string, start?: string, end?: string, size?: number) => string;
    stockEOD: (ticker: string, date: string) => string;
    portfolioSummary: (userId: string) => string;
    portfolioChart: (userId: string, range: string) => string;
    portfolioBenchmark: (userId: string, benchmarkTicker: string, range: string) => string;
};
export declare const INVESTING_CACHE_TTL: {
    search: number;
    quote: number;
    prices: number;
    pricesRecent: number;
    eod: number;
    portfolioSummary: number;
    portfolioChart: number;
    portfolioBenchmark: number;
};
export {};
