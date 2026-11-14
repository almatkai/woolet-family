import { Wallet } from 'lucide-react';
import { GlassCard } from '@/components/ui/glass';
import { Button } from '@/components/ui/button';
import { sectionLabel } from './shared';
import { WalletRow } from './WalletRow';
import type { FamilyWalletsResponse } from './types';

export function FamilyWallets({
    data,
    canManage,
    onCreate,
}: {
    data: FamilyWalletsResponse | undefined;
    canManage: boolean;
    onCreate: () => void;
}) {
    return (
        <div className="space-y-4">
            {(
                ['shared', ...(canManage ? ['child'] : [])] as (
                    'shared' | 'child'
                )[]
            ).map((kind) => {
                const wallets =
                    data?.wallets.filter((wallet) => wallet.kind === kind) ??
                    [];
                return (
                    <section key={kind} className="space-y-3">
                        <h2 className={sectionLabel}>
                            {kind === 'shared'
                                ? 'Shared wallets'
                                : "Children's wallets"}
                        </h2>
                        <GlassCard className="p-2 sm:p-3">
                            {wallets.length ? (
                                <div className="divide-y divide-border dark:divide-white/[0.06]">
                                    {wallets.map((wallet) => (
                                        <WalletRow
                                            key={wallet.id}
                                            wallet={wallet}
                                        />
                                    ))}
                                </div>
                            ) : (
                                <div className="flex flex-col items-center gap-2 px-3 py-10 text-center">
                                    <span className="flex size-12 items-center justify-center rounded-2xl bg-muted text-muted-foreground dark:bg-white/[0.06]">
                                        <Wallet className="size-6" />
                                    </span>
                                    <p className="text-sm font-semibold">
                                        {kind === 'shared'
                                            ? 'No shared wallets'
                                            : "No children's wallets"}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                        {kind === 'shared'
                                            ? 'Add one for groceries, rent or other household spending.'
                                            : 'Invite a child, then give them a wallet with a weekly or monthly limit.'}
                                    </p>
                                    {canManage && (
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={onCreate}
                                        >
                                            New wallet
                                        </Button>
                                    )}
                                </div>
                            )}
                        </GlassCard>
                    </section>
                );
            })}
        </div>
    );
}
