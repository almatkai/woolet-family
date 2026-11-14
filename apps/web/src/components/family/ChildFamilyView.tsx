import { Skeleton } from '@/components/ui/skeleton';
import { LimitSummary } from './LimitsCard';
import { useState } from 'react';
import { Link } from '@tanstack/react-router';
import { Wallet } from 'lucide-react';
import { trpc } from '@/lib/trpc';
import { PageHeader } from '@/components/PageHeader';
import { ActionButton } from '@/components/ui/action-button';
import { Button } from '@/components/ui/button';
import { GlassCard } from '@/components/ui/glass';
import { ProductEmptyState } from '@/components/financial/ProductCard';
import { WalletRow } from './WalletRow';
import { TransactionList } from './TransactionList';
import { FamilyTransactionSheet } from './FamilyTransactionSheet';
import { LeaveFamily } from './LeaveFamily';
import {
    FamilyMoney,
    Initials,
    MoneyTotals,
    LimitBar,
    staticRowClass,
    sectionLabel,
} from './shared';
import {
    localToday,
    type FamilyLimit,
    type FamilyWalletsResponse,
    type HouseholdOverview,
} from './types';

export function ChildFamilyView({
    family,
    data,
}: {
    family: NonNullable<HouseholdOverview>;
    data: FamilyWalletsResponse;
}) {
    const [open, setOpen] = useState(false);
    const wallets = data.wallets;
    const wallet = wallets[0];
    const limitsQuery = trpc.household.limits.useQuery(
        { walletId: wallet?.id ?? '', today: localToday() },
        { enabled: !!wallet },
    );
    const limits = limitsQuery.data as FamilyLimit[] | undefined;
    const total = limits
        ?.filter((l) => !l.categoryId)
        .sort((a, b) => Number(a.remaining) - Number(b.remaining))[0];
    const money = (amount: string) => (
        <FamilyMoney amount={amount} currency={wallet.currencyCode} />
    );
    return (
        <div className="space-y-4 md:space-y-6">
            <PageHeader
                title="Family"
                subtitle={family.household.name}
                variant="one"
            >
                {wallet && (
                    <ActionButton
                        className="flex-1 sm:flex-none"
                        onClick={() => setOpen(true)}
                    >
                        Add expense
                    </ActionButton>
                )}
            </PageHeader>
            <p className={`${sectionLabel} sm:hidden`}>
                {family.household.name}
            </p>
            {!wallet ? (
                <ProductEmptyState
                    icon={<Wallet className="size-6" />}
                    title="No wallet yet"
                    description={`Ask ${family.members.find((m) => m.userId === family.household.ownerUserId)?.name ?? 'your family owner'} to set up a wallet for you.`}
                />
            ) : (
                <>
                    {wallets.length === 1 ? (
                        <GlassCard className="p-5 sm:p-6">
                            <h2 className={sectionLabel}>{wallet.name}</h2>
                            <FamilyMoney
                                amount={wallet.balance}
                                currency={wallet.currencyCode}
                                className="mt-2 block text-4xl font-bold tracking-tight"
                            />
                            {limitsQuery.error ? (
                                <div className="mt-4 space-y-2">
                                    <p className="text-sm text-destructive">
                                        {limitsQuery.error.message}
                                    </p>
                                    <Button
                                        variant="outline"
                                        onClick={() =>
                                            void limitsQuery.refetch()
                                        }
                                    >
                                        Try again
                                    </Button>
                                </div>
                            ) : limitsQuery.isLoading ? (
                                <Skeleton className="mt-4 h-16 w-full" />
                            ) : (
                                <div className="mt-4 space-y-3">
                                    {total ? (
                                        <LimitSummary
                                            total={total}
                                            currency={wallet.currencyCode}
                                            reset
                                        />
                                    ) : (
                                        <p className="text-sm">
                                            {limits?.length
                                                ? 'Category spending limits'
                                                : 'No spending limit'}
                                        </p>
                                    )}
                                    {limits
                                        ?.filter((l) => l.categoryId)
                                        .map((l) => (
                                            <div
                                                key={l.id}
                                                className="space-y-2"
                                            >
                                                <div className="flex justify-between gap-3 text-sm">
                                                    <span>
                                                        {l.categoryName}
                                                    </span>
                                                    <span>
                                                        {money(l.spent)} of{' '}
                                                        {money(l.amount)}
                                                    </span>
                                                </div>
                                                <LimitBar
                                                    spent={Number(l.spent)}
                                                    limit={Number(l.amount)}
                                                    size="sm"
                                                />
                                            </div>
                                        ))}
                                </div>
                            )}
                        </GlassCard>
                    ) : (
                        <GlassCard className="divide-y divide-border p-2 dark:divide-white/[0.06] sm:p-3">
                            {wallets.map((w) => (
                                <WalletRow key={w.id} wallet={w} />
                            ))}
                        </GlassCard>
                    )}
                    {wallets.map((w) => (
                        <section key={w.id} className="space-y-3">
                            <div className="flex items-center justify-between">
                                <h2 className={sectionLabel}>
                                    Recent
                                    {wallets.length > 1 ? ` · ${w.name}` : ''}
                                </h2>
                                <Button
                                    asChild
                                    variant="ghost"
                                    size="sm"
                                    className="h-10"
                                >
                                    <Link
                                        to="/family/wallets/$walletId"
                                        params={{ walletId: w.id }}
                                    >
                                        See all
                                    </Link>
                                </Button>
                            </div>
                            <TransactionList wallet={w} limit={10} />
                        </section>
                    ))}
                </>
            )}
            {!!data.sharedWalletsVisible.length && (
                <section className="space-y-3">
                    <h2 className={sectionLabel}>Family wallets</h2>
                    <GlassCard className="divide-y divide-border p-2 dark:divide-white/[0.06] sm:p-3">
                        {data.sharedWalletsVisible.map((w) => (
                            <div key={w.id} className={staticRowClass}>
                                <div className="min-w-0 flex-1">
                                    <p className="truncate text-sm font-semibold">
                                        {w.name}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                        Shared
                                    </p>
                                </div>
                                <FamilyMoney
                                    amount={w.balance}
                                    currency={w.currencyCode}
                                    className="shrink-0 text-sm font-bold"
                                />
                            </div>
                        ))}
                    </GlassCard>
                </section>
            )}
            {!!data.adultBalances.length && (
                <section className="space-y-3">
                    <h2 className={sectionLabel}>Family balances</h2>
                    <GlassCard className="divide-y divide-border p-2 dark:divide-white/[0.06] sm:p-3">
                        {data.adultBalances.map((a) => (
                            <div key={a.memberId} className={staticRowClass}>
                                <Initials name={a.name} />
                                <p className="min-w-0 flex-1 truncate text-sm font-semibold">
                                    {a.name}
                                </p>
                                <div className="shrink-0 text-right text-sm font-bold">
                                    <MoneyTotals
                                        totals={a.totals.map((t) => ({
                                            currency: t.currencyCode,
                                            amount: t.amount,
                                        }))}
                                    />
                                </div>
                            </div>
                        ))}
                    </GlassCard>
                </section>
            )}
            <LeaveFamily family={family} />
            {open && wallet && (
                <FamilyTransactionSheet
                    open
                    onOpenChange={setOpen}
                    mode="child"
                    wallets={wallets}
                    presetWalletId={
                        wallets.length === 1 ? wallet.id : undefined
                    }
                />
            )}
        </div>
    );
}
