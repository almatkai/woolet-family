import { FamilyMemberPage } from './routes/family/member';
import { FinanceRoute } from '@/components/family/FinanceRoute';
import { FamilyPage } from './routes/family';
import { FamilyJoinPage } from './routes/family/join';
import { FamilyWalletPage } from './routes/family/wallet';
import {
    createRootRoute,
    createRoute,
    retainSearchParams,
    Outlet,
    useLocation,
    Navigate,
    redirect,
} from '@tanstack/react-router';
import { SignedIn, useAuth } from '@clerk/clerk-react';
import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import {
    SidebarProvider,
    SidebarTrigger,
    SidebarInset,
} from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/app-sidebar';
import { AiChatFloatingItem } from '@/components/AiChatWidget';
import { MobileBottomNav } from '@/components/MobileBottomNav';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { AmbientGlow } from '@/components/ui/glass';
import { format } from 'date-fns';

// Dashboard-like loading screen shown while Clerk resolves auth state
function DashboardLoadingScreen() {
    return (
        <div className="min-h-screen w-full bg-background p-3 md:p-6">
            <div className="space-y-6">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div className="space-y-2">
                        <Skeleton className="h-8 w-44" />
                        <Skeleton className="h-4 w-64" />
                    </div>
                    <div className="flex gap-2">
                        <Skeleton className="h-9 w-24" />
                        <Skeleton className="h-9 w-28" />
                    </div>
                </div>

                <Skeleton className="h-24 w-full rounded-xl" />

                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
                    {Array.from({ length: 12 }).map((_, i) => (
                        <Skeleton key={i} className="h-44 w-full rounded-xl" />
                    ))}
                </div>
            </div>
        </div>
    );
}

// Routes
import { Dashboard } from './routes/index';
import { AccountsPage } from './routes/accounts';
import { SpendingPage } from './routes/spending';
import { DebtsPage } from './routes/debts';
import { InvestingPage } from './routes/investing';
import { TaxPage } from './routes/tax';
import CreditsPage from './routes/financial/credits';
import MortgagesPage from './routes/financial/mortgages';
import DepositsPage from './routes/financial/deposits';
import { SubscriptionsPage } from './routes/subscriptions';
import { LoginPage } from './routes/login';
import { RegisterPage } from './routes/register';
import { SSOCallbackPage } from './routes/sso-callback';
import { PricingPage } from './routes/pricing';
import AdminRoute from './routes/admin';
import AdminLayout from './components/admin/AdminLayout';
import AdminAiConfig from './components/admin/AdminAiConfig';
import AdminProviders from './components/admin/AdminProviders';
import AdminModels from './components/admin/AdminModels';
import AdminChat from './components/admin/AdminChat';
import AdminSettings from './components/admin/AdminSettings';
// AccountPage no longer used as a route - now shown in dialog
import { SettingsPage } from './routes/settings';
import { NotificationsPage } from './routes/notifications';
import { WooPage } from './routes/woo';

// Layouts
import { SettingsLayout } from '@/components/SettingsLayout';

import { Bitcoin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    PostHogPageviewTracker,
    PostHogUserIdentifier,
} from './components/PostHogProvider';
import { UsernameSetupDialog } from '@/components/UsernameSetupDialog';
import { PostHogSurveyTrigger } from '@/components/PostHogSurveyTrigger';

