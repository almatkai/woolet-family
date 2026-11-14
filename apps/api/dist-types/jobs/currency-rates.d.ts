/**
 * Fetch and cache exchange rates from API (USD base only)
 * All other currencies are calculated from USD rates
 */
export declare function fetchAllCurrencyRates(): Promise<void>;
/**
 * Initialize currency rates cron job
 * Runs every 30 minutes to fetch fresh rates
 */
export declare function startCurrencyRatesCron(): void;
