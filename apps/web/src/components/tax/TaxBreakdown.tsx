import { Button } from '@/components/ui/button';
import { GlassCard } from '@/components/ui/glass';
import { InfoTip } from '@/components/ui/info-tip';
import { cn } from '@/lib/utils';
import { Money, sectionLabel, type TaxEstimate } from './shared';
export function TaxBreakdown({
    estimate: e,
    year,
    edit,
}: {
    estimate: TaxEstimate;
    year: 2025 | 2026;
    edit: () => void;
}) {
    const lines: {
        key: string;
        label: string;
        value: number;
        subtract?: boolean;
        bold?: boolean;
        tip?: string;
    }[] = [
        { key: 'income', label: 'Total income', value: e.grossIncome },
        { key: 'adjustments', label: 'Adjustments', value: e.adjustments, subtract: true },
        { key: 'agi', label: 'Adjusted gross income (AGI)', value: e.agi, bold: true },
        { key: 'standard', label: 'Standard deduction', value: e.standardDeduction, subtract: true },
        { key: 'senior', label: 'Senior deduction', value: e.seniorDeduction, subtract: true },
        { key: 'tips', label: 'Tips and overtime', value: e.tipsAndOvertime, subtract: true },
        { key: 'taxable', label: 'Taxable income', value: e.taxableIncome, bold: true },
        { key: 'federal-income', label: 'Federal income tax', value: e.incomeTax },
        {
            key: 'se',
            label: 'Self-employment tax',
            value: e.seTax,
            tip: `15.3% of 92.35% of net self-employment earnings. Social Security stops at $${year === 2026 ? '184,500' : '176,100'}.`,
        },
        { key: 'medicare', label: 'Additional Medicare tax', value: e.additionalMedicare },
        { key: 'niit', label: 'Net investment income tax', value: e.niit },
        { key: 'credits', label: 'Child and dependent credits', value: e.credits, subtract: true },
        { key: 'federal', label: 'Federal total', value: e.federalTotal, bold: true },
    ];
    return (
        <section className="space-y-3">
            <h2 className={sectionLabel}>How it's calculated</h2>
            <GlassCard className="divide-y divide-white/[0.06]">
                {lines
                    .filter((l) => l.value !== 0 || l.bold)
                    .map((l) => (
                        <div key={l.key} className="flex items-center justify-between gap-3 px-4 py-3">
                            <span className={cn(
                                'inline-flex items-center gap-1.5 text-sm',
                                l.bold && 'font-semibold',
                            )}>
                                {l.label}
                                {l.tip && <InfoTip>{l.tip}</InfoTip>}
                            </span>
                            <span
                                className={cn(
                                    'shrink-0 text-sm tabular-nums',
                                    l.bold && 'font-semibold',
                                    l.subtract && 'text-muted-foreground',
                                )}
                            >
                                {l.subtract ? '−' : ''}
                                <Money
                                    amount={l.value}
                                    className={l.bold ? 'font-semibold [&_span]:font-semibold' : ''}
                                />
                            </span>
                        </div>
                    ))}
                <div className="flex items-center justify-between gap-3 px-4 py-3">
                    <div>
                        <span className="text-sm">State tax ({e.state.name})</span>
                        {e.state.type === 'flat' && (
                            <p className="text-xs text-muted-foreground">
                                Flat {e.state.rate?.toLocaleString('en-US', { maximumFractionDigits: 2 })}% ·
                                rates as of Nov 2026; verify with your state
                            </p>
                        )}
                        {e.state.type === 'none' && (
                            <p className="text-xs text-muted-foreground">No state income tax</p>
                        )}
                    </div>
                    {e.stateRateMissing ? (
                        <Button size="sm" variant="outline" onClick={edit}>
                            Add rate
                        </Button>
                    ) : (
                        <Money amount={e.stateTotal} className="shrink-0 text-sm" />
                    )}
                </div>
                <div className="flex items-center justify-between gap-3 px-4 py-3 text-base font-bold">
                    <span>Total estimated tax</span>
                    <Money amount={e.total} className="font-bold [&_span]:font-bold" />
                </div>
            </GlassCard>
        </section>
    );
}
