'use client';

import { Link, useRouterState } from '@tanstack/react-router';
import { SignOutButton, useAuth, useUser } from '@clerk/clerk-react';
import {
    Calculator,
    LayoutDashboard,
    Wallet,
    Receipt,
    Users,
    CreditCard,
    TrendingUp,
    HeartHandshake,
    Settings,
    ChevronUp,
    PiggyBank,
    Home,
    FlaskConical,
    CalendarClock,
    User,
    X,
    ExternalLink,
    Loader2,
} from 'lucide-react';
import { trpc } from '@/lib/trpc';

import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/sidebar';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
// Dialog components removed (unused)

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { PricingCtaBanner } from '@/components/PricingCtaBanner';
import { NotificationsMenu } from '@/components/NotificationsMenu';
import { usePricing } from '@/components/PricingContext';
import { toast } from 'sonner';
import { useState } from 'react';

const navGroups = [
    {
        label: 'Overview',
        items: [
            { title: 'Dashboard', url: '/', icon: LayoutDashboard },
            { title: 'Accounts', url: '/accounts', icon: Wallet },
            { title: 'Spending', url: '/spending', icon: Receipt },
            { title: 'Subscriptions', url: '/subscriptions', icon: CalendarClock },
            { title: 'Family', url: '/family', icon: HeartHandshake },
        ],
    },
    {
        label: 'Money',
        items: [
            { title: 'Debts', url: '/debts', icon: Users },
            { title: 'Credits', url: '/financial/credits', icon: CreditCard },
            { title: 'Mortgages', url: '/financial/mortgages', icon: Home },
            { title: 'Deposits', url: '/financial/deposits', icon: PiggyBank },
            { title: 'Investing', url: '/investing', icon: TrendingUp },
            { title: 'Taxes', url: '/tax', icon: Calculator },
        ],
    },
];

const navButtonClass =
    'h-9 rounded-xl px-3 text-muted-foreground transition-all hover:bg-white/[0.06] hover:text-foreground data-[active=true]:bg-gradient-to-r data-[active=true]:from-primary/30 data-[active=true]:to-primary/[0.06] data-[active=true]:font-semibold data-[active=true]:text-foreground data-[active=true]:shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_6px_16px_rgba(139,92,246,0.18)] data-[active=true]:[&>svg]:text-violet-300';

// Keep the account overlay compatible with the repository's React 18/19 type setup.
const AccountIcons = {
    Close: X as any,
    External: ExternalLink as any,
    Loader: Loader2 as any,
};

// comingSoonItems removed (unused)

