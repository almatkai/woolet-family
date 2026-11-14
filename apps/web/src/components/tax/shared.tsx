import { CurrencyDisplay } from '@/components/CurrencyDisplay';
import { cn } from '@/lib/utils';
import type { TaxProfile } from '../../../../api/src/lib/tax/input';
import type { estimateTax } from '../../../../api/src/lib/tax/estimate';
import type { StateTable } from '../../../../api/src/lib/tax/states';
export type { TaxProfile, StateTable };
export type TaxEstimate = ReturnType<typeof estimateTax>;
export type TaxPayment = {
    id: string;
    taxYear: number;
    jurisdiction: 'federal' | 'state';
    quarter: number;
    amount: string;
    paidOn: string;
    note: string | null;
    transactionId: string | null;
};
export type TransactionIncome = {
    wageYtd: number;
    selfEmploymentYtd: number;
    wageProjected: number;
    selfEmploymentProjected: number;
};
export const sectionLabel = 'text-[11px] font-bold uppercase tracking-[0.12em] text-muted-foreground';
export const sheetClass =
    'overflow-y-auto sm:max-w-[500px] max-[470px]:h-[92dvh] max-[470px]:rounded-t-2xl max-[470px]:pb-[calc(env(safe-area-inset-bottom)+1.5rem)]';
export function Money({
    amount,
    className = '',
    abbreviate = false,
}: {
    amount: number | string;
    className?: string;
    abbreviate?: boolean;
}) {
    const n = Number(amount);
    if (!abbreviate) {
        return (
            <span className={cn('inline-flex items-baseline tabular-nums', className)}>
                {n < 0 && '−'}<span className="font-medium leading-none">$</span><CurrencyDisplay amount={Math.abs(n)} currency="USD" abbreviate={false} />
            </span>
        );
    }
    return (
        <CurrencyDisplay
            amount={amount}
            currency="USD"
            abbreviate={abbreviate}
            className={`tabular-nums ${className}`}
        />
    );
}
export function TaxDisclaimer({ year }: { year: 2025 | 2026 }) {
    return (
        <p className="px-1 text-xs text-muted-foreground">
            Estimates only — not tax, legal, or accounting advice. Tax tables: IRS Rev. Proc.{' '}
            {year === 2025 ? '2024-40' : '2025-32'} and Form 1040-ES ({year}).
        </p>
    );
}
