import { useState } from 'react';
import { Plus, X } from 'lucide-react';
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
import {
    InlineConfirm,
    Notice,
    keepSheetOpenForInlineConfirm,
    sectionLabel,
    sheetClass,
} from './shared';
import { limitDates } from './LimitsCard';
import type { FamilyLimit, FamilyWallet, LimitPeriod } from './types';
type Row = { key: string; categoryId: string; amount: string };
export function LimitSheet({
    wallet,
    limits,
    onClose,
}: {
    wallet: FamilyWallet;
    limits: FamilyLimit[];
    onClose: () => void;
}) {
    const compact = useIsMobile(470);
    const utils = trpc.useContext();
    const categoriesQuery = trpc.category.list.useQuery();
    const categories = (
        (categoriesQuery.data ?? []) as {
            id: string;
            name: string;
            userId: string | null;
            type: string;
        }[]
    ).filter((c) => c.userId === null && c.type === 'expense');
    const initial =
        limits.find((l) => l.categoryId === null)?.period ??
        limits[0]?.period ??
        'weekly';
    const [period, setPeriod] = useState<LimitPeriod>(initial);
    const [total, setTotal] = useState(
        limits.find((l) => l.period === initial && l.categoryId === null)
            ?.amount ?? '',
    );
    const rowsFor = (p: LimitPeriod): Row[] =>
        limits
            .filter((l) => l.period === p && l.categoryId !== null)
            .map((l) => ({
                key: l.id,
                categoryId: l.categoryId!,
                amount: l.amount,
            }));
    const [rows, setRows] = useState<Row[]>(() => rowsFor(initial));
    const [submitted, setSubmitted] = useState(false);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState('');
    const [confirm, setConfirm] = useState(false);
    const setLimit = trpc.household.setLimit.useMutation();
    const deleteLimit = trpc.household.deleteLimit.useMutation();
    const amountError = (amount: string) =>
        !Number.isFinite(Number(amount)) || Number(amount) <= 0
            ? 'Enter an amount greater than zero'
            : '';
    const rowError = (r: Row) =>
        !r.categoryId
            ? 'Choose a category'
            : amountError(r.amount) ||
              (total && Number(r.amount) > Number(total)
                  ? "A category limit can't be higher than the total limit"
                  : '');
    const execute = async (removeAll = false) => {
        if (busy) return;
        setSubmitted(true);
        if (
            !removeAll &&
            ((total !== '' && amountError(total)) || rows.some(rowError))
        )
            return;
        setBusy(true);
        setError('');
        try {
            const existing = limits.filter((l) => l.period === period);
            const desired = [
                ...(total === '' ? [] : [{ categoryId: null, amount: total }]),
                ...rows.map((r) => ({
                    categoryId: r.categoryId as string | null,
                    amount: r.amount,
                })),
            ];
            if (!removeAll)
                for (const r of desired)
                    if (
                        !existing.some(
                            (l) =>
                                l.categoryId === r.categoryId &&
                                Number(l.amount) === Number(r.amount),
                        )
                    )
                        await setLimit.mutateAsync({
                            walletId: wallet.id,
                            period,
                            ...r,
                            amount: Number(r.amount),
                        });
            for (const l of removeAll
                ? limits
                : limits.filter(
                      (l) =>
                          l.period !== period ||
                          !desired.some((r) => r.categoryId === l.categoryId),
                  ))
                await deleteLimit.mutateAsync({ limitId: l.id });
            await Promise.all([
                utils.household.limits.invalidate(),
                utils.household.wallets.invalidate(),
            ]);
            toast.success(removeAll ? 'Limits removed' : 'Limits saved');
            onClose();
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Could not save limits');
            await utils.household.limits.invalidate();
        } finally {
            setBusy(false);
        }
    };
    const current = limits.find((l) => l.period === period);
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
                onEscapeKeyDown={keepSheetOpenForInlineConfirm}
            >
                <SheetHeader>
                    <SheetTitle>Limits for {wallet.name}</SheetTitle>
                    <SheetDescription>
                        {wallet.childName} can't add expenses over a limit. If
                        you add one, you'll get a warning first.
                    </SheetDescription>
                </SheetHeader>
                <form
                    className="mt-6 space-y-4"
                    onSubmit={(e) => {
                        e.preventDefault();
                        void execute();
                    }}
                >
                    <fieldset disabled={busy} className="min-w-0 space-y-4">
                        <div className="space-y-2">
                            <Label id="limit-period-label" className="block">
                                Period
                            </Label>
                            <div
                                role="group"
                                aria-labelledby="limit-period-label"
                            >
                                <Segmented
                                    value={period}
                                    onChange={(p: LimitPeriod) => {
                                        setPeriod(p);
                                        setTotal(
                                            limits.find(
                                                (l) =>
                                                    l.period === p &&
                                                    l.categoryId === null,
                                            )?.amount ?? '',
                                        );
                                        setRows(rowsFor(p));
                                        setSubmitted(false);
                                    }}
                                    options={[
                                        { value: 'weekly', label: 'Weekly' },
                                        { value: 'monthly', label: 'Monthly' },
                                    ]}
                                />
                            </div>
                            {current && (
                                <p className="text-xs text-muted-foreground">
                                    Current period: {limitDates(current)}
                                </p>
                            )}
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="total-limit" className="block">
                                Total limit, {wallet.currencyCode}
                            </Label>
                            <Input
                                id="total-limit"
                                type="number"
                                step="0.01"
                                value={total}
                                onChange={(e) => setTotal(e.target.value)}
                            />
                            {submitted &&
                                total !== '' &&
                                amountError(total) && (
                                    <p className="text-xs text-destructive">
                                        {amountError(total)}
                                    </p>
                                )}
                        </div>
                        <h3 className={sectionLabel}>Category limits</h3>
                        {categoriesQuery.error && (
                            <Notice tone="error">
                                {categoriesQuery.error.message}
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() =>
                                        void categoriesQuery.refetch()
                                    }
                                >
                                    Try again
                                </Button>
                            </Notice>
                        )}
                        {rows.map((r) => (
                            <div key={r.key} className="space-y-1">
                                <div className="grid grid-cols-[minmax(0,1fr)_7rem_auto] gap-2 max-[359px]:grid-cols-[minmax(0,1fr)_auto]">
                                    <Select
                                        value={r.categoryId}
                                        onValueChange={(value) =>
                                            setRows(
                                                rows.map((x) =>
                                                    x.key === r.key
                                                        ? {
                                                              ...x,
                                                              categoryId: value,
                                                          }
                                                        : x,
                                                ),
                                            )
                                        }
                                    >
                                        <SelectTrigger
                                            disabled={categoriesQuery.isLoading}
                                            aria-label="Category"
                                            className="min-w-0 max-[359px]:col-span-2"
                                        >
                                            <SelectValue
                                                placeholder={
                                                    categoriesQuery.isLoading
                                                        ? 'Loading categories...'
                                                        : 'Choose a category'
                                                }
                                            />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {categories
                                                .filter(
                                                    (c) =>
                                                        c.id === r.categoryId ||
                                                        !rows.some(
                                                            (x) =>
                                                                x.categoryId ===
                                                                c.id,
                                                        ),
                                                )
                                                .map((c) => (
                                                    <SelectItem
                                                        key={c.id}
                                                        value={c.id}
                                                    >
                                                        {c.name}
                                                    </SelectItem>
                                                ))}
                                        </SelectContent>
                                    </Select>
                                    <Input
                                        aria-label="Category limit amount"
                                        type="number"
                                        step="0.01"
                                        value={r.amount}
                                        onChange={(e) =>
                                            setRows(
                                                rows.map((x) =>
                                                    x.key === r.key
                                                        ? {
                                                              ...x,
                                                              amount: e.target
                                                                  .value,
                                                          }
                                                        : x,
                                                ),
                                            )
                                        }
                                    />
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        className="size-10"
                                        aria-label="Remove category limit"
                                        onClick={() =>
                                            setRows(
                                                rows.filter(
                                                    (x) => x.key !== r.key,
                                                ),
                                            )
                                        }
                                    >
                                        <X className="size-4" />
                                    </Button>
                                </div>
                                {submitted && rowError(r) && (
                                    <p className="text-xs text-destructive">
                                        {rowError(r)}
                                    </p>
                                )}
                            </div>
                        ))}
                        <Button
                            type="button"
                            variant="ghost"
                            className="h-10"
                            size="sm"
                            disabled={
                                categoriesQuery.isLoading ||
                                rows.length >= categories.length
                            }
                            onClick={() =>
                                setRows([
                                    ...rows,
                                    {
                                        key: crypto.randomUUID(),
                                        categoryId: '',
                                        amount: '',
                                    },
                                ])
                            }
                        >
                            <Plus className="mr-2 size-4" />
                            Add category limit
                        </Button>
                        {limits.length > 0 &&
                            (confirm ? (
                                <InlineConfirm
                                    message={`Remove all limits for ${wallet.name}? ${wallet.childName} will be able to spend any amount.`}
                                    confirmLabel="Remove limits"
                                    pendingLabel="Removing..."
                                    pending={busy}
                                    onCancel={() => setConfirm(false)}
                                    onConfirm={() => void execute(true)}
                                />
                            ) : (
                                <Button
                                    type="button"
                                    variant="link"
                                    className="text-red-700 dark:text-red-400"
                                    onClick={() => setConfirm(true)}
                                >
                                    Remove all limits
                                </Button>
                            ))}
                    </fieldset>
                    {error && <Notice tone="error">{error}</Notice>}
                    <Button className="h-10 w-full" disabled={busy}>
                        {busy ? 'Saving...' : 'Save limits'}
                    </Button>
                </form>
            </SheetContent>
        </Sheet>
    );
}
