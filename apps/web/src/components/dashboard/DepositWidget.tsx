import { useWidgetLayout } from '@/components/dashboard/WidgetViewport';
import React from 'react';
import { PiggyBank, TrendingUp, ArrowRight, Wallet } from 'lucide-react';
import { trpc } from '@/lib/trpc';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { CurrencyDisplay } from '@/components/CurrencyDisplay';
import { Link } from '@tanstack/react-router';
import { GlassCard, GlassEdge, MetricAura } from '@/components/ui/glass';
import { WidgetFooter } from './WidgetFooter';

type GridParams = { w: number; h: number; breakpoint?: string };

export function DepositWidget({ gridParams }: { gridParams?: GridParams }) {
    const { data: deposits, isLoading } = trpc.deposit.list.useQuery();
    const activeDeposits = (deposits || []).filter((d: any) => d.status === 'active');
    
    const layout = useWidgetLayout(gridParams);
    const { isNarrow, isShort, isCompact, isTall, isSmallBp, rowLimit } = layout;

    const totalBalance = activeDeposits.reduce((sum: number, d: any) => sum + Number(d.currentBalance), 0);
    const totalPrincipal = activeDeposits.reduce((sum: number, d: any) => sum + Number(d.principalAmount), 0);
    const totalEarned = totalBalance - totalPrincipal;
    
    const visibleDeposits = activeDeposits.slice(0, rowLimit);

    if (isLoading) {
        return (
            <GlassCard className="dashboard-widget widget-tint-teal h-full rounded-[28px] p-4">
                <Skeleton className="h-3 w-24 mb-3" />
                <Skeleton className="h-7 w-32 mb-3" />
                <Skeleton className="h-10 w-full rounded-xl" />
            </GlassCard>
        );
    }

    return (
        <GlassCard className={cn('dashboard-widget widget-tint-teal h-full flex flex-col group rounded-[28px] overflow-hidden', isCompact && 'dashboard-widget--compact')}>
            <MetricAura color="#FDE68A" cx={85} cy={15} opacity={0.18} />
            <GlassEdge />

            <div className="block flex-1 flex flex-col min-h-0 relative z-10">
                <div className="p-3 pb-1 flex flex-row items-start justify-between hover:bg-white/[0.04] transition-colors rounded-t-xl" data-widget-header>
                    <div className="flex flex-col min-w-0 flex-1">
                        <div className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground/80 mb-0.5" data-widget-label>Savings & Deposits</div>
                        <div className="flex items-baseline gap-2 flex-wrap">
                            <span className="text-lg font-bold tracking-tight whitespace-nowrap text-foreground" data-widget-value>
                                <CurrencyDisplay amount={totalBalance} abbreviate={isNarrow || (totalBalance > 1000000)} />
                            </span>
                            {totalEarned > 0 && (
                                <div className="flex items-center text-[10px] font-bold text-amber-400">
                                    <TrendingUp className="h-2.5 w-2.5 mr-0.5" />
                                    +<CurrencyDisplay amount={totalEarned} abbreviate />
                                </div>
                            )}
                        </div>
                    </div>
                    <div className="p-1.5 bg-amber-500/15 rounded-xl border border-amber-500/25 group-hover:bg-amber-500/25 transition-colors">
                        <PiggyBank className="h-3.5 w-3.5 text-amber-300" />
                    </div>
                </div>

                <div className="px-3 py-1 flex-1 flex flex-col min-h-0" data-widget-body>
                    <div className="flex-1 space-y-1 overflow-hidden py-1" data-widget-list>
                        {activeDeposits.length === 0 ? (
                            <div className="flex items-center justify-center h-full text-center py-4">
                                <p className="text-[10px] text-muted-foreground italic uppercase tracking-wider">No active deposits</p>
                            </div>
                        ) : (
                            visibleDeposits.map((deposit: any) => (
                                <div key={deposit.id} className="flex items-center justify-between gap-2 px-2 py-1.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/5 transition-colors group/item" data-widget-row>
                                    <div className="flex items-center gap-1.5 min-w-0 flex-1">
                                        <Wallet className="h-3 w-3 text-amber-400 flex-shrink-0" />
                                        <div className="flex flex-col min-w-0">
                                            <span className="text-[10px] font-semibold truncate leading-tight text-foreground">{deposit.depositName}</span>
                                            <span className="text-[8px] text-muted-foreground uppercase">{deposit.interestRate}% APR</span>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-[10px] font-bold tabular-nums">
                                            <CurrencyDisplay amount={Number(deposit.currentBalance)} currency={deposit.currency} abbreviate />
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>

            <WidgetFooter visibleItems={visibleDeposits.length} totalItems={activeDeposits.length}>
                <span className="text-[9px] font-medium text-muted-foreground uppercase tracking-wider" data-widget-label>
                    {activeDeposits.length} Active
                </span>
                <Link to="/financial/deposits" className="text-[9px] font-bold text-primary flex items-center gap-0.5 hover:underline uppercase tracking-wider">
                    Details <ArrowRight className="h-2.5 w-2.5" />
                </Link>
            </WidgetFooter>
        </GlassCard>
    );
}
