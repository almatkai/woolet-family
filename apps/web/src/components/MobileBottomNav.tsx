'use client';

import { useState } from 'react';
import { Link, useRouterState } from '@tanstack/react-router';
import {
    Home,
    Receipt,
    Landmark,
    Menu,
    Plus,
    CalendarClock,
    TrendingUp,
    Users,
    CreditCard,
    PiggyBank,
    Building2,
    Settings,
    X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { UniversalAddSheet } from '@/components/UniversalAddSheet';
import { MomoAvatar } from '@/components/ai/MomoAvatar';
import { Momo } from '@/components/ai/Momo';
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
} from '@/components/ui/sheet';

const moreItems = [
    { title: 'Subscriptions', url: '/subscriptions', icon: CalendarClock },
    { title: 'Investing', url: '/investing', icon: TrendingUp },
    { title: 'Debts', url: '/debts', icon: Users },
    { title: 'Credits', url: '/financial/credits', icon: CreditCard },
    { title: 'Mortgages', url: '/financial/mortgages', icon: Building2 },
    { title: 'Deposits', url: '/financial/deposits', icon: PiggyBank },
    { title: 'Settings', url: '/settings', icon: Settings },
];

export function MobileBottomNav() {
    const router = useRouterState();
    const currentPath = router.location.pathname;
    const [addOpen, setAddOpen] = useState(false);
    const [moreOpen, setMoreOpen] = useState(false);

    const isActive = (url: string) => {
        if (url === '/') return currentPath === '/';
        return currentPath.startsWith(url);
    };

    const isMoreActive = moreItems.some((item) => isActive(item.url));

    return (
        <>
            <UniversalAddSheet open={addOpen} onOpenChange={setAddOpen} />

            {/* More Sheet */}
            <Sheet open={moreOpen} onOpenChange={setMoreOpen}>
                <SheetContent
                    side="bottom"
                    showClose={false}
                    className="rounded-t-[28px] border-t border-border bg-background/95 dark:border-white/10 dark:bg-[#161619]/95 backdrop-blur-xl pb-[env(safe-area-inset-bottom)] max-h-[75vh]"
                >
                    <SheetHeader className="pb-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <MomoAvatar size={24} color="hsl(var(--primary))" />
                                <SheetTitle className="text-base font-bold">More Services</SheetTitle>
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => {
                                        setMoreOpen(false);
                                        setAddOpen(true);
                                    }}
                                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-purple-600 text-white text-xs font-bold hover:bg-purple-500 transition-colors shadow-sm"
                                >
                                    <Plus className="size-3.5" />
                                    <span>Add</span>
                                </button>
                                <button
                                    onClick={() => setMoreOpen(false)}
                                    className="flex size-7 items-center justify-center rounded-full bg-muted dark:bg-white/10 text-muted-foreground hover:text-foreground transition-colors"
                                >
                                    <X className="size-4" />
                                </button>
                            </div>
                        </div>
                    </SheetHeader>
                    <div className="grid grid-cols-4 gap-2 pb-4">
                        {moreItems.map((item) => (
                            <Link
                                key={item.title}
                                to={item.url}
                                onClick={() => setMoreOpen(false)}
                                className={cn(
                                    'flex flex-col items-center gap-1.5 rounded-2xl p-2.5 transition-all',
                                    isActive(item.url)
                                        ? 'bg-purple-500/15 text-primary dark:text-purple-400 border border-purple-500/25'
                                        : 'text-muted-foreground hover:bg-white/[0.05] hover:text-foreground'
                                )}
                            >
                                <div
                                    className={cn(
                                        'flex size-10 items-center justify-center rounded-xl transition-all',
                                        isActive(item.url) ? 'bg-purple-500/25 text-primary dark:text-purple-300' : 'bg-muted dark:bg-white/[0.07]'
                                    )}
                                >
                                    <item.icon className="size-5" />
                                </div>
                                <span className="text-[10px] font-semibold leading-tight text-center truncate w-full">
                                    {item.title}
                                </span>
                            </Link>
                        ))}
                    </div>
                </SheetContent>
            </Sheet>

            {/* Bottom Nav Bar — visible on small devices ≤470px */}
            <nav
                className={cn(
                    'hidden max-[470px]:flex',
                    'fixed bottom-0 left-0 right-0 z-[44]',
                    'border-t border-border bg-background/95 dark:border-white/10 dark:bg-[#111113]/90 backdrop-blur-xl',
                    'pb-[env(safe-area-inset-bottom)]'
                )}
            >
                <div className="flex w-full items-center justify-around px-2 py-2">
                    {/* Home */}
                    <NavTab
                        title="Home"
                        url="/"
                        icon={Home}
                        active={isActive('/')}
                    />

                    {/* Activity */}
                    <NavTab
                        title="Activity"
                        url="/spending"
                        icon={Receipt}
                        active={isActive('/spending')}
                    />

                    {/* Accounts */}
                    <NavTab
                        title="Accounts"
                        url="/accounts"
                        icon={Landmark}
                        active={isActive('/accounts')}
                    />

                    {/* Woo AI Mascot Tab */}
                    <Link
                        to="/woo"
                        className="relative flex flex-col items-center gap-1 min-w-[50px] transition-transform active:scale-90"
                        aria-label="Woo AI Assistant"
                    >
                        <span
                            className={cn(
                                'flex size-10 items-center justify-center overflow-hidden rounded-[14px] bg-primary shadow-[0_6px_18px_rgba(139,92,246,0.4)] transition-all',
                                isActive('/woo') && 'ring-2 ring-violet-300/70 ring-offset-2 ring-offset-background'
                            )}
                        >
                            <Momo size={25} />
                        </span>
                        <span className={cn('text-[10px] font-bold', isActive('/woo') ? 'text-foreground' : 'text-primary dark:text-purple-300')}>Woo</span>
                    </Link>

                    {/* More */}
                    <button
                        onClick={() => setMoreOpen(true)}
                        className={cn(
                            'relative flex flex-col items-center gap-1 min-w-[50px] transition-colors',
                            isMoreActive ? 'text-primary dark:text-purple-400 font-bold' : 'text-muted-foreground'
                        )}
                        aria-label="More"
                    >
                        <div className="size-5 flex items-center justify-center">
                            <Menu className="size-5" />
                        </div>
                        <span className="text-[10px] font-semibold">More</span>
                        {isMoreActive && (
                            <span className="absolute -bottom-1 size-1 rounded-full bg-purple-500" />
                        )}
                    </button>
                </div>
            </nav>
        </>
    );
}

interface NavTabProps {
    title: string;
    url: string;
    icon: React.ElementType;
    active: boolean;
}

function NavTab({ title, url, icon: Icon, active }: NavTabProps) {
    return (
        <Link
            to={url}
            className={cn(
                'relative flex flex-col items-center gap-1 min-w-[50px] transition-colors active:scale-95',
                active ? 'text-foreground font-bold' : 'text-muted-foreground'
            )}
        >
            <div className="size-5 flex items-center justify-center">
                <Icon className={cn("size-5", active ? "text-primary" : "text-muted-foreground")} />
            </div>
            <span className="text-[10px] font-semibold">{title}</span>
            {active && (
                <span className="absolute -bottom-1 h-0.5 w-3 rounded-full bg-purple-500" />
            )}
        </Link>
    );
}
