import { FamilyTax } from './FamilyTax';
import { FamilyInvesting } from './FamilyInvesting';
import { FamilySubscriptions } from './FamilySubscriptions';
import { FamilyDeposits } from './FamilyDeposits';
import { FamilyMortgages } from './FamilyMortgages';
import { FamilyCredits } from './FamilyCredits';
import { FamilyDebts } from './FamilyDebts';
import { FamilySpending } from './FamilySpending';
import { FamilyAccounts } from './FamilyAccounts';
import { FamilyHome } from './FamilyHome';
import type { ComponentType } from 'react';
import { PageHeader } from '@/components/PageHeader';
import { Skeleton } from '@/components/ui/skeleton';
import { ScopeSwitch } from './ScopeSwitch';
import { useFinanceView } from './useFinanceView';
import { visibleFamilyMember } from './permissions';
import { FamilyGroupHeader, FamilyGroupList } from './FamilyGroupList';

export function FinanceRoute({
    personal: Personal,
    title,
}: {
    personal: ComponentType;
    title: string;
}) {
    const { view, family, query, setView } = useFinanceView();
    if (query.isLoading)
        return (
            <div className="space-y-4">
                <Skeleton className="h-10 w-40" />
                <Skeleton className="h-24" />
                <Skeleton className="h-40" />
            </div>
        );
    // If the family can't be loaded, fall back to the personal page (no switch) so
    // personal finances stay usable for everyone.
    if (query.error) return <Personal />;
    if (view === 'personal')
        return (
            // Personal pages render <ScopeSwitchRow /> under their own PageHeader.
            <Personal />
        );
    if (!family) return null;
    if (title === 'Dashboard') return <FamilyHome family={family} />;
    if (title === 'Tax') return <FamilyTax family={family} />;
    if (title === 'Investing') return <FamilyInvesting family={family} />;
    if (title === 'Accounts') return <FamilyAccounts family={family} />;
    if (title === 'Spending') return <FamilySpending family={family} />;
    if (title === 'Debts') return <FamilyDebts family={family} />;
    if (title === 'Credits') return <FamilyCredits family={family} />;
    if (title === 'Mortgages') return <FamilyMortgages family={family} />;
    if (title === 'Deposits') return <FamilyDeposits family={family} />;
    if (title === 'Subscriptions')
        return <FamilySubscriptions family={family} />;
    const members = family.members
        .filter((member) => visibleFamilyMember(family.me, member))
        .sort(
            (a, b) =>
                Number(b.id === family.me.id) - Number(a.id === family.me.id) ||
                Number(a.role === 'child') - Number(b.role === 'child') ||
                a.name.localeCompare(b.name),
        );
    return (
        <div className="space-y-4 md:space-y-6">
            <PageHeader
                title={title}
                subtitle={family.household.name}
                variant="one"
            >
                {null}
            </PageHeader>
            <div className="flex flex-wrap items-center gap-2">
                <ScopeSwitch />
            </div>
            <FamilyGroupList>
                {members.map((member) => (
                    <FamilyGroupHeader
                        key={member.id}
                        member={{ ...member, isMe: member.id === family.me.id }}
                        onManage={() => setView('personal')}
                    />
                ))}
            </FamilyGroupList>
        </div>
    );
}
