import { z } from 'zod';
import { fromCents, toCents } from './limits';

export const DEFAULT_SHARED_PURCHASE_LIMIT = '1000.00';
export const purchaseAmountSchema = z.union([z.string(), z.number()]).transform(String)
    .refine(value => /^\d+(\.\d{1,2})?$/.test(value) && Number(value) > 0 && Number(value) <= 1e9, 'Enter a positive amount with at most two decimals.')
    .transform(value => fromCents(toCents(value)));
export const purchaseLimitSchema = z.union([z.string(), z.number()]).transform(String)
    .refine(value => /^\d+(\.\d{1,2})?$/.test(value) && Number(value) >= 0 && Number(value) <= 1e9, 'Enter an amount from 0 to 1,000,000,000 with at most two decimals.')
    .transform(value => fromCents(toCents(value)));

/** Each shared wallet uses its own currency; no implicit exchange-rate rule. */
export function needsPurchaseApproval(amount: string, limit: string): boolean {
    return toCents(amount) > toCents(limit);
}