// Root layout with sidebar
function RootLayout() {
    const { isSignedIn, isLoaded } = useAuth();
    const location = useLocation();
    const isSettingsRoute = location.pathname.startsWith('/settings');
    const isAuthRoute =
        location.pathname.startsWith('/login') ||
        location.pathname.startsWith('/register') ||
        location.pathname.startsWith('/sso-callback');
    const isAdminRoute = location.pathname.startsWith('/admin');
    const isPublicRoute = isAuthRoute;

    // Block all route rendering until auth state is resolved to avoid UI flicker
    // between protected pages and auth pages.
    if (!isLoaded) {
        return <DashboardLoadingScreen />;
    }

    let pendingFamilyToken: string | null = null;
    if (isSignedIn && location.pathname !== '/family/join') {
        try {
            pendingFamilyToken = sessionStorage.getItem(
                'woolet.pendingFamilyJoin',
            );
        } catch {
            // Storage may be unavailable; regular navigation still works.
        }
    }
    if (pendingFamilyToken) {
        return (
            <Navigate
                to="/family/join"
                search={{ token: pendingFamilyToken }}
                replace
            />
        );
    }

    if (!isPublicRoute && !isSignedIn) {
        if (location.pathname === '/family/join') {
            try {
                const token = new URLSearchParams(window.location.search).get(
                    'token',
                );
                if (token)
                    sessionStorage.setItem('woolet.pendingFamilyJoin', token);
            } catch {
                // Sign-in still works when session storage is unavailable.
            }
        }
        return <Navigate to="/login" replace />;
    }

    // Admin route should have minimal layout
    if (isAdminRoute) {
        return (
            <>
                <PostHogUserIdentifier />
                <PostHogPageviewTracker />
                <main className="h-full overflow-y-auto p-0">
                    <Outlet />
                </main>
            </>
        );
    }

    return (
        <>
            <PostHogUserIdentifier />
            <PostHogPageviewTracker />
            <SidebarProvider>
                <SignedIn>{!isAuthRoute && <AppSidebar />}</SignedIn>
                <SidebarInset
                    className={
                        !isSignedIn || isAuthRoute
                            ? '!m-0 !rounded-none !border-0 !shadow-none bg-background'
                            : 'relative bg-transparent overflow-hidden'
                    }
                >
                    {!isAuthRoute && <AmbientGlow />}
                    <SignedIn>
                        {!isAuthRoute && (
                            <header
                                className={cn(
                                    'pointer-events-none absolute inset-x-0 top-0 z-[45] flex h-14 items-center justify-between gap-2 px-4',
                                    'max-[470px]:hidden',
                                )}
                            >
                                <div className="pointer-events-auto flex h-10 items-center gap-2 rounded-full border border-black/[0.06] bg-white/60 pl-1.5 pr-4 backdrop-blur-2xl shadow-[inset_0_1px_0_rgba(255,255,255,0.6)] dark:border-white/10 dark:bg-white/[0.035] dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]">
                                    <SidebarTrigger className="h-7 w-7 rounded-full text-muted-foreground hover:text-foreground" />
                                    <Separator
                                        orientation="vertical"
                                        className="hidden sm:block mr-1 h-4 opacity-30"
                                    />
                                    <span className="text-xs font-semibold text-muted-foreground tracking-wide">
                                        {format(new Date(), 'EEEE · MMM d')}
                                    </span>
                                </div>
                            </header>
                        )}
                    </SignedIn>
                    <main
                        className={cn(
                            'flex-1 w-full overflow-y-auto',
                            location.pathname === '/spending'
                                ? 'overflow-x-auto'
                                : 'overflow-x-hidden',
                            isSignedIn && !isAuthRoute && !isSettingsRoute
                                ? 'p-3 md:p-6'
                                : 'p-0',
                            // Header floats over the scroll area; offset content so it starts below it but scrolls underneath.
                            isSignedIn &&
                                !isAuthRoute &&
                                (isSettingsRoute
                                    ? 'min-[471px]:pt-14'
                                    : 'min-[471px]:pt-[68px] md:pt-20'),
                            !isAuthRoute &&
                                (location.pathname === '/woo'
                                    ? 'max-[470px]:pb-[5.25rem]'
                                    : 'max-[470px]:pb-[calc(6rem+env(safe-area-inset-bottom))]'),
                        )}
                    >
                        <Outlet />
                    </main>
                </SidebarInset>
                <SignedIn>
                    {!isAuthRoute && (
                        <>
                            <UsernameSetupDialog />
                            <PostHogSurveyTrigger />
                            {location.pathname !== '/woo' && (
                                <AiChatFloatingItem />
                            )}
                            <MobileBottomNav />
                        </>
                    )}
                </SignedIn>
            </SidebarProvider>
        </>
    );
}

// Coming Soon Pages
function ComingSoonCrypto() {
    return (
        <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-orange-500 to-yellow-500">
                <Bitcoin className="h-10 w-10 text-white" />
            </div>
            <h1 className="text-3xl font-bold mb-4">Crypto Coming Soon</h1>
            <p className="text-muted-foreground mb-8 max-w-md">
                Track your cryptocurrency holdings across multiple wallets and
                exchanges.
            </p>
            <Button variant="outline" disabled>
                Notify Me When Available
            </Button>
        </div>
    );
}

// Define routes
export const rootRoute = createRootRoute({
    component: RootLayout,
    validateSearch: (
        s: Record<string, unknown>,
    ): {
        view?: 'personal';
        month?: string;
        currency?: string;
        member?: string;
        category?: string;
        day?: string;
    } => ({
        day:
            typeof s.day === 'string' &&
            /^\d{4}-\d{2}-\d{2}$/.test(s.day) &&
            !Number.isNaN(Date.parse(s.day))
                ? s.day
                : undefined,
        view: s.view === 'personal' ? ('personal' as const) : undefined,
        month:
            typeof s.month === 'string' &&
            /^\d{4}-(0[1-9]|1[0-2])$/.test(s.month)
                ? s.month
                : undefined,
        currency:
            typeof s.currency === 'string' && /^[A-Z]{3}$/.test(s.currency)
                ? s.currency
                : undefined,
        member:
            typeof s.member === 'string' && /^[0-9a-f-]{36}$/i.test(s.member)
                ? s.member
                : undefined,
        category:
            typeof s.category === 'string' &&
            (s.category === 'none' || /^[0-9a-f-]{36}$/i.test(s.category))
                ? s.category
                : undefined,
    }),
    search: { middlewares: [retainSearchParams(['view'])] },
});

