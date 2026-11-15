import { useState, useSyncExternalStore } from 'react';
import { useAuth, useClerk, useSignIn } from '@clerk/clerk-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { trpc } from './trpc';

export type DemoRole = 'owner' | 'partner' | 'child';
export const demoPeople: { role: DemoRole; name: string; label: string }[] = [
    { role: 'owner', name: 'Alex', label: 'Dad' },
    { role: 'partner', name: 'Jordan', label: 'Mom' },
    { role: 'child', name: 'Maya', label: 'Child' },
];
export const familyFocusHiddenPaths = new Set(['/investing', '/financial/credits', '/financial/mortgages', '/financial/deposits', '/tax', '/settings']);

export function parseDemoRole(value: unknown): DemoRole {
    return value === 'partner' || value === 'child' ? value : 'owner';
}

export function useDemoIdentity() {
    const { isSignedIn } = useAuth();
    const query = trpc.user.me.useQuery(undefined, { enabled: !!isSignedIn });
    return {
        isDemo: !!isSignedIn && query.data?.isDemo === true,
        role: parseDemoRole(query.data?.demoRole),
        isLoading: !!isSignedIn && query.isLoading,
    };
}

export function useDemoAvailability() {
    return useQuery({
        queryKey: ['demo-availability'],
        queryFn: async () => {
            const response = await fetch('/api/demo/status', { cache: 'no-store' });
            if (!response.ok) return false;
            const status = await response.json();
            return status.enabled === true;
        },
        staleTime: 60_000,
        retry: false,
    });
}

export function useDemoSession() {
    const clerk = useClerk();
    const { isLoaded, isSignedIn } = useAuth();
    const { signIn, setActive, isLoaded: signInLoaded } = useSignIn();
    const identity = useDemoIdentity();
    const cache = useQueryClient();
    const [pending, setPending] = useState<DemoRole | null>(null);
    const [exiting, setExiting] = useState(false);
    const [error, setError] = useState('');

    async function start(role: DemoRole) {
        if (!isLoaded || pending || exiting) return;
        setError('');
        setPending(role);
        try {
            if (isSignedIn) {
                if (!identity.isDemo) throw new Error('Sign out of your account before opening the demo.');
                // Start a fresh Clerk flow after signing out. Never reuse the previous actor's query cache.
                await clerk.signOut({ redirectUrl: `/demo?as=${role}` });
                return;
            }
            if (!signIn || !setActive) throw new Error('Sign-in is still loading. Try again in a moment.');
            const response = await fetch('/api/demo/start', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ role }),
                cache: 'no-store',
            });
            if (!response.ok) throw new Error(response.status === 429
                ? 'Too many demo sign-ins. Please try again in a few minutes.'
                : "The demo couldn't start. Try again in a moment.");
            const payload = await response.json();
            if (typeof payload.token !== 'string') throw new Error("The demo couldn't start. Try again in a moment.");
            const result = await signIn.create({ strategy: 'ticket', ticket: payload.token });
            if (result.status !== 'complete' || !result.createdSessionId) throw new Error("The demo couldn't start. Try again in a moment.");
            cache.clear();
            await setActive({ session: result.createdSessionId });
            window.location.replace('/family');
        } catch (failure) {
            setError(failure instanceof Error ? failure.message : "The demo couldn't start. Try again in a moment.");
            setPending(null);
        }
    }

    async function exit(redirectUrl = '/login') {
        if (exiting || pending) return;
        setExiting(true);
        try { await clerk.signOut({ redirectUrl }); }
        catch { setError("Couldn't sign out. Please try again."); setExiting(false); }
    }

    return { start, exit, pending, exiting, error, isPersonal: !!isSignedIn && !identity.isLoading && !identity.isDemo, ready: isLoaded && (isSignedIn || signInLoaded) && !identity.isLoading, ...identity };
}

const scopeEvent = 'woolet-demo-scope';
function readScope() {
    try { return localStorage.getItem('woolet.demoScope') === 'family'; } catch { return false; }
}
function subscribeScope(listener: () => void) {
    window.addEventListener(scopeEvent, listener);
    window.addEventListener('storage', listener);
    return () => { window.removeEventListener(scopeEvent, listener); window.removeEventListener('storage', listener); };
}
export function useDemoScope() {
    const { isDemo } = useDemoIdentity();
    const familyOnly = useSyncExternalStore(subscribeScope, readScope, () => false);
    function change(value: boolean) {
        try { localStorage.setItem('woolet.demoScope', value ? 'family' : 'all'); } catch { /* storage is optional */ }
        window.dispatchEvent(new Event(scopeEvent));
    }
    return { familyOnly: isDemo && familyOnly, change };
}
