export type WidgetView = 'summary' | 'compact' | 'wide' | 'tall' | 'expanded'

/** Pixel budgets shared by rendering and CSS; grid units vary with the breakpoint. */
export function getWidgetPresentation(width: number, height: number) {
    const isNarrow = width < 320
    const columns = width >= 580 ? 2 : 1
    const rowHeight = 52
    const headerHeight = height < 180 ? 58 : 76
    const footerHeight = 34
    const bodyHeight = Math.max(0, height - headerHeight - footerHeight - 24)
    const rows = height < 180 ? 0 : Math.max(0, Math.floor((bodyHeight + 6) / (rowHeight + 6)))
    const view: WidgetView = height < 180 ? 'summary'
        : width >= 460 && height < 320 ? 'wide'
        : height >= 380 ? (isNarrow ? 'tall' : 'expanded') : 'compact'
    return {
        width, height, view, columns, rows, rowLimit: rows * columns,
        isNarrow, isShort: height < 240, isCompact: height < 320 || isNarrow,
        isTall: height >= 380, isSmallBp: height < 200,
        showBody: rows > 0,
        showChart: width >= 220 && bodyHeight >= 120,
        showChartDetails: width >= 400 && bodyHeight >= 220,
    }
}
