import { ActionButton } from '@/components/ui/action-button';

import { useState, useMemo, useEffect, useRef } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Pencil, Trash2, MoreHorizontal, Banknote, Plus, Info, UserCheck, ArrowUpRight, ArrowDownLeft, CheckCircle2, HandCoins } from 'lucide-react';
import { GlassCard, Segmented, StatTile, tint } from '@/components/ui/glass';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { Switch } from '@/components/ui/switch';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { PageHeader } from '@/components/PageHeader';
import { AddDebtSheet } from '@/components/AddDebtSheet';
import { AddDebtPaymentSheet } from '@/components/AddDebtPaymentSheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetFooter,
    SheetClose
} from '@/components/ui/sheet';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { CurrencyDisplay } from '@/components/CurrencyDisplay';
import { trpc } from '@/lib/trpc';
import { Skeleton } from '@/components/ui/skeleton';

interface Debt {
    id: string;
    personName: string;
    linkedUser?: {
        id: string;
        username: string | null;
        name: string | null;
    } | null;
    personContact?: string | null;
    amount: string | number;
    type: 'i_owe' | 'they_owe';
    status: 'pending' | 'partial' | 'paid' | 'awaiting_approval';
    description?: string | null;
    dueDate?: string | null;
    paidAmount?: string | number | null;
    currencyCode?: string | null;
    currencyBalance: {
        currencyCode: string;
        account: {
            id: string;
            name: string;
            bank?: {
                name: string;
            }
        };
    } | null;
    payments?: {
        id: string;
        amount: string | number;
        paidAt: string;
        note?: string | null;
        transactions?: {
            id: string;
            amount: string;
            currencyBalanceId: string;
        }[];
    }[];
}

const editDebtSchema = z.object({
    personName: z.string().min(1, "Name is required").max(100),
    amount: z.number().positive("Amount must be positive"),
    description: z.string().optional(),
    dueDate: z.string().optional(),
});

type EditDebtForm = z.infer<typeof editDebtSchema>;

const editPaymentSchema = z.object({
    amount: z.number().positive("Amount must be positive"),
    paidAt: z.string().min(1, "Date is required"),
    note: z.string().optional(),
    isSplit: z.boolean(),
    distributions: z.array(z.object({
        currencyBalanceId: z.string().min(1, "Account required"),
        amount: z.number().min(0.01, "Amount must be greater than 0"),
    })).min(1),
});

type EditPaymentForm = z.infer<typeof editPaymentSchema>;

