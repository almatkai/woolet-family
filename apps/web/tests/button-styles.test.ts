import { describe, expect, test } from 'bun:test'
import { buttonVariants } from '../src/components/ui/button'
import { cn } from '../src/lib/utils'

describe('colored button surfaces', () => {
    test('destructive buttons use red shadows and focus instead of violet', () => {
        const classes = cn(buttonVariants({ variant: 'destructive' }))
        expect(classes).toContain('from-rose-500')
        expect(classes).toContain('rgba(244,63,94,')
        expect(classes).toContain('hover:shadow-')
        expect(classes).toContain('focus-visible:ring-rose-500/50')
        expect(classes).not.toContain('focus-visible:ring-primary/')
        expect(classes).not.toContain('rgba(139,92,246,')
    })

    test('success buttons use green shadows and focus instead of violet', () => {
        const classes = cn(buttonVariants({ variant: 'success' }))
        expect(classes).toContain('from-emerald-500')
        expect(classes).toContain('rgba(16,185,129,')
        expect(classes).toContain('hover:shadow-')
        expect(classes).toContain('focus-visible:ring-emerald-500/50')
        expect(classes).not.toContain('focus-visible:ring-primary/')
        expect(classes).not.toContain('rgba(139,92,246,')
    })

    test('primary buttons keep their violet accent', () => {
        const classes = cn(buttonVariants())
        expect(classes).toContain('from-violet-500')
        expect(classes).toContain('rgba(139,92,246,')
    })
})
