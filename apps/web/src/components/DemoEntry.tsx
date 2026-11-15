import type { ReactNode } from 'react';
import { Button } from './ui/button';
import { useDemoAvailability } from '@/lib/demo';

const demoRoles = [
    { role: 'owner', label: 'Dad' },
    { role: 'partner', label: 'Mom' },
    { role: 'child', label: 'Child' },
] as const;

export function DemoEntry({ children }: { children: ReactNode }) {
    const availability = useDemoAvailability();
    return <>
        {children}
        {availability.data === true && <div role="group" aria-label="Demo accounts" className="mt-6 border-t border-border pt-6">
            <p className="mb-3 text-center text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Demo</p>
            <div className="grid grid-cols-3 gap-2">
                {demoRoles.map(({ role, label }) => (
                    <Button key={role} variant="outline" className="h-12 rounded-xl" asChild>
                        <a href={`/demo?as=${role}`}>{label}</a>
                    </Button>
                ))}
            </div>
        </div>}
    </>;
}
