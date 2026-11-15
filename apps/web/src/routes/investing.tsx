import { useMemo, useState, useEffect } from 'react';
import { ScopeSwitchRow } from '@/components/family/ScopeSwitch';
import posthog from 'posthog-js';
import { trpc } from '@/lib/trpc';
import { GlassCard, StatTile, tint } from '@/components/ui/glass';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
    Area,
    AreaChart as RechartsAreaChart,
    CartesianGrid,
    ResponsiveContainer,
    Tooltip as RechartsTooltip,
    XAxis,
    YAxis,
} from 'recharts';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CurrencySelect } from '@/components/CurrencySelect';
import { Building2, TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight, DollarSign, Wallet, PieChart, BarChart3, LineChart, Trophy, Trash2, ExternalLink, Cpu, Droplets, Stethoscope, Globe, Newspaper, Plus } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { PageHeader } from '@/components/PageHeader';
import { AddInvestmentSheet } from '@/components/AddInvestmentSheet';
import { SeeInvestingAccountsSheet } from '@/components/SeeInvestingAccountsSheet';
import { ActionButton } from '@/components/ui/action-button';
import { EditInvestmentTransactionSheet } from '@/components/EditInvestmentTransactionSheet';
import { Skeleton } from '@/components/ui/skeleton';
import { CurrencyDisplay } from '@/components/CurrencyDisplay';

import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

import { AiDigestCard } from '@/components/investing/AiDigestCard';

interface StockItem {
    id: string;
    ticker: string;
    name: string;
    exchange?: string | null;
    currency: string;
}

interface HoldingSummary {
    stockId: string;
    ticker: string;
    name: string;
    quantity: number;
    averageCostBasis: number;
    currentPrice: number;
    currentValue: number;
    unrealizedPL: number;
    unrealizedPLPercent: number;
    currency: string;
}

interface Transaction {
    id: string;
    type: 'buy' | 'sell';
    quantity: number;
    pricePerShare: number;
    date: string;
    notes?: string | null;
    stock: {
        ticker: string;
        name: string;
    };
}

interface HoldingWithAllocation extends HoldingSummary {
    allocation: number;
}

type TradeType = 'buy' | 'sell';

interface NewsLinkProps {
    title: string;
    description: string;
    url: string;
    icon: React.ReactNode;
}

function NewsLink({ title, description, url, icon }: NewsLinkProps) {
    return (
        <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-start justify-between p-2.5 border rounded-lg bg-muted/20 hover:bg-muted/40 transition-colors group"
        >
            <div className="flex items-start gap-3">
                <div className="p-1.5 mt-0.5 bg-background rounded-md border text-muted-foreground group-hover:text-primary transition-colors shrink-0">
                    {icon}
                </div>
                <div className="flex-1 min-w-0">
                    <p className="font-semibold text-xs leading-tight group-hover:text-primary transition-colors line-clamp-2">{title}</p>
                    <p className="text-[10px] text-muted-foreground mt-1 line-clamp-2 leading-relaxed">{description}</p>
                </div>
            </div>
            <ExternalLink className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity mt-1 shrink-0" />
        </a>
    );
}

