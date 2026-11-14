import { useState } from 'react';
import { format, isToday, isYesterday, parseISO } from 'date-fns';
import {
    ArrowDownLeft,
    ArrowUpRight,
    ArrowLeftRight,
    MoreHorizontal,
} from 'lucide-react';
import { toast } from 'sonner';
import { trpc } from '@/lib/trpc';
import { GlassCard } from '@/components/ui/glass';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
    DropdownMenu,
    DropdownMenuTrigger,
    DropdownMenuContent,
    DropdownMenuItem,
} from '@/components/ui/dropdown-menu';
import { FamilyMoney, InlineConfirm, rowClass, sectionLabel } from './shared';
import type {
    FamilyWallet,
    FamilyTransactionsPage,
    FamilyTransaction,
} from './types';

export function TransactionList({
    wallet,
    limit,
}: {
    wallet: FamilyWallet;
    limit?: number;
}) {
    const utils = trpc.useContext();
    const [confirm, setConfirm] = useState<string | null>(null);
    const query = trpc.household.walletTransactions.useInfiniteQuery(
        { walletId: wallet.id, limit: limit ?? 30 },
        {
            getNextPageParam: (page: FamilyTransactionsPage) =>
                page.nextCursor ?? undefined,
        },
    );
    const remove = trpc.household.deleteTransaction.useMutation({
        onSuccess: () => {
            setConfirm(null);
            void utils.household.invalidate();
            toast.success('Transaction deleted');
        },
        onError: (error: { message: string }) => toast.error(error.message),
    });
    if (query.isLoading)
        return (
            <div className="space-y-3">
                {[0, 1, 2].map((i) => (
                    <div key={i} className="flex items-center gap-3 p-3">
                        <Skeleton className="size-10 rounded-full" />
                        <div className="flex-1 space-y-2">
                            <Skeleton className="h-4 w-32" />
                            <Skeleton className="h-3 w-24" />
                        </div>
                        <Skeleton className="h-4 w-16" />
                    </div>
                ))}
            </div>
        );
    if (query.error)
        return (
            <GlassCard className="space-y-3 p-5">
                <p className="text-sm text-destructive">
                    {query.error.message}
                </p>
                <Button variant="outline" onClick={() => void query.refetch()}>
                    Try again
                </Button>
            </GlassCard>
        );
    const items =
        (query.data?.pages as FamilyTransactionsPage[] | undefined)?.flatMap(
            (page) => page.items,
        ) ?? [];
    const groups = new Map<string, FamilyTransaction[]>();
    items
        .slice(0, limit)
        .forEach((item) =>
            groups.set(item.date, [...(groups.get(item.date) ?? []), item]),
        );
    return (
        <GlassCard className="p-2 sm:p-3">
            {!items.length ? (
                <div className="space-y-2 py-10 text-center">
                    <p className="text-sm font-semibold">No transactions yet</p>
                    <p className="text-xs text-muted-foreground">
                        Income, expenses and transfers in this wallet will show
                        up here.
                    </p>
                </div>
            ) : (
                [...groups].map(([date, rows]) => {
                    const parsed = parseISO(date);
                    return (
                        <div key={date}>
                            <h3 className={`${sectionLabel} px-3 pb-1 pt-3`}>
                                {isToday(parsed)
                                    ? 'Today'
                                    : isYesterday(parsed)
                                      ? 'Yesterday'
                                      : format(
                                            parsed,
                                            parsed.getFullYear() ===
                                                new Date().getFullYear()
                                                ? 'MMM d'
                                                : 'MMM d, yyyy',
                                        )}
                            </h3>
                            {rows.map((item) => {
                                const incoming =
                                    item.type === 'income' ||
                                    item.type === 'transfer_in';
                                const transfer =
                                    item.type.startsWith('transfer');
                                const Icon = transfer
                                    ? ArrowLeftRight
                                    : incoming
                                      ? ArrowDownLeft
                                      : ArrowUpRight;
                                const transferLabel = item.counterpartWalletName
                                    ? `${incoming ? 'Top-up from' : 'Transfer to'} ${item.counterpartWalletName}`
                                    : incoming
                                      ? 'Top-up from family'
                                      : 'Moved to family';
                                const type = transfer ? 'transfer' : item.type;
                                return confirm === item.id ? (
                                    <InlineConfirm
                                        key={item.id}
                                        message={`Delete this ${type}? The balance will be updated.`}
                                        confirmLabel="Delete"
                                        pendingLabel="Deleting..."
                                        pending={remove.isLoading}
                                        onCancel={() => setConfirm(null)}
                                        onConfirm={() =>
                                            remove.mutate({
                                                transactionId: item.id,
                                            })
                                        }
                                    />
                                ) : (
                                    <div key={item.id} className={rowClass}>
                                        <span
                                            className={`flex size-10 shrink-0 items-center justify-center rounded-xl ${item.type === 'income' ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400' : 'bg-muted text-muted-foreground dark:bg-white/[0.06]'}`}
                                        >
                                            <Icon className="size-5" />
                                        </span>
                                        <div className="min-w-0 flex-1">
                                            <p className="truncate text-sm font-semibold">
                                                {item.description ||
                                                    item.categoryName ||
                                                    (transfer
                                                        ? transferLabel
                                                        : incoming
                                                          ? 'Income'
                                                          : 'Expense')}
                                            </p>
                                            <p className="truncate text-xs text-muted-foreground">
                                                {transfer
                                                    ? [
                                                          item.description
                                                              ? transferLabel
                                                              : null,
                                                          item.createdByName?.split(
                                                              ' ',
                                                          )[0],
                                                      ]
                                                          .filter(Boolean)
                                                          .join(' · ')
                                                    : [
                                                          item.categoryName,
                                                          item.createdByName?.split(
                                                              ' ',
                                                          )[0],
                                                      ]
                                                          .filter(Boolean)
                                                          .join(' · ')}
                                            </p>
                                        </div>
                                        <FamilyMoney
                                            currency={wallet.currencyCode}
                                            amount={
                                                incoming
                                                    ? Math.abs(
                                                          Number(item.amount),
                                                      )
                                                    : -Math.abs(
                                                          Number(item.amount),
                                                      )
                                            }
                                            signed={incoming}
                                            className={`pointer-events-none shrink-0 text-sm font-bold ${item.type === 'income' ? 'text-emerald-700 dark:text-emerald-400' : 'text-foreground'}`}
                                        />
                                        {wallet.canDeleteTransactions && (
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button
                                                        size="icon"
                                                        variant="ghost"
                                                        className="size-10 shrink-0"
                                                        aria-label="Transaction actions"
                                                    >
                                                        <MoreHorizontal className="size-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem
                                                        onSelect={() =>
                                                            setConfirm(item.id)
                                                        }
                                                    >
                                                        Delete
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    );
                })
            )}
            {!limit && query.hasNextPage && (
                <Button
                    variant="ghost"
                    className="w-full"
                    disabled={query.isFetchingNextPage}
                    onClick={() => void query.fetchNextPage()}
                >
                    {query.isFetchingNextPage ? 'Loading...' : 'Show more'}
                </Button>
            )}
        </GlassCard>
    );
}
