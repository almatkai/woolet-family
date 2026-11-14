import { addDays, format, parseISO } from 'date-fns';
import { Button } from '@/components/ui/button';
import { GlassCard } from '@/components/ui/glass';
import { FamilyMoney, LimitBar, sectionLabel } from './shared';
import type { FamilyLimit } from './types';

export const limitDates = (limit: FamilyLimit) =>
    `${format(parseISO(limit.periodStart), 'MMM d')} – ${format(parseISO(limit.periodEnd), 'MMM d')}`;
export function LimitsCard({
    limits,
    currency,
    canManage,
    onEdit,
}: {
    limits: FamilyLimit[];
    currency: string;
    canManage: boolean;
    onEdit: () => void;
}) {
    const totals = limits
        .filter((l) => l.categoryId === null)
        .sort((a, b) => Number(a.remaining) - Number(b.remaining));
    const total = totals[0];
    const money = (amount: string) => (
        <FamilyMoney amount={amount} currency={currency} />
    );
    return (
        <GlassCard className="p-5">
            <h2 className={sectionLabel}>
                {total
                    ? `${total.period === 'weekly' ? 'Weekly' : 'Monthly'} limit`
                    : limits.length
                      ? 'Category spending limits'
                      : 'No spending limit'}
            </h2>
            {total ? (
                <>
                    <LimitSummary total={total} currency={currency} />
                </>
            ) : (
                canManage && limits.length === 0 && (
                    <p className="mt-2 text-xs text-muted-foreground">
                        Expenses aren't capped for this wallet.
                    </p>
                )
            )}
            {limits.some((l) => l.categoryId) && (
                <div className="mt-4 space-y-3">
                    {limits
                        .filter((l) => l.categoryId)
                        .map((l) => (
                            <div key={l.id}>
                                <div className="mb-2 flex items-center justify-between gap-3 text-sm">
                                    <span className="min-w-0 truncate">
                                        {l.categoryName} ·{' '}
                                        {l.period === 'weekly'
                                            ? 'Weekly'
                                            : 'Monthly'}
                                    </span>
                                    <span className="shrink-0">
                                        {money(l.spent)} of {money(l.amount)}
                                    </span>
                                </div>
                                <LimitBar
                                    spent={Number(l.spent)}
                                    limit={Number(l.amount)}
                                    size="sm"
                                />
                            </div>
                        ))}
                </div>
            )}
            {canManage && (
                <Button
                    size="sm"
                    variant="outline"
                    className="mt-4"
                    onClick={onEdit}
                >
                    {limits.length ? 'Edit limits' : 'Set a limit'}
                </Button>
            )}
        </GlassCard>
    );
}

export function LimitSummary({
    total,
    currency,
    reset = false,
}: {
    total: FamilyLimit;
    currency: string;
    reset?: boolean;
}) {
    const money = (amount: string) => (
        <FamilyMoney amount={amount} currency={currency} />
    );
    return (
        <>
            <p
                className={`mt-2 text-base font-semibold ${Number(total.remaining) <= 0 ? 'text-rose-700 dark:text-rose-400' : ''}`}
            >
                {Number(total.remaining) <= 0 ? (
                    'Limit reached'
                ) : (
                    <>
                        {money(total.remaining)} left
                        {reset
                            ? ` this ${total.period === 'weekly' ? 'week' : 'month'}`
                            : ''}
                    </>
                )}
            </p>
            <div className="mt-3">
                <LimitBar
                    spent={Number(total.spent)}
                    limit={Number(total.amount)}
                    size="md"
                />
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
                Spent {money(total.spent)} of {money(total.amount)} ·{' '}
                {reset
                    ? `Resets ${format(addDays(parseISO(total.periodEnd), 1), 'EEE, MMM d')}`
                    : limitDates(total)}
            </p>
        </>
    );
}
