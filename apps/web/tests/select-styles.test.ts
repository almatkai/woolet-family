import { describe, expect, test } from 'bun:test'
import { twMerge } from 'tailwind-merge'
import { selectOptionSurface } from '../src/components/ui/select-styles'

// CommandItem's base classes and the shared selector surface are merged at the
// call site. cmdk always emits data-disabled, including data-disabled="false";
// Radix emits data-disabled="" only for disabled options. Both expose ARIA.
const classes = twMerge(
    'data-[disabled=true]:pointer-events-none data-[disabled=true]:opacity-50',
    selectOptionSurface,
).split(' ')

function disabledUtilities(attributes: Record<string, string>) {
    return classes.filter(className => {
        if (!className.endsWith(':pointer-events-none') && !className.endsWith(':opacity-50')) return false
        const match = className.match(/^(data|aria)-\[disabled(?:=([^\]]+))?\]:/)
        if (!match) return false
        const attribute = `${match[1]}-disabled`
        return match[2] === undefined
            ? attribute in attributes
            : attributes[attribute] === match[2]
    })
}

describe('shared select option disabled styles', () => {
    test('enabled cmdk currency options stay clickable and fully visible', () => {
        expect(disabledUtilities({ 'data-disabled': 'false', 'aria-disabled': 'false' })).toEqual([])
    })

    test('disabled cmdk options stay non-interactive and dimmed', () => {
        const utilities = disabledUtilities({ 'data-disabled': 'true', 'aria-disabled': 'true' })
        expect(utilities.some(c => c.endsWith(':pointer-events-none'))).toBe(true)
        expect(utilities.some(c => c.endsWith(':opacity-50'))).toBe(true)
    })

    test('disabled Radix options also stay non-interactive and dimmed', () => {
        const utilities = disabledUtilities({ 'data-disabled': '', 'aria-disabled': 'true' })
        expect(utilities.some(c => c.endsWith(':pointer-events-none'))).toBe(true)
        expect(utilities.some(c => c.endsWith(':opacity-50'))).toBe(true)
    })
})