function NewsFeed({ category, icon }: { category: 'latest' | 'ai' | 'oil' | 'medical', icon: React.ReactNode }) {
    const { data: news, isLoading, error } = trpc.news.getNewsByCategory.useQuery({ category });

    if (isLoading) {
        return (
            <div className="space-y-2 mt-3">
                {[...Array(5)].map((_, i) => (
                    <div key={i} className="p-2.5 border rounded-lg flex gap-3">
                        <Skeleton className="h-8 w-8 rounded-md shrink-0" />
                        <div className="flex-1 space-y-1.5 min-w-0">
                            <Skeleton className="h-3 w-3/4" />
                            <Skeleton className="h-2 w-full" />
                            <Skeleton className="h-2 w-1/2" />
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    if (error || !news || news.length === 0) {
        return (
            <div className="mt-3 p-4 text-center border border-dashed rounded-lg bg-muted/10">
                <p className="text-xs text-muted-foreground font-medium">No live news available right now.</p>
                <p className="text-[10px] text-muted-foreground mt-1">Please try again in a few minutes.</p>
            </div>
        );
    }

    return (
        <div className="space-y-2 mt-3">
            {news.slice(0, 7).map((item: { title: string; description: string; link: string }, i: number) => (
                <NewsLink
                    key={i}
                    title={item.title}
                    description={item.description}
                    url={item.link}
                    icon={icon}
                />
            ))}
        </div>
    );
}

export function InvestingPage() {
    const [tradeOpen, setTradeOpen] = useState(false);
    const [tradeType, setTradeType] = useState<TradeType>('buy');
    const [tradeStock, setTradeStock] = useState<StockItem | null>(null);
    const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
    const [tradeQuantity, setTradeQuantity] = useState('');
    const [tradePrice, setTradePrice] = useState('');
    const [tradeDate, setTradeDate] = useState(() => new Date().toISOString().split('T')[0]);
    const [tradeNotes, setTradeNotes] = useState('');
    const [cashDialogOpen, setCashDialogOpen] = useState(false);
    const [cashAmount, setCashAmount] = useState('');
    const [cashCurrency, setCashCurrency] = useState('');
    const [cashType] = useState<'deposit' | 'withdraw'>('deposit');
    const [cashNotes, setCashNotes] = useState('');

    const { data: summary, isLoading: isSummaryLoading } = trpc.investing.getPortfolioSummary.useQuery();
    const { data: stocks, isLoading: isStocksLoading } = trpc.investing.listStocks.useQuery();
    const { data: transactions } = trpc.investing.getTransactions.useQuery({});
    const { data: _cashBalances } = trpc.investing.getInvestmentCashBalance.useQuery();
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;
    const chartRange = '1Y';
    const { data: benchmarkComparison, isLoading: isBenchmarkLoading } = trpc.investing.getBenchmarkComparison.useQuery({
        range: chartRange,
    });

    const utils = trpc.useUtils();

    useEffect(() => {
        if (summary) {
            posthog.setPersonProperties({
                investment_count: summary.holdings.length,
                total_investment_value: summary.totalValue
            });
            posthog.capture('investing_viewed', {
                investment_count: summary.holdings.length,
                total_investment_value: summary.totalValue
            });
        }
    }, [summary]);

    const buyStock = trpc.investing.buyStock.useMutation({
        onSuccess: () => {
            utils.investing.getPortfolioSummary.invalidate();
            utils.investing.listStocks.invalidate();
            utils.investing.getTransactions.invalidate();
            toast.success('Buy transaction recorded');
            resetTrade();
        },
        onError: (error: { message?: string }) => toast.error(error.message || 'Failed to record buy'),
    });

    const sellStock = trpc.investing.sellStock.useMutation({
        onSuccess: () => {
            utils.investing.getPortfolioSummary.invalidate();
            utils.investing.listStocks.invalidate();
            utils.investing.getTransactions.invalidate();
            toast.success('Sell transaction recorded');
            resetTrade();
        },
        onError: (error: { message?: string }) => toast.error(error.message || 'Failed to record sell'),
    });

    const deleteAllStocks = trpc.investing.deleteAllStocks.useMutation({
        onSuccess: () => {
            utils.investing.getPortfolioSummary.invalidate();
            utils.investing.listStocks.invalidate();
            utils.investing.getTransactions.invalidate();
            utils.investing.getInvestmentCashBalance.invalidate();
            toast.success('All stocks deleted');
        },
        onError: (error: { message?: string }) => toast.error(error.message || 'Failed to delete stocks'),
    });

    const depositCash = trpc.investing.depositToInvestment.useMutation({
        onSuccess: () => {
            utils.investing.getPortfolioSummary.invalidate();
            utils.investing.getInvestmentCashBalance.invalidate();
            toast.success('Cash deposited to investment account');
        },
        onError: (error: { message?: string }) => toast.error(error.message || 'Failed to deposit cash'),
    });

    const withdrawCash = trpc.investing.withdrawFromInvestment.useMutation({
        onSuccess: () => {
            utils.investing.getPortfolioSummary.invalidate();
            utils.investing.getInvestmentCashBalance.invalidate();
            toast.success('Cash withdrawn from investment account');
        },
        onError: (error: { message?: string }) => toast.error(error.message || 'Failed to withdraw cash'),
    });

    const holdingsByStockId = useMemo(() => {
        const map = new Map<string, HoldingSummary>();
        (summary?.holdings || []).forEach((holding: HoldingSummary) => {
            map.set(holding.stockId, holding);
        });
        return map;
    }, [summary]);

    // Calculate allocation percentages for holdings
    const holdingsWithAllocation: HoldingWithAllocation[] = useMemo(() => {
        if (!summary?.holdings || summary.holdings.length === 0) return [];
        const total = summary.currentValue || 1;
        return (summary.holdings as HoldingSummary[]).map((h) => ({
            ...h,
            allocation: (h.currentValue / total) * 100,
        })).sort((a, b) => b.currentValue - a.currentValue);
    }, [summary]);

    const portfolioHighlights = useMemo(() => {
        if (!summary?.holdings || summary.holdings.length === 0) return null;
        const h = [...summary.holdings] as HoldingSummary[];
        // Sort by PL %
        const byPerformance = [...h].sort((a, b) => b.unrealizedPLPercent - a.unrealizedPLPercent);
        const best = byPerformance[0];
        const worst = byPerformance[byPerformance.length - 1];

        // Sort by Value
        const byValue = [...h].sort((a, b) => b.currentValue - a.currentValue);
        const largest = byValue[0];

        return { best, worst, largest };
    }, [summary]);

    const totalInvested = summary?.totalInvested ?? 0;
    const currentValue = summary?.stockValue ?? 0; // Stock value only
    const totalReturn = summary?.totalReturn ?? 0;
    const totalReturnPercent = summary?.totalReturnPercent ?? 0;
    const totalQuantity = summary?.holdings?.reduce((sum: number, h: HoldingSummary) => sum + h.quantity, 0) ?? 0;
    const avgBuyPrice = totalQuantity > 0 ? totalInvested / totalQuantity : 0;

    const openTrade = (type: TradeType, stock: StockItem) => {
        setTradeType(type);
        setTradeStock(stock);
        setTradeQuantity('');
        setTradePrice('');
        setTradeNotes('');
        setTradeOpen(true);
    };

    const resetTrade = () => {
        setTradeOpen(false);
        setTradeStock(null);
        setTradeQuantity('');
        setTradePrice('');
        setTradeNotes('');
        setTradeDate(new Date().toISOString().split('T')[0]);
    };

    const submitTrade = () => {
        if (!tradeStock) return;
        const quantity = Number(tradeQuantity);
        const pricePerShare = Number(tradePrice);

        if (!quantity || quantity <= 0 || !pricePerShare || pricePerShare <= 0) {
            toast.error('Enter valid quantity and price');
            return;
        }

        const payload = {
            stockId: tradeStock.id,
            date: tradeDate,
            quantity,
            pricePerShare,
            currency: tradeStock.currency,
            notes: tradeNotes || undefined,
        };

        if (tradeType === 'buy') {
            buyStock.mutate(payload);
        } else {
            sellStock.mutate(payload);
        }
    };

    const formatNumber = (value: number) =>
        value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });
    };

    const isLoading = isSummaryLoading || isStocksLoading;
    const isChartLoading = isLoading || isBenchmarkLoading;

    // Allocation colors
    const allocationColors = [
        '#60A5FA', '#34D399', '#A78BFA', '#FB923C',
        '#F472B6', '#22D3EE', '#FACC15', '#F87171'
    ];

    const chartData = useMemo(() => {
        const portfolioSeries = benchmarkComparison?.portfolio?.chartData || [];
        const benchmarkSeries = benchmarkComparison?.benchmark?.chartData || [];
        if (portfolioSeries.length === 0 || benchmarkSeries.length === 0) return [];

        const benchmarkMap = new Map(benchmarkSeries.map((point: { date: string; value: number }) => [point.date, point.value]));
        return portfolioSeries.map((point: { date: string; value: number }) => ({
            date: point.date,
            portfolio: point.value,
            benchmark: benchmarkMap.get(point.date) ?? 0,
        }));
    }, [benchmarkComparison]);

    const portfolioReturnPercent = benchmarkComparison?.portfolio?.returnPercent ?? 0;
    const benchmarkReturnPercent = benchmarkComparison?.benchmark?.returnPercent ?? 0;
    const outperformance = portfolioReturnPercent - benchmarkReturnPercent;

    const formatShortDate = (value: string, index: number) => {
        const date = new Date(value);
        const month = date.toLocaleDateString('en-US', { month: 'short' });

        // Show year on January or if it's the very first tick
        if (date.getMonth() === 0 || index === 0) {
            return `${month} '${date.getFullYear().toString().slice(-2)}`;
        }
        return month;
    };

    return (
        <div className="space-y-4 md:space-y-6 h-full">
            {/* Header with Add Button */}
            <PageHeader
                title="Investing"
                subtitle="Track stocks, ETFs, and portfolio performance"
                variant="two-with-text"
            >
                <SeeInvestingAccountsSheet
                    trigger={
                        <Button variant="outline" className="gap-2 flex-1 sm:flex-none">
                            <Building2 className="h-4 w-4" />
                            Accounts
                        </Button>
                    }
                />
                <AddInvestmentSheet
                    trigger={
                        <ActionButton className="flex-1 sm:flex-none">
                            <Plus className="h-4 w-4" />
                            Add
                        </ActionButton>
                    }
                />
            </PageHeader>
            <ScopeSwitchRow />

            {/* Edit Transaction Sheet */}
            <EditInvestmentTransactionSheet
                open={!!editingTransaction}
                onOpenChange={(open) => !open && setEditingTransaction(null)}
                transaction={editingTransaction}
            />

            {/* AI Digest */}
            <AiDigestCard />

            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                <StatTile
                    label="Portfolio value"
                    color="#34D399"
                    icon={<Wallet className="size-4" />}
                    value={isLoading ? <Skeleton className="h-7 w-28" /> : <CurrencyDisplay amount={currentValue} currency="USD" />}
                    hint={`${holdingsWithAllocation.length} position${holdingsWithAllocation.length === 1 ? '' : 's'}`}
                />
                <StatTile
                    label="Total return"
                    color={totalReturn >= 0 ? '#4ADE80' : '#FB7185'}
                    icon={totalReturn >= 0 ? <TrendingUp className="size-4" /> : <TrendingDown className="size-4" />}
                    value={isLoading ? <Skeleton className="h-7 w-24" /> : (
                        <CurrencyDisplay amount={totalReturn} currency="USD" showSign color={totalReturn >= 0 ? '#4ADE80' : '#FB7185'} />
                    )}
                    hint={`${totalReturnPercent >= 0 ? '+' : ''}${totalReturnPercent.toFixed(1)}% all time`}
                />
                <StatTile
                    label="Invested"
                    color="#A78BFA"
                    icon={<DollarSign className="size-4" />}
                    value={isLoading ? <Skeleton className="h-7 w-24" /> : <CurrencyDisplay amount={totalInvested} currency="USD" />}
                    hint={<>Avg buy <CurrencyDisplay amount={avgBuyPrice} currency="USD" abbreviate /></>}
                />
                <StatTile
                    label="vs S&P 500"
                    color="#FB923C"
                    icon={<BarChart3 className="size-4" />}
                    value={isChartLoading ? <Skeleton className="h-7 w-16" /> : (
                        <span className={outperformance >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                            {outperformance >= 0 ? '+' : ''}{outperformance.toFixed(1)}%
                        </span>
                    )}
                    hint={`${formatNumber(totalQuantity)} units owned`}
                />
            </div>

            <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
                {/* Asset Growth */}
                <GlassCard auraColor="#34D399" className="flex min-h-[340px] flex-col p-4 sm:p-5 xl:col-span-2">
                    <div className="relative flex flex-wrap items-start justify-between gap-3">
                        <div>
                            <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-muted-foreground">Asset growth · 1Y</p>
                            <p className="mt-1 text-sm text-muted-foreground">Portfolio vs S&P 500</p>
                        </div>
                        {chartData.length > 0 && (
                            <div className="flex items-center gap-2 text-xs font-semibold">
                                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 px-2.5 py-1 text-emerald-300">
                                    <span className="size-1.5 rounded-full bg-emerald-400" />
                                    Portfolio {portfolioReturnPercent >= 0 ? '+' : ''}{portfolioReturnPercent.toFixed(1)}%
                                </span>
                                <span className="inline-flex items-center gap-1.5 rounded-full bg-orange-500/15 px-2.5 py-1 text-orange-300">
                                    <span className="size-1.5 rounded-full bg-orange-400" />
                                    S&P {benchmarkReturnPercent >= 0 ? '+' : ''}{benchmarkReturnPercent.toFixed(1)}%
                                </span>
                            </div>
                        )}
                    </div>
                    <div className="relative mt-4 flex-1">
                        {isChartLoading ? (
                            <div className="h-64 rounded-2xl bg-white/[0.04] animate-pulse" />
                        ) : currentValue === 0 || chartData.length === 0 ? (
                            <div className="flex h-64 items-center justify-center text-center text-sm text-muted-foreground">
                                <div>
                                    <LineChart className="mx-auto mb-2 h-8 w-8 opacity-50" />
                                    <p>Add investments to see growth chart</p>
                                </div>
                            </div>
                        ) : (
                            <ResponsiveContainer width="100%" height={260}>
                                <RechartsAreaChart data={chartData} margin={{ left: 0, right: 8, top: 8 }}>
                                    <defs>
                                        <linearGradient id="invPortfolioFill" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="0%" stopColor="#34D399" stopOpacity={0.35} />
                                            <stop offset="100%" stopColor="#34D399" stopOpacity={0} />
                                        </linearGradient>
                                        <linearGradient id="invBenchFill" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="0%" stopColor="#FB923C" stopOpacity={0.18} />
                                            <stop offset="100%" stopColor="#FB923C" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid vertical={false} stroke="rgba(255,255,255,0.06)" />
                                    <XAxis
                                        dataKey="date"
                                        tickLine={false}
                                        axisLine={false}
                                        tickMargin={8}
                                        tickFormatter={formatShortDate}
                                        tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
                                    />
                                    <YAxis
                                        tickFormatter={(value) => `${value}%`}
                                        tickLine={false}
                                        axisLine={false}
                                        width={40}
                                        tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
                                    />
                                    <RechartsTooltip
                                        cursor={{ stroke: 'rgba(255,255,255,0.15)' }}
                                        contentStyle={{
                                            background: 'hsl(var(--card))',
                                            border: '1px solid rgba(255,255,255,0.1)',
                                            color: 'hsl(var(--foreground))',
                                            borderRadius: 14,
                                            boxShadow: '0 8px 20px rgba(0,0,0,0.35)',
                                        }}
                                        labelStyle={{ color: 'hsl(var(--muted-foreground))' }}
                                        formatter={(value: number, name: string) => [
                                            `${value.toFixed(2)}%`,
                                            name === 'portfolio' ? 'Portfolio' : 'S&P 500',
                                        ]}
                                        labelFormatter={(label) =>
                                            new Date(label).toLocaleDateString('en-US', {
                                                month: 'short',
                                                day: '2-digit',
                                                year: 'numeric',
                                            })
                                        }
                                    />
                                    <Area type="natural" dataKey="benchmark" stroke="#FB923C" fill="url(#invBenchFill)" strokeWidth={1.5} />
                                    <Area type="natural" dataKey="portfolio" stroke="#34D399" fill="url(#invPortfolioFill)" strokeWidth={2.5} />
                                </RechartsAreaChart>
                            </ResponsiveContainer>
                        )}
                    </div>
                </GlassCard>

                {/* Portfolio Highlights */}
                <GlassCard auraColor="#FBBF24" className="p-4 sm:p-5">
                    <div className="relative flex items-center gap-2">
                        <Trophy className="h-4 w-4 text-amber-400" />
                        <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-muted-foreground">Highlights</p>
                    </div>
                    {!portfolioHighlights ? (
                        <p className="relative py-10 text-center text-sm text-muted-foreground">Highlights appear once you hold stocks</p>
                    ) : (
                        <div className="relative mt-4 space-y-2.5">
                            {[
                                {
                                    label: 'Best performer',
                                    holding: portfolioHighlights.best,
                                    color: '#4ADE80',
                                    icon: <TrendingUp className="h-4 w-4" />,
                                    value: `${portfolioHighlights.best.unrealizedPLPercent >= 0 ? '+' : ''}${portfolioHighlights.best.unrealizedPLPercent.toFixed(2)}%`,
                                    sub: <CurrencyDisplay amount={portfolioHighlights.best.unrealizedPL} currency="USD" showSign />,
                                },
                                {
                                    label: 'Worst performer',
                                    holding: portfolioHighlights.worst,
                                    color: '#FB7185',
                                    icon: <TrendingDown className="h-4 w-4" />,
                                    value: `${portfolioHighlights.worst.unrealizedPLPercent >= 0 ? '+' : ''}${portfolioHighlights.worst.unrealizedPLPercent.toFixed(2)}%`,
                                    sub: <CurrencyDisplay amount={portfolioHighlights.worst.unrealizedPL} currency="USD" showSign />,
                                },
                                {
                                    label: 'Largest holding',
                                    holding: portfolioHighlights.largest,
                                    color: '#60A5FA',
                                    icon: <PieChart className="h-4 w-4" />,
                                    value: <CurrencyDisplay amount={portfolioHighlights.largest.currentValue} currency="USD" />,
                                    sub: `${((portfolioHighlights.largest.currentValue / (currentValue || 1)) * 100).toFixed(1)}% of portfolio`,
                                },
                            ].map((item) => (
                                <div key={item.label} className="flex items-center gap-3 rounded-2xl border border-white/[0.06] bg-white/[0.03] p-3">
                                    <span className="flex size-9 shrink-0 items-center justify-center rounded-xl" style={{ backgroundColor: tint(item.color, 0.15), color: item.color }}>
                                        {item.icon}
                                    </span>
                                    <div className="min-w-0 flex-1">
                                        <p className="text-[11px] text-muted-foreground">{item.label}</p>
                                        <p className="truncate text-sm font-semibold">{item.holding.ticker}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm font-bold" style={{ color: item.color }}>{item.value}</p>
                                        <p className="text-[11px] text-muted-foreground">{item.sub}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </GlassCard>
            </div>

            {/* Holdings: stocks merged with allocation */}
            <GlassCard className="p-2 sm:p-3">
                <div className="relative flex items-center justify-between gap-3 p-2">
                    <div>
                        <p className="text-sm font-semibold">Holdings</p>
                        <p className="text-xs text-muted-foreground">Positions, weight in portfolio and quick trades</p>
                    </div>
                    {stocks && stocks.length > 0 && (
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-red-400" title="Delete all stocks">
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>Delete all stocks?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        This action cannot be undone. This will permanently delete all your stocks, holdings, and transaction history.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction
                                        className="bg-red-500 hover:bg-red-600"
                                        onClick={() => deleteAllStocks.mutate()}
                                    >
                                        Delete All
                                    </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    )}
                </div>
                <div className="relative">
                    {isStocksLoading ? (
                        <div className="space-y-2 p-2">
                            {[1, 2, 3].map((i) => (
                                <Skeleton key={i} className="h-14 w-full rounded-2xl" />
                            ))}
                        </div>
                    ) : (!stocks || stocks.length === 0) ? (
                        <div className="flex flex-col items-center justify-center gap-2 py-12 text-center">
                            <span className="flex size-12 items-center justify-center rounded-2xl bg-white/[0.05] text-muted-foreground">
                                <TrendingUp className="size-5" />
                            </span>
                            <p className="text-sm font-semibold">No stocks added yet</p>
                            <p className="text-xs text-muted-foreground">Click "Add Investment" to get started</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-white/[0.06]">
                            {[...stocks]
                                .sort((a: StockItem, b: StockItem) =>
                                    (holdingsByStockId.get(b.id)?.currentValue ?? 0) - (holdingsByStockId.get(a.id)?.currentValue ?? 0))
                                .map((stock: StockItem, index: number) => {
                                    const holding = holdingsByStockId.get(stock.id);
                                    const color = allocationColors[index % allocationColors.length];
                                    const allocation = holding ? (holding.currentValue / (currentValue || 1)) * 100 : 0;
                                    const isUp = (holding?.unrealizedPL ?? 0) >= 0;
                                    return (
                                        <div key={stock.id} className="flex items-center gap-3 rounded-2xl px-2.5 py-3 sm:px-3 transition-colors hover:bg-white/[0.04]">
                                            <span
                                                className="flex size-10 shrink-0 items-center justify-center rounded-2xl text-[10px] font-bold"
                                                style={{ backgroundColor: tint(color, 0.16), color, boxShadow: `inset 0 0 0 1px ${tint(color, 0.3)}` }}
                                            >
                                                {stock.ticker.slice(0, 4)}
                                            </span>
                                            <div className="min-w-0 flex-1">
                                                <div className="flex items-center gap-2">
                                                    <p className="text-sm font-semibold">{stock.ticker}</p>
                                                    <p className="truncate text-xs text-muted-foreground">{stock.name}</p>
                                                </div>
                                                <div className="mt-1.5 flex items-center gap-2">
                                                    <div className="h-1 w-full max-w-[160px] overflow-hidden rounded-full bg-white/[0.08]">
                                                        <div className="h-full rounded-full" style={{ width: `${Math.min(allocation, 100)}%`, backgroundColor: color }} />
                                                    </div>
                                                    <span className="text-[11px] tabular-nums text-muted-foreground">
                                                        {allocation.toFixed(1)}% · {holding ? holding.quantity.toFixed(2) : '0'} sh
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="shrink-0 text-right">
                                                <p className="text-sm font-bold">
                                                    {holding ? <CurrencyDisplay amount={holding.currentValue} currency="USD" /> : '—'}
                                                </p>
                                                {holding && (
                                                    <p className={cn('text-[11px] font-semibold', isUp ? 'text-emerald-400' : 'text-rose-400')}>
                                                        {isUp ? '+' : ''}{holding.unrealizedPLPercent.toFixed(1)}%
                                                    </p>
                                                )}
                                            </div>
                                            <div className="flex shrink-0 gap-1">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-8 px-2 text-xs text-emerald-400 hover:bg-emerald-500/10 hover:text-emerald-300"
                                                    onClick={() => openTrade('buy', stock)}
                                                >
                                                    <ArrowUpRight className="h-3.5 w-3.5" />
                                                    <span className="hidden sm:inline">Buy</span>
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-8 px-2 text-xs text-rose-400 hover:bg-rose-500/10 hover:text-rose-300"
                                                    onClick={() => openTrade('sell', stock)}
                                                >
                                                    <ArrowDownRight className="h-3.5 w-3.5" />
                                                    <span className="hidden sm:inline">Sell</span>
                                                </Button>
                                            </div>
                                        </div>
                                    );
                                })}
                        </div>
                    )}
                </div>
            </GlassCard>

            <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
                {/* Transaction History */}
                {transactions && transactions.length > 0 && (
                    <GlassCard className="p-2 sm:p-3 xl:col-span-2">
                        <div className="relative p-2">
                            <p className="text-sm font-semibold">Transactions</p>
                            <p className="text-xs text-muted-foreground">Tap a trade to edit it</p>
                        </div>
                        <div className="relative divide-y divide-white/[0.06]">
                            {transactions.slice(0, currentPage * itemsPerPage).map((tx: Transaction) => {
                                const quantity = Number(tx.quantity ?? 0);
                                const pricePerShare = Number(tx.pricePerShare ?? 0);
                                const isBuy = tx.type === 'buy';
                                return (
                                    <button
                                        key={tx.id}
                                        type="button"
                                        onClick={() => setEditingTransaction(tx)}
                                        className="flex w-full items-center gap-3 rounded-2xl px-2.5 py-2.5 text-left transition-colors hover:bg-white/[0.04] sm:px-3"
                                    >
                                        <span className={cn(
                                            'flex size-9 shrink-0 items-center justify-center rounded-xl',
                                            isBuy ? 'bg-emerald-500/15 text-emerald-400' : 'bg-rose-500/15 text-rose-400'
                                        )}>
                                            {isBuy ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}
                                        </span>
                                        <div className="min-w-0 flex-1">
                                            <p className="truncate text-sm font-semibold">
                                                {isBuy ? 'Bought' : 'Sold'} {tx.stock.ticker}
                                                <span className="ml-1.5 font-normal text-muted-foreground">{tx.stock.name}</span>
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                                {formatDate(tx.date)} · {quantity.toFixed(4)} × <CurrencyDisplay amount={pricePerShare} currency="USD" abbreviate={false} />
                                            </p>
                                        </div>
                                        <CurrencyDisplay amount={quantity * pricePerShare} currency="USD" className="shrink-0 text-sm font-bold" />
                                    </button>
                                );
                            })}
                        </div>
                        {transactions.length > currentPage * itemsPerPage && (
                            <div className="relative flex justify-center p-2">
                                <Button variant="ghost" size="sm" className="text-muted-foreground" onClick={() => setCurrentPage((prev) => prev + 1)}>
                                    Show more ({transactions.length - currentPage * itemsPerPage})
                                </Button>
                            </div>
                        )}
                    </GlassCard>
                )}

                {/* Market Intelligence */}
                <GlassCard auraColor="#38BDF8" className={cn('p-4 sm:p-5', (!transactions || transactions.length === 0) && 'xl:col-span-3')}>
                    <div className="relative mb-3 flex items-center gap-2">
                        <Newspaper className="h-4 w-4 text-sky-400" />
                        <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-muted-foreground">Market news</p>
                    </div>
                    <Tabs defaultValue="latest" className="relative w-full">
                        <TabsList className="grid h-9 w-full grid-cols-4 rounded-xl border border-white/10 bg-white/[0.04]">
                            <TabsTrigger value="latest" className="rounded-lg text-xs">Latest</TabsTrigger>
                            <TabsTrigger value="ai" className="rounded-lg text-xs">Tech</TabsTrigger>
                            <TabsTrigger value="oil" className="rounded-lg text-xs">Energy</TabsTrigger>
                            <TabsTrigger value="medical" className="rounded-lg text-xs">Health</TabsTrigger>
                        </TabsList>
                        <TabsContent value="latest">
                            <NewsFeed category="latest" icon={<Globe className="h-4 w-4" />} />
                        </TabsContent>
                        <TabsContent value="ai">
                            <NewsFeed category="ai" icon={<Cpu className="h-4 w-4" />} />
                        </TabsContent>
                        <TabsContent value="oil">
                            <NewsFeed category="oil" icon={<Droplets className="h-4 w-4" />} />
                        </TabsContent>
                        <TabsContent value="medical">
                            <NewsFeed category="medical" icon={<Stethoscope className="h-4 w-4" />} />
                        </TabsContent>
                    </Tabs>
                </GlassCard>
            </div>

            {/* Trade Dialog */}
            <Dialog open={tradeOpen} onOpenChange={setTradeOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            {tradeType === 'buy' ? (
                                <>
                                    <ArrowUpRight className="h-5 w-5 text-green-500" />
                                    Buy {tradeStock?.ticker}
                                </>
                            ) : (
                                <>
                                    <ArrowDownRight className="h-5 w-5 text-red-500" />
                                    Sell {tradeStock?.ticker}
                                </>
                            )}
                        </DialogTitle>
                        <DialogDescription>
                            Record a {tradeType} transaction for {tradeStock?.name}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="date" className="text-right text-xs">
                                Date
                            </Label>
                            <Input
                                id="date"
                                type="date"
                                value={tradeDate}
                                onChange={(e) => setTradeDate(e.target.value)}
                                className="col-span-3"
                            />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="quantity" className="text-right text-xs">
                                Quantity
                            </Label>
                            <Input
                                id="quantity"
                                type="number"
                                step="0.0001"
                                placeholder="0.00"
                                value={tradeQuantity}
                                onChange={(e) => setTradeQuantity(e.target.value)}
                                className="col-span-3"
                            />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="price" className="text-right text-xs">
                                Price/Share
                            </Label>
                            <Input
                                id="price"
                                type="number"
                                step="0.01"
                                placeholder="0.00"
                                value={tradePrice}
                                onChange={(e) => setTradePrice(e.target.value)}
                                className="col-span-3"
                            />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="notes" className="text-right text-xs">
                                Notes
                            </Label>
                            <Input
                                id="notes"
                                placeholder="Optional notes..."
                                value={tradeNotes}
                                onChange={(e) => setTradeNotes(e.target.value)}
                                className="col-span-3"
                            />
                        </div>
                        {tradeQuantity && tradePrice && (
                            <div className="grid grid-cols-4 items-center gap-4">
                                <div className="text-right text-xs text-muted-foreground">Total</div>
                                <div className="col-span-3 font-semibold">
                                    <CurrencyDisplay amount={Number(tradeQuantity) * Number(tradePrice)} currency={tradeStock?.currency || 'USD'} />
                                </div>
                            </div>
                        )}
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={resetTrade}>
                            Cancel
                        </Button>
                        <Button
                            onClick={submitTrade}
                            variant={tradeType === 'buy' ? 'success' : 'destructive'}
                            disabled={buyStock.isPending || sellStock.isPending}
                        >
                            {buyStock.isPending || sellStock.isPending ? 'Recording...' : `Record ${tradeType === 'buy' ? 'Buy' : 'Sell'}`}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Cash Management Dialog */}
            <Dialog open={cashDialogOpen} onOpenChange={setCashDialogOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>
                            {cashType === 'deposit' ? 'Deposit Cash' : 'Withdraw Cash'}
                        </DialogTitle>
                        <DialogDescription>
                            {cashType === 'deposit'
                                ? 'Add funds to your investment account from your bank account'
                                : 'Withdraw funds from your investment account to your bank account'
                            }
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="amount">Amount</Label>
                            <Input
                                id="amount"
                                type="number"
                                placeholder="0.00"
                                value={cashAmount}
                                onChange={(e) => setCashAmount(e.target.value)}
                                step="0.01"
                                min="0.01"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="currency">Currency</Label>
                            <CurrencySelect
                                value={cashCurrency}
                                onValueChange={setCashCurrency}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="notes">Notes (Optional)</Label>
                            <Input
                                id="notes"
                                placeholder="e.g., Monthly contribution"
                                value={cashNotes}
                                onChange={(e) => setCashNotes(e.target.value)}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setCashDialogOpen(false)}>
                            Cancel
                        </Button>
                        <Button
                            onClick={() => {
                                const amount = parseFloat(cashAmount);
                                if (!amount || amount <= 0) {
                                    toast.error('Please enter a valid amount');
                                    return;
                                }

                                if (cashType === 'deposit') {
                                    depositCash.mutate({
                                        amount,
                                        currency: cashCurrency,
                                        notes: cashNotes,
                                    });
                                } else {
                                    withdrawCash.mutate({
                                        amount,
                                        currency: cashCurrency,
                                        notes: cashNotes,
                                    });
                                }
                                setCashDialogOpen(false);
                                setCashAmount('');
                                setCashNotes('');
                            }}
                            disabled={depositCash.isPending || withdrawCash.isPending}
                        >
                            {depositCash.isPending || withdrawCash.isPending ? 'Processing...' : cashType === 'deposit' ? 'Deposit' : 'Withdraw'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
