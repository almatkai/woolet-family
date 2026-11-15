import { trpc } from '@/lib/trpc';
import { FamilySection, FamilySectionState } from './FamilySectionShared';
import { FamilyGroupHeader, FamilyGroupList } from './FamilyGroupList';
import { FamilyMoney, rowClass } from './shared';
import { orderFamilyMembers } from './permissions';
import { useFinanceView } from './useFinanceView';
import type { HouseholdOverview, FamilyFinancesOutput } from './types';

export function FamilyInvesting({ family }: { family: NonNullable<HouseholdOverview> }) {
    const query = trpc.household.familyFinances.useQuery({});
    const data = query.data as FamilyFinancesOutput | undefined;
    const { setView } = useFinanceView();
    return <FamilySection title="Investing" family={family}>
        {!data ? <FamilySectionState error={!!query.error} retry={() => void query.refetch()} /> : orderFamilyMembers(family.me, data.members).map(member => <FamilyGroupList key={member.memberId}>
            <FamilyGroupHeader member={member} totals={member.investments?.value} onManage={() => setView('personal')} />
            {!member.investments ? <p className="p-3 text-sm text-muted-foreground">Portfolio value isn't available in family view yet.</p> : <details className="p-3">
                <summary className="min-h-10 cursor-pointer text-sm">{member.investments.holdings.length} holdings</summary>
                {!member.investments.holdings.length && <p className="text-sm text-muted-foreground">No holdings added.</p>}
                {member.investments.holdings.map((holding, index) => <div key={`${holding.symbol}-${index}`} className={rowClass}>
                    <div className="flex-1"><p className="text-sm font-medium">{holding.symbol}</p><p className="text-xs text-muted-foreground">Quantity: {holding.quantity}</p></div>
                    <FamilyMoney amount={holding.value} currency={holding.currency} />
                </div>)}
            </details>}
        </FamilyGroupList>)}
    </FamilySection>;
}
