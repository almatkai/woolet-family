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
        <div role="group" aria-label="View demo as" className={cn('flex gap-1', compact ? 'shrink-0' : 'w-full lg:w-auto')}>
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
                            : 'min-h-11 flex-1 rounded-lg px-3 py-2 lg:flex-none',
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
        <label className={cn('flex items-center gap-2 text-muted-foreground', compact ? 'hidden lg:flex' : 'min-h-11')}>
            <span className="sr-only">Demo sections</span>
            <select
                disabled={busy}
                value={scope.familyOnly ? 'family' : 'all'}
                onChange={event => changeScope(event.target.value === 'family')}
                className={cn(
                    'max-w-full text-foreground focus-visible:ring-2 focus-visible:ring-ring',
                    compact
                        ? 'h-7 rounded-full border-0 bg-transparent px-2 text-xs font-semibold'
                        : 'min-h-11 rounded-lg border border-border bg-card px-2',
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
                title={`Shared sample family · Martinez. ${SHARED_NOTE}`}
                className={cn(headerPillClass, 'min-w-0 pl-4 pr-1.5')}
            >
                <span className="hidden truncate text-xs font-semibold tracking-wide text-muted-foreground xl:inline">
                    Shared demo · Martinez
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
                    'mb-4 flex flex-wrap items-center gap-x-3 gap-y-2 rounded-xl border border-border bg-card px-3 py-2 text-sm min-[471px]:hidden',
                    location.pathname.startsWith('/settings') && 'mx-3 mt-3',
                )}
            >
                <div>
                    <p className="text-muted-foreground">Shared sample family · Martinez</p>
                    <p className="text-xs text-muted-foreground">{SHARED_NOTE}</p>
                </div>
                <Button variant="ghost" size="sm" disabled={busy} className="ml-auto min-h-11" onClick={() => void demo.exit()}>
                    {demo.exiting ? 'Exiting…' : 'Exit demo'}
                </Button>
                {people(false)}
                {scopeSelect(false)}
                {location.pathname !== '/family' && (
                    <Button variant="ghost" size="sm" className="min-h-11" asChild>
                        <Link to="/family">Family</Link>
                    </Button>
                )}
                {demo.error && <p className="w-full text-destructive" role="alert">{demo.error}</p>}
            </section>
        </>
    );
}
