import { useState, useMemo } from 'react';
import { ScopeSwitchRow } from '@/components/family/ScopeSwitch';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { GlassCard, Segmented, StatTile, tint } from '@/components/ui/glass';
import { ProductEmptyState } from '@/components/financial/ProductCard';
import { CurrencyDisplay } from '@/components/CurrencyDisplay';
import {
    Plus,
    Calendar as CalendarIcon,
    Clock,
    ChevronLeft,
    ChevronRight,
    Wallet,
    CheckCircle2,
    Circle,
    Repeat,
    Sparkles,
} from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { PageHeader } from '@/components/PageHeader';
import { ActionButton } from '@/components/ui/action-button';
import { AddSubscriptionSheet } from '@/components/AddSubscriptionSheet';
import { SubscriptionPaymentSheet } from '@/components/SubscriptionPaymentSheet';

import { getPaymentStatusOptions, getTargetMonthStr, isPaidForTargetMonth } from "@/lib/payment-status";

interface Subscription {
    id: string;
    name: string;
    type: 'mobile' | 'general' | 'credit' | 'mortgage';
    amount: string;
    currency: string;
    frequency: string;
    billingDay: number | null;
    startDate: string;
    endDate: string | null;
    status: string;
    icon: string;
    color: string;
    isLinked?: boolean;
    linkedEntityId?: string;
    linkedEntityType?: string;
    payments?: Array<{
        id: string;
        amount: string;
        paidAt: string;
        monthYear?: string; // For mortgages
        currencyBalance?: {
            account?: { name: string };
        };
    }>;
}

interface UpcomingItem {
    subscription: Subscription;
    dueDate: string;
    isPaid: boolean;
}

