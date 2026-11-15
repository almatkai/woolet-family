import { FamilyPeriodControls } from './FamilyPeriodControls';
import { FamilyLedgerRows } from './FamilyLedgerRows';
import {
    ResponsiveContainer,
    BarChart,
    Bar,
    XAxis,
    Tooltip,
    Cell,
} from 'recharts';
import { useState } from 'react';
import { Link, useNavigate, useSearch } from '@tanstack/react-router';
import {
    ArrowDownRight,
    ArrowUpRight,
    Pencil,
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
} from 'lucide-react';
import { trpc } from '@/lib/trpc';
import { PageHeader } from '@/components/PageHeader';
import { UniversalAddSheet } from '@/components/UniversalAddSheet';
import { ActionButton } from '@/components/ui/action-button';
import { GlassCard } from '@/components/ui/glass';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

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
    type FamilyTaxRow,
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
            search: (previous) => ({ ...previous, ...patch }),
        });
    const query = trpc.household.overview.useQuery({
        month,
        today,
        currency: search.currency,
        memberId: search.member,
        categoryId: search.category,
    });
    const transactions = trpc.household.familyTransactions.useQuery({
        month,
        memberId: search.member,
        categoryId: search.category,
        date: search.day,
        limit: 8,
    });
    const taxes = trpc.household.familyTax.useQuery({ taxYear: 2026 });
    const [allCategories, setAllCategories] = useState(false);
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
            day: undefined,
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
                <FamilyPeriodControls
                    {...{ monthName, date, move, update, currency, overview }}
                />
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
                <div className="contents lg:block lg:col-span-3 lg:space-y-4">
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
                    <section className="space-y-3 lg:order-none order-3 lg:col-span-3">
                        <h2 className={sectionLabel}>Daily spending</h2>
                        {query.error ? (
                            failure(() => void query.refetch())
                        ) : !overview ? (
                            <Skeleton className="h-40" />
                        ) : (
                            <GlassCard className="p-3">
                                <div className="h-[140px] sm:h-40">
                                    <ResponsiveContainer
                                        width="100%"
                                        height="100%"
                                    >
                                        <BarChart
                                            data={(
                                                overview.filtered ??
                                                overview.converted
                                            ).dailyExpenses.map((d) => ({
                                                date: d.date,
                                                amount: Number(
                                                    d.totals[0]?.amount ?? 0,
                                                ),
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
                                                content={({
                                                    active,
                                                    payload,
                                                }) =>
                                                    active && payload?.[0] ? (
                                                        <div className="bg-popover text-popover-foreground border rounded-xl px-3 py-2 text-xs">
                                                            <p>
                                                                {new Date(
                                                                    `${payload[0].payload.date}T12:00:00`,
                                                                ).toLocaleDateString(
                                                                    'en',
                                                                    {
                                                                        month: 'short',
                                                                        day: 'numeric',
                                                                    },
                                                                )}
                                                            </p>
                                                            <FamilyMoney
                                                                amount={Number(
                                                                    payload[0]
                                                                        .value,
                                                                )}
                                                                currency={
                                                                    currency
                                                                }
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
                                                            search.day ===
                                                            d.date
                                                                ? undefined
                                                                : d.date,
                                                    })
                                                }
                                            >
                                                {(
                                                    overview.filtered ??
                                                    overview.converted
                                                ).dailyExpenses.map((d) => (
                                                    <Cell
                                                        key={d.date}
                                                        fill={
                                                            d.date === today ||
                                                            d.date ===
                                                                search.day
                                                                ? 'hsl(var(--foreground))'
                                                                : 'hsl(var(--muted-foreground))'
                                                        }
                                                        fillOpacity={
                                                            search.day
                                                                ? d.date ===
                                                                  search.day
                                                                    ? 1
                                                                    : 0.2
                                                                : d.date ===
                                                                    today
                                                                  ? 1
                                                                  : 0.35
                                                        }
                                                    />
                                                ))}
                                            </Bar>
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                                <div className="sr-only">
                                    {(
                                        overview.filtered ?? overview.converted
                                    ).dailyExpenses.map((d) => (
                                        <button
                                            key={d.date}
                                            onClick={() =>
                                                update({
                                                    day:
                                                        search.day === d.date
                                                            ? undefined
                                                            : d.date,
                                                })
                                            }
                                        >
                                            {d.date}
                                        </button>
                                    ))}
                                </div>
                            </GlassCard>
                        )}
                    </section>
                </div>
                <section className="order-2 lg:order-none lg:col-span-2 space-y-3">
                    <h2 className={sectionLabel}>Where it went</h2>
                    {query.error ? (
                        failure(() => void query.refetch())
                    ) : !overview ? (
                        <Skeleton className="h-56" />
                    ) : (
                        <GlassCard className="p-2 sm:p-3">
                            <div className="divide-y divide-border dark:divide-white/[0.06]">
                                {!(overview.filtered ?? overview.converted)
                                    .categories.length && (
                                    <p className="p-3 text-sm text-muted-foreground">
                                        No spending in {monthName} yet.
                                    </p>
                                )}
                                {(
                                    overview.filtered ?? overview.converted
                                ).categories
                                    .slice(0, allCategories ? undefined : 6)
                                    .map((c) => {
                                        const id = c.categoryId ?? 'none';
                                        const budget =
                                            overview.categoryBudgets.find(
                                                (b) => b.categoryId === id,
                                            );
                                        const amount =
                                            c.totals[0]?.amount ?? '0';
                                        return (
                                            <button
                                                key={id}
                                                aria-pressed={
                                                    search.category === id
                                                }
                                                onClick={() =>
                                                    update({
                                                        category:
                                                            search.category ===
                                                            id
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
                                                            spent={Number(
                                                                amount,
                                                            )}
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
                                                                amount={
                                                                    budget.amount
                                                                }
                                                                currency={
                                                                    currency
                                                                }
                                                            />
                                                        </>
                                                    )}
                                                </span>
                                            </button>
                                        );
                                    })}
                            </div>
                            {(overview.filtered ?? overview.converted)
                                .categories.length > 6 && (
                                <Button
                                    variant="ghost"
                                    onClick={() =>
                                        setAllCategories(!allCategories)
                                    }
                                >
                                    {allCategories
                                        ? 'Show less'
                                        : `Show all ${(overview.filtered ?? overview.converted).categories.length}`}
                                </Button>
                            )}
                        </GlassCard>
                    )}
                </section>
            </div>
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
                                (c) =>
                                    (c.categoryId ?? 'none') ===
                                    search.category,
                            )?.categoryName,
                            search.day,
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
                        {overview?.members.find(
                            (m) => m.memberId === search.member,
                        )?.canOpen && (
                            <a
                                href={`/family/members/${search.member}?month=${month}`}
                            >
                                Open{' '}
                                {
                                    overview.members.find(
                                        (m) => m.memberId === search.member,
                                    )?.name
                                }
                                's finances
                            </a>
                        )}
                    </div>
                )}
                <div className="flex items-center justify-between">
                    <h2 className={sectionLabel}>Recent spending</h2>
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
                                's purchases are visible to the owner and
                                guardians. Their total is included above.
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
            <section className="space-y-3">
                <h2 className={sectionLabel}>Family finances</h2>
                {financesQuery.error && (
                    <p className="text-sm">
                        Couldn't load the figures.{' '}
                        <Button
                            variant="ghost"
                            onClick={() => void financesQuery.refetch()}
                        >
                            Try again
                        </Button>
                    </p>
                )}
                <GlassCard className="p-2 sm:p-3">
                    <div className="grid lg:grid-cols-2 divide-y divide-border dark:divide-white/[0.06]">
                        {[
                            [
                                '/accounts',
                                'Accounts',
                                Wallet,
                                finances && (
                                    <>
                                        {finances.summary.accountsCount}{' '}
                                        accounts, ≈{' '}
                                        {money(
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
                                        {money(finances.summary.owesConverted)}
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
                                        ? `${finances.summary.depositsCount} deposits`
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
                                            {money(
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
                                taxes.data
                                    ? `${taxes.data.filter((t: FamilyTaxRow) => t.hasProfile).length} profiles for 2026`
                                    : taxes.error
                                      ? 'Tax figures unavailable'
                                      : 'Loading profiles…',
                            ],
                            [
                                '/family',
                                'Wallets and members',
                                Users,
                                `${family.members.length} members`,
                            ],
                        ].map(([to, label, Icon, figure]) => {
                            const RowIcon = Icon as typeof Wallet;
                            return (
                                <Link
                                    key={String(to)}
                                    to={to as '/accounts'}
                                    search={{
                                        month,
                                        currency: search.currency,
                                        view: undefined,
                                    }}
                                    className={rowClass}
                                >
                                    <RowIcon className="size-4 text-muted-foreground shrink-0" />
                                    <div className="min-w-0 flex-1">
                                        <p className="text-sm font-semibold">
                                            {String(label)}
                                        </p>
                                        <div className="pointer-events-none text-xs text-muted-foreground truncate">
                                            {figure as React.ReactNode}
                                        </div>
                                    </div>
                                    <ChevronRight className="size-4 text-muted-foreground" />
                                </Link>
                            );
                        })}
                    </div>
                </GlassCard>
            </section>
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
