import { Link, useLocation, useNavigate } from '@tanstack/react-router';
import { Loader2 } from 'lucide-react';
import { demoPeople, familyFocusHiddenPaths, useDemoScope, useDemoSession } from '@/lib/demo';
import { Button } from './ui/button';

export function DemoBar() {
    const demo = useDemoSession();
    const scope = useDemoScope();
    const location = useLocation();
    const navigate = useNavigate();
    if (!demo.isDemo) return null;
    return <section aria-label="Demo mode" aria-busy={demo.pending !== null || demo.exiting} className={`mb-4 flex flex-wrap items-center gap-x-3 gap-y-2 rounded-xl border border-border bg-card px-3 py-2 text-sm ${location.pathname.startsWith('/settings') ? 'mx-3 mt-3' : ''}`}>
        <div><p className="text-muted-foreground">Shared sample family · Martinez</p><p className="text-xs text-muted-foreground">Changes and AI questions are shared with other visitors.</p></div>
        <Button variant="ghost" size="sm" disabled={demo.exiting || demo.pending !== null} className="ml-auto min-h-11 lg:order-last" onClick={() => void demo.exit()}>{demo.exiting ? 'Exiting…' : 'Exit demo'}</Button>
        <div role="group" aria-label="View demo as" className="flex w-full gap-1 lg:w-auto">
            {demoPeople.map(person => <button key={person.role} type="button" aria-pressed={demo.role === person.role} disabled={demo.pending !== null || demo.exiting} onClick={() => { if (demo.role !== person.role) void demo.start(person.role); }} className={`min-h-11 flex-1 rounded-lg px-3 py-2 focus-visible:ring-2 focus-visible:ring-ring lg:flex-none ${demo.role === person.role ? 'bg-foreground text-background' : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'}`}>
                {demo.pending === person.role ? <><Loader2 className="inline size-4 animate-spin motion-reduce:animate-none" aria-hidden="true" /><span className="sr-only">Switching to {person.name}</span></> : person.name}
            </button>)}
        </div>
        <label className="flex min-h-11 items-center gap-2 text-muted-foreground">
            <span className="sr-only">Demo sections</span>
            <select disabled={demo.pending !== null || demo.exiting} value={scope.familyOnly ? 'family' : 'all'} onChange={event => { const familyOnly = event.target.value === 'family'; scope.change(familyOnly); if (familyOnly && familyFocusHiddenPaths.has(location.pathname)) void navigate({ to: '/family' }); }} className="min-h-11 max-w-full rounded-lg border border-border bg-card px-2 text-foreground focus-visible:ring-2 focus-visible:ring-ring">
                <option value="all">All features</option><option value="family">Family focus</option>
            </select>
        </label>
        {location.pathname !== '/family' && <Button variant="ghost" size="sm" className="min-h-11" asChild><Link to="/family">Family</Link></Button>}
        {demo.error && <p className="w-full text-destructive" role="alert">{demo.error}</p>}
    </section>;
}
