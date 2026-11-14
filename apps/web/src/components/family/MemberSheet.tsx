import { Notice, InlineConfirm, sheetClass } from './shared';
import { useState } from 'react';
import { toast } from 'sonner';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';

import { useIsMobile } from '@/hooks/use-mobile';
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetDescription,
} from '@/components/ui/sheet';
import { Segmented } from '@/components/ui/glass';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

import type { HouseholdMember } from './types';
export function MemberSheet({
    member,
    onClose,
}: {
    member: HouseholdMember;
    onClose: () => void;
}) {
    const compact = useIsMobile(470);
    const utils = trpc.useContext();
    const [role, setRole] = useState<'adult' | 'child'>(
        member.role === 'child' ? 'child' : 'adult',
    );
    const [guardian, setGuardian] = useState(member.isGuardian);
    const [confirm, setConfirm] = useState(false);
    const invalidate = () => {
        void utils.household.invalidate();
        onClose();
    };
    const update = trpc.household.updateMember.useMutation({
        onSuccess: invalidate,
    });
    const remove = trpc.household.removeMember.useMutation({
        onSuccess: () => {
            invalidate();
            toast.success(`${member.name} removed`);
        },
    });
    const busy = update.isLoading || remove.isLoading;
    return (
        <Sheet
            open
            onOpenChange={(value) => {
                if (!value && !busy) onClose();
            }}
        >
            <SheetContent
                side={compact ? 'bottom' : 'right'}
                className={sheetClass}
            >
                <SheetHeader>
                    <SheetTitle>{member.name}</SheetTitle>
                    <SheetDescription>{member.email}</SheetDescription>
                </SheetHeader>
                <div className="mt-6 space-y-4">
                    <div className="space-y-2">
                        <Label className="block">Role</Label>
                        <Segmented
                            value={role}
                            onChange={setRole}
                            options={[
                                { value: 'adult', label: 'Adult' },
                                { value: 'child', label: 'Child' },
                            ]}
                        />
                    </div>
                    {role === 'adult' && (
                        <label className="flex min-h-11 cursor-pointer items-center justify-between gap-3">
                            <span className="text-sm font-medium">
                                Guardian
                                <span className="block text-xs text-muted-foreground">
                                    Can manage children's wallets, limits and
                                    top-ups.
                                </span>
                            </span>
                            <Switch
                                checked={guardian}
                                onCheckedChange={setGuardian}
                                disabled={busy}
                            />
                        </label>
                    )}
                    {(update.error || remove.error) && (
                        <Notice tone="error">
                            {update.error?.message || remove.error?.message}
                        </Notice>
                    )}
                    <Button
                        className="w-full"
                        disabled={
                            busy ||
                            (role === member.role &&
                                (role === 'adult' ? guardian : false) ===
                                    member.isGuardian)
                        }
                        onClick={() =>
                            update.mutate({
                                memberId: member.id,
                                role,
                                isGuardian: role === 'adult' && guardian,
                            })
                        }
                    >
                        {update.isLoading ? 'Saving...' : 'Save changes'}
                    </Button>
                    <div className="mt-8 border-t border-border pt-4 dark:border-white/10">
                        {confirm ? (
                            <InlineConfirm
                                message={`Remove ${member.name} from the family? They lose access to family wallets right away. Transactions they added are kept.`}
                                confirmLabel="Remove"
                                pending={remove.isLoading}
                                onCancel={() => setConfirm(false)}
                                onConfirm={() =>
                                    remove.mutate({ memberId: member.id })
                                }
                            />
                        ) : (
                            <Button
                                variant="outline"
                                className="text-red-700 dark:text-red-400"
                                disabled={busy}
                                onClick={() => setConfirm(true)}
                            >
                                Remove from family
                            </Button>
                        )}
                    </div>
                </div>
            </SheetContent>
        </Sheet>
    );
}
