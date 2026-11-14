import { useWidgetLayout } from '@/components/dashboard/WidgetViewport';
import React from 'react';
import { TrendingDown, ArrowDownRight } from 'lucide-react';
import { trpc } from '@/lib/trpc';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { CurrencyDisplay } from '@/components/CurrencyDisplay';
import { Area, AreaChart, ResponsiveContainer } from 'recharts';
import { Link } from '@tanstack/react-router';
import { startOfMonth, subMonths, endOfMonth, format } from 'date-fns';
import { GlassCard, GlassEdge, MetricAura } from '@/components/ui/glass';

interface Transaction {
    id: string;
    amount: string | number;
    description?: string | null;
    date: string;
    type: string;
    parentTransactionId?: string | null;
    category?: {
        name: string;
        icon: string;
        type: string;
    } | null;
    currencyBalance?: {
        currencyCode: string;
    };
}

type GridParams = { w: number; h: number; breakpoint?: string };

export function MonthlyExpensesWidget({ gridParams }: { gridParams?: GridParams }) {
    const now = new Date();
    const currentStart = startOfMonth(now);
    const prevStart = startOfMonth(subMonths(now, 1));
    const prevEnd = endOfMonth(prevStart);

    const { data: expenseData, isLoading: isCurrentLoading } = trpc.transaction.list.useQuery({
        type: 'expense',
        startDate: currentStart.toISOString(),
        excludeFromStats: false,
        limit: 100
    }) as { data: { transactions: Transaction[], total: number } | undefined, isLoading: boolean };

    const { data: prevExpenseData, isLoading: isPrevLoading } = trpc.transaction.list.useQuery({
        type: 'expense',
        startDate: prevStart.toISOString(),
        endDate: prevEnd.toISOString(),
        excludeFromStats: false,
        limit: 100
    }) as { data: { transactions: Transaction[], total: number } | undefined, isLoading: boolean };

    const isLoading = isCurrentLoading || isPrevLoading;

    const layout = useWidgetLayout(gridParams);
    const { isNarrow, isShort, isCompact, isTall, isSmallBp, rowLimit } = layout;

    const transactions = expenseData?.transactions || [];
    const totalExpense = transactions.reduce((sum: number, t: Transaction) => sum + Math.abs(Number(t.amount)), 0);
    
    const prevTransactions = prevExpenseData?.transactions || [];
    const prevTotalExpense = prevTransactions.reduce((sum: number, t: Transaction) => sum + Math.abs(Number(t.amount)), 0);
    
    const diff = totalExpense - prevTotalExpense;
    const percentChange = prevTotalExpense > 0 ? (diff / prevTotalExpense) * 100 : 0;

    // Chart data - grouped by day
    const chartData = React.useMemo(() => {
        const grouped: Record<string, number> = {};
        transactions.forEach(t => {
            const day = t.date.split('T')[0];
            grouped[day] = (grouped[day] || 0) + Math.abs(Number(t.amount));
        });
        
        const result = [];
        const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
        for (let d = 1; d <= daysInMonth; d++) {
            const dateStr = format(new Date(now.getFullYear(), now.getMonth(), d), 'yyyy-MM-dd');
            result.push({
                date: dateStr,
                amount: grouped[dateStr] || 0
            });
            if (d === now.getDate()) break;
        }
        return result;
    }, [transactions, now]);

    if (isLoading) {
        return (
            <GlassCard className={cn('dashboard-widget widget-tint-rose h-full rounded-[28px] p-4', isCompact && 'dashboard-widget--compact')}>
                <Skeleton className="h-3 w-20 mb-2" />
                <Skeleton className="h-7 w-28 mb-3" />
                <Skeleton className="h-10 w-full rounded-xl" />
            </GlassCard>
        );
    }

    return (
        <GlassCard
            className={cn(
                'dashboard-widget widget-tint-rose h-full flex flex-col group rounded-[28px] relative overflow-hidden',
                isCompact && 'dashboard-widget--compact'
            )}
        >
            <MetricAura color="#F43F5E" cx={85} cy={12} opacity={0.2} />
            <GlassEdge />

            <div className="widget-metric-main relative z-10 flex-1 flex flex-col justify-between min-h-0">
                {/* Header */}
                <div data-widget-header>
                    <div className="flex items-center justify-between">
                        <span className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground/80" data-widget-label>
                            Money Out
                        </span>
                        <div className="size-7 rounded-xl bg-rose-500/15 border border-rose-500/25 flex items-center justify-center text-rose-400">
                            <TrendingDown className="size-3.5" />
                        </div>
                    </div>

                    <div className="mt-1 flex items-baseline gap-2">
                        <span className="text-xl sm:text-2xl font-extrabold tracking-tight text-rose-400 tabular-nums" data-widget-value>
                            <CurrencyDisplay amount={-totalExpense} abbreviate={isNarrow || (totalExpense > 1000000)} />
                        </span>
                        {prevTotalExpense > 0 && (
                            <span className={cn(
                                "text-[10px] font-bold px-1.5 py-0.5 rounded-full",
                                diff <= 0 ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/20" : "bg-rose-500/15 text-rose-400 border border-rose-500/20"
                            )}>
                                {diff <= 0 ? '−' : '+'}{Math.abs(percentChange).toFixed(0)}%
                            </span>
                        )}
                    </div>

                    <p data-widget-secondary className="text-[11px] text-muted-foreground mt-0.5 font-medium">
                        {transactions.length} {transactions.length === 1 ? 'transaction' : 'transactions'} this month
                    </p>
                </div>

                {/* Sparkline */}
                <div data-widget-chart className="widget-sparkline w-full opacity-75 group-hover:opacity-100 transition-opacity">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={chartData}>
                            <defs>
                                <linearGradient id="expenseSparkFill" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="#F43F5E" stopOpacity={0.35} />
                                    <stop offset="100%" stopColor="#F43F5E" stopOpacity={0.0} />
                                </linearGradient>
                            </defs>
                            <Area
                                type="monotone"
                                dataKey="amount"
                                stroke="#F43F5E"
                                strokeWidth={2}
                                fill="url(#expenseSparkFill)"
                                isAnimationActive={false}
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
                <Link to="/spending" className="mt-2 self-end text-[11px] font-bold text-primary hover:underline">Details →</Link>
            </div>
        </GlassCard>
    );
}
