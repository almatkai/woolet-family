import { useWidgetLayout } from '@/components/dashboard/WidgetViewport';
import React from 'react';
import { TrendingUp, TrendingDown, Briefcase, ArrowRight, PieChart } from 'lucide-react';
import { trpc } from '@/lib/trpc';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { CurrencyDisplay } from '@/components/CurrencyDisplay';
import { Link } from '@tanstack/react-router';
import { GlassCard, GlassEdge, MetricAura } from '@/components/ui/glass';
import { WidgetFooter } from './WidgetFooter';

type GridParams = { w: number; h: number; breakpoint?: string };

export function InvestmentPortfolioWidget({ gridParams }: { gridParams?: GridParams }) {
    const { data: portfolio, isLoading } = trpc.investing.getPortfolioSummary.useQuery();

    const layout = useWidgetLayout(gridParams);
    const { isNarrow, isShort, isCompact, isTall, isSmallBp, rowLimit } = layout;

    if (isLoading) {
        return (
            <GlassCard className="dashboard-widget widget-tint-green h-full rounded-[28px] p-4">
                <Skeleton className="h-3 w-24 mb-3" />
                <Skeleton className="h-7 w-32 mb-3" />
                <Skeleton className="h-10 w-full rounded-xl" />
            </GlassCard>
        );
    }

    const totalValue = portfolio?.totalPortfolioValue || portfolio?.currentValue || 0;
    const unrealizedPL = portfolio?.unrealizedPL || 0;
    const unrealizedPLPercent = portfolio?.totalReturnPercent ?? portfolio?.unrealizedPLPercent ?? 0;
    const holdings = portfolio?.holdings || [];
    const visibleHoldings = holdings.slice(0, rowLimit);

    return (
        <GlassCard className={cn('dashboard-widget widget-tint-green h-full flex flex-col group rounded-[28px] overflow-hidden', isCompact && 'dashboard-widget--compact')}>
            <MetricAura color="#6EE7B7" cx={85} cy={15} opacity={0.18} />
            <GlassEdge />

            <div className="block flex-1 flex flex-col min-h-0 relative z-10">
                <div className="p-3 pb-1 flex flex-row items-start justify-between hover:bg-white/[0.04] transition-colors rounded-t-xl" data-widget-header>
                    <div className="flex flex-col min-w-0 flex-1">
                        <div className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground/80 mb-0.5" data-widget-label>Investment Portfolio</div>
                        <div className="flex items-baseline gap-2 flex-wrap">
                            <span className="text-lg font-bold tracking-tight whitespace-nowrap text-foreground" data-widget-value>
                                <CurrencyDisplay amount={totalValue} abbreviate={isNarrow || (totalValue > 1000000)} />
                            </span>
                            <div className={cn(
                                "flex items-center text-[10px] font-bold px-1.5 py-0.5 rounded-full",
                                unrealizedPL >= 0 ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/20" : "bg-rose-500/15 text-rose-400 border border-rose-500/20"
                            )}>
                                {unrealizedPL >= 0 ? <TrendingUp className="h-2.5 w-2.5 mr-0.5" /> : <TrendingDown className="h-2.5 w-2.5 mr-0.5" />}
                                {Math.abs(unrealizedPLPercent).toFixed(1)}%
                            </div>
                        </div>
                    </div>
                    <div className="p-1.5 bg-emerald-500/15 rounded-xl border border-emerald-500/25 group-hover:bg-emerald-500/25 transition-colors">
                        <Briefcase className="h-3.5 w-3.5 text-emerald-300" />
                    </div>
                </div>

                <div className="px-3 py-1 flex-1 flex flex-col min-h-0" data-widget-body>
                    <div className="flex-1 space-y-1 overflow-hidden py-1" data-widget-list>
                        {holdings.length === 0 ? (
                            <div className="flex items-center justify-center h-full text-center py-4">
                                <p className="text-[10px] text-muted-foreground italic uppercase tracking-wider">No investments yet</p>
                            </div>
                        ) : (
                            visibleHoldings.map((holding: any) => (
                                <div key={holding.stockId || holding.ticker} className="flex items-center justify-between gap-2 px-2 py-1.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/5 transition-colors group/item" data-widget-row>
                                    <div className="flex items-center gap-1.5 min-w-0 flex-1">
                                        <div className="size-6 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-[9px] font-bold text-emerald-300 shrink-0">
                                            {holding.ticker.slice(0, 3)}
                                        </div>
                                        <div className="flex flex-col min-w-0">
                                            <span className="text-[10px] font-semibold truncate leading-tight text-foreground">{holding.ticker}</span>
                                            <span className="text-[8px] text-muted-foreground uppercase">{holding.quantity} Shares</span>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-[10px] font-bold tabular-nums">
                                            <CurrencyDisplay amount={Number(holding.currentValue)} abbreviate />
                                        </div>
                                        <div className={cn("text-[8px] font-medium", holding.unrealizedPL >= 0 ? "text-emerald-400" : "text-rose-400")}>
                                            {holding.unrealizedPL >= 0 ? '+' : ''}{holding.unrealizedPLPercent?.toFixed(1)}%
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>

            <WidgetFooter visibleItems={visibleHoldings.length} totalItems={holdings.length}>
                <span className="text-[9px] font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                    <PieChart className="h-2.5 w-2.5" />
                    {holdings.length} Positions
                </span>
                <Link to="/investing" className="text-[9px] font-bold text-primary flex items-center gap-0.5 hover:underline uppercase tracking-wider">
                    Analyze <ArrowRight className="h-2.5 w-2.5" />
                </Link>
            </WidgetFooter>
        </GlassCard>
    );
}
