import { HelpCircle } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

/** Click/tap help: hover-only tooltips are not usable on touch screens. */
export function UntrackedDebtHelp() {
    return (
        <Popover>
            <PopoverTrigger asChild>
                <button
                    type="button"
                    aria-label="About untracked debts"
                    className="inline-flex size-8 shrink-0 items-center justify-center rounded-full text-muted-foreground hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                >
                    <HelpCircle className="h-4 w-4" />
                </button>
            </PopoverTrigger>
            <PopoverContent align="end" side="bottom" className="w-72 text-sm">
                <p>Enable if this debt was created before you started tracking accounts. No transactions will be created and bank balances won't be affected.</p>
            </PopoverContent>
        </Popover>
    );
}
