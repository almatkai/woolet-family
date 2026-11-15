import type { ReactNode } from 'react';
import { ArrowDownRight, ArrowUpRight, Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { GlassCard } from '@/components/ui/glass';
import { canEditFamilyBudget } from './permissions';
import { FamilyMoney, LimitBar, Notice, sectionLabel } from './shared';
import type { HouseholdOverview, HouseholdOverviewOutput } from './types';

type BudgetData = {
    family: NonNullable<HouseholdOverview>;
    overview: HouseholdOverviewOutput;
    budget: number;
    spent: number;
    currency: string;
    current: boolean;
    day: number;
    days: number;
    pace: number;
    monthName: string;
    comparison: number;
    previous: Date;
    date: Date;
};

type BudgetControls = {
    expanded: boolean;

    setExpanded: (value: boolean) => void;
    setEditing: (value: boolean) => void;
    money: (amount: string | number) => ReactNode;
};

export function FamilyBudgetCard({ data, controls }: {
    data: BudgetData;
    controls: BudgetControls;
}) {
    const { family, overview, budget, spent, currency, current, day, days, pace, monthName, comparison, previous, date } = data;
    const { expanded, setExpanded, setEditing, money } = controls;
    return (
        <>
            <GlassCard className="p-5 space-y-4">
                <div className="flex items-center justify-between gap-2">
                    <h2 className={sectionLabel}>Family budget</h2>
                    {canEditFamilyBudget(family.me) && (
                        <Button
                            variant="outline"
                            size="sm"
                            className="min-h-10"
                            onClick={() => setEditing(true)}
                        >
                            <Pencil className="size-4 min-[361px]:hidden" />
                            <span className="max-[360px]:sr-only">
                                {budget ? 'Edit budget' : 'Set budget'}
                            </span>
                        </Button>
                    )}
                </div>
                {budget ? (
                    <>
                        <div>
                            <FamilyMoney
                                amount={spent}
                                currency={currency}
                                className="text-2xl max-[390px]:text-xl font-bold tracking-tight"
                            />
                            <span className="text-sm text-muted-foreground">
                                {' '}
                                of {money(budget)}
                            </span>
                        </div>
                        <div className="relative">
                            <LimitBar spent={spent} limit={budget} size="md" />
                            {current && (
                                <span
                                    aria-hidden
                                    className="absolute -top-1 h-3.5 w-0.5 rounded-full bg-foreground/70"
                                    style={{
                                        left: `${(day / days) * 100}%`,
                                    }}
                                />
                            )}
                        </div>
                        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs">
                            <span
                                className={
                                    spent > budget
                                        ? 'text-rose-700 dark:text-rose-400'
                                        : ''
                                }
                            >
                                {money(Math.abs(budget - spent))}{' '}
                                {spent > budget ? 'over budget' : 'left'}
                            </span>
                            {current && (
                                <>
                                    <span>
                                        {days - day}{' '}
                                        {days - day === 1 ? 'day' : 'days'} to
                                        go
                                    </span>
                                    <span
                                        className={`ml-auto ${spent > pace ? 'text-amber-800 dark:text-amber-300' : 'text-emerald-700 dark:text-emerald-400'}`}
                                    >
                                        {money(Math.abs(pace - spent))}{' '}
                                        {spent > pace ? 'over' : 'under'} pace
                                    </span>
                                    <span className="sr-only">
                                        Pace mark: where spending would be if
                                        spread evenly over the month.
                                    </span>
                                </>
                            )}
                        </div>
                    </>
                ) : (
                    <>
                        <p className="text-xl font-bold">
                            Spent {money(spent)} in {monthName}
                        </p>
                        <p className="text-xs text-muted-foreground">
                            Set a monthly budget to see how much is left.
                        </p>
                        {!canEditFamilyBudget(family.me) && (
                            <p className="text-xs text-muted-foreground">
                                Only the owner or a guardian can set a family
                                budget.
                            </p>
                        )}
                    </>
                )}
                {comparison > 0 && (
                    <p
                        className={`flex items-center gap-1 text-xs ${spent > comparison ? 'text-rose-700 dark:text-rose-400' : 'text-emerald-700 dark:text-emerald-400'}`}
                    >
                        {spent > comparison ? (
                            <ArrowUpRight className="size-4" />
                        ) : (
                            <ArrowDownRight className="size-4" />
                        )}
                        {money(Math.abs(spent - comparison))}{' '}
                        {spent > comparison ? 'more' : 'less'} than{' '}
                        {previous.toLocaleDateString('en', {
                            month: current ? 'short' : 'long',
                        })}
                        {current
                            ? ` 1–${Math.min(day, new Date(date.getFullYear(), date.getMonth(), 0).getDate())}`
                            : ''}
                    </p>
                )}
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                    {(overview.byCurrency.currencies.length > 1 ||
                        overview.byCurrency.currencies.some(
                            (c) => c.currencyCode !== currency,
                        )) && (
                        <span>Converted to {currency} at today's rates.</span>
                    )}
                    {currency !== overview.baseCurrency && (
                        <span>Budget set in {overview.baseCurrency}.</span>
                    )}
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setExpanded(!expanded)}
                    >
                        {expanded ? 'Hide by currency' : 'Show by currency'}
                    </Button>
                </div>
                {expanded && (
                    <div className="overflow-x-auto">
                        <table className="w-full text-xs">
                            <thead>
                                <tr>
                                    <th>Currency</th>
                                    <th>Spent</th>
                                    <th>Income</th>
                                </tr>
                            </thead>
                            <tbody>
                                {overview.byCurrency.currencies.map((c) => (
                                    <tr key={c.currencyCode}>
                                        <td>{c.currencyCode}</td>
                                        <td>
                                            <FamilyMoney
                                                amount={c.expense}
                                                currency={c.currencyCode}
                                            />
                                        </td>
                                        <td>
                                            <FamilyMoney
                                                amount={c.income}
                                                currency={c.currencyCode}
                                            />
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
                {budget > 0 && !canEditFamilyBudget(family.me) && (
                    <p className="text-xs text-muted-foreground">
                        Only the owner or a guardian can change the budget.
                    </p>
                )}
            </GlassCard>
            {!!overview.unconvertedCurrencies.length && (
                <Notice tone="info">
                    {new Intl.ListFormat('en').format(
                        overview.unconvertedCurrencies,
                    )}{' '}
                    spending isn't in these totals because there's no exchange
                    rate yet. Open Show by currency to see it.
                </Notice>
            )}
        </>
    );
}
