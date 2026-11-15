import type { ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { GlassCard } from '@/components/ui/glass';
import { Skeleton } from '@/components/ui/skeleton';
import { FamilyMoney, LimitBar, rowClass, sectionLabel } from './shared';
import type { HouseholdOverviewOutput } from './types';

export function FamilyWhereItWent({
    overview,
    categoryOverview,
    failure,
    categoryData,
    allCategories,
    setAllCategories,
    search,
    update,
    currency,
    monthName,
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
    categoryOverview: { data?: unknown; error: unknown; refetch: () => unknown };
    failure: (retry: () => void) => ReactNode;
    categoryData: HouseholdOverviewOutput | undefined;
    allCategories: boolean;
    setAllCategories: (value: boolean) => void;
    currency: string;
    monthName: string;
}) {
    return (
        <section className="order-2 lg:order-none lg:col-span-2 space-y-3">
            <h2 className={sectionLabel}>Where it went</h2>
            {categoryOverview.error ? (
                failure(() => void categoryOverview.refetch())
            ) : !overview || !categoryOverview.data ? (
                <Skeleton className="h-56" />
            ) : (
                <GlassCard className="p-2 sm:p-3">
                    <div className="divide-y divide-border dark:divide-white/[0.06]">
                        {!(
                            categoryData?.filtered ??
                            categoryData?.converted ??
                            overview.converted
                        ).categories.length && (
                            <p className="p-3 text-sm text-muted-foreground">
                                No spending in {monthName} yet.
                            </p>
                        )}
                        {(
                            categoryData?.filtered ??
                            categoryData?.converted ??
                            overview.converted
                        ).categories
                            .slice(0, allCategories ? undefined : 6)
                            .map((c) => {
                                const id = c.categoryId ?? 'none';
                                const budget = overview.categoryBudgets.find(
                                    (b) => b.categoryId === id,
                                );
                                const amount = c.totals[0]?.amount ?? '0';
                                return (
                                    <button
                                        key={id}
                                        aria-pressed={search.category === id}
                                        onClick={() =>
                                            update({
                                                category:
                                                    search.category === id
                                                        ? undefined
                                                        : id,
                                            })
                                        }
                                        className={`${rowClass} w-full text-left ${search.category === id ? 'bg-muted dark:bg-white/[0.06]' : ''}`}
                                    >
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-semibold">
                                                {c.categoryName}
                                            </p>
                                            {budget && (
                                                <LimitBar
                                                    spent={Number(amount)}
                                                    limit={Number(
                                                        budget.amount,
                                                    )}
                                                    size="md"
                                                />
                                            )}
                                        </div>
                                        <span className="pointer-events-none text-sm">
                                            <FamilyMoney
                                                amount={amount}
                                                currency={currency}
                                            />
                                            {budget && (
                                                <>
                                                    {' '}
                                                    of{' '}
                                                    <FamilyMoney
                                                        amount={budget.amount}
                                                        currency={currency}
                                                    />
                                                </>
                                            )}
                                        </span>
                                    </button>
                                );
                            })}
                    </div>
                    {(
                        categoryData?.filtered ??
                        categoryData?.converted ??
                        overview.converted
                    ).categories.length > 6 && (
                        <Button
                            variant="ghost"
                            onClick={() => setAllCategories(!allCategories)}
                        >
                            {allCategories
                                ? 'Show less'
                                : `Show all ${(categoryData?.filtered ?? categoryData?.converted ?? overview.converted).categories.length}`}
                        </Button>
                    )}
                </GlassCard>
            )}
        </section>
    );
}
