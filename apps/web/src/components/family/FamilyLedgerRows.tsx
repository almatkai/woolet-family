import { Link } from '@tanstack/react-router';
import { Receipt } from 'lucide-react';
import { formatDay } from './formatDay';
import { FamilyMoney, rowClass, staticRowClass } from './shared';
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
                                        <>
                                            {t.spender?.isMe
                                                ? 'You'
                                                : (t.spender?.name ??
                                                  'Unassigned')}
                                        </>
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
                                            Added by <>{t.author.name}</>
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
                                    {formatDay(t.date, true)}
                                </h3>
                            )}
                            {t.place.kind === 'wallet' ? (
                                <Link
                                    className={rowClass}
                                    to="/family/wallets/$walletId"
                                    params={{ walletId: t.place.walletId }}
                                >
                                    {content}
                                </Link>
                            ) : (
                                <div className={staticRowClass}>{content}</div>
                            )}
                        </div>
                    );
                },
            )}
        </div>
    );
}
