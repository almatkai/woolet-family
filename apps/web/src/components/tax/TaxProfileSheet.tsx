import { useEffect } from 'react';
import { format } from 'date-fns';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { trpc } from '@/lib/trpc';
import { useIsMobile } from '@/hooks/use-mobile';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { InfoTip } from '@/components/ui/info-tip';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
    Money,
    TaxDisclaimer,
    sectionLabel,
    sheetClass,
    type TaxProfile,
    type StateTable,
    type TransactionIncome,
} from './shared';
const filingLabels = {
    single: 'Single',
    married_joint: 'Married filing jointly',
    married_separate: 'Married filing separately',
    head_of_household: 'Head of household',
    qualifying_surviving_spouse: 'Qualifying surviving spouse',
};
const money = z.number().finite().min(0).max(999999999);
const gain = z.number().finite().min(-999999999).max(999999999);
const schema = z
    .object({
        taxYear: z.union([z.literal(2026), z.literal(2025)]),
        filingStatus: z.enum([
            'single',
            'married_joint',
            'married_separate',
            'head_of_household',
            'qualifying_surviving_spouse',
        ]),
        state: z.string().length(2),
        stateEffectiveRate: z
            .number()
            .finite()
            .min(0, 'Enter a rate between 0 and 15%')
            .max(15, 'Enter a rate between 0 and 15%')
            .nullable(),
        taxpayerAge65: z.boolean(),
        taxpayerBlind: z.boolean(),
        spouseAge65: z.boolean(),
        spouseBlind: z.boolean(),
        qualifyingChildren: z.number().int().min(0).max(30),
        otherDependents: z.number().int().min(0).max(30),
        wageIncome: money,
        selfEmploymentIncome: gain,
        interestIncome: money,
        ordinaryDividends: money,
        qualifiedDividends: money,
        longTermCapitalGains: gain,
        shortTermCapitalGains: gain,
        otherIncome: gain,
        preTaxContributions: money,
        iraDeduction: money,
        hsaDeduction: money,
        studentLoanInterest: money,
        tipsDeduction: money,
        overtimeDeduction: money,
        federalWithholdingYtd: money,
        stateWithholdingYtd: money,
        priorYearTax: money.nullable(),
        priorYearAgi: gain.nullable(),
        useTransactionsForIncome: z.boolean(),
    })
    .refine((p) => p.qualifiedDividends <= p.ordinaryDividends, {
        path: ['qualifiedDividends'],
        message: 'Qualified dividends must be included in ordinary dividends',
    });
