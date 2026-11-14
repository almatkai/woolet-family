import { ActionButton } from '@/components/ui/action-button';
import { LimitsCard } from '@/components/family/LimitsCard';
import { LimitSheet } from '@/components/family/LimitSheet';
import {
    FamilyTransactionSheet,
    type TransactionSheetMode,
} from '@/components/family/FamilyTransactionSheet';
import { useState } from 'react';
import { Link, useParams } from '@tanstack/react-router';
import { ChevronLeft, MoreHorizontal } from 'lucide-react';
import { trpc } from '@/lib/trpc';
import { PageHeader } from '@/components/PageHeader';
import { Button } from '@/components/ui/button';
import { GlassCard } from '@/components/ui/glass';
import { Skeleton } from '@/components/ui/skeleton';
import { FamilyMoney, sectionLabel } from '@/components/family/shared';
import { WalletSheet } from '@/components/family/WalletSheet';
import { TransactionList } from '@/components/family/TransactionList';
import { canEditWallet } from '@/components/family/permissions';
import {
    localToday,
    type FamilyWalletsResponse,
    type FamilyWalletSummary,
    type HouseholdOverview,
} from '@/components/family/types';

export function FamilyWalletPage() {
    const { walletId } = useParams({ strict: false }) as { walletId: string };
    const [transaction, setTransaction] = useState<TransactionSheetMode | null>(
        null,
    );
    const [editingLimits, setEditingLimits] = useState(false);
    const [settings, setSettings] = useState(false);
    const familyQuery = trpc.household.get.useQuery();
    const wallets = trpc.household.wallets.useQuery({ today: localToday() });
    const wallet = (
        wallets.data as FamilyWalletsResponse | undefined
    )?.wallets.find((item) => item.id === walletId);
    const summaryQuery = trpc.household.walletSummary.useQuery(
        { walletId, today: localToday() },
        { enabled: !!wallet },
    );
    const limitsQuery = trpc.household.limits.useQuery(
        { walletId, today: localToday() },
        { enabled: wallet?.kind === 'child' },
    );
    const summary = summaryQuery.data as FamilyWalletSummary | undefined;
    const family = familyQuery.data as HouseholdOverview | undefined;
    return (
        <div className="space-y-4 md:space-y-6">
            <Button
                asChild
                variant="ghost"
                size="sm"
                className="-ml-2 h-9 gap-1 text-muted-foreground"
            >
                <Link to="/family">
                    <ChevronLeft className="size-4" />
                    Family
                </Link>
            </Button>
            <PageHeader
                className="[&>div]:min-w-0 [&_h1]:[overflow-wrap:anywhere]"
                title={wallet?.name ?? 'Family wallet'}
                subtitle={
                    wallet
                        ? wallet.kind === 'shared'
                            ? `Shared wallet · ${wallet.currencyCode}`
                            : `${wallet.childName}'s wallet · ${wallet.currencyCode}`
                        : undefined
                }
                variant="two-with-text"
            >
                {wallets.isLoading && (
                    <>
                        <ActionButton disabled>Add transaction</ActionButton>
                        <ActionButton variant="secondary" disabled>
                            Transfer
                        </ActionButton>
                    </>
                )}
                {wallet?.canWrite && (
                    <>
                        <ActionButton
                            className="flex-1 sm:flex-none"
                            onClick={() =>
                                setTransaction(
                                    wallet.kind === 'shared'
                                        ? 'add'
                                        : wallet.canManage
                                          ? 'topup'
                                          : 'child',
                                )
                            }
                        >
                            {wallet.kind === 'shared'
                                ? 'Add transaction'
                                : wallet.canManage
                                  ? 'Top up'
                                  : 'Add expense'}
                        </ActionButton>
                        {(wallet.kind === 'shared' || wallet.canManage) && (
                            <ActionButton
                                variant="secondary"
                                className="flex-1 sm:flex-none"
                                onClick={() =>
                                    setTransaction(
                                        wallet.kind === 'shared'
                                            ? 'transfer'
                                            : 'child',
                                    )
                                }
                            >
                                {wallet.kind === 'shared'
                                    ? 'Transfer'
                                    : 'Add expense'}
                            </ActionButton>
                        )}
                    </>
                )}
                {wallet && canEditWallet(wallet) && (
                    <ActionButton
                        variant="secondary"
                        size="icon"
                        className="size-10 shrink-0 rounded-full"
                        aria-label="Wallet settings"
                        disabled={!family}
                        onClick={() => setSettings(true)}
                    >
                        <MoreHorizontal className="size-4" />
                    </ActionButton>
                )}
            </PageHeader>
            {wallets.isLoading || familyQuery.isLoading ? (
                <Skeleton className="h-28 rounded-[22px]" />
            ) : wallets.error || familyQuery.error ? (
                <GlassCard className="space-y-3 p-5">
                    <p className="text-sm text-destructive">
                        {wallets.error?.message || familyQuery.error?.message}
                    </p>
                    <Button
                        variant="outline"
                        onClick={() => {
                            void wallets.refetch();
                            void familyQuery.refetch();
                        }}
                    >
                        Try again
                    </Button>
                </GlassCard>
            ) : !wallet ? (
                <GlassCard className="space-y-3 p-5">
                    <p className="text-sm text-destructive">
                        This wallet isn't available
                    </p>
                    <Button asChild variant="outline">
                        <Link to="/family">Back to family</Link>
                    </Button>
                </GlassCard>
            ) : (
                <>
                    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                        <GlassCard className="p-5">
                            <h2 className={sectionLabel}>Balance</h2>
                            <FamilyMoney
                                amount={wallet.balance}
                                currency={wallet.currencyCode}
                                className="mt-2 text-3xl font-bold tracking-tight"
                            />
                            {summaryQuery.isLoading ? (
                                <Skeleton className="mt-2 h-4 w-48" />
                            ) : summaryQuery.error ? (
                                <div className="mt-2 space-y-2">
                                    <p className="text-sm text-destructive">
                                        {summaryQuery.error.message}
                                    </p>
                                    <Button
                                        variant="outline"
                                        onClick={() =>
                                            void summaryQuery.refetch()
                                        }
                                    >
                                        Try again
                                    </Button>
                                </div>
                            ) : (
                                summary && (
                                    <p className="mt-1 text-xs text-muted-foreground">
                                        <FamilyMoney
                                            amount={summary.monthIncome}
                                            currency={wallet.currencyCode}
                                        />{' '}
                                        in ·{' '}
                                        <FamilyMoney
                                            amount={summary.monthOutflow}
                                            currency={wallet.currencyCode}
                                        />{' '}
                                        out this month
                                    </p>
                                )
                            )}
                        </GlassCard>
                        {wallet.kind === 'child' &&
                            (limitsQuery.isLoading ? (
                                <Skeleton className="h-40 rounded-[22px]" />
                            ) : limitsQuery.error ? (
                                <GlassCard className="space-y-3 p-5">
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
                                </GlassCard>
                            ) : (
                                <LimitsCard
                                    limits={limitsQuery.data ?? []}
                                    currency={wallet.currencyCode}
                                    canManage={wallet.canManage}
                                    onEdit={() => setEditingLimits(true)}
                                />
                            ))}
                    </div>
                    {editingLimits && wallet.canManage && (
                        <LimitSheet
                            wallet={wallet}
                            limits={limitsQuery.data ?? []}
                            onClose={() => setEditingLimits(false)}
                        />
                    )}
                    <section className="space-y-3">
                        <h2 className={sectionLabel}>Transactions</h2>
                        <TransactionList key={wallet.id} wallet={wallet} />
                    </section>
                    {transaction && (
                        <FamilyTransactionSheet
                            open
                            mode={transaction}
                            presetWalletId={wallet.id}
                            wallets={
                                (wallets.data as FamilyWalletsResponse).wallets
                            }
                            onOpenChange={(value) => {
                                if (!value) setTransaction(null);
                            }}
                        />
                    )}
                    {settings && family && (
                        <WalletSheet
                            wallet={wallet}
                            family={family}
                            onClose={() => setSettings(false)}
                        />
                    )}
                </>
            )}
        </div>
    );
}
