import { Notice, sheetClass } from './shared';
import { format } from 'date-fns';
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

import { useEffect, useRef } from 'react';
import { Copy, Check } from 'lucide-react';
import { Input } from '@/components/ui/input';
import type { InviteResult } from './types';
type InviteSheetProps = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    defaultRole?: 'adult' | 'child';
};

export function InviteSheet(props: InviteSheetProps) {
    return props.open ? <InviteSheetContent key={props.defaultRole ?? 'adult'} {...props} /> : null;
}

function InviteSheetContent({
    open,
    onOpenChange,
    defaultRole = 'adult',
}: InviteSheetProps) {
    const compact = useIsMobile(470);
    const utils = trpc.useContext();
    const [email, setEmail] = useState('');
    const [role, setRole] = useState(defaultRole);
    const [guardian, setGuardian] = useState(false);
    const [result, setResult] = useState<InviteResult | null>(null);
    const [copied, setCopied] = useState(false);
    const [copyError, setCopyError] = useState('');
    const timer = useRef<ReturnType<typeof setTimeout>>();
    const mutation = trpc.household.invite.useMutation({
        onSuccess: (data: InviteResult) => {
            setResult(data);
            void utils.household.get.invalidate();
            void utils.household.invitations.invalidate();
        },
    });
    const reset = () => {
        setResult(null);
        setEmail('');
        setRole(defaultRole);
        setGuardian(false);
        setCopied(false);
        setCopyError('');
        mutation.reset();
    };
    useEffect(() => {
        return () => clearTimeout(timer.current);
    }, []);
    const link = result
        ? `${window.location.origin}/family/join?token=${result.token}`
        : '';
    const copy = async () => {
        try {
            await navigator.clipboard.writeText(link);
            setCopied(true);
            setCopyError('');
            toast.success('Link copied');
            clearTimeout(timer.current);
            timer.current = setTimeout(() => setCopied(false), 2000);
        } catch {
            setCopyError(
                "Couldn't copy. Select the link and copy it manually.",
            );
        }
    };
    return (
        <Sheet
            open={open}
            onOpenChange={(value) => {
                if (!mutation.isLoading) onOpenChange(value);
            }}
        >
            <SheetContent
                side={compact ? 'bottom' : 'right'}
                className={sheetClass}
            >
                <SheetHeader>
                    <SheetTitle>Invite to family</SheetTitle>
                    <SheetDescription>
                        You'll get a link to send yourself. The person signs in
                        with this email to join.
                    </SheetDescription>
                </SheetHeader>
                {result ? (
                    <div className="mt-6 space-y-4">
                        <h3 className="text-base font-semibold">
                            Invite link ready
                        </h3>
                        <p className="text-sm text-muted-foreground">
                            Send this link to {email} yourself. Woolet doesn't
                            email it. It expires on{' '}
                            {format(new Date(result.expiresAt), 'MMM d')}.
                        </p>
                        <div className="flex flex-col gap-2 sm:flex-row">
                            <Input
                                aria-label="Invite link"
                                readOnly
                                value={link}
                                className="min-w-0 font-mono text-xs"
                                onFocus={(event) => event.target.select()}
                            />
                            <Button onClick={copy}>
                                {copied ? (
                                    <Check className="size-4" />
                                ) : (
                                    <Copy className="size-4" />
                                )}
                                {copied ? 'Copied' : 'Copy link'}
                            </Button>
                            {typeof navigator.share === 'function' && (
                                <Button
                                    variant="outline"
                                    onClick={() => {
                                        void navigator
                                            .share({ url: link })
                                            .catch(() => {});
                                    }}
                                >
                                    Share
                                </Button>
                            )}
                        </div>
                        {copyError && <Notice tone="error">{copyError}</Notice>}
                        <div className="flex flex-wrap gap-2">
                            <Button variant="outline" onClick={reset}>
                                Invite someone else
                            </Button>
                            <Button onClick={() => onOpenChange(false)}>
                                Done
                            </Button>
                        </div>
                    </div>
                ) : (
                    <form
                        className="mt-6 space-y-4"
                        onSubmit={(event) => {
                            event.preventDefault();
                            mutation.mutate({
                                email: email.trim(),
                                role,
                                isGuardian: role === 'adult' && guardian,
                            });
                        }}
                    >
                        <div className="space-y-2">
                            <Label htmlFor="invite-email">Email</Label>
                            <Input
                                id="invite-email"
                                type="email"
                                autoComplete="off"
                                required
                                value={email}
                                onChange={(event) =>
                                    setEmail(event.target.value)
                                }
                                disabled={mutation.isLoading}
                            />
                        </div>
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
                                        Can manage children's wallets, limits
                                        and top-ups.
                                    </span>
                                </span>
                                <Switch
                                    checked={guardian}
                                    onCheckedChange={setGuardian}
                                    disabled={mutation.isLoading}
                                />
                            </label>
                        )}
                        <Notice tone="info">
                            Members keep their own Woolet plan. Family doesn't
                            share your subscription.
                        </Notice>
                        {mutation.error && (
                            <Notice tone="error">
                                {mutation.error.message ===
                                'This email is already a family member'
                                    ? `${email} is already in your family.`
                                    : mutation.error.message ===
                                        'This family is full'
                                      ? 'Your family is full. Remove a member to invite someone else.'
                                      : mutation.error.message}
                            </Notice>
                        )}
                        <Button
                            className="w-full"
                            disabled={mutation.isLoading || !email.trim()}
                        >
                            {mutation.isLoading
                                ? 'Creating...'
                                : 'Create invite link'}
                        </Button>
                    </form>
                )}
            </SheetContent>
        </Sheet>
    );
}
