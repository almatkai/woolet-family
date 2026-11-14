import { useState } from 'react';
import { useIsMobile } from '@/hooks/use-mobile';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus } from 'lucide-react';
import { toast } from 'sonner';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { CardVisualPicker } from '@/components/CardVisualPicker';
import { serializeAccountVisual } from '@/lib/image-utils';

const createAccountSchema = z.object({
    name: z.string().min(1, "Name is required"),
    type: z.enum(['checking', 'savings', 'card', 'crypto', 'investment', 'cash']),
    last4Digits: z.string().length(4, "Must be exactly 4 digits").optional().or(z.literal('')),
    icon: z.string().optional(),
});

type CreateAccountForm = z.infer<typeof createAccountSchema>;

interface AddAccountSheetProps {
    bankId: string;
    bankName: string;
    trigger?: React.ReactNode;
}

export function AddAccountSheet({ bankId, bankName, trigger }: AddAccountSheetProps) {
    const [open, setOpen] = useState(false);
    const isCompactMobile = useIsMobile(470);
    const [cardColor, setCardColor] = useState('#8B5CF6');
    const [cardSkin, setCardSkin] = useState<string | undefined>(undefined);
    const utils = trpc.useUtils();

    const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<CreateAccountForm>({
        resolver: zodResolver(createAccountSchema),
        defaultValues: {
            type: 'checking',
            icon: '💳'
        }
    });

    const createAccount = trpc.account.create.useMutation({
        onSuccess: () => {
            utils.bank.getHierarchy.invalidate();
            setOpen(false);
            reset();
            setCardColor('#8B5CF6');
            setCardSkin(undefined);
            toast.success('Account created successfully');
        },
        onError: (error: unknown) => {
            console.error("Failed to create account:", error);
            toast.error('Failed to create account');
        }
    });

    const onSubmit = (data: CreateAccountForm) => {
        const visualString = serializeAccountVisual({
            icon: data.icon || '💳',
            color: cardColor,
            skinUrl: cardSkin,
        });

        createAccount.mutate({
            bankId,
            ...data,
            icon: visualString,
            last4Digits: data.last4Digits || undefined, // Send undefined if empty string
        });
    };

    const watchName = watch('name');
    const watchLast4 = watch('last4Digits');

    return (
        <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
                {trigger || (
                    <Button variant="outline" size="sm" className="gap-1">
                        <Plus className="h-3 w-3" />
                        Add Account
                    </Button>
                )}
            </SheetTrigger>
            <SheetContent side={isCompactMobile ? "bottom" : "right"} className="overflow-y-auto max-h-[100dvh] w-full sm:max-w-md max-[470px]:h-[92dvh] max-[470px]:pb-[calc(env(safe-area-inset-bottom)+1rem)]">
                <SheetHeader>
                    <SheetTitle>Add Account to {bankName}</SheetTitle>
                    <SheetDescription>
                        Create a card or account with custom color, skin, and details.
                    </SheetDescription>
                </SheetHeader>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 pt-4">
                    {/* Live Card Preview & Color / Skin Picker */}
                    <CardVisualPicker
                        color={cardColor}
                        skinUrl={cardSkin}
                        onColorChange={setCardColor}
                        onSkinChange={setCardSkin}
                        cardName={watchName}
                        last4Digits={watchLast4}
                    />

                    <div className="space-y-2">
                        <Label htmlFor="name">Account Name</Label>
                        <Input id="name" placeholder="Main Card" {...register('name')} />
                        {errors.name && <p className="text-sm text-red-500">{errors.name.message}</p>}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="last4Digits">Last 4 Digits (Optional)</Label>
                        <Input
                            id="last4Digits"
                            placeholder="1234"
                            maxLength={4}
                            {...register('last4Digits')}
                        />
                        {errors.last4Digits && <p className="text-sm text-red-500">{errors.last4Digits.message}</p>}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="type">Type</Label>
                        <Select onValueChange={(val: any) => setValue('type', val)} defaultValue={watch('type')}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select type" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="checking">Checking</SelectItem>
                                <SelectItem value="savings">Savings</SelectItem>
                                <SelectItem value="card">Card</SelectItem>
                                <SelectItem value="crypto">Crypto</SelectItem>
                                <SelectItem value="investment">Investment</SelectItem>
                                <SelectItem value="cash">Cash</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="icon">Emoji / Symbol</Label>
                        <Input id="icon" placeholder="💳" {...register('icon')} />
                    </div>

                    <SheetFooter className="pt-2">
                        <SheetClose asChild>
                            <Button variant="outline" type="button">Cancel</Button>
                        </SheetClose>
                        <Button type="submit" disabled={createAccount.isLoading}>
                            {createAccount.isLoading ? 'Creating...' : 'Create Account'}
                        </Button>
                    </SheetFooter>
                </form>
            </SheetContent>
        </Sheet>
    );
}
