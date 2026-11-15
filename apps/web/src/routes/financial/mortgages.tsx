import { useState } from 'react';
import { ScopeSwitchRow } from '@/components/family/ScopeSwitch';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Home, Percent, MapPin, Wallet, CheckCircle2, Circle, Calendar } from 'lucide-react';
import { StatTile } from '@/components/ui/glass';
import { ProductCard, ProductEmptyState } from '@/components/financial/ProductCard';
import { PageHeader } from '@/components/PageHeader';
import { CurrencyDisplay } from '@/components/CurrencyDisplay';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { ActionButton } from '@/components/ui/action-button';
import { AddMortgageSheet } from '@/components/AddMortgageSheet';
import { MortgagePaymentSheet } from '@/components/MortgagePaymentSheet';
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

interface Mortgage {
    id: string;
    accountId: string;
    propertyName: string;
    propertyAddress: string | null;
    principalAmount: string;
    interestRate: string;
    monthlyPayment: string;
    remainingBalance: string;
    currency: string;
    startDate: string;
    endDate: string | null;
    termYears: number;
    paymentDay: number | null;
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

import { getPaymentStatusOptions, getTargetMonthStr, isPaidForTargetMonth } from "@/lib/payment-status";

export default function MortgagesPage() {
    const [showAddMortgage, setShowAddMortgage] = useState(false);
    const [editingMortgage, setEditingMortgage] = useState<Mortgage | null>(null);
    const [payingMortgage, setPayingMortgage] = useState<Mortgage | null>(null);
    const [deletingMortgage, setDeletingMortgage] = useState<Mortgage | null>(null);

    const { data: settings } = trpc.settings.getUserSettings.useQuery();
    const { data: mortgages, isLoading } = trpc.mortgage.list.useQuery();
    const utils = trpc.useUtils();

    const deleteMortgage = trpc.mortgage.delete.useMutation({
        onSuccess: () => {
            utils.mortgage.list.invalidate();
            toast.success('Mortgage deleted');
            setDeletingMortgage(null);
        },
        onError: () => toast.error('Failed to delete mortgage'),
    });

    const totalPrincipal = mortgages?.reduce((sum: number, m: any) => sum + Number(m.principalAmount), 0) || 0;
    const totalRemaining = mortgages?.reduce((sum: number, m: any) => sum + Number(m.remainingBalance), 0) || 0;
    const totalMonthly = mortgages?.reduce((sum: number, m: any) => sum + Number(m.monthlyPayment), 0) || 0;
    const primaryCurrency = mortgages?.[0]?.currency || 'KZT';


    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'active': return <Badge variant="default" className="h-5 text-[9px] uppercase tracking-wider font-bold">Active</Badge>;
            case 'paid_off': return <Badge variant="secondary" className="h-5 text-[9px] uppercase tracking-wider font-bold bg-green-500/20 text-green-500">Paid Off</Badge>;
            case 'defaulted': return <Badge variant="destructive" className="h-5 text-[9px] uppercase tracking-wider font-bold">Defaulted</Badge>;
            default: return <Badge variant="outline" className="h-5 text-[9px] uppercase tracking-wider font-bold">{status}</Badge>;
        }
    };

    const getPayoffPercentage = (mortgage: Mortgage) => {
        const principal = Number(mortgage.principalAmount);
        const remaining = Number(mortgage.remainingBalance);
        return Math.round(((principal - remaining) / principal) * 100);
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
                title="Mortgages"
                subtitle="Manage your properties and loans"
                variant="one"
            >
                <Button onClick={() => setShowAddMortgage(true)} className="gap-2">
                    <Plus className="h-4 w-4" />
                    Add Mortgage
                </Button>
            </PageHeader>
            <ScopeSwitchRow />

            <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
                <StatTile
                    label="Remaining"
                    color="#FB923C"
                    icon={<Home className="size-4" />}
                    value={<CurrencyDisplay amount={totalRemaining} currency={primaryCurrency} />}
                    hint={<>of <CurrencyDisplay amount={totalPrincipal} currency={primaryCurrency} abbreviate /> principal</>}
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
                    hint={`${mortgages?.length || 0} propert${mortgages?.length === 1 ? 'y' : 'ies'}`}
                />
            </div>

            {(!mortgages || mortgages.length === 0) ? (
                <ProductEmptyState
                    icon={<Home className="size-5" />}
                    title="No mortgages yet"
                    description="Add your first mortgage to track payments"
                    action={
                        <Button size="sm" onClick={() => setShowAddMortgage(true)} className="gap-2">
                            <Plus className="h-4 w-4" />
                            Add Mortgage
                        </Button>
                    }
                />
            ) : (
                <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                    {mortgages.map((mortgage: Mortgage) => {
                        const { logic, period } = getPaymentStatusOptions(settings, 'mortgage');
                        const targetMonthStr = getTargetMonthStr(mortgage.paymentDay, { logic, period });
                        const isPaidThisMonth = isPaidForTargetMonth(mortgage.payments, targetMonthStr, true);

                        return (
                            <ProductCard
                                key={mortgage.id}
                                icon={<Home className="size-5" />}
                                color="#FB923C"
                                title={mortgage.propertyName}
                                subtitle={mortgage.propertyAddress ? (
                                    <span className="inline-flex items-center gap-1"><MapPin className="h-3 w-3" />{mortgage.propertyAddress}</span>
                                ) : `${mortgage.termYears} year term`}
                                badges={
                                    <>
                                        <Badge
                                            variant="secondary"
                                            className={isPaidThisMonth
                                                ? 'gap-1 border-0 bg-emerald-500/15 text-emerald-400'
                                                : 'gap-1 border-0 bg-rose-500/15 text-rose-400'}
                                        >
                                            {isPaidThisMonth ? <CheckCircle2 className="h-3 w-3" /> : <Circle className="h-3 w-3" />}
                                            {isPaidThisMonth ? 'Paid' : 'Unpaid'}
                                        </Badge>
                                        {mortgage.status !== 'active' && getStatusBadge(mortgage.status)}
                                    </>
                                }
                                amountLabel="Remaining"
                                amount={<CurrencyDisplay amount={mortgage.remainingBalance} currency={mortgage.currency} />}
                                progress={getPayoffPercentage(mortgage)}
                                progressLabel={`${getPayoffPercentage(mortgage)}% paid off · ${mortgage.termYears} year term`}
                                stats={[
                                    { label: 'Principal', value: <CurrencyDisplay amount={mortgage.principalAmount} currency={mortgage.currency} abbreviate /> },
                                    { label: 'Monthly', value: <CurrencyDisplay amount={mortgage.monthlyPayment} currency={mortgage.currency} abbreviate /> },
                                    { label: 'Rate', value: `${mortgage.interestRate}%` },
                                ]}
                                footer={mortgage.paymentDay ? `Due on day ${mortgage.paymentDay}` : undefined}
                                action={mortgage.status === 'active' ? { label: 'Pay', icon: <Wallet className="h-4 w-4" />, onClick: () => setPayingMortgage(mortgage) } : undefined}
                                onEdit={() => setEditingMortgage(mortgage)}
                                onDelete={() => setDeletingMortgage(mortgage)}
                            />
                        );
                    })}
                </div>
            )}

            <AddMortgageSheet
                open={showAddMortgage || !!editingMortgage}
                onOpenChange={(open) => {
                    if (!open) {
                        setShowAddMortgage(false);
                        setEditingMortgage(null);
                    }
                }}
                editingMortgage={editingMortgage}
            />

            <MortgagePaymentSheet
                open={!!payingMortgage}
                onOpenChange={(open) => {
                    if (!open) {
                        setPayingMortgage(null);
                    }
                }}
                mortgage={payingMortgage}
            />

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={!!deletingMortgage} onOpenChange={(open) => !open && setDeletingMortgage(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Mortgage</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete "{deletingMortgage?.propertyName}"? This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => setDeletingMortgage(null)}>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={() => deletingMortgage && deleteMortgage.mutate({ id: deletingMortgage.id })}
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
