import type { ComponentType } from 'react';
import { FamilySectionState } from './FamilySectionShared';
import { Skeleton } from '@/components/ui/skeleton';
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
import { useFinanceView } from './useFinanceView';

export function FinanceRoute({
    personal: Personal,
    section,
}: {
    personal: ComponentType;
    section: 'dashboard' | 'accounts' | 'spending' | 'debts' | 'credits' | 'mortgages' | 'deposits' | 'subscriptions' | 'investing' | 'tax';
}) {
    const { view, family, query } = useFinanceView();
    if (query.isLoading)
        return (
            <div className="space-y-4">
                <Skeleton className="h-10 w-40" />
                <Skeleton className="h-24" />
                <Skeleton className="h-40" />
            </div>
        );
    if (query.error)
        return <FamilySectionState error retry={() => void query.refetch()} />;
    if (view === 'personal')
        return (
            // Personal pages render <ScopeSwitchRow /> under their own PageHeader.
            <Personal />
        );
    if (!family) return null;
    switch (section) {
        case 'dashboard': return <FamilyHome family={family} />;
        case 'tax': return <FamilyTax family={family} />;
        case 'investing': return <FamilyInvesting family={family} />;
        case 'accounts': return <FamilyAccounts family={family} />;
        case 'spending': return <FamilySpending family={family} />;
        case 'debts': return <FamilyDebts family={family} />;
        case 'credits': return <FamilyCredits family={family} />;
        case 'mortgages': return <FamilyMortgages family={family} />;
        case 'deposits': return <FamilyDeposits family={family} />;
        case 'subscriptions': return <FamilySubscriptions family={family} />;
    }
}
