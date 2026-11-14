import React from 'react';
import { cn } from '@/lib/utils';

interface WidgetFooterProps {
    children: React.ReactNode;
    className?: string;
    /** When false, omits flex layout (for single-line content). Default: true */
    flex?: boolean;
    visibleItems?: number;
    totalItems?: number;
}

export function WidgetFooter({ children, className, flex = true, visibleItems, totalItems }: WidgetFooterProps) {
    const parts = React.Children.toArray(children);
    const limited = totalItems !== undefined && visibleItems !== undefined && totalItems > visibleItems;
    return (
        <div
            className={cn(
                'widget-footer shrink-0 px-3 py-2 border-t border-border/50 bg-muted/20',
                flex && 'flex items-center justify-between',
                className
            )}
            data-widget-footer
        >
            {limited ? <><span className="text-[10px] text-muted-foreground" title="Resize for more items or open the full view">{visibleItems ? `${visibleItems} of ${totalItems}` : `${totalItems} items`}</span>{parts.slice(1)}</> : children}
        </div>
    );
}
