import { useState } from 'react';
import { trpc } from '@/lib/trpc';
import {
    Select,
    SelectTrigger,
    SelectValue,
    SelectContent,
    SelectItem,
} from '@/components/ui/select';
import { FamilySection, FamilySectionState } from './FamilySectionShared';
import { FamilyGroupHeader, FamilyGroupList } from './FamilyGroupList';
import { FamilyMoney } from './shared';
import { orderFamilyMembers } from './permissions';
import { useFinanceView } from './useFinanceView';
import type { HouseholdOverview, FamilyTaxOutput } from './types';

export function FamilyTax({
    family,
}: {
    family: NonNullable<HouseholdOverview>;
}) {
    const [taxYear, setTaxYear] = useState<2025 | 2026>(2026);
    const query = trpc.household.familyTax.useQuery({ taxYear });
    const data = query.data as FamilyTaxOutput | undefined;
    const { setView } = useFinanceView();
    const members = orderFamilyMembers(
        family.me,
        family.members.map((member) => ({
            ...member,
            memberId: member.id,
            isMe: member.id === family.me.id,
        })),
    );
    return (
        <FamilySection
            title="Tax"
            family={family}
            controls={
                <Select
                    value={String(taxYear)}
                    onValueChange={(value) =>
                        setTaxYear(Number(value) as 2025 | 2026)
                    }
                >
                    <SelectTrigger className="w-auto" aria-label="Tax year">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        {[2026, 2025].map((year) => (
                            <SelectItem key={year} value={String(year)}>
                                {year}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            }
        >
            {!data ? (
                <FamilySectionState
                    error={!!query.error}
                    retry={() => void query.refetch()}
                />
            ) : (
                members.map((member) => {
                    const row = data.find(
                        (row) => row.memberId === member.memberId,
                    );
                    return (
                        <FamilyGroupList key={member.memberId}>
                            <FamilyGroupHeader
                                member={member}
                                onManage={() => setView('personal')}
                            />
                            {!row?.hasProfile ? (
                                <p className="p-3 text-sm text-muted-foreground">
                                    No {taxYear} tax profile.
                                </p>
                            ) : (
                                <dl className="grid grid-cols-1 gap-3 p-3 sm:grid-cols-3 text-sm">
                                    <div>
                                        <dt className="text-xs text-muted-foreground">
                                            Estimated tax
                                        </dt>
                                        <dd>
                                            {row.estimatedTax === null ? (
                                                'Unavailable'
                                            ) : (
                                                <FamilyMoney
                                                    amount={row.estimatedTax}
                                                    currency={row.currency}
                                                />
                                            )}
                                        </dd>
                                    </div>
                                    <div>
                                        <dt className="text-xs text-muted-foreground">
                                            Paid so far
                                        </dt>
                                        <dd>
                                            {row.paid === null ? (
                                                'Unavailable'
                                            ) : (
                                                <FamilyMoney
                                                    amount={row.paid}
                                                    currency={row.currency}
                                                />
                                            )}
                                        </dd>
                                    </div>
                                    <div>
                                        <dt className="text-xs text-muted-foreground">
                                            Next due
                                        </dt>
                                        <dd>
                                            {row.nextDue ? (
                                                <>
                                                    {row.nextDue.date}:{' '}
                                                    <FamilyMoney
                                                        amount={
                                                            row.nextDue.amount
                                                        }
                                                        currency={row.currency}
                                                    />
                                                </>
                                            ) : (
                                                'No payment due'
                                            )}
                                        </dd>
                                    </div>
                                </dl>
                            )}
                        </FamilyGroupList>
                    );
                })
            )}
        </FamilySection>
    );
}
