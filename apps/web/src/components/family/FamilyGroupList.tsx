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
        name: string;
        role: HouseholdRole;
        isGuardian: boolean;
        isMe: boolean;
    };
    totals?: CurrencyAmount[];
    onManage: () => void;
}) {
    return (
        <div className="flex flex-wrap items-center gap-3 py-3">
            <Initials name={member.name} />
            <div>
                <p className="text-sm font-semibold">{member.name}</p>
                <p className="text-xs text-muted-foreground">
                    {roleLabel(member.role, member.isGuardian).replace(
                        ' · ',
                        ', ',
                    )}
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
