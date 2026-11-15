import { useSearch } from '@tanstack/react-router';
import { familyPermissions } from './permissions';
import { trpc } from '@/lib/trpc';
import { FamilySection, FamilySectionState } from './FamilySectionShared';
import { FamilyGroupHeader, FamilyGroupList } from './FamilyGroupList';
import { FamilyMoney, MoneyTotals, rowClass } from './shared';
import { orderFamilyMembers } from './permissions';
import { useFinanceView } from './useFinanceView';
import { familyTotals } from './familyTotals';
import type { HouseholdOverview, FamilyFinancesOutput } from './types';

export function FamilyDeposits({
    family,
}: {
    family: NonNullable<HouseholdOverview>;
}) {
    const search = useSearch({ strict: false });
    const query = trpc.household.familyFinances.useQuery({ currency: search.currency });
    const data = query.data as FamilyFinancesOutput | undefined;
    const { setView } = useFinanceView();
    const totals = (members: FamilyFinancesOutput['members']) =>
        familyTotals(
            members.flatMap((member) =>
                member.deposits.map((item) => ({
                    currencyCode: item.currency,
                    amount: item.balance,
                })),
            ),
        );
    return (
        <FamilySection title="Deposits" family={family}>
            {!data ? (
                <FamilySectionState
                    error={!!query.error}
                    retry={() => void query.refetch()}
                />
            ) : (
                <>
                    <FamilyGroupList>
                        <h2 className="p-3 text-sm font-semibold">
                            Family deposits balance
                        </h2>
                        <div className="p-3">
                            <MoneyTotals
                                totals={totals(data.members).map((t) => ({
                                    currency: t.currencyCode,
                                    amount: t.amount,
                                }))}
                            />
                        </div>
                    </FamilyGroupList>
                    {!data.members.some((member) => member.deposits.length) && (
                        <p className="text-sm text-muted-foreground">
                            No one in the family has added a deposit.{' '}{familyPermissions(family.me).isOwner && 'Add one in Personal view.'}
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
                                {!member.deposits.length && (
                                    <p className="p-3 text-sm text-muted-foreground">
                                        No deposits added.
                                    </p>
                                )}
                                {member.deposits.map((item) => (
                                    <div key={item.id} className={rowClass}>
                                        <div className="min-w-0 flex-1">
                                            <p className="text-sm">
                                                {item.name}
                                            </p>
                                            <p className="text-xs text-muted-foreground">{`Rate: ${item.interestRate ?? 'Not set'}${item.interestRate === null ? '' : '%'}`}</p>
                                        </div>
                                        <div className="text-right">
                                            <FamilyMoney
                                                amount={item.balance}
                                                currency={item.currency}
                                            />
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
