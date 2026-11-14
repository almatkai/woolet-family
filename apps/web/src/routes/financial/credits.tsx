import { useState } from 'react';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { ActionButton } from '@/components/ui/action-button';
import { Badge } from '@/components/ui/badge';
import { Plus, CreditCard, Calendar, Percent, Wallet } from 'lucide-react';
import { StatTile } from '@/components/ui/glass';
import { ProductCard, ProductEmptyState } from '@/components/financial/ProductCard';
import { toast } from 'sonner';
import { PageHeader } from '@/components/PageHeader';
import { AddCreditSheet } from '@/components/AddCreditSheet';
import { CreditPaymentSheet } from '@/components/CreditPaymentSheet';
import { CompoundCreditPaymentSheet } from '@/components/CompoundCreditPaymentSheet';
import { CurrencyDisplay } from '@/components/CurrencyDisplay';

interface Credit {
    id: string;
    name: string;
    principalAmount: string;
    interestRate: string;
    monthlyPayment: string;
    remainingBalance: string;
    currency: string;
    startDate: string;
    endDate: string;
    status: string;
    account: {
        id: string;
        name: string;
        currencyBalances: Array<{
            currencyCode: string;
            balance: string;
        }>;
    };
    payments: Array<{
        monthYear: string;
    }>;
}

export default function CreditsPage() {
    const [showAddCredit, setShowAddCredit] = useState(false);
    const [editingCredit, setEditingCredit] = useState<Credit | null>(null);
    const [payingCredit, setPayingCredit] = useState<Credit | null>(null);
    const [showCompoundPayment, setShowCompoundPayment] = useState(false);

    const { data: credits, isLoading } = trpc.credit.list.useQuery();
    const utils = trpc.useUtils();

    const deleteCredit = trpc.credit.delete.useMutation({
        onSuccess: () => {
            utils.credit.list.invalidate();
            toast.success('Credit deleted');
        },
        onError: () => toast.error('Failed to delete credit'),
    });

    const totalPrincipal = credits?.reduce((sum: number, c: Credit) => sum + Number(c.principalAmount), 0) || 0;
    const totalRemaining = credits?.reduce((sum: number, c: Credit) => sum + Number(c.remainingBalance), 0) || 0;
    const totalMonthly = credits?.reduce((sum: number, c: Credit) => sum + Number(c.monthlyPayment), 0) || 0;
    const primaryCurrency = credits?.[0]?.currency || 'KZT';

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'active': return <Badge variant="default">Active</Badge>;
            case 'paid_off': return <Badge variant="secondary" className="bg-green-500/20 text-green-500">Paid Off</Badge>;
            case 'defaulted': return <Badge variant="destructive">Defaulted</Badge>;
            default: return <Badge variant="outline">{status}</Badge>;
        }
    };

    const getPayoffPercentage = (credit: Credit) => {
        const principal = Number(credit.principalAmount);
        const remaining = Number(credit.remainingBalance);
        return Math.round(((principal - remaining) / principal) * 100);
    };

    if (isLoading) {
        return (
            <div className="space-y-6">
                <div className="h-8 w-48 bg-muted animate-pulse rounded" />
                <div className="grid grid-cols-3 gap-2 md:gap-4">
                    <div className="h-24 md:h-28 bg-white/[0.04] animate-pulse rounded-[22px]" />
                    <div className="h-24 md:h-28 bg-white/[0.04] animate-pulse rounded-[22px]" />
                    <div className="h-24 md:h-28 bg-white/[0.04] animate-pulse rounded-[22px]" />
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <PageHeader
                title="Credits"
                subtitle="Manage your credit cards and loans"
                variant="two-with-text"
            >
                {credits && credits.filter((c: Credit) => c.status === 'active').length > 0 && (
                    <ActionButton variant="secondary" onClick={() => setShowCompoundPayment(true)} className="flex-1 sm:flex-none">
                        <Wallet className="h-4 w-4" />
                        Pay All
                    </ActionButton>
                )}
                <ActionButton onClick={() => setShowAddCredit(true)} className="flex-1 sm:flex-none">
                    <Plus className="h-4 w-4" />
                    Add
                </ActionButton>
            </PageHeader>

            <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
                <StatTile
                    label="Remaining"
                    color="#FB7185"
                    icon={<CreditCard className="size-4" />}
                    value={<CurrencyDisplay amount={totalRemaining} currency={primaryCurrency} />}
                    hint={<>of <CurrencyDisplay amount={totalPrincipal} currency={primaryCurrency} abbreviate /> borrowed</>}
                />
                <StatTile
                    label="Monthly"
                    color="#8B5CF6"
                    icon={<Calendar className="size-4" />}
                    value={<CurrencyDisplay amount={totalMonthly} currency={primaryCurrency} />}
                    hint="Due every month"
                />
                <StatTile
                    label="Paid off"
                    color="#34D399"
                    icon={<Percent className="size-4" />}
                    className="col-span-2 lg:col-span-1"
                    value={`${totalPrincipal > 0 ? Math.round(((totalPrincipal - totalRemaining) / totalPrincipal) * 100) : 0}%`}
                    hint={`${credits?.length || 0} credit${credits?.length === 1 ? '' : 's'}`}
                />
            </div>

            {(!credits || credits.length === 0) ? (
                <ProductEmptyState
                    icon={<CreditCard className="size-5" />}
                    title="No credits yet"
                    description="Add your first loan or credit line to track payments"
                    action={
                        <Button size="sm" onClick={() => setShowAddCredit(true)} className="gap-2">
                            <Plus className="h-4 w-4" />
                            Add Credit
                        </Button>
                    }
                />
            ) : (
                <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                    {credits.map((credit: Credit) => (
                        <ProductCard
                            key={credit.id}
                            icon={<CreditCard className="size-5" />}
                            color="#FB7185"
                            title={credit.name}
                            subtitle={`Ends ${new Date(credit.endDate).toLocaleDateString()}`}
                            badges={getStatusBadge(credit.status)}
                            amountLabel="Remaining"
                            amount={<CurrencyDisplay amount={credit.remainingBalance} currency={credit.currency} />}
                            progress={getPayoffPercentage(credit)}
                            progressLabel={`${getPayoffPercentage(credit)}% paid off`}
                            stats={[
                                { label: 'Principal', value: <CurrencyDisplay amount={credit.principalAmount} currency={credit.currency} abbreviate /> },
                                { label: 'Monthly', value: <CurrencyDisplay amount={credit.monthlyPayment} currency={credit.currency} abbreviate /> },
                                { label: 'Rate', value: `${credit.interestRate}%` },
                            ]}
                            action={credit.status === 'active' ? { label: 'Pay', icon: <Wallet className="h-4 w-4" />, onClick: () => setPayingCredit(credit) } : undefined}
                            onEdit={() => setEditingCredit(credit)}
                            onDelete={() => deleteCredit.mutate({ id: credit.id })}
                        />
                    ))}
                </div>
            )}

            <AddCreditSheet
                open={showAddCredit || !!editingCredit}
                onOpenChange={(open) => {
                    if (!open) {
                        setShowAddCredit(false);
                        setEditingCredit(null);
                    }
                }}
                editingCredit={editingCredit}
            />

            <CreditPaymentSheet
                open={!!payingCredit}
                onOpenChange={(open) => {
                    if (!open) {
                        setPayingCredit(null);
                    }
                }}
                credit={payingCredit}
            />

            <CompoundCreditPaymentSheet
                open={showCompoundPayment}
                onOpenChange={setShowCompoundPayment}
                credits={credits || []}
            />
        </div>
    );
}


