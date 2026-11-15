import { FamilyMemberLink } from './FamilyMemberLink';
import type { FamilyWalletsResponse } from './types';
import { Link } from '@tanstack/react-router';
import { trpc } from '@/lib/trpc';
import { useFinanceView } from './useFinanceView';
import { canShowChildWallet } from './permissions';
import { localToday } from './types';
import type { ReactNode } from 'react';
import { GlassCard } from '@/components/ui/glass';
import { Button } from '@/components/ui/button';
import { Initials, MoneyTotals, roleLabel } from './shared';
import type { CurrencyAmount, HouseholdRole } from './types';

export function FamilyGroupHeader({
    member,
    totals = [],
    onManage,
}: {
    member: {
        memberId?: string;
        name: string;
        role: HouseholdRole;
        isGuardian: boolean;
        isMe: boolean;
    };
    totals?: CurrencyAmount[];
    onManage: () => void;
}) {
    const { family } = useFinanceView();
    const wallets = trpc.household.wallets.useQuery({ today: localToday() });
    const wallet =
        family && canShowChildWallet(family.me, member)
            ? (wallets.data as FamilyWalletsResponse | undefined)?.wallets.find(
                  (wallet) => wallet.childMemberId === member.memberId,
              )
            : undefined;
    return (
        <div className="flex flex-wrap items-center gap-3 py-3">
            <Initials name={member.name} />
            <div>
                <p className="text-sm font-semibold">
                    <FamilyMemberLink memberId={member.memberId}>
                        {member.name}
                    </FamilyMemberLink>
                </p>
                <p className="text-xs text-muted-foreground">
                    {roleLabel(member.role, member.isGuardian, ', ')}
                </p>
            </div>
            <div className="ml-auto">
                <MoneyTotals
                    totals={totals.map((t) => ({
                        currency: t.currencyCode,
                        amount: t.amount,
                    }))}
                />
            </div>
            {wallet && (
                <Button asChild variant="ghost" size="sm">
                    <Link
                        to="/family/wallets/$walletId"
                        params={{ walletId: wallet.id }}
                    >
                        Open child wallet
                    </Link>
                </Button>
            )}
            {member.isMe && (
                <Button variant="ghost" size="sm" onClick={onManage}>
                    Manage in Personal
                </Button>
            )}
        </div>
    );
}
export function FamilyGroupList({ children }: { children: ReactNode }) {
    return (
        <GlassCard className="p-2 sm:p-3">
            <div className="divide-y divide-border dark:divide-white/[0.06]">
                {children}
            </div>
        </GlassCard>
    );
}
