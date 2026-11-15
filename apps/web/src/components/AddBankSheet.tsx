import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Building2, Plus, Crown } from 'lucide-react';
import { toast } from 'sonner';
import { trpc } from '@/lib/trpc';
import { ActionButton } from '@/components/ui/action-button';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { IconPicker } from '@/components/IconPicker';
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
    SheetFooter,
    SheetClose
} from '@/components/ui/sheet';
import { useIsMobile } from '@/hooks/use-mobile';
import { useSubscription } from '@/hooks/useSubscription';
import { usePricing } from '@/components/PricingContext';

const createBankSchema = z.object({
    name: z.string().trim().min(1, "Name is required"),
    color: z.string().optional(),
    icon: z.string().optional(),
});

type CreateBankForm = z.infer<typeof createBankSchema>;

export function AddBankSheet({ trigger }: { trigger?: React.ReactNode }) {
    const [open, setOpen] = useState(false);
    const isCompactMobile = useIsMobile(470);
    const utils = trpc.useUtils();
    const { isPaid, usage, limits } = useSubscription();
    const { openPricing } = usePricing();

    const isAtLimit = !isPaid && limits?.maxBanks !== undefined && usage?.banks !== undefined && usage.banks >= limits.maxBanks;

    const { register, control, handleSubmit, reset, formState: { errors } } = useForm<CreateBankForm>({
        resolver: zodResolver(createBankSchema),
        defaultValues: {
            color: '#000000',
            icon: 'Landmark',
        }
    });

    const createBank = trpc.bank.create.useMutation({
        onSuccess: () => {
            utils.bank.getHierarchy.invalidate();
            utils.bank.getLimitsAndUsage.invalidate();
            setOpen(false);
            reset();
            toast.success('Bank added successfully');
        },
        onError: (error: any) => {
            console.error("Failed to create bank:", error);
            const msg = error.message || 'Failed to add bank';
            const isLimit = msg.toLowerCase().includes('limit reached') || msg.toLowerCase().includes('upgrade to pro');
            if (isLimit) {
                toast.error(msg, {
                    action: {
                        label: 'Upgrade',
                        onClick: () => openPricing(),
                    },
                    duration: 6000,
                });
            } else {
                toast.error(msg);
            }
        }
    });

    const onSubmit = (data: CreateBankForm) => {
        createBank.mutate(data);
    };

    return (
        <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
                {trigger || (
                    <ActionButton className="flex-1 sm:flex-none w-full sm:w-auto">
                        <Plus className="h-4 w-4" />
                        Bank
                    </ActionButton>
                )}
            </SheetTrigger>
            <SheetContent
                side={isCompactMobile ? 'bottom' : 'right'}
                className="overflow-y-auto max-[470px]:h-[92dvh] max-[470px]:rounded-t-2xl max-[470px]:pb-[calc(env(safe-area-inset-bottom)+1.5rem)]"
            >
                <SheetHeader>
                    <SheetTitle>Add Bank</SheetTitle>
                    <SheetDescription>
                        Add a bank or brokerage (e.g. Chase, Bank of America, Fidelity).
                    </SheetDescription>
                </SheetHeader>

                {isAtLimit && (
                    <div className="mt-4 rounded-xl border border-amber-500/25 bg-amber-500/10 p-3.5 flex items-start gap-3">
                        <Crown className="size-5 text-amber-400 shrink-0 mt-0.5" />
                        <div className="space-y-1 text-xs flex-1">
                            <p className="font-semibold text-amber-200">
                                Bank limit reached ({usage?.banks}/{limits?.maxBanks})
                            </p>
                            <p className="text-muted-foreground">
                                Free plan is limited to {limits?.maxBanks} banks. Upgrade to Pro for unlimited banks and accounts.
                            </p>
                            <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                className="mt-2 h-7 text-xs border-amber-500/30 text-amber-300 hover:bg-amber-500/20"
                                onClick={() => openPricing()}
                            >
                                Upgrade to Pro
                            </Button>
                        </div>
                    </div>
                )}

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 pt-6">
                    <div className="space-y-2">
                        <Label htmlFor="name">Name</Label>
                        <Input id="name" placeholder="Interactive Brokers" {...register('name')} />
                        {errors.name && <p className="text-sm text-red-500">{errors.name.message}</p>}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="icon">Icon</Label>
                        <Controller
                            control={control}
                            name="icon"
                            render={({ field }) => (
                                <IconPicker
                                    value={field.value}
                                    onChange={field.onChange}
                                />
                            )}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="color">Color</Label>
                        <Input id="color" type="color" {...register('color')} />
                    </div>

                    <SheetFooter className="gap-3 pt-2 sm:space-x-0">
                        <SheetClose asChild>
                            <Button variant="outline" type="button">Cancel</Button>
                        </SheetClose>
                        <Button type="submit" disabled={createBank.isLoading}>
                            {createBank.isLoading ? 'Creating...' : 'Create'}
                        </Button>
                    </SheetFooter>
                </form>
            </SheetContent>
        </Sheet>
    );
}
