import { isChildActor } from './permissions';
import { IconDisplay } from '@/components/IconDisplay';
import { useState } from 'react';
import { addDays, format, parseISO } from 'date-fns';
import { toast } from 'sonner';
import { trpc } from '@/lib/trpc';
import { useIsMobile } from '@/hooks/use-mobile';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Segmented } from '@/components/ui/glass';
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
import { FamilyMoney, Notice, sheetClass } from './shared';
import {
    localToday,
    limitViolationOf,
    type FamilyWallet,
    type FamilyLimit,
    type LimitViolation,
    type AddTransactionResult,
    type TransferResult,
} from './types';

export type TransactionSheetMode = 'add' | 'transfer' | 'topup' | 'child';
type Category = {
    id: string;
    name: string;
    userId: string | null;
    type: string;
    icon: string;
};
export function FamilyTransactionSheet({
    open,
    onOpenChange,
    mode,
    wallets,
    presetWalletId,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    mode: TransactionSheetMode;
    wallets: FamilyWallet[];
    presetWalletId?: string;
}) {
    const compact = useIsMobile(470);
    const utils = trpc.useContext();
    const writable = wallets.filter((w) => w.canWrite);
    const [type, setType] = useState<'expense' | 'income' | 'transfer'>(
        mode === 'transfer' || mode === 'topup' ? 'transfer' : 'expense',
    );
    const preset = wallets.find((w) => w.id === presetWalletId);
    const [walletId, setWalletId] = useState(
        presetWalletId ?? writable[0]?.id ?? '',
    );
    const [from, setFrom] = useState(
        mode === 'topup'
            ? (writable.find(
                  (w) =>
                      w.kind === 'shared' &&
                      w.currencyCode === preset?.currencyCode,
              )?.id ?? '')
            : (presetWalletId ?? writable[0]?.id ?? ''),
    );
    const [to, setTo] = useState(
        mode === 'topup' ? (presetWalletId ?? '') : '',
    );
    const [amount, setAmount] = useState('');
    const [categoryId, setCategory] = useState('');
    const [description, setDescription] = useState('');
    const [date, setDate] = useState(localToday);
    const categoriesQuery = trpc.category.list.useQuery(undefined, {
        enabled: open && type !== 'transfer',
    });
    const categories = ((categoriesQuery.data ?? []) as Category[]).filter(
        (c) => c.userId === null && c.type === type,
    );
    const wallet = wallets.find(
        (w) => w.id === (type === 'transfer' ? from : walletId),
    );
    const currency = wallet?.currencyCode ?? preset?.currencyCode ?? '';
    const checksAgreement = type === 'expense' && wallet?.kind === 'shared';
    const agreementQuery = trpc.household.purchaseAgreement.useQuery(undefined, { enabled: open && checksAgreement });
    const needsApproval = checksAgreement && agreementQuery.data && Number(amount) > Number(agreementQuery.data.limit);
    const checksLimits = type !== 'income' && wallet?.kind === 'child';
    const fetchedLimits = trpc.household.limits.useQuery(
        { walletId: wallet?.id ?? '', today: date || localToday() },
        {
            enabled: open && checksLimits,
        },
    );
    const applicable =
        checksLimits
            ? ((fetchedLimits.data ?? []) as FamilyLimit[])
                  .filter(
                      (l) =>
                          !l.categoryId ||
                          (type === 'expense' && l.categoryId === categoryId),
                  )
                  .sort((a, b) => Number(a.remaining) - Number(b.remaining))
            : [];
    const success = (result: AddTransactionResult | TransferResult) => {
        if ('approvalRequired' in result && result.approvalRequired) {
            void utils.household.purchaseProposals.invalidate();
            toast.success('Sent for approval. Nothing spent yet.');
            onOpenChange(false);
            return;
        }
        for (const key of [
            'wallets',
            'walletTransactions',
            'walletSummary',
            'limits',
        ])
            void utils.household[key].invalidate();
        toast.success(
            type === 'transfer'
                ? 'Transfer done'
                : type === 'expense'
                  ? 'Expense added'
                  : 'Income added',
        );
        onOpenChange(false);
    };
    const add = trpc.household.addTransaction.useMutation({
        onSuccess: success,
    });
    const transfer = trpc.household.transfer.useMutation({
        onSuccess: success,
    });
    const mutation = type === 'transfer' ? transfer : add;
    const busy = mutation.isLoading;
    const serverViolation = limitViolationOf(mutation.error);
    const limit = serverViolation ?? applicable[0];
    const over =
        !!limit &&
        (Number(amount) > Number(limit.remaining) || !!serverViolation);
    const money = (value: string | number) => (
        <FamilyMoney amount={value} currency={currency} />
    );
    const warning = (l: LimitViolation | FamilyLimit) => (
        <>
            This puts {wallet?.childName}{' '}
            {money(Math.max(0, Number(amount) - Number(l.remaining)))} over
            their{' '}
            {l.categoryId
                ? `${l.categoryName} limit`
                : `${l.period === 'weekly' ? 'weekly' : 'monthly'} limit`}
            .
        </>
    );
    const chooseWallet = (
        label: string,
        value: string,
        change: (value: string) => void,
        options: FamilyWallet[],
        disabled = false,
    ) => (
        <div className="space-y-2">
            <Label htmlFor={`family-wallet-${label}`} className="block">
                {label}
            </Label>
            <Select
                value={value}
                onValueChange={change}
                disabled={busy || disabled}
            >
                <SelectTrigger id={`family-wallet-${label}`}>
                    <SelectValue placeholder="Choose wallet" />
                </SelectTrigger>
                <SelectContent>
                    {options.map((w) => (
                        <SelectItem key={w.id} value={w.id}>
                            {w.name} · {w.currencyCode}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
    );
    return (
        <Sheet
            open={open}
            onOpenChange={(value) => {
                if (!busy) onOpenChange(value);
            }}
        >
            <SheetContent
                side={compact ? 'bottom' : 'right'}
                className={sheetClass}
            >
                <SheetHeader>
                    <SheetTitle>
                        {mode === 'topup'
                            ? `Top up ${preset?.name ?? 'wallet'}`
                            : mode === 'child'
                              ? 'Add expense'
                              : mode === 'transfer'
                                ? 'Transfer'
                                : 'Add transaction'}
                    </SheetTitle>
                    <SheetDescription>
                        {mode === 'topup'
                            ? `Move money from a shared wallet to ${preset?.childName}.`
                            : isChildActor(mode, preset)
                              ? `Recorded in ${preset?.name ?? wallet?.name ?? 'your wallet'}.`
                              : mode === 'transfer'
                                ? 'Move money between family wallets.'
                                : 'Recorded in the family ledger, not your personal accounts.'}
                    </SheetDescription>
                </SheetHeader>
                <form
                    className="mt-6 space-y-4"
                    onSubmit={(event) => {
                        event.preventDefault();
                        if (
                            !Number.isFinite(Number(amount)) ||
                            Number(amount) <= 0
                        )
                            return;
                        if (
                            busy ||
                            (checksAgreement && (agreementQuery.isLoading || agreementQuery.error)) ||
                            (checksLimits &&
                                (fetchedLimits.isLoading || fetchedLimits.error)) ||
                            (over && isChildActor(mode, preset))
                        )
                            return;
                        const common = {
                            amount,
                            description: description.trim() || undefined,
                            date,
                            today: localToday(),
                        };
                        if (type === 'transfer')
                            transfer.mutate({
                                ...common,
                                fromWalletId: from,
                                toWalletId: to,
                            });
                        else
                            add.mutate({
                                ...common,
                                walletId,
                                type,
                                categoryId: categoryId || null,
                            });
                    }}
                >
                    {mode === 'add' && (
                        <div className="space-y-2">
                            <Label className="block">Type</Label>
                            <Segmented
                                value={type}
                                onChange={(value) => {
                                    setType(value);
                                    setCategory('');
                                    add.reset();
                                    transfer.reset();
                                }}
                                options={[
                                    { value: 'expense', label: 'Expense' },
                                    { value: 'income', label: 'Income' },
                                    { value: 'transfer', label: 'Transfer' },
                                ]}
                            />
                        </div>
                    )}
                    {type === 'transfer' ? (
                        <>
                            {chooseWallet(
                                'From',
                                from,
                                (value) => {
                                    setFrom(value);
                                    transfer.reset();
                                    if (
                                        value === to ||
                                        wallets.find((w) => w.id === value)
                                            ?.currencyCode !==
                                        wallets.find((w) => w.id === to)
                                            ?.currencyCode
                                    )
                                        setTo('');
                                },
                                writable.filter(
                                    (w) =>
                                        mode !== 'topup' ||
                                        (w.kind === 'shared' &&
                                            w.currencyCode ===
                                                preset?.currencyCode),
                                ),
                            )}
                            {chooseWallet(
                                'To',
                                to,
                                (value) => {
                                    setTo(value);
                                    transfer.reset();
                                },
                                writable.filter(
                                    (w) =>
                                        w.currencyCode === currency &&
                                        w.id !== from,
                                ),
                                mode === 'topup',
                            )}
                            <p className="text-xs text-muted-foreground">
                                {currency && (
                                    <>Only {currency} wallets are shown.</>
                                )}
                            </p>
                            {from && from === to && (
                                <Notice tone="error">
                                    Choose two different wallets
                                </Notice>
                            )}
                        </>
                    ) : (
                        !presetWalletId &&
                        chooseWallet(
                            'Wallet',
                            walletId,
                            (value) => {
                                setWalletId(value);
                                add.reset();
                            },
                            writable,
                        )
                    )}
                    <div className="space-y-2">
                        <Label htmlFor="family-amount" className="block">
                            Amount{currency ? `, ${currency}` : ''}
                        </Label>
                        <Input
                            inputMode="decimal"
                            id="family-amount"
                            type="number"
                            min="0.01"
                            max="1000000000"
                            step="0.01"
                            required
                            value={amount}
                            disabled={busy}
                            onChange={(e) => {
                                setAmount(e.target.value);
                                add.reset();
                                transfer.reset();
                            }}
                        />
                        {amount !== '' &&
                            (!Number.isFinite(Number(amount)) ||
                                Number(amount) <= 0) && (
                                <Notice tone="error">
                                    Enter an amount greater than zero
                                </Notice>
                            )}
                        {needsApproval && <p className="text-sm text-muted-foreground">Over the <FamilyMoney amount={agreementQuery.data.limit} currency={currency} /> shared purchase limit. Another adult must approve this before any money leaves {wallet?.name}.</p>}
                        {limit && (
                            <p className="text-xs text-muted-foreground">
                                {money(Math.max(0, Number(limit.remaining)))}{' '}
                                left{' '}
                                {limit.categoryId
                                    ? `for ${limit.categoryName} `
                                    : ''}
                                {date === localToday()
                                    ? `this ${limit.period === 'weekly' ? 'week' : 'month'}`
                                    : `in the period ending ${format(parseISO(limit.periodEnd), 'MMM d')}`}
                            </p>
                        )}
                        {over && limit && (
                            <Notice
                                tone={
                                    isChildActor(mode, preset)
                                        ? 'error'
                                        : 'warning'
                                }
                            >
                                {isChildActor(mode, preset) ? (
                                    <>
                                        This is more than you have left
                                        {limit.categoryId
                                            ? ` for ${limit.categoryName}`
                                            : ''}
                                        . You can spend{' '}
                                        {money(
                                            Math.max(
                                                0,
                                                Number(limit.remaining),
                                            ),
                                        )}
                                        {limit.categoryId ? ' on it' : ''} until{' '}
                                        {format(
                                            addDays(
                                                parseISO(limit.periodEnd),
                                                1,
                                            ),
                                            'EEE, MMM d',
                                        )}
                                        .
                                    </>
                                ) : (
                                    warning(limit)
                                )}
                            </Notice>
                        )}
                    </div>
                    {type !== 'transfer' && (
                        <div className="space-y-2">
                            <Label htmlFor="family-category" className="block">
                                Category
                            </Label>
                            <Select
                                value={categoryId}
                                onValueChange={(value) => {
                                    setCategory(value);
                                    add.reset();
                                }}
                                disabled={busy || categoriesQuery.isLoading}
                            >
                                <SelectTrigger id="family-category">
                                    <SelectValue
                                        placeholder={
                                            categoriesQuery.isLoading
                                                ? 'Loading categories...'
                                                : 'Choose a category'
                                        }
                                    />
                                </SelectTrigger>
                                <SelectContent>
                                    {categories.map((c) => (
                                        <SelectItem key={c.id} value={c.id}>
                                            <span className="flex items-center gap-2">
                                                <IconDisplay
                                                    icon={c.icon}
                                                    fallback=""
                                                    className="size-4"
                                                />
                                                {c.name}
                                            </span>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {categoriesQuery.error && (
                                <Notice tone="error">
                                    {categoriesQuery.error.message}
                                </Notice>
                            )}
                        </div>
                    )}
                    <div className="space-y-2">
                        <Label htmlFor="family-description" className="block">
                            {type === 'transfer'
                                ? 'Note (optional)'
                                : 'Description (optional)'}
                        </Label>
                        <Input
                            id="family-description"
                            value={description}
                            maxLength={200}
                            placeholder={
                                type === 'transfer'
                                    ? undefined
                                    : 'e.g., School lunch'
                            }
                            disabled={busy}
                            onChange={(e) => setDescription(e.target.value)}
                        />
                    </div>
                    {type !== 'transfer' && (
                        <div className="space-y-2">
                            <Label htmlFor="family-date" className="block">
                                Date
                            </Label>
                            <Input
                                id="family-date"
                                type="date"
                                required
                                max={localToday()}
                                value={date}
                                disabled={busy}
                                onChange={(e) => {
                                    setDate(e.target.value);
                                    add.reset();
                                    transfer.reset();
                                }}
                            />
                        </div>
                    )}
                    {mode === 'topup' && !wallet && (
                        <Notice tone="info">
                            Add a shared {preset?.currencyCode} wallet to top up{' '}
                            {preset?.childName}.
                        </Notice>
                    )}
                    {mutation.error && !serverViolation && (
                        <Notice tone="error">{mutation.error.message}</Notice>
                    )}
                    {checksAgreement && agreementQuery.error && <Notice tone="error">Couldn't load the shared purchase agreement. <Button type="button" variant="outline" onClick={() => void agreementQuery.refetch()}>Try again</Button></Notice>}
                    {checksLimits && fetchedLimits.error && (
                        <Notice tone="error">
                            {fetchedLimits.error.message}
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => void fetchedLimits.refetch()}
                            >
                                Try again
                            </Button>
                        </Notice>
                    )}
                    <Button
                        className="w-full"
                        variant={needsApproval ? 'neutral' : 'default'}
                        disabled={
                            busy ||
                            (checksAgreement && (agreementQuery.isLoading || !!agreementQuery.error)) ||
                            !wallet ||
                            !(Number(amount) > 0) ||
                            (type === 'transfer' && (!to || from === to)) ||
                            (over && isChildActor(mode, preset)) ||
                            (checksLimits &&
                                (fetchedLimits.isLoading ||
                                    !!fetchedLimits.error))
                        }
                    >
                        {busy
                            ? 'Saving...'
                            : over && !isChildActor(mode, preset)
                              ? 'Add anyway'
                              : type === 'transfer'
                                ? mode === 'topup'
                                    ? 'Top up'
                                    : 'Transfer'
                                : type === 'income'
                                  ? 'Add income'
                                  : needsApproval ? 'Send for approval' : 'Add expense'}
                    </Button>
                </form>
            </SheetContent>
        </Sheet>
    );
}
