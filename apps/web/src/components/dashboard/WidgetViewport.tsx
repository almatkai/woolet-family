import React, { createContext, useContext, useLayoutEffect, useRef, useState } from 'react'
import { getWidgetPresentation } from '@/lib/widget-presentation'

const WidgetSizeContext = createContext<ReturnType<typeof getWidgetPresentation> | null>(null)

export function useWidgetLayout(gridParams?: { w: number; h: number; breakpoint?: string }) {
    const measured = useContext(WidgetSizeContext)
    const small = gridParams?.breakpoint === 'sm' || gridParams?.breakpoint === 'xs'
    return measured ?? getWidgetPresentation((gridParams?.w ?? 2) * 240, (gridParams?.h ?? 2) * (small ? 50 : 160) - 20)
}

export function WidgetViewport({ children, id }: { children: React.ReactNode; id: string }) {
    const ref = useRef<HTMLDivElement>(null)
    const [size, setSize] = useState({ width: 0, height: 0 })
    useLayoutEffect(() => {
        const element = ref.current
        if (!element) return
        const update = (width: number, height: number) => setSize(previous =>
            Math.abs(previous.width - width) < 1 && Math.abs(previous.height - height) < 1 ? previous : { width, height })
        update(element.clientWidth, element.clientHeight)
        const observer = new ResizeObserver(([entry]) => update(entry.contentRect.width, entry.contentRect.height))
        observer.observe(element)
        return () => observer.disconnect()
    }, [])
    const layout = getWidgetPresentation(size.width, size.height)
    const previousRows = useRef(new Map<HTMLElement, { left: number; top: number }>())
    useLayoutEffect(() => {
        const element = ref.current
        if (!element) return
        const rows = [...element.querySelectorAll<HTMLElement>('[data-widget-row]')]
        const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
        const bounds = element.getBoundingClientRect()
        const nextRows = new Map<HTMLElement, { left: number; top: number }>()
        for (const row of rows) {
            row.getAnimations().forEach(animation => animation.cancel())
            const measured = row.getBoundingClientRect()
            const rect = { left: measured.left - bounds.left, top: measured.top - bounds.top }
            nextRows.set(row, rect)
            if (reducedMotion) continue
            const previous = previousRows.current.get(row)
            const x = previous ? previous.left - rect.left : 0
            const y = previous ? previous.top - rect.top : 6
            if (!previous || Math.abs(x) > 1 || Math.abs(y) > 1) {
                row.animate([
                    { transform: `translate(${x}px, ${y}px)`, opacity: previous ? 1 : 0 },
                    { transform: 'translate(0, 0)', opacity: 1 },
                ], { duration: 200, easing: 'cubic-bezier(.22,1,.36,1)' })
            }
        }
        previousRows.current = nextRows
    }, [layout.columns, layout.rowLimit, layout.view])
    return (
        <WidgetSizeContext.Provider value={layout}>
            <div ref={ref} className="widget-viewport h-full w-full min-w-0 min-h-0" data-widget-id={id}
                data-widget-view={layout.view} data-widget-width={layout.isNarrow ? 'narrow' : 'wide'}
                style={{ '--widget-list-columns': layout.columns } as React.CSSProperties}>
                {children}
            </div>
        </WidgetSizeContext.Provider>
    )
}
