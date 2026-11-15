import { FamilyMemberLink } from './FamilyMemberLink';
import { Link } from '@tanstack/react-router';
import { Receipt } from 'lucide-react';
import { FamilyMoney, rowClass } from './shared';
import type { FamilyLedgerItem } from './types';
export function FamilyLedgerRows({ items }: { items: FamilyLedgerItem[] }) {
    return (
        <div className="divide-y divide-border dark:divide-white/[0.06]">
            {items.map(
                (t: FamilyLedgerItem, i: number, rows: FamilyLedgerItem[]) => {
                    const content = (
                        <>
                            <span className="size-9 rounded-full bg-muted flex shrink-0 items-center justify-center">
                                <Receipt className="size-4" />
                            </span>
                            <div className="min-w-0 flex-1">
                                <p className="text-sm font-medium truncate">
                                    {t.description ||
                                        t.categoryName ||
                                        'Uncategorised'}
                                </p>
                                <p className="text-xs text-muted-foreground flex gap-x-2 min-w-0">
                                    <span className="text-foreground/80">
                                        <FamilyMemberLink
                                            memberId={t.spender?.memberId}
                                        >
                                            {t.spender?.isMe
                                                ? 'You'
                                                : (t.spender?.name ??
                                                  'Unassigned')}
                                        </FamilyMemberLink>
                                    </span>
                                    <span className="truncate">
                                        {t.place.kind === 'wallet'
                                            ? t.place.walletName
                                            : t.place.accountName}
                                    </span>
                                </p>
                                {t.author &&
                                    t.author.memberId !==
                                        t.spender?.memberId && (
                                        <p className="text-xs text-muted-foreground truncate">
                                            Added by{' '}
                                            <FamilyMemberLink
                                                memberId={t.author.memberId}
                                            >
                                                {t.author.name}
                                            </FamilyMemberLink>
                                        </p>
                                    )}
                            </div>
                            <span
                                className={`pointer-events-none shrink-0 text-sm ${t.kind === 'income' ? 'text-emerald-700 dark:text-emerald-400' : ''}`}
                            >
                                {t.kind === 'expense' ? '−' : '+'}
                                <FamilyMoney
                                    amount={t.amount}
                                    currency={t.currencyCode}
                                />
                            </span>
                        </>
                    );
                    return (
                        <div key={t.id}>
                            {(i === 0 || rows[i - 1].date !== t.date) && (
                                <h3 className="px-3 pt-3 text-xs text-muted-foreground">
                                    {t.date}
                                </h3>
                            )}
                            <div className={rowClass}>
                                {content}
                                {t.place.kind === 'wallet' && (
                                    <Link
                                        className="text-xs underline"
                                        to="/family/wallets/$walletId"
                                        params={{ walletId: t.place.walletId }}
                                    >
                                        Open wallet
                                    </Link>
                                )}
                            </div>
                        </div>
                    );
                },
            )}
        </div>
    );
}
