import { useWidgetLayout } from '@/components/dashboard/WidgetViewport';
import React from 'react';
import { CreditCard, Check, X, ArrowRight } from 'lucide-react';
import { trpc } from '@/lib/trpc';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { CurrencyDisplay } from '@/components/CurrencyDisplay';
import { getPaymentStatusOptions, getTargetMonthStr, isPaidForTargetMonth } from "@/lib/payment-status";
import { Link } from '@tanstack/react-router';
import { GlassCard, GlassEdge, MetricAura } from '@/components/ui/glass';
import { WidgetFooter } from './WidgetFooter';

type GridParams = { w: number; h: number; breakpoint?: string };

export function CreditWidget({ gridParams }: { gridParams?: GridParams }) {
    const { data: credits, isLoading } = trpc.credit.list.useQuery();
    const { data: settings } = trpc.settings.getUserSettings.useQuery();
    const activeCredits = (credits || []).filter((c: any) => c.status === 'active');
    
    const layout = useWidgetLayout(gridParams);
    const { isNarrow, isShort, isCompact, isTall, isSmallBp, rowLimit } = layout;

    const { logic, period } = getPaymentStatusOptions(settings, 'credit');
    const monthlyPayment = activeCredits.reduce((sum: number, c: any) => sum + Number(c.monthlyPayment), 0);
    
    const allPaidThisMonth = activeCredits.every((c: any) => {
        const targetMonthStr = getTargetMonthStr(c.billingDay, { logic, period });
        return isPaidForTargetMonth(c.payments, targetMonthStr, true);
    });
    
    const visibleCredits = activeCredits.slice(0, rowLimit);

    if (isLoading) {
        return (
            <GlassCard className="dashboard-widget widget-tint-red h-full rounded-[28px] p-4">
                <Skeleton className="h-3 w-24 mb-3" />
                <Skeleton className="h-7 w-32 mb-3" />
                <Skeleton className="h-10 w-full rounded-xl" />
            </GlassCard>
        );
    }

    return (
        <GlassCard className={cn('dashboard-widget widget-tint-red h-full flex flex-col group rounded-[28px] overflow-hidden', isCompact && 'dashboard-widget--compact')}>
            <MetricAura color="#FDA4AF" cx={85} cy={15} opacity={0.18} />
            <GlassEdge />

            <div className="block flex-1 flex flex-col min-h-0 relative z-10">
                <div className="p-3 pb-1 flex flex-row items-start justify-between hover:bg-white/[0.04] transition-colors rounded-t-xl" data-widget-header>
                    <div className="flex flex-col min-w-0 flex-1">
                        <div className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground/80 mb-0.5" data-widget-label>Credits & Loans</div>
                        <div className="flex items-baseline gap-2 flex-wrap">
                            <span className="text-lg font-bold tracking-tight whitespace-nowrap text-foreground" data-widget-value>
                                <CurrencyDisplay amount={monthlyPayment} currency={settings?.defaultCurrency || "USD"} abbreviate={isNarrow || (monthlyPayment > 1000000)} />
                                <span className="text-[10px] text-muted-foreground font-medium ml-1">due this mo</span>
                            </span>
                        </div>
                    </div>
                    <div className={cn(
                        "p-1.5 rounded-xl border transition-colors",
                        allPaidThisMonth ? "bg-emerald-500/15 border-emerald-500/25 text-emerald-400" : "bg-rose-500/15 border-rose-500/25 text-rose-400"
                    )}>
                        <CreditCard className="h-3.5 w-3.5" />
                    </div>
                </div>

                <div className="px-3 py-1 flex-1 flex flex-col min-h-0" data-widget-body>
                    <div className="flex-1 space-y-1 overflow-hidden py-1" data-widget-list>
                        {visibleCredits.length === 0 ? (
                            <div className="flex items-center justify-center h-full text-center py-4">
                                <p className="text-[10px] text-muted-foreground italic uppercase tracking-wider">No active credits</p>
                            </div>
                        ) : (
                            visibleCredits.map((credit: any) => {
                                const targetMonthStr = getTargetMonthStr(credit.billingDay, { logic, period });
                                const isPaid = isPaidForTargetMonth(credit.payments, targetMonthStr, true);
                                return (
                                    <div key={credit.id} className="flex items-center justify-between gap-2 px-2 py-1.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/5 transition-colors group/item" data-widget-row>
                                        <div className="flex items-center gap-1.5 min-w-0 flex-1">
                                            {isPaid ? (
                                                <Check className="h-3 w-3 text-emerald-400 flex-shrink-0" />
                                            ) : (
                                                <X className="h-3 w-3 text-rose-400 flex-shrink-0" />
                                            )}
                                            <div className="flex flex-col min-w-0">
                                                <span className="text-[10px] font-semibold truncate leading-tight text-foreground">{credit.name}</span>
                                                <span className="text-[8px] text-muted-foreground uppercase">Day {credit.billingDay}</span>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-[10px] font-bold tabular-nums">
                                                <CurrencyDisplay amount={Number(credit.monthlyPayment)} currency={credit.currency} abbreviate />
                                            </div>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>
            </div>

            <WidgetFooter visibleItems={visibleCredits.length} totalItems={activeCredits.length}>
                <span className="text-[9px] font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                    {allPaidThisMonth ? <Check className="h-2.5 w-2.5 text-emerald-400" /> : <X className="h-2.5 w-2.5 text-rose-400" />}
                    {allPaidThisMonth ? 'All Paid' : 'Pending Payments'}
                </span>
                <Link to="/financial/credits" className="text-[9px] font-bold text-primary flex items-center gap-0.5 hover:underline uppercase tracking-wider">
                    Details <ArrowRight className="h-2.5 w-2.5" />
                </Link>
            </WidgetFooter>
        </GlassCard>
    );
}
