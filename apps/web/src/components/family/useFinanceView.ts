import { useNavigate, useSearch } from '@tanstack/react-router';
import { trpc } from '@/lib/trpc';
import { canUseFamilyView } from './permissions';
import type { HouseholdOverview } from './types';

export function useFinanceView() {
    const query = trpc.household.get.useQuery();
    const family = query.data as HouseholdOverview | undefined;
    const search = useSearch({ strict: false });
    const navigate = useNavigate();
    const canUseFamily = canUseFamilyView(family?.me);
    const view: 'family' | 'personal' =
        canUseFamily && search.view !== 'personal' ? 'family' : 'personal';
    const setView = (next: 'family' | 'personal') =>
        void navigate({
            to: '.',
            search: (previous: Record<string, unknown>) => ({
                ...previous,
                view: next === 'personal' ? 'personal' : undefined,
            }),
        });
    return { view, canUseFamily, setView, family, query };
}
