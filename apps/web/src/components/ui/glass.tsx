import React, { type ReactNode, type HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

export function tint(color: string | null | undefined, alpha: number): string {
    const match = color?.match(/^#?([0-9a-fA-F]{2})([0-9a-fA-F]{2})([0-9a-fA-F]{2})$/);
    if (!match) return `rgba(250, 250, 250, ${alpha})`;
    const [, red = '00', green = '00', blue = '00'] = match;
    return `rgba(${parseInt(red, 16)}, ${parseInt(green, 16)}, ${parseInt(blue, 16)}, ${alpha})`;
}

// Hero gradient with radial highlight, shade, and subtle angled sheen polygon
export function HeroBackdrop() {
    return (
        <svg
            className="absolute inset-0 pointer-events-none w-full h-full"
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
            aria-hidden="true"
        >
            <defs>
                <linearGradient id="webHeroBase" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#8B5CF6" />
                    <stop offset="52%" stopColor="#6D3FD5" />
                    <stop offset="100%" stopColor="#4C1D95" />
                </linearGradient>
                <radialGradient id="webHeroGlow" cx="85%" cy="0%" r="100%">
                    <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.32" />
                    <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
                </radialGradient>
                <radialGradient id="webHeroShade" cx="5%" cy="110%" r="110%">
                    <stop offset="0%" stopColor="#1E0A46" stopOpacity="0.55" />
                    <stop offset="100%" stopColor="#1E0A46" stopOpacity="0" />
                </radialGradient>
                <linearGradient id="webHeroSheen" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.14" />
                    <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
                </linearGradient>
            </defs>
            <rect x="0" y="0" width="100" height="100" fill="url(#webHeroBase)" />
            <rect x="0" y="0" width="100" height="100" fill="url(#webHeroGlow)" />
            <rect x="0" y="0" width="100" height="100" fill="url(#webHeroShade)" />
            <polygon points="-25,0 30,0 -12,100 -67,100" fill="url(#webHeroSheen)" />
        </svg>
    );
}

// Specular highlight strips along top and bottom
export function GlassEdge() {
    return (
        <>
            <svg
                className="absolute top-0 left-3 right-3 h-[1.5px] w-[calc(100%-24px)] pointer-events-none"
                viewBox="0 0 100 1"
                preserveAspectRatio="none"
                aria-hidden="true"
            >
                <defs>
                    <linearGradient id="webGlassEdgeTop" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0" />
                        <stop offset="25%" stopColor="#FFFFFF" stopOpacity="0.06" />
                        <stop offset="50%" stopColor="#FFFFFF" stopOpacity="0.32" />
                        <stop offset="75%" stopColor="#FFFFFF" stopOpacity="0.06" />
                        <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
                    </linearGradient>
                </defs>
                <rect x="0" y="0" width="100" height="1" fill="url(#webGlassEdgeTop)" />
            </svg>
            <svg
                className="absolute bottom-0 left-3 right-3 h-[1.5px] w-[calc(100%-24px)] pointer-events-none"
                viewBox="0 0 100 1"
                preserveAspectRatio="none"
                aria-hidden="true"
            >
                <defs>
                    <linearGradient id="webGlassEdgeBottom" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0" />
                        <stop offset="25%" stopColor="#FFFFFF" stopOpacity="0.03" />
                        <stop offset="50%" stopColor="#FFFFFF" stopOpacity="0.18" />
                        <stop offset="75%" stopColor="#FFFFFF" stopOpacity="0.03" />
                        <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
                    </linearGradient>
                </defs>
                <rect x="0" y="0" width="100" height="1" fill="url(#webGlassEdgeBottom)" />
            </svg>
        </>
    );
}

// Soft color halo behind a metric
export function MetricAura({
    color,
    cx = 85,
    cy = 8,
    opacity = 0.16,
}: {
    color: string;
    cx?: number;
    cy?: number;
    opacity?: number;
}) {
    const id = React.useId().replace(/:/g, '');
    return (
        <svg
            className="absolute inset-0 pointer-events-none w-full h-full"
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
            aria-hidden="true"
        >
            <defs>
                <radialGradient id={`metricAura-${id}`} cx={`${cx}%`} cy={`${cy}%`} r="80%">
                    <stop offset="0%" stopColor={color} stopOpacity={opacity} />
                    <stop offset="100%" stopColor={color} stopOpacity="0" />
                </radialGradient>
            </defs>
            <rect x="0" y="0" width="100" height="100" fill={`url(#metricAura-${id})`} />
        </svg>
    );
}

// Violet ambient light radiating from the top of the viewport
export function AmbientGlow({ color = '#8B5CF6' }: { color?: string }) {
    return (
        <div
            className="pointer-events-none absolute top-0 left-0 right-0 h-[440px] overflow-hidden -z-10"
            aria-hidden="true"
        >
            <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                <defs>
                    <radialGradient id="webAmbientGlow" cx="50%" cy="20%" r="90%">
                        <stop offset="0%" stopColor={color} stopOpacity="0.16" />
                        <stop offset="50%" stopColor={color} stopOpacity="0.05" />
                        <stop offset="100%" stopColor={color} stopOpacity="0" />
                    </radialGradient>
                </defs>
                <rect x="0" y="0" width="100" height="100" fill="url(#webAmbientGlow)" />
            </svg>
        </div>
    );
}

interface GlassProps extends HTMLAttributes<HTMLDivElement> {
    children?: ReactNode;
    auraColor?: string;
    auraPosition?: { cx?: number; cy?: number };
    className?: string;
    showEdge?: boolean;
}

export function GlassCard({
    children,
    auraColor,
    auraPosition,
    className,
    showEdge = true,
    ...props
}: GlassProps) {
    return (
        <div
            className={cn(
                'relative overflow-hidden rounded-[22px]',
                'border border-border dark:border-white/10',
                'bg-card/95 dark:bg-white/[0.045] backdrop-blur-xl',
                'shadow-[0_4px_18px_rgba(30,20,60,0.06)] dark:shadow-[0_12px_28px_rgba(0,0,0,0.34)]',
                'transition-all duration-200',
                className
            )}
            {...props}
        >
            {auraColor && (
                <MetricAura
                    color={auraColor}
                    cx={auraPosition?.cx}
                    cy={auraPosition?.cy}
                />
            )}
            {children}
            {showEdge && <GlassEdge />}
        </div>
    );
}

export function GlassPanel({ className, ...props }: GlassProps) {
    return (
        <GlassCard
            className={cn(
                'rounded-[26px] bg-card/95 border-border dark:bg-white/[0.06] dark:border-white/15',
                className
            )}
            {...props}
        />
    );
}

export function GlassTile({ className, ...props }: GlassProps) {
    return (
        <GlassCard
            className={cn(
                'rounded-2xl border-border bg-card/95 shadow-sm hover:bg-accent hover:border-primary/20 dark:border-white/15 dark:bg-white/[0.04] dark:shadow-[0_10px_22px_rgba(0,0,0,0.28)] dark:hover:bg-white/[0.07] dark:hover:border-white/25 active:scale-[0.99] transition-all',
                className
            )}
            {...props}
        />
    );
}

// Segmented control matching the mobile pill switcher
export function Segmented<T extends string>({
    value,
    onChange,
    options,
    className,
}: {
    value: T;
    onChange: (value: T) => void;
    options: { value: T; label: ReactNode; count?: number }[];
    className?: string;
}) {
    return (
        <div
            role="tablist"
            className={cn(
                'inline-flex w-full sm:w-auto items-center gap-1 rounded-2xl border border-border bg-muted/60 dark:border-white/10 dark:bg-white/[0.04] p-1',
                className
            )}
        >
            {options.map((option) => {
                const active = option.value === value;
                return (
                    <button
                        key={option.value}
                        type="button"
                        role="tab"
                        aria-selected={active}
                        onClick={() => onChange(option.value)}
                        className={cn(
                            'flex flex-1 sm:flex-none items-center justify-center gap-1.5 rounded-xl px-3.5 py-1.5 text-xs sm:text-sm font-semibold transition-all',
                            active
                                ? 'bg-background text-foreground shadow-sm dark:bg-white/[0.12] dark:shadow-[0_4px_12px_rgba(0,0,0,0.25)]'
                                : 'text-muted-foreground hover:text-foreground'
                        )}
                    >
                        {option.label}
                        {option.count !== undefined && option.count > 0 && (
                            <span
                                className={cn(
                                    'rounded-full px-1.5 text-[10px] font-bold tabular-nums',
                                    active ? 'bg-primary/25 text-primary dark:text-violet-200' : 'bg-white/[0.08]'
                                )}
                            >
                                {option.count}
                            </span>
                        )}
                    </button>
                );
            })}
        </div>
    );
}

// Compact KPI tile: label, value, optional hint, tinted by an accent color
export function StatTile({
    label,
    value,
    hint,
    icon,
    color = '#8B5CF6',
    className,
}: {
    label: ReactNode;
    value: ReactNode;
    hint?: ReactNode;
    icon?: ReactNode;
    color?: string;
    className?: string;
}) {
    return (
        <GlassCard auraColor={color} auraPosition={{ cx: 100, cy: 0 }} className={cn('p-4 sm:p-5', className)}>
            <div className="relative flex items-start justify-between gap-3">
                <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-muted-foreground">{label}</p>
                {icon && (
                    <span
                        className="flex size-8 shrink-0 items-center justify-center rounded-xl"
                        style={{ backgroundColor: tint(color, 0.16), color }}
                    >
                        {icon}
                    </span>
                )}
            </div>
            <div className="relative mt-2 text-xl sm:text-2xl font-bold tracking-tight tabular-nums">{value}</div>
            {hint && <div className="relative mt-1 text-xs text-muted-foreground">{hint}</div>}
        </GlassCard>
    );
}
