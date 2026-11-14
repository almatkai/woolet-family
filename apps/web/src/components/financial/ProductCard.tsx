import type { ReactNode } from 'react';
import { MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { GlassCard, tint } from '@/components/ui/glass';
import { cn } from '@/lib/utils';

interface ProductCardProps {
    icon: ReactNode;
    color: string;
    title: string;
    subtitle?: ReactNode;
    badges?: ReactNode;
    amountLabel: string;
    amount: ReactNode;
    progress?: number;
    progressLabel?: string;
    stats: { label: string; value: ReactNode }[];
    footer?: ReactNode;
    action?: { label: string; icon?: ReactNode; onClick: () => void };
    onEdit?: () => void;
    onDelete?: () => void;
}

// Shared card for credits, mortgages and deposits so all financial products read the same
export function ProductCard({
    icon,
    color,
    title,
    subtitle,
    badges,
    amountLabel,
    amount,
    progress,
    progressLabel,
    stats,
    footer,
    action,
    onEdit,
    onDelete,
}: ProductCardProps) {
    return (
        <GlassCard auraColor={color} auraPosition={{ cx: 100, cy: 0 }} className="p-5">
            <div className="relative flex items-start gap-3">
                <span
                    className="flex size-10 shrink-0 items-center justify-center rounded-2xl"
                    style={{ backgroundColor: tint(color, 0.16), color }}
                >
                    {icon}
                </span>
                <div className="min-w-0 flex-1">
                    <p className="truncate text-base font-semibold">{title}</p>
                    {subtitle && <div className="mt-0.5 truncate text-xs text-muted-foreground">{subtitle}</div>}
                </div>
                <div className="flex shrink-0 items-center gap-1.5">
                    {badges}
                    {(onEdit || onDelete) && (
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
                                    <MoreHorizontal className="h-4 w-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                {onEdit && (
                                    <DropdownMenuItem onClick={onEdit}>
                                        <Pencil className="mr-2 h-4 w-4" />
                                        Edit
                                    </DropdownMenuItem>
                                )}
                                {onDelete && (
                                    <DropdownMenuItem onClick={onDelete} className="text-red-500 focus:text-red-500">
                                        <Trash2 className="mr-2 h-4 w-4" />
                                        Delete
                                    </DropdownMenuItem>
                                )}
                            </DropdownMenuContent>
                        </DropdownMenu>
                    )}
                </div>
            </div>

            <div className="relative mt-5">
                <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-muted-foreground">{amountLabel}</p>
                <div className="mt-1 text-2xl font-bold tracking-tight tabular-nums" style={{ color }}>
                    {amount}
                </div>
            </div>

            {progress !== undefined && (
                <div className="relative mt-4">
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/[0.08]">
                        <div
                            className="h-full rounded-full transition-all"
                            style={{ width: `${Math.min(100, Math.max(0, progress))}%`, backgroundColor: color }}
                        />
                    </div>
                    {progressLabel && <p className="mt-1.5 text-xs text-muted-foreground">{progressLabel}</p>}
                </div>
            )}

            <div className={cn('relative mt-4 grid gap-2', stats.length >= 3 ? 'grid-cols-3' : 'grid-cols-2')}>
                {stats.map((stat) => (
                    <div key={stat.label} className="rounded-xl border border-white/[0.06] bg-white/[0.03] px-3 py-2">
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{stat.label}</p>
                        <div className="mt-0.5 truncate text-sm font-semibold tabular-nums">{stat.value}</div>
                    </div>
                ))}
            </div>

            {(footer || action) && (
                <div className="relative mt-4 flex items-center justify-between gap-3">
                    <div className="min-w-0 truncate text-xs text-muted-foreground">{footer}</div>
                    {action && (
                        <Button size="sm" variant="outline" className="shrink-0 gap-1.5" onClick={action.onClick}>
                            {action.icon}
                            {action.label}
                        </Button>
                    )}
                </div>
            )}
        </GlassCard>
    );
}

export function ProductEmptyState({
    icon,
    title,
    description,
    action,
}: {
    icon: ReactNode;
    title: string;
    description: string;
    action?: ReactNode;
}) {
    return (
        <GlassCard className="flex flex-col items-center justify-center gap-2 border-dashed px-6 py-14 text-center">
            <span className="flex size-12 items-center justify-center rounded-2xl bg-white/[0.05] text-muted-foreground">{icon}</span>
            <p className="text-sm font-semibold">{title}</p>
            <p className="max-w-sm text-xs text-muted-foreground">{description}</p>
            {action && <div className="mt-2">{action}</div>}
        </GlassCard>
    );
}