export function DebtsPage() {
    const { data: debtsData, isLoading } = trpc.debt.list.useQuery({}) as { data: { debts: Debt[], total: number } | undefined, isLoading: boolean };
    const { data: incomingDebtRequests } = trpc.debt.listIncomingRequests.useQuery({ limit: 10 }, { refetchInterval: 5000 });
    const { data: incomingSplitRequests } = trpc.splitBill.listIncomingRequests.useQuery({ limit: 10 });
    const { data: pendingIncomingReceipts } = trpc.splitBill.listPendingIncomingReceipts.useQuery({ limit: 10 });
    const { data: pendingSplits, isLoading: isLoadingSplits } = trpc.splitBill.getPendingSplits.useQuery({});
    const { data: accountsData } = trpc.account.list.useQuery({});
    const { data: banks } = trpc.bank.getHierarchy.useQuery();
    const utils = trpc.useUtils();

    const [editingDebt, setEditingDebt] = useState<Debt | null>(null);
    const [payingDebt, setPayingDebt] = useState<Debt | null>(null);
    const [editingPayment, setEditingPayment] = useState<{ id: string, amount: number, note: string | null, paidAt: string, debt: Debt } | null>(null);
    const [detailDebtId, setDetailDebtId] = useState<string | null>(null);

    const detailDebt = useMemo(() => {
        if (!detailDebtId) return null;
        return (debtsData?.debts || []).find(d => d.id === detailDebtId) || null;
    }, [debtsData?.debts, detailDebtId]);

    const setDetailDebt = (debt: Debt | null) => {
        setDetailDebtId(debt?.id || null);
        setDetailPaymentsPage(1);
    };
    const detailHistoryRef = useRef<HTMLDivElement | null>(null);
    const paymentPageSize = 10;
    const [detailPaymentsPage, setDetailPaymentsPage] = useState(1);
    const itemsPerPage = 6;
    const [debtTab, setDebtTab] = useState<'owe' | 'owed' | 'settled'>('owe');
    const [visibleCount, setVisibleCount] = useState(itemsPerPage);

    // Split payment state
    const [recordPaymentSplit, setRecordPaymentSplit] = useState<{
        splitId: string;
        participantName: string;
        remaining: number;
        currencyCode: string;
        transactionId: string;
        transactionDescription: string;
    } | null>(null);
    const [splitPaymentAmount, setSplitPaymentAmount] = useState('');
    const [splitPaymentDate, setSplitPaymentDate] = useState(new Date().toISOString().split('T')[0]);
    const [splitPaymentAccountId, setSplitPaymentAccountId] = useState('');
    const [incomingDebtAccountSelections, setIncomingDebtAccountSelections] = useState<Record<string, string>>({});
    const [receiptAccountSelections, setReceiptAccountSelections] = useState<Record<string, string>>({});
    const [respondingSplitId, setRespondingSplitId] = useState<string | null>(null);
    const [payNowRequest, setPayNowRequest] = useState<any | null>(null);
    const [payNowAmount, setPayNowAmount] = useState('');
    const [payNowPayerAccountId, setPayNowPayerAccountId] = useState('');
    const [payNowReceiverAccountId, setPayNowReceiverAccountId] = useState('__manual__');

    const recordSplitPayment = trpc.splitBill.recordPayment.useMutation({
        onSuccess: () => {
            utils.splitBill.getPendingSplits.invalidate();
            utils.transaction.list.invalidate();
            toast.success('Payment recorded');
            setRecordPaymentSplit(null);
            setSplitPaymentAmount('');
            setSplitPaymentDate(new Date().toISOString().split('T')[0]);
            setSplitPaymentAccountId('');
        },
        onError: (error: any) => {
            toast.error(error.message || 'Failed to record payment');
        }
    });

    const respondToIncomingSplit = trpc.splitBill.respondToIncomingRequest.useMutation({
        onSuccess: () => {
            utils.splitBill.listIncomingRequests.invalidate();
            utils.splitBill.getPendingSplits.invalidate();
            utils.transaction.list.invalidate();
            utils.debt.list.invalidate();
            utils.notification.list.invalidate();
            toast.success('Split request processed');
            setRespondingSplitId(null);
        },
        onError: (error: any) => {
            toast.error(error.message || 'Failed to process split request');
            setRespondingSplitId(null);
        }
    });

    const payIncomingNow = trpc.splitBill.payIncomingRequestNow.useMutation({
        onSuccess: () => {
            utils.splitBill.listIncomingRequests.invalidate();
            utils.splitBill.getPendingSplits.invalidate();
            utils.transaction.list.invalidate();
            utils.debt.list.invalidate();
            utils.account.list.invalidate();
            utils.account.getTotalBalance.invalidate();
            utils.bank.getHierarchy.invalidate();
            utils.notification.list.invalidate();
            toast.success('Split paid successfully');
            setPayNowRequest(null);
            setPayNowAmount('');
            setPayNowPayerAccountId('');
            setPayNowReceiverAccountId('__manual__');
        },
        onError: (error: any) => {
            toast.error(error.message || 'Failed to process payment');
        }
    });

    const assignIncomingReceipt = trpc.splitBill.assignIncomingReceipt.useMutation({
        onSuccess: () => {
            utils.splitBill.listPendingIncomingReceipts.invalidate();
            utils.transaction.list.invalidate();
            utils.account.list.invalidate();
            utils.account.getTotalBalance.invalidate();
            utils.bank.getHierarchy.invalidate();
            utils.notification.list.invalidate();
            toast.success('Incoming payment assigned to account');
        },
        onError: (error: any) => {
            toast.error(error.message || 'Failed to assign incoming payment');
        }
    });

    const respondToIncomingDebtRequest = trpc.debt.respondToIncomingRequest.useMutation({
        onSuccess: () => {
            utils.debt.listIncomingRequests.invalidate();
            utils.debt.list.invalidate();
            utils.notification.list.invalidate();
            utils.transaction.list.invalidate();
            utils.account.list.invalidate();
            utils.account.getTotalBalance.invalidate();
            utils.bank.getHierarchy.invalidate();
            toast.success('Debt request processed');
        },
        onError: (error: any) => {
            toast.error(error.message || 'Failed to process debt request');
        },
    });

    const { register, handleSubmit, reset, formState: { errors } } = useForm<EditDebtForm>({
        resolver: zodResolver(editDebtSchema),
    });

    const {
        register: registerPayment,
        handleSubmit: handleSubmitPayment,
        reset: resetPayment,
        watch: watchPayment,
        setValue: setValuePayment,
        control: controlPayment,
        formState: { errors: paymentErrors }
    } = useForm<EditPaymentForm>({
        resolver: zodResolver(editPaymentSchema),
    });

    const { fields: paymentFields, append: appendPayment, remove: removePayment } = useFieldArray({
        control: controlPayment,
        name: "distributions"
    });

    const isPaymentSplit = watchPayment('isSplit');
    const paymentTotalAmount = watchPayment('amount');
    const watchedPaymentDistributions = watchPayment('distributions');

    const availableAccounts = useMemo(() => {
        if (!editingPayment?.debt || !accountsData) return [];
        const debtCurrencyCode = editingPayment.debt.currencyBalance?.currencyCode || editingPayment.debt.currencyCode;
        if (!debtCurrencyCode) return [];

        return (accountsData as any[]).flatMap(acc =>
            (acc.currencyBalances as any[])
                .filter(cb => cb.currencyCode === debtCurrencyCode)
                .map(cb => ({
                    id: cb.id,
                    label: `[${acc.bank?.name || 'Unknown'}] ${acc.name} - ${cb.currencyCode}`
                }))
        );
    }, [editingPayment?.debt, accountsData]);

    const currencyOptions = useMemo(() => {
        if (!banks) return [];
        const options: { id: string; label: string; currencyCode: string; balance: number }[] = [];
        banks.forEach((bank: any) => {
            bank.accounts?.forEach((acc: any) => {
                acc.currencyBalances?.forEach((cb: any) => {
                    options.push({
                        id: cb.id,
                        label: `[${bank.name}] ${acc.name}`,
                        currencyCode: cb.currencyCode,
                        balance: Number(cb.balance),
                    });
                });
            });
        });
        return options;
    }, [banks]);

    const payNowRequestedAmount = Number(payNowAmount) || 0;
    const payNowOriginalRemaining = Number(payNowRequest?.remainingAmount || 0);
    const isPayNowOverpay = payNowRequestedAmount > payNowOriginalRemaining && payNowOriginalRemaining > 0;
    const selectedPayNowAccount = currencyOptions.find((opt) => opt.id === payNowPayerAccountId);
    const isPayNowInsufficient = Boolean(selectedPayNowAccount && payNowRequestedAmount > selectedPayNowAccount.balance);

    // Note: Backend doesn't have debt.update yet, so we'll just show the form
    const updateDebt = trpc.debt.update.useMutation({
        onSuccess: () => {
            utils.debt.list.invalidate();
            toast.success('Debt updated successfully');
            setEditingDebt(null);
            reset();
        },
        onError: (error: unknown) => {
            toast.error('Failed to update debt');
            console.error(error);
        }
    });

    const softDeleteDebt = trpc.debt.softDelete.useMutation({
        onSuccess: () => {
            utils.debt.list.invalidate();
            utils.account.list.invalidate();
        },
        onError: (error: unknown) => {
            toast.error('Failed to delete debt');
            console.error(error);
        }
    });

    const undoDeleteDebt = trpc.debt.undoDelete.useMutation({
        onSuccess: () => {
            utils.debt.list.invalidate();
            utils.account.list.invalidate();
            toast.success('Debt restored');
        },
        onError: (error: unknown) => {
            toast.error('Failed to restore debt');
            console.error(error);
        }
    });

    const deletePayment = trpc.debt.deletePayment.useMutation({
        onSuccess: () => {
            utils.debt.list.invalidate();
            utils.bank.getHierarchy.invalidate();
            utils.account.getTotalBalance.invalidate();
            toast.success('Payment deleted and balance reverted');
        },
        onError: (error: unknown) => {
            toast.error('Failed to delete payment');
            console.error(error);
        }
    });

    const updatePayment = trpc.debt.updatePayment.useMutation({
        onSuccess: () => {
            utils.debt.list.invalidate();
            toast.success('Payment updated successfully');
            setEditingPayment(null);
            resetPayment();
        },
        onError: (error: any) => {
            toast.error(error.message || 'Failed to update payment');
            console.error(error);
        }
    });

    const handleEdit = (debt: Debt) => {
        setEditingDebt(debt);
        reset({
            personName: debt.personName,
            amount: Number(debt.amount),
            description: debt.description || '',
            dueDate: debt.dueDate || '',
        });
    };

    const handleEditPayment = (payment: NonNullable<Debt['payments']>[number], debt: Debt) => {
        const distributions = payment.transactions?.map((tx: any) => ({
            currencyBalanceId: tx.currencyBalanceId,
            amount: Number(tx.amount)
        })) || [];

        const isSplit = distributions.length > 1;

        setEditingPayment({
            id: payment.id,
            amount: Number(payment.amount),
            note: payment.note || '',
            paidAt: new Date(payment.paidAt).toISOString().split('T')[0],
            debt
        });

        resetPayment({
            amount: Number(payment.amount),
            note: payment.note || '',
            paidAt: new Date(payment.paidAt).toISOString().split('T')[0],
            isSplit,
            distributions: distributions.length > 0 ? distributions : [{ currencyBalanceId: '', amount: Number(payment.amount) }]
        });
    };

    const handlePayment = (debt: Debt) => {
        setPayingDebt(debt);
    };

    const onSubmitEdit = (data: EditDebtForm) => {
        if (!editingDebt) return;
        updateDebt.mutate({
            id: editingDebt.id,
            ...data
        });
    };

    const onSubmitEditPayment = (data: EditPaymentForm) => {
        if (!editingPayment) return;
        updatePayment.mutate({
            id: editingPayment.id,
            amount: data.amount,
            paidAt: data.paidAt,
            note: data.note,
            distributions: data.distributions
        });
    };

    const handleDelete = (debt: Debt) => {
        softDeleteDebt.mutate({ id: debt.id }, {
            onSuccess: () => {
                toast(`Debt from "${debt.personName}" deleted`, {
                    action: {
                        label: 'Undo',
                        onClick: () => {
                            undoDeleteDebt.mutate({ id: debt.id });
                        },
                    },
                    duration: 5000,
                });
            }
        });
    };

    const allDebts = debtsData?.debts || [];
    const iOweDebts = allDebts.filter(d => d.type === 'i_owe');
    const theyOweDebts = allDebts.filter(d => d.type === 'they_owe');

    const getRemaining = (debt: Debt) => Number(debt.amount) - Number(debt.paidAmount || 0);
    const isSettled = (debt: Debt) => getRemaining(debt) <= 0.01;

    const iOweActive = allDebts.filter(d => d.type === 'i_owe' && !isSettled(d));
    const theyOweActive = allDebts.filter(d => d.type === 'they_owe' && !isSettled(d));
    const historyDebts = allDebts.filter(d => isSettled(d));

    const detailPayments = detailDebt?.payments || [];
    const visibleDetailPayments = detailPayments.slice(0, detailPaymentsPage * paymentPageSize);
    const hasMoreDetailPayments = visibleDetailPayments.length < detailPayments.length;

    const latestDebt = useMemo(() => {
        if (!detailDebt) return null;
        return allDebts.find((debt) => debt.id === detailDebt.id) || null;
    }, [allDebts, detailDebt?.id]);

    // Use latestDebt where needed or just let useMemo handle it via detailDebtId
    // The previous useEffect that was calling setDetailDebt(latest) is no longer needed
    // because detailDebt is now a useMemo that tracks allDebts automatically.

    useEffect(() => {
        const el = detailHistoryRef.current;
        if (!el || !detailDebt) return;

        const onScroll = () => {
            if (!hasMoreDetailPayments) return;
            const nearBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 80;
            if (nearBottom) {
                setDetailPaymentsPage((prev) => prev + 1);
            }
        };

        el.addEventListener('scroll', onScroll, { passive: true });
        return () => el.removeEventListener('scroll', onScroll);
    }, [detailDebt, hasMoreDetailPayments]);

    const debtCurrency = (debt: Debt) => debt.currencyBalance?.currencyCode || debt.currencyCode || 'USD';

    type SplitRow = {
        split: any;
        owed: number;
        remaining: number;
        currency: string;
        description: string;
        dateDisplay: string;
        participantName: string;
        participantColor: string;
    };

    const splitRows: SplitRow[] = ((pendingSplits || []) as any[]).map((split: any): SplitRow => {
        // Defensive access for amounts (try both camelCase and snake_case)
        const owed = Number(split.owedAmount ?? split.owed_amount ?? 0);
        const paid = Number(split.paidAmount ?? split.paid_amount ?? 0);
        const transaction = split.transaction;
        const dateValue = transaction?.date || split.createdAt;
        return {
            split,
            owed,
            remaining: Math.max(0, owed - paid),
            currency: transaction?.currencyBalance?.currencyCode || transaction?.currencyBalance?.currency?.code || 'USD',
            description: transaction?.description || transaction?.category?.name || 'Split bill',
            dateDisplay: dateValue ? new Date(dateValue).toLocaleDateString() : 'Unknown date',
            participantName: split.participant?.name || 'Unknown',
            participantColor: split.participant?.color || '#6366f1',
        };
    });

    const sumByCurrency = (items: { currency: string; amount: number }[]) => {
        const totals: Record<string, number> = {};
        items.forEach(({ currency, amount }) => {
            totals[currency] = (totals[currency] || 0) + amount;
        });
        return Object.entries(totals).sort((a, b) => b[1] - a[1]);
    };

    const oweTotals = sumByCurrency(iOweActive.map((d) => ({ currency: debtCurrency(d), amount: getRemaining(d) })));
    const owedTotals = sumByCurrency([
        ...theyOweActive.map((d) => ({ currency: debtCurrency(d), amount: getRemaining(d) })),
        ...splitRows.map((row) => ({ currency: row.currency, amount: row.remaining })),
    ]);

    const renderTotals = (totals: [string, number][], className?: string) => {
        if (totals.length === 0) return <span className="text-muted-foreground">0</span>;
        const [[currency, amount], ...rest] = totals;
        return (
            <span className="flex flex-col">
                <CurrencyDisplay amount={amount} currency={currency} className={className} />
                {rest.length > 0 && (
                    <span className="mt-1 text-xs font-medium text-muted-foreground">
                        {rest.map(([code, value], idx) => (
                            <span key={code}>
                                {idx > 0 && ' · '}
                                <CurrencyDisplay amount={value} currency={code} abbreviate />
                            </span>
                        ))}
                    </span>
                )}
            </span>
        );
    };

    const owedCount = theyOweActive.length + splitRows.length;
    const tabDebts = debtTab === 'owe' ? iOweActive : debtTab === 'owed' ? theyOweActive : historyDebts;
    const visibleTabDebts = tabDebts.slice(0, visibleCount);
    const pendingRequestCount =
        (incomingSplitRequests?.length || 0) +
        (pendingIncomingReceipts?.length || 0) +
        (incomingDebtRequests?.length || 0);

    const openSplitPayment = (row: SplitRow) => {
        setSplitPaymentAmount(String(row.remaining));
        setRecordPaymentSplit({
            splitId: row.split.id,
            participantName: row.participantName,
            remaining: row.remaining,
            currencyCode: row.currency,
            transactionId: row.split.transactionId,
            transactionDescription: row.description,
        });
    };

    const focusIncomingRequest = (debt: Debt) => {
        const notification = incomingDebtRequests?.find((r: any) => r.debtId === debt.id);
        const el = notification ? document.getElementById(`notification-${notification.notificationId}`) : null;
        if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            el.classList.add('ring-2', 'ring-primary', 'ring-offset-2', 'ring-offset-background');
            setTimeout(() => el.classList.remove('ring-2', 'ring-primary', 'ring-offset-2', 'ring-offset-background'), 3000);
        } else {
            toast.info("Please respond to this request in the 'Needs your attention' section at the top.");
        }
    };

    const DebtRow = ({ debt }: { debt: Debt }) => {
        const remaining = getRemaining(debt);
        const total = Number(debt.amount);
        const settled = isSettled(debt);
        const currency = debtCurrency(debt);
        const isLent = debt.type === 'they_owe';
        const accent = settled ? '#A1A1AA' : isLent ? '#34D399' : '#FB7185';
        const progress = total > 0 ? Math.min(100, Math.max(0, ((total - remaining) / total) * 100)) : 0;

        const personNameClean = debt.personName.replace(/^@/, '').toLowerCase();
        const usernameClean = debt.linkedUser?.username?.toLowerCase();
        const isDuplicate = usernameClean === personNameClean;
        const isAwaiting = debt.status === 'awaiting_approval';
        const isOverdue = !settled && !!debt.dueDate && new Date(debt.dueDate) < new Date(new Date().toDateString());

        const title = debt.description || (isLent ? 'Lent money' : 'Borrowed money');
        const initials = debt.personName.replace(/^@/, '').trim().slice(0, 2).toUpperCase() || '?';

        return (
            <div
                role="button"
                tabIndex={0}
                onClick={() => setDetailDebt(debt)}
                onKeyDown={(e) => e.key === 'Enter' && setDetailDebt(debt)}
                className={cn(
                    'group flex items-center gap-3 rounded-2xl px-2.5 py-3 sm:px-3 cursor-pointer transition-colors hover:bg-white/[0.04]',
                    isAwaiting && 'opacity-75'
                )}
            >
                <div
                    className="flex size-10 shrink-0 items-center justify-center rounded-full text-xs font-bold"
                    style={{ backgroundColor: tint(accent, 0.14), color: accent, boxShadow: `inset 0 0 0 1px ${tint(accent, 0.25)}` }}
                >
                    {initials}
                </div>

                <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                        <p className="truncate text-sm font-semibold text-foreground">{title}</p>
                        {isAwaiting && (
                            <span className="shrink-0 rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-400">
                                Pending
                            </span>
                        )}
                    </div>
                    <p className="mt-0.5 truncate text-xs text-muted-foreground">
                        {debt.personName}
                        {debt.linkedUser?.username && !isDuplicate && <span className="opacity-70"> · @{debt.linkedUser.username}</span>}
                        {debt.dueDate && (
                            <span className={cn(isOverdue && 'font-semibold text-amber-400')}>
                                {' · '}{isOverdue ? 'Overdue ' : 'Due '}{new Date(debt.dueDate).toLocaleDateString()}
                            </span>
                        )}
                    </p>
                    {!settled && progress > 0 && (
                        <div className="mt-2 h-1 w-full max-w-[220px] overflow-hidden rounded-full bg-white/[0.08]">
                            <div className="h-full rounded-full" style={{ width: `${progress}%`, backgroundColor: accent }} />
                        </div>
                    )}
                </div>

                <div className="shrink-0 text-right">
                    <CurrencyDisplay
                        amount={settled ? total : remaining}
                        currency={currency}
                        className="text-sm font-bold tabular-nums"
                        color={settled ? undefined : accent}
                    />
                    <p className="mt-0.5 text-[11px] text-muted-foreground">
                        {settled ? 'Settled' : progress > 0 ? <>of <CurrencyDisplay amount={total} currency={currency} abbreviate /></> : isLent ? 'to receive' : 'to repay'}
                    </p>
                </div>

                <div className="flex shrink-0 items-center gap-0.5" onClick={(e) => e.stopPropagation()}>
                    {isAwaiting ? (
                        <Button variant="outline" size="sm" className="h-8 text-xs" onClick={() => focusIncomingRequest(debt)}>
                            Respond
                        </Button>
                    ) : (
                        !settled && (
                            <Button
                                variant="ghost"
                                size="icon"
                                className="hidden h-8 w-8 sm:inline-flex"
                                onClick={() => handlePayment(debt)}
                                title="Record repayment"
                            >
                                <Banknote className="h-4 w-4" />
                            </Button>
                        )
                    )}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
                                <MoreHorizontal className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => setDetailDebt(debt)}>
                                <Info className="h-4 w-4 mr-2" />
                                View Details
                            </DropdownMenuItem>
                            {!settled && (
                                <DropdownMenuItem onClick={() => handlePayment(debt)}>
                                    <Banknote className="h-4 w-4 mr-2" />
                                    Record Repayment
                                </DropdownMenuItem>
                            )}
                            <DropdownMenuItem onClick={() => handleEdit(debt)}>
                                <Pencil className="h-4 w-4 mr-2" />
                                Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDelete(debt)} className="text-red-500 focus:text-red-500">
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>
        );
    };

    const requestRowClass = 'rounded-2xl border border-white/10 bg-white/[0.03] p-3 transition-all duration-300';

    return (
        <div className="space-y-4 md:space-y-6">
            <PageHeader
                title="Debts"
                subtitle="Who owes whom, at a glance"
                variant="one"
            >
                <AddDebtSheet
                    trigger={
                        <ActionButton className="sm:flex-none">
                            <Plus className="h-4 w-4" />
                            Add
                        </ActionButton>
                    }
                />
            </PageHeader>

            <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
                <StatTile
                    label="You owe"
                    color="#FB7185"
                    icon={<ArrowUpRight className="size-4" />}
                    value={isLoading ? <Skeleton className="h-7 w-28" /> : renderTotals(oweTotals)}
                    hint={`${iOweActive.length} open`}
                />
                <StatTile
                    label="Owed to you"
                    color="#34D399"
                    icon={<ArrowDownLeft className="size-4" />}
                    value={isLoading ? <Skeleton className="h-7 w-28" /> : renderTotals(owedTotals)}
                    hint={`${owedCount} open`}
                />
                <StatTile
                    label="Settled"
                    color="#8B5CF6"
                    icon={<CheckCircle2 className="size-4" />}
                    className="col-span-2 lg:col-span-1"
                    value={isLoading ? <Skeleton className="h-7 w-16" /> : historyDebts.length}
                    hint={pendingRequestCount > 0 ? `${pendingRequestCount} request${pendingRequestCount > 1 ? 's' : ''} waiting` : 'All caught up'}
                />
            </div>

            {pendingRequestCount > 0 && (
                <GlassCard auraColor="#8B5CF6" className="p-4 sm:p-5">
                    <div className="relative space-y-4">
                    <div className="relative flex items-center gap-2">
                        <span className="flex size-7 items-center justify-center rounded-lg bg-primary/20 text-violet-300">
                            <UserCheck className="h-4 w-4" />
                        </span>
                        <p className="text-sm font-semibold">Needs your attention</p>
                        <span className="rounded-full bg-primary/25 px-2 text-[11px] font-bold text-violet-200">{pendingRequestCount}</span>
                    </div>

                    {incomingSplitRequests && incomingSplitRequests.length > 0 && (
                        <div className="relative space-y-2">
                            <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-muted-foreground">Split requests</p>
                            {incomingSplitRequests.map((request: any) => (
                                <div key={request.id} className={requestRowClass}>
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="min-w-0">
                                            <p className="text-sm font-medium truncate">
                                                {request.fromUser?.name || request.fromUser?.username || request.participant?.name || 'Friend'}
                                            </p>
                                            <p className="text-xs text-muted-foreground truncate">
                                                {request.transaction?.description || 'Split bill request'}
                                            </p>
                                        </div>
                                        <CurrencyDisplay
                                            amount={Number(request.remainingAmount || 0)}
                                            currency={request.transaction?.currencyBalance?.currencyCode}
                                            className="text-sm font-semibold"
                                        />
                                    </div>
                                    <div className="mt-3 flex flex-wrap gap-2">
                                        <Button
                                            size="sm"
                                            disabled={respondToIncomingSplit.isPending && respondingSplitId === request.id}
                                            onClick={() => {
                                                const matchingPayer = currencyOptions.find(
                                                    (opt) => opt.currencyCode === request.transaction?.currencyBalance?.currencyCode
                                                );
                                                setPayNowRequest(request);
                                                setPayNowAmount(String(Number(request.remainingAmount || 0)));
                                                setPayNowPayerAccountId(matchingPayer?.id || '');
                                                setPayNowReceiverAccountId('__manual__');
                                            }}
                                        >
                                            Pay now
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            disabled={respondToIncomingSplit.isPending && respondingSplitId === request.id}
                                            onClick={() => {
                                                setRespondingSplitId(request.id);
                                                respondToIncomingSplit.mutate({
                                                    splitId: request.id,
                                                    decision: 'approve',
                                                    settlement: 'debt',
                                                });
                                            }}
                                        >
                                            Approve as Debt
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            className="text-red-400 hover:text-red-400"
                                            disabled={respondToIncomingSplit.isPending && respondingSplitId === request.id}
                                            onClick={() => {
                                                setRespondingSplitId(request.id);
                                                respondToIncomingSplit.mutate({
                                                    splitId: request.id,
                                                    decision: 'disapprove',
                                                });
                                            }}
                                        >
                                            Decline
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {pendingIncomingReceipts && pendingIncomingReceipts.length > 0 && (
                        <div className="relative space-y-2">
                            <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-muted-foreground">Incoming payments to assign</p>
                            {pendingIncomingReceipts.map((receipt: any) => (
                                <div key={receipt.paymentId} className={requestRowClass}>
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="min-w-0">
                                            <p className="text-sm font-medium truncate">
                                                From {receipt.fromUser?.name || receipt.fromUser?.username || 'Friend'}
                                            </p>
                                            <p className="text-xs text-muted-foreground truncate">
                                                {receipt.transactionDescription || 'Split payment'}
                                            </p>
                                        </div>
                                        <CurrencyDisplay
                                            amount={Number(receipt.amount || 0)}
                                            currency={receipt.currencyCode}
                                            className="text-sm font-semibold text-emerald-400"
                                        />
                                    </div>
                                    <div className="mt-3 flex flex-wrap items-center gap-2">
                                        <Select
                                            value={receiptAccountSelections[receipt.paymentId]}
                                            onValueChange={(val) => {
                                                setReceiptAccountSelections((prev) => ({
                                                    ...prev,
                                                    [receipt.paymentId]: val,
                                                }));
                                            }}
                                        >
                                            <SelectTrigger className="min-w-[220px] flex-1">
                                                <SelectValue placeholder="Receive to account" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {currencyOptions
                                                    .filter((opt) => opt.currencyCode === receipt.currencyCode)
                                                    .map((opt) => (
                                                        <SelectItem key={opt.id} value={opt.id}>
                                                            {opt.label} ({opt.currencyCode})
                                                        </SelectItem>
                                                    ))}
                                            </SelectContent>
                                        </Select>
                                        <Button
                                            size="sm"
                                            disabled={!receiptAccountSelections[receipt.paymentId] || assignIncomingReceipt.isPending}
                                            onClick={() => {
                                                const currencyBalanceId = receiptAccountSelections[receipt.paymentId];
                                                if (!currencyBalanceId) return;
                                                assignIncomingReceipt.mutate({
                                                    paymentId: receipt.paymentId,
                                                    currencyBalanceId,
                                                });
                                            }}
                                        >
                                            Assign
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {incomingDebtRequests && incomingDebtRequests.length > 0 && (
                        <div className="relative space-y-2">
                            <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-muted-foreground">Debt requests</p>
                            {incomingDebtRequests.map((request: any) => {
                                const selectedAccountId = incomingDebtAccountSelections[request.notificationId];
                                const selectedAccount = currencyOptions.find((opt) => opt.id === selectedAccountId);
                                const isFundingRequest = request.debtType === 'i_owe';
                                const isTrackedRequest = request.isTracked !== false;
                                const isInsufficient = Boolean(
                                    isTrackedRequest &&
                                    isFundingRequest &&
                                    selectedAccount &&
                                    Number(request.amount || 0) > selectedAccount.balance
                                );

                                return (
                                    <div key={request.notificationId} id={`notification-${request.notificationId}`} className={requestRowClass}>
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="min-w-0">
                                                <p className="text-sm font-medium truncate">
                                                    {request.requesterName || 'Friend'}
                                                </p>
                                                <p className="text-xs text-muted-foreground truncate">
                                                    {!isTrackedRequest
                                                        ? 'Historical debt · no account will be affected'
                                                        : isFundingRequest
                                                            ? 'Borrow request (pay from your card)'
                                                            : 'Incoming debt transfer (choose receive card)'}
                                                </p>
                                            </div>
                                            <CurrencyDisplay
                                                amount={Number(request.amount || 0)}
                                                currency={request.currencyCode}
                                                className="text-sm font-semibold"
                                            />
                                        </div>
                                        <div className="mt-3 flex flex-wrap items-center gap-2">
                                            {isTrackedRequest && <Select
                                                value={selectedAccountId}
                                                onValueChange={(val) => {
                                                    setIncomingDebtAccountSelections((prev) => ({
                                                        ...prev,
                                                        [request.notificationId]: val,
                                                    }));
                                                }}
                                            >
                                                <SelectTrigger className="min-w-[220px] flex-1">
                                                    <SelectValue placeholder={isFundingRequest ? 'Pay from card' : 'Receive to card'} />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {currencyOptions
                                                        .filter((opt) => opt.currencyCode === request.currencyCode)
                                                        .map((opt) => (
                                                            <SelectItem key={opt.id} value={opt.id}>
                                                                {opt.label} ({opt.currencyCode})
                                                            </SelectItem>
                                                        ))}
                                                </SelectContent>
                                            </Select>}
                                            <Button
                                                size="sm"
                                                disabled={(isTrackedRequest && !selectedAccountId) || isInsufficient || respondToIncomingDebtRequest.isPending}
                                                onClick={() => {
                                                    if (isTrackedRequest && !selectedAccountId) return;
                                                    respondToIncomingDebtRequest.mutate({
                                                        notificationId: request.notificationId,
                                                        decision: 'approve',
                                                        currencyBalanceId: isTrackedRequest ? selectedAccountId : undefined,
                                                    });
                                                }}
                                            >
                                                Approve
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                className="text-red-400 hover:text-red-400"
                                                disabled={respondToIncomingDebtRequest.isPending}
                                                onClick={() => {
                                                    respondToIncomingDebtRequest.mutate({
                                                        notificationId: request.notificationId,
                                                        decision: 'decline',
                                                    });
                                                }}
                                            >
                                                Decline
                                            </Button>
                                        </div>
                                        {isInsufficient && (
                                            <p className="mt-2 text-xs text-red-400">
                                                Insufficient funds in selected card.
                                            </p>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                    </div>
                </GlassCard>
            )}

            <GlassCard className="p-2 sm:p-3">
                <div className="relative flex flex-col gap-3 p-2 sm:flex-row sm:items-center sm:justify-between">
                    <Segmented
                        value={debtTab}
                        onChange={(tab) => {
                            setDebtTab(tab);
                            setVisibleCount(itemsPerPage);
                        }}
                        options={[
                            { value: 'owe', label: 'I owe', count: iOweActive.length },
                            { value: 'owed', label: 'Owed to me', count: owedCount },
                            { value: 'settled', label: 'Settled', count: historyDebts.length },
                        ]}
                    />
                </div>

                <div className="relative">
                    {isLoading || (debtTab === 'owed' && isLoadingSplits) ? (
                        <div className="space-y-2 p-2">
                            {Array.from({ length: 3 }).map((_, i) => (
                                <div key={i} className="flex items-center gap-3 rounded-2xl p-3">
                                    <Skeleton className="size-10 rounded-full" />
                                    <div className="flex-1 space-y-2">
                                        <Skeleton className="h-4 w-40" />
                                        <Skeleton className="h-3 w-24" />
                                    </div>
                                    <Skeleton className="h-5 w-20" />
                                </div>
                            ))}
                        </div>
                    ) : tabDebts.length === 0 && (debtTab !== 'owed' || splitRows.length === 0) ? (
                        <div className="flex flex-col items-center justify-center gap-2 py-12 text-center">
                            <span className="flex size-12 items-center justify-center rounded-2xl bg-white/[0.05] text-muted-foreground">
                                <HandCoins className="size-5" />
                            </span>
                            <p className="text-sm font-semibold">
                                {debtTab === 'owe' ? "You don't owe anyone" : debtTab === 'owed' ? 'No one owes you' : 'Nothing settled yet'}
                            </p>
                            <p className="text-xs text-muted-foreground">
                                {debtTab === 'settled' ? 'Fully repaid debts will show up here.' : 'Add a debt to start tracking it.'}
                            </p>
                        </div>
                    ) : (
                        <div className="divide-y divide-white/[0.06]">
                            {visibleTabDebts.map((debt) => (
                                <DebtRow key={debt.id} debt={debt} />
                            ))}

                            {debtTab === 'owed' && splitRows.length > 0 && (
                                <div className="pt-2">
                                    <p className="px-3 pb-1 pt-3 text-[11px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
                                        From split bills
                                    </p>
                                    {splitRows.map((row) => (
                                        <div key={row.split.id} className="flex items-center gap-3 rounded-2xl px-2.5 py-3 sm:px-3 transition-colors hover:bg-white/[0.04]">
                                            <div
                                                className="flex size-10 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
                                                style={{ backgroundColor: row.participantColor }}
                                            >
                                                {row.participantName.slice(0, 2).toUpperCase()}
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <p className="truncate text-sm font-semibold">{row.description}</p>
                                                <p className="mt-0.5 truncate text-xs text-muted-foreground">
                                                    {row.participantName} · {row.dateDisplay}
                                                </p>
                                            </div>
                                            <div className="shrink-0 text-right">
                                                <CurrencyDisplay amount={row.remaining} currency={row.currency} className="text-sm font-bold" color="#34D399" />
                                                <p className="mt-0.5 text-[11px] text-muted-foreground">
                                                    of <CurrencyDisplay amount={row.owed} currency={row.currency} abbreviate />
                                                </p>
                                            </div>
                                            <Button variant="outline" size="sm" className="h-8 shrink-0" onClick={() => openSplitPayment(row)}>
                                                <Banknote className="h-4 w-4 sm:mr-1" />
                                                <span className="hidden sm:inline">Record</span>
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {tabDebts.length > visibleCount && (
                        <div className="flex justify-center p-2">
                            <Button
                                variant="ghost"
                                size="sm"
                                className="text-muted-foreground"
                                onClick={() => setVisibleCount((prev) => prev + itemsPerPage)}
                            >
                                Show more ({tabDebts.length - visibleCount})
                            </Button>
                        </div>
                    )}
                </div>
            </GlassCard>

            <Sheet open={!!detailDebt} onOpenChange={(open) => !open && setDetailDebt(null)}>
                <SheetContent className="sm:max-w-[560px]">
                    <SheetHeader>
                        <SheetTitle>{detailDebt?.personName}</SheetTitle>
                        <SheetDescription>
                            {detailDebt?.type === 'i_owe' ? 'Payable' : 'Receivable'} details
                        </SheetDescription>
                    </SheetHeader>
                    {detailDebt && (
                        <div className="flex h-[min(70vh,700px)] flex-col gap-4 pt-4">
                            <div className="grid grid-cols-2 gap-2 rounded-md border p-2">
                                <div>
                                    <p className="text-xs text-muted-foreground">Type</p>
                                    <p className="text-sm font-medium">{detailDebt.type === 'i_owe' ? 'Payable' : 'Receivable'}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-xs text-muted-foreground">Due Date</p>
                                    <p className="text-sm font-medium">
                                        {detailDebt.dueDate ? new Date(detailDebt.dueDate).toLocaleDateString() : 'No due date'}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-xs text-muted-foreground">Total</p>
                                    <p className="text-sm font-medium">
                                        <CurrencyDisplay amount={detailDebt.amount} currency={detailDebt.currencyBalance?.currencyCode || detailDebt.currencyCode || 'USD'} />
                                    </p>
                                </div>
                                <div className="text-right">
                                    <p className="text-xs text-muted-foreground">Remaining</p>
                                    <p className={`text-sm font-medium ${detailDebt.type === 'they_owe' ? 'text-green-600' : 'text-red-600'}`}>
                                        <CurrencyDisplay amount={getRemaining(detailDebt)} currency={detailDebt.currencyBalance?.currencyCode || detailDebt.currencyCode || 'USD'} />
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center justify-end gap-2 border-b pb-3">
                                {getRemaining(detailDebt) > 0.01 && (
                                    <Button size="sm" className="h-8" onClick={() => handlePayment(detailDebt)}>
                                        <Banknote className="h-4 w-4 mr-1" />
                                        Repayment
                                    </Button>
                                )}
                                <Button variant="outline" size="sm" className="h-8" onClick={() => handleEdit(detailDebt)}>
                                    <Pencil className="h-4 w-4 mr-1" />
                                    Edit
                                </Button>
                                <Button
                                    variant="destructive"
                                    size="sm"
                                    className="h-8"
                                    onClick={() => handleDelete(detailDebt)}
                                >
                                    <Trash2 className="h-4 w-4 mr-1" />
                                    Delete
                                </Button>
                            </div>

                            {(detailDebt.description || detailDebt.personContact) && (
                                <div className="space-y-1 rounded-md border p-2">
                                    {detailDebt.description && (
                                        <div>
                                            <p className="text-xs text-muted-foreground">Description</p>
                                            <p className="text-sm">{detailDebt.description}</p>
                                        </div>
                                    )}
                                    {detailDebt.personContact && (
                                        <div>
                                            <p className="text-xs text-muted-foreground">Contact</p>
                                            <p className="text-sm">{detailDebt.personContact}</p>
                                        </div>
                                    )}
                                </div>
                            )}

                            <div className="flex flex-1 flex-col gap-2">
                                <div className="flex items-center justify-between border-b pb-2">
                                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Payment History</p>
                                    <span className="text-xs text-muted-foreground">
                                        {visibleDetailPayments.length}/{detailPayments.length}
                                    </span>
                                </div>
                                {detailPayments.length === 0 ? (
                                    <div className="flex flex-1 items-center justify-center rounded-md border text-sm text-muted-foreground">
                                        No payments recorded yet.
                                    </div>
                                ) : (
                                    <div
                                        ref={detailHistoryRef}
                                        className="flex-1 overflow-y-auto rounded-md border"
                                    >
                                        <div className="space-y-1 p-2">
                                            {visibleDetailPayments.map((payment) => (
                                                <div key={payment.id} className="flex items-center justify-between rounded border-b border-muted/30 px-2 py-2 text-xs">
                                                    <div className="min-w-0">
                                                        <span className={detailDebt.type === 'they_owe' ? 'text-green-600' : 'text-red-600'}>
                                                            {detailDebt.type === 'i_owe' ? '-' : '+'}{' '}
                                                            <CurrencyDisplay
                                                                amount={payment.amount}
                                                                currency={detailDebt.currencyBalance?.currencyCode || detailDebt.currencyCode || 'USD'}
                                                            />
                                                        </span>
                                                        <span className="ml-2 text-muted-foreground">
                                                            {new Date(payment.paidAt).toLocaleDateString()}
                                                        </span>
                                                    </div>
                                                    <div className="ml-2 flex items-center gap-1">
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-6 w-6"
                                                            onClick={() => handleEditPayment(payment, detailDebt)}
                                                        >
                                                            <Pencil className="h-3 w-3" />
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-6 w-6"
                                                            onClick={() => {
                                                                if (confirm('Delete this payment and revert balance?')) {
                                                                    deletePayment.mutate({ id: payment.id });
                                                                }
                                                            }}
                                                        >
                                                            <Trash2 className="h-3 w-3" />
                                                        </Button>
                                                    </div>
                                                </div>
                                            ))}
                                            {hasMoreDetailPayments && (
                                                <div className="py-2 text-center text-xs text-muted-foreground">
                                                    Scroll to load more
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </SheetContent>
            </Sheet>

            <AddDebtPaymentSheet
                debt={payingDebt}
                open={!!payingDebt}
                onOpenChange={(open) => !open && setPayingDebt(null)}
            />

            <Sheet open={!!editingDebt} onOpenChange={(open) => !open && setEditingDebt(null)}>
                <SheetContent>
                    <SheetHeader>
                        <SheetTitle>Edit Debt</SheetTitle>
                        <SheetDescription>
                            Update debt details.
                        </SheetDescription>
                    </SheetHeader>
                    <form onSubmit={handleSubmit(onSubmitEdit)} className="space-y-6 pt-6">
                        <div className="space-y-2">
                            <Label htmlFor="edit-personName">Person/Entity Name</Label>
                            <Input id="edit-personName" {...register('personName')} />
                            {errors.personName && <p className="text-sm text-red-500">{errors.personName.message}</p>}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="edit-amount">Total Amount</Label>
                            <Input id="edit-amount" type="number" step="0.01" {...register('amount', { valueAsNumber: true })} />
                            {errors.amount && <p className="text-sm text-red-500">{errors.amount.message}</p>}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="edit-description">Description</Label>
                            <Input id="edit-description" {...register('description')} />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="edit-dueDate">Due Date</Label>
                            <Input id="edit-dueDate" type="date" {...register('dueDate')} />
                        </div>

                        <SheetFooter>
                            <SheetClose asChild>
                                <Button variant="outline" type="button">Cancel</Button>
                            </SheetClose>
                            <Button type="submit">
                                Save Changes
                            </Button>
                        </SheetFooter>
                    </form>
                </SheetContent>
            </Sheet>

            <Sheet open={!!editingPayment} onOpenChange={(open) => !open && setEditingPayment(null)}>
                <SheetContent className="sm:max-w-[500px]">
                    <SheetHeader>
                        <SheetTitle>Edit Repayment</SheetTitle>
                        <SheetDescription>
                            Update repayment details and distributions.
                        </SheetDescription>
                    </SheetHeader>
                    <form onSubmit={handleSubmitPayment(onSubmitEditPayment)} className="space-y-6 pt-6">
                        <div className="space-y-2">
                            <Label htmlFor="edit-pt-amount">Amount</Label>
                            <Input id="edit-pt-amount" type="number" step="0.01" {...registerPayment('amount', { valueAsNumber: true })} />
                            {paymentErrors.amount && <p className="text-sm text-red-500">{paymentErrors.amount.message}</p>}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="edit-pt-date">Date</Label>
                            <Input id="edit-pt-date" type="date" {...registerPayment('paidAt')} />
                            {paymentErrors.paidAt && <p className="text-sm text-red-500">{paymentErrors.paidAt.message}</p>}
                        </div>

                        <div className="flex items-center space-x-2">
                            <Switch
                                id="is-payment-split"
                                checked={isPaymentSplit}
                                onCheckedChange={(checked: boolean) => setValuePayment('isSplit', checked)}
                            />
                            <Label htmlFor="is-payment-split">Split across multiple accounts</Label>
                        </div>

                        {!isPaymentSplit ? (
                            <div className="space-y-2">
                                <Label htmlFor="repayment-account">
                                    {editingPayment?.debt.type === 'i_owe' ? 'Payment Account' : 'Destination Account'}
                                </Label>
                                <Select
                                    value={watchPayment('distributions.0.currencyBalanceId')}
                                    onValueChange={(val: string) => {
                                        setValuePayment('distributions.0.currencyBalanceId', val);
                                        setValuePayment('distributions.0.amount', paymentTotalAmount);
                                    }}
                                >
                                    <SelectTrigger id="repayment-account">
                                        <SelectValue placeholder="Select account" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {availableAccounts.map(acc => (
                                            <SelectItem key={acc.id} value={acc.id}>
                                                {acc.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <div className="flex justify-between items-center">
                                    <Label>Distributions</Label>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() => appendPayment({ currencyBalanceId: '', amount: 0 })}
                                    >
                                        <Plus className="h-4 w-4 mr-1" /> Add
                                    </Button>
                                </div>
                                <div className="space-y-2 max-h-[200px] overflow-y-auto pr-2">
                                    {paymentFields.map((field, index) => (
                                        <div key={field.id} className="flex gap-2 items-end">
                                            <div className="flex-1 space-y-1">
                                                <Label className="text-xs" htmlFor={`distribution-account-${index}`}>Account</Label>
                                                <Select
                                                    value={watchedPaymentDistributions?.[index]?.currencyBalanceId}
                                                    onValueChange={(val: string) => setValuePayment(`distributions.${index}.currencyBalanceId`, val)}
                                                >
                                                    <SelectTrigger id={`distribution-account-${index}`}>
                                                        <SelectValue placeholder="Select" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {availableAccounts.map(acc => (
                                                            <SelectItem key={acc.id} value={acc.id}>
                                                                {acc.label}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div className="w-24 space-y-1">
                                                <Label className="text-xs" htmlFor={`distribution-amount-${index}`}>Amount</Label>
                                                <Input
                                                    id={`distribution-amount-${index}`}
                                                    type="number"
                                                    step="0.01"
                                                    {...registerPayment(`distributions.${index}.amount`, { valueAsNumber: true })}
                                                />
                                            </div>
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon"
                                                className="text-red-500 mb-0.5"
                                                onClick={() => removePayment(index)}
                                                disabled={paymentFields.length === 1}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                                {paymentErrors.distributions && <p className="text-sm text-red-500">{paymentErrors.distributions.message}</p>}
                            </div>
                        )}

                        <div className="space-y-2">
                            <Label htmlFor="edit-pt-note">Note</Label>
                            <Input id="edit-pt-note" {...registerPayment('note')} />
                        </div>

                        <SheetFooter>
                            <SheetClose asChild>
                                <Button variant="outline" type="button">Cancel</Button>
                            </SheetClose>
                            <Button type="submit">
                                Save Changes
                            </Button>
                        </SheetFooter>
                    </form>
                </SheetContent>
            </Sheet>

            {/* Record Split Payment Sheet */}
            <Sheet open={!!recordPaymentSplit} onOpenChange={(open) => !open && setRecordPaymentSplit(null)}>
                <SheetContent>
                    <SheetHeader>
                        <SheetTitle>Record Payment</SheetTitle>
                        <SheetDescription>
                            Record payment from {recordPaymentSplit?.participantName} for "{recordPaymentSplit?.transactionDescription}"
                        </SheetDescription>
                    </SheetHeader>
                    <div className="space-y-4 pt-6">
                        <div className="space-y-2">
                            <Label htmlFor="split-payment-amount">Amount ({recordPaymentSplit?.currencyCode})</Label>
                            <Input
                                id="split-payment-amount"
                                name="split-payment-amount"
                                type="number"
                                placeholder={`Remaining: ${recordPaymentSplit?.remaining?.toLocaleString()}`}
                                value={splitPaymentAmount}
                                onChange={(e) => setSplitPaymentAmount(e.target.value)}
                            />
                            <p className="text-xs text-muted-foreground">
                                Remaining: {recordPaymentSplit?.currencyCode} {recordPaymentSplit?.remaining?.toLocaleString()}
                            </p>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="split-payment-date">Date</Label>
                            <Input
                                id="split-payment-date"
                                name="split-payment-date"
                                type="date"
                                value={splitPaymentDate}
                                onChange={(e) => setSplitPaymentDate(e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="receive-account">Receive to Account</Label>
                            <Select
                                value={splitPaymentAccountId}
                                onValueChange={setSplitPaymentAccountId}
                            >
                                <SelectTrigger id="receive-account">
                                    <SelectValue placeholder="Select account" />
                                </SelectTrigger>
                                <SelectContent>
                                    {banks?.map((bank: any) =>
                                        bank.accounts?.map((account: any) =>
                                            account.currencyBalances?.map((cb: any) => (
                                                <SelectItem key={cb.id} value={cb.id}>
                                                    [{bank?.name || 'Unknown'}] {account?.name || 'Unknown Account'} ({cb.currencyCode})
                                                </SelectItem>
                                            ))
                                        )
                                    )}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="flex gap-2 pt-4">
                            <Button
                                variant="outline"
                                className="flex-1"
                                onClick={() => setRecordPaymentSplit(null)}
                            >
                                Cancel
                            </Button>
                            <Button
                                className="flex-1"
                                disabled={!splitPaymentAmount || !splitPaymentAccountId || recordSplitPayment.isPending}
                                onClick={() => {
                                    if (!recordPaymentSplit || !splitPaymentAmount || !splitPaymentAccountId) return;
                                    recordSplitPayment.mutate({
                                        splitId: recordPaymentSplit.splitId,
                                        amount: parseFloat(splitPaymentAmount),
                                        receivedToCurrencyBalanceId: splitPaymentAccountId,
                                        createIncomeTransaction: true,
                                        date: splitPaymentDate,
                                    });
                                }}
                            >
                                {recordSplitPayment.isPending ? 'Recording...' : 'Record Payment'}
                            </Button>
                        </div>
                    </div>
                </SheetContent>
            </Sheet>

            <Sheet open={!!payNowRequest} onOpenChange={(open) => {
                if (!open) {
                    setPayNowRequest(null);
                }
            }}>
                <SheetContent>
                    <SheetHeader>
                        <SheetTitle>Pay Split Now</SheetTitle>
                        <SheetDescription>
                            Pay directly from one of your cards.
                        </SheetDescription>
                    </SheetHeader>
                    <div className="space-y-4 pt-6">
                        <div className="space-y-2">
                            <Label>Amount ({payNowRequest?.transaction?.currencyBalance?.currencyCode})</Label>
                            <Input
                                type="number"
                                value={payNowAmount}
                                onChange={(e) => setPayNowAmount(e.target.value)}
                                placeholder={`Remaining: ${payNowRequest?.remainingAmount || ''}`}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Paid from your account</Label>
                            <Select value={payNowPayerAccountId} onValueChange={setPayNowPayerAccountId}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select your account" />
                                </SelectTrigger>
                                <SelectContent>
                                    {currencyOptions
                                        .filter((opt) => opt.currencyCode === payNowRequest?.transaction?.currencyBalance?.currencyCode)
                                        .map((opt) => (
                                            <SelectItem key={opt.id} value={opt.id}>
                                                {opt.label} ({opt.currencyCode})
                                            </SelectItem>
                                        ))}
                                </SelectContent>
                            </Select>
                            {selectedPayNowAccount && (
                                <div className="text-xs text-muted-foreground">
                                    Balance: <CurrencyDisplay amount={selectedPayNowAccount.balance} currency={selectedPayNowAccount.currencyCode} />
                                </div>
                            )}
                            {isPayNowInsufficient && (
                                <p className="text-xs text-red-500">Insufficient funds in selected account.</p>
                            )}
                        </div>
                        <div className="space-y-2">
                            <Label>Receiver account (optional)</Label>
                            <Select
                                value={payNowReceiverAccountId}
                                onValueChange={setPayNowReceiverAccountId}
                                disabled={payNowRequest?.receivingAccountSharingEnabled === false}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder={payNowRequest?.receivingAccountSharingEnabled === false ? 'Receiver disabled account sharing' : 'Select receiver account'} />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="__manual__">Manual receive (owner chooses later)</SelectItem>
                                    {(payNowRequest?.receivingAccounts || []).map((opt: any) => (
                                        <SelectItem key={opt.id} value={opt.id}>
                                            {opt.label} ({opt.currencyCode})
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <Button
                            className="w-full"
                            disabled={!payNowAmount || !payNowPayerAccountId || payIncomingNow.isPending || isPayNowInsufficient}
                            onClick={() => {
                                if (!payNowRequest || !payNowAmount || !payNowPayerAccountId) return;
                                if (isPayNowOverpay) {
                                    toast.error('Amount cannot exceed remaining balance');
                                    return;
                                }
                                payIncomingNow.mutate({
                                    splitId: payNowRequest.id,
                                    amountNow: Number(payNowAmount),
                                    payerCurrencyBalanceId: payNowPayerAccountId,
                                    receiverCurrencyBalanceId: payNowReceiverAccountId !== '__manual__' ? payNowReceiverAccountId : undefined,
                                });
                            }}
                        >
                            {payIncomingNow.isPending ? 'Processing...' : 'Pay now'}
                        </Button>
                    </div>
                </SheetContent>
            </Sheet>
        </div>
    );
}
