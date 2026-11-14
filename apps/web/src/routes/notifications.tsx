import { startTransition, useEffect, useState } from 'react';
import { createFileRoute, Link } from '@tanstack/react-router';
import { Bell, Check, ExternalLink, AlertCircle, CalendarClock, CreditCard, TrendingUp, Wallet, DollarSign, Trash2 } from 'lucide-react';
import { trpc } from '@/lib/trpc';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { useBatchedMarkNotificationsAsRead } from '@/hooks/useBatchedMarkNotificationsAsRead';
import { toast } from 'sonner';

export const Route = (createFileRoute as (path: string) => any)('/notifications')({
    component: NotificationsPage,
});

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
    actionTaken: boolean;
    createdAt: string;
}

interface NotificationListPage {
    notifications: Notification[];
    unreadCount: number;
    nextCursor?: string;
}

const priorityGradients = {
    low: 'bg-gradient-to-r from-blue-500/30 to-transparent',
    medium: 'bg-gradient-to-r from-yellow-500/30 to-transparent',
    high: 'bg-gradient-to-r from-orange-500/30 to-transparent',
    urgent: 'bg-gradient-to-r from-red-500/30 to-transparent',
};

const priorityBadgeColors = {
    low: 'bg-blue-500/10 text-blue-500',
    medium: 'bg-yellow-500/10 text-yellow-500',
    high: 'bg-orange-500/10 text-orange-500',
    urgent: 'bg-red-500/10 text-red-500',
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
    if (diffMins < 60) return `${diffMins} minutes ago`;
    if (diffHours < 24) return `${diffHours} hours ago`;
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
}

function NotificationListSkeleton() {
    return (
        <div className="space-y-4" role="status" aria-label="Loading notifications">
            {[0, 1, 2].map(index => (
                <Card
                    key={index}
                    className="dashboard-widget h-auto overflow-hidden rounded-[32px]"
                >
                    <CardContent className="p-5">
                        <div className="flex animate-pulse items-start gap-4">
                            <div className="size-11 shrink-0 rounded-full bg-muted" />
                            <div className="min-w-0 flex-1 space-y-3 py-1">
                                <div className="flex items-center justify-between gap-4">
                                    <div className="h-4 w-2/5 rounded-full bg-muted" />
                                    <div className="h-3 w-16 rounded-full bg-muted/70" />
                                </div>
                                <div className="h-3 w-4/5 rounded-full bg-muted/70" />
                                <div className="flex gap-3 pt-2">
                                    <div className="h-8 w-28 rounded-md bg-muted" />
                                    <div className="h-8 w-24 rounded-md bg-muted/70" />
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            ))}
            <span className="sr-only">Loading notifications</span>
        </div>
    );
}

