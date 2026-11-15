import { Link, useLocation, useNavigate } from '@tanstack/react-router';
import { Loader2 } from 'lucide-react';
import { demoPeople, familyFocusHiddenPaths, useDemoScope, useDemoSession } from '@/lib/demo';
import { headerPillClass } from '@/lib/header-pill';
import { cn } from '@/lib/utils';
import { Button } from './ui/button';

const SHARED_NOTE = 'Changes and AI questions are shared with other visitors.';

type Placement = 'header' | 'inline';

/**
 * Demo controls. `header` renders a compact pill in the floating top header (wider than 470px);
 * `inline` renders the full block above the page on phones, where the header is hidden, and only
 * the error line on wider screens.
 */
export function DemoBar({ placement }: { placement: Placement }) {
    const demo = useDemoSession();
    const scope = useDemoScope();
    const location = useLocation();
    const navigate = useNavigate();
    if (!demo.isDemo) return null;

    const busy = demo.pending !== null || demo.exiting;
    const changeScope = (familyOnly: boolean) => {
        scope.change(familyOnly);
        if (familyOnly && familyFocusHiddenPaths.has(location.pathname)) void navigate({ to: '/family' });
    };
    const people = (compact: boolean) => (
        <div role="group" aria-label="View demo as" className={cn('flex gap-1', compact ? 'shrink-0' : 'min-w-0 flex-1 rounded-full bg-muted p-1 dark:bg-white/[0.06]')}>
            {demoPeople.map(person => (
                <button
                    key={person.role}
                    type="button"
                    aria-pressed={demo.role === person.role}
                    disabled={busy}
                    onClick={() => { if (demo.role !== person.role) void demo.start(person.role); }}
                    className={cn(
                        'focus-visible:ring-2 focus-visible:ring-ring',
                        compact
                            ? 'h-7 rounded-full px-3 text-xs font-semibold'
                            : 'h-9 min-w-0 flex-1 rounded-full px-2 text-sm font-semibold',
                        demo.role === person.role
                            ? 'bg-foreground text-background'
                            : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
                    )}
                >
                    {demo.pending === person.role ? (
                        <>
                            <Loader2 className="inline size-4 animate-spin motion-reduce:animate-none" aria-hidden="true" />
                            <span className="sr-only">Switching to {person.label}</span>
                        </>
                    ) : person.label}
                </button>
            ))}
        </div>
    );
    const scopeSelect = (compact: boolean) => (
        <label className={cn('flex shrink-0 items-center gap-2 text-muted-foreground', compact && 'hidden lg:flex')}>
            <span className="sr-only">Demo sections</span>
            <select
                disabled={busy}
                value={scope.familyOnly ? 'family' : 'all'}
                onChange={event => changeScope(event.target.value === 'family')}
                className={cn(
                    'max-w-full text-foreground focus-visible:ring-2 focus-visible:ring-ring',
                    compact
                        ? 'h-7 rounded-full border-0 bg-transparent px-2 text-xs font-semibold'
                        : 'h-11 rounded-full border border-border bg-transparent px-3 text-sm font-semibold',
                )}
            >
                <option value="all">All features</option>
                <option value="family">Family focus</option>
            </select>
        </label>
    );

    if (placement === 'header') {
        return (
            <section
                aria-label="Demo mode"
                aria-busy={busy}
                title={`Shared demo. ${SHARED_NOTE}`}
                className={cn(headerPillClass, 'min-w-0 pl-4 pr-1.5')}
            >
                <span className="hidden truncate text-xs font-semibold tracking-wide text-muted-foreground xl:inline">
                    Demo
                </span>
                <span className="sr-only">{SHARED_NOTE}</span>
                {people(true)}
                {scopeSelect(true)}
                {location.pathname !== '/family' && (
                    <Button variant="ghost" size="sm" className="hidden h-7 rounded-full px-3 text-xs lg:inline-flex" asChild>
                        <Link to="/family">Family</Link>
                    </Button>
                )}
                <Button
                    variant="ghost"
                    size="sm"
                    disabled={busy}
                    className="h-7 shrink-0 rounded-full px-3 text-xs"
                    onClick={() => void demo.exit()}
                >
                    {demo.exiting ? 'Exiting…' : 'Exit demo'}
                </Button>
            </section>
        );
    }

    return (
        <>
            {demo.error && (
                <p className="mb-4 hidden text-sm text-destructive min-[471px]:block" role="alert">{demo.error}</p>
            )}
            <section
                aria-label="Demo mode"
                aria-busy={busy}
                className={cn(
                    'mb-4 space-y-3 rounded-2xl border border-black/[0.06] bg-white/60 p-3 backdrop-blur-2xl dark:border-white/10 dark:bg-white/[0.035] min-[471px]:hidden',
                    location.pathname.startsWith('/settings') && 'mx-3 mt-3',
                )}
            >
                <div className="flex items-center gap-3 pl-1">
                    <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold">Demo</p>
                        <p className="text-xs text-muted-foreground">{SHARED_NOTE}</p>
                    </div>
                    <Button variant="ghost" size="sm" disabled={busy} className="h-10 shrink-0 rounded-full px-3" onClick={() => void demo.exit()}>
                        {demo.exiting ? 'Exiting…' : 'Exit demo'}
                    </Button>
                </div>
                <div className="flex items-center gap-2">
                    {people(false)}
                    {scopeSelect(false)}
                </div>
                {demo.error && <p className="text-sm text-destructive" role="alert">{demo.error}</p>}
            </section>
        </>
    );
}
