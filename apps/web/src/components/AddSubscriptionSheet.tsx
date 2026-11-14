import { useEffect, useState } from 'react';
import { SubscriptionFields } from '@/components/subscriptions/SubscriptionFields';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { trpc } from '@/lib/trpc';
import { useIsMobile } from '@/hooks/use-mobile';
import { Button } from '@/components/ui/button';
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetFooter,
    SheetClose
} from '@/components/ui/sheet';

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

interface AddSubscriptionSheetProps {
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
    editingSubscription?: {
        id: string;
        name: string;
        type: string;
        amount: string;
        currency: string;
        frequency: string;
        billingDay: number | null;
        startDate: string;
        endDate: string | null;
        icon: string;
        color: string;
        description: string | null;
    };
}

const typeIcons: Record<string, { icon: string; color: string }> = {
    mobile: { icon: '📱', color: '#3b82f6' },
    general: { icon: '🔄', color: '#6366f1' },
    credit: { icon: '💳', color: '#ef4444' },
    mortgage: { icon: '🏠', color: '#10b981' },
};

export function AddSubscriptionSheet({ open: controlledOpen, onOpenChange: controlledOnOpenChange, editingSubscription }: AddSubscriptionSheetProps = {}) {
    const isCompactMobile = useIsMobile(470);
    const [internalOpen, setInternalOpen] = useState(false);
    const open = controlledOpen !== undefined ? controlledOpen : internalOpen;
    const setOpen = controlledOnOpenChange || setInternalOpen;
    const isControlled = controlledOpen !== undefined;

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

    useEffect(() => {
        if (editingSubscription) {
            reset({
                name: editingSubscription.name,
                type: editingSubscription.type as any,
                amount: Number(editingSubscription.amount),
                currency: editingSubscription.currency,
                frequency: editingSubscription.frequency as any,
                startDate: editingSubscription.startDate,
                endDate: editingSubscription.endDate || undefined,
                icon: editingSubscription.icon,
                color: editingSubscription.color,
                description: editingSubscription.description || undefined,
            });
        }
    }, [editingSubscription, reset]);

    const createSubscription = trpc.subscription.create.useMutation({
        onSuccess: () => {
            utils.subscription.list.invalidate();
            utils.subscription.getUpcoming.invalidate();
            utils.subscription.getCalendarView.invalidate();
            toast.success('Subscription created successfully');
            setOpen(false);
            reset();
        },
        onError: (error: any) => {
            toast.error(error.message || 'Failed to create subscription');
        }
    });

    const updateSubscription = trpc.subscription.update.useMutation({
        onSuccess: () => {
            utils.subscription.list.invalidate();
            utils.subscription.getUpcoming.invalidate();
            utils.subscription.getCalendarView.invalidate();
            toast.success('Subscription updated successfully');
            setOpen(false);
            reset();
        },
        onError: (error: any) => {
            toast.error(error.message || 'Failed to update subscription');
        }
    });

    const onSubmit = (data: SubscriptionFormData) => {
        if (editingSubscription) {
            updateSubscription.mutate({ id: editingSubscription.id, ...data });
        } else {
            createSubscription.mutate(data);
        }
    };

    const handleClose = () => {
        setOpen(false);
        reset();
    };

    return (
        <Sheet open={open} onOpenChange={handleClose}>
            <SheetContent
                side={isCompactMobile ? 'bottom' : 'right'}
                className="overflow-y-auto sm:max-w-[480px] max-[470px]:h-[92dvh] max-[470px]:rounded-t-2xl max-[470px]:pb-[calc(env(safe-area-inset-bottom)+1.5rem)]"
            >
                <SheetHeader>
                    <SheetTitle>{editingSubscription ? 'Edit Subscription' : 'Add Subscription'}</SheetTitle>
                </SheetHeader>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 pt-6">
                    <SubscriptionFields register={register} watch={watch} setValue={setValue} errors={errors} />

                    <SheetFooter className="sticky bottom-0 -mx-6 gap-2 border-t border-white/10 bg-background/90 px-6 py-4 backdrop-blur-xl sm:space-x-0">
                        <SheetClose asChild>
                            <Button variant="outline" type="button" className="h-11 flex-1 rounded-xl">Cancel</Button>
                        </SheetClose>
                        <Button
                            type="submit"
                            className="h-11 flex-1 rounded-xl"
                            disabled={createSubscription.isPending || updateSubscription.isPending}
                        >
                            {(createSubscription.isPending || updateSubscription.isPending)
                                ? 'Saving...'
                                : editingSubscription ? 'Update' : 'Create'
                            }
                        </Button>
                    </SheetFooter>
                </form>
            </SheetContent>
        </Sheet>
    );
}
