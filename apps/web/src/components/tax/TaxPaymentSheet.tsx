import { useEffect } from 'react';
import { format, parseISO } from 'date-fns';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { trpc } from '@/lib/trpc';
import { useIsMobile } from '@/hooks/use-mobile';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Segmented } from '@/components/ui/glass';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TaxDisclaimer, sheetClass } from './shared';
const usd = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });
const schema = z.object({
    jurisdiction: z.enum(['federal', 'state']),
    quarter: z.number().int().min(1).max(4),
    amount: z
        .number({ invalid_type_error: 'Enter an amount greater than zero' })
        .finite()
        .positive('Enter an amount greater than zero')
        .max(999999999)
        .optional()
        .refine((amount): amount is number => amount !== undefined, 'Enter an amount greater than zero'),
    paidOn: z
        .string()
        .min(1, 'Enter a date')
        .refine(
            (v) =>
                /^\d{4}-\d{2}-\d{2}$/.test(v) &&
                Number.isFinite(Date.parse(v)) &&
                new Date(v).toISOString().slice(0, 10) === v,
            'Enter a valid date',
        )
        .refine((v) => v <= format(new Date(), 'yyyy-MM-dd'), 'Paid on cannot be in the future'),
    transactionId: z.string().uuid().nullable(),
    note: z.string().max(1000),
});
type Values = z.input<typeof schema>;
type Expense = {
    id: string;
    description: string | null;
    date: string;
    amount: string;
    currencyBalance: { currencyCode: string };
};
export function TaxPaymentSheet({
    open,
    onOpenChange,
    year,
    quarter = 1,
    suggestedAmount,
}: {
    open: boolean;
    onOpenChange: (v: boolean) => void;
    year: 2025 | 2026;
    quarter?: number;
    suggestedAmount?: number;
}) {
    const isCompactMobile = useIsMobile(470),
        utils = trpc.useUtils();
    const {
        register,
        handleSubmit,
        control,
        setValue,
        getFieldState,
        getValues,
        reset,
        formState: { errors },
    } = useForm<Values, unknown, z.output<typeof schema>>({ resolver: zodResolver(schema) });
    const watched = useWatch({ control });
    useEffect(() => {
        if (open)
            reset({
                jurisdiction: 'federal',
                quarter,
                amount: suggestedAmount !== undefined && suggestedAmount > 0 ? suggestedAmount : undefined,
                paidOn: format(new Date(), 'yyyy-MM-dd'),
                transactionId: null,
                note: '',
            });
    }, [open, quarter, suggestedAmount, year, reset]);
    const query = trpc.transaction.list.useQuery({ type: 'expense', limit: 100 }, { enabled: open });
    const expenses: Expense[] = query.data?.transactions ?? [];
    const mutation = trpc.tax.addEstimatedPayment.useMutation({
        onSuccess: () => {
            void utils.tax.invalidate();
            toast.success('Payment added');
            onOpenChange(false);
        },
        onError: (e: { message: string }) => toast.error(e.message),
    });
    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent side={isCompactMobile ? 'bottom' : 'right'} className={sheetClass}>
                <SheetHeader>
                    <SheetTitle>Add estimated payment</SheetTitle>
                    <SheetDescription>
                        Record a 1040-ES or state estimated payment you've already made.
                    </SheetDescription>
                </SheetHeader>
                <form
                    className="mt-6 space-y-4"
                    onSubmit={handleSubmit((v) => mutation.mutate({ ...v, taxYear: year }))}
                >
                    <div className="space-y-2">
                        <Label className="block">Paid to</Label>
                        <Segmented
                            value={watched.jurisdiction ?? 'federal'}
                            onChange={(v) => {
                                setValue('jurisdiction', v);
                                if (!getFieldState('amount').isDirty) {
                                    setValue('amount', undefined);
                                    if (
                                        v === 'federal' &&
                                        getValues('quarter') === quarter &&
                                        suggestedAmount !== undefined &&
                                        suggestedAmount > 0
                                    ) {
                                        setValue('amount', suggestedAmount);
                                    }
                                }
                            }}
                            options={[
                                { value: 'federal', label: 'Federal' },
                                { value: 'state', label: 'State' },
                            ]}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="tax-quarter">Quarter</Label>
                        <Select
                            value={String(watched.quarter ?? quarter)}
                            onValueChange={(v) => {
                                setValue('quarter', Number(v));
                                if (!getFieldState('amount').isDirty) setValue('amount', undefined);
                            }}
                        >
                            <SelectTrigger id="tax-quarter">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {[1, 2, 3, 4].map((q) => (
                                    <SelectItem key={q} value={String(q)}>
                                        Q{q}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                            <Label htmlFor="tax-payment-amount">Amount, $</Label>
                            <Input
                                id="tax-payment-amount"
                                type="number"
                                step="0.01"
                                {...register('amount', { valueAsNumber: true })}
                            />
                            {errors.amount && (
                                <p className="text-xs text-destructive">{errors.amount.message}</p>
                            )}
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="tax-paid-on">Paid on</Label>
                            <Input
                                id="tax-paid-on"
                                type="date"
                                max={format(new Date(), 'yyyy-MM-dd')}
                                {...register('paidOn')}
                            />
                            {errors.paidOn && (
                                <p className="text-xs text-destructive">{errors.paidOn.message}</p>
                            )}
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="tax-linked-transaction">Link to a transaction (optional)</Label>
                        <Select
                            value={watched.transactionId ?? 'none'}
                            onValueChange={(v) => setValue('transactionId', v === 'none' ? null : v)}
                        >
                            <SelectTrigger id="tax-linked-transaction">
                                <SelectValue placeholder="Select transaction" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="none">No transaction</SelectItem>
                                {expenses.map((t) => {
                                    const amount = t.currencyBalance.currencyCode === 'USD'
                                        ? usd.format(Number(t.amount))
                                        : new Intl.NumberFormat('en-US', {
                                            style: 'currency',
                                            currency: t.currencyBalance.currencyCode,
                                        }).format(Number(t.amount));
                                    return (
                                        <SelectItem key={t.id} value={t.id}>
                                            {`${format(parseISO(t.date), 'MMM d')} · ${t.description || 'Expense'} · ${amount}`}
                                        </SelectItem>
                                    );
                                })}
                            </SelectContent>
                        </Select>
                        {query.error && <p className="text-xs text-destructive">{query.error.message}</p>}
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="tax-payment-note">Note</Label>
                        <Input
                            id="tax-payment-note"
                            placeholder="e.g., IRS Direct Pay confirmation"
                            {...register('note')}
                        />
                        {errors.note && <p className="text-xs text-destructive">{errors.note.message}</p>}
                    </div>
                    <Button type="submit" className="w-full" disabled={mutation.isLoading}>
                        {mutation.isLoading ? 'Saving...' : 'Add payment'}
                    </Button>
                    <TaxDisclaimer year={year} />
                </form>
            </SheetContent>
        </Sheet>
    );
}
