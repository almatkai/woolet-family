import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { trpc } from '@/lib/trpc';
import { useIsMobile } from '@/hooks/use-mobile';
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetDescription,
} from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Notice, sheetClass } from './shared';
export function CreateFamilySheet({
    open,
    onOpenChange,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}) {
    const [name, setName] = useState('');
    const compact = useIsMobile(470);
    const utils = trpc.useContext();
    const mutation = trpc.household.create.useMutation({
        onSuccess: () => {
            void utils.household.get.invalidate();
            onOpenChange(false);
            setName('');
            toast.success('Family created');
        },
    });
    useEffect(() => {
        if (open) mutation.reset();
    }, [open]);
    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent
                side={compact ? 'bottom' : 'right'}
                className={sheetClass}
            >
                <SheetHeader>
                    <SheetTitle>Create family</SheetTitle>
                    <SheetDescription>
                        You'll be the owner and can invite up to 5 people.
                    </SheetDescription>
                </SheetHeader>
                <form
                    className="mt-6 space-y-4"
                    onSubmit={(event) => {
                        event.preventDefault();
                        if (name.trim()) mutation.mutate({ name: name.trim() });
                    }}
                >
                    <div className="space-y-2">
                        <Label htmlFor="family-name">Family name</Label>
                        <Input
                            id="family-name"
                            value={name}
                            onChange={(event) => setName(event.target.value)}
                            placeholder="e.g., Home"
                            maxLength={60}
                            required
                        />
                    </div>
                    <Notice tone="info">
                        Family is free. Members keep their own Woolet plan; your
                        plan isn't shared.
                    </Notice>
                    {mutation.error && (
                        <Notice tone="error">{mutation.error.message}</Notice>
                    )}
                    <Button
                        className="w-full"
                        disabled={mutation.isLoading || !name.trim()}
                    >
                        {mutation.isLoading ? 'Creating...' : 'Create family'}
                    </Button>
                </form>
            </SheetContent>
        </Sheet>
    );
}
