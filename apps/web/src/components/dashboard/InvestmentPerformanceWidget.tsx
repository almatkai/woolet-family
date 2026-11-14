import { useWidgetLayout } from '@/components/dashboard/WidgetViewport';
import React, { useId } from 'react';
import { Link } from '@tanstack/react-router';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { BarChart3, ArrowRight, LineChart as LineChartIcon } from 'lucide-react';
import { trpc } from '@/lib/trpc';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { CurrencyDisplay } from '@/components/CurrencyDisplay';
import { ResponsiveContainer, XAxis, YAxis, Area, AreaChart, CartesianGrid, Tooltip, ReferenceDot } from 'recharts';
import { WidgetFooter } from './WidgetFooter';

type GridParams = { w: number; h: number; breakpoint?: string };

export function InvestmentPerformanceWidget({ gridParams }: { gridParams?: GridParams }) {
    const { data: portfolio, isLoading: portfolioLoading } = trpc.investing.getPortfolioSummary.useQuery();
    const { data: chartData, isLoading: chartLoading } = trpc.investing.getPortfolioChart.useQuery(
        { range: '1M' }
    );

    const layout = useWidgetLayout(gridParams);
    const { isNarrow, isShort, isCompact, isTall, isSmallBp, rowLimit } = layout;

    const gradientId = `portfolio-${useId().replace(/:/g, '')}`;
    const isLoading = portfolioLoading || chartLoading;

    if (isLoading) {
        return (
            <Card className="dashboard-widget widget-tint-cyan h-full rounded-[32px] overflow-hidden">
                <CardHeader className="p-3 pb-2" data-widget-header>
                    <Skeleton className="h-4 w-24" />
                </CardHeader>
                <CardContent className="p-3 pt-0" data-widget-body>
                    <Skeleton className="h-8 w-32 mb-4" />
                    <Skeleton className="h-12 w-full" />
                </CardContent>
            </Card>
        );
    }

    const totalValue = portfolio?.currentValue || 0;
    const totalROI = portfolio?.totalReturnPercent || 0;
    const totalPL = portfolio?.unrealizedPL || 0;

    const formattedChartData = chartData?.map((item: any) => ({
        date: item.date,
        value: Number(item.value),
    })).filter((item: { date: string; value: number }) => Number.isFinite(item.value) && Number.isFinite(new Date(item.date).getTime())) || [];
    const detailedChart = layout.width >= 320 && layout.height >= 280;
    const lastPoint = formattedChartData[formattedChartData.length - 1];
    const chartValues = formattedChartData.map((item: { value: number }) => item.value);
    const minimum = Math.min(...chartValues);
    const maximum = Math.max(...chartValues);
    const padding = Math.max((maximum - minimum) * .18, maximum * .01, 1);
    const axisAmount = (value: number) => Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1 }).format(value);
    const dateLabel = (date: string) => new Date(date).toLocaleDateString('en', { month: 'short', day: 'numeric' });

    return (
        <Card className={cn('dashboard-widget widget-tint-cyan h-full flex flex-col group rounded-[32px] overflow-hidden', isCompact && 'dashboard-widget--compact')}>
            <div className="block flex-1 flex flex-col min-h-0">
                <CardHeader className="p-3 pb-1 flex flex-row items-start justify-between hover:bg-muted/30 transition-colors rounded-t-xl" data-widget-header>
                    <div className="flex flex-col min-w-0 flex-1">
                        <div className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-0.5" data-widget-label>Portfolio Growth</div>
                        <div className="flex items-baseline gap-2 flex-wrap">
                            <span className="text-lg font-bold tracking-tight whitespace-nowrap" data-widget-value>
                                {totalROI >= 0 ? '+' : ''}{totalROI.toFixed(2)}%
                            </span>
                            <div className={cn(
                                "flex items-center text-[10px] font-bold px-1 py-0 rounded-full",
                                totalPL >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"
                            )}>
                                <CurrencyDisplay amount={totalPL} showSign abbreviate />
                            </div>
                        </div>
                    </div>
                    <div className="p-1.5 bg-indigo-500/10 rounded-md group-hover:bg-indigo-500/20 transition-colors">
                        <BarChart3 className="h-4 w-4 text-indigo-500" />
                    </div>
                </CardHeader>

                <CardContent className="px-3 py-1 flex-1 flex flex-col min-h-0 relative" data-widget-body>
                    {layout.showChartDetails && (
                        <div className="flex items-center justify-between gap-3 mb-3 shrink-0 text-[11px] text-muted-foreground">
                            <span>Portfolio value <span className="ml-2 font-semibold text-foreground tabular-nums">{totalValue.toLocaleString('en', { maximumFractionDigits: 2 })}</span></span>
                            <span className="shrink-0">Last 30 days</span>
                        </div>
                    )}
                    <div data-widget-chart className="relative flex-1 min-h-0" aria-label="Portfolio value over the last 30 days">
                        {formattedChartData.length ? (
                            <div className="absolute inset-0">
                                <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                                    <AreaChart data={formattedChartData} margin={{ top: 16, right: detailedChart ? 18 : 8, bottom: 0, left: 0 }} accessibilityLayer>
                                        <defs>
                                            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="0%" stopColor="#22d3ee" stopOpacity={.32} />
                                                <stop offset="100%" stopColor="#22d3ee" stopOpacity={.015} />
                                            </linearGradient>
                                        </defs>
                                        {detailedChart && <CartesianGrid vertical={false} stroke="currentColor" strokeOpacity={.09} strokeDasharray="3 6" />}
                                        <XAxis dataKey="date" hide={!detailedChart} axisLine={false} tickLine={false} minTickGap={40} tickMargin={10} height={30} tick={{ fill: '#94a3b8', fontSize: 10 }} tickFormatter={dateLabel} />
                                        <YAxis hide={!detailedChart} domain={[minimum - padding, maximum + padding]} width={48} axisLine={false} tickLine={false} tickCount={4} tick={{ fill: '#94a3b8', fontSize: 10 }} tickFormatter={axisAmount} />
                                        <Tooltip cursor={{ stroke: '#22d3ee', strokeOpacity: .4, strokeDasharray: '4 4' }}
                                            content={({ active, payload, label }) => active && payload?.length ? (
                                                <div className="rounded-xl border border-cyan-400/20 bg-background/95 px-3 py-2 shadow-xl backdrop-blur-xl">
                                                    <div className="text-[10px] text-muted-foreground mb-1">{dateLabel(String(label))}</div>
                                                    <div className="text-sm font-semibold tabular-nums text-cyan-500 dark:text-cyan-300">{Number(payload[0].value).toLocaleString('en', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                                                </div>
                                            ) : null} />
                                        <Area type="monotone" dataKey="value" name="Portfolio value" stroke="#22d3ee" strokeWidth={2.5} fill={`url(#${gradientId})`} isAnimationActive={false}
                                            dot={formattedChartData.length === 1 ? { r: 4, fill: '#22d3ee', stroke: '#083344', strokeWidth: 2 } : false}
                                            activeDot={{ r: 5, fill: '#22d3ee', stroke: '#083344', strokeWidth: 3 }} />
                                        {lastPoint && formattedChartData.length > 1 && <ReferenceDot x={lastPoint.date} y={lastPoint.value} r={4} fill="#22d3ee" stroke="#083344" strokeWidth={2} />}
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        ) : (
                            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-center text-muted-foreground">
                                <LineChartIcon className="size-6 text-cyan-500/60" />
                                <span className="text-xs">No price history for the last 30 days</span>
                                <span className="text-[10px]">Your current portfolio value is {totalValue.toLocaleString('en', { maximumFractionDigits: 2 })}</span>
                            </div>
                        )}
                    </div>
                </CardContent>
            </div>

            <WidgetFooter>
                <span className="text-[9px] font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                    <LineChartIcon className="h-2.5 w-2.5" />
                    Last 30 Days
                </span>
                <Link to="/investing" className="text-[9px] font-bold text-primary flex items-center gap-0.5 hover:underline uppercase tracking-wider">
                    Returns <ArrowRight className="h-2.5 w-2.5" />
                </Link>
            </WidgetFooter>
        </Card>
    );
}
