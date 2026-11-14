import type { Compactor, Layout, LayoutItem } from 'react-grid-layout'
import { transformStrategy, verticalCompactor, type PositionStrategy } from 'react-grid-layout/core'

export const DASHBOARD_BREAKPOINTS = { lg: 1300, md: 900, sm: 600, xs: 0 } as const
export const DASHBOARD_COLUMNS = { lg: 6, md: 4, sm: 4, xs: 2 } as const

type DashboardBreakpoint = keyof typeof DASHBOARD_COLUMNS
// Heights are pixels so a tall list has the same capacity on every breakpoint.
const WIDGET_LIMITS: Record<string, { maxColumns: number; maxHeight: number }> = {
    totalBalance: { maxColumns: 6, maxHeight: 1800 },
    recentTransactions: { maxColumns: 6, maxHeight: 2400 },
    debts: { maxColumns: 4, maxHeight: 1600 },
    mortgages: { maxColumns: 4, maxHeight: 1600 },
    credits: { maxColumns: 4, maxHeight: 1600 },
    deposits: { maxColumns: 4, maxHeight: 1600 },
    subscriptions: { maxColumns: 4, maxHeight: 1600 },
    splitBills: { maxColumns: 4, maxHeight: 1600 },
    investmentPortfolio: { maxColumns: 6, maxHeight: 2000 },
    assetAllocation: { maxColumns: 6, maxHeight: 1800 },
    categoryChart: { maxColumns: 6, maxHeight: 1600 },
    spendingChart: { maxColumns: 6, maxHeight: 1000 },
    investmentPerformance: { maxColumns: 6, maxHeight: 1000 },
    monthlyIncome: { maxColumns: 6, maxHeight: 800 },
    monthlyExpenses: { maxColumns: 6, maxHeight: 800 },
    currencyExchange: { maxColumns: 4, maxHeight: 1000 },
}

export function applyDashboardWidgetLimits<T extends LayoutItem>(item: T, breakpoint: DashboardBreakpoint): T {
    const profile = WIDGET_LIMITS[item.i] ?? { maxColumns: 6, maxHeight: 1600 }
    const rowHeight = breakpoint === 'xs' ? 36 : breakpoint === 'sm' ? 40 : 140
    const gap = breakpoint === 'xs' ? 8 : breakpoint === 'sm' ? 10 : 20
    const maxW = Math.min(profile.maxColumns, DASHBOARD_COLUMNS[breakpoint])
    const maxH = Math.floor((profile.maxHeight + gap) / (rowHeight + gap))
    const minW = Math.min(maxW, Math.max(1, item.minW ?? 1))
    const minH = Math.min(maxH, Math.max(breakpoint === 'sm' || breakpoint === 'xs' ? 3 : 1, item.minH ?? 1))
    return { ...item, minW, minH, maxW, maxH,
        w: Math.max(minW, Math.min(item.w, maxW)), h: Math.max(minH, Math.min(item.h, maxH)) }
}

/** Expand legacy two-column coordinates without changing their proportions. */
export function expandDashboardColumns<T extends LayoutItem>(layout: readonly T[]): T[] {
    return layout.map(item => ({ ...item, x: item.x * 2, w: Math.min(item.w * 2, 4), minW: 1 }))
}

/** Use the same snapped size for the visible card and the collision layout during resize. */
export function createDashboardPositionStrategy(columnWidth: number, rowHeight: number, margin: readonly [number, number], bounds = { maxColumns: 6, maxRows: Infinity }): PositionStrategy {
    const snapSize = (pixels: number, unit: number, gap: number, maximum: number) => {
        const count = Math.min(maximum, Math.max(1, Math.round((pixels + gap) / (unit + gap))))
        return Math.round(count * unit + (count - 1) * gap)
    }
    return {
        ...transformStrategy,
        calcStyle(position) {
            return transformStrategy.calcStyle({
                ...position,
                width: snapSize(position.width, columnWidth, margin[0], bounds.maxColumns),
                height: snapSize(position.height, rowHeight, margin[1], bounds.maxRows),
            })
        },
    }
}

/** Resolve collisions downward without compacting away intentional gaps. */
export const dashboardCompactor: Compactor = {
    type: 'vertical',
    allowOverlap: false,
    preventCollision: false,
    compact(layout, _cols) {
        const result = layout.map(item => ({ ...item }))
        const ordered = [...result].sort((a, b) => a.y - b.y || a.x - b.x)
        const placed: LayoutItem[] = []
        for (const item of ordered) {
            let collisions = placed.filter(other => overlaps(item, other))
            while (collisions.length > 0) {
                item.y = Math.max(...collisions.map(other => other.y + other.h))
                collisions = placed.filter(other => overlaps(item, other))
            }
            // RGL uses this transient flag during dragging; clear it after each pass.
            if ('moved' in item) item.moved = false
            placed.push(item)
        }
        return result
    },
}

function overlaps(a: LayoutItem, b: LayoutItem) {
    return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y
}

/** Settle a dropped/resized layout upward, keeping the user's columns and sizes. */
export function compactDashboardLayout(layout: Layout, cols: number): LayoutItem[] {
    const positions = new Map(verticalCompactor.compact(layout.map(item => ({ ...item })), cols).map(item => [item.i, item]))
    return layout.map(item => ({ ...item, x: positions.get(item.i)!.x, y: positions.get(item.i)!.y }))
}

/** Place a new/restored widget in the earliest free slot without moving existing widgets. */
export function placeDashboardWidget(item: LayoutItem, occupied: Layout, cols: number): LayoutItem {
    const candidate = { ...item, w: Math.min(item.w, cols), x: 0, y: 0 }
    const bottom = occupied.reduce((max, widget) => Math.max(max, widget.y + widget.h), 0)
    for (let y = 0; y <= bottom; y++) {
        for (let x = 0; x <= cols - candidate.w; x++) {
            candidate.x = x
            candidate.y = y
            if (!occupied.some(widget => overlaps(candidate, widget))) return candidate
        }
    }
    // The row below every occupied widget is always free.
    return { ...candidate, x: 0, y: bottom }
}

/**
 * Fill free cells left-to-right and top-to-bottom, respecting widget sizes.
 * A manually moved/resized breakpoint keeps its columns, with vertical gaps closed.
 * Saved input and constraints are never mutated.
 */
export function arrangeDashboardLayout(layout: Layout, cols: number, preserveColumns = false): LayoutItem[] {
    if (preserveColumns) return compactDashboardLayout(layout, cols)

    // Use the persisted widget order, not coordinates from the previous packing.
    // Otherwise filling an earlier hole changes the sort order on the next render.
    const occupied: LayoutItem[] = []
    for (const item of layout) occupied.push(placeDashboardWidget(item, occupied, cols))
    const positions = new Map(occupied.map(item => [item.i, item]))
    // Keep the child/keyboard order stable; only geometry changes.
    return layout.map(item => positions.get(item.i)!)
}
