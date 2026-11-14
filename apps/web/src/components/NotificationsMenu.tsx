'use client';

import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from '@tanstack/react-router';
import { Bell, BellOff, Check, CheckCheck, ArrowRight, AlertCircle, CalendarClock, CreditCard, TrendingUp, Wallet, DollarSign } from 'lucide-react';
import { GlassEdge, MetricAura, tint } from '@/components/ui/glass';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { useBatchedMarkNotificationsAsRead } from '@/hooks/useBatchedMarkNotificationsAsRead';
import { toast } from 'sonner';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

interface Notification {
    id: string;
    type: string;
    title: string;
    message: string;
    priority: string;
    links?: {
        web?: string;
        mobile?: string;
        universal?: string;
    };
    entityType?: string;
    entityId?: string;
    isRead: boolean;
    createdAt: string;
}

// Accent per priority; rendered as a tinted glass chip rather than a solid circle
const priorityColors: Record<string, string> = {
    low: '#60A5FA',
    medium: '#FBBF24',
    high: '#FB923C',
    urgent: '#F87171',
};

const typeIcons = {
    subscription_due: CalendarClock,
    subscription_overdue: AlertCircle,
    subscription_paid: Check,
    payment_reminder: DollarSign,
    budget_alert: Wallet,
    spending_anomaly: AlertCircle,
    investment_update: TrendingUp,
    credit_limit: CreditCard,
    debt_reminder: CreditCard,
    general: Bell,
};

function formatNotificationTime(dateStr: string) {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
}

