import { useSearch } from '@tanstack/react-router';
import { formatDay } from './formatDay';
import { familyPermissions } from './permissions';
import { trpc } from '@/lib/trpc';
import {
    FamilySection,
    FamilySectionState,
    FamilySectionTotal,
} from './FamilySectionShared';
import { FamilyGroupHeader, FamilyGroupList } from './FamilyGroupList';
import { FamilyMoney, staticRowClass } from './shared';
import { orderFamilyMembers } from './permissions';
import { useFinanceView } from './useFinanceView';
import { familyTotals } from './familyTotals';
import type { HouseholdOverview, FamilyFinancesOutput } from './types';

export function FamilySubscriptions({
    family,
}: {
    family: NonNullable<HouseholdOverview>;
}) {
    const search = useSearch({ strict: false });
    const query = trpc.household.familyFinances.useQuery({
        currency: search.currency,
    });
    const data = query.data as FamilyFinancesOutput | undefined;
    const { setView } = useFinanceView();
    const canAdd = familyPermissions(family.me).isOwner;
    const totals = (members: FamilyFinancesOutput['members']) =>
        familyTotals(
            members.flatMap((member) =>
                member.subscriptions
                    .filter((item) => !item.linkedEntityType)
                    .map((item) => ({
                        currencyCode: item.currency,
                        amount: item.monthlyAmount,
                    })),
            ),
        );
    return (
        <FamilySection title="Subscriptions" family={family}>
            {!data ? (
                <FamilySectionState
                    error={!!query.error}
                    retry={() => void query.refetch()}
                />
            ) : (
                <>
                    <FamilySectionTotal
                        label="Family subscriptions"
                        totals={totals(data.members)}
                        converted={data.summary.subscriptionsMonthlyConverted}
                        unconvertedCurrencies={data.unconvertedCurrencies}
                        currency={data.displayCurrency}
                        suffix=" a month"
                    />
                    {!data.members.some(
                        (member) => member.subscriptions.length,
                    ) && (
                        <p className="text-sm text-muted-foreground">
                            No one in the family has added a subscription.{' '}
                            {canAdd && 'Add one in Personal view.'}
                        </p>
                    )}
                    {orderFamilyMembers(family.me, data.members).map(
                        (member) => (
                            <FamilyGroupList key={member.memberId}>
                                <FamilyGroupHeader
                                    member={member}
                                    totals={totals([member])}
                                    onManage={() => setView('personal')}
                                />
                                {!member.subscriptions.length && (
                                    <p className="p-3 text-sm text-muted-foreground">
                                        No subscriptions added.
                                    </p>
                                )}
                                {member.subscriptions.map((item) => (
                                    <div
                                        key={item.id}
                                        className={staticRowClass}
                                    >
                                        <div className="min-w-0 flex-1">
                                            <p className="text-sm">
                                                {item.name}
                                            </p>
                                            <p className="text-xs text-muted-foreground">{`${item.frequency}, next payment: ${item.nextPaymentDate ? formatDay(item.nextPaymentDate) : 'Not set'}`}</p>
                                            {item.linkedEntityType && (
                                                <p className="text-xs text-muted-foreground">
                                                    Paid as loan
                                                </p>
                                            )}
                                        </div>
                                        <div className="whitespace-nowrap text-right">
                                            <FamilyMoney
                                                amount={item.monthlyAmount}
                                                currency={item.currency}
                                            />{' '}
                                            a month
                                        </div>
                                    </div>
                                ))}
                            </FamilyGroupList>
                        ),
                    )}
                </>
            )}
        </FamilySection>
    );
}
