import type React from 'react';
import { Segmented } from '@/components/ui/glass';
import { useFinanceView } from './useFinanceView';

export function ScopeSwitch() {
    const { view, canUseFamily, setView } = useFinanceView();
    if (!canUseFamily) return null;
    return (
        <div
            role="group"
            aria-label="Show family or personal finances"
            className="w-full sm:w-auto"
        >
            <Segmented
                value={view}
                onChange={setView}
                className="w-full sm:w-auto [&>button]:min-h-10"
                options={[
                    { value: 'family', label: 'Family' },
                    { value: 'personal', label: 'Personal' },
                ]}
            />
        </div>
    );
}

/** The switch on its own row, placed directly under a page's PageHeader. Renders nothing without family access. */
export function ScopeSwitchRow({ children }: { children?: React.ReactNode }) {
    const { canUseFamily } = useFinanceView();
    if (!canUseFamily) return null;
    return (
        <div className="flex flex-wrap items-center gap-2">
            <ScopeSwitch />
            {children}
        </div>
    );
}
