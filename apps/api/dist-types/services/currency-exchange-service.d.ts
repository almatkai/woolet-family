declare class CurrencyExchangeService {
    constructor();
    /**
     * Get exchange rates for any base currency.
     * Internally we only store USD-based rates and compute cross-rates.
     *
     * When baseCurrency = 'USD' → returns raw USD rates (1 USD = X).
     * When baseCurrency = 'KZT' → returns KZT-based rates:
     *   rate(KZT → X) = rate(USD → X) / rate(USD → KZT)
     *
     * Example with KZT (1 USD = 450 KZT, 1 USD = 0.85 EUR):
     *   rate(KZT → EUR) = 0.85 / 450 ≈ 0.00189
     *   rate(KZT → USD) = 1 / 450 ≈ 0.00222
     *   rate(KZT → KZT) = 1
     */
    getExchangeRates(baseCurrency?: string): Promise<Record<string, number>>;
    /**
     * Get USD-based rates from Cache or DB only (no external API call).
     */
    private getUsdRatesFromCacheOrDbOnly;
    /**
     * Get USD-based rates from Cache/DB with API fallback.
     * Returns rates as USD -> Currency (e.g., USD -> EUR = 0.85)
     */
    private getUsdRates;
    /**
     * Fetch rates from API (USD base only) and store in DB/Cache
     * This should be called by the cron job every 30 minutes
     */
    fetchAndStoreRates(base?: string): Promise<Record<string, number>>;
    /**
    * Get rate history for a currency pair
    */
    getRateHistory(fromCurrency: string, toCurrency: string, days?: number): Promise<Array<{
        date: string;
        rate: number;
    }>>;
    /**
     * Convert amount
     */
    convert(amount: number, fromCurrency: string, toCurrency: string): Promise<number>;
    /**
    * Get all available currencies (used for tests or validation)
    */
    getMajorCurrencies(): Promise<string[]>;
    fetchAllRates(): Promise<void>;
}
export declare const currencyExchangeService: CurrencyExchangeService;
export {};
