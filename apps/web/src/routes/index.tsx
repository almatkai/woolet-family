import { ActionButton } from '@/components/ui/action-button';
import { ScopeSwitchRow } from '@/components/family/ScopeSwitch';
import React from 'react';
import { SignedIn, SignedOut } from '@clerk/clerk-react';
import { Navigate } from '@tanstack/react-router';
import {
    LayoutGrid,
    Plus,
    Save,
    X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/PageHeader';
import { MobileHome } from '@/components/dashboard/MobileHome';
import { useIsMobile } from '@/hooks/use-mobile';
import { UniversalAddSheet } from '@/components/UniversalAddSheet';
import { SpendingChart } from '@/components/SpendingChart';
import { CategoryPieChart } from '@/components/CategoryPieChart';
import { DashboardGrid } from '@/components/DashboardGrid';
import { TotalBalanceWidget } from '@/components/dashboard/TotalBalanceWidget';
import { MonthlyIncomeWidget } from '@/components/dashboard/MonthlyIncomeWidget';
import { MonthlyExpensesWidget } from '@/components/dashboard/MonthlyExpensesWidget';
import { MortgageWidget } from '@/components/dashboard/MortgageWidget';
import { DebtsWidget } from '@/components/dashboard/DebtsWidget';
import { CreditWidget } from '@/components/dashboard/CreditWidget';
import { DepositWidget } from '@/components/dashboard/DepositWidget';
import { RecentTransactionsWidget } from '@/components/dashboard/RecentTransactionsWidget';
import { SubscriptionsWidget } from '@/components/dashboard/SubscriptionsWidget';
import { CurrencyExchangeWidget } from '@/components/dashboard/CurrencyExchangeWidget';
import { InvestmentPortfolioWidget } from '@/components/dashboard/InvestmentPortfolioWidget';
import { InvestmentPerformanceWidget } from '@/components/dashboard/InvestmentPerformanceWidget';
import { AssetAllocationWidget } from '@/components/dashboard/AssetAllocationWidget';
import { SplitBillWidget } from '@/components/dashboard/SplitBillWidget';
import { SpendingAnomalyCard } from '@/components/dashboard/SpendingAnomalyCard';

export function Dashboard() {
    const [isEditing, setIsEditing] = React.useState(false);
    const dashboardGridRef = React.useRef<{ handleSave: () => void; handleCancel: () => void }>(null);
    // Phones get the single-column home from the mobile app; the widget grid is for wider screens
    const isPhone = useIsMobile(767);

    return (
        <div className="space-y-6">
            <SignedOut>
                <Navigate to="/login" />
            </SignedOut>

            <SignedIn>
                {isPhone === undefined ? null : isPhone ? (
                    <>
                        <ScopeSwitchRow />
                        <MobileHome />
                    </>
                ) : (
                <>
                <PageHeader title="Dashboard" variant="two-mixed">
                    {isEditing ? (
                        <>
                            <ActionButton
                                variant="outline"
                                onClick={() => {
                                    setIsEditing(false);
                                    dashboardGridRef.current?.handleCancel();
                                }}
                                className="flex-1 sm:flex-none"
                            >
                                <X className="h-4 w-4" />
                                Cancel
                            </ActionButton>
                            <ActionButton
                                onClick={() => {
                                    setIsEditing(false);
                                    dashboardGridRef.current?.handleSave();
                                }}
                                className="flex-1 sm:flex-none"
                            >
                                <Save className="h-4 w-4" />
                                Save Layout
                            </ActionButton>
                        </>
                    ) : (
                        <>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setIsEditing(true)}
                                className="h-8 w-8 shrink-0 text-muted-foreground hover:text-foreground"
                                title="Customize layout"
                                aria-label="Customize layout"
                            >
                                <LayoutGrid className="h-4 w-4" />
                            </Button>
                            <UniversalAddSheet
                                trigger={
                                    <ActionButton className="flex-1 sm:flex-none">
                                        <Plus className="h-4 w-4" />
                                        Add
                                    </ActionButton>
                                }
                            />
                        </>
                    )}
                </PageHeader>
                <ScopeSwitchRow />

                <SpendingAnomalyCard />

                {/* KPI Cards */}
                <DashboardGrid
                    isEditing={isEditing}
                    onEditingChange={setIsEditing}
                    ref={dashboardGridRef}
                >
                    {/* Total Balance Card */}
                    <TotalBalanceWidget key="totalBalance" />

                    {/* Monthly Income Card */}
                    <MonthlyIncomeWidget key="monthlyIncome" />

                    {/* Monthly Expenses Card */}
                    <MonthlyExpensesWidget key="monthlyExpenses" />

                    <SpendingChart key="spendingChart" />

                    <CategoryPieChart key="categoryChart" />

                    <RecentTransactionsWidget key="recentTransactions" />

                    <DebtsWidget key="debts" />

                    <CreditWidget key="credits" />

                    <DepositWidget key="deposits" />

                    <MortgageWidget key="mortgages" />

                    <SubscriptionsWidget key="subscriptions" />

                    {/* Currency & Investment Widgets */}
                    <CurrencyExchangeWidget key="currencyExchange" />

                    <InvestmentPortfolioWidget key="investmentPortfolio" />

                    <InvestmentPerformanceWidget key="investmentPerformance" />

                    <AssetAllocationWidget key="assetAllocation" />

                    <SplitBillWidget key="splitBills" />
                </DashboardGrid>
                </>
                )}
            </SignedIn>
        </div>
    );
}
