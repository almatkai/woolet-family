import { SubscriptionFields } from '@/components/subscriptions/SubscriptionFields';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus } from 'lucide-react';
import { toast } from 'sonner';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';

const subscriptionSchema = z.object({
    name: z.string().min(1, 'Name is required').max(100),
    type: z.enum(['mobile', 'general', 'credit', 'mortgage']),
    amount: z.number().positive('Amount must be positive'),
    currency: z.string().length(3),
    frequency: z.enum(['daily', 'weekly', 'monthly', 'yearly']),
    startDate: z.string(),
    endDate: z.string().optional(),
    icon: z.string(),
    color: z.string(),
    description: z.string().optional(),
});

type SubscriptionFormData = z.infer<typeof subscriptionSchema>;

interface AddSubscriptionFormProps {
    onSuccess: () => void;
    onCancel: () => void;
}

const typeIcons: Record<string, { icon: string; color: string }> = {
    mobile: { icon: '📱', color: '#3b82f6' },
    general: { icon: '🔄', color: '#6366f1' },
    credit: { icon: '💳', color: '#ef4444' },
    mortgage: { icon: '🏠', color: '#10b981' },
};

export function AddSubscriptionForm({ onSuccess, onCancel }: AddSubscriptionFormProps) {
    const utils = trpc.useUtils();

    const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<SubscriptionFormData>({
        resolver: zodResolver(subscriptionSchema),
        defaultValues: {
            type: 'general',
            currency: '',
            frequency: 'monthly',
            startDate: new Date().toISOString().split('T')[0],
            icon: '🔄',
            color: '#6366f1',
        }
    });

    const selectedType = watch('type');

    useEffect(() => {
        if (selectedType && typeIcons[selectedType]) {
            setValue('icon', typeIcons[selectedType].icon);
            setValue('color', typeIcons[selectedType].color);
        }
    }, [selectedType, setValue]);

    const createSubscription = trpc.subscription.create.useMutation({
        onSuccess: () => {
            utils.subscription.list.invalidate();
            utils.subscription.getUpcoming.invalidate();
            utils.subscription.getCalendarView.invalidate();
            toast.success('Subscription created successfully');
            reset();
            onSuccess();
        },
        onError: (error: any) => {
            toast.error(error.message || 'Failed to create subscription');
        }
    });

    const onSubmit = (data: SubscriptionFormData) => {
        createSubscription.mutate(data);
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <SubscriptionFields register={register} watch={watch} setValue={setValue} errors={errors} />

            <div className="flex gap-3 pt-4">
                <Button type="button" variant="outline" onClick={onCancel} className="h-11 flex-1 rounded-xl">
                    Cancel
                </Button>
                <Button
                    type="submit"
                    disabled={createSubscription.isPending}
                    className="h-11 flex-1 gap-2 rounded-xl"
                >
                    {!createSubscription.isPending && <Plus className="h-4 w-4" />}
                    {createSubscription.isPending ? 'Saving...' : 'Create Subscription'}
                </Button>
            </div>
        </form>
    );
}
