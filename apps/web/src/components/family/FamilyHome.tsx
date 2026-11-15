import { useState } from 'react';
import { useNavigate, useSearch } from '@tanstack/react-router';
import { ArrowDownRight, ArrowUpRight, Pencil } from 'lucide-react';
import { trpc } from '@/lib/trpc';
import { PageHeader } from '@/components/PageHeader';
import { UniversalAddSheet } from '@/components/UniversalAddSheet';
import { ActionButton } from '@/components/ui/action-button';
import { GlassCard } from '@/components/ui/glass';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
    Select,
    SelectTrigger,
    SelectValue,
    SelectContent,
    SelectItem,
    SelectLabel,
    SelectGroup,
} from '@/components/ui/select';
import { ScopeSwitch } from './ScopeSwitch';
import { FamilyBudgetSheet } from './FamilyBudgetSheet';
import { canEditFamilyBudget } from './permissions';
import {
    FamilyMoney,
    Initials,
    LimitBar,
    Notice,
    roleLabel,
    rowClass,
    sectionLabel,
} from './shared';
import {
    localToday,
    type HouseholdOverview,
    type HouseholdOverviewOutput,
    type FamilyFinancesOutput,
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
            Pick<typeof search, 'month' | 'currency' | 'member' | 'category'>
        >,
    ) =>
        void navigate({
            to: '.',
            search: (previous) => ({ ...previous, ...patch }),
        });
    const query = trpc.household.overview.useQuery({
        month,
        today,
        currency: search.currency,
        memberId: search.member,
        categoryId: search.category,
    });
    const overview = query.data as HouseholdOverviewOutput | undefined;
    const financesQuery = trpc.household.familyFinances.useQuery({
        currency: search.currency,
    });
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
        });
    };
    const total = overview?.converted.currencies[0];
    const currency = overview?.displayCurrency ?? search.currency ?? 'KZT';
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
        ...((overview?.filtered ?? overview?.converted)?.members ?? []),
    ].sort(
        (a, b) =>
            Number(a.status === 'unassigned') -
                Number(b.status === 'unassigned') ||
            Number(b.totals[0]?.amount ?? 0) - Number(a.totals[0]?.amount ?? 0),
    );
    const memberTotal = Number(
        (overview?.filtered ?? overview?.converted)?.currencies[0]?.expense ??
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
            <div className="flex flex-wrap items-center gap-2">
                <ScopeSwitch />
                <div className="ml-auto flex flex-wrap items-center gap-2">
                    <Button
                        variant="ghost"
                        className="size-10"
                        aria-label="Previous month"
                        onClick={() => move(-1)}
                    >
                        ‹
                    </Button>
                    <span className="text-sm">
                        {monthName} {date.getFullYear()}
                    </span>
                    <Button
                        variant="ghost"
                        className="size-10"
                        aria-label="Next month"
                        onClick={() => move(1)}
                    >
                        ›
                    </Button>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                            update({
                                month: undefined,
                                member: undefined,
                                category: undefined,
                            })
                        }
                    >
                        This month
                    </Button>
                    <Select
                        value={currency}
                        onValueChange={(v) =>
                            update({
                                currency:
                                    v === overview?.baseCurrency
                                        ? undefined
                                        : v,
                            })
                        }
                    >
                        <SelectTrigger
                            aria-label="Show totals in"
                            className="h-9 min-w-[5.5rem] w-auto"
                        >
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectGroup>
                                <SelectLabel>Show totals in</SelectLabel>
                                {overview?.availableCurrencies.map((c) => (
                                    <SelectItem key={c} value={c}>
                                        {c} —{' '}
                                        {new Intl.DisplayNames(['en'], {
                                            type: 'currency',
                                        }).of(c)}
                                    </SelectItem>
                                ))}
                            </SelectGroup>
                        </SelectContent>
                    </Select>
                </div>
            </div>
            {query.error ? (
                failure(() => void query.refetch())
            ) : !overview ? (
                <Skeleton className="h-40 rounded-[22px]" />
            ) : (
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
                                    <Pencil className="size-4 min-[391px]:hidden" />
                                    <span className="max-[390px]:sr-only">
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
                                    <LimitBar
                                        spent={spent}
                                        limit={budget}
                                        size="md"
                                    />
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
                                        {spent > budget
                                            ? 'over budget'
                                            : 'left'}
                                    </span>
                                    {current && (
                                        <>
                                            <span>{days - day} days to go</span>
                                            <span
                                                className={`ml-auto ${spent > pace ? 'text-amber-800 dark:text-amber-300' : 'text-emerald-700 dark:text-emerald-400'}`}
                                            >
                                                {money(Math.abs(pace - spent))}{' '}
                                                {spent > pace
                                                    ? 'over'
                                                    : 'under'}{' '}
                                                pace
                                            </span>
                                            <span className="sr-only">
                                                Pace mark: where spending would
                                                be if spread evenly over the
                                                month.
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
                                    Set a monthly budget to see how much is
                                    left.
                                </p>
                                {!canEditFamilyBudget(family.me) && (
                                    <p className="text-xs text-muted-foreground">
                                        Only the owner or a guardian can set a
                                        family budget.
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
                                <span>
                                    Converted to {currency} at today's rates.
                                </span>
                            )}
                            {currency !== overview.baseCurrency && (
                                <span>
                                    Budget set in {overview.baseCurrency}.
                                </span>
                            )}
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setExpanded(!expanded)}
                            >
                                {expanded
                                    ? 'Hide by currency'
                                    : 'Show by currency'}
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
                                        {overview.byCurrency.currencies.map(
                                            (c) => (
                                                <tr key={c.currencyCode}>
                                                    <td>{c.currencyCode}</td>
                                                    <td>
                                                        <FamilyMoney
                                                            amount={c.expense}
                                                            currency={
                                                                c.currencyCode
                                                            }
                                                        />
                                                    </td>
                                                    <td>
                                                        <FamilyMoney
                                                            amount={c.income}
                                                            currency={
                                                                c.currencyCode
                                                            }
                                                        />
                                                    </td>
                                                </tr>
                                            ),
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        )}
                        {budget > 0 && !canEditFamilyBudget(family.me) && (
                            <p className="text-xs text-muted-foreground">
                                Only the owner or a guardian can change the
                                budget.
                            </p>
                        )}
                    </GlassCard>
                    {!!overview.unconvertedCurrencies.length && (
                        <Notice tone="info">
                            {overview.unconvertedCurrencies.join(' and ')}{' '}
                            spending isn't in these totals because there's no
                            exchange rate yet. Open Show by currency to see it.
                        </Notice>
                    )}
                </>
            )}
            {financesQuery.error ? (
                failure(() => void financesQuery.refetch())
            ) : !finances || !total ? (
                <Skeleton className="h-24 rounded-2xl" />
            ) : (
                <GlassCard className="p-4">
                    <dl className="grid grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-3">
                        {[
                            [
                                `Income in ${date.toLocaleDateString('en', { month: 'short' })}`,
                                total.income,
                            ],
                            ['Net worth', finances.summary.balancesConverted],
                            ['Owes', finances.summary.owesConverted],
                            [
                                'Monthly payments',
                                finances.summary.monthlyPaymentsConverted,
                            ],
                        ].map(([label, amount]) => (
                            <div key={label}>
                                <dt className="text-xs text-muted-foreground">
                                    {label}
                                </dt>
                                <dd className="text-base font-semibold tabular-nums">
                                    ≈{' '}
                                    <FamilyMoney
                                        amount={amount}
                                        currency={currency}
                                        abbreviate
                                    />
                                </dd>
                            </div>
                        ))}
                    </dl>
                </GlassCard>
            )}
            <div className="grid gap-4 lg:grid-cols-5">
                <div className="lg:col-span-3 space-y-4">
                    <h2 className={sectionLabel}>Who spent what</h2>
                    {query.error ? (
                        failure(() => void query.refetch())
                    ) : !overview ? (
                        <div className="space-y-2">
                            {[0, 1, 2].map((n) => (
                                <Skeleton
                                    key={n}
                                    className="h-14 rounded-2xl"
                                />
                            ))}
                        </div>
                    ) : (
                        <GlassCard className="p-2 sm:p-3">
                            <div className="divide-y divide-border dark:divide-white/[0.06]">
                                {!members.length && (
                                    <p className="p-3 text-sm text-muted-foreground">
                                        No spending in {monthName} yet.
                                    </p>
                                )}
                                {members.map((m) => {
                                    const detail = overview.members.find(
                                        (d) => d.memberId === m.memberId,
                                    );
                                    const amount = Number(
                                        m.totals[0]?.amount ?? 0,
                                    );
                                    const percent =
                                        memberTotal > 0
                                            ? Math.round(
                                                  (amount / memberTotal) * 100,
                                              )
                                            : 0;
                                    return (
                                        <button
                                            key={m.memberId ?? m.status}
                                            disabled={!m.memberId}
                                            aria-pressed={
                                                !!m.memberId &&
                                                search.member === m.memberId
                                            }
                                            onClick={() =>
                                                update({
                                                    member:
                                                        search.member ===
                                                        m.memberId
                                                            ? undefined
                                                            : (m.memberId ??
                                                              undefined),
                                                })
                                            }
                                            className={`${rowClass} w-full text-left ${search.member === m.memberId ? 'bg-muted dark:bg-white/[0.06]' : ''}`}
                                        >
                                            <Initials name={m.name} />
                                            <div className="min-w-0 flex-1">
                                                <p className="text-sm font-semibold truncate">
                                                    {m.name}
                                                    {detail?.isMe && (
                                                        <span className="text-muted-foreground">
                                                            {' '}
                                                            (you)
                                                        </span>
                                                    )}
                                                </p>
                                                <p className="text-xs text-muted-foreground">
                                                    {detail
                                                        ? `${roleLabel(detail.role, detail.isGuardian)}  ${detail.expenseCount} purchases`
                                                        : m.status === 'former'
                                                          ? 'Former member'
                                                          : 'Unassigned'}
                                                </p>
                                                <div className="mt-2 h-1.5 rounded-full bg-muted dark:bg-white/[0.08]">
                                                    <div
                                                        className="h-full rounded-full bg-foreground/70"
                                                        style={{
                                                            width: `${Math.min(100, percent)}%`,
                                                        }}
                                                    />
                                                </div>
                                            </div>
                                            <div className="pointer-events-none text-right text-sm">
                                                <FamilyMoney
                                                    amount={amount}
                                                    currency={currency}
                                                />
                                                <p className="text-xs text-muted-foreground">
                                                    {percent}%
                                                </p>
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                            {family.members.length === 1 && (
                                <p className="p-3 text-xs text-muted-foreground">
                                    Only you so far.{' '}
                                    {family.me.canManageMembers && (
                                        <a href="/family">Invite</a>
                                    )}
                                </p>
                            )}
                        </GlassCard>
                    )}
                    <div />
                </div>
                <div className="lg:col-span-2" />
            </div>
            <div />
            <div />
            {editing &&
                (baseQuery.error ? (
                    failure(() => void baseQuery.refetch())
                ) : base ? (
                    <FamilyBudgetSheet
                        family={family}
                        overview={base}
                        onClose={() => setEditing(false)}
                    />
                ) : (
                    <Skeleton className="h-20" />
                ))}
        </div>
    );
}
