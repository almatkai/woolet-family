import type { ReactNode } from 'react';
import {
    ResponsiveContainer,
    BarChart,
    Bar,
    XAxis,
    Tooltip,
    Cell,
} from 'recharts';
import { Button } from '@/components/ui/button';
import { GlassCard } from '@/components/ui/glass';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDay } from './formatDay';
import { FamilyMoney, sectionLabel } from './shared';
import type { HouseholdOverviewOutput } from './types';

export function FamilyDailySpending({
    overview,
    search,
    update,
    today,
    currency,
    money,
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
    today: string;
    currency: string;
    money: (amount: string | number) => ReactNode;
}) {
    return (
        <section className="space-y-3 lg:order-none order-3 lg:col-span-3">
            <h2 className={sectionLabel}>Daily spending</h2>
            {!overview ? (
                <Skeleton className="h-40" />
            ) : (
                <GlassCard className="p-3">
                    <div className="h-[140px] sm:h-40">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart
                                data={(
                                    overview.filtered ?? overview.converted
                                ).dailyExpenses.map((d) => ({
                                    date: d.date,
                                    amount: Number(d.totals[0]?.amount ?? 0),
                                }))}
                            >
                                <XAxis
                                    dataKey="date"
                                    tickFormatter={(v) =>
                                        String(Number(v.slice(-2)))
                                    }
                                    interval={4}
                                    axisLine={false}
                                    tickLine={false}
                                />
                                <Tooltip
                                    content={({ active, payload }) =>
                                        active && payload?.[0] ? (
                                            <div className="bg-popover text-popover-foreground border rounded-xl px-3 py-2 text-xs">
                                                <p>
                                                    {new Date(
                                                        `${payload[0].payload.date}T12:00:00`,
                                                    ).toLocaleDateString('en', {
                                                        month: 'short',
                                                        day: 'numeric',
                                                    })}
                                                </p>
                                                <FamilyMoney
                                                    amount={Number(
                                                        payload[0].value,
                                                    )}
                                                    currency={currency}
                                                />
                                            </div>
                                        ) : null
                                    }
                                />
                                <Bar
                                    dataKey="amount"
                                    onClick={(d) =>
                                        update({
                                            day:
                                                search.day === d.date
                                                    ? undefined
                                                    : d.date,
                                        })
                                    }
                                >
                                    {(
                                        overview.filtered ?? overview.converted
                                    ).dailyExpenses.map((d) => (
                                        <Cell
                                            key={d.date}
                                            fill={
                                                d.date === today ||
                                                d.date === search.day
                                                    ? 'hsl(var(--foreground))'
                                                    : 'hsl(var(--muted-foreground))'
                                            }
                                            fillOpacity={
                                                search.day
                                                    ? d.date === search.day
                                                        ? 1
                                                        : 0.2
                                                    : d.date === today
                                                      ? 1
                                                      : 0.35
                                            }
                                        />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="sr-only focus-within:not-sr-only flex flex-wrap gap-1 p-2">
                        {(
                            overview.filtered ?? overview.converted
                        ).dailyExpenses.map((d) => (
                            <Button
                                variant="ghost"
                                size="sm"
                                type="button"
                                key={d.date}
                                aria-pressed={search.day === d.date}
                                onClick={() =>
                                    update({
                                        day:
                                            search.day === d.date
                                                ? undefined
                                                : d.date,
                                    })
                                }
                            >
                                {formatDay(d.date)},{' '}
                                {money(d.totals[0]?.amount ?? '0')}
                            </Button>
                        ))}
                    </div>
                </GlassCard>
            )}
        </section>
    );
}
