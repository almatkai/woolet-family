import {
    Notice,
    InlineConfirm,
    Initials,
    roleLabel,
    rowClass,
    staticRowClass,
    sectionLabel,
    Chip,
} from './shared';
import { format } from 'date-fns';
import { isFull } from './permissions';
import { useEffect, useState } from 'react';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';

import { Plus, MoreHorizontal } from 'lucide-react';
import { GlassCard } from '@/components/ui/glass';
import { Skeleton } from '@/components/ui/skeleton';

import { familyPermissions } from './permissions';
import { MemberSheet } from './MemberSheet';
import type {
    HouseholdOverview,
    HouseholdMember,
    PendingInvitation,
} from './types';
export function FamilyMembers({
    family,
    onInvite,
    readOnly = false,
}: {
    family: NonNullable<HouseholdOverview>;
    onInvite: () => void;
    readOnly?: boolean;
}) {
    const owner = familyPermissions(family.me).canManageMembers && !readOnly;
    const [now, setNow] = useState(Date.now);
    useEffect(() => {
        const timer = setInterval(() => setNow(Date.now()), 60_000);
        return () => clearInterval(timer);
    }, []);
    const utils = trpc.useContext();
    const query = trpc.household.invitations.useQuery(undefined, {
        enabled: owner,
    });
    const invites = (query.data ?? []) as PendingInvitation[];
    const [member, setMember] = useState<HouseholdMember | null>(null);
    const [menu, setMenu] = useState<string | null>(null);
    const [confirm, setConfirm] = useState<string | null>(null);
    const revoke = trpc.household.revokeInvitation.useMutation({
        onSuccess: () => {
            setConfirm(null);
            void utils.household.get.invalidate();
            void utils.household.invitations.invalidate();
        },
    });
    return (
        <section className="space-y-3">
            <h2 className={sectionLabel}>
                Members · {family.activeMembers} of {family.maxMembers}
            </h2>
            <GlassCard className="p-2 sm:p-3">
                <div className="divide-y divide-border dark:divide-white/[0.06]">
                    {family.members.map((item) => {
                        const content = (
                            <>
                                <Initials name={item.name} />
                                <div className="min-w-0 text-left">
                                    <p className="truncate text-sm font-semibold">
                                        {item.name}
                                        {item.id === family.me.id && (
                                            <span className="font-normal text-muted-foreground">
                                                {' '}
                                                (you)
                                            </span>
                                        )}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                        {roleLabel(item.role, item.isGuardian)}
                                    </p>
                                </div>
                            </>
                        );
                        return owner && item.id !== family.me.id ? (
                            <button
                                key={item.id}
                                className={`${rowClass} w-full`}
                                aria-label={`Manage ${item.name}`}
                                onClick={() => setMember(item)}
                            >
                                {content}
                            </button>
                        ) : (
                            <div key={item.id} className={staticRowClass}>
                                {content}
                            </div>
                        );
                    })}
                </div>
                {owner && (
                    <>
                        {invites.length > 0 && (
                            <h3 className={`${sectionLabel} px-3 pb-1 pt-4`}>
                                Pending invites
                            </h3>
                        )}
                        {query.isLoading ? (
                            <Skeleton className="h-14" />
                        ) : query.error ? (
                            <div className="space-y-2 p-3">
                                <Notice tone="error">
                                    {query.error.message}
                                </Notice>
                                <Button
                                    variant="outline"
                                    onClick={() => void query.refetch()}
                                >
                                    Try again
                                </Button>
                            </div>
                        ) : (
                            invites.map((invite) => (
                                <div key={invite.id} className="py-1">
                                    {confirm === invite.id ? (
                                        <InlineConfirm
                                            message={`Revoke the invite for ${invite.emailNormalized}? The link will stop working.`}
                                            confirmLabel="Revoke"
                                            pendingLabel="Revoking..."
                                            pending={revoke.isLoading}
                                            onCancel={() => setConfirm(null)}
                                            onConfirm={() =>
                                                revoke.mutate({
                                                    invitationId: invite.id,
                                                })
                                            }
                                        />
                                    ) : (
                                        <div className={staticRowClass}>
                                            <div className="min-w-0 flex-1">
                                                <p className="truncate text-sm font-semibold">
                                                    {invite.emailNormalized}
                                                </p>
                                                <p className="text-xs text-muted-foreground">
                                                    {roleLabel(
                                                        invite.role,
                                                        invite.isGuardian,
                                                    )}{' '}
                                                    · Expires{' '}
                                                    {format(
                                                        new Date(
                                                            invite.expiresAt,
                                                        ),
                                                        'MMM d',
                                                    )}
                                                </p>
                                                {Date.parse(invite.expiresAt) <
                                                    now && (
                                                    <Chip>Expired</Chip>
                                                )}
                                            </div>
                                            {menu === invite.id ? (
                                                <Button
                                                    variant="ghost"
                                                    onClick={() =>
                                                        setConfirm(invite.id)
                                                    }
                                                >
                                                    Revoke
                                                </Button>
                                            ) : (
                                                <Button
                                                    size="icon"
                                                    variant="ghost"
                                                    className="size-10"
                                                    aria-label={`Invite actions for ${invite.emailNormalized}`}
                                                    onClick={() =>
                                                        setMenu(invite.id)
                                                    }
                                                >
                                                    <MoreHorizontal className="size-4" />
                                                </Button>
                                            )}
                                        </div>
                                    )}
                                </div>
                            ))
                        )}
                        {revoke.error && (
                            <Notice tone="error">{revoke.error.message}</Notice>
                        )}
                        {!isFull(family) ? (
                            <Button
                                variant="ghost"
                                className="h-11 w-full justify-start"
                                onClick={onInvite}
                            >
                                <Plus className="size-4" />
                                Invite member
                            </Button>
                        ) : (
                            <p className="px-3 py-2 text-xs text-muted-foreground">
                                Your family is full. Remove a member to invite
                                someone else.
                            </p>
                        )}
                    </>
                )}
            </GlassCard>
            {member && (
                <MemberSheet
                    key={member.id}
                    member={member}
                    onClose={() => setMember(null)}
                />
            )}
        </section>
    );
}
