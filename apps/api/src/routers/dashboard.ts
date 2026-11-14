import { z } from 'zod';
import { and, desc, eq, gte, inArray, lte } from 'drizzle-orm';
import { router, protectedProcedure } from '../lib/trpc';
import { banks, dashboardLayouts, transactions } from '../db/schema';
import { cache, CACHE_KEYS, CACHE_TTL } from '../lib/redis';

// Define the layout item schema (based on react-grid-layout)
const layoutItemSchema = z.object({
    i: z.string(),
    x: z.number(),
    y: z.number(),
    w: z.number(),
    h: z.number(),
    minW: z.number().optional(),
    maxW: z.number().optional(),
    minH: z.number().optional(),
    maxH: z.number().optional(),
});

// Schema for multi-breakpoint layouts
const responsiveLayoutsSchema = z.object({
    lg: z.array(layoutItemSchema),
    md: z.array(layoutItemSchema),
    sm: z.array(layoutItemSchema),
    xs: z.array(layoutItemSchema),
});

// Widget registry with creation dates
// This will be used to determine if a widget is "new" for existing users
export const WIDGET_REGISTRY: Record<string, { name: string; description: string; createdAt: string; version: string }> = {
    totalBalance: { name: 'Total Balance', description: 'Your total account balance', createdAt: '2025-01-01', version: '1.0.0' },
    monthlyIncome: { name: 'Monthly Income', description: 'Income for current month', createdAt: '2025-01-01', version: '1.0.0' },
    monthlyExpenses: { name: 'Monthly Expenses', description: 'Expenses for current month', createdAt: '2025-01-01', version: '1.0.0' },
    debts: { name: 'Debts', description: 'Personal debts', createdAt: '2025-01-01', version: '1.0.0' },
    categoryChart: { name: 'Category Chart', description: 'Spending by category', createdAt: '2025-01-01', version: '1.0.0' },
    spendingChart: { name: 'Spending Chart', description: 'Spending over time', createdAt: '2025-01-01', version: '1.0.0' },
    mortgages: { name: 'Mortgages', description: 'Mortgage loans', createdAt: '2025-01-01', version: '1.0.0' },
    recentTransactions: { name: 'Recent Transactions', description: 'Latest transactions', createdAt: '2025-01-01', version: '1.0.0' },
    credits: { name: 'Credits', description: 'Credit cards', createdAt: '2025-01-01', version: '1.0.0' },
    deposits: { name: 'Deposits', description: 'Bank deposits', createdAt: '2025-01-01', version: '1.0.0' },
    subscriptions: { name: 'Subscriptions', description: 'Recurring subscriptions', createdAt: '2025-01-01', version: '1.0.0' },
    // New widgets - January 31, 2026
    currencyExchange: { name: 'Currency Exchange', description: 'Live currency rates', createdAt: '2026-01-31', version: '1.0.0' },
    investmentPortfolio: { name: 'Investment Portfolio', description: 'Your investment holdings', createdAt: '2026-01-31', version: '1.0.0' },
    investmentPerformance: { name: 'Investment Performance', description: 'Portfolio performance metrics', createdAt: '2026-01-31', version: '1.0.0' },
    assetAllocation: { name: 'Asset Allocation', description: 'Portfolio distribution', createdAt: '2026-01-31', version: '1.0.0' },
};

