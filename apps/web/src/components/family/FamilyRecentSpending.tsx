import type { ReactNode } from 'react';
import { Link } from '@tanstack/react-router';
import { Button } from '@/components/ui/button';
import { GlassCard } from '@/components/ui/glass';
import { Skeleton } from '@/components/ui/skeleton';
import { FamilyLedgerRows } from './FamilyLedgerRows';
import { formatDay } from './formatDay';
import { sectionLabel } from './shared';
import type {
    HouseholdOverviewOutput,
    FamilyTransactionsOutput,
} from './types';

export function FamilyRecentSpending({
    search,
    update,
    overview,
    month,
    monthName,
    transactions,
    failure,
}: {
    search: {
        member?: string;
        category?: string;
        day?: string;
        currency?: string;
    };
    update: (patch: {
        member?: string;
        category?: string;
        day?: string;
    }) => void;
    overview: HouseholdOverviewOutput | undefined;
    month: string;
    monthName: string;
    transactions: {
        error: unknown;
        data?: FamilyTransactionsOutput;
        refetch: () => unknown;
    };
    failure: (retry: () => void) => ReactNode;
}) {
    return (
        <section className="space-y-3">
            {(search.member || search.category || search.day) && (
                <div className="flex flex-wrap items-center gap-2 text-sm">
                    Showing{' '}
                    {[
                        overview?.members.find(
                            (m) => m.memberId === search.member,
                        )?.name,
                        (
                            overview?.filtered ?? overview?.converted
                        )?.categories.find(
                            (c) => (c.categoryId ?? 'none') === search.category,
                        )?.categoryName,
                        search.day ? formatDay(search.day) : undefined,
                    ]
                        .filter(Boolean)
                        .join(', ')}
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                            update({
                                member: undefined,
                                category: undefined,
                                day: undefined,
                            })
                        }
                    >
                        Clear
                    </Button>
                    {overview?.members.find((m) => m.memberId === search.member)
                        ?.canOpen && (
                        <Button asChild variant="ghost" size="sm">
                            <Link
                                to="/family/members/$memberId"
                                params={{ memberId: search.member! }}
                                search={{ month }}
                            >
                                Open{' '}
                                {
                                    overview.members.find(
                                        (m) => m.memberId === search.member,
                                    )?.name
                                }
                                's finances
                            </Link>
                        </Button>
                    )}
                </div>
            )}
            <div className="flex items-center justify-between">
                <h2 className={sectionLabel}>Recent spending</h2>
                <Button asChild variant="ghost" size="sm">
                    <Link
                        to="/spending"
                        search={{
                            month,
                            member: search.member,
                            category: search.category,
                            currency: search.currency,
                        }}
                    >
                        All in Spending
                    </Link>
                </Button>
            </div>
            {transactions.error ? (
                failure(() => void transactions.refetch())
            ) : !transactions.data ? (
                <div className="space-y-2">
                    {[0, 1, 2, 3].map((n) => (
                        <Skeleton key={n} className="h-14" />
                    ))}
                </div>
            ) : (
                <GlassCard className="p-2 sm:p-3">
                    {transactions.data.hiddenChildRows && (
                        <p className="p-3 text-xs text-muted-foreground">
                            {overview?.members.find(
                                (m) => m.memberId === search.member,
                            )?.name ?? 'Children'}
                            's purchases are visible to the owner and guardians.
                            Their total is included above.
                        </p>
                    )}
                    {!transactions.data.items.length && (
                        <p className="p-3 text-sm text-muted-foreground">
                            {search.member || search.category || search.day
                                ? `Nothing matches these filters in ${monthName}.`
                                : `No spending in ${monthName} yet.`}
                        </p>
                    )}
                    <div className="divide-y divide-border dark:divide-white/[0.06]">
                        <FamilyLedgerRows items={transactions.data.items} />
                    </div>
                </GlassCard>
            )}
        </section>
    );
}
