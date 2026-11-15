import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import posthog from 'posthog-js';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Bookmark, Building2, ChevronDown, Plus, Settings2 } from 'lucide-react';
import { toast } from 'sonner';
import { trpc } from '@/lib/trpc';
import {
    captureOptimisticFinanceSnapshot,
    restoreOptimisticFinanceSnapshot,
    upsertTransactionAcrossCaches,
} from '@/lib/optimistic-cache';
import { formatAccountLabel } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import { ManageCategoriesSheet } from '@/components/ManageCategoriesSheet';
import { SplitSelector } from '@/components/SplitBillComponents';
import { IconDisplay } from '@/components/IconDisplay';
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
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowRight, Calendar, FileText } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

interface Category {
    id: string;
    name: string;
    icon: string;
    color: string;
    type?: 'income' | 'expense' | 'transfer';
}

interface CurrencyOption {
    id: string;
    bankId: string;
    bankName: string;
    bankIcon?: string | null;
    accountId: string;
    accountName: string;
    accountLast4Digits?: string | null;
    label: string;
    balance: number;
    currencyCode: string;
}

// Form input schema
const createTransactionFormSchema = z.object({
    currencyBalanceId: z.string().min(1, "Account/Currency is required"),
    categoryId: z.string().min(1, "Category is required"),
    amount: z.string().min(1, "Amount is required"),
    type: z.enum(['income', 'expense', 'transfer']),
    description: z.string().optional(),
    date: z.string().min(1, "Date is required"),
    toCurrencyBalanceId: z.string().optional(),
    fee: z.string().optional(),
    cashbackValue: z.string().optional(),
    cashbackMode: z.enum(['amount', 'percent']),
    cashbackMax: z.string().optional(),
    currencyCode: z.string().optional(),
});

type CreateTransactionFormValues = z.infer<typeof createTransactionFormSchema>;
const ACCOUNT_USAGE_STORAGE_KEY = 'woo-account-usage';

type AccountUsageRecord = Record<string, { count: number; lastUsedAt: number }>;

interface ShortcutData {
    id: string;
    name?: string;
    icon?: string;
    type: 'income' | 'expense' | 'transfer';
    currencyBalanceId: string;
    categoryId: string;
    amount?: number;
    description?: string;
}

interface AddTransactionSheetProps {
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
    preselectedCurrencyBalanceId?: string;
    preselectedType?: 'income' | 'expense' | 'transfer';
    preselectedCategoryId?: string;
    preselectedAmount?: number;
    preselectedDescription?: string;
    preselectedDate?: string;
    preselectedCurrencyCode?: string;
    trigger?: ReactNode | null;
    onSaveAsShortcut?: (data: Omit<ShortcutData, 'id'>) => void;
    selectedShortcut?: ShortcutData | null;
    favoriteShortcuts?: ShortcutData[];
    onOpenShortcut?: (shortcut: ShortcutData) => void;
}