export function AppSidebar() {
    const router = useRouterState();
    const { user } = useUser();
    const { data: limitsData } = trpc.user.getLimits.useQuery();
    const isTestMode = limitsData?.testMode;
    const currentPath = router.location.pathname;
    const preloadProps = { preload: 'render' as const, preloadDelay: 0 };
    const [accountDialogOpen, setAccountDialogOpen] = useState(false);

    const isActive = (url: string) => {
        if (url === '/') return currentPath === '/';
        return currentPath.startsWith(url);
    };

    return (
        <Sidebar variant="floating">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem className="flex items-center">
                        <SidebarMenuButton size="lg" asChild>
                            <Link to="/" {...preloadProps}>
                                <img src="/assets/woolet-icon.png" alt="Woolet" className="size-8 rounded-lg" />
                                <div className="flex flex-col gap-0.5 leading-none">
                                    <span className="font-semibold">Woolet</span>
                                </div>
                            </Link>
                        </SidebarMenuButton>
                        <div className="ml-auto pr-2 group-data-[collapsible=icon]:hidden">
                            <NotificationsMenu />
                        </div>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>
                {navGroups.map((group) => (
                    <SidebarGroup key={group.label}>
                        <SidebarGroupLabel className="text-[11px] font-bold uppercase tracking-[0.12em] text-muted-foreground/70">
                            {group.label}
                        </SidebarGroupLabel>
                        <SidebarGroupContent>
                            <SidebarMenu className="gap-0.5">
                                {group.items.map((item) => (
                                    <SidebarMenuItem key={item.title}>
                                        <SidebarMenuButton asChild isActive={isActive(item.url)} className={navButtonClass}>
                                            <Link to={item.url} {...preloadProps}>
                                                <item.icon className="size-4" />
                                                <span>{item.title}</span>
                                            </Link>
                                        </SidebarMenuButton>
                                    </SidebarMenuItem>
                                ))}
                            </SidebarMenu>
                        </SidebarGroupContent>
                    </SidebarGroup>
                ))}

                {/* Coming Soon */}
                {/* <SidebarGroup>
                    <SidebarGroupLabel>Coming Soon</SidebarGroupLabel>
                    <SidebarGroupContent>
                        <SidebarMenu>
                            {comingSoonItems.map((item) => (
                                <SidebarMenuItem key={item.title}>
                                    <SidebarMenuButton asChild isActive={isActive(item.url)}>
                                        <Link to={item.url} className="opacity-60" {...preloadProps}>
                                            <item.icon className="size-4" />
                                            <span>{item.title}</span>
                                        </Link>
                                    </SidebarMenuButton>
                                    <SidebarMenuBadge className="bg-primary/10 text-primary text-xs">
                                        {item.badge}
                                    </SidebarMenuBadge>
                                </SidebarMenuItem>
                            ))}
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup> */}
            </SidebarContent>

            <SidebarFooter>
                {isTestMode && (
                    <SidebarMenu>
                        <SidebarMenuItem>
                            <SidebarMenuButton asChild size="lg" className="bg-amber-100 text-amber-700 hover:bg-amber-200 hover:text-amber-800 hover:no-underline border border-amber-200 mb-2 h-10 transition-colors">
                                <Link to="/settings" {...preloadProps}>
                                    <div className="flex items-center justify-center size-8 rounded-lg bg-amber-200/50 text-amber-700 shrink-0">
                                        <FlaskConical className="size-4" />
                                    </div>
                                    <div className="flex flex-col gap-0.5 leading-tight group-data-[collapsible=icon]:hidden">
                                        <span className="font-semibold text-xs">Its' Test Mode</span>
                                        <span className="text-xs opacity-80">Tap to disable</span>
                                    </div>
                                </Link>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                    </SidebarMenu>
                )}

                <PricingCtaBanner variant="compact" className="mb-1" />

                <SidebarMenu>
                    <SidebarMenuItem>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <SidebarMenuButton
                                    size="lg"
                                    className="rounded-2xl border border-white/[0.06] bg-white/[0.03] hover:bg-white/[0.07] data-[state=open]:bg-white/[0.08]"
                                >
                                    <Avatar className="h-8 w-8 rounded-lg">
                                        <AvatarImage src={user?.imageUrl} alt={user?.fullName || ''} />
                                        <AvatarFallback className="rounded-lg">
                                            {user?.firstName?.charAt(0) || 'U'}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="grid flex-1 text-left text-sm leading-tight">
                                        <span className="truncate font-semibold">{user?.fullName || 'User'}</span>
                                        <span className="truncate text-xs text-muted-foreground">
                                            {user?.primaryEmailAddress?.emailAddress || 'email@example.com'}
                                        </span>
                                    </div>
                                    <ChevronUp className="ml-auto size-4" />
                                </SidebarMenuButton>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent
                                className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
                                side="top"
                                align="end"
                                sideOffset={4}
                            >
                                <DropdownMenuItem onClick={() => setAccountDialogOpen(true)}>
                                    <User className="size-4 mr-2" />
                                    Account
                                </DropdownMenuItem>
                                <DropdownMenuItem asChild>
                                    <Link to="/settings" className="flex items-center" {...preloadProps}>
                                        <Settings className="size-4 mr-2" />
                                        Settings
                                    </Link>
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarFooter>

            {/* Account Dialog - Woolet-owned profile and Paddle billing */}
            {accountDialogOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={() => setAccountDialogOpen(false)}>
                    <div className="relative max-h-[90vh] w-full max-w-4xl overflow-hidden rounded-2xl border border-white/10 bg-[#202126] text-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
                        <AccountPanel user={user} onClose={() => setAccountDialogOpen(false)} />
                    </div>
                </div>
            )}
        </Sidebar>
    );
}

