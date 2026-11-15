import { useState } from 'react';
import { useNavigate, useSearch } from '@tanstack/react-router';
import { trpc } from '@/lib/trpc';
import { PageHeader } from '@/components/PageHeader';
import { UniversalAddSheet } from '@/components/UniversalAddSheet';
import { ActionButton } from '@/components/ui/action-button';
import { GlassCard } from '@/components/ui/glass';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { FamilyMemberLink } from './FamilyMemberLink';
import { FamilyPeriodControls } from './FamilyPeriodControls';
import { ScopeSwitch } from './ScopeSwitch';
import { FamilyBudgetSheet } from './FamilyBudgetSheet';
import { FamilyBudgetCard } from './FamilyBudgetCard';
import { FamilyPositionCard } from './FamilyPositionCard';
import { FamilyFinancesNav } from './FamilyFinancesNav';
import { FamilyRecentSpending } from './FamilyRecentSpending';
import { FamilyWhereItWent } from './FamilyWhereItWent';
import { FamilyDailySpending } from './FamilyDailySpending';
import { FamilyWhoSpent } from './FamilyWhoSpent';
import {
    FamilyMoney,
    Notice,
} from './shared';
import {
    localToday,
    type HouseholdOverview,
    type HouseholdOverviewOutput,
    type FamilyFinancesOutput,
    currentTaxYear,
} from './types';

