import { useState } from 'react';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, PiggyBank, TrendingUp, Building } from 'lucide-react';
import { StatTile } from '@/components/ui/glass';
import { ProductCard, ProductEmptyState } from '@/components/financial/ProductCard';
import { CurrencyDisplay } from '@/components/CurrencyDisplay';
import { toast } from 'sonner';
import { ActionButton } from '@/components/ui/action-button';
import { PageHeader } from '@/components/PageHeader';
import { AddDepositSheet } from '@/components/AddDepositSheet';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface Deposit {
    id: string;
    bankName: string;
    depositName: string;
    principalAmount: string;
    currentBalance: string;
    interestRate: string;
    compoundingFrequency: string;
    currency: string;
    startDate: string;
    maturityDate: string | null;
    isFlexible: boolean;
    status: string;
}

export default function DepositsPage() {
    const [showAddDeposit, setShowAddDeposit] = useState(false);
    const [editingDeposit, setEditingDeposit] = useState<Deposit | null>(null);
    const [deletingDeposit, setDeletingDeposit] = useState<Deposit | null>(null);

    const { data: deposits, isLoading } = trpc.deposit.list.useQuery();
    const utils = trpc.useUtils();

    const deleteDeposit = trpc.deposit.delete.useMutation({
        onSuccess: () => {
            utils.deposit.list.invalidate();
            toast.success('Deposit deleted');
            setDeletingDeposit(null);
        },
        onError: () => toast.error('Failed to delete deposit'),
    });

    const totalPrincipal = deposits?.reduce((sum: number, d: any) => sum + Number(d.principalAmount), 0) || 0;
    const totalCurrent = deposits?.reduce((sum: number, d: any) => sum + Number(d.currentBalance), 0) || 0;
    const totalInterestEarned = totalCurrent - totalPrincipal;
    const primaryCurrency = deposits?.[0]?.currency || 'KZT';

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'active': return <Badge variant="default" className="bg-green-500/20 text-green-500">Active</Badge>;
            case 'matured': return <Badge variant="secondary">Matured</Badge>;
            case 'withdrawn': return <Badge variant="outline">Withdrawn</Badge>;
            default: return <Badge variant="outline">{status}</Badge>;
        }
    };

    const getCompoundingLabel = (freq: string) => {
        const labels: Record<string, string> = {
            'daily': 'Daily',
            'monthly': 'Monthly',
            'quarterly': 'Quarterly',
            'annually': 'Annually',
        };
        return labels[freq] || freq;
    };

    if (isLoading) {
        return (
            <div className="space-y-6">
                <div className="h-8 w-48 bg-muted animate-pulse rounded" />
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {[1, 2, 3].map(i => <div key={i} className="h-32 bg-white/[0.04] animate-pulse rounded-[22px]" />)}
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <PageHeader
                title="Deposits"
                subtitle="Manage your savings and deposits"
                variant="one"
            >
                <ActionButton onClick={() => setShowAddDeposit(true)} className="sm:flex-none">
                    <Plus className="h-4 w-4" />
                    Add
                </ActionButton>
            </PageHeader>

            <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
                <StatTile
                    label="Current balance"
                    color="#34D399"
                    icon={<PiggyBank className="size-4" />}
                    value={<CurrencyDisplay amount={totalCurrent} currency={primaryCurrency} />}
                    hint={`${deposits?.length || 0} deposit${deposits?.length === 1 ? '' : 's'}`}
                />
                <StatTile
                    label="Interest earned"
                    color="#60A5FA"
                    icon={<TrendingUp className="size-4" />}
                    value={<CurrencyDisplay amount={totalInterestEarned} currency={primaryCurrency} showSign />}
                    hint={totalPrincipal > 0 ? `+${((totalInterestEarned / totalPrincipal) * 100).toFixed(1)}% on principal` : undefined}
                />
                <StatTile
                    label="Principal"
                    color="#8B5CF6"
                    icon={<Building className="size-4" />}
                    className="col-span-2 lg:col-span-1"
                    value={<CurrencyDisplay amount={totalPrincipal} currency={primaryCurrency} />}
                    hint="Initially deposited"
                />
            </div>

            {(!deposits || deposits.length === 0) ? (
                <ProductEmptyState
                    icon={<PiggyBank className="size-5" />}
                    title="No deposits yet"
                    description="Add your first deposit to track interest growth"
                    action={
                        <Button size="sm" onClick={() => setShowAddDeposit(true)} className="gap-2">
                            <Plus className="h-4 w-4" />
                            Add Deposit
                        </Button>
                    }
                />
            ) : (
                <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                    {deposits.map((deposit: Deposit) => {
                        const interestEarned = Number(deposit.currentBalance) - Number(deposit.principalAmount);
                        return (
                            <ProductCard
                                key={deposit.id}
                                icon={<PiggyBank className="size-5" />}
                                color="#34D399"
                                title={deposit.depositName}
                                subtitle={deposit.bankName}
                                badges={
                                    <>
                                        {getStatusBadge(deposit.status)}
                                        {deposit.isFlexible && <Badge variant="outline" className="text-[10px]">Flexible</Badge>}
                                    </>
                                }
                                amountLabel="Current balance"
                                amount={<CurrencyDisplay amount={deposit.currentBalance} currency={deposit.currency} />}
                                stats={[
                                    { label: 'Principal', value: <CurrencyDisplay amount={deposit.principalAmount} currency={deposit.currency} abbreviate /> },
                                    { label: 'Earned', value: <span className="text-sky-400"><CurrencyDisplay amount={interestEarned} currency={deposit.currency} abbreviate showSign /></span> },
                                    { label: 'Rate', value: `${deposit.interestRate}%` },
                                ]}
                                footer={`${getCompoundingLabel(deposit.compoundingFrequency)} compounding${deposit.maturityDate ? ` · Matures ${new Date(deposit.maturityDate).toLocaleDateString()}` : ''}`}
                                onEdit={() => setEditingDeposit(deposit)}
                                onDelete={() => setDeletingDeposit(deposit)}
                            />
                        );
                    })}
                </div>
            )}

            <AddDepositSheet
                open={showAddDeposit || !!editingDeposit}
                onOpenChange={(open) => {
                    if (!open) {
                        setShowAddDeposit(false);
                        setEditingDeposit(null);
                    }
                }}
                editingDeposit={editingDeposit}
            />

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={!!deletingDeposit} onOpenChange={(open) => !open && setDeletingDeposit(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Deposit</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete "{deletingDeposit?.depositName}"? This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => setDeletingDeposit(null)}>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={() => deletingDeposit && deleteDeposit.mutate({ id: deletingDeposit.id })}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
