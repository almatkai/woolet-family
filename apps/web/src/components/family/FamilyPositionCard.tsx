import { cn } from '@/lib/utils';
import { GlassCard } from '@/components/ui/glass';
import { FamilyMoney, Notice } from './shared';
import type { FamilyFinancesOutput, HouseholdOverviewOutput } from './types';

export function FamilyPositionCard({
    finances,
    total,
    currency,
    date,
    className,
}: {
    finances: FamilyFinancesOutput;
    total:
        HouseholdOverviewOutput['converted']['currencies'][number] | undefined;
    currency: string;
    date: Date;
    className?: string;
}) {
    return (
        <GlassCard className={cn('flex flex-col justify-center gap-4 p-5', className)}>
            <dl className="grid grid-cols-2 gap-x-6 gap-y-5">
                {[
                    [
                        `Income in ${date.toLocaleDateString('en', { month: 'short' })}`,
                        total?.income,
                    ],
                    ['Account balances', finances.summary.balancesConverted],
                    ['Owes', finances.summary.owesConverted],
                    [
                        'Monthly payments',
                        finances.summary.monthlyPaymentsConverted,
                    ],
                ].map(([label, amount]) => (
                    <div key={label}>
                        <dt className="text-xs text-muted-foreground">
                            {label}
                            {label === 'Owes' && (
                                <p className="text-[11px] text-muted-foreground">
                                    Debts to people outside the family
                                </p>
                            )}
                        </dt>
                        <dd className="mt-1 text-lg font-semibold tabular-nums">
                            {amount == null ? (
                                '—'
                            ) : (
                                <>
                                    ≈{' '}
                                    <FamilyMoney
                                        amount={amount}
                                        currency={label === 'Account balances' || label === 'Owes' || label === 'Monthly payments' ? finances.displayCurrency : currency}
                                        abbreviate
                                    />
                                </>
                            )}
                        </dd>
                    </div>
                ))}
            </dl>
            {!!finances.unconvertedCurrencies.length && (
                <Notice tone="info">
                    {finances.unconvertedCurrencies.join(', ')} excluded because
                    no exchange rate is available.
                </Notice>
            )}
        </GlassCard>
    );
}