export function SubscriptionsPage() {
    const [view, setView] = useState<'timeline' | 'calendar' | 'all'>('timeline');
    const [showAddSubscription, setShowAddSubscription] = useState(false);
    const { data: settings } = trpc.settings.getUserSettings.useQuery();

    const [payingSubscription, setPayingSubscription] = useState<Subscription | null>(null);
    const [selectedDaySubscriptions, setSelectedDaySubscriptions] = useState<{ day: number, items: { subscription: Subscription; isPaid: boolean }[] } | null>(null);
    const [calendarMonth, setCalendarMonth] = useState(new Date().getMonth() + 1);
    const [calendarYear, setCalendarYear] = useState(new Date().getFullYear());

    const { data: subscriptionsData, isLoading: isLoadingSubscriptions } = trpc.subscription.list.useQuery({
        includeLinkedEntities: true
    });
    const { data: upcomingData } = trpc.subscription.getUpcoming.useQuery({ days: 30 });
    const { data: calendarData, isLoading: isLoadingCalendar } = trpc.subscription.getCalendarView.useQuery({
        year: calendarYear,
        month: calendarMonth
    });


    const allItems = useMemo(() => {
        if (!subscriptionsData) return [];
        return [
            ...subscriptionsData.subscriptions,
            ...subscriptionsData.linkedItems
        ];
    }, [subscriptionsData]);

    const totalMonthlyByCurrency = useMemo(() => {
        const currencyTotals: Record<string, number> = {};
        allItems
            .filter((s: Subscription) => s.status === 'active')
            .forEach((s: Subscription) => {
                const amount = Number(s.amount);
                const monthlyAmount = (() => {
                    switch (s.frequency) {
                        case 'daily': return amount * 30;
                        case 'weekly': return amount * 4;
                        case 'yearly': return amount / 12;
                        default: return amount;
                    }
                })();
                const currency = s.currency || 'USD';
                currencyTotals[currency] = (currencyTotals[currency] || 0) + monthlyAmount;
            });
        return currencyTotals;
    }, [allItems]);

    const activeCount = allItems.filter((s: Subscription) => s.status === 'active').length;
    const upcomingThisWeek = (upcomingData || []).filter((u: UpcomingItem) => {
        const dueDate = new Date(u.dueDate);
        const weekFromNow = new Date();
        weekFromNow.setDate(weekFromNow.getDate() + 7);
        return dueDate <= weekFromNow && !u.isPaid;
    }).length;

    const getTypeColor = (type: string) => {
        switch (type) {
            case 'mobile': return 'bg-blue-500/20 text-blue-500';
            case 'credit': return 'bg-red-500/20 text-red-500';
            case 'mortgage': return 'bg-green-500/20 text-green-500';
            default: return 'bg-purple-500/20 text-purple-500';
        }
    };

    const formatCurrency = (amount: string | number, currency: string = 'USD') => {
        return Number(amount).toLocaleString('en-US', {
            style: 'currency',
            currency,
            minimumFractionDigits: 0,
            maximumFractionDigits: 2
        });
    };

    const navigateCalendar = (direction: 'prev' | 'next') => {
        if (direction === 'prev') {
            if (calendarMonth === 1) {
                setCalendarMonth(12);
                setCalendarYear(y => y - 1);
            } else {
                setCalendarMonth(m => m - 1);
            }
        } else {
            if (calendarMonth === 12) {
                setCalendarMonth(1);
                setCalendarYear(y => y + 1);
            } else {
                setCalendarMonth(m => m + 1);
            }
        }
    };

    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'];


    const typeLabel = (sub: Subscription) => (sub.isLinked ? `${sub.type} · linked` : sub.type);

    const PaidChip = ({ paid, label }: { paid: boolean; label?: string }) => (
        <span
            className={cn(
                'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider',
                paid ? 'bg-emerald-500/15 text-emerald-400' : 'bg-rose-500/15 text-rose-400'
            )}
        >
            {paid ? <CheckCircle2 className="h-3 w-3" /> : <Circle className="h-3 w-3" />}
            {paid ? 'Paid' : label || 'Due'}
        </span>
    );

    const SubIcon = ({ sub, size = 'md' }: { sub: Subscription; size?: 'md' | 'lg' }) => (
        <span
            className={cn(
                'flex shrink-0 items-center justify-center rounded-2xl',
                size === 'lg' ? 'size-12 text-2xl' : 'size-10 text-xl'
            )}
            style={{ backgroundColor: tint(sub.color, 0.18), boxShadow: `inset 0 0 0 1px ${tint(sub.color, 0.3)}` }}
        >
            {sub.icon}
        </span>
    );

    if (isLoadingSubscriptions) {
        return (
            <div className="space-y-6">
                <div className="h-8 w-48 bg-white/[0.04] animate-pulse rounded-xl" />
                <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
                    <div className="h-28 bg-white/[0.04] animate-pulse rounded-[22px]" />
                    <div className="h-28 bg-white/[0.04] animate-pulse rounded-[22px]" />
                    <div className="h-28 bg-white/[0.04] animate-pulse rounded-[22px] col-span-2 lg:col-span-1" />
                </div>
            </div>
        );
    }

    const monthlyTotals = Object.entries(totalMonthlyByCurrency).sort((a, b) => b[1] - a[1]);

    return (
        <div className="space-y-4 md:space-y-6">
            <PageHeader
                title="Subscriptions"
                subtitle="Everything that renews, in one place"
                variant="one"
            >
                <Button size="sm" onClick={() => setShowAddSubscription(true)} className="gap-2">
                    <Plus className="h-4 w-4" />
                    Add
                </Button>
            </PageHeader>
            <ScopeSwitchRow />

            <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
                <StatTile
                    label="Per month"
                    color="#818CF8"
                    icon={<Repeat className="size-4" />}
                    value={monthlyTotals.length === 0 ? <span className="text-muted-foreground">0</span> : (
                        <span className="flex flex-col">
                            <CurrencyDisplay amount={monthlyTotals[0][1]} currency={monthlyTotals[0][0]} />
                            {monthlyTotals.length > 1 && (
                                <span className="mt-1 text-xs font-medium text-muted-foreground">
                                    {monthlyTotals.slice(1).map(([code, value], idx) => (
                                        <span key={code}>
                                            {idx > 0 && ' · '}
                                            <CurrencyDisplay amount={value} currency={code} abbreviate />
                                        </span>
                                    ))}
                                </span>
                            )}
                        </span>
                    )}
                    hint="Normalized to monthly"
                />
                <StatTile
                    label="Active"
                    color="#A78BFA"
                    icon={<Sparkles className="size-4" />}
                    value={activeCount}
                    hint={`${allItems.length} total`}
                />
                <StatTile
                    label="Due this week"
                    color="#FBBF24"
                    icon={<Clock className="size-4" />}
                    className="col-span-2 lg:col-span-1"
                    value={upcomingThisWeek}
                    hint={upcomingThisWeek > 0 ? 'Unpaid in the next 7 days' : 'Nothing due soon'}
                />
            </div>

            <Segmented
                value={view}
                onChange={setView}
                options={[
                    { value: 'timeline', label: <><Clock className="h-3.5 w-3.5" />Upcoming</>, count: upcomingData?.filter((u: UpcomingItem) => !u.isPaid).length },
                    { value: 'calendar', label: <><CalendarIcon className="h-3.5 w-3.5" />Calendar</> },
                    { value: 'all', label: <><Repeat className="h-3.5 w-3.5" />All</>, count: allItems.length },
                ]}
            />

            {view === 'timeline' && (
                !upcomingData || upcomingData.length === 0 ? (
                    <ProductEmptyState
                        icon={<Clock className="size-5" />}
                        title="No upcoming payments"
                        description="Add subscriptions to see your payment timeline"
                        action={
                            <Button size="sm" onClick={() => setShowAddSubscription(true)} className="gap-2">
                                <Plus className="h-4 w-4" />
                                Add Subscription
                            </Button>
                        }
                    />
                ) : (
                    <GlassCard className="p-2 sm:p-3">
                        <div className="relative divide-y divide-white/[0.06]">
                            {upcomingData.map((item: UpcomingItem, index: number) => {
                                const due = new Date(item.dueDate);
                                return (
                                    <div key={`${item.subscription.id}-${index}`} className="flex items-center gap-3 rounded-2xl px-2.5 py-3 sm:px-3 transition-colors hover:bg-white/[0.04]">
                                        <div className="hidden w-11 shrink-0 flex-col items-center sm:flex">
                                            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                                                {due.toLocaleDateString('en-US', { month: 'short' })}
                                            </span>
                                            <span className="text-lg font-bold leading-tight tabular-nums">{due.getDate()}</span>
                                        </div>
                                        <SubIcon sub={item.subscription} />
                                        <div className="min-w-0 flex-1">
                                            <p className="truncate text-sm font-semibold">{item.subscription.name}</p>
                                            <p className="mt-0.5 truncate text-xs capitalize text-muted-foreground">
                                                {due.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })} · {typeLabel(item.subscription)}
                                            </p>
                                        </div>
                                        <div className="shrink-0 text-right">
                                            <CurrencyDisplay amount={item.subscription.amount} currency={item.subscription.currency} className="text-sm font-bold" />
                                            <p className="mt-0.5 text-[11px] text-muted-foreground">{item.subscription.frequency}</p>
                                        </div>
                                        <div className="flex w-[72px] shrink-0 justify-end">
                                            {!item.isPaid && !item.subscription.isLinked ? (
                                                <Button size="sm" className="h-8 gap-1 px-3" onClick={() => setPayingSubscription(item.subscription)}>
                                                    <Wallet className="h-3.5 w-3.5" />
                                                    Pay
                                                </Button>
                                            ) : (
                                                <PaidChip paid={item.isPaid} />
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </GlassCard>
                )
            )}

            {view === 'calendar' && (
                <GlassCard className="p-3 sm:p-5">
                    <div className="relative mb-3 flex items-center justify-between">
                        <Button variant="ghost" size="icon" onClick={() => navigateCalendar('prev')}>
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <p className="text-base font-semibold">
                            {monthNames[calendarMonth - 1]} {calendarYear}
                        </p>
                        <Button variant="ghost" size="icon" onClick={() => navigateCalendar('next')}>
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>
                    {isLoadingCalendar ? (
                        <div className="h-64 flex items-center justify-center">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                        </div>
                    ) : (
                        <div className="relative grid grid-cols-7 gap-1 sm:gap-1.5">
                            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                                <div key={day} className="pb-1 text-center text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                                    {day}
                                </div>
                            ))}

                            {Array.from({ length: new Date(calendarYear, calendarMonth - 1, 1).getDay() }).map((_, i) => (
                                <div key={`empty-${i}`} className="aspect-square" />
                            ))}

                            {Array.from({ length: calendarData?.daysInMonth || 31 }).map((_, i) => {
                                const day = i + 1;
                                const dayData = calendarData?.data[day] || [];
                                const isToday = new Date().getDate() === day &&
                                    new Date().getMonth() + 1 === calendarMonth &&
                                    new Date().getFullYear() === calendarYear;

                                return (
                                    <div
                                        key={day}
                                        className={cn(
                                            'aspect-square cursor-pointer rounded-xl border p-1 transition-all',
                                            isToday
                                                ? 'border-primary/60 bg-primary/10'
                                                : dayData.length > 0
                                                    ? 'border-white/10 bg-white/[0.03] hover:bg-white/[0.06]'
                                                    : 'border-transparent hover:bg-white/[0.04]'
                                        )}
                                        onClick={() => setSelectedDaySubscriptions({ day, items: dayData })}
                                    >
                                        <div className={cn('mb-1 text-xs font-semibold', isToday ? 'text-violet-300' : 'text-muted-foreground')}>{day}</div>
                                        <div className="space-y-0.5">
                                            {dayData.slice(0, 3).map((item: { subscription: Subscription; isPaid: boolean }, idx: number) => (
                                                <div
                                                    key={idx}
                                                    className="flex items-center gap-0.5 truncate rounded-md px-1 py-0.5 text-[10px] font-medium"
                                                    style={{
                                                        backgroundColor: tint(item.subscription.color, 0.18),
                                                        color: item.subscription.color
                                                    }}
                                                >
                                                    {item.isPaid ? (
                                                        <CheckCircle2 className="h-2 w-2 shrink-0" />
                                                    ) : (
                                                        <Circle className="hidden h-2 w-2 shrink-0 sm:block" />
                                                    )}
                                                    <span className="truncate">{item.subscription.name}</span>
                                                </div>
                                            ))}
                                            {dayData.length > 3 && (
                                                <div className="text-[10px] text-muted-foreground">
                                                    +{dayData.length - 3} more
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </GlassCard>
            )}

            {view === 'all' && (
                allItems.length === 0 ? (
                    <ProductEmptyState
                        icon={<Repeat className="size-5" />}
                        title="No subscriptions yet"
                        description="Track streaming, phone plans and any other recurring payment"
                        action={
                            <Button size="sm" onClick={() => setShowAddSubscription(true)} className="gap-2">
                                <Plus className="h-4 w-4" />
                                Add subscription
                            </Button>
                        }
                    />
                ) : (
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
                        {allItems.map((sub: Subscription) => {
                            // Check if paid based on settings logic
                            const settingsType = sub.type === 'credit'
                                ? 'credit'
                                : sub.type === 'mortgage'
                                    ? 'mortgage'
                                    : 'subscription';
                            const { logic, period } = getPaymentStatusOptions(settings, settingsType);
                            const targetMonthStr = getTargetMonthStr(sub.billingDay, { logic, period });
                            const isPaidThisMonth = isPaidForTargetMonth(sub.payments || [], targetMonthStr, sub.type === 'mortgage');
                            const isActive = sub.status === 'active';

                            return (
                                <GlassCard
                                    key={sub.id}
                                    auraColor={sub.color}
                                    auraPosition={{ cx: 100, cy: 0 }}
                                    className={cn('p-4', !isActive && 'opacity-60')}
                                >
                                    <div className="relative flex items-start gap-3">
                                        <SubIcon sub={sub} size="lg" />
                                        <div className="min-w-0 flex-1">
                                            <p className="truncate text-sm font-semibold">{sub.name}</p>
                                            <p className="mt-0.5 truncate text-xs capitalize text-muted-foreground">
                                                {typeLabel(sub)}{sub.billingDay ? ` · day ${sub.billingDay}` : ''}
                                            </p>
                                        </div>
                                        {isActive ? (
                                            <PaidChip paid={isPaidThisMonth} label="Unpaid" />
                                        ) : (
                                            <span className="rounded-full bg-white/[0.08] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                                                {sub.status}
                                            </span>
                                        )}
                                    </div>
                                    <div className="relative mt-4 flex items-end justify-between gap-3">
                                        <div>
                                            <CurrencyDisplay amount={sub.amount} currency={sub.currency} className="text-xl font-bold tracking-tight" />
                                            <p className="text-[11px] capitalize text-muted-foreground">{sub.frequency}</p>
                                        </div>
                                        {!sub.isLinked && isActive && (
                                            <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setPayingSubscription(sub)}>
                                                <Wallet className="h-3.5 w-3.5" />
                                                Pay
                                            </Button>
                                        )}
                                    </div>
                                </GlassCard>
                            );
                        })}
                    </div>
                )
            )}

            {/* Sheets */}
            <AddSubscriptionSheet
                open={showAddSubscription}
                onOpenChange={setShowAddSubscription}
            />

            <Dialog open={!!selectedDaySubscriptions} onOpenChange={(open) => !open && setSelectedDaySubscriptions(null)}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>
                            Payments for {selectedDaySubscriptions?.day} {monthNames[calendarMonth - 1]} {calendarYear}
                        </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 pt-4">
                        {selectedDaySubscriptions?.items.map((item, idx) => {
                            const sub = item.subscription;

                            // Calculate progress for credits
                            let progressText = null;
                            if (sub.isLinked && sub.type === 'credit' && sub.startDate && sub.endDate) {
                                const allMonthYears = getMonthsBetween(sub.startDate, sub.endDate);
                                const total = allMonthYears.length;

                                // Find which payment number this month is
                                const currentMonthYear = `${calendarYear}-${String(calendarMonth).padStart(2, '0')}`;
                                const paymentIndex = allMonthYears.indexOf(currentMonthYear) + 1;

                                if (paymentIndex > 0) {
                                    progressText = `Payment ${paymentIndex} of ${total}`;
                                }
                            }

                            return (
                                <div key={idx} className="flex flex-col gap-2 rounded-2xl border border-white/10 bg-white/[0.03] p-3">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div
                                                className="w-10 h-10 rounded-lg flex items-center justify-center text-xl"
                                                style={{ backgroundColor: `${sub.color}20` }}
                                            >
                                                {sub.icon}
                                            </div>
                                            <div>
                                                <h4 className="font-semibold text-sm">{sub.name}</h4>
                                                <div className="flex items-center gap-2">
                                                    <Badge variant="secondary" className={cn("text-[10px] h-4 px-1", getTypeColor(sub.type))}>
                                                        {sub.type}
                                                    </Badge>
                                                    {progressText && (
                                                        <span className="text-[10px] text-muted-foreground font-medium">
                                                            {progressText}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-bold text-sm">
                                                {formatCurrency(sub.amount, sub.currency)}
                                            </p>
                                            <Badge
                                                variant={item.isPaid ? "secondary" : "destructive"}
                                                className={cn(
                                                    "text-[10px] h-4 px-1",
                                                    item.isPaid ? "bg-green-500/20 text-green-600 hover:bg-green-500/30" : ""
                                                )}
                                            >
                                                {item.isPaid ? "Paid" : "Due"}
                                            </Badge>
                                        </div>
                                    </div>

                                    {!item.isPaid && !sub.isLinked && sub.status === 'active' && (
                                        <Button
                                            className="w-full h-8 text-xs mt-1 rounded-toolbar"
                                            onClick={() => {
                                                setPayingSubscription(sub);
                                                setSelectedDaySubscriptions(null);
                                            }}
                                        >
                                            <Wallet className="h-3.5 w-3.5 mr-2" />
                                            Pay Now
                                        </Button>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </DialogContent>
            </Dialog>

            <SubscriptionPaymentSheet
                open={!!payingSubscription}
                onOpenChange={(open) => !open && setPayingSubscription(null)}
                subscription={payingSubscription}
            />
        </div >
    );
}

// Helper to generate all months between two dates
function getMonthsBetween(startDateStr: string, endDateStr: string): string[] {
    const months: string[] = [];
    const start = new Date(startDateStr);
    const end = new Date(endDateStr);

    // Adjust to first of month for comparison
    const current = new Date(start.getFullYear(), start.getMonth(), 1);
    const endMonth = new Date(end.getFullYear(), end.getMonth(), 1);

    while (current <= endMonth) {
        const year = current.getFullYear();
        const month = String(current.getMonth() + 1).padStart(2, '0');
        months.push(`${year}-${month}`);
        current.setMonth(current.getMonth() + 1);
    }

    return months;
}
