import { FamilyMemberLink } from './FamilyMemberLink';
import { familyTotals } from './familyTotals';
import { trpc } from '@/lib/trpc';
import {
    FamilySection,
    FamilySectionState,
    FamilySectionTotal,
} from './FamilySectionShared';
import { FamilyGroupHeader, FamilyGroupList } from './FamilyGroupList';
import { FamilyMoney, rowClass } from './shared';
import { orderFamilyMembers } from './permissions';
import { useFinanceView } from './useFinanceView';
import type { HouseholdOverview, FamilyFinancesOutput } from './types';
export function FamilyDebts({
    family,
}: {
    family: NonNullable<HouseholdOverview>;
}) {
    const query = trpc.household.familyFinances.useQuery({});
    const data = query.data as FamilyFinancesOutput | undefined;
    const { setView } = useFinanceView();
    return (
        <FamilySection title="Debts" family={family}>
            {!data ? (
                <FamilySectionState
                    error={!!query.error}
                    retry={() => void query.refetch()}
                />
            ) : (
                <>
                    <FamilySectionTotal
                        label="Family owes"
                        totals={data.summary.owes}
                        converted={data.summary.owesConverted}
                        currency={data.displayCurrency}
                    />
                    <FamilySectionTotal
                        label="Owed to family"
                        totals={data.summary.owed}
                        converted={data.summary.owedConverted}
                        currency={data.displayCurrency}
                    />
                    {orderFamilyMembers(family.me, data.members).map(
                        (member) => (
                            <FamilyGroupList key={member.memberId}>
                                <FamilyGroupHeader
                                    member={member}
                                    totals={familyTotals(
                                        member.debts
                                            .filter(
                                                (d) => !d.counterpartyMemberId,
                                            )
                                            .map((d) => ({
                                                currencyCode: d.currencyCode,
                                                amount: d.remaining,
                                            })),
                                    )}
                                    onManage={() => setView('personal')}
                                />
                                {!member.debts.some(
                                    (d) => !d.counterpartyMemberId,
                                ) && (
                                    <p className="p-3 text-sm text-muted-foreground">
                                        No open debts outside the family.
                                    </p>
                                )}
                                {member.debts
                                    .filter((d) => !d.counterpartyMemberId)
                                    .map((debt) => (
                                        <div key={debt.id} className={rowClass}>
                                            <div className="min-w-0 flex-1">
                                                <p className="text-sm">
                                                    {debt.type === 'i_owe'
                                                        ? `Owes ${debt.personName}`
                                                        : `${debt.personName} owes ${member.name}`}
                                                </p>
                                                <p className="text-xs text-muted-foreground">
                                                    {debt.dueDate
                                                        ? `Due ${debt.dueDate}`
                                                        : 'No due date'}
                                                </p>
                                            </div>
                                            <FamilyMoney
                                                amount={debt.remaining}
                                                currency={debt.currencyCode}
                                            />
                                        </div>
                                    ))}
                            </FamilyGroupList>
                        ),
                    )}
                    <FamilyGroupList>
                        <h2 className="p-3 text-sm font-semibold">
                            Between family members
                        </h2>
                        {!data.internalDebts.length && (
                            <p className="p-3 text-sm text-muted-foreground">
                                No open debts between family members.
                            </p>
                        )}
                        {data.internalDebts.map((debt) => (
                            <div key={debt.id} className={rowClass}>
                                <span className="min-w-0 flex-1 text-sm">
                                    <FamilyMemberLink
                                        memberId={debt.fromMemberId}
                                    >
                                        {data.members.find(
                                            (m) =>
                                                m.memberId ===
                                                debt.fromMemberId,
                                        )?.name ?? 'Family member'}
                                    </FamilyMemberLink>{' '}
                                    owes{' '}
                                    <FamilyMemberLink
                                        memberId={debt.toMemberId}
                                    >
                                        {data.members.find(
                                            (m) =>
                                                m.memberId === debt.toMemberId,
                                        )?.name ?? 'family member'}
                                    </FamilyMemberLink>
                                </span>
                                <FamilyMoney
                                    amount={debt.remaining}
                                    currency={debt.currencyCode}
                                />
                            </div>
                        ))}
                    </FamilyGroupList>
                </>
            )}
        </FamilySection>
    );
}
