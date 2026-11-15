import { useEffect, useRef, type ReactNode } from 'react';
import { AlertCircle, AlertTriangle } from 'lucide-react';
import {
    CurrencyDisplay,
    getCurrencySymbol,
} from '@/components/CurrencyDisplay';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
export const sectionLabel =
    'text-[11px] font-bold uppercase tracking-[0.12em] text-muted-foreground';
export const sheetClass =
    'overflow-y-auto sm:max-w-[500px] max-[470px]:h-[92dvh] max-[470px]:rounded-t-2xl max-[470px]:pb-[calc(env(safe-area-inset-bottom)+1.5rem)]';
export const rowClass =
    'flex min-h-14 items-center gap-3 rounded-2xl px-2.5 py-3 sm:px-3 transition-colors hover:bg-muted/60 dark:hover:bg-white/[0.04]';

export function roleLabel(role: string, isGuardian = false, separator: ' · ' | ', ' = ' · ') {
    return role === 'owner'
        ? 'Owner'
        : role === 'child'
          ? 'Child'
          : isGuardian
            ? `Adult${separator}Guardian`
            : 'Adult';
}

export function Initials({ name }: { name: string }) {
    return (
        <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-bold text-foreground dark:bg-white/[0.08]">
            {name
                .trim()
                .split(/\s+/)
                .slice(0, 2)
                .map((part) => part[0])
                .join('')
                .toUpperCase()}
        </span>
    );
}

export function FamilyMoney({
    amount,
    currency,
    abbreviate = false,
    signed = false,
    className,
}: {
    amount: string | number;
    currency: string;
    abbreviate?: boolean;
    signed?: boolean;
    className?: string;
}) {
    const value = Number(amount);
    return (
        <span
            className={cn(
                'inline-flex items-baseline whitespace-nowrap tabular-nums',
                className,
            )}
        >
            {value < 0 ? '−' : signed && value > 0 ? '+' : ''}
            {!abbreviate && getCurrencySymbol(currency)}
            <CurrencyDisplay
                amount={Math.abs(value)}
                currency={currency}
                abbreviate={abbreviate}
            />
        </span>
    );
}

export function MoneyTotals({
    totals,
    abbreviate = false,
}: {
    totals: { currency: string; amount: number | string }[];
    abbreviate?: boolean;
}) {
    return (
        <div className="space-y-0.5">
            {totals.map((total) => (
                <div key={total.currency}>
                    <FamilyMoney {...total} abbreviate={abbreviate} />
                </div>
            ))}
        </div>
    );
}

export function LimitBar({
    spent,
    limit,
    size = 'sm',
}: {
    spent: number;
    limit: number;
    size?: 'sm' | 'md';
}) {
    const ratio = limit > 0 ? spent / limit : 0;
    return (
        <div
            role="progressbar"
            aria-label="Spending limit"
            aria-valuenow={spent}
            aria-valuemax={limit}
            className={cn(
                'w-full overflow-hidden rounded-full bg-muted dark:bg-white/[0.08]',
                size === 'sm' ? 'h-1' : 'h-1.5',
            )}
        >
            <div
                className={cn(
                    'h-full',
                    ratio >= 1
                        ? 'bg-rose-500'
                        : ratio >= 0.8
                          ? 'bg-amber-700 dark:bg-amber-500'
                          : 'bg-primary',
                )}
                style={{ width: `${Math.max(0, Math.min(100, ratio * 100))}%` }}
            />
        </div>
    );
}

export function Chip({
    children,
    tone = 'neutral',
}: {
    children: ReactNode;
    tone?: 'neutral' | 'amber' | 'rose';
}) {
    return (
        <span
            className={cn(
                'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider',
                {
                    neutral:
                        'bg-muted text-muted-foreground dark:bg-white/[0.06]',
                    amber: 'bg-amber-500/15 text-amber-800 dark:text-amber-300',
                    rose: 'bg-rose-500/15 text-rose-700 dark:text-rose-400',
                }[tone],
            )}
        >
            {children}
        </span>
    );
}

export function Notice({
    tone,
    children,
}: {
    tone: 'warning' | 'error' | 'info';
    children: ReactNode;
}) {
    const Icon =
        tone === 'warning'
            ? AlertTriangle
            : tone === 'error'
              ? AlertCircle
              : null;
    return (
        <div
            role={tone === 'error' ? 'alert' : undefined}
            className={cn(
                'flex gap-2 rounded-xl border px-3 py-2.5 text-xs',
                {
                    warning:
                        'border-amber-500/30 bg-amber-500/10 text-amber-800 dark:text-amber-300',
                    error: 'border-red-500/30 bg-red-500/10 text-red-700 dark:text-red-300',
                    info: 'border-border bg-muted/50 text-muted-foreground dark:border-white/10 dark:bg-white/[0.03]',
                }[tone],
            )}
        >
            {Icon && <Icon className="size-4 shrink-0 mt-px" />}
            {children}
        </div>
    );
}

export function InlineConfirm({
    message,
    confirmLabel,
    onConfirm,
    onCancel,
    pending,
    pendingLabel = 'Removing...',
}: {
    message: string;
    confirmLabel: string;
    onConfirm: () => void;
    onCancel: () => void;
    pending?: boolean;
    pendingLabel?: string;
}) {
    const cancel = useRef<HTMLButtonElement>(null);
    useEffect(() => {
        cancel.current?.focus();
    }, []);
    return (
        <div
            className="rounded-xl border border-red-500/30 bg-red-500/[0.06] p-3"
            onKeyDown={(event) => {
                if (event.key === 'Escape') {
                    event.stopPropagation();
                    onCancel();
                }
            }}
        >
            <p className="text-sm">{message}</p>
            <div className="mt-3 grid grid-cols-2 gap-2 sm:flex sm:justify-end">
                <Button
                    type="button"
                    ref={cancel}
                    className="h-10"
                    variant="outline"
                    onClick={onCancel}
                    disabled={pending}
                >
                    Cancel
                </Button>
                <Button
                    type="button"
                    className="h-10"
                    variant="destructive"
                    onClick={onConfirm}
                    disabled={pending}
                >
                    {pending ? pendingLabel : confirmLabel}
                </Button>
            </div>
        </div>
    );
}

export const staticRowClass = rowClass.split(' transition-colors')[0];
