import type { ReactNode } from 'react';
import { Info } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

// Small (i) button that reveals an explanation, so forms can stay short
export function InfoTip({ children, className }: { children: ReactNode; className?: string }) {
    return (
        <Popover>
            <PopoverTrigger asChild>
                <button
                    type="button"
                    aria-label="More info"
                    className={cn(
                        'inline-flex size-4 shrink-0 items-center justify-center rounded-full text-muted-foreground/70 transition-colors hover:text-violet-300 focus:outline-none focus-visible:text-violet-300',
                        className
                    )}
                >
                    <Info className="size-3.5" />
                </button>
            </PopoverTrigger>
            <PopoverContent side="top" align="start" className="w-64 bg-popover/90 p-3 text-xs leading-relaxed text-muted-foreground backdrop-blur-xl">
                {children}
            </PopoverContent>
        </Popover>
    );
}
