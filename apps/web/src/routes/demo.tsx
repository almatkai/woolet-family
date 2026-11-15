import { useEffect, useRef } from 'react';
import { Link } from '@tanstack/react-router';
import { Loader2 } from 'lucide-react';
import { AuthLayout } from '@/components/AuthLayout';
import { Button } from '@/components/ui/button';
import { demoPeople, parseDemoRole, useDemoAvailability, useDemoSession } from '@/lib/demo';

export function DemoPage() {
    const role = parseDemoRole(new URLSearchParams(window.location.search).get('as'));
    const person = demoPeople.find(person => person.role === role)!;
    const availability = useDemoAvailability();
    const demo = useDemoSession();
    const started = useRef(false);
    useEffect(() => {
        if (!demo.ready || demo.isPersonal || availability.data !== true || started.current) return;
        started.current = true;
        void demo.start(role);
    }, [demo.ready, demo.isPersonal, availability.data, role, demo.start]);
    const unavailable = availability.isError || availability.data === false;
    return <AuthLayout title={unavailable ? "Demo isn't available" : 'Explore Woolet'} subtitle={unavailable ? 'Sign in or create an account instead.' : `Opening the Martinez family as ${person.name}…`}>
        <div className="space-y-4" aria-live="polite">
            {demo.isPersonal ? <>
                <p className="text-sm text-muted-foreground">You're signed in to your own account. Open the demo in a separate session, or sign out to explore the sample family.</p>
                <Button variant="neutral" disabled={demo.exiting} onClick={() => void demo.exit(`/demo?as=${role}`)}>{demo.exiting ? 'Signing out…' : 'Sign out and open demo'}</Button>
                <Button variant="outline" asChild><Link to="/">Back to Woolet</Link></Button>
            </> : !unavailable && !demo.error && <p className="flex items-center gap-3 text-sm text-muted-foreground"><Loader2 aria-hidden="true" className="size-5 animate-spin motion-reduce:animate-none" />Preparing your demo account…</p>}
            {demo.error && <p role="alert" className="text-sm text-destructive">{demo.error}</p>}
            {demo.error && !demo.isPersonal && <Button variant="neutral" disabled={demo.pending !== null} onClick={() => void demo.start(role)}>Try again</Button>}
            {(unavailable || demo.error) && <Button variant="outline" asChild><Link to="/login">Go to sign in</Link></Button>}
        </div>
    </AuthLayout>;
}
