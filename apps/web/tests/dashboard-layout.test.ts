import { describe, expect, test } from 'bun:test'
import type { Layout, LayoutItem } from 'react-grid-layout'
import { arrangeDashboardLayout, compactDashboardLayout, createDashboardPositionStrategy, dashboardCompactor, placeDashboardWidget } from '../src/lib/dashboard-layout'
import { DASHBOARD_BREAKPOINTS, DASHBOARD_COLUMNS, applyDashboardWidgetLimits, expandDashboardColumns } from '../src/lib/dashboard-layout'
import { getBreakpointFromWidth } from 'react-grid-layout/core'

describe('medium dashboard grid', () => {
    test('the screenshot width supports quarter, half, three-quarter and full cards', () => {
        const width = 880
        const bp = getBreakpointFromWidth(DASHBOARD_BREAKPOINTS, width)
        const cols = DASHBOARD_COLUMNS[bp as keyof typeof DASHBOARD_COLUMNS]
        expect(cols).toBe(4)
        const gap = 10
        const unit = (width - 24 - gap * (cols - 1)) / cols
        const strategy = createDashboardPositionStrategy(unit, 40, [gap, gap])
        for (let span = 1; span <= cols; span++) {
            const pixels = Math.round(span * unit + (span - 1) * gap)
            expect(strategy.calcStyle({ left: 12, top: 12, width: pixels, height: 140 }).width).toBe(`${pixels}px`)
        }
        expect(strategy.calcStyle({ left: 12, top: 12, width: 640, height: 140 }).width).toBe('640px')
    })

    test('legacy medium layouts retain half/full proportions and selected columns', () => {
        const old = [{ i: 'half', x: 1, y: 0, w: 1, h: 3 }, { i: 'full', x: 0, y: 3, w: 2, h: 2 }]
        const migrated = expandDashboardColumns(old)
        expect(migrated).toEqual([{ ...old[0], x: 2, w: 2, minW: 1 }, { ...old[1], w: 4, minW: 1 }])
        expect(old[0].w).toBe(1)
        expect(compactDashboardLayout(migrated, 4).map(item => [item.x, item.w])).toEqual([[2, 2], [0, 4]])
    })
})

const screenshotLayout: Layout = [
    { i: 'totalBalance', x: 0, y: 0, w: 1, h: 2 },
    { i: 'categoryChart', x: 1, y: 0, w: 2, h: 3 },
    { i: 'mortgages', x: 0, y: 2, w: 1, h: 2 },
    { i: 'recentTransactions', x: 0, y: 4, w: 1, h: 4 },
    { i: 'spendingChart', x: 1, y: 3, w: 2, h: 3 },
    { i: 'investmentPortfolio', x: 1, y: 6, w: 1, h: 2 },
    { i: 'credits', x: 2, y: 6, w: 1, h: 3 },
]

function overlaps(a: LayoutItem, b: LayoutItem) {
    return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y
}

describe('dashboard visible resize bounds', () => {
    test('an intermediate pixel size cannot extend into a neighbor before the next grid row', () => {
        const strategy = createDashboardPositionStrategy(287, 140, [20, 20])
        const position = { left: 12, top: 12, width: 287, height: 210 }
        const style = strategy.calcStyle(position)
        // RGL still treats 210px as one row. The neighbor begins at 172px.
        expect(style.height).toBe('140px')
        expect(position.top + parseFloat(String(style.height))).toBeLessThan(172)
        expect(strategy.calcStyle({ ...position, height: 370 }).height).toBe('300px')
        expect(strategy.calcStyle({ ...position, width: 387 }).width).toBe('287px')
        expect(position.height).toBe(210)
    })

    test('honors explicit bounds without imposing the former four-row ceiling', () => {
        const strategy = createDashboardPositionStrategy(287, 140, [20, 20], { maxColumns: 4, maxRows: 4 })
        expect(strategy.calcStyle({ left: 12, top: 12, width: 2000, height: 2000 })).toMatchObject({ width: '1208px', height: '620px' })
        const flexible = createDashboardPositionStrategy(287, 140, [20, 20])
        expect(flexible.calcStyle({ left: 12, top: 12, width: 1822, height: 1580 })).toMatchObject({ width: '1822px', height: '1580px' })
    })
})