export function NotificationsPage() {
    const [activeTab, setActiveTab] = useState<'unread' | 'read'>('unread');
    const [isMarkingAllRead, setIsMarkingAllRead] = useState(false);
    const [shouldLoadRead, setShouldLoadRead] = useState(false);
    const { markAsRead, optimisticReadIds } = useBatchedMarkNotificationsAsRead();
    const utils = trpc.useContext();

    const unreadQuery = trpc.notification.list.useInfiniteQuery(
        { limit: 50, readStatus: 'unread' },
        {
            refetchInterval: 5000,
            getNextPageParam: (lastPage: NotificationListPage) => lastPage.nextCursor,
        }
    );

    const readQuery = trpc.notification.list.useInfiniteQuery(
        { limit: 50, readStatus: 'read' },
        {
            enabled: activeTab === 'read' || shouldLoadRead,
            staleTime: 60_000,
            refetchOnWindowFocus: false,
            getNextPageParam: (lastPage: NotificationListPage) => lastPage.nextCursor,
        }
    );

    const hasLoadedUnread = unreadQuery.data !== undefined;
    const hasLoadedRead = readQuery.data !== undefined;

    useEffect(() => {
        if (!hasLoadedUnread || hasLoadedRead || shouldLoadRead || activeTab === 'read') return;

        const beginBackgroundReadLoad = () => {
            startTransition(() => setShouldLoadRead(true));
        };

        if ('requestIdleCallback' in window) {
            const idleCallbackId = window.requestIdleCallback(beginBackgroundReadLoad, { timeout: 1500 });
            return () => window.cancelIdleCallback(idleCallbackId);
        }

        const timeoutId = setTimeout(beginBackgroundReadLoad, 300);
        return () => clearTimeout(timeoutId);
    }, [activeTab, hasLoadedRead, hasLoadedUnread, shouldLoadRead]);

    const activeQuery = activeTab === 'unread' ? unreadQuery : readQuery;
    const notificationsData = activeQuery.data;
    const isContentLoading = activeQuery.isLoading && notificationsData === undefined;
    const { fetchNextPage, hasNextPage, isFetchingNextPage } = activeQuery;

    const markAllAsReadMutation = trpc.notification.markAllAsRead.useMutation({
        onMutate: () => setIsMarkingAllRead(true),
        onSuccess: async () => {
            await utils.notification.list.invalidate();
            setIsMarkingAllRead(false);
        },
        onError: () => {
            setIsMarkingAllRead(false);
            toast.error('Could not mark all notifications as read');
        },
    });

    const deleteMutation = trpc.notification.delete.useMutation({
        onSuccess: () => utils.notification.list.invalidate(),
    });

    const notifications = (notificationsData?.pages.flatMap(
        (page: NotificationListPage) => page.notifications
    ) || []).filter(
        (notification: Notification) => activeTab === 'read'
            || (!isMarkingAllRead && !optimisticReadIds.has(notification.id))
    );
    const unreadCount = isMarkingAllRead
        ? 0
        : Math.max(0, (unreadQuery.data?.pages[0]?.unreadCount || 0) - optimisticReadIds.size);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">Notifications</h1>
                    <p className="hidden sm:block text-sm md:text-base text-muted-foreground">
                        {hasLoadedUnread
                            ? unreadCount > 0
                                ? `${unreadCount} unread notifications`
                                : 'All caught up!'
                            : '\u00A0'}
                    </p>
                </div>
                {hasLoadedUnread && unreadCount > 0 && (
                    <Button onClick={() => markAllAsReadMutation.mutate()}>
                        <Check className="h-4 w-4 mr-2" />
                        Mark all as read
                    </Button>
                )}
            </div>

            <Tabs value={activeTab} onValueChange={value => setActiveTab(value as 'unread' | 'read')}>
                <TabsList className="grid w-full max-w-[400px] grid-cols-2">
                    <TabsTrigger value="unread">
                        Unread
                        {unreadCount > 0 && (
                            <Badge variant="secondary" className="ml-2 h-5 px-1.5">
                                {unreadCount}
                            </Badge>
                        )}
                    </TabsTrigger>
                    <TabsTrigger value="read">Read</TabsTrigger>
                </TabsList>

                <TabsContent value={activeTab} className="mt-4">
                    {isContentLoading ? (
                        <NotificationListSkeleton />
                    ) : notifications.length === 0 ? (
                        <Card className="dashboard-widget h-full rounded-[32px] overflow-hidden">
                            <CardHeader className="p-3 pb-2">
                                <Bell className="h-8 w-8 text-muted-foreground mb-2" />
                            </CardHeader>
                            <CardContent className="p-6 text-center">
                                <h3 className="text-lg font-semibold">No notifications</h3>
                                <p className="text-muted-foreground mt-2">
                                    {activeTab === 'unread'
                                        ? 'You have no unread notifications'
                                        : 'You have no read notifications yet'}
                                </p>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="space-y-4">
                            {notifications.map((notification: Notification) => {
                                const Icon = typeIcons[notification.type as keyof typeof typeIcons] || Bell;

                                return (
                                    <Card
                                        key={notification.id}
                                        className="dashboard-widget h-auto rounded-[32px] overflow-hidden group"
                                    >
                                        <div className="relative overflow-hidden">
                                            <div 
                                                className={cn(
                                                    "absolute left-0 top-0 bottom-0 w-[140px]",
                                                    priorityGradients[notification.priority as keyof typeof priorityGradients] || 'bg-gradient-to-r from-primary to-transparent'
                                                )}
                                            />
                                            <CardContent className="p-5">
                                                <div className="flex items-start gap-4">
                                                    <div className="h-11 w-11 rounded-full flex items-center justify-center shrink-0 bg-primary/10 text-primary">
                                                        <Icon className="h-5 w-5" />
                                                    </div>

                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center justify-between gap-2 mb-2">
                                                            <div className="flex items-center gap-2">
                                                                <h4 className="font-semibold text-foreground">
                                                                    {notification.title}
                                                                </h4>
                                                                <Badge
                                                                    variant="secondary"
                                                                    className={priorityBadgeColors[notification.priority as keyof typeof priorityBadgeColors]}
                                                                >
                                                                    {notification.priority}
                                                                </Badge>
                                                            </div>
                                                            <span className="text-xs text-muted-foreground shrink-0">
                                                                {formatNotificationTime(notification.createdAt)}
                                                            </span>
                                                        </div>

                                                        <p className="text-sm text-muted-foreground">
                                                            {notification.message}
                                                        </p>

                                                        <div className="flex items-center gap-3 mt-4">
                                                            {!notification.isRead && (
                                                                <Button
                                                                    variant="outline"
                                                                    size="sm"
                                                                    onClick={() => markAsRead(notification.id)}
                                                                >
                                                                    <Check className="h-3 w-3 mr-1" />
                                                                    Mark as read
                                                                </Button>
                                                            )}

                                                            {notification.links?.web && (
                                                                <Link to={notification.links.web}>
                                                                    <Button variant="outline" size="sm">
                                                                        <ExternalLink className="h-3 w-3 mr-1" />
                                                                        View details
                                                                    </Button>
                                                                </Link>
                                                            )}

                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                className="text-muted-foreground hover:text-destructive"
                                                                onClick={() => deleteMutation.mutate({ id: notification.id })}
                                                            >
                                                                <Trash2 className="h-3 w-3" />
                                                            </Button>
                                                        </div>
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </div>
                                    </Card>
                                );
                            })}
                            {hasNextPage && (
                                <div className="flex justify-center pt-2">
                                    <Button
                                        variant="outline"
                                        onClick={() => fetchNextPage()}
                                        disabled={isFetchingNextPage}
                                    >
                                        {isFetchingNextPage ? 'Loading…' : 'Load more'}
                                    </Button>
                                </div>
                            )}
                        </div>
                    )}
                </TabsContent>
            </Tabs>
        </div>
    );
}
