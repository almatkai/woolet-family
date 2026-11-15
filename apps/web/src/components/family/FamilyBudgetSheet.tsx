import { useState } from 'react';
import { toast } from 'sonner';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetDescription,
} from '@/components/ui/sheet';
import {
    Select,
    SelectTrigger,
    SelectValue,
    SelectContent,
    SelectItem,
} from '@/components/ui/select';
import { useIsMobile } from '@/hooks/use-mobile';
import { FamilyMoney, InlineConfirm, Notice, sheetClass } from './shared';
import { canEditFamilyBudget } from './permissions';
import type { HouseholdOverview, HouseholdOverviewOutput } from './types';

export function FamilyBudgetSheet({
    family,
    overview,
    onClose,
}: {
    family: NonNullable<HouseholdOverview>;
    overview: HouseholdOverviewOutput;
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
    const initialTotal = overview.converted.currencies[0]?.budget ?? '';
    const [total, setTotal] = useState(initialTotal);
    const [rows, setRows] = useState(
        overview.categoryBudgets.map((r) => ({ ...r, key: r.categoryId })),
    );
    const [saved, setSaved] = useState([
        { categoryId: null as string | null, amount: initialTotal },
        ...overview.categoryBudgets,
    ]);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState('');
    const [submitted, setSubmitted] = useState(false);
    const [confirm, setConfirm] = useState(false);
    const setBudget = trpc.household.setBudget.useMutation();
    const deleteBudget = trpc.household.deleteBudget.useMutation();
    const valid = (v: string) =>
        /^\d{1,12}(\.\d{1,2})?$/.test(v) && Number(v) > 0;
    if (!canEditFamilyBudget(family.me)) return null;
    const execute = async (remove = false) => {
        if (busy) return;
        setSubmitted(true);
        if (
            !remove &&
            (!valid(total) ||
                rows.some((r) => !r.categoryId || !valid(r.amount)))
        )
            return;
        setBusy(true);
        setError('');
        let label = 'monthly';
        try {
            const desired = remove
                ? []
                : [
                      { categoryId: null as string | null, amount: total },
                      ...rows,
                  ];
            for (const row of desired) {
                label = row.categoryId
                    ? (categories.find((c) => c.id === row.categoryId)?.name ??
                      'category')
                    : 'monthly';
                if (
                    saved.some(
                        (s) =>
                            s.categoryId === row.categoryId &&
                            Number(s.amount) === Number(row.amount),
                    )
                )
                    continue;
                await setBudget.mutateAsync({
                    categoryId: row.categoryId,
                    amount: row.amount,
                });
                setSaved((previous) => [
                    ...previous.filter((s) => s.categoryId !== row.categoryId),
                    row,
                ]);
            }
            for (const row of saved.filter(
                (s) =>
                    s.amount &&
                    !desired.some((d) => d.categoryId === s.categoryId),
            )) {
                label = row.categoryId
                    ? (categories.find((c) => c.id === row.categoryId)?.name ??
                      'category')
                    : 'monthly';
                await deleteBudget.mutateAsync({ categoryId: row.categoryId });
                setSaved((previous) =>
                    previous.filter((s) => s.categoryId !== row.categoryId),
                );
            }
            toast.success(remove ? 'Budget removed' : 'Budget saved');
            onClose();
        } catch {
            setError(
                `Couldn't save the ${label} budget. The rows above it were saved.`,
            );
        } finally {
            await utils.household.overview.invalidate();
            setBusy(false);
        }
    };
    const sum = rows.reduce((s, r) => s + Number(r.amount || 0), 0);
    const previous = new Date(`${overview.converted.month}-01T12:00:00`);
    previous.setMonth(previous.getMonth() - 1);
    return (
        <Sheet
            open
            onOpenChange={(open) => {
                if (!open && !busy && !confirm) onClose();
            }}
        >
            <SheetContent
                side={compact ? 'bottom' : 'right'}
                className={sheetClass}
                onEscapeKeyDown={(e) => {
                    if (confirm || busy) e.preventDefault();
                }}
            >
                <SheetHeader>
                    <SheetTitle>Family budget</SheetTitle>
                    <SheetDescription>
                        Monthly, in {overview.baseCurrency}. Counts everyone's
                        spending and the family wallets. Moves between accounts
                        and wallets don't count.
                    </SheetDescription>
                </SheetHeader>
                <form
                    className="mt-6 space-y-4"
                    onSubmit={(e) => {
                        e.preventDefault();
                        void execute();
                    }}
                >
                    <fieldset disabled={busy} className="space-y-4 min-w-0">
                        <label className="block space-y-2">
                            <span>Monthly budget, {overview.baseCurrency}</span>
                            <Input
                                aria-label="Monthly budget"
                                inputMode="decimal"
                                value={total}
                                onChange={(e) => setTotal(e.target.value)}
                            />
                        </label>
                        {Number(overview.previousMonthExpense) > 0 && (
                            <p className="text-xs text-muted-foreground">
                                The family spent{' '}
                                <FamilyMoney
                                    amount={overview.previousMonthExpense}
                                    currency={overview.baseCurrency}
                                />{' '}
                                in{' '}
                                {previous.toLocaleDateString('en', {
                                    month: 'long',
                                })}
                                .
                            </p>
                        )}
                        {submitted &&
                            (!valid(total) ||
                                rows.some((r) => !valid(r.amount))) && (
                                <Notice tone="error">
                                    Enter an amount greater than zero
                                </Notice>
                            )}
                        <h3>Category budgets (optional)</h3>
                        {categoriesQuery.error && (
                            <Notice tone="error">
                                Couldn't load categories.
                                <Button
                                    type="button"
                                    onClick={() =>
                                        void categoriesQuery.refetch()
                                    }
                                >
                                    Try again
                                </Button>
                            </Notice>
                        )}
                        {rows.map((r, i) => (
                            <div key={r.key} className="space-y-1">
                                <div className="flex gap-2">
                                    <Select
                                        value={r.categoryId}
                                        onValueChange={(v) =>
                                            setRows(
                                                rows.map((x, n) =>
                                                    n === i
                                                        ? {
                                                              ...x,
                                                              categoryId: v,
                                                          }
                                                        : x,
                                                ),
                                            )
                                        }
                                    >
                                        <SelectTrigger
                                            className="min-w-0 flex-1"
                                            aria-label="Category"
                                        >
                                            <SelectValue placeholder="Choose a category" />
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
                                        className="w-24"
                                        aria-label="Category budget amount"
                                        inputMode="decimal"
                                        value={r.amount}
                                        onChange={(e) =>
                                            setRows(
                                                rows.map((x, n) =>
                                                    n === i
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
                                        aria-label={`Remove ${categories.find((c) => c.id === r.categoryId)?.name ?? 'category'} budget`}
                                        onClick={() =>
                                            setRows(
                                                rows.filter((_, n) => n !== i),
                                            )
                                        }
                                    >
                                        ×
                                    </Button>
                                </div>
                                <p className="text-[11px] text-muted-foreground">
                                    <FamilyMoney
                                        currency={overview.baseCurrency}
                                        amount={
                                            overview.categoryBudgets.find(
                                                (c) =>
                                                    c.categoryId ===
                                                    r.categoryId,
                                            )?.spent ?? '0'
                                        }
                                    />{' '}
                                    spent this month
                                </p>
                                {submitted && !r.categoryId && (
                                    <p>Choose a category</p>
                                )}
                            </div>
                        ))}
                        <Button
                            type="button"
                            variant="ghost"
                            disabled={
                                categoriesQuery.isLoading ||
                                !!categoriesQuery.error ||
                                rows.length >= categories.length
                            }
                            onClick={() =>
                                setRows([
                                    ...rows,
                                    {
                                        key: crypto.randomUUID(),
                                        categoryId: '',
                                        categoryName: '',
                                        amount: '',
                                        spent: '0',
                                    },
                                ])
                            }
                        >
                            + Add category
                        </Button>
                        {sum > Number(total) && (
                            <Notice tone="warning">
                                Category budgets add up to{' '}
                                <FamilyMoney
                                    amount={sum}
                                    currency={overview.baseCurrency}
                                />
                                , more than the monthly budget.
                            </Notice>
                        )}
                        {initialTotal &&
                            (confirm ? (
                                <InlineConfirm
                                    message="Remove the family budget and all category budgets?"
                                    confirmLabel="Remove"
                                    pending={busy}
                                    onCancel={() => setConfirm(false)}
                                    onConfirm={() => void execute(true)}
                                />
                            ) : (
                                <Button
                                    type="button"
                                    variant="ghost"
                                    onClick={() => setConfirm(true)}
                                >
                                    Remove budget
                                </Button>
                            ))}
                    </fieldset>
                    {error && <Notice tone="error">{error}</Notice>}
                    <Button className="w-full" disabled={busy}>
                        {busy ? 'Saving...' : 'Save budget'}
                    </Button>
                </form>
            </SheetContent>
        </Sheet>
    );
}