describe('content-specific widget limits', () => {
    const saved = { i: 'subscriptions', x: 0, y: 0, w: 2, h: 3, maxW: 4, maxH: 4 }
    test('replaces saved small limits and keeps the current size', () => {
        expect(applyDashboardWidgetLimits(saved, 'lg')).toMatchObject({ w: 2, h: 3, maxW: 4, maxH: 10 })
        expect(saved.maxH).toBe(4)
        expect(applyDashboardWidgetLimits({ ...saved, i: 'spendingChart' }, 'lg')).toMatchObject({ maxW: 6, maxH: 6 })
        expect(applyDashboardWidgetLimits({ ...saved, i: 'recentTransactions' }, 'lg')).toMatchObject({ maxW: 6, maxH: 15 })
        expect(applyDashboardWidgetLimits({ ...saved, i: 'investmentPortfolio' }, 'lg').maxH).toBe(12)
    })
    test('tall lists retain their pixel capacity on small screens while width stays inside the grid', () => {
        for (const bp of ['lg', 'md', 'sm', 'xs'] as const) {
            const item = applyDashboardWidgetLimits({ ...saved, w: 50, h: 100 }, bp)
            const row = bp === 'xs' ? 36 : bp === 'sm' ? 40 : 140
            const gap = bp === 'xs' ? 8 : bp === 'sm' ? 10 : 20
            const pixels = item.h * row + (item.h - 1) * gap
            expect(pixels).toBeLessThanOrEqual(1600)
            expect(pixels).toBeGreaterThan(1400)
            expect(item.w).toBeLessThanOrEqual(DASHBOARD_COLUMNS[bp])
            expect(item.h).toBe(item.maxH!)
        }
    })
})

describe('dashboard resize collision handling', () => {
    const layout: Layout = [
        { i: 'mortgages', x: 0, y: 3, w: 2, h: 1 },
        { i: 'credits', x: 0, y: 4, w: 2, h: 1 },
        { i: 'exchange', x: 0, y: 5, w: 2, h: 2 },
        { i: 'recentActivity', x: 2, y: 3, w: 2, h: 2 },
        { i: 'intentionalGap', x: 2, y: 9, w: 2, h: 1 },
    ]

    test('growing mortgages pushes credits and the rest of its column down', () => {
        const resized = layout.map(item => item.i === 'mortgages' ? { ...item, h: 2 } : item)
        const result = dashboardCompactor.compact(resized, 4)
        expect(result.find(item => item.i === 'mortgages')).toMatchObject({ x: 0, y: 3, h: 2 })
        expect(result.find(item => item.i === 'credits')).toMatchObject({ x: 0, y: 5 })
        expect(result.find(item => item.i === 'exchange')).toMatchObject({ x: 0, y: 6 })
        expect(result.find(item => item.i === 'recentActivity')).toEqual(layout[3])
        expect(result.find(item => item.i === 'intentionalGap')).toEqual(layout[4])
        for (let i = 0; i < result.length; i++) {
            for (let j = i + 1; j < result.length; j++) expect(overlaps(result[i], result[j])).toBe(false)
        }
        expect(resized.find(item => item.i === 'credits')?.y).toBe(4)
        expect(dashboardCompactor.compact(result, 4)).toEqual(result)
    })

    test('does not pull widgets up when shrinking or fill intentional gaps', () => {
        expect(dashboardCompactor.compact(layout, 4)).toEqual(layout)
    })

    test('widening a widget pushes its right-hand neighbor down', () => {
        const resized: Layout = [
            { i: 'growing', x: 0, y: 0, w: 3, h: 2 },
            { i: 'neighbor', x: 2, y: 0, w: 2, h: 1 },
            { i: 'below', x: 2, y: 2, w: 2, h: 2 },
        ]
        const result = dashboardCompactor.compact(resized, 4)
        expect(result[0]).toEqual(resized[0])
        expect(result[1]).toMatchObject({ x: 2, y: 2 })
        expect(result[2]).toMatchObject({ x: 2, y: 3 })
    })

    test('repairs saved manual overlaps regardless of persisted widget order', () => {
        const saved: Layout = [
            { i: 'credits', x: 0, y: 4, w: 2, h: 1 },
            { i: 'mortgages', x: 0, y: 3, w: 2, h: 2 },
            { i: 'intentionalGap', x: 2, y: 9, w: 2, h: 1 },
        ]
        const result = arrangeDashboardLayout(saved, 4, true)
        expect(result[0]).toMatchObject({ i: 'credits', x: 0, y: 2 })
        expect(result[1]).toEqual({ ...saved[1], y: 0 })
        expect(result[2]).toEqual({ ...saved[2], y: 0 })
    })
})

