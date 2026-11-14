import { FamilyPrivacy } from '@/components/family/FamilyPrivacy';
import { ChildFamilyView } from '@/components/family/ChildFamilyView';
import { FamilyTransactionSheet } from '@/components/family/FamilyTransactionSheet';
import { FamilyWallets } from '@/components/family/FamilyWallets';
import { WalletSheet } from '@/components/family/WalletSheet';
import { FamilyMembers } from '@/components/family/FamilyMembers';
import { InviteSheet } from '@/components/family/InviteSheet';
import { LeaveFamily } from '@/components/family/LeaveFamily';
import { useState } from 'react';
import { HeartHandshake, Wallet, PiggyBank, Plus } from 'lucide-react';
import { trpc } from '@/lib/trpc';
import { PageHeader } from '@/components/PageHeader';
import { Button } from '@/components/ui/button';
import { ActionButton } from '@/components/ui/action-button';
import { GlassCard, StatTile } from '@/components/ui/glass';
import { Skeleton } from '@/components/ui/skeleton';
import { ProductEmptyState } from '@/components/financial/ProductCard';
import { CreateFamilySheet } from '@/components/family/CreateFamilySheet';
import {
    MoneyTotals,
    FamilyMoney,
    sectionLabel,
} from '@/components/family/shared';
import { familyPermissions, isFull } from '@/components/family/permissions';
import {
    localToday,
    type HouseholdOverview,
    type FamilyWalletsResponse,
} from '@/components/family/types';
export function FamilyPage() {
    const [transactionOpen, setTransactionOpen] = useState(false);
    const [walletOpen, setWalletOpen] = useState(false);
    const [open, setOpen] = useState(false);
    const [inviteOpen, setInviteOpen] = useState(false);
    const preferred = trpc.currency.getPreferred.useQuery();
    const query = trpc.household.get.useQuery();
    const family = query.data as HouseholdOverview | undefined;
    const permissions = family ? familyPermissions(family.me) : null;
    const walletsQuery = trpc.household.wallets.useQuery(
        { today: localToday() },
        { enabled: !!family },
    );
    const data = walletsQuery.data as FamilyWalletsResponse | undefined;
    const header = (
        <PageHeader
            variant={permissions?.isOwner ? 'two-with-text' : 'one'}
            title="Family"
            subtitle={
                family
                    ? `${family.household.name} · ${family.activeMembers} of ${family.maxMembers} members`
                    : "Shared wallets and children's spending"
            }
        >
            <>
                {family && permissions?.isOwner ? (
                    <ActionButton
                        variant="secondary"
                        className="flex-1 sm:flex-none"
                        disabled={isFull(family)}
                        onClick={() => setInviteOpen(true)}
                    >
                        Invite
                    </ActionButton>
                ) : null}
                {permissions &&
                    !permissions.isChild &&
                    !permissions.canManageWallets &&
                    data?.wallets.some((w) => w.kind === 'shared') && (
                        <ActionButton
                            className="flex-1 sm:flex-none"
                            onClick={() => setTransactionOpen(true)}
                        >
                            Add transaction
                        </ActionButton>
                    )}
                {permissions?.canManageWallets && (
                    <ActionButton
                        className="flex-1 sm:flex-none"
                        disabled={query.isLoading || walletsQuery.isLoading}
                        onClick={() => setWalletOpen(true)}
                    >
                        <Plus className="size-4" />
                        New wallet
                    </ActionButton>
                )}
            </>
        </PageHeader>
    );
    if (query.isLoading || (family && walletsQuery.isLoading))
        return (
            <div className="space-y-4 md:space-y-6">
                {header}
                <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
                    {[0, 1, 2].map((i) => (
                        <Skeleton
                            key={i}
                            className="h-24 md:h-28 rounded-[22px]"
                        />
                    ))}
                </div>
                {[0, 1, 2].map((i) => (
                    <div key={i} className="flex items-center gap-3">
                        <Skeleton className="size-10 rounded-full" />
                        <div className="flex-1 space-y-2">
                            <Skeleton className="h-4 w-32" />
                            <Skeleton className="h-3 w-24" />
                        </div>
                        <Skeleton className="h-5 w-16" />
                    </div>
                ))}
            </div>
        );
    if (query.error || (family && walletsQuery.error))
        return (
            <div className="space-y-4 md:space-y-6">
                {header}
                <GlassCard className="space-y-3 p-5">
                    <p className="text-sm text-destructive">
                        {query.error?.message || walletsQuery.error?.message}
                    </p>
                    <Button
                        variant="outline"
                        onClick={() => {
                            if (query.error) void query.refetch();
                            if (walletsQuery.error) void walletsQuery.refetch();
                        }}
                    >
                        Try again
                    </Button>
                </GlassCard>
            </div>
        );
    if (!family)
        return (
            <div className="space-y-4 md:space-y-6">
                <PageHeader
                    variant="one"
                    title="Family"
                    subtitle="Shared wallets and children's spending"
                >
                    <ActionButton onClick={() => setOpen(true)}>
                        <Plus className="size-4" />
                        Create family
                    </ActionButton>
                </PageHeader>
                <ProductEmptyState
                    icon={<HeartHandshake className="size-6" />}
                    title="No family yet"
                    description="Create a family to share wallets with a partner and give children their own wallets with spending limits. Your personal accounts stay private."
                    action={
                        <Button size="sm" onClick={() => setOpen(true)}>
                            Create family
                        </Button>
                    }
                />
                <p className="px-1 text-xs text-muted-foreground">
                    Have an invite link? Open it to join a family.
                </p>
                <CreateFamilySheet open={open} onOpenChange={setOpen} />
            </div>
        );
    if (permissions?.isChild && data)
        return <ChildFamilyView family={family} data={data} />;
    const wallets = data?.wallets ?? [];
    const totals = (kind: 'shared' | 'child') => {
        const grouped = new Map<string, number>();
        wallets
            .filter((w) => w.kind === kind)
            .forEach((w) =>
                grouped.set(
                    w.currencyCode,
                    (grouped.get(w.currencyCode) ?? 0) +
                        Math.round(Number(w.balance) * 100),
                ),
            );
        return Array.from(grouped, ([currency, amount]) => ({
            currency,
            amount: amount / 100,
        }));
    };
    return (
        <div className="space-y-4 md:space-y-6">
            {header}
            <p className={`${sectionLabel} sm:hidden`}>
                {family.household.name}
            </p>
            <div
                className={`grid grid-cols-2 gap-3 ${permissions?.canManageWallets ? 'lg:grid-cols-3' : ''}`}
            >
                <StatTile
                    label="Shared balance"
                    value={
                        totals('shared').length ? (
                            <MoneyTotals totals={totals('shared')} abbreviate />
                        ) : (
                            <FamilyMoney
                                amount={0}
                                currency={
                                    preferred.data?.defaultCurrency || 'USD'
                                }
                            />
                        )
                    }
                    hint={`${wallets.filter((w) => w.kind === 'shared').length} shared wallet${wallets.filter((w) => w.kind === 'shared').length === 1 ? '' : 's'}`}
                    icon={<Wallet className="size-4" />}
                    color="#A1A1AA"
                    showAura={false}
                />
                {permissions?.canManageWallets && (
                    <StatTile
                        label="Children's wallets"
                        value={
                            totals('child').length ? (
                                <MoneyTotals totals={totals('child')} abbreviate />
                            ) : (
                                <FamilyMoney
                                    amount={0}
                                    currency={preferred.data?.defaultCurrency || 'USD'}
                                />
                            )
                        }
                        hint={
                            wallets.some((w) => w.kind === 'child')
                                ? `${wallets.filter((w) => w.kind === 'child').length} wallet${wallets.filter((w) => w.kind === 'child').length === 1 ? '' : 's'}`
                                : 'None yet'
                        }
                        icon={<PiggyBank className="size-4" />}
                        color="#A1A1AA"
                        showAura={false}
                    />
                )}
                <StatTile
                    label="Members"
                    value={`${family.activeMembers} of ${family.maxMembers}`}
                    hint={
                        family.pendingInvites
                            ? `${family.pendingInvites} invite${family.pendingInvites === 1 ? '' : 's'} pending`
                            : 'No pending invites'
                    }
                    icon={<HeartHandshake className="size-4" />}
                    color="#A1A1AA"
                    showAura={false}
                    className={
                        permissions?.canManageWallets
                            ? 'col-span-2 lg:col-span-1'
                            : undefined
                    }
                />
            </div>
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
                <div className="lg:col-span-3">
                    <FamilyWallets
                        data={data}
                        canManage={!!permissions?.canManageWallets}
                        onCreate={() => setWalletOpen(true)}
                    />
                </div>
                <div className="space-y-4 lg:col-span-2">
                    <FamilyMembers
                        family={family}
                        onInvite={() => setInviteOpen(true)}
                    />
                    <FamilyPrivacy family={family} />
                </div>
            </div>
            <LeaveFamily family={family} />
            {transactionOpen && (
                <FamilyTransactionSheet
                    open
                    mode="add"
                    wallets={wallets}
                    onOpenChange={setTransactionOpen}
                />
            )}
            {walletOpen && (
                <WalletSheet
                    family={family}
                    onClose={() => setWalletOpen(false)}
                />
            )}
            <InviteSheet open={inviteOpen} onOpenChange={setInviteOpen} />
        </div>
    );
}
