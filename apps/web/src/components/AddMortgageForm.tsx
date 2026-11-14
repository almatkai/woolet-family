import { useEffect, useMemo, useState } from 'react';
import { InfoTip } from '@/components/ui/info-tip';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus } from 'lucide-react';
import { trpc } from '@/lib/trpc';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { CurrencySelect } from './CurrencySelect';

const mortgageSchema = z.object({
    accountId: z.string().uuid(),
    propertyName: z.string().min(1, 'Property name is required'),
    propertyAddress: z.string().optional(),
    principalAmount: z.string().min(1),
    initialPayment: z.string().optional(),
    interestRate: z.string().min(1),
    monthlyPayment: z.string().min(1),
    remainingBalance: z.string().min(1),
    currency: z.string().length(3),
    startDate: z.string().min(1),
    termYears: z.string().min(1),
    paymentDay: z.string().optional(),
    status: z.enum(['active', 'paid_off', 'defaulted']),
});

type MortgageFormValues = z.infer<typeof mortgageSchema>;

interface AddMortgageFormProps {
    onSuccess: () => void;
    onCancel: () => void;
}

export function AddMortgageForm({ onSuccess, onCancel }: AddMortgageFormProps) {
    const utils = trpc.useUtils();
    const { data: banks } = trpc.bank.getHierarchy.useQuery();
    const [manualOverridePayment, setManualOverridePayment] = useState(false);
    const [manualOverrideBalance, setManualOverrideBalance] = useState(false);
    const [downPaymentMode, setDownPaymentMode] = useState<'amount' | 'percent'>('amount');
    const [percentValue, setPercentValue] = useState('');

    const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<MortgageFormValues>({
        resolver: zodResolver(mortgageSchema),
        defaultValues: {
            status: 'active',
            currency: '',
            startDate: new Date().toISOString().split('T')[0],
            termYears: '20',
            paymentDay: '1',
        }
    });

    const createMortgage = trpc.mortgage.create.useMutation({
        onSuccess: () => {
            utils.mortgage.list.invalidate();
            toast.success('Mortgage added successfully');
            reset();
            onSuccess();
        },
        onError: (error: any) => toast.error(error.message || 'Failed to add mortgage'),
    });

    const onSubmit = (data: MortgageFormValues) => {
        createMortgage.mutate({
            ...data,
            principalAmount: Number(data.principalAmount),
            interestRate: Number(data.interestRate),
            monthlyPayment: Number(data.monthlyPayment),
            remainingBalance: Number(data.remainingBalance),
            termYears: Number(data.termYears),
            paymentDay: data.paymentDay ? Number(data.paymentDay) : 1,
        });
    };

    // Flatten currency balances for dropdown
    const accountOptions = useMemo(() => {
        if (!banks) return [];
        return banks.flatMap((bank: any) =>
            bank.accounts.flatMap((acc: any) =>
                acc.currencyBalances.map((cb: any) => ({
                    id: cb.id,
                    accountId: acc.id,
                    label: `[${bank.name}${acc.last4Digits ? ` ${acc.last4Digits}` : ''}] ${acc.name}`,
                    balance: Number(cb.balance),
                    currencyCode: cb.currencyCode
                }))
            )
        );
    }, [banks]);

    const accountId = watch('accountId');
    const selectedAccount = useMemo(() =>
        accountOptions.find((o: any) => o.accountId === accountId),
        [accountOptions, accountId]);

    const principalAmount = watch('principalAmount');
    const initialPayment = watch('initialPayment');
    const interestRate = watch('interestRate');
    const termYears = watch('termYears');
    const startDate = watch('startDate');

    // Sync initialPayment when principal changes in percent mode
    useEffect(() => {
        if (downPaymentMode === 'percent' && percentValue && principalAmount) {
            const p = Number(principalAmount);
            const pct = Number(percentValue);
            const payment = (pct / 100) * p;
            setValue('initialPayment', payment.toFixed(2));
        }
    }, [principalAmount, downPaymentMode]);

    // Auto-calculate monthly payment using mortgage formula: M = P * [r(1+r)^n] / [(1+r)^n - 1]
    useEffect(() => {
        if (manualOverridePayment || !principalAmount || !interestRate || !termYears) return;

        const totalPrice = Number(principalAmount);
        const downPayment = Number(initialPayment) || 0;
        const P = totalPrice - downPayment; // Actual loan amount
        const annualRate = Number(interestRate) / 100;
        const r = annualRate / 12; // monthly interest rate
        const n = Number(termYears) * 12; // total number of payments

        if (r === 0) {
            // If no interest, simple division
            const monthlyPayment = P / n;
            setValue('monthlyPayment', monthlyPayment.toFixed(2));
        } else {
            // Standard mortgage payment formula
            const monthlyPayment = P * (r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
            setValue('monthlyPayment', monthlyPayment.toFixed(2));
        }
    }, [principalAmount, initialPayment, interestRate, termYears, manualOverridePayment, setValue]);

    // Auto-calculate remaining balance based on payments made
    useEffect(() => {
        if (manualOverrideBalance || !principalAmount || !interestRate || !termYears || !startDate) return;

        const totalPrice = Number(principalAmount);
        const downPayment = Number(initialPayment) || 0;
        const P = totalPrice - downPayment; // Actual loan amount
        const annualRate = Number(interestRate) / 100;
        const r = annualRate / 12;
        const totalPayments = Number(termYears) * 12;

        const start = new Date(startDate);
        const now = new Date();
        const monthsElapsed = Math.max(0, Math.floor((now.getTime() - start.getTime()) / (30.44 * 24 * 60 * 60 * 1000)));
        const paymentsMade = Math.min(monthsElapsed, totalPayments);

        if (r === 0) {
            // No interest case
            const remaining = P - (P / totalPayments) * paymentsMade;
            setValue('remainingBalance', Math.max(0, remaining).toFixed(2));
        } else {
            // Calculate remaining balance: B = P * [(1+r)^n - (1+r)^p] / [(1+r)^n - 1]
            const numerator = Math.pow(1 + r, totalPayments) - Math.pow(1 + r, paymentsMade);
            const denominator = Math.pow(1 + r, totalPayments) - 1;
            const remaining = P * (numerator / denominator);
            setValue('remainingBalance', Math.max(0, remaining).toFixed(2));
        }
    }, [principalAmount, initialPayment, interestRate, termYears, startDate, manualOverrideBalance, setValue]);

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
                <Label>Property Name</Label>
                <Input {...register('propertyName')} placeholder="e.g., Main Apartment" />
                {errors.propertyName && <p className="text-xs text-destructive">{errors.propertyName.message}</p>}
            </div>

            <div className="space-y-2">
                <Label>Property Address</Label>
                <Input {...register('propertyAddress')} placeholder="e.g., 123 Main St, Almaty" />
            </div>

            <div className="space-y-2">
                <div className="flex items-center justify-between">
                    <Label>Account</Label>
                    {selectedAccount && (
                        <span className="text-xs font-medium text-muted-foreground animate-in fade-in duration-300">
                            Balance: {selectedAccount.balance.toLocaleString()} {selectedAccount.currencyCode}
                        </span>
                    )}
                </div>
                <Select
                    onValueChange={(v) => {
                        const opt = accountOptions.find((o: any) => o.id === v);
                        if (opt) {
                            setValue('accountId', opt.accountId);
                            setValue('currency', opt.currencyCode);
                        }
                    }}
                >
                    <SelectTrigger className="h-12">
                        <SelectValue placeholder="Select account" />
                    </SelectTrigger>
                    <SelectContent>
                        {accountOptions.map((opt: any) => (
                            <SelectItem key={opt.id} value={opt.id}>
                                <div className="flex flex-col items-start py-1">
                                    <span className="font-medium text-sm">{opt.label}</span>
                                    <span className="text-xs text-muted-foreground">{opt.currencyCode} • {opt.balance.toLocaleString()}</span>
                                </div>
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                    <Label>Principal Amount</Label>
                    <Input
                        type="number"
                        step="0.01"
                        {...register('principalAmount')}
                        placeholder="50000000"
                    />
                </div>
                <div className="space-y-2">
                    <div className="flex items-center justify-between">
                        <Label className="flex items-center gap-1.5">Down payment<InfoTip>Paid upfront; it reduces the loan amount.</InfoTip></Label>
                        <div className="flex items-center rounded-lg bg-white/[0.06] p-0.5">
                            <button
                                type="button"
                                onClick={() => {
                                    setDownPaymentMode('amount');
                                }}
                                className={`px-2 py-0.5 text-xs font-medium rounded-sm transition-all ${downPaymentMode === 'amount'
                                        ? 'bg-white/[0.14] text-foreground shadow-sm'
                                        : 'text-muted-foreground hover:text-foreground'
                                    }`}
                            >
                                Amount
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    setDownPaymentMode('percent');
                                    const p = Number(principalAmount) || 0;
                                    const i = Number(initialPayment) || 0;
                                    if (p > 0) {
                                        setPercentValue(parseFloat(((i / p) * 100).toFixed(2)).toString());
                                    } else {
                                        setPercentValue('');
                                    }
                                }}
                                className={`px-2 py-0.5 text-xs font-medium rounded-sm transition-all ${downPaymentMode === 'percent'
                                        ? 'bg-white/[0.14] text-foreground shadow-sm'
                                        : 'text-muted-foreground hover:text-foreground'
                                    }`}
                            >
                                %
                            </button>
                        </div>
                    </div>
                    {downPaymentMode === 'amount' ? (
                        <Input
                            type="number"
                            step="0.01"
                            {...register('initialPayment')}
                            placeholder="10000000"
                        />
                    ) : (
                        <Input
                            type="number"
                            step="0.1"
                            value={percentValue}
                            onChange={(e) => {
                                setPercentValue(e.target.value);
                                const pct = Number(e.target.value);
                                const p = Number(principalAmount) || 0;
                                const val = (pct / 100) * p;
                                setValue('initialPayment', val.toFixed(2));
                            }}
                            placeholder="20"
                        />
                    )}
                    {downPaymentMode === 'percent' && <p className="text-xs text-muted-foreground">{`≈ ${((Number(principalAmount || 0) * Number(percentValue || 0)) / 100).toLocaleString(undefined, { maximumFractionDigits: 2 })} ${watch('currency')}`}</p>}
                </div>
            </div>

            <div className="space-y-2">
                <Label>Interest rate, %</Label>
                <Input
                    type="number"
                    step="0.01"
                    {...register('interestRate')}
                    placeholder="7.5"
                />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                    <div className="flex items-center justify-between">
                        <Label className="flex items-center gap-1.5">Monthly Payment<InfoTip>Auto-calculated using mortgage formula. Tap Edit to enter it yourself.</InfoTip></Label>
                        <button type="button" onClick={() => setManualOverridePayment(!manualOverridePayment)} className="text-xs font-semibold text-violet-300 hover:text-violet-200">
                            {manualOverridePayment ? 'Auto' : 'Edit'}
                        </button>
                    </div>
                    <Input
                        type="number"
                        step="0.01"
                        {...register('monthlyPayment')}
                        placeholder="300000"
                        disabled={!manualOverridePayment}
                        className={!manualOverridePayment ? 'text-muted-foreground' : ''}
                    />
                </div>
                <div className="space-y-2">
                    <div className="flex items-center justify-between">
                        <Label className="flex items-center gap-1.5">Remaining Balance<InfoTip>Auto-calculated based on payments made. Tap Edit to enter it yourself.</InfoTip></Label>
                        <button type="button" onClick={() => setManualOverrideBalance(!manualOverrideBalance)} className="text-xs font-semibold text-violet-300 hover:text-violet-200">
                            {manualOverrideBalance ? 'Auto' : 'Edit'}
                        </button>
                    </div>
                    <Input
                        type="number"
                        step="0.01"
                        {...register('remainingBalance')}
                        placeholder="45000000"
                        disabled={!manualOverrideBalance}
                        className={!manualOverrideBalance ? 'text-muted-foreground' : ''}
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                    <Label>Term, years</Label>
                    <Input
                        type="number"
                        {...register('termYears')}
                        placeholder="20"
                    />
                </div>
                <div className="space-y-2">
                    <Label>Currency</Label>
                    <CurrencySelect
                        value={watch('currency')}
                        onValueChange={(v) => setValue('currency', v)}
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                    <Label>Start Date</Label>
                    <Input type="date" {...register('startDate')} />
                </div>
                <div className="space-y-2">
                    <Label className="flex items-center gap-1.5">Payment day<InfoTip>Day of the month the payment is due (1–31).</InfoTip></Label>
                    <Input
                        type="number"
                        min="1"
                        max="31"
                        {...register('paymentDay')}
                        placeholder="1"
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                    <Label>Status</Label>
                    <Select
                        onValueChange={(v) => setValue('status', v as 'active' | 'paid_off' | 'defaulted')}
                        defaultValue={watch('status')}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="Select" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="active">Active</SelectItem>
                            <SelectItem value="paid_off">Paid Off</SelectItem>
                            <SelectItem value="defaulted">Defaulted</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <div className="flex gap-3 pt-4">
                <Button type="button" variant="outline" onClick={onCancel} className="flex-1">
                    Cancel
                </Button>
                <Button type="submit" className="flex-1 gap-2" disabled={createMortgage.isLoading}>
                    {!createMortgage.isLoading && <Plus className="h-4 w-4" />}
                    {createMortgage.isLoading ? 'Saving...' : 'Add Mortgage'}
                </Button>
            </div>
        </form>
    );
}
