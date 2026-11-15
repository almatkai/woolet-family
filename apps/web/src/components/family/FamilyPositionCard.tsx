import { GlassCard } from '@/components/ui/glass';
import { FamilyMoney, Notice } from './shared';
import type { FamilyFinancesOutput, HouseholdOverviewOutput } from './types';

export function FamilyPositionCard({
    finances,
    total,
    currency,
    date,
}: {
    finances: FamilyFinancesOutput;
    total:
        HouseholdOverviewOutput['converted']['currencies'][number] | undefined;
    currency: string;
    date: Date;
}) {
    return (
        <GlassCard className="p-4">
            <dl className="grid grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-3">
                {[
                    [
                        `Income in ${date.toLocaleDateString('en', { month: 'short' })}`,
                        total?.income,
                    ],
                    ['Net worth', finances.summary.balancesConverted],
                    ['Owes', finances.summary.owesConverted],
                    [
                        'Monthly payments',
                        finances.summary.monthlyPaymentsConverted,
                    ],
                ].map(([label, amount]) => (
                    <div key={label}>
                        <dt className="text-xs text-muted-foreground">
                            {label}
                        </dt>
                        <dd className="text-base font-semibold tabular-nums">
                            {amount == null ? (
                                '—'
                            ) : (
                                <>
                                    ≈{' '}
                                    <FamilyMoney
                                        amount={amount}
                                        currency={currency}
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
