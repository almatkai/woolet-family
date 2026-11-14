import { useWidgetLayout } from '@/components/dashboard/WidgetViewport';
import React, { useState } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Home, Check, X, ArrowRight, Wallet } from 'lucide-react';
import { trpc } from '@/lib/trpc';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { CurrencyDisplay } from '@/components/CurrencyDisplay';
import { MortgagePaymentSheet } from '@/components/MortgagePaymentSheet';
import { getPaymentStatusOptions, getTargetMonthStr, isPaidForTargetMonth } from "@/lib/payment-status";
import { Link } from '@tanstack/react-router';
import { WidgetFooter } from './WidgetFooter';

type GridParams = { w: number; h: number; breakpoint?: string };

export function MortgageWidget({ gridParams }: { gridParams?: GridParams }) {
    const { data: mortgages, isLoading } = trpc.mortgage.list.useQuery();
    const { data: settings } = trpc.settings.getUserSettings.useQuery();
    const [payingMortgage, setPayingMortgage] = useState<any>(null);
    
    const layout = useWidgetLayout(gridParams);
    const { isNarrow, isShort, isCompact, isTall, isSmallBp, rowLimit } = layout;

    const activeMortgages = (mortgages || []).filter((m: any) => m.status === 'active');
    const totalBalance = activeMortgages.reduce((sum: number, m: any) => sum + Number(m.remainingBalance), 0);
    const totalMonthly = activeMortgages.reduce((sum: number, m: any) => sum + Number(m.monthlyPayment), 0);
    
    const { logic, period } = getPaymentStatusOptions(settings, 'mortgage');
    const allPaidThisMonth = activeMortgages.every((m: any) => {
        const targetMonthStr = getTargetMonthStr(m.paymentDay, { logic, period });
        return isPaidForTargetMonth(m.payments, targetMonthStr, true);
    });

    const visibleMortgages = activeMortgages.slice(0, rowLimit);

    if (isLoading) {
        return (
            <Card className="dashboard-widget widget-tint-orange h-full rounded-[32px] overflow-hidden">
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
        <>
            <Card className={cn('dashboard-widget widget-tint-orange h-full flex flex-col group rounded-[32px] overflow-hidden', isCompact && 'dashboard-widget--compact')}>
                <div className="block flex-1 flex flex-col min-h-0">
                    <CardHeader className="p-3 pb-1 flex flex-row items-start justify-between hover:bg-muted/30 transition-colors rounded-t-xl" data-widget-header>
                        <div className="flex flex-col min-w-0 flex-1">
                            <div className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-0.5" data-widget-label>Mortgages</div>
                            <div className="flex items-baseline gap-2 flex-wrap">
                                <span className="text-lg font-bold tracking-tight whitespace-nowrap" data-widget-value>
                                    <CurrencyDisplay amount={totalMonthly} currency={activeMortgages[0]?.currency || 'KZT'} abbreviate={isNarrow || (totalMonthly > 1000000)} />
                                    <span className="text-[10px] text-muted-foreground font-medium ml-1">due this month</span>
                                </span>
                            </div>
                        </div>
                        <div className={cn(
                            "p-1.5 rounded-md transition-colors",
                            allPaidThisMonth ? "bg-emerald-500/10 group-hover:bg-emerald-500/20" : "bg-orange-500/10 group-hover:bg-orange-500/20"
                        )}>
                            <Home className={cn("h-4 w-4", allPaidThisMonth ? "text-emerald-500" : "text-orange-500")} />
                        </div>
                    </CardHeader>

                    <CardContent className="px-3 py-1 flex-1 flex flex-col min-h-0" data-widget-body>
                        <div className="flex-1 space-y-1.5 overflow-hidden py-1" data-widget-list>
                            {activeMortgages.length === 0 ? (
                                <div className="flex items-center justify-center h-full text-center py-4">
                                    <p className="text-[10px] text-muted-foreground italic uppercase tracking-wider">No active mortgages</p>
                                </div>
                            ) : (
                                visibleMortgages.map((mortgage: any) => {
                                    const targetMonthStr = getTargetMonthStr(mortgage.paymentDay, { logic, period });
                                    const isPaid = isPaidForTargetMonth(mortgage.payments, targetMonthStr, true);
                                    return (
                                        <div 
                                            key={mortgage.id} 
                                            className="flex items-center justify-between gap-2 p-1.5 rounded-md bg-muted/40 hover:bg-muted/60 transition-colors group/item cursor-pointer"
                                            onClick={(e) => {
                                                e.preventDefault();
                                                setPayingMortgage(mortgage);
                                            }} data-widget-row
                                        >
                                            <div className="flex items-center gap-1.5 min-w-0 flex-1">
                                                {isPaid ? (
                                                    <Check className="h-3 w-3 text-emerald-500 flex-shrink-0" />
                                                ) : (
                                                    <X className="h-3 w-3 text-orange-500 flex-shrink-0" />
                                                )}
                                                <div className="flex flex-col min-w-0">
                                                    <span className="text-[10px] font-bold truncate leading-tight">{mortgage.propertyName}</span>
                                                    <span className="text-[8px] text-muted-foreground uppercase">Day {mortgage.paymentDay}</span>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-[10px] font-bold">
                                                    <CurrencyDisplay amount={Number(mortgage.monthlyPayment)} currency={mortgage.currency} abbreviate />
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </CardContent>
                </div>

                <WidgetFooter visibleItems={visibleMortgages.length} totalItems={activeMortgages.length}>
                    <span className="text-[9px] font-medium text-muted-foreground uppercase tracking-wider" data-widget-label>
                        <CurrencyDisplay amount={totalBalance} currency={activeMortgages[0]?.currency || 'KZT'} abbreviate /> total left
                    </span>
                    <Link to="/financial/mortgages" className="text-[9px] font-bold text-primary flex items-center gap-0.5 hover:underline uppercase tracking-wider">
                        Details <ArrowRight className="h-2.5 w-2.5" />
                    </Link>
                </WidgetFooter>
            </Card>
            
            <MortgagePaymentSheet
                open={!!payingMortgage}
                onOpenChange={(open) => {
                    if (!open) setPayingMortgage(null);
                }}
                mortgage={payingMortgage}
            />
        </>
    );
}
