import { useWidgetLayout } from '@/components/dashboard/WidgetViewport';
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { trpc } from '@/lib/trpc';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { CurrencyDisplay } from '@/components/CurrencyDisplay';
import { Link } from '@tanstack/react-router';
import { Landmark, ArrowRight } from 'lucide-react';
import { HeroBackdrop, GlassEdge } from '@/components/ui/glass';

interface AccountBalance {
    accountId: string;
    accountName: string;
    bankName: string;
    balances: Array<{
        currencyCode: string;
        balance: number;
    }>;
    totalBalance: number;
}

type GridParams = { w: number; h: number; breakpoint?: string };

export function TotalBalanceWidget({ gridParams }: { gridParams?: GridParams }) {
    const { data: hierarchy, isLoading } = trpc.bank.getHierarchy.useQuery();

    const layout = useWidgetLayout(gridParams);
    const { isNarrow, isShort, isCompact, isTall, isSmallBp, rowLimit } = layout;

    // Process hierarchy into account balances sorted by total balance desc
    const accounts: AccountBalance[] = React.useMemo(() => {
        if (!hierarchy) return [];

        const result: AccountBalance[] = [];

        hierarchy.forEach((bank: any) => {
            bank.accounts.forEach((account: any) => {
                const balances = account.currencyBalances.map((cb: any) => ({
                    currencyCode: cb.currencyCode,
                    balance: Number(cb.balance)
                }));

                const totalBalance = balances.reduce((sum: number, b: { balance: number }) => sum + b.balance, 0);

                result.push({
                    accountId: account.id,
                    accountName: account.name,
                    bankName: bank.name,
                    balances,
                    totalBalance
                });
            });
        });

        // Sort by total balance descending
        return result.sort((a, b) => b.totalBalance - a.totalBalance);
    }, [hierarchy]);

    // Calculate totals by currency
    const totalsByCurrency: Record<string, number> = React.useMemo(() => {
        const totals: Record<string, number> = {};
        accounts.forEach(acc => {
            acc.balances.forEach(b => {
                totals[b.currencyCode] = (totals[b.currencyCode] || 0) + b.balance;
            });
        });
        return totals;
    }, [accounts]);

    const totalAccounts = accounts.length;
    const currencyCount = Object.keys(totalsByCurrency).length;
    const visibleAccounts = accounts.slice(0, rowLimit);

    // Get primary display value
    const activeBalances = Object.entries(totalsByCurrency).filter(([_, amount]) => amount !== 0);
    const primaryCurrency = activeBalances.length > 0 ? activeBalances[0][0] : 'KZT';
    const primaryAmount = activeBalances.length > 0 ? activeBalances[0][1] : 0;

    if (isLoading) {
        return (
            <Card className={cn('dashboard-widget widget-tint-violet h-full rounded-[28px] overflow-hidden bg-gradient-to-br from-purple-900/40 to-indigo-950/40 p-4 border border-white/10', isCompact && 'dashboard-widget--compact')}>
                <Skeleton className="h-3 w-24 bg-white/10 mb-2" />
                <Skeleton className="h-8 w-36 bg-white/20 mb-3" />
                <Skeleton className="h-16 w-full rounded-xl bg-white/10" />
            </Card>
        );
    }

    return (
        <div className={cn(
            'dashboard-widget widget-tint-violet relative h-full flex flex-col group overflow-hidden rounded-[28px] select-none text-white shadow-[0_16px_36px_rgba(109,40,217,0.32)]',
            isCompact && 'dashboard-widget--compact'
        )}>
            <HeroBackdrop />
            <GlassEdge />

            <div className="widget-metric-main relative z-10 flex-1 flex flex-col justify-between min-h-0">
                {/* Top: Eyebrow + Big Balance */}
                <div data-widget-header>
                    <div className="flex items-center justify-between gap-2">
                        <span className="text-[10px] font-extrabold tracking-wider text-purple-200/80 uppercase" data-widget-label>
                            Total Balance
                        </span>
                        {currencyCount > 1 && (
                            <span className="text-[9px] font-semibold bg-white/15 px-1.5 py-0.5 rounded-full text-white/90 border border-white/15">
                                {currencyCount} currencies
                            </span>
                        )}
                    </div>

                    <div className="mt-1 flex items-baseline gap-2">
                        <span className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.25)]" data-widget-value>
                            <CurrencyDisplay amount={primaryAmount} currency={primaryCurrency} abbreviate={isNarrow || (primaryAmount > 1000000)} />
                        </span>
                    </div>

                    <p data-widget-secondary className="text-[11px] text-purple-200/70 mt-0.5 font-medium">
                        Across {totalAccounts} accounts
                    </p>
                </div>

                {/* Account preview list */}
                {visibleAccounts.length > 0 && layout.showBody && (
                    <div className="space-y-1.5 my-2" data-widget-list>
                        {visibleAccounts.map((account) => (
                            <div
                                key={account.accountId}
                                className="flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-xl bg-black/20 hover:bg-black/30 border border-white/10 backdrop-blur-sm transition-all" data-widget-row
                            >
                                <div className="flex items-center gap-2 min-w-0 flex-1">
                                    <div className="size-6 rounded-lg bg-white/15 flex items-center justify-center text-white shrink-0 border border-white/10">
                                        <Landmark className="size-3.5" />
                                    </div>
                                    <div className="min-w-0 flex-1 leading-tight">
                                        <div className="text-[11px] font-semibold text-white truncate">{account.accountName}</div>
                                        <div className="text-[9px] text-purple-200/60 truncate">{account.bankName}</div>
                                    </div>
                                </div>
                                <span className="text-[11px] font-bold text-white tabular-nums shrink-0">
                                    <CurrencyDisplay amount={account.totalBalance} abbreviate />
                                </span>
                            </div>
                        ))}
                    </div>
                )}

                {/* Bottom Action: View accounts */}
                <div data-widget-footer className="border-t border-white/15 flex items-center justify-between">
                    <Link
                        to="/accounts"
                        className="inline-flex items-center gap-1.5 text-[11px] font-bold text-white bg-white/20 hover:bg-white/30 active:scale-95 px-3 py-1 rounded-full border border-white/20 transition-all shadow-sm"
                    >
                        <span>View accounts</span>
                        <ArrowRight className="size-3" strokeWidth={2.5} />
                    </Link>
                    <span className="text-[10px] text-purple-200/60 font-medium">
                        {visibleAccounts.length < totalAccounts && layout.showBody ? `${visibleAccounts.length} of ${totalAccounts}` : `${totalAccounts} connected`}
                    </span>
                </div>
            </div>
        </div>
    );
}