describe('dashboard automatic packing', () => {
    test('after dropping, closes vertical gaps while retaining columns and widget sizes', () => {
        const dropped: Layout = [
            { i: 'left', x: 0, y: 0, w: 2, h: 3 },
            { i: 'right', x: 2, y: 0, w: 2, h: 4 },
            { i: 'allocation', x: 0, y: 7, w: 2, h: 1 },
            { i: 'split', x: 0, y: 9, w: 4, h: 2 },
            { i: 'savings', x: 0, y: 12, w: 2, h: 2 },
        ]
        const before = JSON.stringify(dropped)
        const settled = compactDashboardLayout(dropped, 4)
        expect(settled.map(item => item.y)).toEqual([0, 0, 3, 4, 6])
        for (const item of dropped) expect(settled.find(next => next.i === item.i)).toMatchObject({ x: item.x, w: item.w, h: item.h })
        expect(JSON.stringify(dropped)).toBe(before)
        expect(compactDashboardLayout(settled, 4)).toEqual(settled)
        expect(arrangeDashboardLayout(dropped, 4, true)).toEqual(settled)
    })
    test('fills the screenshot’s empty right column instead of stacking mortgages on the left', () => {
        const packed = arrangeDashboardLayout(screenshotLayout, 4)
        expect(packed.find(item => item.i === 'mortgages')).toMatchObject({ x: 3, y: 0, w: 1, h: 2 })
        expect(packed.find(item => item.i === 'investmentPortfolio')).toMatchObject({ x: 3, y: 2 })
    })

    test('preserves positions when the user explicitly chose a manual layout', () => {
        expect(arrangeDashboardLayout(screenshotLayout, 4, true)).toEqual(screenshotLayout)
    })

    test('does not mutate saved data or change widget sizes', () => {
        const before = JSON.stringify(screenshotLayout)
        const packed = arrangeDashboardLayout(screenshotLayout, 4)
        expect(JSON.stringify(screenshotLayout)).toBe(before)
        for (const original of screenshotLayout) {
            expect(packed.find(item => item.i === original.i)).toMatchObject({ w: original.w, h: original.h })
        }
    })

    for (const cols of [2, 4, 6]) {
        test(`stays within ${cols} columns, never overlaps, and is stable across repeat renders`, () => {
            const input = screenshotLayout.map(item => ({ ...item, w: Math.min(item.w, cols) }))
            const packed = arrangeDashboardLayout(input, cols)
            expect(packed).toHaveLength(input.length)
            for (let i = 0; i < packed.length; i++) {
                expect(packed[i].x).toBeGreaterThanOrEqual(0)
                expect(packed[i].x + packed[i].w).toBeLessThanOrEqual(cols)
                for (let j = i + 1; j < packed.length; j++) expect(overlaps(packed[i], packed[j])).toBe(false)
            }
            expect(arrangeDashboardLayout(packed, cols)).toEqual(packed)
        })
    }

    test('reclaims free space after hiding a widget', () => {
        const initial = arrangeDashboardLayout(screenshotLayout, 4)
        const packed = arrangeDashboardLayout(initial.filter(item => item.i !== 'mortgages'), 4)
        expect(packed.find(item => item.i === 'recentTransactions')).toMatchObject({ x: 3, y: 0 })
    })

    test('restores a widget into a free slot without moving a manual layout', () => {
        const occupied: Layout = [{ i: 'existing', x: 1, y: 0, w: 2, h: 4 }]
        const before = JSON.stringify(occupied)
        const item = { i: 'restored', x: 1, y: 20, w: 1, h: 2, minW: 1, maxW: 4 }
        expect(placeDashboardWidget(item, occupied, 4)).toEqual({ ...item, x: 0, y: 0 })
        expect(JSON.stringify(occupied)).toBe(before)
        expect(item.y).toBe(20)
    })

    test('appends below the layout when no earlier slot can hold the widget', () => {
        const occupied: Layout = [{ i: 'fullWidth', x: 0, y: 0, w: 2, h: 3 }]
        expect(placeDashboardWidget({ i: 'new', x: 0, y: 0, w: 2, h: 2 }, occupied, 2)).toMatchObject({ x: 0, y: 3 })
    })

    test('handles an empty dashboard', () => {
        expect(arrangeDashboardLayout([], 4)).toEqual([])
    })
})
