import type { ReactNode } from 'react';
import { Link } from '@tanstack/react-router';
import { visibleFamilyMember } from './permissions';
import { useFinanceView } from './useFinanceView';

export function FamilyMemberLink({
    memberId,
    children,
}: {
    memberId?: string | null;
    children: ReactNode;
}) {
    const { family } = useFinanceView();
    const member = family?.members.find((member) => member.id === memberId);
    return family && member && visibleFamilyMember(family.me, member) ? (
        <Link
            className="underline underline-offset-2"
            to="/family/members/$memberId"
            params={{ memberId: member.id }}
            onClick={(event) => event.stopPropagation()}
        >
            {children}
        </Link>
    ) : (
        <>{children}</>
    );
}
