import { useNavigate, useSearch } from '@tanstack/react-router';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import {
    Select,
    SelectTrigger,
    SelectValue,
    SelectContent,
    SelectItem,
} from '@/components/ui/select';
import { FamilySection, FamilySectionState } from './FamilySectionShared';
import { FamilyPeriodControls } from './FamilyPeriodControls';
import { FamilyLedgerRows } from './FamilyLedgerRows';
import { FamilyGroupList } from './FamilyGroupList';
import { FamilyMoney } from './shared';
import { useFinanceView } from './useFinanceView';
import { orderFamilyMembers } from './permissions';
import {
    localToday,
    type HouseholdOverview,
    type HouseholdOverviewOutput,
    type FamilyTransactionsOutput,
} from './types';
export function FamilySpending({
    family,
}: {
    family: NonNullable<HouseholdOverview>;
}) {
    const search = useSearch({ strict: false });
    const navigate = useNavigate();
    const { setView } = useFinanceView();
    const month = search.month ?? localToday().slice(0, 7);
    const date = new Date(`${month}-01T12:00:00`);
    const monthName = date.toLocaleDateString('en', { month: 'long' });
    const update = (patch: Partial<typeof search>) =>
        void navigate({
            to: '.',
            search: (previous) => ({ ...previous, ...patch }),
        });
    const query = trpc.household.overview.useQuery({
        month,
        currency: search.currency,
        memberId: search.member,
        categoryId: search.category,
    });
    const overview = query.data as HouseholdOverviewOutput | undefined;
    const rows = trpc.household.familyTransactions.useInfiniteQuery(
        {
            month,
            memberId: search.member,
            categoryId: search.category,
            date: search.day,
            limit: 50,
        },
        {
            getNextPageParam: (last: FamilyTransactionsOutput) =>
                last.nextCursor ?? undefined,
        },
    );
    const currency = overview?.displayCurrency ?? search.currency ?? 'KZT';
    const move = (n: number) => {
        const next = new Date(date);
        next.setMonth(next.getMonth() + n);
        update({
            month: `${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, '0')}`,
            day: undefined,
        });
    };
    const clear = () =>
        update({ member: undefined, category: undefined, day: undefined });
    return (
        <FamilySection
            title="Spending"
            family={family}
            controls={
                <FamilyPeriodControls
                    {...{ monthName, date, move, update, currency, overview }}
                />
            }
        >
            <div className="flex flex-wrap gap-2">
                <Select
                    value={search.member ?? 'all'}
                    onValueChange={(v) =>
                        update({ member: v === 'all' ? undefined : v })
                    }
                >
                    <SelectTrigger
                        className="w-full sm:w-48"
                        aria-label="Member"
                    >
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Everyone</SelectItem>
                        {orderFamilyMembers(
                            family.me,
                            family.members.map((m) => ({
                                ...m,
                                isMe: m.id === family.me.id,
                            })),
                        ).map((m) => (
                            <SelectItem key={m.id} value={m.id}>
                                {m.name}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                <Select
                    value={search.category ?? 'all'}
                    onValueChange={(v) =>
                        update({ category: v === 'all' ? undefined : v })
                    }
                >
                    <SelectTrigger
                        className="w-full sm:w-48"
                        aria-label="Category"
                    >
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All categories</SelectItem>
                        {overview?.converted.categories.map((c) => (
                            <SelectItem
                                key={c.categoryId ?? 'none'}
                                value={c.categoryId ?? 'none'}
                            >
                                {c.categoryName}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                <Button variant="ghost" onClick={() => setView('personal')}>
                    Edit my transactions
                </Button>
                {(search.member || search.category || search.day) && (
                    <Button variant="ghost" onClick={clear}>
                        Clear
                    </Button>
                )}
            </div>
            {query.error ? (
                <FamilySectionState error retry={() => void query.refetch()} />
            ) : !overview ? (
                <FamilySectionState error={false} retry={() => {}} />
            ) : (
                <FamilyGroupList>
                    <div className="p-3 space-y-2">
                        <h2 className="text-sm font-semibold">
                            Filtered spending
                        </h2>
                        {(
                            overview.filtered ?? overview.converted
                        ).currencies.map((c) => (
                            <p key={c.currencyCode}>
                                <FamilyMoney
                                    amount={c.expense}
                                    currency={c.currencyCode}
                                />
                            </p>
                        ))}
                    </div>
                </FamilyGroupList>
            )}
            {rows.error ? (
                <FamilySectionState error retry={() => void rows.refetch()} />
            ) : !rows.data ? (
                <FamilySectionState error={false} retry={() => {}} />
            ) : (
                <FamilyGroupList>
                    {rows.data.pages.some(
                        (p: FamilyTransactionsOutput) => p.hiddenChildRows,
                    ) && (
                        <p className="p-3 text-xs text-muted-foreground">
                            {overview?.members.find(
                                (m) => m.memberId === search.member,
                            )?.name ?? 'Children'}
                            's purchases are visible to the owner and guardians.
                            Their total is included above.
                        </p>
                    )}
                    {!rows.data.pages.some(
                        (p: FamilyTransactionsOutput) => p.items.length,
                    ) && (
                        <p className="p-3 text-sm text-muted-foreground">
                            {search.member || search.category || search.day
                                ? `Nothing matches these filters in ${monthName}.`
                                : `No spending in ${monthName} yet.`}
                        </p>
                    )}
                    <FamilyLedgerRows
                        items={rows.data.pages.flatMap(
                            (p: FamilyTransactionsOutput) => p.items,
                        )}
                    />
                    {rows.hasNextPage && (
                        <Button
                            variant="ghost"
                            disabled={rows.isFetchingNextPage}
                            onClick={() => void rows.fetchNextPage()}
                        >
                            Show more
                        </Button>
                    )}
                </FamilyGroupList>
            )}
        </FamilySection>
    );
}
