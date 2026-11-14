import { Link } from '@tanstack/react-router';
import { Wallet } from 'lucide-react';
import { Chip, FamilyMoney, Initials, LimitBar, rowClass } from './shared';
import type { FamilyWallet } from './types';

export function WalletRow({ wallet }: { wallet: FamilyWallet }) {
    const limit = wallet.limitSummary;
    return (
        <Link
            to="/family/wallets/$walletId"
            params={{ walletId: wallet.id }}
            className={rowClass}
        >
            {wallet.kind === 'child' ? (
                <Initials name={wallet.childName ?? wallet.name} />
            ) : (
                <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-muted text-muted-foreground dark:bg-white/[0.06]">
                    <Wallet className="size-5" />
                </span>
            )}
            <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">{wallet.name}</p>
                <p className="truncate text-xs text-muted-foreground">
                    {wallet.kind === 'shared'
                        ? `Shared · ${wallet.currencyCode}`
                        : `${wallet.childName} · ${limit ? (limit.period === 'weekly' ? 'Weekly limit' : 'Monthly limit') : 'No limit'}`}
                </p>
                {limit && (
                    <div className="pointer-events-none mt-2 max-w-[220px]">
                        <LimitBar
                            spent={Number(limit.spent)}
                            limit={Number(limit.amount)}
                            size="sm"
                        />
                        <div className="mt-1 text-[11px] text-muted-foreground">
                            {Number(limit.remaining) <= 0 ? (
                                <span className="flex flex-wrap items-center gap-2">
                                    Limit reached{' '}
                                    <Chip tone="rose">Over limit</Chip>
                                </span>
                            ) : (
                                <>
                                    <FamilyMoney
                                        amount={limit.remaining}
                                        currency={wallet.currencyCode}
                                    />{' '}
                                    left this{' '}
                                    {limit.period === 'weekly'
                                        ? 'week'
                                        : 'month'}
                                </>
                            )}
                        </div>
                    </div>
                )}
            </div>
            <div className="pointer-events-none shrink-0 text-right">
                <FamilyMoney
                    amount={wallet.balance}
                    currency={wallet.currencyCode}
                    className="text-sm font-bold"
                />
            </div>
        </Link>
    );
}
