import type { ReactNode } from 'react';
import { Link } from '@tanstack/react-router';
import { trpc } from '@/lib/trpc';
import { canOpenMember } from './permissions';
import { useFinanceView } from './useFinanceView';
import { localToday, type HouseholdOverviewOutput } from './types';

export function FamilyMemberLink({
    memberId,
    children,
}: {
    memberId?: string | null;
    children: ReactNode;
}) {
    const { family } = useFinanceView();
    const query = trpc.household.overview.useQuery(
        { month: localToday().slice(0, 7) },
        { enabled: !!family },
    );
    const member = (
        query.data as HouseholdOverviewOutput | undefined
    )?.members.find((member) => member.memberId === memberId);
    return family && member && canOpenMember(family.me, member) ? (
        <Link
            className="underline underline-offset-2"
            to="/family/members/$memberId"
            params={{ memberId: member.memberId }}
            onClick={(event) => event.stopPropagation()}
        >
            {children}
        </Link>
    ) : (
        <>{children}</>
    );
}
