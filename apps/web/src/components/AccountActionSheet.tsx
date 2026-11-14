import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
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
} from '@/components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from 'sonner';
import { Save, Trash2 } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { DeleteConfirm } from '@/components/DeleteConfirm';
import { CardVisualPicker } from '@/components/CardVisualPicker';
import { parseAccountVisual, serializeAccountVisual } from '@/lib/image-utils';

interface CurrencyBalance {
    id: string;
    currencyCode: string;
    balance: string | number;
}

interface Account {
    id: string;
    name: string;
    last4Digits?: string | null;
    icon?: string | null;
    currencyBalances: CurrencyBalance[];
}

interface AccountActionSheetProps {
    account: Account | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

const editAccountSchema = z.object({
    name: z.string().min(1, "Name is required"),
    last4Digits: z.string().length(4, "Must be exactly 4 digits").optional().or(z.literal('')),
    icon: z.string().optional(),
});

const adjustBalanceSchema = z.object({
    newBalance: z.number(),
    reason: z.string().optional(),
});

type EditAccountForm = z.infer<typeof editAccountSchema>;
type AdjustBalanceForm = z.infer<typeof adjustBalanceSchema>;

export function AccountActionSheet({ account, open, onOpenChange }: AccountActionSheetProps) {
    const utils = trpc.useUtils();
    const [selectedBalanceId, setSelectedBalanceId] = useState<string>(account?.currencyBalances[0]?.id || '');
    const [activeTab, setActiveTab] = useState('details');

    const initialVisual = parseAccountVisual(account?.icon);
    const [cardColor, setCardColor] = useState<string>(initialVisual.color || '#8B5CF6');
    const [cardSkin, setCardSkin] = useState<string | undefined>(initialVisual.skinUrl);

    useEffect(() => {
        if (account) {
            const v = parseAccountVisual(account.icon);
            setCardColor(v.color || '#8B5CF6');
            setCardSkin(v.skinUrl);
            setSelectedBalanceId(account.currencyBalances[0]?.id || '');
        }
    }, [account]);

    // Account Mutation
    const updateAccount = trpc.account.update.useMutation({
        onSuccess: () => {
            utils.bank.getHierarchy.invalidate();
            toast.success('Account updated');
        },
        onError: (err: { message: string }) => toast.error(err.message),
    });

    // Balance Mutation
    const adjustBalance = trpc.account.adjustBalance.useMutation({
        onSuccess: () => {
            utils.bank.getHierarchy.invalidate();
            toast.success('Balance adjusted');
        },
        onError: (err: { message: string }) => toast.error(err.message),
    });

    const deleteAccount = trpc.account.delete.useMutation({
        onSuccess: () => {
            utils.bank.getHierarchy.invalidate();
            toast.success('Account deleted');
            onOpenChange(false);
        },
        onError: (err: { message: string }) => toast.error(err.message || 'Failed to delete account'),
    });

    // Forms
    const { register: registerAccount, handleSubmit: submitAccount, watch: watchAccount } = useForm<EditAccountForm>({
        resolver: zodResolver(editAccountSchema),
        values: account ? {
            name: account.name,
            last4Digits: account.last4Digits || '',
            icon: parseAccountVisual(account.icon).icon || '💳',
        } : {
            name: '',
            last4Digits: '',
            icon: '',
        }
    });

    const { register: registerBalance, handleSubmit: submitBalance, reset: resetBalance } = useForm<AdjustBalanceForm>({
        resolver: zodResolver(adjustBalanceSchema),
    });

    // History (Transactions)
    const { data: history } = trpc.transaction.list.useQuery(
        {
            currencyBalanceId: selectedBalanceId,
            limit: 20
        },
        {
            enabled: activeTab === 'history' && !!selectedBalanceId,
            staleTime: 1000
        }
    );

    if (!account) return null;

    const onAccountSubmit = (data: EditAccountForm) => {
        const visualString = serializeAccountVisual({
            icon: data.icon || '💳',
            color: cardColor,
            skinUrl: cardSkin,
        });

        updateAccount.mutate({
            id: account.id,
            ...data,
            icon: visualString,
            last4Digits: data.last4Digits || undefined,
        });
    };

    const onBalanceSubmit = (data: AdjustBalanceForm) => {
        if (!selectedBalanceId) {
            toast.error("Please select a currency balance");
            return;
        }
        adjustBalance.mutate({
            currencyBalanceId: selectedBalanceId,
            newBalance: data.newBalance,
            reason: data.reason
        });
    };

    const selectedBalance = account.currencyBalances.find((cb: CurrencyBalance) => cb.id === selectedBalanceId);
    const watchName = watchAccount('name');
    const watchLast4 = watchAccount('last4Digits');

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent className="w-full sm:max-w-lg flex flex-col h-full overflow-y-auto">
                <SheetHeader>
                    <div className="flex items-start justify-between gap-3">
                        <SheetTitle className="pr-2">{account.name}</SheetTitle>
                        <DeleteConfirm
                            title="Delete this account?"
                            description={`This will permanently delete "${account.name}". This action cannot be undone.`}
                            onConfirm={() => deleteAccount.mutate({ id: account.id })}
                            trigger={
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-muted-foreground hover:text-red-500"
                                    disabled={deleteAccount.isLoading}
                                    title="Delete account"
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            }
                        />
                    </div>
                    <SheetDescription>
                        Manage card skin, colors, details and balances
                    </SheetDescription>
                </SheetHeader>

                <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col mt-4">
                    <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="details">Details</TabsTrigger>
                        <TabsTrigger value="balance">Balance</TabsTrigger>
                        <TabsTrigger value="history">History</TabsTrigger>
                    </TabsList>

                    <TabsContent value="details" className="space-y-4 mt-4 focus-visible:outline-none">
                        {/* Live Card Preview & Color/Skin Picker */}
                        <CardVisualPicker
                            color={cardColor}
                            skinUrl={cardSkin}
                            onColorChange={setCardColor}
                            onSkinChange={setCardSkin}
                            cardName={watchName}
                            last4Digits={watchLast4}
                        />

                        <form onSubmit={submitAccount(onAccountSubmit)} className="space-y-4 pt-2">
                            <div className="space-y-2">
                                <Label>Account Name</Label>
                                <Input {...registerAccount('name')} />
                            </div>
                            <div className="space-y-2">
                                <Label>Last 4 Digits</Label>
                                <Input {...registerAccount('last4Digits')} maxLength={4} placeholder="1234" />
                            </div>
                            <div className="space-y-2">
                                <Label>Emoji / Symbol</Label>
                                <Input {...registerAccount('icon')} className="font-emoji" />
                            </div>
                            <Button type="submit" disabled={updateAccount.isLoading} className="w-full">
                                <Save className="h-4 w-4 mr-2" />
                                {updateAccount.isLoading ? 'Saving...' : 'Save Card Changes'}
                            </Button>
                        </form>
                    </TabsContent>

                    <TabsContent value="balance" className="space-y-4 mt-4 focus-visible:outline-none">
                        <div className="space-y-2">
                            <Label>Select Currency</Label>
                            <div className="flex gap-2 flex-wrap">
                                {account.currencyBalances.map((cb: CurrencyBalance) => (
                                    <Button
                                        key={cb.id}
                                        variant={selectedBalanceId === cb.id ? "default" : "outline"}
                                        onClick={() => {
                                            setSelectedBalanceId(cb.id);
                                            resetBalance();
                                        }}
                                        className="h-auto py-2 px-3"
                                    >
                                        <div className="flex flex-col items-start">
                                            <span className="font-bold">{cb.currencyCode}</span>
                                            <span className="text-xs font-normal opacity-90">
                                                {Number(cb.balance).toLocaleString()}
                                            </span>
                                        </div>
                                    </Button>
                                ))}
                            </div>
                        </div>

                        {selectedBalance && (
                            <div className="p-4 border rounded-lg bg-muted/20 space-y-4">
                                <div className="space-y-1">
                                    <Label className="text-xs text-muted-foreground">Current Balance</Label>
                                    <div className="text-2xl font-bold font-mono">
                                        {Number(selectedBalance.balance).toLocaleString('en-US', { style: 'currency', currency: selectedBalance.currencyCode })}
                                    </div>
                                </div>

                                <form onSubmit={submitBalance(onBalanceSubmit)} className="space-y-4 pt-2 border-t">
                                    <div className="space-y-2">
                                        <Label>New Balance Amount</Label>
                                        <Input
                                            type="number"
                                            step="0.01"
                                            placeholder="0.00"
                                            {...registerBalance('newBalance', { valueAsNumber: true })}
                                        />
                                        <p className="text-xs text-muted-foreground">
                                            A correction transaction will be created automatically.
                                        </p>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Reason (Optional)</Label>
                                        <Input {...registerBalance('reason')} placeholder="Correction, Audit, etc." />
                                    </div>
                                    <Button type="submit" variant="secondary" className="w-full" disabled={adjustBalance.isLoading}>
                                        Update Balance
                                    </Button>
                                </form>
                            </div>
                        )}
                    </TabsContent>

                    <TabsContent value="history" className="flex-1 flex flex-col min-h-0 mt-4 focus-visible:outline-none">
                        <div className="mb-4 space-y-2">
                            <Label>Select Currency View</Label>
                            <div className="flex gap-2">
                                {account.currencyBalances.map((cb) => (
                                    <Button
                                        key={cb.id}
                                        size="sm"
                                        variant={selectedBalanceId === cb.id ? 'secondary' : 'ghost'}
                                        onClick={() => setSelectedBalanceId(cb.id)}
                                    >
                                        {cb.currencyCode}
                                    </Button>
                                ))}
                            </div>
                        </div>

                        <ScrollArea className="flex-1 border rounded-md p-4">
                            {!history?.transactions || history.transactions.length === 0 ? (
                                <div className="text-center text-muted-foreground py-8 text-sm">
                                    No transactions found for this currency balance.
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {history.transactions.map((tx: any) => (
                                        <div key={tx.id} className="flex justify-between items-center text-sm border-b pb-2 last:border-0">
                                            <div>
                                                <div className="font-medium">{tx.description || tx.category?.name || 'Transaction'}</div>
                                                <div className="text-xs text-muted-foreground">
                                                    {new Date(tx.date).toLocaleDateString()}
                                                </div>
                                            </div>
                                            <div className={`font-mono font-medium ${tx.type === 'income' ? 'text-emerald-400' : 'text-rose-400'}`}>
                                                {tx.type === 'income' ? '+' : '-'}{Number(tx.amount).toLocaleString()}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </ScrollArea>
                    </TabsContent>
                </Tabs>
            </SheetContent>
        </Sheet>
    );
}