const defaults: TaxProfile = {
    taxYear: 2026,
    filingStatus: 'single',
    state: 'TX',
    stateEffectiveRate: null,
    taxpayerAge65: false,
    taxpayerBlind: false,
    spouseAge65: false,
    spouseBlind: false,
    qualifyingChildren: 0,
    otherDependents: 0,
    wageIncome: 0,
    selfEmploymentIncome: 0,
    interestIncome: 0,
    ordinaryDividends: 0,
    qualifiedDividends: 0,
    longTermCapitalGains: 0,
    shortTermCapitalGains: 0,
    otherIncome: 0,
    preTaxContributions: 0,
    iraDeduction: 0,
    hsaDeduction: 0,
    studentLoanInterest: 0,
    tipsDeduction: 0,
    overtimeDeduction: 0,
    federalWithholdingYtd: 0,
    stateWithholdingYtd: 0,
    priorYearTax: null,
    priorYearAgi: null,
    useTransactionsForIncome: false,
};
type NumberKey = {
    [K in keyof TaxProfile]: TaxProfile[K] extends number | null ? K : never;
}[keyof TaxProfile];
const incomeFields: [NumberKey, string][] = [
    ['wageIncome', 'Wages (W-2, gross)'],
    ['selfEmploymentIncome', 'Self-employment, net'],
    ['interestIncome', 'Interest'],
    ['ordinaryDividends', 'Ordinary dividends'],
    ['qualifiedDividends', 'Qualified dividends'],
    ['longTermCapitalGains', 'Long-term capital gains'],
    ['shortTermCapitalGains', 'Short-term capital gains'],
    ['otherIncome', 'Other income'],
];
const deductionFields: [NumberKey, string][] = [
    ['preTaxContributions', 'Pre-tax payroll (401k, HSA)'],
    ['iraDeduction', 'IRA deduction'],
    ['hsaDeduction', 'HSA outside payroll'],
    ['studentLoanInterest', 'Student loan interest'],
    ['tipsDeduction', 'Qualified tips'],
    ['overtimeDeduction', 'Qualified overtime'],
];
export function TaxProfileSheet({
    open,
    onOpenChange,
    year,
    profile,
    states,
    statesError,
}: {
    open: boolean;
    onOpenChange: (v: boolean) => void;
    year: 2025 | 2026;
    profile: TaxProfile | null;
    states: StateTable[];
    statesError?: string;
}) {
    const isCompactMobile = useIsMobile(470),
        utils = trpc.useUtils();
    const {
        register,
        handleSubmit,
        control,
        setValue,
        reset,
        formState: { errors },
    } = useForm<TaxProfile>({ resolver: zodResolver(schema), defaultValues: { ...defaults, taxYear: year } });
    useEffect(() => {
        if (open) reset(profile ?? { ...defaults, taxYear: year });
    }, [open, profile, year, reset]);
    const watched = useWatch({ control });
    const fromTransactions = watched.useTransactionsForIncome ?? false;
    const incomeQuery = trpc.tax.getTransactionIncome.useQuery(
        { taxYear: year, today: format(new Date(), 'yyyy-MM-dd') },
        { enabled: open && fromTransactions },
    );
    const income: TransactionIncome | undefined = incomeQuery.data;
    useEffect(() => {
        if (fromTransactions && income) {
            setValue('wageIncome', Math.round(income.wageProjected * 100) / 100);
            setValue('selfEmploymentIncome', Math.round(income.selfEmploymentProjected * 100) / 100);
        }
    }, [fromTransactions, income, setValue]);
    const state = states.find((s) => s.code === watched.state);
    const status = watched.filingStatus ?? 'single';
    const mutation = trpc.tax.upsertProfile.useMutation({
        onSuccess: () => {
            void utils.tax.invalidate();
            toast.success('Tax profile saved');
            onOpenChange(false);
        },
        onError: (e: { message: string }) => toast.error(e.message),
    });
    const field = (name: NumberKey, label: string, optional = false) => (
        <div className="space-y-2" key={name}>
            <Label htmlFor={`tax-${name}`} className="inline-flex items-center gap-1.5">
                {label}
                {['tipsDeduction', 'overtimeDeduction'].includes(name) && (
                    <InfoTip>
                        Tips up to $25,000; overtime up to $12,500, or $25,000 if married filing jointly.
                    </InfoTip>
                )}
                {['priorYearTax', 'priorYearAgi'].includes(name) && (
                    <InfoTip>Used for the safe harbor. Without it we use 90% of this year's tax.</InfoTip>
                )}
            </Label>
            <Input
                id={`tax-${name}`}
                type="number"
                step={['qualifyingChildren', 'otherDependents'].includes(name) ? '1' : '0.01'}
                disabled={fromTransactions && ['wageIncome', 'selfEmploymentIncome'].includes(name)}
                {...register(name, { setValueAs: (v) => (v === '' ? (optional ? null : 0) : Number(v)) })}
            />
            {errors[name] && <p className="text-xs text-destructive">{errors[name]?.message}</p>}
        </div>
    );
    const check = (
        name: 'taxpayerAge65' | 'taxpayerBlind' | 'spouseAge65' | 'spouseBlind',
        label: string,
    ) => (
        <div className="flex items-center gap-2" key={name}>
            <Checkbox
                id={`tax-${name}`}
                checked={watched[name] ?? false}
                onCheckedChange={(v) => setValue(name, v === true)}
            />
            <Label htmlFor={`tax-${name}`}>{label}</Label>
        </div>
    );
    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent side={isCompactMobile ? 'bottom' : 'right'} className={sheetClass}>
                <SheetHeader>
                    <SheetTitle>Tax profile · {year}</SheetTitle>
                    <SheetDescription>
                        Used only to estimate your tax. You can change it any time.
                    </SheetDescription>
                </SheetHeader>
                <form className="mt-6 space-y-4" onSubmit={handleSubmit((v) => mutation.mutate(v))}>
                    <div className="space-y-6">
                        <section className="space-y-4">
                            <h3 className={sectionLabel}>Filing status</h3>
                            <div className="space-y-2">
                                <Label htmlFor="tax-status" className="sr-only">
                                    Filing status
                                </Label>
                                <Select
                                    value={status}
                                    onValueChange={(v) => {
                                        setValue('filingStatus', v as TaxProfile['filingStatus']);
                                        if (v !== 'married_joint') {
                                            setValue('spouseAge65', false);
                                            setValue('spouseBlind', false);
                                        }
                                    }}
                                >
                                    <SelectTrigger id="tax-status">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {Object.entries(filingLabels).map(([v, label]) => (
                                            <SelectItem key={v} value={v}>
                                                {label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-3 rounded-2xl bg-white/[0.035] p-3">
                                {check('taxpayerAge65', "I'm 65 or older")}
                                {check('taxpayerBlind', "I'm blind")}
                                {['married_joint', 'married_separate'].includes(status) && (
                                    <>
                                        {check('spouseAge65', 'Spouse is 65 or older')}
                                        {check('spouseBlind', 'Spouse is blind')}
                                    </>
                                )}
                            </div>
                        </section>
                        <section className="space-y-4">
                            <h3 className={sectionLabel}>State</h3>
                            <div className="space-y-2">
                                <Label htmlFor="tax-state" className="sr-only">
                                    State
                                </Label>
                                <Select
                                    value={watched.state}
                                    onValueChange={(v) => {
                                        setValue('state', v);
                                        setValue('stateEffectiveRate', null);
                                    }}
                                >
                                    <SelectTrigger id="tax-state">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {states.map((s) => (
                                            <SelectItem key={s.code} value={s.code}>
                                                {s.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            {statesError && <p className="text-xs text-destructive">{statesError}</p>}
                            {state?.type === 'none' && (
                                <p className="text-xs text-muted-foreground">
                                    {state.name} has no state income tax.
                                </p>
                            )}
                            {state?.type === 'flat' && (
                                <p className="text-xs text-muted-foreground">
                                    {state.name} uses a flat{' '}
                                    {state.rate?.toLocaleString('en-US', { maximumFractionDigits: 2 })}% rate.
                                    Rates as of Nov 2026; verify with your state.
                                </p>
                            )}
                            {state?.type === 'progressive' && (
                                <div className="space-y-2">
                                    <Label htmlFor="tax-state-rate">Your effective state rate, %</Label>
                                    <Input
                                        id="tax-state-rate"
                                        type="number"
                                        step="0.01"
                                        placeholder="5.2"
                                        {...register('stateEffectiveRate', {
                                            setValueAs: (v) => (v === '' ? null : Number(v)),
                                        })}
                                    />
                                    <p className="text-xs text-muted-foreground">
                                        {year === 2025
                                            ? '2025 state rates are for reference. Enter your effective rate from your return.'
                                            : `${state.name} uses brackets, which this estimate doesn't model yet. Use last year's state tax ÷ AGI from your return.`}
                                    </p>
                                    {errors.stateEffectiveRate && (
                                        <p className="text-xs text-destructive">
                                            Enter a rate between 0 and 15%
                                        </p>
                                    )}
                                </div>
                            )}
                        </section>
                        <section className="space-y-4">
                            <h3 className={sectionLabel}>Income for {year}</h3>
                            <div className="flex items-center justify-between gap-3 rounded-2xl bg-white/[0.035] p-3">
                                <div>
                                    <Label htmlFor="tax-transactions">Use my transactions</Label>
                                    <p className="text-xs text-muted-foreground">
                                        Salary and Bonuses count as wages, Freelance Work as self-employment.
                                    </p>
                                </div>
                                <Switch
                                    id="tax-transactions"
                                    checked={fromTransactions}
                                    onCheckedChange={(v) => setValue('useTransactionsForIncome', v)}
                                />
                            </div>
                            {fromTransactions &&
                                (incomeQuery.isLoading ? (
                                    <p className="text-xs text-muted-foreground">
                                        Loading transaction income...
                                    </p>
                                ) : incomeQuery.error ? (
                                    <p className="text-xs text-destructive">{incomeQuery.error.message}</p>
                                ) : (
                                    income && (
                                        <p className="text-xs text-muted-foreground">
                                            From your transactions: <Money amount={income.wageYtd} /> in wages
                                            and <Money amount={income.selfEmploymentYtd} /> self-employment so
                                            far in {year}. Full year projected:{' '}
                                            <Money amount={income.wageProjected} /> and{' '}
                                            <Money amount={income.selfEmploymentProjected} />.
                                        </p>
                                    )
                                ))}
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                {incomeFields.map(([key, label]) => field(key, label))}
                            </div>
                            <p className="text-xs text-muted-foreground">
                                Ordinary dividends include qualified dividends; enter the qualified portion
                                separately.
                            </p>
                        </section>
                        <section className="space-y-4">
                            <h3 className={sectionLabel}>Deductions</h3>
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                {deductionFields.map(([key, label]) => field(key, label))}
                            </div>
                        </section>
                        <section className="space-y-4">
                            <h3 className={sectionLabel}>Dependents</h3>
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                {field('qualifyingChildren', 'Children under 17')}
                                {field('otherDependents', 'Other dependents')}
                            </div>
                        </section>
                        <section className="space-y-4">
                            <h3 className={sectionLabel}>Payments made</h3>
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                {field('federalWithholdingYtd', 'Federal withholding so far')}
                                {field('stateWithholdingYtd', 'State withholding so far')}
                                {field('priorYearTax', "Last year's total tax", true)}
                                {field('priorYearAgi', "Last year's AGI", true)}
                            </div>
                        </section>
                    </div>
                    <Button
                        type="submit"
                        className="w-full"
                        disabled={
                            mutation.isLoading ||
                            !!statesError ||
                            (fromTransactions && (incomeQuery.isLoading || !!incomeQuery.error))
                        }
                    >
                        {mutation.isLoading ? 'Saving...' : profile ? 'Update profile' : 'Save profile'}
                    </Button>
                    <TaxDisclaimer year={year} />
                </form>
            </SheetContent>
        </Sheet>
    );
}
