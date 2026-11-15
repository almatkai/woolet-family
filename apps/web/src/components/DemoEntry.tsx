import type { ReactNode } from 'react';
import { Button } from './ui/button';
import { useDemoAvailability } from '@/lib/demo';

export function DemoEntry({ children }: { children: ReactNode }) {
    const availability = useDemoAvailability();
    return <>
        {children}
        {availability.data === true && <div role="group" aria-label="Demo accounts" className="mt-6 border-t border-border pt-6">
            <p className="mb-3 text-center text-sm text-muted-foreground">Explore the Martinez family. No signup needed.</p>
            <Button variant="outline" className="h-12 w-full rounded-xl" asChild>
                <a href="/demo?as=owner">Try the demo as Alex Martinez</a>
            </Button>
            <div className="mt-2 flex flex-wrap items-center justify-center gap-x-2 text-sm text-muted-foreground">
                <span>Or try as</span>
                <a className="inline-flex min-h-11 items-center rounded px-1 underline-offset-4 hover:underline focus-visible:ring-2 focus-visible:ring-ring" href="/demo?as=partner">Jordan (partner)</a>
                <span aria-hidden="true">·</span>
                <a className="inline-flex min-h-11 items-center rounded px-1 underline-offset-4 hover:underline focus-visible:ring-2 focus-visible:ring-ring" href="/demo?as=child">Maya (child)</a>
            </div>
            <p className="text-center text-xs text-muted-foreground">Shared sample accounts · 50 AI questions each, shared by all visitors</p>
        </div>}
    </>;
}
