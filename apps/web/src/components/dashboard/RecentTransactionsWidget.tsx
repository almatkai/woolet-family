import { useWidgetLayout } from '@/components/dashboard/WidgetViewport';
import React, { useState, useEffect, useMemo } from 'react';
import { trpc } from '@/lib/trpc';
import { Link } from '@tanstack/react-router';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns';
import { CurrencyDisplay } from '@/components/CurrencyDisplay';
import { History, ArrowRight } from 'lucide-react';
import { GlassCard, GlassEdge, MetricAura } from '@/components/ui/glass';
import { WidgetFooter } from './WidgetFooter';

const STORAGE_KEY = 'woolet:recent-transactions-widget';

interface Transaction {
    id: string;
    amount: string | number;
    description?: string | null;
    date: string;
    type: string;
    category?: {
        id: string;
        name: string;
        icon: string;
    } | null;
    currencyBalance?: {
        currencyCode: string;
        account?: {
            name: string;
        } | null;
    };
}

export function RecentTransactionsWidget({ gridParams }: { gridParams?: { w: number; h: number } }) {
    const [period, setPeriod] = useState<'week' | 'month' | 'all'>(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem(STORAGE_KEY);
            if (saved) {
                try {
                    const parsed = JSON.parse(saved);
                    return parsed.period || 'all';
                } catch (e) {
                    console.error('Failed to parse saved period', e);
                }
            }
        }
        return 'all';
    });

    const { data: user } = trpc.user.me.useQuery();

    useEffect(() => {
        const saved = localStorage.getItem(STORAGE_KEY);
        const currentPrefs = saved ? JSON.parse(saved) : {};
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...currentPrefs, period }));
    }, [period]);

    useEffect(() => {
        if (user?.preferences) {
            const prefs = user.preferences as any;
            const dbPeriod = prefs?.recentTransactionsWidget?.period;
            if (dbPeriod && dbPeriod !== period) {
                setPeriod(dbPeriod);
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user]);

    const dateRange = useMemo(() => {
        const now = new Date();
        if (period === 'week') {
            return {
                start: startOfWeek(now, { weekStartsOn: 1 }).toISOString(),
                end: endOfWeek(now, { weekStartsOn: 1 }).toISOString()
            };
        } else if (period === 'month') {
            return {
                start: startOfMonth(now).toISOString(),
                end: endOfMonth(now).toISOString()
            };
        }
        return null;
    }, [period]);

    const queryParams = useMemo(() => ({
        limit: 100,
        hideAdjustments: true,
        ...(dateRange && {
            startDate: dateRange.start,
            endDate: dateRange.end
        })
    }), [dateRange]);

    const { data: recentTransactions, isLoading } = trpc.transaction.list.useQuery(queryParams) as { data: { transactions: Transaction[] } | undefined, isLoading: boolean };

    const layout = useWidgetLayout(gridParams);
    const { isNarrow, isShort, isCompact, isTall, isSmallBp, rowLimit } = layout;

    const transactions = recentTransactions?.transactions || [];
    const visibleTransactions = transactions.slice(0, rowLimit);

    if (isLoading) {
        return (
            <GlassCard className="dashboard-widget widget-tint-sky h-full rounded-[28px] p-4">
                <Skeleton className="h-3 w-24 mb-3" />
                <div className="space-y-2">
                    <Skeleton className="h-10 w-full rounded-xl" />
                    <Skeleton className="h-10 w-full rounded-xl" />
                </div>
            </GlassCard>
        );
    }

    return (
        <GlassCard className={cn('dashboard-widget widget-tint-sky h-full flex flex-col group rounded-[28px] overflow-hidden', isCompact && 'dashboard-widget--compact')}>
            <MetricAura color="#8B5CF6" cx={85} cy={12} opacity={0.15} />
            <GlassEdge />

            <div className="block flex-1 flex flex-col min-h-0 relative z-10">
                <div className="p-3 pb-1 flex flex-row items-start justify-between hover:bg-white/[0.04] transition-colors rounded-t-xl" data-widget-header>
                    <div className="flex flex-col min-w-0 flex-1">
                        <div className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground/80 mb-0.5" data-widget-label>Recent Activity</div>
                        <div className="flex items-baseline gap-1.5 flex-wrap">
                            <span className="text-lg font-bold tracking-tight whitespace-nowrap" data-widget-value>
                                {transactions.length} 
                                <span className="text-[10px] text-muted-foreground font-medium ml-1">items</span>
                            </span>
                        </div>
                    </div>
                    <div className="p-1.5 bg-white/10 rounded-xl border border-white/10 group-hover:bg-white/15 transition-colors">
                        <History className="h-3.5 w-3.5 text-muted-foreground" />
                    </div>
                </div>

                <div className="px-3 py-1 flex-1 flex flex-col min-h-0" data-widget-body>
                    <div className="flex-1 space-y-1.5 overflow-hidden py-1" data-widget-list>
                        {visibleTransactions.length === 0 ? (
                            <div className="flex items-center justify-center h-full text-center py-4">
                                <p className="text-[10px] text-muted-foreground italic uppercase tracking-wider">No recent activity</p>
                            </div>
                        ) : (
                            visibleTransactions.map((tx) => {
                                const txAmount = tx.type === 'expense' ? -Math.abs(Number(tx.amount)) : Number(tx.amount);
                                return (
                                    <div key={tx.id} className="flex items-center justify-between gap-3 px-2 py-1.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/5 transition-all group/item" data-widget-row>
                                        <div className="flex items-center gap-2.5 min-w-0 flex-1">
                                            <div className="size-7 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-xs flex-shrink-0 text-purple-300">
                                                {tx.category?.icon || '•'}
                                            </div>
                                            <div className="flex flex-col min-w-0">
                                                <span className="text-[11px] font-semibold truncate leading-tight text-foreground">{tx.description || tx.category?.name || 'Transaction'}</span>
                                                <span className="text-[9px] text-muted-foreground/80 truncate">{format(new Date(tx.date), 'MMM d')} · {tx.currencyBalance?.account?.name || 'Account'}</span>
                                            </div>
                                        </div>
                                        <div className="text-right flex-shrink-0">
                                            <div className={cn(
                                                "text-[11px] font-bold tabular-nums",
                                                tx.type === 'income' ? 'text-emerald-400' : tx.type === 'expense' ? 'text-rose-400' : 'text-foreground'
                                            )}>
                                                <CurrencyDisplay
                                                    amount={txAmount}
                                                    currency={tx.currencyBalance?.currencyCode || 'USD'}
                                                    showSign={tx.type === 'income'}
                                                    abbreviate={isNarrow || (Math.abs(txAmount) > 9999)}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>
            </div>

            <WidgetFooter visibleItems={visibleTransactions.length} totalItems={transactions.length}>
                <span className="text-[9px] font-medium text-muted-foreground uppercase tracking-wider" data-widget-label>
                    {period === 'all' ? 'All Time' : period === 'week' ? 'This Week' : 'This Month'}
                </span>
                <Link to="/spending" className="text-[9px] font-bold text-primary flex items-center gap-0.5 hover:underline uppercase tracking-wider">
                    See All
                    <ArrowRight className="h-3 w-3" />
                </Link>
            </WidgetFooter>
        </GlassCard>
    );
}
