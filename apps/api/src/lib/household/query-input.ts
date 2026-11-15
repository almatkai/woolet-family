import { z } from 'zod';
import { DEFAULT_CURRENCIES } from '../../db/schema/currencies';
import { periodBounds } from './limits';

const supportedCurrencies = new Set(DEFAULT_CURRENCIES.map(c => c.code));
export const currencyInput = z.string().regex(/^[A-Z]{3}$/).refine(code => supportedCurrencies.has(code), 'Invalid currency code');
export const monthInput = z.string().regex(/^\d{4}-\d{2}$/).refine(month => {
    try { periodBounds('monthly', `${month}-01`); return month > '0000-01'; } catch { return false; }
}, 'Invalid month');
export const dayInput = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine(day => {
    try { periodBounds('monthly', day); return true; } catch { return false; }
}, 'Invalid date');
export const categoryInput = z.union([z.string().uuid(), z.literal('none')]);