export const dashboardRouter = router({
    getSummary: protectedProcedure.query(async ({ ctx }) => {
        const cacheKey = CACHE_KEYS.userDashboard(ctx.userId!, ctx.user.testMode);
        const cached = await cache.get<any>(cacheKey);
        if (cached) {
            console.log('📦 Using cached dashboard summary');
            return cached;
        }

        const now = new Date();
        const currentStart = new Date(now.getFullYear(), now.getMonth(), 1);
        const prevStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const prevEnd = new Date(now.getFullYear(), now.getMonth(), 0);
        const currentStartDate = currentStart.toISOString().split('T')[0];
        const prevStartDate = prevStart.toISOString().split('T')[0];
        const prevEndDate = prevEnd.toISOString().split('T')[0];
        const todayDate = now.toISOString().split('T')[0];

        const hierarchy = await ctx.db.query.banks.findMany({
            where: and(
                eq(banks.userId, ctx.userId!),
                eq(banks.isTest, ctx.user.testMode)
            ),
            with: {
                accounts: {
                    with: {
                        currencyBalances: true,
                    },
                },
            },
        });

        const balanceIds = hierarchy.flatMap(bank =>
            bank.accounts.flatMap(account => account.currencyBalances.map(balance => balance.id))
        );

        const totalBalances: Record<string, number> = {};
        let accountCount = 0;

        for (const bank of hierarchy) {
            for (const account of bank.accounts) {
                accountCount += 1;
                for (const balance of account.currencyBalances) {
                    totalBalances[balance.currencyCode] = (totalBalances[balance.currencyCode] || 0) + Number(balance.balance);
                }
            }
        }

        const monthlyTransactions = balanceIds.length ? await ctx.db.query.transactions.findMany({
            where: and(
                inArray(transactions.currencyBalanceId, balanceIds),
                gte(transactions.date, prevStartDate),
                lte(transactions.date, todayDate),
                eq(transactions.excludeFromMonthlyStats, false),
                eq(transactions.lifecycleStatus, 'active')
            ),
            orderBy: [desc(transactions.date), desc(transactions.createdAt)],
            with: {
                category: true,
                currencyBalance: true,
            },
        }) : [];

        const summarizeType = (type: 'income' | 'expense') => {
            const current = monthlyTransactions.filter(tx =>
                tx.type === type &&
                !tx.parentTransactionId &&
                tx.date >= currentStartDate &&
                tx.date <= todayDate
            );
            const previous = monthlyTransactions.filter(tx =>
                tx.type === type &&
                !tx.parentTransactionId &&
                tx.date >= prevStartDate &&
                tx.date <= prevEndDate
            );

            const currentTotal = current.reduce((sum, tx) => sum + Number(tx.amount), 0);
            const previousTotal = previous.reduce((sum, tx) => sum + Number(tx.amount), 0);
            const byDate: Record<string, number> = {};

            for (const tx of current) {
                byDate[tx.date] = (byDate[tx.date] || 0) + Number(tx.amount);
            }

            const chartData = [];
            const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
            for (let day = 1; day <= daysInMonth; day += 1) {
                const date = new Date(now.getFullYear(), now.getMonth(), day).toISOString().split('T')[0];
                chartData.push({ date, amount: byDate[date] || 0 });
                if (day === now.getDate()) break;
            }

            return {
                total: currentTotal,
                previousTotal,
                count: current.length,
                chartData,
                recent: current.slice(0, 2).map(tx => ({
                    id: tx.id,
                    amount: Number(tx.amount),
                    description: tx.description,
                    date: tx.date,
                    type: tx.type,
                    currency: tx.currencyBalance.currencyCode,
                    category: tx.category ? {
                        name: tx.category.name,
                        icon: tx.category.icon,
                        type: tx.category.type,
                    } : null,
                })),
            };
        };

        const result = {
            accountCount,
            totalBalances,
            monthlyIncome: summarizeType('income'),
            monthlyExpenses: summarizeType('expense'),
            generatedAt: new Date().toISOString(),
        };

        await cache.set(cacheKey, result, CACHE_TTL.dashboard);
        return result;
    }),

    getLayout: protectedProcedure.query(async ({ ctx }) => {
        const layout = await ctx.db.query.dashboardLayouts.findFirst({
            where: eq(dashboardLayouts.userId, ctx.userId!),
        });
        if (!layout) return null;

        // Return the stored layout data as-is
        // Frontend handles migration from old format
        return layout.layout as any;
    }),

    saveLayout: protectedProcedure
        .input(z.object({
            layouts: responsiveLayoutsSchema,
            gridVersion: z.literal(2).optional(),
            hiddenWidgets: z.array(z.string()).optional(),
            manualBreakpoints: z.array(z.enum(['lg', 'md', 'sm', 'xs'])).optional(),
        }))
        .mutation(async ({ ctx, input }) => {
            // Store layouts for all breakpoints
            const layoutData = {
                layouts: input.layouts,
                gridVersion: input.gridVersion,
                hiddenWidgets: input.hiddenWidgets || [],
                manualBreakpoints: input.manualBreakpoints || [],
            };

            await ctx.db
                .insert(dashboardLayouts)
                .values({
                    userId: ctx.userId!,
                    layout: layoutData,
                })
                .onConflictDoUpdate({
                    target: dashboardLayouts.userId,
                    set: {
                        layout: layoutData,
                        updatedAt: new Date(),
                    },
                });
            return { success: true };
        }),

    // Get all widget metadata
    getWidgetRegistry: protectedProcedure.query(() => {
        return WIDGET_REGISTRY;
    }),

    // Check which new widgets should be shown to user based on when they last saved layout
    getNewWidgets: protectedProcedure.query(async ({ ctx }) => {
        const layout = await ctx.db.query.dashboardLayouts.findFirst({
            where: eq(dashboardLayouts.userId, ctx.userId!),
        });

        if (!layout) {
            // New user - all widgets are "old" (should be shown)
            return { newWidgets: [], showAllWidgets: true };
        }

        const lastSavedAt = layout.updatedAt;
        const oneMonthAgo = new Date();
        oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

        // Find widgets created after user's last save
        const newWidgets = Object.entries(WIDGET_REGISTRY)
            .filter(([widgetId, meta]) => {
                const widgetCreatedAt = new Date(meta.createdAt);
                // Widget is new if created after user's last save
                return widgetCreatedAt > lastSavedAt;
            })
            .filter(([widgetId, meta]) => {
                const widgetCreatedAt = new Date(meta.createdAt);
                // And it's less than 1 month old (hide after 1 month)
                return widgetCreatedAt > oneMonthAgo;
            })
            .map(([widgetId]) => widgetId);

        return { newWidgets, showAllWidgets: false };
    }),
});
