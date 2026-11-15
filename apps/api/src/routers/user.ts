import { z } from 'zod';
import { eq, inArray, or, isNull, ilike, ne } from 'drizzle-orm';
import { router, protectedProcedure } from '../lib/trpc';
import { investingCache } from '../lib/investing-cache';
import { redis } from '../lib/redis';
import { invalidateUserFinancialCaches } from '../lib/cache-invalidation';
import { prepareFamilyForUserDeletion } from '../lib/household/membership-cleanup';
import { getDemoRole } from '../lib/demo';
import {
    users,
    banks,
    accounts,
    transactions,
    categories,
    debts,
    debtPayments,
    credits,
    mortgages,
    deposits,
    creditPayments,
    dashboardLayouts,
    currencyBalances,
    investmentTransactions,
    portfolioHoldings,
    stocks,
    userSettings,
    subscriptions,
    subscriptionPayments,
    splitParticipants,
    transactionSplits,
    splitPayments,
    admins,
    stockPrices,
    currencies,
    DEFAULT_CURRENCIES,
    exportHistories,
} from '../db/schema';
import * as schema from '../db/schema';
import { TRPCError } from '@trpc/server';
import crypto from 'crypto';
import { subMonths, startOfDay, startOfWeek } from 'date-fns';
import { gte, count, and } from 'drizzle-orm';

const ISO_DATE_REGEXP = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;

const USERNAME_SCHEMA = z.string()
    .trim()
    .min(4, 'Username must be at least 4 characters')
    .max(32, 'Username must be at most 32 characters')
    .regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores');


// UUID validation regex
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Family tables belong to multiple members, so personal export/import never transfers them.
const FAMILY_TABLES = new Set(['householdBudgets', 'household_budgets', 'households', 'householdMembers', 'householdInvitations', 'familyWallets', 'familyWalletTransactions', 'familyBudgetLimits', 'familyPurchaseProposals', 'household_members', 'household_invitations', 'family_wallets', 'family_wallet_transactions', 'family_budget_limits', 'family_purchase_proposals']);
// Valid table names for import
const VALID_TABLES = [
    'banks', 'accounts', 'currencyBalances', 'categories', 'transactions',
    'debts', 'debtPayments', 'credits', 'creditPayments', 'mortgages', 'mortgagePayments', 'deposits',
    'stocks', 'stockPrices', 'portfolioHoldings', 'investmentTransactions',
    'subscriptions', 'subscriptionPayments', 'splitParticipants', 'transactionSplits', 'splitPayments',
    'userSettings', 'dashboardLayouts', 'taxProfiles', 'taxEstimatedPayments'
] as const;

// Schema for validating imported data structure
const importDataSchema = z.object({
    timestamp: z.string().datetime().optional(),
    version: z.number().optional(),
    data: z.record(z.unknown())
        .transform(data => Object.fromEntries(Object.entries(data).filter(([key]) => !FAMILY_TABLES.has(key))))
        .pipe(z.record(z.array(z.record(z.any()))))
        .refine(
            (data) => Object.keys(data).every(key => VALID_TABLES.includes(key as any)),
            { message: 'Invalid table name in import data' }
        )
});

function parseDates(obj: any): any {
    if (obj === null || obj === undefined) return obj;
    if (typeof obj === 'string') {
        if (ISO_DATE_REGEXP.test(obj)) {
            const date = new Date(obj);
            if (!isNaN(date.getTime())) return date;
        }
        return obj;
    }
    if (Array.isArray(obj)) {
        return obj.map(parseDates);
    }
    if (typeof obj === 'object') {
        const newObj: any = {};
        for (const key in obj) {
            newObj[key] = parseDates(obj[key]);
        }
        return newObj;
    }
    return obj;
}

function remapIds(data: any): any {
    const idMap: Record<string, string> = {};

    // 1. Collect all IDs and generate new ones
    for (const table in data) {
        if (Array.isArray(data[table])) {
            data[table].forEach((item: any) => {
                if (item.id && UUID_REGEX.test(item.id)) {
                    idMap[item.id] = crypto.randomUUID();
                }
            });
        }
    }

    // 2. Map old IDs to new IDs in all fields
    const remapFields = (obj: any): any => {
        if (obj === null || obj === undefined) return obj;
        if (obj instanceof Date) return obj; // CRITICAL: Preserve Date objects
        if (typeof obj === 'string') {
            return idMap[obj] || obj;
        }
        if (Array.isArray(obj)) {
            return obj.map(remapFields);
        }
        if (typeof obj === 'object') {
            // Preserve non-plain objects if any (though parseDates mostly creates Dates)
            if (obj.constructor !== Object && obj.constructor !== undefined) return obj;

            const newObj: any = {};
            for (const key in obj) {
                if (key === 'userId') {
                    newObj[key] = obj[key];
                } else {
                    newObj[key] = remapFields(obj[key]);
                }
            }
            return newObj;
        }
        return obj;
    };

    return remapFields(data);
}

function stripUserId<T extends Record<string, any>>(items: T[]): Omit<T, 'userId'>[] {
    return items.map(({ userId: _userId, ...item }) => item);
}

// Test mode limits
const TEST_MODE_LIMITS = {
    transactions: 35,
    mortgages: 1,
    deposits: 2,
    debts: 4,
    accounts: 2,
};

// Production limits (effectively unlimited)
const PRODUCTION_LIMITS = {
    transactions: 999999,
    mortgages: 999999,
    deposits: 999999,
    debts: 999999,
    accounts: 999999,
};

