import { useState } from 'react';
import { format, parseISO } from 'date-fns';
import { Calculator, Wallet, Scale, Percent, Pencil, Plus } from 'lucide-react';
import { trpc } from '@/lib/trpc';
import { PageHeader } from '@/components/PageHeader';
import { Button } from '@/components/ui/button';
import { ActionButton } from '@/components/ui/action-button';
import { GlassCard, StatTile, Segmented } from '@/components/ui/glass';
import { ProductEmptyState } from '@/components/financial/ProductCard';
import { TaxProfileSheet } from '@/components/tax/TaxProfileSheet';
import { TaxPaymentSheet } from '@/components/tax/TaxPaymentSheet';
import { TaxBreakdown } from '@/components/tax/TaxBreakdown';
import { TaxQuarterlyPayments } from '@/components/tax/TaxQuarterlyPayments';
import {
    Money,
    TaxDisclaimer,
    sectionLabel,
    type TaxProfile,
    type TaxEstimate,
    type StateTable,
    type TaxPayment,
} from '@/components/tax/shared';
export function TaxPage() {
    const [year, setYear] = useState<'2026' | '2025'>('2026');
    const taxYear = Number(year) as 2026 | 2025;
    const today = format(new Date(), 'yyyy-MM-dd');
    const [profileOpen, setProfileOpen] = useState(false),
        [paymentOpen, setPaymentOpen] = useState(false),
        [quarter, setQuarter] = useState(1),
        [suggestedAmount, setSuggestedAmount] = useState<number | undefined>();
    const profileQuery = trpc.tax.getProfile.useQuery({ taxYear });
    const profile: TaxProfile | null = profileQuery.data ?? null;
    const estimateQuery = trpc.tax.estimate.useQuery({ taxYear, today }, { enabled: !!profile });
    const e: TaxEstimate | undefined = estimateQuery.data ?? undefined;
    const overdueQuarter = e?.quarterlySchedule.find((q) => q.status === 'overdue');
    const stateOwed = e ? e.stateTotal - e.projectedStateWithholding - e.statePaid : 0;
    const statesQuery = trpc.tax.getStates.useQuery({ taxYear });
    const states: StateTable[] = statesQuery.data ?? [];
    const paymentsQuery = trpc.tax.listEstimatedPayments.useQuery({ taxYear }, { enabled: !!profile });
    const payments: TaxPayment[] = paymentsQuery.data ?? [];
    const addPayment = (q?: number, amount?: number) => {
        const selectedQuarter =
            q ??
            e?.nextPayment?.quarter ??
            e?.quarterlySchedule.find((v) => v.status === 'overdue' || v.status === 'due')?.quarter ??
            4;
        const schedule = e?.quarterlySchedule.find((v) => v.quarter === selectedQuarter);
        const remainingAmount = amount ?? (schedule
            ? Math.max(0, schedule.suggestedAmount - schedule.federalPaid)
            : undefined);
        setQuarter(selectedQuarter);
        setSuggestedAmount(remainingAmount === undefined ? undefined : Math.round(remainingAmount * 100) / 100);
        setPaymentOpen(true);
    };
    const loading = profileQuery.isLoading || (!!profile && estimateQuery.isLoading);
    const error = profileQuery.error ?? estimateQuery.error;
    const switchYear = (v: '2026' | '2025') => {
        setYear(v);
        setProfileOpen(false);
        setPaymentOpen(false);
    };
    return (
        <div className="space-y-4 md:space-y-6">
            <PageHeader
                title="Taxes"
                subtitle={`Federal and state income tax estimate for ${year}`}
                variant="two-with-text"
            >
                {profile ? (
                    <>
                        <ActionButton
                            variant="secondary"
                            className="flex-1 sm:flex-none"
                            onClick={() => setProfileOpen(true)}
                        >
                            <Pencil className="size-4" />
                            Edit profile
                        </ActionButton>
                        <ActionButton className="flex-1 sm:flex-none" onClick={() => addPayment()}>
                            <Plus className="size-4" />
                            Add payment
                        </ActionButton>
                    </>
                ) : (
                    <ActionButton
                        className="flex-1 sm:flex-none"
                        onClick={() => setProfileOpen(true)}
                        disabled={loading}
                    >
                        <Plus className="size-4" />
                        Set up
                    </ActionButton>
                )}
            </PageHeader>
            <div className="space-y-2">
                <Segmented
                    value={year}
                    onChange={switchYear}
                    options={[
                        { value: '2026', label: '2026' },
                        { value: '2025', label: '2025' },
                    ]}
                />
                {year === '2025' && (e ? !e.tablesVerified : true) && (
                    <p className="text-xs text-muted-foreground">
                        2025 figures are for reference. Some 2025 values haven't been checked against IRS
                        sources yet.
                    </p>
                )}
            </div>
            {error ? (
                <GlassCard className="space-y-3 p-5">
                    <p className="text-sm text-destructive">{error.message}</p>
                    <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                            void profileQuery.refetch();
                            if (profile) {
                                void estimateQuery.refetch();
                                void paymentsQuery.refetch();
                            }
                            void statesQuery.refetch();
                        }}
                    >
                        Try again
                    </Button>
                </GlassCard>
            ) : loading ? (
                <>
                    <div className="h-8 w-48 bg-muted animate-pulse rounded" />
                    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                        {[0, 1, 2, 3].map((i) => (
                            <div
                                key={i}
                                className="h-24 md:h-28 bg-white/[0.04] animate-pulse rounded-[22px]"
                            />
                        ))}
                    </div>
                </>
            ) : !profile ? (
                <ProductEmptyState
                    icon={<Calculator className="size-5" />}
                    title={`No tax profile for ${year}`}
                    description={`Add your filing status, income and what you've paid so far. Woolet then estimates your ${year} federal and state tax and your quarterly 1040-ES payments.`}
                    action={
                        <Button size="sm" className="gap-2" onClick={() => setProfileOpen(true)}>
                            <Plus className="size-4" />
                            Set up tax profile
                        </Button>
                    }
                />
            ) : (
                e && (
                    <>
                        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                            <StatTile
                                label="Projected tax"
                                color="#A1A1AA"
                                showAura={false}
                                icon={<Calculator className="size-4" />}
                                value={<Money amount={e.total} />}
                                hint={
                                    <>
                                        Federal <Money abbreviate amount={e.federalTotal} /> ·{' '}
                                        {e.stateRateMissing ? 'State rate needed' : (
                                            <>State <Money abbreviate amount={e.stateTotal} /></>
                                        )}
                                    </>
                                }
                            />
                            <StatTile
                                label="Paid so far"
                                color="#A1A1AA"
                                showAura={false}
                                icon={<Wallet className="size-4" />}
                                value={<Money amount={e.paidSoFar} />}
                                hint={
                                    <>
                                        Withholding <Money abbreviate amount={e.withholdingYtd} /> · Estimated{' '}
                                        <Money abbreviate amount={e.estimatedPaid} />
                                    </>
                                }
                            />
                            <StatTile
                                label={e.remaining < 0 ? 'Expected refund' : 'Still owed'}
                                color={e.remaining < 0 ? '#34D399' : '#FB7185'}
                                icon={<Scale className="size-4" />}
                                value={
                                    <Money
                                        amount={Math.abs(e.remaining)}
                                        className={
                                            e.remaining < 0
                                                ? 'text-emerald-600 dark:text-emerald-400'
                                                : 'text-rose-600 dark:text-rose-400'
                                        }
                                    />
                                }
                                hint={
                                    e.remaining < 0
                                        ? 'If withholding continues at this pace'
                                        : 'Includes withholding projected to Dec 31'
                                }
                            />
                            <StatTile
                                label="Effective rate"
                                color="#A1A1AA"
                                showAura={false}
                                icon={<Percent className="size-4" />}
                                value={`${(e.effectiveRate * 100).toFixed(1)}%`}
                                hint={`Marginal ${Number((e.federalMarginalRate * 100).toFixed(2))}% fed${!e.stateRateMissing && e.state.type !== 'none' ? ` + ${Number((e.stateMarginalRate * 100).toFixed(2))}% state` : ''}`}
                            />
                        </div>
                        {e.stateRateMissing && (
                            <p className="text-xs text-muted-foreground">
                                State tax is awaiting your effective rate. Add it in your tax profile to
                                complete the estimate.
                            </p>
                        )}
                        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                            <div className="space-y-4">
                                <GlassCard className="p-5">
                                    <h2 className={sectionLabel}>Next estimated payment</h2>
                                    {!e.nextPayment && overdueQuarter ? (
                                        <>
                                            <p className="mt-2 text-sm font-semibold">
                                                Q{overdueQuarter.quarter} is overdue
                                            </p>
                                            <p className="mt-1 text-xs text-muted-foreground">
                                                Record a late payment to reduce the underpayment penalty.
                                            </p>
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                className="mt-4"
                                                onClick={() => addPayment(overdueQuarter.quarter)}
                                            >
                                                Record payment
                                            </Button>
                                        </>
                                    ) : e.quarterlySchedule[3].dueDate < today ? (
                                        <>
                                            <p className="mt-2 text-sm font-semibold">
                                                All {year} quarters are past
                                            </p>
                                            <p className="mt-1 text-xs text-muted-foreground">
                                                Your return is due {format(parseISO(e.returnDue), 'MMM d, yyyy')}.
                                            </p>
                                        </>
                                    ) : !e.estimatedPaymentsLikelyRequired ? (
                                        <>
                                            <p className="mt-2 text-sm font-semibold">
                                                No federal estimated payment needed
                                            </p>
                                            <p className="mt-1 text-xs text-muted-foreground">
                                                Your federal withholding covers the safe harbor amount.
                                                You're expected to owe less than $1,000 in federal tax at
                                                filing.
                                            </p>
                                            {stateOwed >= 1000 && (
                                                <p className="mt-3 text-xs text-muted-foreground">
                                                    {e.state.name} tax: about{' '}
                                                    <Money amount={stateOwed} className="font-semibold text-foreground" />{' '}
                                                    still due. The state may expect its own estimated
                                                    payments; this page plans federal ones only.
                                                </p>
                                            )}
                                        </>
                                    ) : e.nextPayment ? (
                                        <>
                                            <p className="mt-2 text-2xl font-bold tracking-tight tabular-nums">
                                                {format(parseISO(e.nextPayment.dueDate), 'MMM d, yyyy')}
                                            </p>
                                            <p className="mt-1 text-xs text-muted-foreground">
                                                Q{e.nextPayment.quarter} · Form 1040-ES ·{' '}
                                                {e.nextPayment.daysUntil === 0
                                                    ? 'today'
                                                    : e.nextPayment.daysUntil === 1
                                                      ? 'tomorrow'
                                                      : `in ${e.nextPayment.daysUntil} days`}
                                            </p>
                                            <div className="mt-4">
                                                <p className="text-xs text-muted-foreground">Suggested</p>
                                                <Money
                                                    amount={e.nextPayment.suggestedAmount}
                                                    className="text-2xl font-bold"
                                                />
                                                {e.nextPayment.catchUpAmount > 0 && (
                                                    <p className="mt-1 text-xs text-muted-foreground">
                                                        Includes{' '}
                                                        <Money amount={e.nextPayment.catchUpAmount} className="font-semibold text-foreground" />{' '}
                                                        missed in earlier quarters. Recording those as late
                                                        payments lowers this amount and the penalty.
                                                    </p>
                                                )}
                                            </div>
                                            <div className="relative mt-4 flex items-center justify-between gap-3">
                                                <p className="min-w-0 text-xs text-muted-foreground">
                                                    Pays enough to meet the safe harbor ({e.safeHarborBasis})
                                                </p>
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    className="shrink-0"
                                                    onClick={() => addPayment(
                                                        e.nextPayment!.quarter,
                                                        e.nextPayment!.suggestedAmount,
                                                    )}
                                                >
                                                    Record payment
                                                </Button>
                                            </div>
                                        </>
                                    ) : (
                                        <>
                                            <p className="mt-2 text-sm font-semibold">
                                                All quarterly payments have been recorded
                                            </p>
                                            <p className="mt-1 text-xs text-muted-foreground">
                                                Your federal payments cover the suggested amounts.
                                            </p>
                                        </>
                                    )}
                                </GlassCard>
                                <TaxQuarterlyPayments
                                    key={year}
                                    estimate={e}
                                    payments={payments}
                                    error={paymentsQuery.error?.message}
                                    add={addPayment}
                                />
                            </div>
                            <TaxBreakdown estimate={e} year={taxYear} edit={() => setProfileOpen(true)} />
                        </div>
                        <GlassCard className="p-4">
                            <h2 className={sectionLabel}>Not included in this estimate</h2>
                            <p className="mt-2 text-xs text-muted-foreground leading-relaxed">
                                Alternative minimum tax, the qualified business income deduction, itemized
                                deductions, the earned income credit, the child and dependent care credit,
                                kiddie tax, multi-state and city taxes, and ACA premium tax credits. If any of
                                these apply to you, your actual tax will differ.
                            </p>
                        </GlassCard>
                    </>
                )
            )}
            <TaxDisclaimer year={taxYear} />
            <TaxProfileSheet
                open={profileOpen}
                onOpenChange={setProfileOpen}
                year={taxYear}
                profile={profile}
                states={states}
                statesError={statesQuery.error?.message}
            />
            <TaxPaymentSheet
                open={paymentOpen}
                onOpenChange={setPaymentOpen}
                year={taxYear}
                quarter={quarter}
                suggestedAmount={suggestedAmount}
            />
        </div>
    );
}