export function FamilyHome({
    family,
}: {
    family: NonNullable<HouseholdOverview>;
}) {
    const search = useSearch({ strict: false });
    const navigate = useNavigate();
    const today = localToday();
    const month = search.month ?? today.slice(0, 7);
    const current = month === today.slice(0, 7);
    const date = new Date(`${month}-01T12:00:00`);
    const monthName = date.toLocaleDateString('en', { month: 'long' });
    const update = (
        patch: Partial<
            Pick<
                typeof search,
                'month' | 'currency' | 'member' | 'category' | 'day'
            >
        >,
    ) =>
        void navigate({
            to: '.',
            search: (previous: Record<string, unknown>) => ({ ...previous, ...patch }),
        });
    const query = trpc.household.overview.useQuery({
        month,
        today,
        currency: search.currency,
        memberId: search.member,
        categoryId: search.category,
    }, { keepPreviousData: true });
    const memberOverview = trpc.household.overview.useQuery({
        month, today, currency: search.currency, categoryId: search.category,
    }, { keepPreviousData: true });
    const categoryOverview = trpc.household.overview.useQuery({
        month, today, currency: search.currency, memberId: search.member,
    }, { keepPreviousData: true });
    const categoryData = categoryOverview.data as HouseholdOverviewOutput | undefined;
    const transactions = trpc.household.familyTransactions.useQuery({
        month,
        memberId: search.member,
        categoryId: search.category,
        date: search.day,
        limit: 8,
    }, { keepPreviousData: true });
    const wallets = trpc.household.wallets.useQuery({ today });
    const taxYear = currentTaxYear();
    const taxes = trpc.household.familyTax.useQuery({ taxYear });
    const [allCategories, setAllCategories] = useState(false);
    const overview = query.data as HouseholdOverviewOutput | undefined;
    const financesQuery = trpc.household.familyFinances.useQuery({
        currency: search.currency,
    }, { keepPreviousData: true });
    const finances = financesQuery.data as FamilyFinancesOutput | undefined;
    const [editing, setEditing] = useState(false);
    const [expanded, setExpanded] = useState(false);
    const baseQuery = trpc.household.overview.useQuery(
        { month, today },
        { enabled: editing },
    );
    const base = baseQuery.data as HouseholdOverviewOutput | undefined;
    const move = (n: number) => {
        const d = new Date(date);
        d.setMonth(d.getMonth() + n);
        update({
            month: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
            member: undefined,
            category: undefined,
            day: undefined,
        });
    };
    const total = overview?.converted.currencies[0];
    // Keep the unit stable while a filtered query loads; never fall back to a hard-coded currency first.
    const currency =
        overview?.displayCurrency ??
        (memberOverview.data as HouseholdOverviewOutput | undefined)?.displayCurrency ??
        finances?.displayCurrency ??
        search.currency ??
        'USD';
    const spent = Number(total?.expense ?? 0);
    const budget = Number(total?.budget ?? 0);
    const days = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
    const day = Number(today.slice(-2));
    const pace = (budget * day) / days;
    const comparison = Number(overview?.previousMonthToDateExpense ?? 0);
    const previous = new Date(date);
    previous.setMonth(previous.getMonth() - 1);
    const money = (amount: string | number) => (
        <FamilyMoney amount={amount} currency={currency} />
    );
    const failure = (retry: () => void) => (
        <GlassCard className="p-4">
            <Notice tone="error">
                Couldn't load these family finances.
                <Button variant="ghost" onClick={retry}>
                    Try again
                </Button>
            </Notice>
        </GlassCard>
    );
    const members = [
        ...((memberOverview.data?.filtered ?? memberOverview.data?.converted)?.members ?? []),
    ].sort(
        (a, b) =>
            Number(a.status === 'unassigned') -
                Number(b.status === 'unassigned') ||
            Number(b.totals[0]?.amount ?? 0) - Number(a.totals[0]?.amount ?? 0),
    );
    const memberTotal = Number(
        (memberOverview.data?.filtered ?? memberOverview.data?.converted)?.currencies[0]?.expense ??
            0,
    );
    return (
        <div className="space-y-4 md:space-y-6">
            <PageHeader
                title="Dashboard"
                subtitle={family.household.name}
                variant="one"
            >
                <UniversalAddSheet
                    trigger={<ActionButton>+ Add</ActionButton>}
                />
            </PageHeader>
            <p className="text-sm text-muted-foreground sm:hidden">{family.household.name}</p>
            <div className="flex flex-wrap items-center gap-2">
                <ScopeSwitch />
                <FamilyPeriodControls
                    {...{ monthName, date, move, update, currency, overview }}
                />
            </div>
            {query.error ? failure(() => void query.refetch()) : (
                <>
                    <div className="grid gap-4 lg:grid-cols-5">
                        <div className="lg:col-span-3">
                            {!overview ? (
                                <Skeleton className="h-40 rounded-[22px] lg:h-full" />
                            ) : (
                                <FamilyBudgetCard
                                    className="h-full"
                                    data={{ family, overview, budget, spent, currency, current, day, days, pace, monthName, comparison, previous, date }}
                                    controls={{ expanded, setExpanded, setEditing, money }}
                                />
                            )}
                        </div>
                        <div className="lg:col-span-2">
                            {financesQuery.error ? (
                                failure(() => void financesQuery.refetch())
                            ) : !finances ? (
                                <Skeleton className="h-40 rounded-[22px] lg:h-full" />
                            ) : (
                                <FamilyPositionCard
                                    className="h-full"
                                    {...{ finances, total, currency, date }}
                                />
                            )}
                        </div>
                    </div>
                    <div className="grid gap-4 lg:grid-cols-5">
                        <div className="contents lg:block lg:col-span-3 lg:space-y-4">
                            {memberOverview.error ? failure(() => void memberOverview.refetch()) : <FamilyWhoSpent {...{ members, memberTotal, monthName, search, update, currency, family }} overview={memberOverview.data} />}
                            <FamilyDailySpending {...{ overview, search, update, today, currency, money }} />
                        </div>
                        <FamilyWhereItWent {...{ overview, categoryOverview, categoryData, allCategories, setAllCategories, search, update, currency, monthName, failure }} />
                    </div>
                </>
            )}
            <FamilyRecentSpending {...{ search, update, overview, month, monthName, transactions, failure }} />
            <FamilyFinancesNav {...{ financesQuery, finances, overview, spent, monthName, money, taxes, taxYear, wallets, family, month, search }} />
            {editing && (
                <FamilyBudgetSheet
                    family={family}
                    overview={base}
                    error={!!baseQuery.error}
                    onRetry={() => void baseQuery.refetch()}
                    onClose={() => setEditing(false)}
                />
            )}
        </div>
    );
}
