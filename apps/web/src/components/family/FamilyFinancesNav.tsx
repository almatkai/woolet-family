import type { ReactNode } from 'react';
import { Link } from '@tanstack/react-router';
import {
    ChevronRight,
    Wallet,
    Receipt,
    HandCoins,
    Landmark,
    House,
    PiggyBank,
    Repeat,
    TrendingUp,
    FileText,
    Users,
    type LucideIcon,
} from 'lucide-react';
import { GlassCard } from '@/components/ui/glass';
import { Skeleton } from '@/components/ui/skeleton';
import { FamilyMoney, rowClass, sectionLabel } from './shared';
import type {
    FamilyFinancesOutput,
    FamilyTaxRow,
    HouseholdOverview,
    HouseholdOverviewOutput,
} from './types';

type FinancePath =
    | '/accounts'
    | '/spending'
    | '/debts'
    | '/financial/credits'
    | '/financial/mortgages'
    | '/financial/deposits'
    | '/subscriptions'
    | '/investing'
    | '/tax'
    | '/family';

export function FamilyFinancesNav({
    finances,
    overview,
    spent,
    monthName,
    money,
    taxes,
    taxYear,
    wallets,
    family,
    month,
    search,
}: {
    finances: FamilyFinancesOutput | undefined;
    overview: HouseholdOverviewOutput | undefined;
    spent: number;
    monthName: string;
    money: (amount: string | number) => ReactNode;
    taxes: { error: unknown; data?: FamilyTaxRow[] };
    taxYear: number;
    wallets: { error: unknown; data?: { wallets: unknown[] } };
    family: NonNullable<HouseholdOverview>;
    month: string;
    search: { currency?: string };
}) {
    const financeMoney = (amount: string | number) => finances ? (
        <FamilyMoney amount={amount} currency={finances.displayCurrency} />
    ) : '—';
    return (
        <section className="space-y-3">
            <h2 className={sectionLabel}>Family finances</h2>
            <GlassCard className="p-2 sm:p-3">
                <div className="grid lg:grid-cols-2 divide-y divide-border dark:divide-white/[0.06]">
                    {(
                        [
                            [
                                '/accounts',
                                'Accounts',
                                Wallet,
                                finances && (
                                    <>
                                        {finances.summary.accountsCount}{' '}
                                        {finances.summary.accountsCount === 1 ? 'account' : 'accounts'}, ≈{' '}
                                        {financeMoney(
                                            finances.summary.balancesConverted,
                                        )}
                                    </>
                                ),
                            ],
                            [
                                '/spending',
                                'Spending',
                                Receipt,
                                overview && (
                                    <>
                                        {money(spent)} in {monthName}
                                    </>
                                ),
                            ],
                            [
                                '/debts',
                                'Debts',
                                HandCoins,
                                finances && (
                                    <>
                                        Family owes ≈{' '}
                                        {financeMoney(finances.summary.owesConverted)}
                                    </>
                                ),
                            ],
                            [
                                '/financial/credits',
                                'Credits',
                                Landmark,
                                finances &&
                                    (finances.summary.creditsCount
                                        ? `${finances.summary.creditsCount} active`
                                        : 'No credits'),
                            ],
                            [
                                '/financial/mortgages',
                                'Mortgages',
                                House,
                                finances &&
                                    (finances.summary.mortgagesCount
                                        ? `${finances.summary.mortgagesCount} active`
                                        : 'No mortgages'),
                            ],
                            [
                                '/financial/deposits',
                                'Deposits',
                                PiggyBank,
                                finances &&
                                    (finances.summary.depositsCount
                                        ? `${finances.summary.depositsCount} ${finances.summary.depositsCount === 1 ? 'deposit' : 'deposits'}`
                                        : 'No deposits'),
                            ],
                            [
                                '/subscriptions',
                                'Subscriptions',
                                Repeat,
                                finances &&
                                    (finances.summary.subscriptionsCount
                                        ? `${finances.summary.subscriptionsCount} active`
                                        : 'No subscriptions'),
                            ],
                            [
                                '/investing',
                                'Investing',
                                TrendingUp,
                                finances &&
                                    (finances.summary
                                        .investmentsValueConverted === null ? (
                                        'Portfolio value unavailable'
                                    ) : (
                                        <>
                                            ≈{' '}
                                            {financeMoney(
                                                finances.summary
                                                    .investmentsValueConverted,
                                            )}
                                        </>
                                    )),
                            ],
                            [
                                '/tax',
                                'Taxes',
                                FileText,
                                taxes.error ? (
                                    'Tax figures unavailable'
                                ) : taxes.data ? (
                                    taxes.data.some(
                                        (t: FamilyTaxRow) => t.hasProfile,
                                    ) ? (
                                        `${taxes.data.filter((t: FamilyTaxRow) => t.hasProfile).length} ${taxes.data.filter((t: FamilyTaxRow) => t.hasProfile).length === 1 ? 'profile' : 'profiles'} for ${taxYear}`
                                    ) : (
                                        'No tax profiles yet'
                                    )
                                ) : (
                                    <Skeleton
                                        className="h-4 w-28"
                                        aria-label="Loading tax profiles"
                                    />
                                ),
                            ],
                            [
                                '/family',
                                'Wallets and members',
                                Users,
                                wallets.data ? (
                                    `${wallets.data.wallets.length} ${wallets.data.wallets.length === 1 ? 'wallet' : 'wallets'}, ${family.members.length} ${family.members.length === 1 ? 'member' : 'members'}`
                                ) : wallets.error ? (
                                    `Wallet count unavailable, ${family.members.length} ${family.members.length === 1 ? 'member' : 'members'}`
                                ) : (
                                    <Skeleton
                                        className="h-4 w-28"
                                        aria-label="Loading wallets"
                                    />
                                ),
                            ],
                        ] satisfies [
                            FinancePath,
                            string,
                            LucideIcon,
                            ReactNode,
                        ][]
                    ).map(([to, label, Icon, figure]) => {
                        return (
                            <Link
                                key={String(to)}
                                to={to}
                                search={{
                                    month,
                                    currency: search.currency,
                                    view: undefined,
                                }}
                                className={rowClass}
                            >
                                <Icon className="size-4 text-muted-foreground shrink-0" />
                                <div className="min-w-0 flex-1">
                                    <p className="text-sm font-semibold">
                                        {String(label)}
                                    </p>
                                    <div className="pointer-events-none text-xs text-muted-foreground truncate">
                                        {figure || '—'}
                                    </div>
                                </div>
                                <ChevronRight className="size-4 text-muted-foreground" />
                            </Link>
                        );
                    })}
                </div>
            </GlassCard>
        </section>
    );
}
