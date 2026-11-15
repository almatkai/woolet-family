import { afterEach, expect, spyOn, test } from 'bun:test';
import { currencyExchangeService } from '../src/services/currency-exchange-service';
import { baseConverter } from '../src/lib/household/dashboard';

const restores: { mockRestore(): void }[] = [];
afterEach(() => { for (const spy of restores.splice(0)) spy.mockRestore(); });
function storedRates(rates: Record<string, number> | null) {
    const local = spyOn(currencyExchangeService as any, 'getUsdRatesFromCacheOrDbOnly').mockResolvedValue(rates);
    const live = spyOn(currencyExchangeService, 'fetchAndStoreRates').mockRejectedValue(new Error('Live FX forbidden'));
    restores.push(local, live);
    return live;
}
test('family FX converts stored USD rates to the requested display currency', async () => {
    const live = storedRates({ USD: 1, EUR: 2, GBP: 4 });
    const rates = await currencyExchangeService.getExchangeRates('EUR', { storedOnly: true });
    expect(rates).toEqual({ USD: 0.5, EUR: 1, GBP: 2 }); expect(live).not.toHaveBeenCalled();
});
test('missing display-currency rate never labels USD conversion as the requested currency', async () => {
    const live = storedRates({ USD: 1, GBP: 4 });
    const rates = await currencyExchangeService.getExchangeRates('EUR', { storedOnly: true });
    const { convert, missing } = baseConverter('EUR', rates);
    expect(convert('100.00', 'USD')).toBeNull(); expect(convert('20.00', 'EUR')).toBe('20.00');
    expect([...missing]).toEqual(['USD']); expect(live).not.toHaveBeenCalled();
});
test('empty stored FX never fetches or stores external rates', async () => {
    const live = storedRates(null);
    expect(await currencyExchangeService.getExchangeRates('USD', { storedOnly: true })).toEqual({ USD: 1 });
    expect(await currencyExchangeService.getExchangeRates('EUR', { storedOnly: true })).toEqual({ EUR: 1 });
    expect(live).not.toHaveBeenCalled();
});
