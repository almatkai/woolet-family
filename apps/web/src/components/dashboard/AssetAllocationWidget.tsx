import { useWidgetLayout } from '@/components/dashboard/WidgetViewport';
import React from 'react';
import { Link } from '@tanstack/react-router';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { PieChart as PieChartIcon, ArrowRight, Wallet } from 'lucide-react';
import { trpc } from '@/lib/trpc';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { CurrencyDisplay } from '@/components/CurrencyDisplay';
import { VoronoiTreemap } from '@/components/charts/VoronoiTreemap';
import { WidgetFooter } from './WidgetFooter';

type GridParams = { w: number; h: number; breakpoint?: string };

interface AllocationItem {
    name: string;
    fullName?: string;
    value: number;
    formattedValue?: string;
    percentage: number;
    color: string;
}

const COLORS = ['#3b82f6', '#10b981', '#8b5cf6', '#f59e0b', '#ef4444', '#06b6d4', '#ec4899', '#6366f1', '#14b8a6'];

export function AssetAllocationWidget({ gridParams }: { gridParams?: GridParams }) {
    const { data: portfolio, isLoading } = trpc.investing.getPortfolioSummary.useQuery();

    const layout = useWidgetLayout(gridParams);
    const { isNarrow, isShort, isCompact, isTall, isSmallBp, rowLimit } = layout;

    const holdings = portfolio?.holdings || [];
    const totalValue = portfolio?.currentValue || 0;

    const allocationData: AllocationItem[] = holdings.map((holding: any, index: number) => ({
        name: holding.ticker,
        fullName: holding.name || holding.ticker,
        value: holding.currentValue || 0,
        percentage: totalValue > 0 ? ((holding.currentValue || 0) / totalValue) * 100 : 0,
        color: COLORS[index % COLORS.length],
    })).sort((a: any, b: any) => b.value - a.value);

    const visibleHoldings = allocationData.slice(0, layout.showChartDetails ? layout.rows : rowLimit);

    if (isLoading) {
        return (
            <Card className="dashboard-widget widget-tint-yellow h-full rounded-[32px] overflow-hidden">
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

    return (
        <Card className={cn('dashboard-widget widget-tint-yellow h-full flex flex-col group rounded-[32px] overflow-hidden', isCompact && 'dashboard-widget--compact')}>
            <div className="block flex-1 flex flex-col min-h-0">
                <CardHeader className="p-3 pb-1 flex flex-row items-start justify-between hover:bg-muted/30 transition-colors rounded-t-xl" data-widget-header>
                    <div className="flex flex-col min-w-0 flex-1">
                        <div className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-0.5" data-widget-label>Asset Allocation</div>
                        <div className="flex items-baseline gap-2 flex-wrap">
                            <span className="text-lg font-bold tracking-tight whitespace-nowrap" data-widget-value>
                                {holdings.length} <span className="text-[10px] text-muted-foreground font-medium ml-1">positions</span>
                            </span>
                        </div>
                    </div>
                    <div className="p-1.5 bg-cyan-500/10 rounded-md group-hover:bg-cyan-500/20 transition-colors">
                        <PieChartIcon className="h-4 w-4 text-cyan-500" />
                    </div>
                </CardHeader>

                <CardContent className="px-3 py-1 flex-1 flex flex-col min-h-0" data-widget-body>
                    <div className="flex-1 flex gap-3 min-h-0 py-1">
                        {/* Allocation chart - hidden on narrowest widgets to keep list readable */}
                        {layout.showChartDetails && allocationData.length > 0 && (
                            <div className="flex-1 max-w-[40%] flex items-center justify-center">
                                <VoronoiTreemap
                                    data={allocationData}
                                    resolution={200}
                                    cornerRadius={6}
                                    showPercentage={false}
                                />
                            </div>
                        )}

                        <div className="flex-1 space-y-1.5 overflow-hidden" data-widget-list={layout.showChartDetails ? "single" : "grid"}>
                            {allocationData.length === 0 ? (
                                <div className="flex items-center justify-center h-full text-center py-4">
                                    <p className="text-[10px] text-muted-foreground italic uppercase tracking-wider">No positions</p>
                                </div>
                            ) : (
                                visibleHoldings.map((item) => (
                                    <div key={item.name} className="flex items-center justify-between gap-2 p-1.5 rounded-md bg-muted/40 hover:bg-muted/60 transition-colors group/item" data-widget-row>
                                        <div className="flex items-center gap-1.5 min-w-0 flex-1">
                                            <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: item.color }} />
                                            <span className="text-[10px] font-bold truncate leading-tight">{item.name}</span>
                                        </div>
                                        <span className="text-[10px] font-bold whitespace-nowrap">
                                            {item.percentage.toFixed(1)}%
                                        </span>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </CardContent>
            </div>

            <WidgetFooter visibleItems={visibleHoldings.length} totalItems={allocationData.length}>
                <span className="text-[9px] font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                    <Wallet className="h-2.5 w-2.5" />
                    <CurrencyDisplay amount={totalValue} abbreviate /> total
                </span>
                <Link to="/investing" className="text-[9px] font-bold text-primary flex items-center gap-0.5 hover:underline uppercase tracking-wider">
                    Details <ArrowRight className="h-2.5 w-2.5" />
                </Link>
            </WidgetFooter>
        </Card>
    );
}
