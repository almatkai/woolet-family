import { z } from 'zod';
import { router, publicProcedure, protectedProcedure } from '../lib/trpc';
import { currencies, DEFAULT_CURRENCIES, fxRates, userSettings, users, transactions, currencyBalances, accounts, banks } from '../db/schema';
import { and, desc, eq, sql } from 'drizzle-orm';
import { currencyExchangeService } from '../services/currency-exchange-service';
import { db } from '../db';
import { invalidateCurrencyRateCaches } from '../lib/cache-invalidation';

export const currencyRouter = router({
    list: publicProcedure
        .query(async ({ ctx }) => {
            let result = await ctx.db.select().from(currencies);
            if (result.length < DEFAULT_CURRENCIES.length && typeof ctx.db?.insert === 'function') {
                try {
                    const insertBuilder = ctx.db.insert(currencies).values(DEFAULT_CURRENCIES);
                    if (typeof insertBuilder?.onConflictDoNothing === 'function') {
                        await insertBuilder.onConflictDoNothing();
                    } else {
                        await insertBuilder;
                    }
                    result = await ctx.db.select().from(currencies);
                } catch (e) {
                    console.error('Failed to auto-seed currencies:', e);
                }
            }
            return result;
        }),
    
    // Currencies to suggest first in pickers: the user's default, then recently used, then ones they hold
    getPreferred: protectedProcedure
        .query(async ({ ctx }) => {
            const userId = ctx.userId!;
            const isTest = ctx.user?.testMode ?? false;

            const [settings] = await db
                .select({ defaultCurrency: userSettings.defaultCurrency })
                .from(userSettings)
                .where(eq(userSettings.userId, userId))
                .limit(1);
            const [user] = settings
                ? []
                : await db.select({ defaultCurrency: users.defaultCurrency }).from(users).where(eq(users.id, userId)).limit(1);
            const defaultCurrency = settings?.defaultCurrency || user?.defaultCurrency || 'USD';

            const lastUsed = sql<Date>`max(${transactions.createdAt})`;
            const recentRows = await db
                .select({ code: currencyBalances.currencyCode, lastUsed })
                .from(transactions)
                .innerJoin(currencyBalances, eq(transactions.currencyBalanceId, currencyBalances.id))
                .innerJoin(accounts, eq(currencyBalances.accountId, accounts.id))
                .innerJoin(banks, eq(accounts.bankId, banks.id))
                .where(and(eq(banks.userId, userId), eq(banks.isTest, isTest)))
                .groupBy(currencyBalances.currencyCode)
                .orderBy(desc(lastUsed))
                .limit(6);

            const heldRows = await db
                .selectDistinct({ code: currencyBalances.currencyCode })
                .from(currencyBalances)
                .innerJoin(accounts, eq(currencyBalances.accountId, accounts.id))
                .innerJoin(banks, eq(accounts.bankId, banks.id))
                .where(and(eq(banks.userId, userId), eq(banks.isTest, isTest)));

            const recent = [...new Set([
                ...recentRows.map((row) => row.code),
                ...heldRows.map((row) => row.code),
            ])].filter((code) => code !== defaultCurrency).slice(0, 5);

            return { defaultCurrency, recent };
        }),

    // Get current exchange rates for a base currency
    getExchangeRates: protectedProcedure
        .input(z.object({
            baseCurrency: z.string().default('USD'),
        }))
        .query(async ({ input }) => {
            return await currencyExchangeService.getExchangeRates(input.baseCurrency);
        }),
    
    // Get exchange rate history
    getRateHistory: protectedProcedure
        .input(z.object({
            fromCurrency: z.string(),
            toCurrency: z.string(),
            days: z.number().default(30),
        }))
        .query(async ({ input }) => {
            return await currencyExchangeService.getRateHistory(
                input.fromCurrency,
                input.toCurrency,
                input.days
            );
        }),
    
    // Convert amount between currencies
    convert: protectedProcedure
        .input(z.object({
            amount: z.number(),
            fromCurrency: z.string(),
            toCurrency: z.string(),
        }))
        .query(async ({ input }) => {
            return await currencyExchangeService.convert(
                input.amount,
                input.fromCurrency,
                input.toCurrency
            );
        }),
    
    // Get list of major currencies
    getMajorCurrencies: protectedProcedure
        .query(() => {
            return currencyExchangeService.getMajorCurrencies();
        }),
    
    // Add manual exchange rate (for unsupported currencies like KZT)
    addManualRate: protectedProcedure
        .input(z.object({
            fromCurrency: z.string(),
            toCurrency: z.string(),
            rate: z.number(),
            date: z.string().optional(), // YYYY-MM-DD format
        }))
        .mutation(async ({ input }) => {
            const today = input.date || new Date().toISOString().split('T')[0];
            
            const [inserted] = await db
                .insert(fxRates)
                .values({
                    date: today,
                    fromCurrency: input.fromCurrency,
                    toCurrency: input.toCurrency,
                    rate: input.rate.toString(),
                })
                .onConflictDoNothing()
                .returning();

            await invalidateCurrencyRateCaches();
            
            return inserted;
        }),
});
