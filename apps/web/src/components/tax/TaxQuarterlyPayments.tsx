import { useState } from 'react';
import { format, parseISO } from 'date-fns';
import { CheckCircle2, AlertCircle, MoreHorizontal } from 'lucide-react';
import { toast } from 'sonner';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { GlassCard } from '@/components/ui/glass';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { Money, sectionLabel, type TaxEstimate, type TaxPayment } from './shared';
const chipClass =
    'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider';
function StatusChip({ status }: { status: 'paid' | 'overdue' | 'none' }) {
    return (
        <span
            className={cn(
                chipClass,
                status === 'paid'
                    ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                    : status === 'overdue'
                      ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400'
                      : 'bg-muted dark:bg-white/[0.06] text-muted-foreground',
            )}
        >
            {status === 'paid' ? (
                <CheckCircle2 className="size-3" />
            ) : status === 'overdue' ? (
                <AlertCircle className="size-3" />
            ) : null}
            {status === 'paid' ? 'Paid' : status === 'overdue' ? 'Overdue' : 'None due'}
        </span>
    );
}
export function TaxQuarterlyPayments({
    estimate: e,
    payments,
    add,
    error,
}: {
    estimate: TaxEstimate;
    payments: TaxPayment[];
    add: (q: number, suggestedAmount: number) => void;
    error?: string;
}) {
    const [expanded, setExpanded] = useState<number | null>(null),
        utils = trpc.useUtils();
    const deletion = trpc.tax.deleteEstimatedPayment.useMutation({
        onSuccess: () => {
            void utils.tax.invalidate();
            toast.success('Payment deleted');
        },
        onError: (error: { message: string }) => toast.error(error.message),
    });
    return (
        <section className="space-y-3">
            <h2 className={sectionLabel}>Quarterly payments</h2>
            <GlassCard className="p-2 sm:p-3">
                {error && <p className="relative px-3 py-2 text-xs text-destructive">{error}</p>}
                <div className="relative divide-y divide-white/[0.06]">
                    {e.quarterlySchedule.map((q) => (
                        <div key={q.quarter}>
                            <div
                                className="flex items-center gap-3 rounded-2xl px-2.5 py-3 sm:px-3 transition-colors hover:bg-white/[0.04]"
                                role={q.paid > 0 ? 'button' : undefined}
                                tabIndex={q.paid > 0 ? 0 : undefined}
                                aria-expanded={q.paid > 0 ? expanded === q.quarter : undefined}
                                onClick={() => {
                                    if (q.paid > 0)
                                        setExpanded(expanded === q.quarter ? null : q.quarter);
                                }}
                                onKeyDown={(event) => {
                                    if (
                                        q.paid > 0 &&
                                        event.target === event.currentTarget &&
                                        ['Enter', ' '].includes(event.key)
                                    ) {
                                        event.preventDefault();
                                        setExpanded(expanded === q.quarter ? null : q.quarter);
                                    }
                                }}
                            >
                                <div className="hidden w-11 shrink-0 flex-col items-center sm:flex">
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                                        {format(parseISO(q.dueDate), 'MMM')}
                                    </span>
                                    <span className="text-lg font-bold leading-tight tabular-nums">
                                        {format(parseISO(q.dueDate), 'd')}
                                    </span>
                                </div>
                                <div className="min-w-0 flex-1">
                                    <p className="truncate text-sm font-semibold">Q{q.quarter} payment</p>
                                    <p className="mt-0.5 truncate text-xs text-muted-foreground">
                                        Due {format(parseISO(q.dueDate), 'MMM d')} · Federal
                                        {q.statePaid > 0 && (
                                            <>
                                                {' '}
                                                · State <Money amount={q.statePaid} className="pointer-events-none" />
                                            </>
                                        )}
                                    </p>
                                    {q.status === 'overdue' && (
                                        <div className="mt-1">
                                            <StatusChip status="overdue" />
                                        </div>
                                    )}
                                </div>
                                {q.status === 'none' && q.federalPaid === 0 ? (
                                    <span className="shrink-0 text-sm text-muted-foreground">—</span>
                                ) : (
                                    <div
                                        className={cn(
                                            'pointer-events-none shrink-0 text-right',
                                            q.status === 'overdue' && 'text-amber-600 dark:text-amber-400',
                                        )}
                                    >
                                        {q.status !== 'paid' && q.status !== 'none' && q.federalPaid > 0 ? (
                                            <>
                                                <Money amount={q.federalPaid} className="text-sm font-bold" />
                                                <p className="mt-0.5 text-[11px] text-muted-foreground">
                                                    of <Money amount={q.suggestedAmount} />
                                                </p>
                                            </>
                                        ) : <Money amount={q.federalPaid || q.suggestedAmount} className="text-sm font-bold" />}
                                    </div>
                                )}
                                <div className="flex w-[72px] shrink-0 justify-end">
                                    {q.status === 'due' || q.status === 'overdue' ? (
                                        <Button
                                            size="sm"
                                            className="h-8 gap-1 px-3"
                                            onClick={(event) => {
                                                event.stopPropagation();
                                                add(q.quarter, Math.max(0, q.suggestedAmount - q.federalPaid));
                                            }}
                                        >
                                            Add
                                        </Button>
                                    ) : (
                                        <StatusChip status={q.status} />
                                    )}
                                </div>
                            </div>
                            {expanded === q.quarter && (
                                <div className="space-y-2 px-3 pb-3">
                                    {payments
                                        .filter((p) => p.quarter === q.quarter)
                                        .map((p) => (
                                            <div
                                                key={p.id}
                                                className="flex items-center gap-3 rounded-xl border border-white/[0.06] bg-white/[0.03] px-3 py-2"
                                            >
                                                <div className="min-w-0 flex-1">
                                                    <p className="text-sm font-semibold">
                                                        {p.jurisdiction === 'federal' ? 'Federal' : 'State'} ·{' '}
                                                        {format(parseISO(p.paidOn), 'MMM d, yyyy')}
                                                    </p>
                                                    {p.note && (
                                                        <p className="break-words text-xs text-muted-foreground">
                                                            {p.note}
                                                        </p>
                                                    )}
                                                </div>
                                                <Money amount={p.amount} className="text-sm font-bold" />
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button
                                                            size="icon"
                                                            variant="ghost"
                                                            className="size-8"
                                                            aria-label="Payment actions"
                                                        >
                                                            <MoreHorizontal className="size-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuItem
                                                            className="text-destructive"
                                                            disabled={deletion.isLoading}
                                                            onClick={() => deletion.mutate({ id: p.id })}
                                                        >
                                                            Delete
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </div>
                                        ))}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </GlassCard>
        </section>
    );
}
