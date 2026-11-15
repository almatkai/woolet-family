import { useSearch } from '@tanstack/react-router';
import { trpc } from '@/lib/trpc';
import {
    FamilySection,
    FamilySectionState,
    FamilySectionTotal,
} from './FamilySectionShared';
import { FamilyGroupHeader, FamilyGroupList } from './FamilyGroupList';
import { FamilyMoney, staticRowClass } from './shared';
import { familyPermissions, orderFamilyMembers } from './permissions';
import { useFinanceView } from './useFinanceView';
import { familyTotals } from './familyTotals';
import type { HouseholdOverview, FamilyFinancesOutput } from './types';

type Member = FamilyFinancesOutput['members'][number];
type Loan = {
    id: string;
    name: string;
    currency: string;
    remaining: string;
    monthlyPayment: string;
};

export function FamilyLoans<T extends Loan>({
    family,
    title,
    singular,
    rows,
    detail,
}: {
    family: NonNullable<HouseholdOverview>;
    title: string;
    singular: string;
    rows: (member: Member) => T[];
    detail: (item: T) => string;
}) {
    const search = useSearch({ strict: false });
    const query = trpc.household.familyFinances.useQuery({
        currency: search.currency,
    });
    const data = query.data as FamilyFinancesOutput | undefined;
    const { setView } = useFinanceView();
    const canAdd = familyPermissions(family.me).isOwner;
    const totals = (members: Member[], field: 'remaining' | 'monthlyPayment') =>
        familyTotals(
            members.flatMap((member) =>
                rows(member).map((item) => ({
                    currencyCode: item.currency,
                    amount: item[field],
                })),
            ),
        );

    return (
        <FamilySection title={title} family={family}>
            {!data ? (
                <FamilySectionState
                    error={!!query.error}
                    retry={() => void query.refetch()}
                />
            ) : (
                <>
                    <FamilySectionTotal
                        label={`Family ${title.toLowerCase()} remaining`}
                        totals={totals(data.members, 'remaining')}
                        currency={data.displayCurrency}
                        unconvertedCurrencies={data.unconvertedCurrencies}
                    />
                    <FamilySectionTotal
                        label="Monthly payments"
                        totals={totals(data.members, 'monthlyPayment')}
                        currency={data.displayCurrency}
                        unconvertedCurrencies={data.unconvertedCurrencies}
                    />
                    {!data.members.some((member) => rows(member).length) && (
                        <p className="text-sm text-muted-foreground">
                            No one in the family has added a {singular}.{' '}
                            {canAdd && 'Add one in Personal view.'}
                        </p>
                    )}
                    {orderFamilyMembers(family.me, data.members).map(
                        (member) => (
                            <FamilyGroupList key={member.memberId}>
                                <FamilyGroupHeader
                                    member={member}
                                    totals={totals([member], 'remaining')}
                                    onManage={() => setView('personal')}
                                />
                                {!rows(member).length && (
                                    <p className="p-3 text-sm text-muted-foreground">
                                        No {title.toLowerCase()} added.
                                    </p>
                                )}
                                {rows(member).map((item) => (
                                    <div
                                        key={item.id}
                                        className={staticRowClass}
                                    >
                                        <div className="min-w-0 flex-1">
                                            <p className="text-sm">
                                                {item.name}
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                                {detail(item)}
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <FamilyMoney
                                                amount={item.remaining}
                                                currency={item.currency}
                                            />
                                            <p className="whitespace-nowrap text-xs text-muted-foreground">
                                                <FamilyMoney
                                                    amount={item.monthlyPayment}
                                                    currency={item.currency}
                                                />{' '}
                                                a month
                                            </p>
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
