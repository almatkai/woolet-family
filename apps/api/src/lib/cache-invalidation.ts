import { cache, CACHE_KEYS } from './redis';

export async function invalidateUserFinancialCaches(userId: string) {
    await Promise.all([
        cache.invalidatePattern(CACHE_KEYS.hierarchyPattern(userId)),
        cache.invalidatePattern(CACHE_KEYS.userDashboardPattern(userId)),
        cache.invalidatePattern(CACHE_KEYS.spendingPattern(userId)),
        cache.invalidatePattern(CACHE_KEYS.spendingAnomaliesPattern(userId)),
    ]);
}

export async function invalidateCurrencyRateCaches() {
    await Promise.all([
        cache.invalidatePattern(`${CACHE_KEYS.CURRENCY_RATES}:*`),
        cache.invalidatePattern(CACHE_KEYS.exchangeRatePattern()),
        cache.invalidatePattern('dashboard:*'),
    ]);
}
