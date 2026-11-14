import type { FieldErrors, UseFormRegister, UseFormSetValue, UseFormWatch } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CurrencySelect } from '@/components/CurrencySelect';
import { CurrencyDisplay } from '@/components/CurrencyDisplay';
import { GlassCard, Segmented, tint } from '@/components/ui/glass';
import { cn } from '@/lib/utils';

export const subscriptionTypes = [
    { value: 'general', label: 'Subscription', icon: '🔄', color: '#6366f1' },
    { value: 'mobile', label: 'Mobile', icon: '📱', color: '#3b82f6' },
    { value: 'credit', label: 'Credit', icon: '💳', color: '#ef4444' },
    { value: 'mortgage', label: 'Mortgage', icon: '🏠', color: '#10b981' },
] as const;

const frequencies = [
    { value: 'daily', label: 'Daily' },
    { value: 'weekly', label: 'Weekly' },
    { value: 'monthly', label: 'Monthly' },
    { value: 'yearly', label: 'Yearly' },
] as const;

interface SubscriptionFieldsProps {
    // Shared by the standalone sheet and the universal add sheet, which use slightly different schemas
    register: UseFormRegister<any>;
    watch: UseFormWatch<any>;
    setValue: UseFormSetValue<any>;
    errors: FieldErrors<any>;
}

export function SubscriptionFields({ register, watch, setValue, errors }: SubscriptionFieldsProps) {
    const type = watch('type');
    const color: string = watch('color') || '#6366f1';
    const amount = Number(watch('amount')) || 0;
    const frequency: string = watch('frequency') || 'monthly';

    return (
        <div className="space-y-5">
            {/* Live preview */}
            <GlassCard auraColor={color} auraPosition={{ cx: 100, cy: 0 }} className="p-4">
                <div className="relative flex items-center gap-3">
                    <span
                        className="flex size-12 shrink-0 items-center justify-center rounded-2xl text-2xl"
                        style={{ backgroundColor: tint(color, 0.18), boxShadow: `inset 0 0 0 1px ${tint(color, 0.35)}` }}
                    >
                        {watch('icon')}
                    </span>
                    <div className="min-w-0 flex-1">
                        <p className="truncate font-semibold">{watch('name') || 'Subscription name'}</p>
                        <p className="text-xs capitalize text-muted-foreground">{frequency}</p>
                    </div>
                    <CurrencyDisplay amount={amount} currency={watch('currency')} className="text-lg font-bold" />
                </div>
            </GlassCard>

            <div className="space-y-2">
                <Label>Type</Label>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                    {subscriptionTypes.map((option) => {
                        const active = type === option.value;
                        return (
                            <button
                                key={option.value}
                                type="button"
                                onClick={() => setValue('type', option.value)}
                                className={cn(
                                    'flex flex-col items-center gap-1 rounded-2xl border px-2 py-3 text-xs font-semibold transition-all',
                                    active ? 'text-foreground' : 'border-white/10 bg-white/[0.03] text-muted-foreground hover:bg-white/[0.06]'
                                )}
                                style={active ? { borderColor: tint(option.color, 0.6), backgroundColor: tint(option.color, 0.14) } : undefined}
                            >
                                <span className="text-xl">{option.icon}</span>
                                {option.label}
                            </button>
                        );
                    })}
                </div>
            </div>

            <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input id="name" placeholder="e.g., Netflix, Phone Bill, Car Loan" {...register('name')} />
                {errors.name && <p className="text-xs text-red-400">{String(errors.name.message)}</p>}
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-[minmax(0,1fr)_minmax(0,190px)]">
                <div className="min-w-0 space-y-2">
                    <Label htmlFor="amount">Amount</Label>
                    <Input
                        id="amount"
                        type="number"
                        step="0.01"
                        inputMode="decimal"
                        placeholder="0.00"
                        className="text-lg font-semibold tabular-nums"
                        {...register('amount', { valueAsNumber: true })}
                    />
                    {errors.amount && <p className="text-xs text-red-400">{String(errors.amount.message)}</p>}
                </div>
                <div className="min-w-0 space-y-2">
                    <Label>Currency</Label>
                    <CurrencySelect value={watch('currency')} onValueChange={(v) => setValue('currency', v)} />
                </div>
            </div>

            <div className="space-y-2">
                <Label>Repeats</Label>
                <Segmented
                    className="sm:w-full sm:[&>button]:flex-1"
                    value={frequency}
                    onChange={(v) => setValue('frequency', v)}
                    options={frequencies.map((f) => ({ value: f.value, label: f.label }))}
                />
            </div>

            <div className="grid grid-cols-2 gap-3">
                <div className="min-w-0 space-y-2">
                    <Label htmlFor="startDate">Starts</Label>
                    <Input id="startDate" type="date" {...register('startDate')} />
                </div>
                <div className="min-w-0 space-y-2">
                    <Label htmlFor="endDate">Ends <span className="text-muted-foreground">(optional)</span></Label>
                    <Input id="endDate" type="date" {...register('endDate')} />
                </div>
            </div>

            <div className="space-y-2">
                <Label htmlFor="description">Note <span className="text-muted-foreground">(optional)</span></Label>
                <Input id="description" placeholder="Additional notes..." {...register('description')} />
            </div>
        </div>
    );
}
