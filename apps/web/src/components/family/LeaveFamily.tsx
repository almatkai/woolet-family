import { useState } from 'react';
import { toast } from 'sonner';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Notice, InlineConfirm } from './shared';
import { GlassCard } from '@/components/ui/glass';
import { familyPermissions } from './permissions';
import type { HouseholdOverview } from './types';
export function LeaveFamily({
    family,
}: {
    family: NonNullable<HouseholdOverview>;
}) {
    const [confirm, setConfirm] = useState(false);
    const utils = trpc.useContext();
    const owner = familyPermissions(family.me).isOwner;
    const mutation = trpc.household.leave.useMutation({
        onSuccess: () => {
            void utils.household.invalidate();
            toast.success(
                owner ? 'Family deleted' : `You left ${family.household.name}`,
            );
        },
    });
    if (owner && family.activeMembers > 1)
        return (
            <GlassCard className="p-4">
                <p className="text-sm text-muted-foreground">
                    You're the owner. Remove the other members before you leave.
                </p>
            </GlassCard>
        );
    return (
        <GlassCard className="flex flex-col gap-3 p-4 sm:flex-row sm:flex-wrap sm:items-center">
            <div className="flex-1">
                <h2 className="text-sm font-semibold">
                    {owner ? 'Delete family' : 'Leave family'}
                </h2>
                {!owner && (
                    <p className="text-xs text-muted-foreground">
                        You'll lose access to family wallets. Your personal
                        accounts aren't affected.
                    </p>
                )}
                {mutation.error && (
                    <Notice tone="error">{mutation.error.message}</Notice>
                )}
            </div>
            {confirm ? (
                <div className="w-full">
                    <InlineConfirm
                        message={
                            owner
                                ? `Delete ${family.household.name}? Its wallets and transactions are deleted. This can't be undone.`
                                : `Leave ${family.household.name}? To come back you'll need a new invite.`
                        }
                        confirmLabel={owner ? 'Delete family' : 'Leave family'}
                        pendingLabel={owner ? 'Deleting...' : 'Leaving...'}
                        pending={mutation.isLoading}
                        onCancel={() => setConfirm(false)}
                        onConfirm={() => mutation.mutate()}
                    />
                </div>
            ) : (
                <Button
                    variant="outline"
                    className="text-red-700 dark:text-red-400"
                    onClick={() => setConfirm(true)}
                >
                    {owner ? 'Delete family' : 'Leave'}
                </Button>
            )}
        </GlassCard>
    );
}
