import { useId, useState } from 'react';
import { toast } from 'sonner';
import { trpc } from '@/lib/trpc';
import { GlassCard } from '@/components/ui/glass';
import { Switch } from '@/components/ui/switch';
import { sectionLabel } from './shared';
import { familyPermissions } from './permissions';
import type { HouseholdOverview } from './types';

export function FamilyPrivacy({
    family,
}: {
    family: NonNullable<HouseholdOverview>;
}) {
    const id = useId();
    const utils = trpc.useContext();
    const [sharedOverride, setShared] = useState<boolean | null>(null);
    const [balanceOverride, setBalance] = useState<boolean | null>(null);
    const shared =
        sharedOverride ?? family.household.childrenCanSeeSharedWallets;
    const balance = balanceOverride ?? family.me.showBalanceToChildren;
    const update = trpc.household.update.useMutation();
    const personal = trpc.household.setShowBalanceToChildren.useMutation();
    async function save(kind: 'shared' | 'balance', value: boolean) {
        const setter = kind === 'shared' ? setShared : setBalance;
        setter(value);
        try {
            if (kind === 'shared')
                await update.mutateAsync({
                    childrenCanSeeSharedWallets: value,
                });
            else await personal.mutateAsync({ value });
            await utils.household.get.invalidate();
        } catch (error) {
            toast.error(
                error instanceof Error
                    ? error.message
                    : "Couldn't save privacy settings",
            );
        } finally {
            setter(null);
        }
    }
    const owner = familyPermissions(family.me).isOwner;
    const list = [
        'their own wallets',
        ...(shared ? ['shared wallet balances'] : []),
        ...(balance ? ['your balance totals'] : []),
    ];
    return (
        <section className="space-y-3">
            <h2 className={sectionLabel}>What children can see</h2>
            <GlassCard className="divide-y divide-border dark:divide-white/[0.06]">
                <p className="px-4 py-3.5 text-xs text-muted-foreground">
                    Children always see their own wallets: balance, transactions
                    and limits. Nothing else unless you turn it on below.
                </p>
                {(
                    [
                        {
                            key: 'shared',
                            title: 'Children can see shared wallets',
                            description:
                                "They see each shared wallet's name and balance. Not its transactions.",
                            value: shared,
                            editable: owner,
                            pending: update.isLoading,
                        },
                        {
                            key: 'balance',
                            title: 'Show my balance to children',
                            description:
                                'They see your total balance in each currency, for example $1,240 · €850. Not your accounts, banks or transactions.',
                            value: balance,
                            editable: true,
                            pending: personal.isLoading,
                        },
                    ] as const
                ).map((row) => (
                    <div
                        key={row.key}
                        className={`flex min-h-14 items-center gap-3 px-4 py-3.5 ${row.editable ? 'cursor-pointer' : ''}`}
                        onClick={
                            row.editable
                                ? (event) => {
                                      if (
                                          !(
                                              event.target as HTMLElement
                                          ).closest('button') &&
                                          !row.pending
                                      )
                                          void save(row.key, !row.value);
                                  }
                                : undefined
                        }
                    >
                        <span className="min-w-0 flex-1">
                            <span className="block text-sm font-medium">
                                {row.title}
                            </span>
                            <span
                                id={`${id}-${row.key}`}
                                className="block text-xs text-muted-foreground"
                            >
                                {row.description}
                                {!row.editable &&
                                    ' Only the owner can change this.'}
                            </span>
                        </span>
                        {row.editable ? (
                            <Switch
                                aria-label={row.title}
                                aria-describedby={`${id}-${row.key}`}
                                checked={row.value}
                                disabled={row.pending}
                                onCheckedChange={(value: boolean) =>
                                    void save(row.key, value)
                                }
                            />
                        ) : (
                            <span className="text-xs font-medium">
                                {row.value ? 'On' : 'Off'}
                            </span>
                        )}
                    </div>
                ))}
            </GlassCard>
            <p className="text-xs text-muted-foreground">
                Right now children see:{' '}
                {list.length === 1
                    ? list[0]
                    : `${list.slice(0, -1).join(', ')} and ${list.at(-1)}`}
                .<br />
                Adults in the family see each other's accounts, spending, loans, investments and taxes. Each person changes only their own.
            </p>
        </section>
    );
}