// User preferences schema
const userPreferencesSchema = z.object({
    weekStartsOn: z.number().min(0).max(6).optional(), // 0 = Sunday, 1 = Monday, etc.
    spendingWidget: z.object({
        categoryIds: z.array(z.string().uuid()).optional(),
    }).optional(),
    recentTransactionsWidget: z.object({
        excludedCategories: z.array(z.string().uuid()).optional(),
        period: z.string().optional(),
    }).optional(),
    splitBill: z.object({
        allowAccountSharing: z.boolean().optional(),
    }).optional(),
}).optional();

type ExportTierLimits = {
    transactionsMonths?: number;
    maxPerDay: number;
    maxPerWeek: number;
};

const EXPORT_LIMITS: Record<string, ExportTierLimits> = {
    free: {
        transactionsMonths: 2,
        maxPerDay: 1, // Reasonable default for free
        maxPerWeek: 3,
    },
    pro: {
        maxPerDay: 3,
        maxPerWeek: 7,
    },
    premium: {
        maxPerDay: 6,
        maxPerWeek: 14,
    },
};

export const userRouter = router({
    me: protectedProcedure.query(async ({ ctx }) => {
        const user = await ctx.db.query.users.findFirst({
            where: eq(users.id, ctx.userId),
        });

        return user ? { ...user, isDemo: Boolean(getDemoRole(ctx.userId)), demoRole: getDemoRole(ctx.userId) } : user;
    }),

    isAdmin: protectedProcedure.query(async ({ ctx }) => {
        const admin = await ctx.db.query.admins.findFirst({
            where: eq(admins.id, ctx.userId),
        });
        return !!admin;
    }),

    searchByUsername: protectedProcedure
        .input(z.object({
            query: z.string().trim().min(2).max(32),
            limit: z.number().min(1).max(20).default(8),
        }))
        .query(async ({ ctx, input }) => {
            const normalizeForSearch = (value: string) => value.toLowerCase().replace(/[^a-z0-9]/g, '');

            const levenshteinDistance = (a: string, b: string): number => {
                if (a === b) return 0;
                if (a.length === 0) return b.length;
                if (b.length === 0) return a.length;

                const matrix: number[][] = Array.from({ length: a.length + 1 }, () => new Array(b.length + 1).fill(0));
                for (let i = 0; i <= a.length; i += 1) matrix[i][0] = i;
                for (let j = 0; j <= b.length; j += 1) matrix[0][j] = j;

                for (let i = 1; i <= a.length; i += 1) {
                    for (let j = 1; j <= b.length; j += 1) {
                        const cost = a[i - 1] === b[j - 1] ? 0 : 1;
                        matrix[i][j] = Math.min(
                            matrix[i - 1][j] + 1,
                            matrix[i][j - 1] + 1,
                            matrix[i - 1][j - 1] + cost
                        );
                    }
                }

                return matrix[a.length][b.length];
            };

            const isLooseSubsequence = (needle: string, haystack: string) => {
                if (!needle || !haystack) return false;
                let n = 0;
                for (let h = 0; h < haystack.length && n < needle.length; h += 1) {
                    if (haystack[h] === needle[n]) n += 1;
                }
                return n === needle.length;
            };

            const scoreMatch = (queryNorm: string, candidate: string) => {
                if (!queryNorm || !candidate) return 0;
                if (candidate === queryNorm) return 1;
                if (candidate.startsWith(queryNorm)) return 0.97;
                if (candidate.includes(queryNorm)) return 0.92;
                if (queryNorm.startsWith(candidate)) return 0.88;
                if (isLooseSubsequence(queryNorm, candidate)) return 0.82;

                const distance = levenshteinDistance(queryNorm, candidate);
                const maxLen = Math.max(queryNorm.length, candidate.length);
                return maxLen > 0 ? Math.max(0, 1 - distance / maxLen) : 0;
            };

            const queryNorm = normalizeForSearch(input.query);

            const results = await ctx.db
                .select({
                    id: users.id,
                    username: users.username,
                    name: users.name,
                })
                .from(users)
                .where(and(
                    or(
                        ilike(users.username, `%${input.query.toLowerCase()}%`),
                        ilike(users.name, `%${input.query}%`)
                    ),
                    ne(users.id, ctx.userId)
                ))
                .limit(120);

            return results
                .filter((u) => !!u.username)
                .map((u) => {
                    const usernameNorm = normalizeForSearch(u.username || '');
                    const nameNorm = normalizeForSearch(u.name || '');
                    const usernameScore = scoreMatch(queryNorm, usernameNorm);
                    const nameScore = scoreMatch(queryNorm, nameNorm) * 0.85;
                    const score = Math.max(usernameScore, nameScore);
                    return { ...u, _score: score };
                })
                .filter((u) => u._score >= 0.55)
                .sort((a, b) => {
                    if (b._score !== a._score) return b._score - a._score;
                    return (a.username || '').localeCompare(b.username || '');
                })
                .slice(0, input.limit)
                .map(({ _score, ...u }) => u);
        }),

    getLimits: protectedProcedure.query(async ({ ctx }) => {
        const user = await ctx.db.query.users.findFirst({
            where: eq(users.id, ctx.userId),
        });

        if (user?.testMode) {
            return { testMode: true, limits: TEST_MODE_LIMITS };
        }
        return { testMode: false, limits: PRODUCTION_LIMITS };
    }),

    create: protectedProcedure
        .input(z.object({
            email: z.string().email(),
            name: z.string().optional(),
            username: USERNAME_SCHEMA.optional(),
            defaultCurrency: z.string().length(3).default('USD'),
        }))
        .mutation(async ({ ctx, input }) => {
            const existing = await ctx.db.query.users.findFirst({
                where: eq(users.id, ctx.userId),
            });

            if (existing) {
                return existing;
            }

            if (input.username) {
                const existingUsername = await ctx.db.query.users.findFirst({
                    where: eq(users.username, input.username.toLowerCase()),
                });

                if (existingUsername) {
                    throw new TRPCError({ code: 'CONFLICT', message: 'Username is already taken' });
                }
            }

            const [user] = await ctx.db.insert(users).values({
                id: ctx.userId,
                email: input.email,
                name: input.name,
                username: input.username?.toLowerCase(),
                defaultCurrency: input.defaultCurrency.toUpperCase(),
            }).returning();

            return user;
        }),

    update: protectedProcedure
        .input(z.object({
            name: z.string().optional(),
            username: USERNAME_SCHEMA.optional(),
            defaultCurrency: z.string().length(3).optional(),
            testMode: z.boolean().optional(),
            preferences: userPreferencesSchema,
        }))
        .mutation(async ({ ctx, input }) => {
            const updateData: Record<string, unknown> = { updatedAt: new Date() };

            if (input.name !== undefined) {
                updateData.name = input.name;
            }
            if (input.username !== undefined) {
                const [existingUsername] = await ctx.db
                    .select()
                    .from(users)
                    .where(and(
                        eq(users.username, input.username.toLowerCase()),
                        ne(users.id, ctx.userId)
                    ))
                    .limit(1);

                if (existingUsername) {
                    throw new TRPCError({ code: 'CONFLICT', message: 'Username is already taken' });
                }

                updateData.username = input.username.toLowerCase();
            }
            if (input.defaultCurrency !== undefined) {
                updateData.defaultCurrency = input.defaultCurrency.toUpperCase();
            }
            if (input.testMode !== undefined) {
                updateData.testMode = input.testMode;
            }
            if (input.preferences !== undefined) {
                updateData.preferences = input.preferences;
            }

            const [updated] = await ctx.db.update(users)
                .set(updateData)
                .where(eq(users.id, ctx.userId))
                .returning();

            return updated;
        }),

    deleteAllData: protectedProcedure
        .mutation(async ({ ctx: originalCtx }) => {
            const result = await originalCtx.db.transaction(async tx => {
            const ctx = { ...originalCtx, db: tx };
            // Even when the account remains, shared family data is not personal data:
            // leave the family (or delete an owner-only household) before resetting.
            await prepareFamilyForUserDeletion(tx, ctx.userId);
            const userBankIds = ctx.db
                .select({ id: banks.id })
                .from(banks)
                .where(eq(banks.userId, ctx.userId));

            const userAccountIds = ctx.db
                .select({ id: accounts.id })
                .from(accounts)
                .where(inArray(accounts.bankId, userBankIds));

            const userCurrencyBalanceIds = ctx.db
                .select({ id: currencyBalances.id })
                .from(currencyBalances)
                .where(inArray(currencyBalances.accountId, userAccountIds));

            const userCreditIds = ctx.db
                .select({ id: credits.id })
                .from(credits)
                .where(inArray(credits.accountId, userAccountIds));

            const userDebtIds = ctx.db
                .select({ id: debts.id })
                .from(debts)
                .where(eq(debts.userId, ctx.userId));

            // Delete all user-related data in correct order (respecting foreign key constraints)
            // Start with child tables first, then parent tables

            await ctx.db.delete(schema.taxEstimatedPayments).where(eq(schema.taxEstimatedPayments.userId, ctx.userId));
            await ctx.db.delete(schema.taxProfiles).where(eq(schema.taxProfiles.userId, ctx.userId));

            // Delete transactions (references currency balances)
            await ctx.db.delete(transactions)
                .where(or(
                    inArray(transactions.currencyBalanceId, userCurrencyBalanceIds),
                    inArray(transactions.toCurrencyBalanceId, userCurrencyBalanceIds)
                ));

            // Delete credit payments (references credits)
            await ctx.db.delete(creditPayments)
                .where(inArray(creditPayments.creditId, userCreditIds));

            // Delete debt payments (references debts)
            await ctx.db.delete(debtPayments)
                .where(inArray(debtPayments.debtId, userDebtIds));

            // Delete currency balances (references accounts)
            await ctx.db.delete(currencyBalances)
                .where(inArray(currencyBalances.accountId, userAccountIds));

            // Delete accounts (references banks)
            await ctx.db.delete(accounts)
                .where(inArray(accounts.bankId, userBankIds));

            // Delete banks
            await ctx.db.delete(banks)
                .where(eq(banks.userId, ctx.userId));

            // Delete financial products
            await ctx.db.delete(credits)
                .where(inArray(credits.accountId, userAccountIds));

            await ctx.db.delete(mortgages)
                .where(inArray(mortgages.accountId, userAccountIds));

            await ctx.db.delete(deposits)
                .where(inArray(deposits.accountId, userAccountIds));

            await ctx.db.delete(debts)
                .where(eq(debts.userId, ctx.userId));

            // Delete categories
            await ctx.db.delete(categories)
                .where(eq(categories.userId, ctx.userId));

            // Delete dashboard layout
            await ctx.db.delete(dashboardLayouts)
                .where(eq(dashboardLayouts.userId, ctx.userId));

            // Delete portfolio holdings
            await ctx.db.delete(portfolioHoldings)
                .where(eq(portfolioHoldings.userId, ctx.userId));

            // Delete investment transactions
            await ctx.db.delete(investmentTransactions)
                .where(eq(investmentTransactions.userId, ctx.userId));

            // Delete stocks (and cascading stock prices)
            await ctx.db.delete(stocks)
                .where(eq(stocks.userId, ctx.userId));

            // Reset user to default state (keep the user record but reset test mode)
            const [resetUser] = await ctx.db.update(users)
                .set({
                    testMode: false,
                    updatedAt: new Date()
                })
                .where(eq(users.id, ctx.userId))
                .returning();

            return {
                success: true,
                message: 'All user data has been deleted successfully',
                user: resetUser
            };
            });
            await invalidateUserFinancialCaches(originalCtx.userId);
            await investingCache.invalidatePattern(`portfolio:${originalCtx.userId}`);
            return result;
        }),

    deleteAccount: protectedProcedure
        .mutation(async ({ ctx }) => {
            await ctx.db.transaction(async tx => {
                await prepareFamilyForUserDeletion(tx, ctx.userId, { deleteAccount: true });
                await tx.delete(userSettings).where(eq(userSettings.userId, ctx.userId));
                await tx.delete(subscriptions).where(eq(subscriptions.userId, ctx.userId));
                await tx.delete(users).where(eq(users.id, ctx.userId));
            });

            // Clear any user-specific cache
            await investingCache.invalidatePattern(`*:${ctx.userId}`);
            await redis.del(`ratelimit:user:${ctx.userId}`);

            return {
                success: true,
                message: 'Your account and all associated data have been permanently deleted.'
            };
        }),

    exportAllData: protectedProcedure.query(async ({ ctx }) => {
        // 1. Get user and tier
        const user = await ctx.db.query.users.findFirst({
            where: eq(users.id, ctx.userId),
        });

        if (!user) {
            throw new TRPCError({ code: 'NOT_FOUND', message: 'User not found' });
        }

        const tier = user.subscriptionTier || 'free';
        const limits = EXPORT_LIMITS[tier] || EXPORT_LIMITS.free;

        // 2. Check frequency limits
        const now = new Date();
        const dailyStart = startOfDay(now);
        const weeklyStart = startOfWeek(now);

        const [dailyCount] = await ctx.db
            .select({ value: count() })
            .from(exportHistories)
            .where(and(
                eq(exportHistories.userId, ctx.userId),
                gte(exportHistories.timestamp, dailyStart)
            ));

        const [weeklyCount] = await ctx.db
            .select({ value: count() })
            .from(exportHistories)
            .where(and(
                eq(exportHistories.userId, ctx.userId),
                gte(exportHistories.timestamp, weeklyStart)
            ));

        if (dailyCount.value >= limits.maxPerDay) {
            throw new TRPCError({
                code: 'TOO_MANY_REQUESTS',
                message: `Daily export limit reached (${limits.maxPerDay}). Please try again tomorrow.`
            });
        }

        if (weeklyCount.value >= limits.maxPerWeek) {
            throw new TRPCError({
                code: 'TOO_MANY_REQUESTS',
                message: `Weekly export limit reached (${limits.maxPerWeek}). Please try again next week.`
            });
        }

        // 3. Fetch data with tier-based filters
        const userBanks = await ctx.db.query.banks.findMany({
            where: and(
                eq(schema.banks.userId, ctx.userId),
                eq(schema.banks.isTest, ctx.user.testMode)
            )
        });
        const bankIds = userBanks.map(b => b.id);

        const userAccounts = bankIds.length ? await ctx.db.query.accounts.findMany({
            where: inArray(schema.accounts.bankId, bankIds)
        }) : [];
        const accountIds = userAccounts.map(a => a.id);

        const balances = accountIds.length ? await ctx.db.query.currencyBalances.findMany({
            where: inArray(schema.currencyBalances.accountId, accountIds)
        }) : [];
        const balanceIds = balances.map(b => b.id);

        // Transaction history limit for free tier
        let transactionCondition = balanceIds.length ? inArray(schema.transactions.currencyBalanceId, balanceIds) : undefined;
        if (limits.transactionsMonths && transactionCondition) {
            const dateLimit = subMonths(new Date(), limits.transactionsMonths);
            transactionCondition = and(transactionCondition, gte(schema.transactions.createdAt, dateLimit));
        }

        const userTransactions = transactionCondition ? await ctx.db.query.transactions.findMany({
            where: transactionCondition
        }) : [];

        const userCategories = await ctx.db.query.categories.findMany({ where: eq(schema.categories.userId, ctx.userId) });

        const userDebts = await ctx.db.query.debts.findMany({ where: eq(schema.debts.userId, ctx.userId) });
        const debtIds = userDebts.map(d => d.id);
        const userDebtPayments = debtIds.length ? await ctx.db.query.debtPayments.findMany({
            where: inArray(schema.debtPayments.debtId, debtIds)
        }) : [];

        const userCredits = accountIds.length ? await ctx.db.query.credits.findMany({ where: inArray(schema.credits.accountId, accountIds) }) : [];
        const creditIds = userCredits.map(c => c.id);
        const userCreditPayments = creditIds.length ? await ctx.db.query.creditPayments.findMany({
            where: inArray(schema.creditPayments.creditId, creditIds)
        }) : [];
        const userMortgages = accountIds.length ? await ctx.db.query.mortgages.findMany({ where: inArray(schema.mortgages.accountId, accountIds) }) : [];
        const mortgageIds = userMortgages.map(m => m.id);
        const userMortgagePayments = mortgageIds.length ? await ctx.db.query.mortgagePayments.findMany({
            where: inArray(schema.mortgagePayments.mortgageId, mortgageIds)
        }) : [];
        const userDeposits = accountIds.length ? await ctx.db.query.deposits.findMany({ where: inArray(schema.deposits.accountId, accountIds) }) : [];

        const userStocks = await ctx.db.query.stocks.findMany({ where: eq(schema.stocks.userId, ctx.userId) });
        const manualStockIds = userStocks.filter(s => s.isManual).map(s => s.id);
        const userStockPrices = manualStockIds.length ? await ctx.db.query.stockPrices.findMany({
            where: inArray(schema.stockPrices.stockId, manualStockIds)
        }) : [];

        const holdings = await ctx.db.query.portfolioHoldings.findMany({ where: eq(schema.portfolioHoldings.userId, ctx.userId) });
        const invTransactions = await ctx.db.query.investmentTransactions.findMany({ where: eq(schema.investmentTransactions.userId, ctx.userId) });

        const userSplitParticipants = await ctx.db.query.splitParticipants.findMany({ where: eq(schema.splitParticipants.userId, ctx.userId) });
        const participantIds = userSplitParticipants.map(p => p.id);
        const userTransactionSplits = participantIds.length ? await ctx.db.query.transactionSplits.findMany({
            where: inArray(schema.transactionSplits.participantId, participantIds)
        }) : [];
        const splitIds = userTransactionSplits.map(s => s.id);
        const userSplitPayments = splitIds.length ? await ctx.db.query.splitPayments.findMany({
            where: inArray(schema.splitPayments.splitId, splitIds)
        }) : [];

        const userTaxProfiles = await ctx.db.query.taxProfiles.findMany({ where: eq(schema.taxProfiles.userId, ctx.userId) });
        const userTaxPayments = await ctx.db.query.taxEstimatedPayments.findMany({ where: eq(schema.taxEstimatedPayments.userId, ctx.userId) });
        const exportedTransactionIds = new Set(userTransactions.map(t => t.id));

        // 4. Record export attempt
        await ctx.db.insert(exportHistories).values({
            userId: ctx.userId,
        });

        // 5. Fetch additional data (settings, subscriptions)
        const userSettingsData = await ctx.db.query.userSettings.findMany({ where: eq(schema.userSettings.userId, ctx.userId) });
        const dashboards = await ctx.db.query.dashboardLayouts.findMany({ where: eq(schema.dashboardLayouts.userId, ctx.userId) });
        const userSubscriptions = await ctx.db.query.subscriptions.findMany({ where: eq(schema.subscriptions.userId, ctx.userId) });
        const subscriptionIds = userSubscriptions.map(s => s.id);
        const userSubscriptionPayments = subscriptionIds.length ? await ctx.db.query.subscriptionPayments.findMany({
            where: inArray(schema.subscriptionPayments.subscriptionId, subscriptionIds)
        }) : [];

        // Family tables are deliberately excluded: they contain other members' data.
        return {
            timestamp: new Date().toISOString(),
            version: 1,
            data: {
                taxProfiles: stripUserId(userTaxProfiles),
                taxEstimatedPayments: stripUserId(userTaxPayments.map(p => ({ ...p, transactionId: p.transactionId && exportedTransactionIds.has(p.transactionId) ? p.transactionId : null }))),
                banks: stripUserId(userBanks),
                accounts: userAccounts,
                currencyBalances: balances,
                categories: stripUserId(userCategories),
                transactions: userTransactions,
                debts: stripUserId(userDebts),
                debtPayments: userDebtPayments,
                credits: userCredits,
                creditPayments: userCreditPayments,
                mortgages: userMortgages,
                mortgagePayments: userMortgagePayments,
                deposits: userDeposits,
                stocks: stripUserId(userStocks),
                stockPrices: userStockPrices,
                portfolioHoldings: stripUserId(holdings),
                investmentTransactions: stripUserId(invTransactions),
                subscriptions: stripUserId(userSubscriptions),
                subscriptionPayments: userSubscriptionPayments,
                splitParticipants: stripUserId(userSplitParticipants),
                transactionSplits: userTransactionSplits,
                splitPayments: userSplitPayments,
                userSettings: stripUserId(userSettingsData),
                dashboardLayouts: stripUserId(dashboards),
            }
        };
    }),

    importData: protectedProcedure
        .input(importDataSchema)
        .mutation(async ({ ctx, input }) => {
            let data = parseDates(input.data);
            data = remapIds(data);

            if (!data || typeof data !== 'object') {
                throw new TRPCError({
                    code: 'BAD_REQUEST',
                    message: 'Invalid data format'
                });
            }

            const summary = await ctx.db.transaction(async (tx) => {
                // Merge import data into the current account without wiping existing records.
                const withUser = (items: any[]) => items.map(i => ({ ...i, userId: ctx.userId }));
                const keyOf = (...parts: unknown[]) => parts.map(part => String(part ?? '')).join('\u0000');
                const bankIdMap = new Map<string, string>();
                const accountIdMap = new Map<string, string>();
                const currencyBalanceIdMap = new Map<string, string>();

                // Track valid IDs for foreign key filtering
                const validBankIds = new Set<string>();
                const validAccountIds = new Set<string>();
                const validCurrencyBalanceIds = new Set<string>();
                const validCategoryIds = new Set<string>();
                const validDebtIds = new Set<string>();
                const validCreditIds = new Set<string>();
                const validMortgageIds = new Set<string>();
                const validStockIds = new Set<string>();
                const validSubscriptionIds = new Set<string>();
                const validTransactionIds = new Set<string>();
                const validParticipantIds = new Set<string>();
                const validSplitIds = new Set<string>();

                // First, get all default categories (userId is null) from the database
                // These are valid targets for transactions even if not in the import data
                const defaultCategories = await tx.query.categories.findMany({
                    where: isNull(schema.categories.userId),
                    columns: { id: true }
                });
                defaultCategories.forEach((c) => validCategoryIds.add(c.id));

                // Insert categories and track valid IDs
                if (data.categories?.length) {
                    await tx.insert(schema.categories).values(withUser(data.categories));
                    data.categories.forEach((c: { id: string }) => validCategoryIds.add(c.id));
                }

                // Insert or reuse banks by name in the current live/test mode.
                if (data.banks?.length) {
                    const existingBanks = await tx.query.banks.findMany({
                        where: and(
                            eq(schema.banks.userId, ctx.userId),
                            eq(schema.banks.isTest, ctx.user.testMode)
                        ),
                        columns: { id: true, name: true, isTest: true },
                    });
                    const existingBankByName = new Map(
                        existingBanks.map(bank => [keyOf(bank.name, bank.isTest), bank.id])
                    );
                    const banksToInsert: any[] = [];

                    for (const bank of data.banks) {
                        const bankKey = keyOf(bank.name, ctx.user.testMode);
                        const existingBankId = existingBankByName.get(bankKey);

                        if (existingBankId) {
                            bankIdMap.set(bank.id, existingBankId);
                            validBankIds.add(existingBankId);
                            continue;
                        }

                        banksToInsert.push({
                            ...bank,
                            userId: ctx.userId,
                            isTest: ctx.user.testMode,
                        });
                        bankIdMap.set(bank.id, bank.id);
                        validBankIds.add(bank.id);
                        existingBankByName.set(bankKey, bank.id);
                    }

                    if (banksToInsert.length > 0) {
                        await tx.insert(schema.banks).values(banksToInsert);
                    }
                }

                // Insert or reuse accounts by bank/name/type, remapping child records accordingly.
                if (data.accounts?.length) {
                    const bankIds = Array.from(validBankIds);
                    const existingAccounts = bankIds.length ? await tx.query.accounts.findMany({
                        where: inArray(schema.accounts.bankId, bankIds),
                        columns: { id: true, bankId: true, name: true, type: true },
                    }) : [];
                    const existingAccountByKey = new Map(
                        existingAccounts.map(account => [keyOf(account.bankId, account.name, account.type), account.id])
                    );
                    const accountsToInsert: any[] = [];

                    for (const account of data.accounts) {
                        const bankId = bankIdMap.get(account.bankId);
                        if (!bankId) continue;

                        const accountKey = keyOf(bankId, account.name, account.type);
                        const existingAccountId = existingAccountByKey.get(accountKey);

                        if (existingAccountId) {
                            accountIdMap.set(account.id, existingAccountId);
                            validAccountIds.add(existingAccountId);
                            continue;
                        }

                        const accountToInsert = { ...account, bankId };
                        accountsToInsert.push(accountToInsert);
                        accountIdMap.set(account.id, account.id);
                        validAccountIds.add(account.id);
                        existingAccountByKey.set(accountKey, account.id);
                    }

                    if (accountsToInsert.length > 0) {
                        await tx.insert(schema.accounts).values(accountsToInsert);
                    }
                }

                // Ensure currencies exist before inserting currency balances
                if (data.currencyBalances?.length) {
                    const accountIds = Array.from(validAccountIds);
                    const existingBalances = accountIds.length ? await tx.query.currencyBalances.findMany({
                        where: inArray(schema.currencyBalances.accountId, accountIds),
                        columns: { id: true, accountId: true, currencyCode: true },
                    }) : [];
                    const existingBalanceByKey = new Map(
                        existingBalances.map(balance => [keyOf(balance.accountId, balance.currencyCode), balance.id])
                    );
                    const validBalances: any[] = [];

                    for (const balance of data.currencyBalances) {
                        const accountId = accountIdMap.get(balance.accountId);
                        if (!accountId) continue;

                        const balanceKey = keyOf(accountId, balance.currencyCode);
                        const existingBalanceId = existingBalanceByKey.get(balanceKey);

                        if (existingBalanceId) {
                            currencyBalanceIdMap.set(balance.id, existingBalanceId);
                            validCurrencyBalanceIds.add(existingBalanceId);
                            continue;
                        }

                        validBalances.push({ ...balance, accountId });
                        currencyBalanceIdMap.set(balance.id, balance.id);
                        validCurrencyBalanceIds.add(balance.id);
                        existingBalanceByKey.set(balanceKey, balance.id);
                    }

                    if (validBalances.length > 0) {
                        const currencyCodes = Array.from(new Set<string>(validBalances.map((cb: { currencyCode: string }) => cb.currencyCode)));

                        // Get existing currencies in DB
                        const existingCurrencies = await tx.query.currencies.findMany({
                            columns: { code: true }
                        });
                        const existingCodes = new Set(existingCurrencies.map(c => c.code));

                        // Find missing currencies and insert them
                        const missingCodes = currencyCodes.filter(code => !existingCodes.has(code));
                        if (missingCodes.length > 0) {
                            const currenciesToInsert = missingCodes.map((code: string) => {
                                const defaultCurrency = DEFAULT_CURRENCIES.find(c => c.code === code);
                                return defaultCurrency ?? {
                                    code,
                                    name: code,
                                    symbol: code,
                                    decimalPlaces: 2
                                };
                            });
                            await tx.insert(schema.currencies).values(currenciesToInsert).onConflictDoNothing();
                        }

                        await tx.insert(schema.currencyBalances).values(validBalances);
                    }
                }

                // Filter and insert credits (must reference valid accounts)
                if (data.credits?.length) {
                    const validCredits = data.credits
                        .map((credit: any) => {
                            const accountId = accountIdMap.get(credit.accountId);
                            return accountId ? { ...credit, accountId } : null;
                        })
                        .filter(Boolean);
                    if (validCredits.length > 0) {
                        await tx.insert(schema.credits).values(validCredits);
                        validCredits.forEach((c: { id: string }) => validCreditIds.add(c.id));
                    }
                }

                // Filter and insert credit payments (must reference valid credits)
                if (data.creditPayments?.length) {
                    const validCreditPayments = data.creditPayments.filter((cp: { creditId: string }) => validCreditIds.has(cp.creditId));
                    if (validCreditPayments.length > 0) {
                        await tx.insert(schema.creditPayments).values(validCreditPayments);
                    }
                }

                // Filter and insert mortgages (must reference valid accounts)
                if (data.mortgages?.length) {
                    const validMortgages = data.mortgages
                        .map((mortgage: any) => {
                            const accountId = accountIdMap.get(mortgage.accountId);
                            return accountId ? { ...mortgage, accountId } : null;
                        })
                        .filter(Boolean);
                    if (validMortgages.length > 0) {
                        await tx.insert(schema.mortgages).values(validMortgages);
                        validMortgages.forEach((m: { id: string }) => validMortgageIds.add(m.id));
                    }
                }

                // Filter and insert mortgage payments (must reference valid mortgages)
                if (data.mortgagePayments?.length) {
                    const validMortgagePayments = data.mortgagePayments.filter((mp: { mortgageId: string }) => validMortgageIds.has(mp.mortgageId));
                    if (validMortgagePayments.length > 0) {
                        await tx.insert(schema.mortgagePayments).values(validMortgagePayments);
                    }
                }

                // Filter and insert deposits (must reference valid accounts)
                if (data.deposits?.length) {
                    const validDeposits = data.deposits
                        .map((deposit: any) => {
                            const accountId = accountIdMap.get(deposit.accountId);
                            return accountId ? { ...deposit, accountId } : null;
                        })
                        .filter(Boolean);
                    if (validDeposits.length > 0) {
                        await tx.insert(schema.deposits).values(validDeposits);
                    }
                }

                // Insert debts and track valid IDs
                if (data.debts?.length) {
                    const validDebts = data.debts
                        .map((debt: any) => {
                            const currencyBalanceId = debt.currencyBalanceId
                                ? currencyBalanceIdMap.get(debt.currencyBalanceId)
                                : debt.currencyBalanceId;

                            if (debt.currencyBalanceId && !currencyBalanceId) return null;

                            return {
                                ...debt,
                                currencyBalanceId,
                                linkedUserId: debt.linkedUserId === ctx.userId ? ctx.userId : null,
                                isTest: ctx.user.testMode,
                            };
                        })
                        .filter(Boolean);

                    if (validDebts.length > 0) {
                        await tx.insert(schema.debts).values(withUser(validDebts));
                        validDebts.forEach((d: { id: string }) => validDebtIds.add(d.id));
                    }
                }

                // Filter and insert debt payments (must reference valid debts)
                if (data.debtPayments?.length) {
                    const validDebtPayments = data.debtPayments.filter((dp: { debtId: string }) => validDebtIds.has(dp.debtId));
                    if (validDebtPayments.length > 0) {
                        await tx.insert(schema.debtPayments).values(validDebtPayments);
                    }
                }

                // Filter and insert transactions (must reference valid categories and currency balances)
                if (data.transactions?.length) {
                    const validTransactions = data.transactions
                        .map((transaction: any) => {
                            const currencyBalanceId = currencyBalanceIdMap.get(transaction.currencyBalanceId);
                            const toCurrencyBalanceId = transaction.toCurrencyBalanceId
                                ? currencyBalanceIdMap.get(transaction.toCurrencyBalanceId)
                                : transaction.toCurrencyBalanceId;

                            if (!currencyBalanceId || (transaction.toCurrencyBalanceId && !toCurrencyBalanceId)) {
                                return null;
                            }

                            return {
                                ...transaction,
                                currencyBalanceId,
                                toCurrencyBalanceId,
                            };
                        })
                        .filter((t: any): t is any => Boolean(t) && validCategoryIds.has(t.categoryId));

                    if (validTransactions.length > 0) {
                        await tx.insert(schema.transactions).values(validTransactions);
                        validTransactions.forEach((t: { id: string }) => validTransactionIds.add(t.id));
                    }

                    const skippedCount = data.transactions.length - validTransactions.length;
                    if (skippedCount > 0) {
                        console.warn(`Skipped ${skippedCount} transactions with missing references during import`);
                    }
                }

                // Insert stocks and track valid IDs
                if (data.stocks?.length) {
                    await tx.insert(schema.stocks).values(withUser(data.stocks));
                    data.stocks.forEach((s: { id: string }) => validStockIds.add(s.id));
                }

                // Filter and insert stock prices (must reference valid stocks)
                if (data.stockPrices?.length) {
                    const validStockPrices = data.stockPrices.filter((sp: { stockId: string }) => validStockIds.has(sp.stockId));
                    if (validStockPrices.length > 0) {
                        await tx.insert(schema.stockPrices).values(validStockPrices);
                    }
                }

                // Filter and insert portfolio holdings (must reference valid stocks)
                if (data.portfolioHoldings?.length) {
                    const validHoldings = data.portfolioHoldings.filter((h: { stockId: string }) => validStockIds.has(h.stockId));
                    if (validHoldings.length > 0) {
                        await tx.insert(schema.portfolioHoldings).values(withUser(validHoldings));
                    }
                }

                // Filter and insert investment transactions (must reference valid stocks)
                if (data.investmentTransactions?.length) {
                    const validInvTx = data.investmentTransactions.filter((it: { stockId: string }) => validStockIds.has(it.stockId));
                    if (validInvTx.length > 0) {
                        await tx.insert(schema.investmentTransactions).values(withUser(validInvTx));
                    }
                }

                // Insert subscriptions and track valid IDs
                if (data.subscriptions?.length) {
                    await tx.insert(schema.subscriptions).values(withUser(data.subscriptions));
                    data.subscriptions.forEach((s: { id: string }) => validSubscriptionIds.add(s.id));
                }

                // Filter and insert subscription payments (must reference valid subscriptions)
                if (data.subscriptionPayments?.length) {
                    const validSubPayments = data.subscriptionPayments.filter((sp: { subscriptionId: string }) => validSubscriptionIds.has(sp.subscriptionId));
                    if (validSubPayments.length > 0) {
                        await tx.insert(schema.subscriptionPayments).values(validSubPayments);
                    }
                }

                // Insert split participants and track valid IDs
                if (data.splitParticipants?.length) {
                    await tx.insert(schema.splitParticipants).values(withUser(data.splitParticipants));
                    data.splitParticipants.forEach((p: { id: string }) => validParticipantIds.add(p.id));
                }

                // Filter and insert transaction splits (must reference valid transactions AND participants)
                if (data.transactionSplits?.length) {
                    const validSplits = data.transactionSplits.filter((ts: { transactionId: string; participantId: string }) =>
                        validTransactionIds.has(ts.transactionId) && validParticipantIds.has(ts.participantId)
                    );
                    if (validSplits.length > 0) {
                        await tx.insert(schema.transactionSplits).values(validSplits);
                        validSplits.forEach((s: { id: string }) => validSplitIds.add(s.id));
                    }
                }

                // Filter and insert split payments (must reference valid splits)
                if (data.splitPayments?.length) {
                    const validSplitPayments = data.splitPayments.filter((sp: { splitId: string }) => validSplitIds.has(sp.splitId));
                    if (validSplitPayments.length > 0) {
                        await tx.insert(schema.splitPayments).values(validSplitPayments);
                    }
                }

                // Replace tax years supplied by this backup; preserve other years and
                // the existing merge-import behavior for all other entities.
                const taxYears = [...new Set<number>((data.taxProfiles ?? []).map((p: { taxYear: number }) => p.taxYear))];
                if (taxYears.length) {
                    await tx.delete(schema.taxProfiles).where(and(eq(schema.taxProfiles.userId, ctx.userId), inArray(schema.taxProfiles.taxYear, taxYears)));
                    await tx.insert(schema.taxProfiles).values(withUser(data.taxProfiles));
                }
                const paymentYears = [...new Set<number>((data.taxEstimatedPayments ?? []).map((p: { taxYear: number }) => p.taxYear))];
                if (paymentYears.length) {
                    await tx.delete(schema.taxEstimatedPayments).where(and(eq(schema.taxEstimatedPayments.userId, ctx.userId), inArray(schema.taxEstimatedPayments.taxYear, paymentYears)));
                    await tx.insert(schema.taxEstimatedPayments).values(withUser(data.taxEstimatedPayments.map((p: { transactionId: string | null }) => ({
                        ...p, transactionId: p.transactionId && validTransactionIds.has(p.transactionId) ? p.transactionId : null,
                    }))));
                }

                // Insert user settings
                if (data.userSettings?.length) {
                    await tx.insert(schema.userSettings).values(withUser(data.userSettings)).onConflictDoNothing();
                }

                // Insert dashboard layouts
                if (data.dashboardLayouts?.length) {
                    await tx.insert(schema.dashboardLayouts).values(withUser(data.dashboardLayouts)).onConflictDoNothing();
                }

                return {
                    banks: validBankIds.size,
                    accounts: validAccountIds.size,
                    currencyBalances: validCurrencyBalanceIds.size,
                    transactions: validTransactionIds.size,
                    categories: validCategoryIds.size,
                };
            });

            await invalidateUserFinancialCaches(ctx.userId);
            await investingCache.invalidatePattern(`*:${ctx.userId}`);

            return { success: true, summary };
        }),
});