export function NotificationsMenu() {
    const [isOpen, setIsOpen] = useState(false);
    const [isMarkingAllRead, setIsMarkingAllRead] = useState(false);
    const lastNotifiedId = useRef<string | null>(null);
    const navigate = useNavigate();
    const { markAsRead, optimisticReadIds } = useBatchedMarkNotificationsAsRead();

    const { data: notificationsData, refetch } = trpc.notification.list.useQuery(
        { limit: 20, unreadOnly: true },
        { refetchInterval: 5000 }
    );

    // Browser notification effect
    useEffect(() => {
        if (!notificationsData?.notifications || notificationsData.notifications.length === 0) return;

        const latestNotification = notificationsData.notifications[0] as Notification;

        console.log('[Notification Debug] Latest:', latestNotification.title, 'isRead:', latestNotification.isRead);

        // Notify if it's new, unread, and we haven't notified about it yet
        if (!latestNotification.isRead && latestNotification.id !== lastNotifiedId.current) {
            console.log('[Notification Debug] Triggering native notification...');

            if ('Notification' in window) {
                console.log('[Notification Debug] Permission state:', Notification.permission);

                const showNotification = () => {
                    try {
                        const notification = new window.Notification(latestNotification.title, {
                            body: latestNotification.message,
                            icon: '/assets/woolet-icon.png',
                            tag: latestNotification.id,
                        });

                        notification.onclick = () => {
                            window.focus();
                            if (latestNotification.links?.web) {
                                navigate({ to: latestNotification.links.web });
                            }
                            notification.close();
                        };
                        console.log('[Notification Debug] Notification object created successfully');
                    } catch (e) {
                        console.error('[Notification Debug] Error creating Notification:', e);
                    }
                };

                if (Notification.permission === 'granted') {
                    showNotification();
                } else if (Notification.permission !== 'denied') {
                    console.log('[Notification Debug] Requesting permission...');
                    Notification.requestPermission().then(permission => {
                        console.log('[Notification Debug] Permission result:', permission);
                        if (permission === 'granted') {
                            showNotification();
                        }
                    });
                }
            } else {
                console.warn('[Notification Debug] Notifications API not supported in this browser');
            }
            lastNotifiedId.current = latestNotification.id;
        }
    }, [notificationsData?.notifications, navigate]);

    const markAllAsReadMutation = trpc.notification.markAllAsRead.useMutation({
        onMutate: () => setIsMarkingAllRead(true),
        onSuccess: async () => {
            await refetch();
            setIsMarkingAllRead(false);
        },
        onError: () => {
            setIsMarkingAllRead(false);
            toast.error('Could not mark all notifications as read');
        },
    });

    // deleteMutation removed (unused)

    const handleNotificationClick = (notification: Notification) => {
        if (!notification.isRead) {
            markAsRead(notification.id);
        }

        if (notification.links?.web) {
            const url = notification.links.web;
            setTimeout(() => {
                navigate({ to: url });
            }, 0);
        }
        setIsOpen(false);
    };

    const notifications = (notificationsData?.notifications || []).filter(
        (notification: Notification) => !isMarkingAllRead && !optimisticReadIds.has(notification.id)
    );
    const unreadCount = isMarkingAllRead
        ? 0
        : Math.max(0, (notificationsData?.unreadCount || 0) - optimisticReadIds.size);

    return (
        <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative rounded-xl" aria-label="Notifications">
                    <Bell className="h-5 w-5" />
                    {unreadCount > 0 && (
                        <span className="absolute -right-0.5 -top-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white ring-2 ring-background">
                            {unreadCount > 9 ? '9+' : unreadCount}
                        </span>
                    )}
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
                align="end"
                sideOffset={8}
                className="relative w-[calc(100vw-1.5rem)] overflow-hidden rounded-[24px] border-border bg-popover/95 p-0 shadow-[0_8px_30px_rgba(30,20,60,0.12)] dark:border-white/10 dark:bg-[#121218]/80 dark:shadow-[0_24px_60px_rgba(0,0,0,0.55)] backdrop-blur-2xl sm:w-[380px]"
            >
                <MetricAura color="#8B5CF6" cx={20} cy={0} opacity={0.22} />
                <GlassEdge />

                {/* Header */}
                <div className="relative flex items-center justify-between gap-2 px-4 pb-3 pt-4">
                    <div className="flex items-center gap-2">
                        <p className="text-base font-bold tracking-tight">Notifications</p>
                        {unreadCount > 0 && (
                            <span className="rounded-full bg-primary/25 px-2 py-0.5 text-[10px] font-bold tabular-nums text-primary dark:text-violet-200">
                                {unreadCount} new
                            </span>
                        )}
                    </div>
                    {unreadCount > 0 && (
                        <button
                            type="button"
                            onClick={() => markAllAsReadMutation.mutate()}
                            className="flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium text-muted-foreground transition-colors hover:bg-white/[0.06] hover:text-foreground"
                        >
                            <CheckCheck className="h-3.5 w-3.5" />
                            Mark all read
                        </button>
                    )}
                </div>

                {notifications.length === 0 ? (
                    <div className="relative flex flex-col items-center justify-center gap-1.5 px-6 pb-12 pt-8 text-center">
                        <span className="mb-2 flex size-12 items-center justify-center rounded-2xl bg-white/[0.05] text-muted-foreground">
                            <BellOff className="size-5" />
                        </span>
                        <p className="text-sm font-semibold">You're all caught up</p>
                        <p className="text-xs text-muted-foreground">New reminders and alerts will appear here</p>
                    </div>
                ) : (
                    <div className="relative max-h-[min(420px,65vh)] overflow-y-auto overscroll-contain">
                        <div className="space-y-0.5 px-2 pb-2">
                            {notifications.map((notification: Notification) => {
                                const Icon = typeIcons[notification.type as keyof typeof typeIcons] || Bell;
                                const isUnread = !notification.isRead;
                                const color = priorityColors[notification.priority] || '#A1A1AA';

                                return (
                                    <DropdownMenuItem
                                        key={notification.id}
                                        className="flex cursor-pointer items-start gap-3 rounded-2xl px-2.5 py-3 focus:bg-white/[0.05]"
                                        onClick={() => handleNotificationClick(notification)}
                                    >
                                        <span
                                            className="flex size-9 shrink-0 items-center justify-center rounded-xl border"
                                            style={{ color, backgroundColor: tint(color, 0.14), borderColor: tint(color, 0.28) }}
                                        >
                                            <Icon className="h-4 w-4" />
                                        </span>
                                        <div className="min-w-0 flex-1">
                                            <div className="flex items-start justify-between gap-2">
                                                <p className={cn(
                                                    'truncate text-[13px] font-semibold leading-tight',
                                                    isUnread ? 'text-foreground' : 'text-muted-foreground'
                                                )}>
                                                    {notification.title}
                                                </p>
                                                <span className="shrink-0 text-[10px] font-medium tabular-nums text-muted-foreground/70">
                                                    {formatNotificationTime(notification.createdAt)}
                                                </span>
                                            </div>
                                            <p className="mt-1 line-clamp-2 text-xs leading-snug text-muted-foreground">
                                                {notification.message}
                                            </p>
                                        </div>
                                        {isUnread && <span className="mt-1.5 size-2 shrink-0 rounded-full bg-violet-400 shadow-[0_0_8px_rgba(167,139,250,0.8)]" />}
                                    </DropdownMenuItem>
                                );
                            })}
                        </div>
                    </div>
                )}

                <div className="relative border-t border-white/[0.06] p-2">
                    <DropdownMenuItem asChild className="p-0 focus:bg-transparent">
                        <Link
                            to="/notifications"
                            className="flex h-10 w-full items-center justify-center gap-1.5 rounded-xl text-sm font-semibold text-primary dark:text-violet-300 transition-colors hover:bg-white/[0.05] hover:text-primary dark:hover:text-violet-200"
                        >
                            View all
                            <ArrowRight className="h-4 w-4" />
                        </Link>
                    </DropdownMenuItem>
                </div>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