function AccountPanel({ user, onClose }: { user: ReturnType<typeof useUser>['user']; onClose: () => void }) {
    const { getToken } = useAuth();
    const { activePlanId, isPaid, isLoading, openPricing } = usePricing();
    const [isManaging, setIsManaging] = useState(false);
    const planName = activePlanId ? activePlanId.charAt(0).toUpperCase() + activePlanId.slice(1) : 'Free';

    async function openPaddleBilling() {
        setIsManaging(true);
        try {
            const token = await getToken();
            const response = await fetch('/billing/paddle/portal', {
                method: 'POST',
                headers: token ? { Authorization: `Bearer ${token}` } : {},
            });
            const result = await response.json() as { url?: string; error?: string };
            if (!response.ok || !result.url) {
                throw new Error(result.error || 'Paddle billing is unavailable.');
            }
            window.location.assign(result.url);
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Unable to open Paddle billing.');
        } finally {
            setIsManaging(false);
        }
    }

    return (
        <div className="flex max-h-[90vh] min-h-[540px] flex-col md:flex-row">
            <aside className="flex w-full flex-col justify-between border-b border-white/10 bg-gradient-to-b from-[#292a31] to-[#30251f] p-8 md:w-72 md:border-b-0 md:border-r">
                <div>
                    <div className="mb-8 flex items-center gap-3">
                        <Avatar className="h-12 w-12 rounded-xl">
                            <AvatarImage src={user?.imageUrl} alt={user?.fullName || ''} />
                            <AvatarFallback className="rounded-xl bg-cyan-200 text-slate-950">{user?.firstName?.charAt(0) || 'U'}</AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                            <p className="truncate font-semibold">{user?.fullName || 'Your account'}</p>
                            <p className="truncate text-xs text-white/50">{user?.primaryEmailAddress?.emailAddress || 'No email'}</p>
                        </div>
                    </div>
                    <div className="rounded-xl bg-white/10 px-4 py-3 text-sm font-medium">Profile & billing</div>
                </div>
                <SignOutButton>
                    <Button variant="ghost" className="justify-start px-0 text-white/60 hover:bg-transparent hover:text-white">Sign out</Button>
                </SignOutButton>
            </aside>

            <section className="min-w-0 flex-1 overflow-y-auto p-7 md:p-10">
                <div className="mb-8 flex items-start justify-between gap-4 border-b border-white/10 pb-6">
                    <div>
                        <p className="text-sm font-medium text-cyan-200">Woolet account</p>
                        <h2 className="mt-1 text-2xl font-semibold tracking-tight">Profile details</h2>
                    </div>
                    <button onClick={onClose} className="rounded-full bg-white/90 p-2.5 text-slate-500 transition hover:bg-white" aria-label="Close account panel">
                        <AccountIcons.Close className="h-5 w-5" />
                    </button>
                </div>

                <div className="space-y-5">
                    <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-white/45">Profile</p>
                                <p className="mt-2 text-lg font-semibold">{user?.fullName || 'Your profile'}</p>
                                <p className="mt-1 text-sm text-white/55">{user?.primaryEmailAddress?.emailAddress || 'Add an email address in your auth settings.'}</p>
                            </div>
                            <div className="rounded-xl bg-white/10 px-4 py-3 text-sm text-white/70">Authentication by Clerk</div>
                        </div>
                    </div>

                    <div className="rounded-2xl border border-cyan-200/20 bg-cyan-200/[0.07] p-5">
                        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-cyan-200/75">Paddle plan</p>
                                <div className="mt-2 flex items-center gap-3">
                                    <h3 className="text-2xl font-semibold">{isLoading ? 'Loading…' : planName}</h3>
                                    {isPaid && <span className="rounded-full bg-emerald-300/15 px-2.5 py-1 text-xs font-semibold text-emerald-200">Active</span>}
                                </div>
                                <p className="mt-2 max-w-lg text-sm leading-6 text-white/60">
                                    Manage your Paddle subscription, payment method, invoices, and cancellation from Paddle’s secure customer portal.
                                </p>
                            </div>
                            {isPaid ? (
                                <Button onClick={() => void openPaddleBilling()} disabled={isManaging} className="shrink-0 rounded-xl bg-cyan-200 text-slate-950 hover:bg-cyan-100">
                                    {isManaging ? <AccountIcons.Loader className="h-4 w-4 animate-spin" /> : <AccountIcons.External className="h-4 w-4" />}
                                    Manage billing
                                </Button>
                            ) : (
                                <Button onClick={() => { onClose(); openPricing(); }} className="shrink-0 rounded-xl bg-cyan-200 text-slate-950 hover:bg-cyan-100">
                                    View plans
                                </Button>
                            )}
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}
