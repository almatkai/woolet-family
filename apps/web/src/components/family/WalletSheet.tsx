import { useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { toast } from 'sonner';
import { trpc } from '@/lib/trpc';
import { useIsMobile } from '@/hooks/use-mobile';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Segmented } from '@/components/ui/glass';
import { CurrencySelector } from '@/components/ui/currency-selector';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetDescription,
} from '@/components/ui/sheet';
import { InlineConfirm, Notice, sheetClass } from './shared';
import { InviteSheet } from './InviteSheet';
import type { FamilyWallet, HouseholdOverview, WalletKind } from './types';

export function WalletSheet({
    wallet,
    family,
    onClose,
}: {
    wallet?: FamilyWallet;
    family: NonNullable<HouseholdOverview>;
    onClose: () => void;
}) {
    const compact = useIsMobile(470);
    const navigate = useNavigate();
    const utils = trpc.useContext();
    const preferred = trpc.currency.getPreferred.useQuery();
    const [kind, setKind] = useState<WalletKind>('shared');
    const [name, setName] = useState(wallet?.name ?? '');
    const [child, setChild] = useState('');
    const [currency, setCurrency] = useState('');
    const [confirm, setConfirm] = useState(false);
    const [invite, setInvite] = useState(false);
    const children = family.members.filter((member) => member.role === 'child');
    const done = () => {
        void utils.household.invalidate();
        onClose();
    };
    const create = trpc.household.createWallet.useMutation({
        onSuccess: () => {
            done();
            toast.success('Wallet created');
        },
    });
    const update = trpc.household.updateWallet.useMutation({
        onSuccess: () => {
            done();
            toast.success('Wallet updated');
        },
    });
    const archive = trpc.household.archiveWallet.useMutation({
        onSuccess: () => {
            done();
            void navigate({ to: '/family' });
            toast.success('Wallet archived');
        },
    });
    const busy = create.isLoading || update.isLoading || archive.isLoading;
    const error = create.error || update.error;
    if (invite)
        return (
            <InviteSheet
                open
                defaultRole="child"
                onOpenChange={(open) => {
                    if (!open) setInvite(false);
                }}
            />
        );
    return (
        <Sheet
            open
            onOpenChange={(open) => {
                if (!open && !busy) onClose();
            }}
        >
            <SheetContent
                side={compact ? 'bottom' : 'right'}
                className={sheetClass}
            >
                <SheetHeader>
                    <SheetTitle>
                        {wallet ? 'Wallet settings' : 'New wallet'}
                    </SheetTitle>
                    <SheetDescription>
                        {wallet
                            ? `${wallet.kind === 'shared' ? 'Shared' : 'Child'} · ${wallet.currencyCode}`
                            : 'Wallets hold family money separately from your personal accounts.'}
                    </SheetDescription>
                </SheetHeader>
                <form
                    className="mt-6 space-y-4"
                    onSubmit={(event) => {
                        event.preventDefault();
                        if (wallet)
                            update.mutate({
                                walletId: wallet.id,
                                name: name.trim(),
                            });
                        else
                            create.mutate({
                                kind,
                                name: name.trim(),
                                currencyCode:
                                    currency ||
                                    preferred.data?.defaultCurrency ||
                                    'USD',
                                ...(kind === 'child'
                                    ? { childMemberId: child }
                                    : {}),
                            });
                    }}
                >
                    {!wallet && (
                        <>
                            <div className="space-y-2">
                                <Label id="wallet-type-label" className="block">
                                    Type
                                </Label>
                                <div
                                    role="group"
                                    aria-labelledby="wallet-type-label"
                                >
                                    <Segmented
                                        value={kind}
                                        onChange={setKind}
                                        options={[
                                            {
                                                value: 'shared',
                                                label: 'Shared',
                                            },
                                            { value: 'child', label: 'Child' },
                                        ]}
                                    />
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    {kind === 'shared'
                                        ? 'All adults in the family can see and use it.'
                                        : 'Only the child, the owner and guardians can see it.'}
                                </p>
                            </div>
                            {kind === 'child' && (
                                <div className="space-y-2">
                                    <Label
                                        htmlFor="family-child"
                                        className="block"
                                    >
                                        Child
                                    </Label>
                                    {children.length ? (
                                        <Select
                                            value={child}
                                            onValueChange={(value) => {
                                                setChild(value);
                                                if (!name.trim())
                                                    setName(
                                                        `${children.find((member) => member.id === value)?.name}'s wallet`,
                                                    );
                                            }}
                                        >
                                            <SelectTrigger id="family-child">
                                                <SelectValue placeholder="Select child" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {children.map((member) => (
                                                    <SelectItem
                                                        key={member.id}
                                                        value={member.id}
                                                    >
                                                        {member.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    ) : (
                                        <Notice tone="info">
                                            <span>
                                                Invite a child first.{' '}
                                                <Button
                                                    type="button"
                                                    variant="link"
                                                    onClick={() =>
                                                        setInvite(true)
                                                    }
                                                >
                                                    Invite
                                                </Button>
                                            </span>
                                        </Notice>
                                    )}
                                </div>
                            )}
                        </>
                    )}
                    <div className="space-y-2">
                        <Label htmlFor="wallet-name" className="block">
                            Name
                        </Label>
                        <Input
                            id="wallet-name"
                            value={name}
                            onChange={(event) => setName(event.target.value)}
                            maxLength={60}
                            placeholder="e.g., Groceries"
                            disabled={busy}
                        />
                    </div>
                    {!wallet && (
                        <div className="space-y-2">
                            <Label id="wallet-currency-label" className="block">
                                Currency
                            </Label>
                            <div
                                role="group"
                                aria-labelledby="wallet-currency-label"
                            >
                                <CurrencySelector
                                    value={
                                        currency ||
                                        preferred.data?.defaultCurrency ||
                                        'USD'
                                    }
                                    onValueChange={setCurrency}
                                    disabled={busy}
                                />
                            </div>
                            <p className="text-xs text-muted-foreground">
                                Currency can't be changed later.
                            </p>
                        </div>
                    )}
                    {error && <Notice tone="error">{error.message}</Notice>}
                    <Button
                        className="w-full"
                        disabled={
                            busy ||
                            (!wallet &&
                                !currency &&
                                !preferred.data?.defaultCurrency) ||
                            !name.trim() ||
                            (!wallet && kind === 'child' && !child)
                        }
                    >
                        {busy
                            ? 'Saving...'
                            : wallet
                              ? 'Save changes'
                              : 'Create wallet'}
                    </Button>
                </form>
                {wallet && (
                    <div className="mt-8 border-t border-border pt-4 dark:border-white/10">
                        {archive.error && (
                            <Notice tone="error">
                                {archive.error.message}
                            </Notice>
                        )}
                        {confirm ? (
                            <InlineConfirm
                                message={`Archive ${wallet.name}? It's hidden from the family and can't take new transactions. Its history is kept.`}
                                confirmLabel="Archive"
                                pendingLabel="Archiving..."
                                pending={archive.isLoading}
                                onCancel={() => setConfirm(false)}
                                onConfirm={() =>
                                    archive.mutate({ walletId: wallet.id })
                                }
                            />
                        ) : (
                            <Button
                                variant="outline"
                                className="text-red-700 dark:text-red-400"
                                disabled={busy}
                                onClick={() => setConfirm(true)}
                            >
                                Archive wallet
                            </Button>
                        )}
                    </div>
                )}
            </SheetContent>
        </Sheet>
    );
}