function GroupedAccountPicker({
    banks,
    options,
    recommendedOptions = [],
    value,
    selectedAccount,
    requiredCurrencyCode,
    placeholder,
    open,
    onOpenChange,
    onSelect,
    onAddCurrency,
    isAddingCurrency,
    disabledOptionId,
    isCompactMobile,
}: {
    banks: any[] | undefined;
    options: CurrencyOption[];
    recommendedOptions?: CurrencyOption[];
    value: string;
    selectedAccount?: CurrencyOption;
    requiredCurrencyCode?: string;
    placeholder: string;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSelect: (option: CurrencyOption) => void;
    onAddCurrency?: (account: { id: string; name: string; bankName: string }) => void;
    isAddingCurrency?: boolean;
    disabledOptionId?: string;
    isCompactMobile: boolean;
}) {
    const pickerRecommendedOptions = useMemo(() => {
        const rankedIds = new Set(recommendedOptions.map(option => option.id));
        const source = requiredCurrencyCode
            ? [
                ...recommendedOptions,
                ...options.filter(option => option.currencyCode === requiredCurrencyCode && !rankedIds.has(option.id)),
            ]
            : recommendedOptions;

        return source
            .filter((option) => option.id !== disabledOptionId)
            .filter((option) => !requiredCurrencyCode || option.currencyCode === requiredCurrencyCode)
            .slice(0, 5);
    }, [disabledOptionId, options, recommendedOptions, requiredCurrencyCode]);

    const visibleBanks = useMemo(() => {
        const baseBanks = (banks || [])
            .map((bank: any) => ({
                ...bank,
                accounts: (bank.accounts || []).filter((account: any) => account.currencyBalances?.length || requiredCurrencyCode),
            }))
            .filter((bank: any) => bank.accounts.length > 0);

        if (pickerRecommendedOptions.length === 0) return baseBanks;

        const recommendedBank = {
            id: '__recommended',
            name: 'Recommended',
            isRecommended: true,
            accounts: pickerRecommendedOptions.map((option) => ({
                id: `recommended-${option.accountId}-${option.id}`,
                name: option.accountName,
                bankName: option.bankName,
                bankIcon: option.bankIcon,
                last4Digits: option.accountLast4Digits,
                currencyBalances: [{
                    id: option.id,
                    currencyCode: option.currencyCode,
                    balance: option.balance,
                }],
            })),
        };

        return [recommendedBank, ...baseBanks];
    }, [banks, pickerRecommendedOptions, requiredCurrencyCode]);
    const [activeBankId, setActiveBankId] = useState<string | null>(null);
    const activeBank = visibleBanks.find((bank: any) => bank.id === activeBankId) || visibleBanks[0];
    const hasRequiredCurrency = !requiredCurrencyCode || options.some((option) => option.currencyCode === requiredCurrencyCode);

    return (
        <Popover open={open} onOpenChange={onOpenChange}>
            <PopoverTrigger asChild>
                <button
                    type="button"
                    className="flex h-12 w-full items-center justify-between rounded-2xl border border-muted-foreground/20 bg-background px-4 text-left transition hover:border-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-ring"
                >
                    {selectedAccount ? (
                        <div className="min-w-0">
                            <div className="truncate text-sm font-semibold">{selectedAccount.accountName}</div>
                            <div className="truncate text-xs text-muted-foreground">
                                {selectedAccount.bankName} • {selectedAccount.currencyCode} • {selectedAccount.balance.toLocaleString()}
                            </div>
                        </div>
                    ) : (
                        <span className="text-sm font-semibold">{placeholder}</span>
                    )}
                    <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
                </button>
            </PopoverTrigger>
            <PopoverContent
                align="start"
                portalled={false}
                className="w-[min(620px,calc(100vw-2rem))] overflow-hidden rounded-2xl border-muted-foreground/20 p-0"
            >
                {requiredCurrencyCode && !hasRequiredCurrency && (
                    <div className="border-b border-amber-500/30 bg-amber-500/10 px-4 py-3">
                        <p className="text-sm font-semibold text-amber-200">No {requiredCurrencyCode} balance yet</p>
                        <p className="mt-1 text-xs text-muted-foreground">
                            Add {requiredCurrencyCode} to one account, then this transaction can be saved in the original currency.
                        </p>
                    </div>
                )}
                <div
                    className="grid min-h-0 grid-cols-1 grid-rows-[180px_1fr] md:grid-cols-[190px_1fr] md:grid-rows-1"
                    style={{ height: 'min(420px, var(--radix-popover-content-available-height))' }}
                >
                    <ScrollArea className="h-full border-b border-border/70 md:border-b-0 md:border-r">
                        <div className="space-y-1 p-2 pr-3">
                            {visibleBanks.map((bank: any) => (
                                <button
                                    key={bank.id}
                                    type="button"
                                    className={`flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left transition ${activeBank?.id === bank.id ? 'bg-muted text-foreground' : 'text-muted-foreground hover:bg-muted/70 hover:text-foreground'}`}
                                    onClick={() => setActiveBankId(bank.id)}
                                >
                                    <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-background text-sm">
                                        {bank.isRecommended ? <Bookmark className="h-4 w-4" /> : <IconDisplay icon={bank.icon} fallback="🏦" className="h-4 w-4" />}
                                    </span>
                                    <div className="min-w-0">
                                        <div className="truncate text-sm font-semibold">{bank.name}</div>
                                        <div className="text-[11px] text-muted-foreground">
                                            {bank.isRecommended
                                                ? `${bank.accounts.length} recent`
                                                : `${bank.accounts.length} account${bank.accounts.length === 1 ? '' : 's'}`}
                                        </div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </ScrollArea>
                    <ScrollArea className="h-full">
                        <div className="p-2 pr-3">
                            {activeBank?.accounts.map((account: any) => {
                                const balances = (account.currencyBalances || []).filter((balance: any) => balance.id !== disabledOptionId);
                                const hasAccountRequiredCurrency = requiredCurrencyCode
                                    ? balances.some((balance: any) => balance.currencyCode === requiredCurrencyCode)
                                    : true;
                                return (
                                    <div key={account.id} className="rounded-xl p-2 hover:bg-muted/40">
                                        <div className="mb-1 flex items-center justify-between gap-2">
                                            <div className="min-w-0">
                                                <div className="truncate text-sm font-semibold">{account.name}</div>
                                                {activeBank?.isRecommended ? (
                                                    <div className="truncate text-[11px] text-muted-foreground">
                                                        {account.bankName}{account.last4Digits ? ` • •••• ${account.last4Digits}` : ''}
                                                    </div>
                                                ) : (
                                                    account.last4Digits && <div className="text-[11px] text-muted-foreground">•••• {account.last4Digits}</div>
                                                )}
                                            </div>
                                            {requiredCurrencyCode && !hasAccountRequiredCurrency && onAddCurrency && (
                                                <Button
                                                    type="button"
                                                    size="sm"
                                                    variant="outline"
                                                    className="h-7 shrink-0 rounded-lg text-xs"
                                                    disabled={isAddingCurrency}
                                                    onClick={() => onAddCurrency({ id: account.id, name: account.name, bankName: activeBank.name })}
                                                >
                                                    <Plus className="h-3 w-3" />
                                                    Add {requiredCurrencyCode}
                                                </Button>
                                            )}
                                        </div>
                                        <div className="grid gap-1">
                                            {balances.map((balance: any) => {
                                                const option = options.find((item) => item.id === balance.id);
                                                if (!option) return null;
                                                const isMismatched = requiredCurrencyCode && option.currencyCode !== requiredCurrencyCode;
                                                return (
                                                    <button
                                                        key={balance.id}
                                                        type="button"
                                                        className={`flex items-center justify-between rounded-lg px-2 py-1.5 text-left transition ${value === balance.id ? 'bg-primary text-primary-foreground' : 'hover:bg-background'} ${isMismatched ? 'opacity-60' : ''}`}
                                                        onClick={() => {
                                                            onSelect(option);
                                                            onOpenChange(false);
                                                        }}
                                                    >
                                                        <span className="text-sm font-medium">{option.currencyCode}</span>
                                                        <span className="text-xs opacity-80">{option.balance.toLocaleString()}</span>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </ScrollArea>
                </div>
            </PopoverContent>
        </Popover>
    );
}

export function AddTransactionSheet({
    open: controlledOpen,
    onOpenChange: controlledOnOpenChange,
    preselectedCurrencyBalanceId,
    preselectedType,
    preselectedCategoryId,
    preselectedAmount,
    preselectedDescription,
    preselectedDate,
    preselectedCurrencyCode,
    trigger,
    onSaveAsShortcut,
    selectedShortcut,
    favoriteShortcuts = [],
    onOpenShortcut,
}: AddTransactionSheetProps = {}) {
    const readAccountUsage = (): AccountUsageRecord => {
        if (typeof window === 'undefined') return {};
        try {
            const parsed = JSON.parse(window.localStorage.getItem(ACCOUNT_USAGE_STORAGE_KEY) || '{}');
            return parsed && typeof parsed === 'object' ? parsed : {};
        } catch {
            return {};
        }
    };

    const parseMutationErrorMessage = (error: unknown): string => {
        if (!error) return 'Failed to create transaction';
        const candidate =
            (error as any)?.shape?.message ??
            (error as any)?.data?.message ??
            (error as any)?.message;

        if (typeof candidate !== 'string' || candidate.trim().length === 0) {
            return 'Failed to create transaction';
        }

        return candidate.replace(/^TRPCClientError:\s*/i, '').trim();
    };

    const isCompactMobile = useIsMobile(470);
    const queryClient = useQueryClient();
    const [internalOpen, setInternalOpen] = useState(false);
    const open = controlledOpen !== undefined ? controlledOpen : internalOpen;
    const setOpen = controlledOnOpenChange || setInternalOpen;
    const utils = trpc.useUtils();
    const [splitEnabled, setSplitEnabled] = useState(false);
    const [selectedParticipants, setSelectedParticipants] = useState<string[]>([]);
    const [equalSplit, setEqualSplit] = useState(true);
    const [customAmounts, setCustomAmounts] = useState<{ participantId: string; amount: number }[]>([]);
    const [participantAccounts, setParticipantAccounts] = useState<{ participantId: string; paybackCurrencyBalanceId: string }[]>([]);
    const [includeSelf, setIncludeSelf] = useState(false);
    const [instantMoneyBack, setInstantMoneyBack] = useState(false);
    const [paybackCurrencyBalanceId, setPaybackCurrencyBalanceId] = useState<string>('');
    const [accountPickerOpen, setAccountPickerOpen] = useState(false);
    const [transferAccountPickerOpen, setTransferAccountPickerOpen] = useState(false);
    const [accountUsage, setAccountUsage] = useState<AccountUsageRecord>(() => readAccountUsage());

    // Fetch hierarchy to select account/currency
    const { data: banks } = trpc.bank.getHierarchy.useQuery();
    const { data: categories } = trpc.category.list.useQuery();

    // Flatten hierarchy for select options
    const currencyOptions = useMemo(() => {
        if (!banks) return [];
        const options: CurrencyOption[] = [];
        banks.forEach((bank: any) => {
            bank.accounts.forEach((acc: any) => {
                acc.currencyBalances.forEach((cb: any) => {
                    options.push({
                        id: cb.id,
                        bankId: bank.id,
                        bankName: bank.name,
                        bankIcon: bank.icon,
                        accountId: acc.id,
                        accountName: acc.name,
                        accountLast4Digits: acc.last4Digits,
                        label: formatAccountLabel(bank.name, acc.name, acc.last4Digits),
                        balance: Number(cb.balance),
                        currencyCode: cb.currencyCode
                    });
                });
            });
        });
        return options;
    }, [banks]);

    const recommendedCurrencyOptions = useMemo(() => {
        return currencyOptions
            .filter((option) => accountUsage[option.id])
            .sort((a, b) => {
                const usageA = accountUsage[a.id];
                const usageB = accountUsage[b.id];
                return (usageB.lastUsedAt - usageA.lastUsedAt) || (usageB.count - usageA.count);
            });
    }, [accountUsage, currencyOptions]);

    const recordAccountUsage = (option?: CurrencyOption) => {
        if (!option || typeof window === 'undefined') return;

        setAccountUsage(prev => {
            const next = {
                ...prev,
                [option.id]: {
                    count: (prev[option.id]?.count || 0) + 1,
                    lastUsedAt: Date.now(),
                },
            };
            window.localStorage.setItem(ACCOUNT_USAGE_STORAGE_KEY, JSON.stringify(next));
            return next;
        });
    };

    const { register, handleSubmit, reset, watch, setValue, formState: { errors } } = useForm<CreateTransactionFormValues>({
        resolver: zodResolver(createTransactionFormSchema),
        defaultValues: {
            type: preselectedType || 'expense',
            amount: '',
            fee: '',
            cashbackValue: '',
            cashbackMode: 'amount',
            cashbackMax: '',
            date: new Date().toISOString().split('T')[0],
            currencyBalanceId: preselectedCurrencyBalanceId || '',
            categoryId: '',
        }
    });

    const watchedValues = watch();
    const dateInputRef = useRef<HTMLInputElement | null>(null);
    const dateField = register('date');

    useEffect(() => {
        if (!open) return;
        reset({
            type: preselectedType || 'expense',
            amount: preselectedAmount !== undefined && preselectedAmount !== null ? preselectedAmount.toString() : '',
            fee: '',
            cashbackValue: '',
            cashbackMode: 'amount',
            cashbackMax: '',
            date: preselectedDate || new Date().toISOString().split('T')[0],
            currencyBalanceId: preselectedCurrencyBalanceId || '',
            categoryId: preselectedCategoryId || '',
            description: preselectedDescription || '',
            toCurrencyBalanceId: '',
            currencyCode: preselectedCurrencyCode || '',
        });
    }, [
        open,
        preselectedType,
        preselectedCurrencyBalanceId,
        preselectedCategoryId,
        preselectedAmount,
        preselectedDescription,
        preselectedDate,
        preselectedCurrencyCode,
        reset,
    ]);

    const transactionType = watch('type');
    const currencyBalanceId = watch('currencyBalanceId');
    const toCurrencyBalanceId = watch('toCurrencyBalanceId');
    const amountValue = Number(watch('amount')) || 0;
    const feeValue = transactionType === 'transfer' ? (Number(watch('fee')) || 0) : 0;
    const requiredAmount = amountValue + feeValue;

    const selectedAccount = useMemo(() =>
        currencyOptions.find(o => o.id === currencyBalanceId),
        [currencyOptions, currencyBalanceId]);
    const hasInsufficientFunds = Boolean(
        selectedAccount &&
        (transactionType === 'expense' || transactionType === 'transfer') &&
        requiredAmount > 0 &&
        requiredAmount > selectedAccount.balance
    );

    const selectedToAccount = useMemo(() =>
        currencyOptions.find(o => o.id === toCurrencyBalanceId),
        [currencyOptions, toCurrencyBalanceId]);
    const draftCurrencyCode = watch('currencyCode');
    const hasDraftCurrency = Boolean(draftCurrencyCode);
    const hasMatchingDraftCurrency = !hasDraftCurrency || currencyOptions.some((option) => option.currencyCode === draftCurrencyCode);
    const selectedCurrencyMismatch = Boolean(
        draftCurrencyCode &&
        selectedAccount &&
        selectedAccount.currencyCode !== draftCurrencyCode
    );

    const addCurrency = trpc.account.addCurrency.useMutation({
        onSuccess: (balance: any) => {
            utils.bank.getHierarchy.invalidate();
            utils.account.getTotalBalance.invalidate();
            setValue('currencyBalanceId', balance.id, { shouldValidate: true });
            setValue('currencyCode', balance.currencyCode);
            setAccountPickerOpen(false);
            toast.success(`${balance.currencyCode} balance added`);
        },
        onError: (error: unknown) => {
            console.error('Failed to add currency:', error);
            toast.error(parseMutationErrorMessage(error));
        },
    });

    const categoryId = watch('categoryId');
    const selectedCategory = useMemo(() =>
        categories?.find((c: Category) => c.id === categoryId),
        [categories, categoryId]);

    // Filter categories by transaction type
    const filteredCategories = useMemo(() => {
        if (!categories) return [];
        return categories.filter((cat: Category) => {
            if (transactionType === 'transfer') return true;
            return cat.type === transactionType;
        });
    }, [categories, transactionType]);

    useEffect(() => {
        if (!categoryId) return;
        const isValid = filteredCategories.some((cat: Category) => cat.id === categoryId);
        if (!isValid) {
            setValue('categoryId', '');
        }
    }, [categoryId, filteredCategories, setValue]);

    const canSaveAsShortcut = !selectedShortcut;

    const createTransaction = trpc.transaction.create.useMutation({
        onMutate: async (variables: any) => {
            await Promise.all([
                utils.transaction.list.cancel(),
                utils.account.getTotalBalance.cancel(),
                utils.bank.getHierarchy.cancel(),
            ]);

            const snapshot = captureOptimisticFinanceSnapshot(queryClient);
            const optimisticTransaction = {
                id: typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : `temp-${Date.now()}`,
                currencyBalanceId: variables.currencyBalanceId,
                toCurrencyBalanceId: variables.toCurrencyBalanceId,
                amount: variables.amount,
                cashbackAmount: variables.cashbackAmount,
                fee: variables.fee,
                exchangeRate: variables.exchangeRate,
                description: variables.description,
                date: variables.date,
                type: variables.type,
                category: categories?.find((category: Category) => category.id === variables.categoryId) ?? null,
                currencyBalance: selectedAccount ? {
                    currencyCode: selectedAccount.currencyCode,
                } : null,
            };

            upsertTransactionAcrossCaches(queryClient, optimisticTransaction);

            return { snapshot };
        },
        onSuccess: (_data: any, variables: any) => {
            setOpen(false);

            posthog.capture('transaction_added', {
                type: variables.type,
                amount: variables.amount,
                category_id: variables.categoryId,
                is_split: splitEnabled
            });

            reset();
        },
        onError: (error: unknown, _variables: any, context: any) => {
            restoreOptimisticFinanceSnapshot(queryClient, context?.snapshot);
            console.error("Failed to create transaction:", error);
            toast.error(parseMutationErrorMessage(error));
        },
        onSettled: () => {
            utils.transaction.list.invalidate();
            utils.account.getTotalBalance.invalidate();
            utils.bank.getHierarchy.invalidate();
        },
    });

    const onSubmit = (data: CreateTransactionFormValues) => {
        const amount = Number(data.amount) || 0;
        const fee = data.type === 'transfer' ? (Number(data.fee) || 0) : 0;
        const required = amount + fee;

        if (
            selectedAccount &&
            (data.type === 'expense' || data.type === 'transfer') &&
            required > selectedAccount.balance
        ) {
            toast.error(
                `Insufficient funds. Available: ${selectedAccount.balance.toLocaleString()} ${selectedAccount.currencyCode}, Required: ${required.toLocaleString()} ${selectedAccount.currencyCode}`
            );
            return;
        }

        let finalCashback = 0;

        if (data.type === 'expense') {
            const val = Number(data.cashbackValue) || 0;
            if (data.cashbackMode === 'percent') {
                const calculated = (Number(data.amount) * val) / 100;
                const max = Number(data.cashbackMax) || Infinity;
                finalCashback = Math.min(calculated, max);
            } else {
                finalCashback = val;
            }
        }

        const payload = {
            currencyBalanceId: data.currencyBalanceId,
            categoryId: data.categoryId,
            amount: Number(data.amount),
            type: data.type,
            description: data.description,
            date: data.date,
            toCurrencyBalanceId: data.type === 'transfer' && data.toCurrencyBalanceId ? data.toCurrencyBalanceId : undefined,
            fee: data.type === 'transfer' && data.fee ? Number(data.fee) : 0,
            cashbackAmount: finalCashback,
            // Add split data if enabled
            ...(splitEnabled && data.type === 'expense' && selectedParticipants.length > 0 && {
                split: {
                    participantIds: selectedParticipants,
                    equalSplit,
                    amounts: selectedParticipants.map(pid => {
                        const acc = participantAccounts.find(a => a.participantId === pid)?.paybackCurrencyBalanceId;
                        return {
                            participantId: pid,
                            amount: !equalSplit ? (customAmounts.find(a => a.participantId === pid)?.amount || 0) : 1, // 1 is placeholder if equalSplit
                            paybackCurrencyBalanceId: (acc && acc !== '__none__') ? acc : undefined,
                        };
                    }),
                    includeSelf,
                    instantMoneyBack,
                    paybackCurrencyBalanceId: (instantMoneyBack && paybackCurrencyBalanceId && paybackCurrencyBalanceId !== '__none__') ? paybackCurrencyBalanceId : undefined,
                }
            })
        };
        recordAccountUsage(selectedAccount);
        recordAccountUsage(selectedToAccount);
        createTransaction.mutate(payload);
    };

    return (
        <Sheet open={open} onOpenChange={setOpen}>
            {trigger !== null && (
                <SheetTrigger asChild>
                    {trigger ?? (
                        <Button className="gap-2">
                            <Plus className="h-4 w-4" />
                            Add Transaction
                        </Button>
                    )}
                </SheetTrigger>
            )}
            <SheetContent
                side={isCompactMobile ? 'bottom' : 'right'}
                className="flex h-full flex-col max-[470px]:h-[92dvh] max-[470px]:rounded-t-2xl max-[470px]:pb-[calc(env(safe-area-inset-bottom)+1.5rem)]"
            >
                <SheetHeader className="px-1">
                    <SheetTitle>Add Transaction</SheetTitle>
                    <SheetDescription>
                        Record your income, expense, or transfer.
                    </SheetDescription>
                </SheetHeader>
                {favoriteShortcuts.length > 0 && (
                    <div className="pl-0 pr-1 py-6 border-b border-border/40">
                        <div className="mb-4">
                            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground/80">Starred Shortcuts</p>
                        </div>
                        <div className="flex flex-wrap gap-4">
                            {favoriteShortcuts.map((shortcut) => (
                                <button
                                    key={shortcut.id}
                                    onClick={() => onOpenShortcut?.(shortcut)}
                                    className={`flex flex-col items-center gap-2 group transition-all duration-300 ${selectedShortcut?.id === shortcut.id ? 'opacity-100' : 'opacity-80 hover:opacity-100'}`}
                                >
                                    <div
                                        className={`h-12 w-12 rounded-2xl flex items-center justify-center text-xl transition-all duration-300 border-2 relative overflow-hidden ${selectedShortcut?.id === shortcut.id
                                            ? 'border-primary ring-4 ring-primary/20 scale-105 shadow-md'
                                            : 'border-muted-foreground/10 hover:border-muted-foreground/20'
                                            }`}
                                        title={shortcut.name}
                                        style={{
                                            background: shortcut.type === 'income'
                                                ? 'linear-gradient(135deg, rgba(34, 197, 94, 0.15), rgba(34, 197, 94, 0.05))'
                                                : shortcut.type === 'expense'
                                                    ? 'linear-gradient(135deg, rgba(239, 68, 68, 0.15), rgba(239, 68, 68, 0.05))'
                                                    : 'linear-gradient(135deg, rgba(59, 130, 246, 0.15), rgba(59, 130, 246, 0.05))'
                                        }}
                                    >
                                        <div className="absolute inset-0 bg-white/5 group-hover:bg-white/10 transition-colors" />
                                        <span className="relative z-10 drop-shadow-sm group-hover:animate-bounce-short">
                                            {shortcut.icon || '💰'}
                                        </span>
                                    </div>
                                    <span className="text-[10px] font-semibold text-muted-foreground group-hover:text-foreground transition-colors max-w-[48px] truncate">
                                        {shortcut.name}
                                    </span>
                                </button>
                            ))}
                        </div>
                    </div>
                )}
                <div className="flex-1 overflow-y-auto px-1">
                    <form onSubmit={handleSubmit(onSubmit, (errors) => {
                        const errorMessages = Object.values(errors).map(e => e?.message).filter(Boolean);
                        if (errorMessages.length > 0) {
                            toast.error(`Please fill required fields: ${errorMessages.join(', ')}`);
                        }
                    })} className="space-y-2 pt-2 pb-4">
                        <Tabs defaultValue={watch('type') || 'expense'} onValueChange={(val) => setValue('type', val as 'income' | 'expense' | 'transfer')} className="w-full">
                            <TabsList className="grid w-full grid-cols-3">
                                <TabsTrigger value="expense">Expense</TabsTrigger>
                                <TabsTrigger value="income">Income</TabsTrigger>
                                <TabsTrigger value="transfer">Transfer</TabsTrigger>
                            </TabsList>
                        </Tabs>

                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <Label>
                                    {transactionType === 'transfer' ? 'From Account' : 'Account'}
                                </Label>
                                {selectedAccount && (
                                    <span className="text-xs font-medium text-muted-foreground animate-in fade-in duration-300">
                                        Balance: {selectedAccount.balance.toLocaleString()} {selectedAccount.currencyCode}
                                    </span>
                                )}
                            </div>
                            <GroupedAccountPicker
                                banks={banks as any[] | undefined}
                                options={currencyOptions}
                                recommendedOptions={recommendedCurrencyOptions}
                                value={watch('currencyBalanceId') || ''}
                                selectedAccount={selectedAccount}
                                requiredCurrencyCode={draftCurrencyCode}
                                placeholder="Select Account"
                                open={accountPickerOpen}
                                onOpenChange={setAccountPickerOpen}
                                onSelect={(opt) => {
                                    setValue('currencyBalanceId', opt.id, { shouldValidate: true });
                                    setValue('currencyCode', opt.currencyCode);
                                    recordAccountUsage(opt);
                                }}
                                onAddCurrency={(account) => {
                                    if (!draftCurrencyCode) return;
                                    addCurrency.mutate({
                                        accountId: account.id,
                                        currencyCode: draftCurrencyCode,
                                        initialBalance: 0,
                                    });
                                }}
                                isAddingCurrency={addCurrency.isLoading}
                                isCompactMobile={isCompactMobile}
                            />
                            {draftCurrencyCode && !hasMatchingDraftCurrency && (
                                <p className="text-xs text-amber-500">
                                    This draft is in {draftCurrencyCode}. Add a {draftCurrencyCode} balance to one of your accounts to save it without changing currency.
                                </p>
                            )}
                            {selectedCurrencyMismatch && (
                                <p className="text-xs text-amber-500">
                                    Selected account is {selectedAccount?.currencyCode}, but this draft is {draftCurrencyCode}. Use a matching balance to keep the original currency.
                                </p>
                            )}
                            {errors.currencyBalanceId && <p className="text-sm text-red-500 mt-1">{errors.currencyBalanceId.message}</p>}
                        </div>

                        {transactionType === 'transfer' && (
                            <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                                <div className="flex items-center justify-between">
                                    <Label>
                                        To Account
                                    </Label>
                                    {selectedToAccount && (
                                        <span className="text-xs font-medium text-muted-foreground animate-in fade-in duration-300">
                                            Balance: {selectedToAccount.balance.toLocaleString()} {selectedToAccount.currencyCode}
                                        </span>
                                    )}
                                </div>
                                <GroupedAccountPicker
                                    banks={banks as any[] | undefined}
                                    options={currencyOptions}
                                    recommendedOptions={recommendedCurrencyOptions}
                                    value={watch('toCurrencyBalanceId') || ''}
                                    selectedAccount={selectedToAccount}
                                    placeholder="Select Target Account"
                                    open={transferAccountPickerOpen}
                                    onOpenChange={setTransferAccountPickerOpen}
                                    onSelect={(opt) => {
                                        setValue('toCurrencyBalanceId', opt.id);
                                        recordAccountUsage(opt);
                                    }}
                                    disabledOptionId={currencyBalanceId}
                                    isCompactMobile={isCompactMobile}
                                />
                                {errors.toCurrencyBalanceId && <p className="text-sm text-red-500 mt-1">{errors.toCurrencyBalanceId.message}</p>}
                            </div>
                        )}



                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Label>Category</Label>
                                    <ManageCategoriesSheet
                                        defaultType={transactionType === 'transfer' ? undefined : transactionType}
                                        trigger={
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                type="button"
                                                className="h-5 w-5 text-muted-foreground hover:text-foreground transition-colors"
                                            >
                                                <Settings2 className="h-3 w-3" />
                                            </Button>
                                        }
                                    />
                                </div>
                                {selectedCategory && (
                                    <span
                                        className="text-[10px] font-bold px-2 py-0.5 rounded border animate-in fade-in zoom-in duration-300 flex items-center gap-1.5"
                                        style={{
                                            backgroundColor: `${selectedCategory.color}15`,
                                            borderColor: `${selectedCategory.color}40`,
                                            color: selectedCategory.color
                                        }}
                                    >
                                        <span className="text-xs">{selectedCategory.icon}</span>
                                        {selectedCategory.name}
                                    </span>
                                )}
                            </div>
                            <Select onValueChange={(val) => setValue('categoryId', val)} value={watch('categoryId') || ''}>
                                <SelectTrigger className="h-9 bg-background border-muted-foreground/20">
                                    <SelectValue placeholder="Select Category" />
                                </SelectTrigger>
                                <SelectContent>
                                    {filteredCategories?.map((cat: Category) => (
                                        <SelectItem key={cat.id} value={cat.id}>
                                            <div className="flex items-center gap-2.5 py-0.5">
                                                <div
                                                    className="flex h-7 w-7 items-center justify-center rounded-md text-sm shadow-sm border border-transparent"
                                                    style={{ backgroundColor: `${cat.color}20` }}
                                                >
                                                    {cat.icon}
                                                </div>
                                                <span className="font-medium text-sm">{cat.name}</span>
                                            </div>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {errors.categoryId && <p className="text-sm text-red-500 mt-1">{errors.categoryId.message}</p>}
                        </div>

                        <div className="space-y-2">
                            <Label>Amount</Label>
                            <div className="relative group">
                                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-foreground transition-colors">
                                    <span className="text-lg font-semibold">{selectedAccount?.currencyCode || draftCurrencyCode || preselectedCurrencyCode || '$'}</span>
                                </div>
                                <Input
                                    id="amount"
                                    type="number"
                                    step="0.01"
                                    placeholder="0.00"
                                    {...register('amount')}
                                    className="h-12 pl-14 text-lg font-semibold bg-background border-muted-foreground/20"
                                />
                            </div>
                            {errors.amount && <p className="text-sm text-red-500 mt-1">{errors.amount.message}</p>}
                            {hasInsufficientFunds && selectedAccount && (
                                <p className="text-sm text-red-500 mt-1">
                                    Insufficient funds. Available: {selectedAccount.balance.toLocaleString()} {selectedAccount.currencyCode}, Required: {requiredAmount.toLocaleString()} {selectedAccount.currencyCode}
                                </p>
                            )}
                        </div>

                        {transactionType === 'transfer' && (
                            <div className="space-y-2">
                                <Label htmlFor="fee" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground ml-1">Transfer Fee (Optional)</Label>
                                <Input id="fee" type="number" step="0.01" placeholder="0.00" {...register('fee')} className="h-10 bg-background border-muted-foreground/20" />
                                {errors.fee && <p className="text-sm text-red-500 mt-1">{errors.fee.message}</p>}
                            </div>
                        )}

                        {transactionType === 'expense' && (
                            <div className="space-y-3 rounded-2xl bg-white/[0.035] p-4 ring-1 ring-inset ring-white/[0.06]">
                                <div className="flex items-center justify-between">
                                    <Label>Cashback</Label>
                                    <div className="flex bg-muted rounded-lg p-1">
                                        <button
                                            type="button"
                                            onClick={() => setValue('cashbackMode', 'amount')}
                                            className={`text-xs px-2 py-1 rounded-md transition-all ${watch('cashbackMode') === 'amount' ? 'bg-background shadow font-medium' : 'text-muted-foreground'}`}
                                        >
                                            Amount
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setValue('cashbackMode', 'percent')}
                                            className={`text-xs px-2 py-1 rounded-md transition-all ${watch('cashbackMode') === 'percent' ? 'bg-background shadow font-medium' : 'text-muted-foreground'}`}
                                        >
                                            Percent %
                                        </button>
                                    </div>
                                </div>

                                <div className="flex gap-2">
                                    <div className="flex-1">
                                        <Input
                                            type="number"
                                            step="0.01"
                                            placeholder={watch('cashbackMode') === 'percent' ? "e.g. 5%" : "0.00"}
                                            {...register('cashbackValue')}
                                        />
                                    </div>
                                    {watch('cashbackMode') === 'percent' && (
                                        <div className="w-1/3">
                                            <Input
                                                type="number"
                                                step="1"
                                                placeholder="Max"
                                                title="Max Limit"
                                                {...register('cashbackMax')}
                                            />
                                        </div>
                                    )}
                                </div>

                                {watch('cashbackMode') === 'percent' && watch('amount') && watch('cashbackValue') && (
                                    <p className="text-xs text-muted-foreground text-right">
                                        = {Math.min(
                                            (Number(watch('amount')) * Number(watch('cashbackValue'))) / 100,
                                            Number(watch('cashbackMax')) || Infinity
                                        ).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                    </p>
                                )}
                            </div>
                        )}

                        {transactionType === 'expense' && (
                            <div className="space-y-3 rounded-2xl bg-white/[0.035] p-4 ring-1 ring-inset ring-white/[0.06]">
                                <div className="flex items-center justify-between">
                                    <Label>Split with others</Label>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        className="h-auto py-1 px-2 text-xs"
                                        onClick={() => setSplitEnabled(!splitEnabled)}
                                    >
                                        {splitEnabled ? 'Enabled' : 'Disabled'}
                                    </Button>
                                </div>
                                {splitEnabled && (
                                    <SplitSelector
                                        selectedParticipants={selectedParticipants}
                                        onSelectionChange={setSelectedParticipants}
                                        equalSplit={equalSplit}
                                        onEqualSplitChange={setEqualSplit}
                                        customAmounts={customAmounts}
                                        onCustomAmountsChange={setCustomAmounts}
                                        participantAccounts={participantAccounts}
                                        onParticipantAccountsChange={setParticipantAccounts}
                                        transactionAmount={Number(watch('amount')) || 0}
                                        includeSelf={includeSelf}
                                        onIncludeSelfChange={setIncludeSelf}
                                        instantMoneyBack={instantMoneyBack}
                                        onInstantMoneyBackChange={setInstantMoneyBack}
                                        paybackCurrencyBalanceId={paybackCurrencyBalanceId}
                                        onPaybackCurrencyBalanceIdChange={setPaybackCurrencyBalanceId}
                                        currencyOptions={currencyOptions}
                                    />
                                )}
                            </div>
                        )}

                        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                            <div className="space-y-2">
                                <Label htmlFor="date" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground ml-1">Date</Label>
                                <div className="relative">
                                    <button
                                        type="button"
                                        aria-label="Open date picker"
                                        className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground/70 hover:text-foreground transition-colors"
                                        onClick={() => {
                                            const el = dateInputRef.current;
                                            if (!el) return;
                                            el.focus();
                                            (el as HTMLInputElement & { showPicker?: () => void }).showPicker?.();
                                        }}
                                    >
                                        <Calendar className="h-4 w-4" />
                                    </button>
                                    <Input
                                        id="date"
                                        type="date"
                                        {...dateField}
                                        ref={(el) => {
                                            dateField.ref(el);
                                            dateInputRef.current = el;
                                        }}
                                        className="h-10 pl-9 bg-background border-muted-foreground/20"
                                    />
                                </div>
                                {errors.date && <p className="text-sm text-red-500 mt-1">{(errors.date as any).message}</p>}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="description" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground ml-1">Description</Label>
                                <div className="relative">
                                    <FileText className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input id="description" placeholder="Notes..." {...register('description')} className="h-10 pl-9 bg-background border-muted-foreground/20" />
                                </div>
                                {errors.description && <p className="text-sm text-red-500 mt-1">{(errors.description as any).message}</p>}
                            </div>
                        </div>

                        <SheetFooter className="flex flex-row items-center gap-2 mt-2">
                            {onSaveAsShortcut && (
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="icon"
                                    className="h-10 w-10 rounded-xl shrink-0 border-muted-foreground/20"
                                    disabled={!canSaveAsShortcut}
                                    onClick={() => {
                                        const { currencyBalanceId, categoryId, type, amount, description } = watchedValues;
                                        if (!currencyBalanceId || !categoryId) {
                                            toast.error('Please select account and category first');
                                            return;
                                        }
                                        onSaveAsShortcut({
                                            type: type,
                                            currencyBalanceId,
                                            categoryId,
                                            amount: amount ? Number(amount) : undefined,
                                            description: description || undefined,
                                        });
                                    }}
                                    title="Save as Shortcut"
                                >
                                    <Bookmark className="h-4 w-4 text-primary" />
                                </Button>
                            )}
                            <Button
                                type="submit"
                                className="flex-1 h-10 rounded-xl font-bold shadow-lg shadow-primary/20 transition-all ml-auto"
                                disabled={createTransaction.isLoading || hasInsufficientFunds}
                            >
                                {!createTransaction.isLoading && <Plus className="h-4 w-4 mr-1" />}
                                {createTransaction.isLoading ? 'Adding...' : 'Add Transaction'}
                            </Button>
                        </SheetFooter>
                    </form>
                </div>
            </SheetContent>
        </Sheet>
    );
}
