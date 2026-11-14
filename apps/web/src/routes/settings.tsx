
import { useTheme, type Theme } from '@/components/theme-provider';
import { trpc } from '@/lib/trpc';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { GlassCard, tint } from '@/components/ui/glass';
import { PageHeader } from '@/components/PageHeader';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { LogOut } from 'lucide-react';
import { toast } from 'sonner';
import {
    Moon,
    MoonStar,
    Monitor,
    Sun,
    AtSign,
    ShieldCheck,
    FlaskConical,
    Clock,
    ChevronDown,
    Trash2,
    AlertTriangle,
    Calendar,
    DollarSign,
    Download,
    Upload,
    FileJson,
    Loader2,
    ListChecks
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { PushNotificationSettings, usePushNotifications } from '@/hooks/usePushNotifications';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from '@/components/ui/select';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Bell, BellRing } from 'lucide-react';
import { SignOutButton, useUser } from '@clerk/clerk-react';
import { CurrencySelector } from '@/components/ui/currency-selector';
import { UsernameSetupDialog } from '@/components/UsernameSetupDialog';

export function SettingsPage() {
    const { theme, setTheme } = useTheme();
    const { data: me } = trpc.user.me.useQuery();
    const { user } = useUser();
    const { data: settings } = trpc.settings.getUserSettings.useQuery();
    const [isExporting, setIsExporting] = useState(false);
    const [isImporting, setIsImporting] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [pushSettingsOpen, setPushSettingsOpen] = useState(false);
    const [isUsernameDialogOpen, setIsUsernameDialogOpen] = useState(false);
    const [_emailNotificationAddress, setEmailNotificationAddress] = useState('');

    const { isSupported, isSubscribed, isLoading, isUpdating, vapidPublicKey, vapidKeyError, error: pushError, subscribe, unsubscribe } = usePushNotifications();
    const hasBrowserPermission =
        typeof window !== 'undefined' &&
        typeof Notification !== 'undefined' &&
        Notification.permission === 'granted';
    const needsInAppSetup = hasBrowserPermission && !isSubscribed;

    const utils = trpc.useUtils();

    const updateSettings = trpc.settings.updateUserSettings.useMutation({
        onMutate: async (variables: any) => {
            await utils.settings.getUserSettings.cancel();
            const previousSettings = utils.settings.getUserSettings.getData();

            utils.settings.getUserSettings.setData(undefined, (current: any) => ({
                ...current,
                ...variables,
            }));

            return { previousSettings };
        },
        onError: (error: { message?: string }, _variables: any, context: any) => {
            utils.settings.getUserSettings.setData(undefined, context?.previousSettings);
            toast.error(error.message || 'Failed to update settings');
        },
        onSettled: () => {
            utils.settings.getUserSettings.invalidate();
            utils.currency.getPreferred.invalidate();
        },
    });

    const updateUserProfile = trpc.user.update.useMutation({
        onMutate: async (variables: any) => {
            await utils.user.me.cancel();
            const previousMe = utils.user.me.getData();
            utils.user.me.setData(undefined, (current: any) => ({
                ...current,
                ...variables,
                preferences: {
                    ...(current?.preferences || {}),
                    ...(variables.preferences || {}),
                },
            }));
            return { previousMe };
        },
        onError: (error: { message?: string }, _variables: any, context: any) => {
            utils.user.me.setData(undefined, context?.previousMe);
            toast.error(error.message || 'Failed to update profile preferences');
        },
        onSettled: () => {
            utils.user.me.invalidate();
        },
    });

    const deleteDataMutation = trpc.user.deleteAllData.useMutation({
        onSuccess: () => {
            toast.success('All data deleted successfully');
            utils.invalidate();
        },
        onError: (error: { message?: string }) => {
            toast.error(error.message || 'Failed to delete data');
        }
    });

    const importDataMutation = trpc.user.importData.useMutation({
        onSuccess: (result: { summary?: { banks: number; accounts: number } }) => {
            const summary = result.summary;
            const importedCounts = summary
                ? `${summary.banks} banks, ${summary.accounts} accounts`
                : 'Data imported successfully';
            toast.success(summary ? `Merged ${importedCounts}` : importedCounts);
            utils.invalidate();
        },
        onError: (error: { message?: string }) => {
            toast.error(error.message || 'Failed to import data. Please ensure the file is valid.');
        }
    });

    const globalStatusLogic = settings?.paymentStatusLogic || 'monthly';
    const globalStatusPeriod = settings?.paymentStatusPeriod || '15';
    const creditStatusLogic = settings?.creditStatusLogic ?? 'global';
    const creditStatusPeriod = settings?.creditStatusPeriod ?? 'global';
    const mortgageStatusLogic = settings?.mortgageStatusLogic ?? 'global';
    const mortgageStatusPeriod = settings?.mortgageStatusPeriod ?? 'global';
    const subscriptionStatusLogic = settings?.subscriptionStatusLogic ?? 'global';
    const subscriptionStatusPeriod = settings?.subscriptionStatusPeriod ?? 'global';
    const notificationsEnabled = settings?.notificationsEnabled ?? true;
    const browserNotificationsEnabled = settings?.browserNotificationsEnabled ?? true;
    const emailNotificationsEnabled = settings?.emailNotificationsEnabled ?? false;
    const subscriptionReminderDays = String(settings?.subscriptionReminderDays ?? 3);
    const creditReminderDays = String(settings?.creditReminderDays ?? 3);
    const mortgageReminderDays = String(settings?.mortgageReminderDays ?? 3);
    const isSplitAccountSharingBlocked = (me as any)?.preferences?.splitBill?.allowAccountSharing === false;

    useEffect(() => {
        setEmailNotificationAddress(settings?.emailNotificationAddress || '');
    }, [settings?.emailNotificationAddress]);

    const handlePushToggle = async () => {
        if (isUpdating) {
            return;
        }

        if (!isSupported) {
            toast.error('Push notifications are not supported in this browser');
            return;
        }

        if (isLoading) {
            toast.message('Push setup is still loading. Please try again in a moment.');
            return;
        }

        if (!vapidPublicKey) {
            toast.error(vapidKeyError || 'Push notifications are not configured on the server');
            return;
        }

        try {
            if (isSubscribed) {
                await unsubscribe();
                toast.success('Push notifications disabled');
            } else {
                await subscribe();
            }
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Failed to update push notifications';
            toast.error(message);
        }
    };

    const exportData = async () => {
        setIsExporting(true);
        try {
            const data = await utils.user.exportAllData.fetch();
            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `woolet-export-${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            toast.success('Data exported successfully');
        } catch (error: unknown) {
            toast.error('Failed to export data');
        } finally {
            setIsExporting(false);
        }
    };

    const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsImporting(true);
        try {
            const text = await file.text();
            const data = JSON.parse(text);
            await importDataMutation.mutateAsync(data);
        } catch {
            // Error handled by mutation onError
        } finally {
            setIsImporting(false);
            e.target.value = '';
        }
    };

    const periodOptions = ['3', '7', '10', '14', '15', '21', '30'];
    const reminderOptions = ['0', '1', '2', '3', '5', '7', '10', '14'];
    const typeOverrides = [
        { label: 'Credits', logic: creditStatusLogic, period: creditStatusPeriod, logicKey: 'creditStatusLogic', periodKey: 'creditStatusPeriod' },
        { label: 'Mortgages', logic: mortgageStatusLogic, period: mortgageStatusPeriod, logicKey: 'mortgageStatusLogic', periodKey: 'mortgageStatusPeriod' },
        { label: 'Subscriptions', logic: subscriptionStatusLogic, period: subscriptionStatusPeriod, logicKey: 'subscriptionStatusLogic', periodKey: 'subscriptionStatusPeriod' },
    ] as const;
    const reminderRows = [
        { label: 'Subscriptions', value: subscriptionReminderDays, key: 'subscriptionReminderDays' },
        { label: 'Credits', value: creditReminderDays, key: 'creditReminderDays' },
        { label: 'Mortgages', value: mortgageReminderDays, key: 'mortgageReminderDays' },
    ] as const;
    const themes = [
        { value: 'light', label: 'Light', icon: Sun },
        { value: 'dark', label: 'Dark', icon: Moon },
        { value: 'system', label: 'System', icon: Monitor },
        { value: 'super-dark', label: 'Super Dark', icon: MoonStar },
    ] as const;
    const pushReady = isSubscribed || hasBrowserPermission;
    const compactTrigger = 'h-9 w-full sm:w-[190px] text-sm';

    return (
        <div className="mx-auto max-w-3xl space-y-6 overflow-x-hidden pb-10">
            <PageHeader title="Settings" subtitle="Profile, preferences and your data" variant="one">
                {null}
            </PageHeader>

            <PushNotificationSettings open={pushSettingsOpen} onOpenChange={setPushSettingsOpen} />

            {/* Profile */}
            <GlassCard auraColor="#8B5CF6" className="p-5">
                <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center">
                    <div className="flex min-w-0 flex-1 items-center gap-4">
                        <Avatar className="size-14 rounded-2xl ring-1 ring-white/15">
                            <AvatarImage src={user?.imageUrl} alt={user?.fullName || ''} />
                            <AvatarFallback className="rounded-2xl bg-primary/20 text-lg font-bold text-violet-200">
                                {user?.firstName?.charAt(0) || 'U'}
                            </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                            <p className="truncate text-lg font-bold">{user?.fullName || 'Your profile'}</p>
                            <p className="truncate text-sm text-primary dark:text-violet-300">{me?.username ? `@${me.username}` : 'No username yet'}</p>
                            <p className="truncate text-xs text-muted-foreground">
                                {user?.primaryEmailAddress?.emailAddress || 'No email available'}
                            </p>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" size="sm" className="flex-1 sm:flex-none" onClick={() => setIsUsernameDialogOpen(true)}>
                            <AtSign className="size-4" />
                            {me?.username ? 'Change username' : 'Set username'}
                        </Button>
                        <SignOutButton>
                            <Button variant="ghost" size="sm" className="flex-1 text-muted-foreground hover:text-foreground sm:flex-none">
                                <LogOut className="size-4" />
                                Sign out
                            </Button>
                        </SignOutButton>
                    </div>
                </div>
            </GlassCard>

            {/* Appearance */}
            <SettingsGroup title="Appearance">
                <div className="p-4">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {themes.map((option) => {
                            const active = theme === option.value;
                            return (
                                <button
                                    key={option.value}
                                    type="button"
                                    onClick={() => setTheme(option.value)}
                                    className={cn(
                                        'flex flex-col items-center gap-2 rounded-2xl border px-2 py-4 text-xs font-semibold transition-all',
                                        active
                                            ? 'border-primary/60 bg-primary/15 text-foreground'
                                            : 'border-border bg-muted/30 text-muted-foreground hover:bg-accent dark:border-white/10 dark:bg-white/[0.03] dark:hover:bg-white/[0.06]'
                                    )}
                                >
                                    <option.icon className={cn('size-5', active && 'text-primary dark:text-violet-300')} />
                                    {option.label}
                                </button>
                            );
                        })}
                    </div>
                </div>
            </SettingsGroup>

            {/* General */}
            <SettingsGroup title="General">
                <SettingsRow icon={DollarSign} color="#34D399" title="Default currency" description="Exchange rates are shown relative to this currency">
                    <div className="w-full sm:w-[220px]">
                        <CurrencySelector
                            value={settings?.defaultCurrency || 'USD'}
                            onValueChange={(val: string) => updateSettings.mutate({ defaultCurrency: val })}
                        />
                    </div>
                </SettingsRow>
                <SettingsRow icon={Calendar} color="#60A5FA" title="Week starts on" description="First day of the week in charts and reports">
                    <Select defaultValue="monday">
                        <SelectTrigger className={compactTrigger}>
                            <SelectValue placeholder="Select day" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="monday">Monday</SelectItem>
                            <SelectItem value="sunday">Sunday</SelectItem>
                        </SelectContent>
                    </Select>
                </SettingsRow>
                <SettingsRow icon={ShieldCheck} color="#818CF8" title="Hide my accounts from others" description="Others can't pick your receiving account in split payments" inline>
                    <Switch
                        checked={isSplitAccountSharingBlocked}
                        onCheckedChange={(checked) => {
                            const currentPrefs = ((me as any)?.preferences || {});
                            updateUserProfile.mutate({
                                preferences: {
                                    ...currentPrefs,
                                    splitBill: {
                                        ...(currentPrefs.splitBill || {}),
                                        allowAccountSharing: checked !== true,
                                    },
                                },
                            });
                        }}
                    />
                </SettingsRow>
                <SettingsRow icon={FlaskConical} color="#FB923C" title="Test mode" description="Lower limits for testing features with minimal data" inline>
                    <Switch />
                </SettingsRow>
            </SettingsGroup>

            {/* Payment status */}
            <SettingsGroup title="Payment status">
                <SettingsRow icon={ListChecks} color="#38BDF8" title="Paid / unpaid rule" description="How the app decides a recurring payment is paid">
                    <Select
                        value={globalStatusLogic}
                        onValueChange={(val: 'monthly' | 'period') => updateSettings.mutate({ paymentStatusLogic: val })}
                    >
                        <SelectTrigger className={compactTrigger}>
                            <SelectValue placeholder="Select logic" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="monthly">Each Month (Reset 1st)</SelectItem>
                            <SelectItem value="period">Time Period (Threshold)</SelectItem>
                        </SelectContent>
                    </Select>
                </SettingsRow>
                {globalStatusLogic === 'period' && (
                    <SettingsRow icon={Clock} color="#FBBF24" title="Due warning threshold" description='Show "Unpaid" when the due date is this close'>
                        <Select
                            value={globalStatusPeriod}
                            onValueChange={(val: string) => updateSettings.mutate({ paymentStatusPeriod: val })}
                        >
                            <SelectTrigger className={compactTrigger}>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {periodOptions.map((days) => (
                                    <SelectItem key={days} value={days}>{days} Days</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </SettingsRow>
                )}
                <details className="group">
                    <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
                        Per-type overrides
                        <ChevronDown className="size-4 transition-transform group-open:rotate-180" />
                    </summary>
                    <div className="space-y-3 px-4 pb-4">
                        {typeOverrides.map((row) => (
                            <div key={row.label} className="flex flex-col gap-2 rounded-2xl border border-white/[0.06] bg-white/[0.03] p-3 sm:flex-row sm:items-center sm:justify-between">
                                <p className="text-sm font-medium">{row.label}</p>
                                <div className="flex flex-col gap-2 sm:flex-row">
                                    <Select
                                        value={row.logic}
                                        onValueChange={(val: 'global' | 'monthly' | 'period') => updateSettings.mutate({ [row.logicKey]: val === 'global' ? null : val } as any)}
                                    >
                                        <SelectTrigger className="h-9 w-full text-sm sm:w-[190px]">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="global">Use Global</SelectItem>
                                            <SelectItem value="monthly">Each Month (Reset 1st)</SelectItem>
                                            <SelectItem value="period">Time Period (Threshold)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <Select
                                        value={row.logic === 'period' ? row.period : 'global'}
                                        onValueChange={(val: string) => updateSettings.mutate({ [row.periodKey]: val === 'global' ? null : val } as any)}
                                        disabled={row.logic !== 'period'}
                                    >
                                        <SelectTrigger className="h-9 w-full text-sm sm:w-[120px]">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="global">Use Global</SelectItem>
                                            {periodOptions.map((days) => (
                                                <SelectItem key={days} value={days}>{days} Days</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        ))}
                    </div>
                </details>
            </SettingsGroup>

            {/* Notifications */}
            <SettingsGroup title="Notifications">
                <SettingsRow icon={Bell} color="#F472B6" title="Notifications" description="Master switch for all reminders and alerts" inline>
                    <Switch
                        checked={notificationsEnabled}
                        onCheckedChange={(checked) => updateSettings.mutate({ notificationsEnabled: checked })}
                    />
                </SettingsRow>
                <SettingsRow icon={Monitor} color="#A78BFA" title="Browser push channel" description="Send reminders to browser notifications" inline>
                    <Switch
                        checked={browserNotificationsEnabled}
                        onCheckedChange={(checked) => updateSettings.mutate({ browserNotificationsEnabled: checked })}
                        disabled={!notificationsEnabled}
                    />
                </SettingsRow>
                <SettingsRow
                    icon={pushReady ? BellRing : Bell}
                    color={pushReady ? '#4ADE80' : '#A1A1AA'}
                    title={isSubscribed ? 'This browser is connected' : hasBrowserPermission ? 'Setup required' : 'Connect this browser'}
                    description={isSubscribed
                        ? 'You will receive push notifications'
                        : needsInAppSetup
                            ? 'Browser permission is on, but push setup is not complete'
                            : !isSupported
                                ? 'Push notifications are not supported in your browser'
                                : 'Get reminders outside the app'}
                    inline
                >
                    <Button
                        size="sm"
                        variant={isSubscribed ? 'outline' : 'default'}
                        onClick={handlePushToggle}
                        disabled={isUpdating}
                    >
                        {isUpdating ? 'Working...' : isSubscribed ? 'Disable' : needsInAppSetup ? 'Finish setup' : 'Enable'}
                    </Button>
                </SettingsRow>
                {(vapidKeyError || pushError?.message) && (
                    <p className="px-4 py-3 text-sm text-red-400">{vapidKeyError || pushError?.message}</p>
                )}
                <div className="px-4 py-4">
                    <p className="text-sm font-medium">Remind me before due date</p>
                    <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-3">
                        {reminderRows.map((row) => (
                            <div key={row.key} className="space-y-1.5">
                                <Label className="text-xs text-muted-foreground">{row.label}</Label>
                                <Select
                                    value={row.value}
                                    onValueChange={(value) => updateSettings.mutate({ [row.key]: Number(value) } as any)}
                                    disabled={!notificationsEnabled}
                                >
                                    <SelectTrigger className="h-9 text-sm">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {reminderOptions.map((days) => (
                                            <SelectItem key={days} value={days}>
                                                {days === '0' ? '0 (Due day only)' : `${days} day${days === '1' ? '' : 's'}`}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        ))}
                    </div>
                </div>
            </SettingsGroup>

            {/* Data */}
            <SettingsGroup title="Your data">
                <SettingsRow icon={Download} color="#22D3EE" title="Export" description="Download a JSON backup of all your financial data" inline>
                    <Button size="sm" variant="outline" onClick={exportData} disabled={isExporting}>
                        {isExporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileJson className="h-4 w-4" />}
                        Export
                    </Button>
                </SettingsRow>
                <SettingsRow icon={Upload} color="#FBBF24" title="Import" description="Restore from a backup — replaces all current data" inline>
                    <input
                        id="import-file"
                        type="file"
                        accept=".json"
                        onChange={handleImport}
                        disabled={isImporting}
                        className="hidden"
                    />
                    <Button
                        size="sm"
                        variant="outline"
                        disabled={isImporting}
                        onClick={() => document.getElementById('import-file')?.click()}
                    >
                        {isImporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                        Choose file
                    </Button>
                </SettingsRow>
                <SettingsRow icon={Trash2} color="#F87171" title="Delete all data" description="Permanently removes accounts, transactions and categories" inline>
                    <AlertDialog open={isDeleting} onOpenChange={setIsDeleting}>
                        <AlertDialogTrigger asChild>
                            <Button size="sm" variant="ghost" className="text-red-400 hover:bg-red-500/10 hover:text-red-300">
                                Delete
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle className="flex items-center gap-2 text-xl font-bold">
                                    <AlertTriangle className="size-5 text-red-400" />
                                    Are you absolutely sure?
                                </AlertDialogTitle>
                                <AlertDialogDescription>
                                    This action cannot be undone. This will permanently delete your
                                    entire financial history including accounts, transactions, and categories.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter className="gap-2">
                                <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                    onClick={() => deleteDataMutation.mutate()}
                                    className="rounded-xl bg-red-500 text-white hover:bg-red-600"
                                >
                                    Yes, delete everything
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                </SettingsRow>
            </SettingsGroup>

            <UsernameSetupDialog
                open={isUsernameDialogOpen}
                onOpenChange={setIsUsernameDialogOpen}
                initialUsername={me?.username ?? ''}
            />
        </div>
    );
}

function SettingsGroup({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <section className="space-y-2">
            <p className="px-1 text-[11px] font-bold uppercase tracking-[0.12em] text-muted-foreground">{title}</p>
            <GlassCard className="divide-y divide-white/[0.06]">{children}</GlassCard>
        </section>
    );
}

function SettingsRow({
    icon: Icon,
    color,
    title,
    description,
    inline,
    children,
}: {
    icon: React.ElementType;
    color: string;
    title: string;
    description?: string;
    // Inline rows keep the control on the right even on mobile (switches, small buttons)
    inline?: boolean;
    children: React.ReactNode;
}) {
    return (
        <div className={cn('flex gap-3 px-4 py-3.5', inline ? 'items-center' : 'flex-col sm:flex-row sm:items-center')}>
            <div className="flex min-w-0 flex-1 items-center gap-3">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-xl" style={{ backgroundColor: tint(color, 0.15), color }}>
                    <Icon className="size-4" />
                </span>
                <div className="min-w-0">
                    <p className="text-sm font-medium">{title}</p>
                    {description && <p className="text-xs text-muted-foreground">{description}</p>}
                </div>
            </div>
            <div className={cn('shrink-0', !inline && 'w-full sm:w-auto')}>{children}</div>
        </div>
    );
}
