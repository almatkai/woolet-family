import { useWidgetLayout } from '@/components/dashboard/WidgetViewport';
import React from 'react';
import { CalendarClock, ArrowRight, Bell } from 'lucide-react';
import { trpc } from '@/lib/trpc';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { CurrencyDisplay } from '@/components/CurrencyDisplay';
import { Link } from '@tanstack/react-router';
import { GlassCard, GlassEdge, MetricAura } from '@/components/ui/glass';
import { WidgetFooter } from './WidgetFooter';

interface Subscription {
    id: string;
    name: string;
    type: 'mobile' | 'general' | 'credit' | 'mortgage';
    amount: string;
    currency: string;
    frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
    billingDay: number | null;
    startDate: string;
    endDate: string | null;
    status: 'active' | 'paused' | 'cancelled';
    icon: string;
    color: string;
    isLinked?: boolean;
    linkedEntityId?: string;
    linkedEntityType?: string;
}

interface SubscriptionWithNextBilling extends Subscription {
    nextBillingDate: Date;
    daysUntilBilling: number;
    monthlyEquivalent: number;
}

type GridParams = { w: number; h: number; breakpoint?: string };

export function SubscriptionsWidget({ gridParams }: { gridParams?: GridParams }) {
    const { data: subscriptionsData, isLoading } = trpc.subscription.list.useQuery({
        includeLinkedEntities: true,
        status: 'active',
        type: 'all'
    });
    
    const layout = useWidgetLayout(gridParams);
    const { isNarrow, isShort, isCompact, isTall, isSmallBp, rowLimit } = layout;

    const processedSubscriptions: SubscriptionWithNextBilling[] = React.useMemo(() => {
        if (!subscriptionsData) return [];
        
        const allSubscriptions = [
            ...subscriptionsData.subscriptions,
            ...subscriptionsData.linkedItems
        ];
        
        return allSubscriptions
            .filter((sub: Subscription) => sub.status === 'active')
            .map((sub: Subscription): SubscriptionWithNextBilling => {
                const amount = Number(sub.amount);
                const monthlyEquivalent = (() => {
                    switch (sub.frequency) {
                        case 'daily': return amount * 30;
                        case 'weekly': return amount * 4.33;
                        case 'yearly': return amount / 12;
                        default: return amount;
                    }
                })();

                const today = new Date();
                today.setHours(0, 0, 0, 0);
                const nextBillingDate = new Date(today);
                
                if (sub.frequency === 'monthly') {
                    const billingDay = sub.billingDay || new Date(sub.startDate).getDate();
                    nextBillingDate.setDate(billingDay);
                    if (nextBillingDate < today) {
                        nextBillingDate.setMonth(nextBillingDate.getMonth() + 1);
                    }
                } else if (sub.frequency === 'weekly') {
                    const dayOfWeek = sub.billingDay || 1;
                    const currentDayOfWeek = today.getDay() === 0 ? 7 : today.getDay();
                    const daysUntilBilling = ((dayOfWeek - currentDayOfWeek + 7) % 7) || 7;
                    nextBillingDate.setDate(today.getDate() + daysUntilBilling);
                } else if (sub.frequency === 'daily') {
                    nextBillingDate.setDate(today.getDate() + 1);
                } else if (sub.frequency === 'yearly') {
                    const startDate = new Date(sub.startDate);
                    nextBillingDate.setMonth(startDate.getMonth(), startDate.getDate());
                    if (nextBillingDate < today) {
                        nextBillingDate.setFullYear(nextBillingDate.getFullYear() + 1);
                    }
                }

                if (sub.endDate && nextBillingDate > new Date(sub.endDate)) {
                    return null as any;
                }

                const daysUntilBilling = Math.ceil((nextBillingDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

                return {
                    ...sub,
                    nextBillingDate,
                    daysUntilBilling,
                    monthlyEquivalent
                };
            })
            .filter(Boolean)
            .sort((a, b) => a.daysUntilBilling - b.daysUntilBilling);
    }, [subscriptionsData]);

    const totalsByCurrency: Record<string, number> = React.useMemo(() => {
        const totals: Record<string, number> = {};
        processedSubscriptions.forEach(sub => {
            totals[sub.currency] = (totals[sub.currency] || 0) + sub.monthlyEquivalent;
        });
        return totals;
    }, [processedSubscriptions]);

    const totalSubscriptions = processedSubscriptions.length;
    const visibleSubscriptions = processedSubscriptions.slice(0, rowLimit);
    
    const activeBalances = Object.entries(totalsByCurrency).filter(([_, amount]) => amount !== 0);
    const primaryCurrency = activeBalances.length > 0 ? activeBalances[0][0] : 'USD';
    const primaryAmount = activeBalances.length > 0 ? activeBalances[0][1] : 0;

    if (isLoading) {
        return (
            <GlassCard className="dashboard-widget widget-tint-indigo h-full rounded-[28px] p-4">
                <Skeleton className="h-3 w-24 mb-3" />
                <Skeleton className="h-7 w-28 mb-3" />
                <Skeleton className="h-10 w-full rounded-xl" />
            </GlassCard>
        );
    }

    return (
        <GlassCard className={cn('dashboard-widget widget-tint-indigo h-full flex flex-col group rounded-[28px] overflow-hidden', isCompact && 'dashboard-widget--compact')}>
            <MetricAura color="#C4B5FD" cx={85} cy={15} opacity={0.18} />
            <GlassEdge />

            <div className="block flex-1 flex flex-col min-h-0 relative z-10">
                <div className="p-3 pb-1 flex flex-row items-start justify-between hover:bg-white/[0.04] transition-colors rounded-t-xl" data-widget-header>
                    <div className="flex flex-col min-w-0 flex-1">
                        <div className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground/80 mb-0.5" data-widget-label>Subscriptions</div>
                        <div className="flex items-baseline gap-1.5 flex-wrap">
                            <span className="text-lg font-bold tracking-tight whitespace-nowrap text-foreground" data-widget-value>
                                <CurrencyDisplay amount={primaryAmount} currency={primaryCurrency} abbreviate={isNarrow || (primaryAmount > 1000000)} />
                                <span className="text-[10px] text-muted-foreground font-medium ml-1">/mo</span>
                            </span>
                        </div>
                    </div>
                    <div className="p-1.5 bg-purple-500/15 rounded-xl border border-purple-500/25 group-hover:bg-purple-500/25 transition-colors">
                        <CalendarClock className="h-3.5 w-3.5 text-purple-300" />
                    </div>
                </div>

                <div className="px-3 py-1 flex-1 flex flex-col min-h-0" data-widget-body>
                    <div className="flex-1 space-y-1 overflow-hidden py-1" data-widget-list>
                        {visibleSubscriptions.length === 0 ? (
                            <div className="flex items-center justify-center h-full text-center py-4">
                                <p className="text-[10px] text-muted-foreground italic uppercase tracking-wider">No active subscriptions</p>
                            </div>
                        ) : (
                            visibleSubscriptions.map((sub) => (
                                <div key={sub.id} className="flex items-center justify-between gap-2 px-2 py-1.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/5 transition-colors group/item" data-widget-row>
                                    <div className="flex items-center gap-2 min-w-0 flex-1">
                                        <div className="size-6 rounded-lg bg-white/10 flex items-center justify-center text-xs shrink-0" style={{ color: sub.color }}>
                                            {sub.icon || '•'}
                                        </div>
                                        <div className="flex flex-col min-w-0">
                                            <span className="text-[10px] font-semibold truncate leading-tight text-foreground">{sub.name}</span>
                                            <span className={cn(
                                                "text-[9px] font-medium",
                                                sub.daysUntilBilling <= 3 ? "text-rose-400 font-bold" : "text-muted-foreground"
                                            )}>
                                                {sub.daysUntilBilling === 0 ? 'Today' : sub.daysUntilBilling === 1 ? 'Tomorrow' : `In ${sub.daysUntilBilling}d`}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-[10px] font-bold tabular-nums">
                                            <CurrencyDisplay amount={Number(sub.amount)} currency={sub.currency} abbreviate />
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>

            <WidgetFooter visibleItems={visibleSubscriptions.length} totalItems={processedSubscriptions.length}>
                <span className="text-[9px] font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                    <Bell className="h-2.5 w-2.5" />
                    {totalSubscriptions} Active
                </span>
                <Link to="/subscriptions" className="text-[9px] font-bold text-primary flex items-center gap-0.5 hover:underline uppercase tracking-wider">
                    Details <ArrowRight className="h-2.5 w-2.5" />
                </Link>
            </WidgetFooter>
        </GlassCard>
    );
}
