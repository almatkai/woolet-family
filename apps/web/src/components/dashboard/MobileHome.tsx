import { useState, type ReactNode } from 'react';
import { Link } from '@tanstack/react-router';
import {
    ArrowRight,
    CalendarClock,
    CreditCard,
    Landmark,
    PiggyBank,
    Plus,
    ReceiptText,
    TrendingDown,
    TrendingUp,
} from 'lucide-react';
import { trpc } from '@/lib/trpc';
import { cn } from '@/lib/utils';
import { CurrencyDisplay } from '@/components/CurrencyDisplay';
import { NotificationsMenu } from '@/components/NotificationsMenu';
import { UniversalAddSheet } from '@/components/UniversalAddSheet';
import { Momo } from '@/components/ai/Momo';
import { SpendingAnomalyCard } from '@/components/dashboard/SpendingAnomalyCard';
import { GlassEdge, HeroBackdrop, MetricAura, tint } from '@/components/ui/glass';
import { Skeleton } from '@/components/ui/skeleton';

const CATEGORY_FALLBACK_COLORS = ['#8B5CF6', '#38BDF8', '#F472B6', '#FBBF24', '#34D399', '#FB923C'];

type Tx = {
    id: string;
    amount: string | number;
    date: string;
    type: string;
    description?: string | null;
    category?: { name?: string | null; icon?: string | null; color?: string | null } | null;
    currencyBalance?: { currencyCode?: string | null } | null;
};

