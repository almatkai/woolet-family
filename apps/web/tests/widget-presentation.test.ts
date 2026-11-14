import { describe, expect, test } from 'bun:test'
import { getWidgetPresentation } from '../src/lib/widget-presentation'

describe('widget viewport budgets', () => {
    test('short boxes prioritize the headline and action over partial rows', () => {
        for (const width of [160, 260, 600, 1000]) {
            const view = getWidgetPresentation(width, 140)
            expect(view.view).toBe('summary')
            expect(view.rowLimit).toBe(0)
            expect(view.showChart).toBe(false)
        }
    })

    test('every admitted list row fits above the footer at supported sizes', () => {
        for (const width of [160, 260, 320, 580, 1000]) {
            let previousLimit = 0
            for (let height = 132; height <= 620; height++) {
                const view = getWidgetPresentation(width, height)
                const listHeight = view.rows ? view.rows * 52 + (view.rows - 1) * 6 : 0
                expect(listHeight).toBeLessThanOrEqual(Math.max(0, height - (height < 180 ? 58 : 76) - 34 - 24))
                expect(view.rowLimit).toBeGreaterThanOrEqual(previousLimit)
                previousLimit = view.rowLimit
            }
        }
    })

    test('wide lists use extra columns while narrow tall boxes retain one column', () => {
        expect(getWidgetPresentation(600, 460).rowLimit).toBe(getWidgetPresentation(300, 460).rowLimit * 2)
        expect(getWidgetPresentation(260, 620)).toMatchObject({ view: 'tall', columns: 1, showChart: true, showChartDetails: false })
        expect(getWidgetPresentation(600, 460)).toMatchObject({ view: 'expanded', showChartDetails: true })
        expect(getWidgetPresentation(600, 220)).toMatchObject({ view: 'wide', showChart: false })
    })
})