export const indexRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/',
    component: () => <FinanceRoute personal={Dashboard} title="Dashboard" />,
});

export const accountsRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/accounts',
    component: () => <FinanceRoute personal={AccountsPage} title="Accounts" />,
});

export const spendingRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/spending',
    component: () => <FinanceRoute personal={SpendingPage} title="Spending" />,
});

export const debtsRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/debts',
    component: () => <FinanceRoute personal={DebtsPage} title="Debts" />,
});

export const creditsRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/financial/credits',
    component: () => <FinanceRoute personal={CreditsPage} title="Credits" />,
});

export const mortgagesRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/financial/mortgages',
    component: () => (
        <FinanceRoute personal={MortgagesPage} title="Mortgages" />
    ),
});

export const depositsRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/financial/deposits',
    component: () => <FinanceRoute personal={DepositsPage} title="Deposits" />,
});

export const investingRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/investing',
    component: () => (
        <FinanceRoute personal={InvestingPage} title="Investing" />
    ),
});

export const taxRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/tax',
    component: () => <FinanceRoute personal={TaxPage} title="Tax" />,
});

export const subscriptionsRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/subscriptions',
    component: () => (
        <FinanceRoute personal={SubscriptionsPage} title="Subscriptions" />
    ),
});

export const comingSoonCryptoRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/coming-soon/crypto',
    component: ComingSoonCrypto,
});

// Settings Layout and its children
export const settingsLayoutRoute = createRoute({
    getParentRoute: () => rootRoute,
    id: 'settings-layout',
    component: SettingsLayout,
});

// Account route removed - Account is now accessed via dialog from sidebar

export const settingsRoute = createRoute({
    getParentRoute: () => settingsLayoutRoute,
    path: '/settings',
    component: SettingsPage,
});

export const loginRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/login',
    component: LoginPage,
});

export const registerRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/register',
    component: RegisterPage,
});

export const ssoCallbackRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/sso-callback',
    component: SSOCallbackPage,
});

export const pricingRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/pricing',
    component: PricingPage,
});

export const adminRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/admin',
    component: AdminLayout,
});

export const adminIndexRoute = createRoute({
    getParentRoute: () => adminRoute,
    path: '/',
    beforeLoad: () => {
        throw redirect({ to: '/admin/config' });
    },
});

export const adminConfigRoute = createRoute({
    getParentRoute: () => adminRoute,
    path: '/config',
    component: AdminAiConfig,
});

export const adminProvidersRoute = createRoute({
    getParentRoute: () => adminRoute,
    path: '/providers',
    component: AdminProviders,
});

export const adminModelsRoute = createRoute({
    getParentRoute: () => adminRoute,
    path: '/models',
    component: AdminModels,
});

export const adminChatRoute = createRoute({
    getParentRoute: () => adminRoute,
    path: '/chat',
    component: AdminChat,
});

export const adminSettingsRoute = createRoute({
    getParentRoute: () => adminRoute,
    path: '/settings',
    component: AdminSettings,
});

export const notificationsRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/notifications',
    component: NotificationsPage,
});

// Route tree
export const wooRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/woo',
    component: WooPage,
});

export const familyRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/family',
    component: FamilyPage,
});
export const familyJoinRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/family/join',
    component: FamilyJoinPage,
    validateSearch: (search: Record<string, unknown>): { token?: string } => ({
        token: typeof search.token === 'string' ? search.token : undefined,
    }),
});
export const familyMemberRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/family/members/$memberId',
    component: FamilyMemberPage,
    validateSearch: (search: Record<string, unknown>): { month?: string; currency?: string } => ({
        month: typeof search.month === 'string' && /^\d{4}-(0[1-9]|1[0-2])$/.test(search.month) ? search.month : undefined,
        currency: typeof search.currency === 'string' ? search.currency : undefined,
    }),
});

export const familyWalletRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/family/wallets/$walletId',
    component: FamilyWalletPage,
});
export const routeTree = rootRoute.addChildren([
    familyRoute,
    familyJoinRoute,
    familyWalletRoute,
    familyMemberRoute,
    indexRoute,
    accountsRoute,
    spendingRoute,
    debtsRoute,
    investingRoute,
    taxRoute,
    creditsRoute,
    mortgagesRoute,
    depositsRoute,
    subscriptionsRoute,
    notificationsRoute,
    wooRoute,
    settingsLayoutRoute.addChildren([settingsRoute]),
    loginRoute,
    registerRoute,
    ssoCallbackRoute,
    pricingRoute,
    adminRoute.addChildren([
        adminIndexRoute,
        adminConfigRoute,
        adminProvidersRoute,
        adminModelsRoute,
        adminChatRoute,
        adminSettingsRoute,
    ]),
]);