// Phone-sized home screen, mirroring the mobile-v2 app: one scrolling column instead of the widget grid
export function MobileHome() {
    const [addOpen, setAddOpen] = useState(false);
    const [now] = useState(() => new Date());
    const { data: summary, isLoading: isSummaryLoading } = trpc.dashboard.getSummary.useQuery();
    const { data: usdRates } = trpc.currency.getExchangeRates.useQuery({ baseCurrency: 'USD' });
    const { data: recent } = trpc.transaction.list.useQuery({ limit: 5, hideAdjustments: true });
    const { data: subscriptionsData } = trpc.subscription.list.useQuery({ includeLinkedEntities: true });
    const { data: portfolio } = trpc.investing.getPortfolioSummary.useQuery();
    const { data: credits } = trpc.credit.list.useQuery();
    const { data: deposits } = trpc.deposit.list.useQuery();

    const accountCount = summary?.accountCount ?? 0;
    const topAccounts: { accountId: string; accountName: string; bankName: string; totalBalance: number }[] = (summary?.accounts ?? []).slice(0, 2);
    const currencyCount = Object.keys(summary?.totalBalances ?? {}).length;
    const heroCurrency = summary?.currency ?? 'USD';
    const heroBalance = summary?.totalBalance ?? 0;
    const monthFlow = (monthly: { total: number; count: number; chartData: { amount: number }[] } | undefined) => ({
        total: monthly?.total ?? 0,
        count: monthly?.count ?? 0,
        series: monthly?.chartData.map(day => day.amount) ?? [],
    });
    const income = monthFlow(summary?.monthlyIncome);
    const expenses = monthFlow(summary?.monthlyExpenses);
    const categories: { id: string; name: string; value: number; color?: string }[] = summary?.categoryData ?? [];
    const spendingTotal = summary?.categoryTotal ?? 0;

    // Secondary tiles also combine currencies; never relabel a raw sum as the first row's currency.
    const sumInMainCurrency = (rows: { amount: number; currency: string }[]) => {
        if (!summary) return null;
        let total = 0;
        for (const row of rows) {
            if (row.amount === 0) continue;
            if (row.currency === heroCurrency) { total += row.amount; continue; }
            const fromRate = row.currency === 'USD' ? 1 : usdRates?.[row.currency];
            const toRate = heroCurrency === 'USD' ? 1 : usdRates?.[heroCurrency];
            if (!Number.isFinite(fromRate) || fromRate <= 0 || !Number.isFinite(toRate) || toRate <= 0) return null;
            total += row.amount * toRate / fromRate;
        }
        return total;
    };

    const subscriptions = [
        ...((subscriptionsData as any)?.subscriptions || []),
        ...((subscriptionsData as any)?.linkedItems || []),
    ].filter((sub: any) => sub.status === 'active');
    const subscriptionTotal = sumInMainCurrency(subscriptions.map((sub: any) => ({ amount: Number(sub.amount), currency: sub.currency || heroCurrency })));
    const activeCredits = (credits || []).filter((credit: any) => credit.status === 'active');
    const loanPayments = sumInMainCurrency(activeCredits.map((credit: any) => ({ amount: Number(credit.monthlyPayment), currency: credit.currency || heroCurrency })));
    const activeDeposits = (deposits || []).filter((deposit: any) => deposit.status === 'active');
    const depositBalance = sumInMainCurrency(activeDeposits.map((deposit: any) => ({ amount: Number(deposit.currentBalance), currency: deposit.currency || heroCurrency })));
    const portfolioValue = Number((portfolio as any)?.totalPortfolioValue ?? (portfolio as any)?.currentValue ?? 0);
    const convertedPortfolioValue = sumInMainCurrency([{ amount: portfolioValue, currency: 'USD' }]);
    const portfolioReturn = Number((portfolio as any)?.totalReturnPercent ?? 0);

    const transactions: Tx[] = (recent as any)?.transactions || [];

    return (
        <div className="space-y-1 pb-4">
            <UniversalAddSheet open={addOpen} onOpenChange={setAddOpen} />

            {/* Header */}
            <header className="flex items-center justify-between gap-3 py-2">
                <div>
                    <p className="text-[22px] font-extrabold leading-tight tracking-[-0.03em]">
                        W<span className="text-violet-400">oo</span>let
                    </p>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.11em] text-muted-foreground/70">
                        {now.toLocaleDateString('en-US', { weekday: 'long' })} · {now.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Link
                        to="/woo"
                        aria-label="Ask Woo"
                        className="flex size-9 items-center justify-center overflow-hidden rounded-xl bg-primary shadow-[0_6px_18px_rgba(139,92,246,0.28)] transition-transform active:scale-95"
                    >
                        <Momo size={21} />
                    </Link>
                    <div className="flex size-9 items-center justify-center rounded-xl border border-white/[0.13] bg-white/[0.07]">
                        <NotificationsMenu />
                    </div>
                </div>
            </header>

            {/* Hero balance */}
            <section className="relative overflow-hidden rounded-[24px] border border-white/15 p-4 text-white shadow-[0_14px_36px_rgba(76,29,149,0.32)]">
                <HeroBackdrop />
                <GlassEdge />
                <div className="relative">
                    {isSummaryLoading ? (
                        <Skeleton className="h-8 w-40 bg-white/20" />
                    ) : (
                        <p className="truncate text-[30px] font-bold leading-[1.1] tracking-[-0.035em] tabular-nums">
                            {summary ? formatHeroAmount(heroBalance, heroCurrency) : '—'}
                        </p>
                    )}
                    <p className="mt-0.5 text-[11px] text-white/60">
                        {summary ? `${accountCount} account${accountCount === 1 ? '' : 's'}` : 'Totals unavailable'}
                        {currencyCount > 1 ? ` · ${currencyCount} currencies` : ''}
                    </p>

                    <div className="mt-3 space-y-1.5">
                        {topAccounts.length > 0 ? topAccounts.map((account, index) => (
                            <div
                                key={account.accountId}
                                className="flex min-h-10 items-center justify-between gap-2 rounded-xl border border-white/[0.14] bg-white/[0.11] px-2"
                            >
                                <div className="flex min-w-0 items-center gap-2.5">
                                    <span className="flex size-6 shrink-0 items-center justify-center rounded-lg bg-black/15">
                                        <Landmark className={cn('size-3.5', index ? 'text-violet-200' : 'text-white')} />
                                    </span>
                                    <div className="min-w-0">
                                        <p className="truncate text-xs font-bold">{account.accountName}</p>
                                        <p className="truncate text-[9px] font-semibold uppercase tracking-wide text-white/55">{account.bankName}</p>
                                    </div>
                                </div>
                                <CurrencyDisplay amount={account.totalBalance} currency={heroCurrency} abbreviate className="shrink-0 text-xs font-extrabold tabular-nums" />
                            </div>
                        )) : (
                            <p className="py-2 text-sm text-white/70">{summary ? 'Connect an account to bring your money into focus.' : 'Account totals unavailable.'}</p>
                        )}
                    </div>

                    <Link
                        to="/accounts"
                        className="mt-3 inline-flex min-h-8 items-center gap-1 rounded-full bg-white px-3 text-xs font-semibold text-violet-900 transition-opacity active:opacity-80"
                    >
                        View accounts
                        <ArrowRight className="size-3.5" strokeWidth={2.5} />
                    </Link>
                </div>
            </section>

            <div className="pt-3">
                <SpendingAnomalyCard />
            </div>

            {/* This month */}
            <SectionHeader
                title="This month"
                meta={now.toLocaleDateString('en-US', { month: 'long' })}
            />
            <section className="relative overflow-hidden rounded-[22px] border border-white/[0.09] bg-white/[0.055] shadow-[0_14px_32px_rgba(0,0,0,0.4)] backdrop-blur-xl">
                <GlassEdge />
                <div className="grid grid-cols-2 border-b border-white/[0.08] max-[359px]:grid-cols-1">
                    <MonthMetric
                        label="Money in"
                        color="#34D399"
                        icon={<TrendingUp className="size-4" />}
                        value={summary ? <CurrencyDisplay amount={income.total} currency={heroCurrency} abbreviate /> : '—'}
                        count={income.count}
                        series={income.series}
                        to="/spending"
                    />
                    <MonthMetric
                        label="Money out"
                        color="#FB7185"
                        icon={<TrendingDown className="size-4" />}
                        value={summary ? <CurrencyDisplay amount={expenses.total} currency={heroCurrency} abbreviate /> : '—'}
                        count={expenses.count}
                        series={expenses.series}
                        to="/spending"
                        className="border-l border-white/[0.08] max-[359px]:border-l-0 max-[359px]:border-t"
                    />
                </div>

                <div className="relative p-3.5">
                    <div className="flex items-start justify-between gap-4">
                        <div>
                            <p className="text-[11px] font-semibold text-muted-foreground">Spent</p>
                            <CurrencyDisplay amount={spendingTotal} currency={heroCurrency} className="block text-[22px] font-bold leading-tight tracking-tight tabular-nums" />
                        </div>
                        <span className="flex size-8 items-center justify-center rounded-[10px] border border-violet-300/30 bg-violet-500/15">
                            <ReceiptText className="size-4 text-primary dark:text-violet-300" />
                        </span>
                    </div>

                    <div className="mt-3.5 space-y-2.5">
                        {categories.length > 0 ? categories.slice(0, 4).map((category, index) => {
                            const color = category.color || CATEGORY_FALLBACK_COLORS[index % CATEGORY_FALLBACK_COLORS.length];
                            const share = spendingTotal ? (category.value / spendingTotal) * 100 : 0;
                            return (
                                <div key={category.id} className="space-y-1.5">
                                    <div className="flex items-center gap-2">
                                        <span className="size-[7px] rounded-full" style={{ backgroundColor: color }} />
                                        <span className="flex-1 truncate text-xs font-semibold">{category.name}</span>
                                        <CurrencyDisplay amount={category.value} currency={heroCurrency} abbreviate className="text-xs text-muted-foreground tabular-nums" />
                                    </div>
                                    <div className="h-[5px] overflow-hidden rounded-full bg-white/[0.08]">
                                        <div className="h-full rounded-full" style={{ width: `${Math.max(4, Math.min(100, share))}%`, backgroundColor: color }} />
                                    </div>
                                </div>
                            );
                        }) : (
                            <div className="flex flex-col items-center gap-1.5 py-4 text-center">
                                <EmptyRing />
                                <p className="mt-1 text-xs font-bold">Nothing spent yet</p>
                                <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground/70">
                                    Your top categories will light up here
                                </p>
                            </div>
                        )}
                    </div>

                    <Link to="/spending" className="mt-3.5 flex items-center justify-center gap-1 rounded-full border border-white/10 bg-white/[0.06] py-2 text-xs font-semibold hover:underline">
                        See your breakdown
                        <ArrowRight className="size-3.5" />
                    </Link>
                </div>
            </section>

            {/* Money at a glance */}
            <SectionHeader title="Money at a glance" />
            <section className="grid grid-cols-2 gap-2.5">
                <OverviewTile
                    label="Payments"
                    color="#FDA4AF"
                    icon={<CreditCard className="size-4" />}
                    value={loanPayments === null ? '—' : <CurrencyDisplay amount={loanPayments} currency={heroCurrency} abbreviate />}
                    detail={`${activeCredits.length} active loan${activeCredits.length === 1 ? '' : 's'}`}
                    to="/financial/credits"
                />
                <OverviewTile
                    label="Subscriptions"
                    color="#C4B5FD"
                    icon={<CalendarClock className="size-4" />}
                    value={subscriptionTotal === null ? '—' : <CurrencyDisplay amount={subscriptionTotal} currency={heroCurrency} abbreviate />}
                    detail={`${subscriptions.length} recurring`}
                    to="/subscriptions"
                />
                <OverviewTile
                    label="Investments"
                    color="#6EE7B7"
                    icon={<TrendingUp className="size-4" />}
                    value={convertedPortfolioValue === null ? '—' : <CurrencyDisplay amount={convertedPortfolioValue} currency={heroCurrency} abbreviate />}
                    detail={`${portfolioReturn >= 0 ? '+' : '−'}${Math.abs(portfolioReturn).toFixed(1)}% return`}
                    detailColor={portfolioReturn >= 0 ? '#34D399' : '#FB7185'}
                    to="/investing"
                />
                <OverviewTile
                    label="Savings"
                    color="#7DD3FC"
                    icon={<PiggyBank className="size-4" />}
                    value={depositBalance === null ? '—' : <CurrencyDisplay amount={depositBalance} currency={heroCurrency} abbreviate />}
                    detail={`${activeDeposits.length} deposit${activeDeposits.length === 1 ? '' : 's'}`}
                    to="/financial/deposits"
                />
            </section>

            {/* Recent activity */}
            <SectionHeader title="Recent activity" action={{ label: 'See all', to: '/spending' }} />
            <section className="relative overflow-hidden rounded-[22px] border border-white/[0.09] bg-white/[0.05] px-3.5 shadow-[0_14px_32px_rgba(0,0,0,0.4)] backdrop-blur-xl">
                <GlassEdge />
                {transactions.length > 0 ? transactions.slice(0, 4).map((tx, index) => {
                    const isIncome = tx.type === 'income';
                    return (
                        <div key={tx.id} className={cn('relative flex min-h-[56px] items-center gap-2.5', index > 0 && 'border-t border-white/[0.08]')}>
                            <span
                                className="flex size-8 shrink-0 items-center justify-center rounded-[10px] text-[15px]"
                                style={{ backgroundColor: tint(tx.category?.color, 0.13) }}
                            >
                                {tx.category?.icon && !/^[A-Z][a-zA-Z]+$/.test(tx.category.icon) ? tx.category.icon : '↗'}
                            </span>
                            <div className="min-w-0 flex-1">
                                <p className="truncate text-[13px] font-semibold">{tx.description || tx.category?.name || 'Transaction'}</p>
                                <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground/70">
                                    {new Date(tx.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                </p>
                            </div>
                            <span className={cn('max-w-[40%] truncate text-[13px] font-bold tabular-nums', isIncome ? 'text-emerald-600 dark:text-emerald-400' : 'text-foreground')}>
                                {isIncome ? '+' : '−'}
                                <CurrencyDisplay amount={Math.abs(Number(tx.amount))} currency={tx.currencyBalance?.currencyCode || heroCurrency} abbreviate />
                            </span>
                        </div>
                    );
                }) : (
                    <div className="flex min-h-[90px] items-center justify-center text-xs text-muted-foreground">
                        Your latest transactions will show up here.
                    </div>
                )}
            </section>

            <div className="pt-4">
                <button
                    type="button"
                    onClick={() => setAddOpen(true)}
                    className="flex min-h-11 w-full items-center justify-center gap-1.5 rounded-full bg-white text-[13px] font-semibold text-zinc-950 shadow-[0_10px_24px_rgba(250,250,250,0.12)] transition-transform active:scale-[0.98]"
                >
                    <Plus className="size-4" strokeWidth={2.6} />
                    Add transaction
                </button>
            </div>
        </div>
    );
}

function SectionHeader({ title, meta, action }: { title: string; meta?: string; action?: { label: string; to: string } }) {
    return (
        <div className="flex min-h-[46px] items-end justify-between pb-2">
            <h2 className="text-[17px] font-bold tracking-tight">{title}</h2>
            {action ? (
                <Link to={action.to} className="text-xs font-bold text-primary dark:text-violet-300">{action.label}</Link>
            ) : meta ? (
                <span className="rounded-full border border-white/10 bg-white/[0.06] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                    {meta}
                </span>
            ) : null}
        </div>
    );
}

function MonthMetric({
    label,
    color,
    icon,
    value,
    count,
    series,
    to,
    className,
}: {
    label: string;
    color: string;
    icon: ReactNode;
    value: ReactNode;
    count: number;
    series: number[];
    to: string;
    className?: string;
}) {
    return (
        <div className={cn('relative flex min-h-[124px] min-w-0 flex-col p-3.5', className)}>
            <MetricAura color={color} />
            <div className="relative flex items-center justify-between gap-1">
                <span className="text-xs font-bold text-muted-foreground">{label}</span>
                <span
                    className="flex size-7 items-center justify-center rounded-lg border"
                    style={{ color, backgroundColor: tint(color, 0.13), borderColor: tint(color, 0.28) }}
                >
                    {icon}
                </span>
            </div>
            <div className="relative mt-1.5 truncate text-lg font-bold leading-6 tabular-nums" style={{ color }}>{value}</div>
            <p className="relative mt-0.5 text-[10px] font-semibold text-muted-foreground/70">
                {count} {count === 1 ? 'transaction' : 'transactions'}
            </p>
            <Sparkline color={color} data={series} />
            <Link to={to} className="relative mt-2 inline-flex self-start items-center gap-1 text-[11px] font-bold text-primary dark:text-violet-300 hover:underline">Details <ArrowRight className="size-3" /></Link>
        </div>
    );
}

function Sparkline({ color, data }: { color: string; data: number[] }) {
    const values = data.slice(-12);
    const hasData = values.some((value) => value > 0);
    const plotted = values.length ? values : new Array(8).fill(0);
    const maximum = Math.max(...plotted, 1);
    const points = plotted.map((value, index) => {
        const x = plotted.length === 1 ? 50 : (index * 100) / (plotted.length - 1);
        return `${x},${25 - (value / maximum) * 18}`;
    }).join(' ');
    // Dotted ghost wave so an empty month still undulates instead of showing a dead flat line
    const ghost = Array.from({ length: 26 }, (_, index) => {
        const x = (index / 25) * 100;
        const y = 15 + Math.sin(index * 0.52) * 3.2 + Math.cos(index * 0.19) * 1.6;
        return `${x.toFixed(1)},${y.toFixed(1)}`;
    }).join(' ');
    const fillId = `spark-${color.replace(/[^a-zA-Z0-9]/g, '')}`;

    return (
        <svg className="relative mt-auto h-6 w-full pt-1" viewBox="0 0 100 30" preserveAspectRatio="none" aria-hidden="true">
            <defs>
                <linearGradient id={fillId} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0" stopColor={color} stopOpacity={0.26} />
                    <stop offset="1" stopColor={color} stopOpacity={0} />
                </linearGradient>
            </defs>
            {hasData ? (
                <>
                    <polygon points={`${points} 100,30 0,30`} fill={`url(#${fillId})`} />
                    <polyline points={points} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
                </>
            ) : (
                <polyline points={ghost} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeDasharray="0.5 5" opacity={0.45} vectorEffect="non-scaling-stroke" />
            )}
        </svg>
    );
}

function OverviewTile({
    label,
    color,
    icon,
    value,
    detail,
    detailColor,
    to,
}: {
    label: string;
    color: string;
    icon: ReactNode;
    value: ReactNode;
    detail: string;
    detailColor?: string;
    to: string;
}) {
    return (
        <div
            className="relative min-h-[118px] min-w-0 overflow-hidden rounded-2xl border border-white/[0.16] bg-white/[0.045] p-3.5 shadow-[0_10px_22px_rgba(0,0,0,0.28)] backdrop-blur-xl"
        >
            <MetricAura color={color} cx={18} cy={16} />
            <GlassEdge />
            <span
                className="relative mb-2 flex size-8 items-center justify-center rounded-[10px] border"
                style={{ color, backgroundColor: tint(color, 0.13), borderColor: tint(color, 0.28) }}
            >
                {icon}
            </span>
            <p className="relative text-[11px] font-semibold text-[#B9B9C3]">{label}</p>
            <div className="relative mt-0.5 truncate text-[17px] font-bold leading-[22px] tabular-nums">{value}</div>
            {detailColor ? (
                <span
                    className="relative mt-1.5 inline-block rounded-full border px-1.5 py-px text-[10px] font-bold tabular-nums"
                    style={{ color: detailColor, backgroundColor: tint(detailColor, 0.13), borderColor: tint(detailColor, 0.3) }}
                >
                    {detail}
                </span>
            ) : (
                <p className="relative mt-1.5 truncate text-[10px] font-medium text-muted-foreground/70">{detail}</p>
            )}
            <Link to={to} className="relative mt-2 inline-flex items-center gap-1 text-[11px] font-bold text-primary dark:text-violet-300 hover:underline">Details <ArrowRight className="size-3" /></Link>
        </div>
    );
}

// Whole-unit amount with the local symbol (e.g. ₸966,336), like the mobile app's hero
function formatHeroAmount(amount: number, currency: string) {
    try {
        return new Intl.NumberFormat('en-US', { style: 'currency', currency, currencyDisplay: 'narrowSymbol', maximumFractionDigits: 0 }).format(amount);
    } catch {
        return `${Math.round(amount).toLocaleString('en-US')} ${currency}`;
    }
}

// Ghost donut teasing where the breakdown will live once there is spending
function EmptyRing() {
    return (
        <svg width={54} height={54} viewBox="0 0 54 54" aria-hidden="true">
            <circle cx={27} cy={27} r={21} stroke="rgba(255,255,255,0.09)" strokeWidth={5} fill="none" />
            <circle cx={27} cy={27} r={21} stroke="#8B5CF6" strokeWidth={5} fill="none" strokeLinecap="round" strokeDasharray="10 122" opacity={0.6} transform="rotate(-90 27 27)" />
            <circle cx={27} cy={27} r={21} stroke="#7DD3FC" strokeWidth={5} fill="none" strokeLinecap="round" strokeDasharray="6 126" opacity={0.4} transform="rotate(-30 27 27)" />
            <circle cx={27} cy={27} r={2.2} fill="rgba(255,255,255,0.35)" />
        </svg>
    );
}
