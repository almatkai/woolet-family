import { useWidgetLayout } from '@/components/dashboard/WidgetViewport';
import { TrendingUp } from 'lucide-react';
import { trpc } from '@/lib/trpc';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { CurrencyDisplay } from '@/components/CurrencyDisplay';
import { Area, AreaChart, ResponsiveContainer } from 'recharts';
import { Link } from '@tanstack/react-router';
import { GlassCard, GlassEdge, MetricAura } from '@/components/ui/glass';

type GridParams = { w: number; h: number; breakpoint?: string };

export function MonthlyIncomeWidget({ gridParams }: { gridParams?: GridParams }) {
    const { data: summary, isLoading } = trpc.dashboard.getSummary.useQuery();
    const layout = useWidgetLayout(gridParams);
    const { isNarrow, isCompact } = layout;
    const monthly = summary?.monthlyIncome;
    const totalIncome = monthly?.total ?? 0;
    const prevTotalIncome = monthly?.previousTotal ?? 0;
    const count = monthly?.count ?? 0;
    const chartData = monthly?.chartData ?? [];
    const diff = totalIncome - prevTotalIncome;
    const percentChange = prevTotalIncome > 0 ? (diff / prevTotalIncome) * 100 : 0;

    if (isLoading) {
        return (
            <GlassCard className={cn('dashboard-widget widget-tint-emerald h-full rounded-[28px] p-4', isCompact && 'dashboard-widget--compact')}>
                <Skeleton className="h-3 w-20 mb-2" />
                <Skeleton className="h-7 w-28 mb-3" />
                <Skeleton className="h-10 w-full rounded-xl" />
            </GlassCard>
        );
    }

    return (
        <GlassCard
            className={cn(
                'dashboard-widget widget-tint-emerald h-full flex flex-col group rounded-[28px] relative overflow-hidden',
                isCompact && 'dashboard-widget--compact'
            )}
        >
            <MetricAura color="#10B981" cx={85} cy={12} opacity={0.2} />
            <GlassEdge />

            <div className="widget-metric-main relative z-10 flex-1 flex flex-col justify-between min-h-0">
                {/* Header */}
                <div data-widget-header>
                    <div className="flex items-center justify-between">
                        <span className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground/80" data-widget-label>
                            Money In
                        </span>
                        <div className="size-7 rounded-xl bg-emerald-500/15 border border-emerald-500/25 flex items-center justify-center text-emerald-400">
                            <TrendingUp className="size-3.5" />
                        </div>
                    </div>

                    <div className="mt-1 flex items-baseline gap-2">
                        <span className="text-xl sm:text-2xl font-extrabold tracking-tight text-emerald-400 tabular-nums" data-widget-value>
                            {summary ? <CurrencyDisplay amount={totalIncome} currency={summary?.currency} showSign abbreviate={isNarrow || (totalIncome > 1000000)} /> : '—'}
                        </span>
                        {prevTotalIncome > 0 && (
                            <span className={cn(
                                "text-[10px] font-bold px-1.5 py-0.5 rounded-full",
                                diff >= 0 ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/20" : "bg-rose-500/15 text-rose-400 border border-rose-500/20"
                            )}>
                                {diff >= 0 ? '+' : ''}{percentChange.toFixed(0)}%
                            </span>
                        )}
                    </div>

                    <p data-widget-secondary className="text-[11px] text-muted-foreground mt-0.5 font-medium">
                        {summary ? `${count} ${count === 1 ? 'transaction' : 'transactions'} this month` : 'Totals unavailable'}
                    </p>
                </div>

                {/* Sparkline */}
                <div data-widget-chart className="widget-sparkline w-full opacity-75 group-hover:opacity-100 transition-opacity">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={chartData}>
                            <defs>
                                <linearGradient id="incomeSparkFill" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="#10B981" stopOpacity={0.35} />
                                    <stop offset="100%" stopColor="#10B981" stopOpacity={0.0} />
                                </linearGradient>
                            </defs>
                            <Area
                                type="monotone"
                                dataKey="amount"
                                stroke="#10B981"
                                strokeWidth={2}
                                fill="url(#incomeSparkFill)"
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
