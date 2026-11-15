import { Link } from '@tanstack/react-router';
import { GlassCard } from '@/components/ui/glass';
import { Skeleton } from '@/components/ui/skeleton';
import {
    FamilyMoney,
    Initials,
    roleLabel,
    rowClass,
    sectionLabel,
} from './shared';
import type { HouseholdOverview, HouseholdOverviewOutput } from './types';

export function FamilyWhoSpent({
    overview,
    members,
    memberTotal,
    monthName,
    search,
    update,
    currency,
    family,
}: {
    search: {
        member?: string;
        category?: string;
        day?: string;
        currency?: string;
    };
    update: (patch: {
        member?: string;
        category?: string;
        day?: string;
    }) => void;
    overview: HouseholdOverviewOutput | undefined;
    members: HouseholdOverviewOutput['converted']['members'];
    memberTotal: number;
    monthName: string;
    currency: string;
    family: NonNullable<HouseholdOverview>;
}) {
    return (
        <>
            <h2 className={sectionLabel}>Who spent what</h2>
            {!overview ? (
                <div className="space-y-2">
                    {[0, 1, 2].map((n) => (
                        <Skeleton key={n} className="h-14 rounded-2xl" />
                    ))}
                </div>
            ) : (
                <GlassCard className="p-2 sm:p-3">
                    <div className="divide-y divide-border dark:divide-white/[0.06]">
                        {!members.length && (
                            <p className="p-3 text-sm text-muted-foreground">
                                No spending in {monthName} yet.
                            </p>
                        )}
                        {members.map((m) => {
                            const detail = overview.members.find(
                                (d) => d.memberId === m.memberId,
                            );
                            const amount = Number(m.totals[0]?.amount ?? 0);
                            const percent =
                                memberTotal > 0
                                    ? Math.round((amount / memberTotal) * 100)
                                    : 0;
                            return (
                                <button
                                    type="button"
                                    aria-pressed={
                                        !!m.memberId &&
                                        search.member === m.memberId
                                    }
                                    disabled={!m.memberId}
                                    onClick={() =>
                                        update({
                                            member:
                                                search.member === m.memberId
                                                    ? undefined
                                                    : (m.memberId ?? undefined),
                                        })
                                    }
                                    key={m.memberId ?? m.status}
                                    className={`${rowClass} w-full text-left ${search.member === m.memberId ? 'bg-muted dark:bg-white/[0.06]' : ''}`}
                                >
                                    <Initials name={m.name} />
                                    <div className="min-w-0 flex-1">
                                        <p
                                            className={`text-sm truncate ${search.member === m.memberId ? 'font-bold' : 'font-medium'}`}
                                        >
                                            {m.name}
                                            {detail?.isMe && (
                                                <span className="text-muted-foreground">
                                                    {' '}
                                                    (you)
                                                </span>
                                            )}
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                            {detail
                                                ? `${roleLabel(detail.role, detail.isGuardian)}  ${detail.expenseCount} purchases`
                                                : m.status === 'former'
                                                  ? 'Former member'
                                                  : 'Unassigned'}
                                        </p>
                                        <div className="mt-2 h-1.5 rounded-full bg-muted dark:bg-white/[0.08]">
                                            <div
                                                className="h-full rounded-full bg-foreground/70"
                                                style={{
                                                    width: `${Math.min(100, percent)}%`,
                                                }}
                                            />
                                        </div>
                                    </div>
                                    <div className="pointer-events-none text-right text-sm">
                                        <FamilyMoney
                                            amount={amount}
                                            currency={currency}
                                        />
                                        <p className="text-xs text-muted-foreground">
                                            {percent}%
                                        </p>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                    {family.members.length === 1 && (
                        <p className="p-3 text-xs text-muted-foreground">
                            Only you so far.{' '}
                            {family.me.canManageMembers && (
                                <Link to="/family">Invite</Link>
                            )}
                        </p>
                    )}
                </GlassCard>
            )}
        </>
    );
}
