import * as React from "react"
import { Check, ChevronDown, X } from "lucide-react"

import { cn } from "@/lib/utils"
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet"
import { useIsMobile } from "@/hooks/use-mobile"
import { trpc } from "@/lib/trpc"
import { selectOptionSurface, selectTriggerSurface } from "./select-styles"

type Currency = { code: string; name: string; symbol: string }

type Section = { title: string; items: Currency[] }

interface CurrencySelectorProps {
    value?: string
    onValueChange: (value: string) => void
    disabled?: boolean
}

/** Symbol tile — the only place a raw currency glyph appears, so it always looks the same. */
function SymbolTile({ symbol, active, className }: { symbol: string; active?: boolean; className?: string }) {
    // Long glyphs like "Bds$" need to shrink to stay inside the tile
    const glyphSize = symbol.length > 2 ? "text-[10px]" : symbol.length > 1 ? "text-[11px]" : "text-[13px]"
    return (
        <span
            aria-hidden="true"
            className={cn(
                "flex size-8 shrink-0 items-center justify-center overflow-hidden rounded-lg font-mono leading-none transition-colors",
                glyphSize,
                active
                    ? "bg-primary/20 text-primary ring-1 ring-inset ring-primary/30"
                    : "bg-muted text-foreground/80 ring-1 ring-inset dark:bg-white/[0.06] dark:ring-white/[0.06]",
                className
            )}
        >
            {symbol}
        </span>
    )
}

/** Rank a currency against a search query: code beats name, prefix beats substring. */
function rank(currency: Currency, query: string): number | null {
    const code = currency.code.toLowerCase()
    const name = currency.name.toLowerCase()
    const symbol = (currency.symbol || "").toLowerCase()
    if (code === query) return 0
    if (code.startsWith(query)) return 1
    if (name.startsWith(query)) return 2
    if (code.includes(query) || symbol.includes(query)) return 3
    if (name.includes(query)) return 4
    return null
}

export function CurrencySelector({ value, onValueChange, disabled }: CurrencySelectorProps) {
    const [open, setOpen] = React.useState(false)
    const [search, setSearch] = React.useState("")
    const isMobile = useIsMobile(768)
    const { data: currencies, isLoading } = trpc.currency.list.useQuery()
    const { data: preferred } = trpc.currency.getPreferred.useQuery(undefined, { staleTime: 5 * 60 * 1000 })

    const list = currencies as Currency[] | undefined
    const selectedCurrency = list?.find((c) => c.code === value)
    const defaultCurrency = preferred?.defaultCurrency

    // Forms start with an empty currency; fill it with the user's default from settings
    React.useEffect(() => {
        if (!value && defaultCurrency && !disabled) {
            onValueChange(defaultCurrency)
        }
    }, [value, defaultCurrency, disabled, onValueChange])

    // Close on select, and don't carry a stale query into the next open
    const close = React.useCallback(() => {
        setOpen(false)
        setSearch("")
    }, [])

    const sections = React.useMemo<Section[]>(() => {
        if (!list) return []
        const query = search.trim().toLowerCase()

        if (query) {
            const matches = list
                .map((currency) => ({ currency, score: rank(currency, query) }))
                .filter((entry): entry is { currency: Currency; score: number } => entry.score !== null)
                .sort((a, b) => a.score - b.score || a.currency.code.localeCompare(b.currency.code))
                .map((entry) => entry.currency)
            return matches.length > 0 ? [{ title: `${matches.length} ${matches.length === 1 ? "currency" : "currencies"}`, items: matches }] : []
        }

        const suggestedCodes = [...new Set([defaultCurrency, ...(preferred?.recent || []), value].filter(Boolean))] as string[]
        const byCode = new Map(list.map((c) => [c.code, c]))
        const suggested = suggestedCodes.map((code) => byCode.get(code)).filter(Boolean) as Currency[]
        const others = list.filter((c) => !suggestedCodes.includes(c.code)).sort((a, b) => a.code.localeCompare(b.code))
        return [
            ...(suggested.length > 0 ? [{ title: "Suggested", items: suggested }] : []),
            { title: "All currencies", items: others },
        ]
    }, [list, search, preferred, defaultCurrency, value])

    const renderItem = (currency: Currency) => {
        const selected = currency.code === value
        return (
            <CommandItem
                key={currency.code}
                value={currency.code}
                // cmdk lowercases the value, so pass the original code back
                onSelect={() => {
                    onValueChange(currency.code)
                    close()
                }}
                keywords={[currency.code, currency.name, currency.symbol]}
                className={cn(
                    selectOptionSurface,
                    "group cursor-pointer items-center gap-2.5 px-2 py-2"
                )}
            >
                <SymbolTile symbol={currency.symbol} active={selected} />
                <span className="flex min-w-0 flex-1 items-baseline gap-1.5">
                    <span className="text-sm font-semibold tracking-tight">{currency.code}</span>
                    <span className="truncate text-xs text-muted-foreground">{currency.name}</span>
                </span>
                {currency.code === defaultCurrency && (
                    <span className="shrink-0 rounded-full bg-primary/15 px-1.5 py-0.5 text-[10px] font-semibold text-primary">
                        Default
                    </span>
                )}
                <Check
                    className={cn(
                        "size-4 shrink-0 transition-opacity motion-reduce:transition-none",
                        selected ? "text-primary opacity-100" : "opacity-0"
                    )}
                />
            </CommandItem>
        )
    }

    const trigger = (
        <button
            type="button"
            role="combobox"
            aria-expanded={open}
            aria-label={selectedCurrency ? `Currency: ${selectedCurrency.code}` : "Select currency"}
            disabled={disabled}
            className={cn(
                selectTriggerSurface,
                "flex h-11 w-full min-w-0 items-center gap-2.5 px-2.5 text-left"
            )}
        >
            {isLoading && !selectedCurrency ? (
                <span className="size-8 shrink-0 animate-pulse rounded-lg bg-muted dark:bg-white/[0.06]" />
            ) : (
                <SymbolTile symbol={selectedCurrency?.symbol ?? "?"} active={Boolean(selectedCurrency)} />
            )}
            <span className="flex min-w-0 flex-1 items-baseline gap-1.5">
                {selectedCurrency ? (
                    <>
                        <span className="text-sm font-semibold tracking-tight">{selectedCurrency.code}</span>
                        <span className="hidden truncate text-xs text-muted-foreground sm:inline">
                            {selectedCurrency.name}
                        </span>
                    </>
                ) : (
                    <span className="truncate text-sm text-muted-foreground">
                        {isLoading ? "Loading currencies..." : "Select currency"}
                    </span>
                )}
            </span>
            <span
                className={cn(
                    "flex size-6 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground transition-transform duration-200 dark:bg-white/[0.06] motion-reduce:transition-none",
                    open && "rotate-180 bg-accent text-foreground dark:bg-white/[0.08]"
                )}
            >
                <ChevronDown className="size-4" />
            </span>
        </button>
    )

    const commandContent = (
        <Command
            shouldFilter={false}
            loop
            className={cn(
                "flex flex-1 min-h-0 flex-col bg-transparent",
                // Restyle the shared input wrapper into a compact search field
                "[&_[cmdk-input-wrapper]]:h-10 [&_[cmdk-input-wrapper]]:gap-2 [&_[cmdk-input-wrapper]]:rounded-xl [&_[cmdk-input-wrapper]]:border-b-0 [&_[cmdk-input-wrapper]]:bg-foreground/[0.04] [&_[cmdk-input-wrapper]]:px-2.5 [&_[cmdk-input-wrapper]]:ring-1 [&_[cmdk-input-wrapper]]:ring-inset [&_[cmdk-input-wrapper]]:ring-border [&_[cmdk-input-wrapper]]:focus-within:ring-primary/40 [&_[cmdk-input-wrapper]_svg]:size-4 [&_[cmdk-input-wrapper]_svg]:text-muted-foreground"
            )}
        >
            <div className="relative shrink-0 border-b border-border/60 p-2.5">
                <CommandInput
                    placeholder="Search currency..."
                    value={search}
                    onValueChange={setSearch}
                    className="h-full py-0 pl-0 pr-6 text-sm shadow-none"
                />
                {search.length > 0 && (
                    <button
                        type="button"
                        onClick={() => setSearch("")}
                        aria-label="Clear search"
                        className="absolute right-4 top-1/2 flex size-5 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                    >
                        <X className="size-3.5" />
                    </button>
                )}
            </div>

            <CommandList
                data-vaul-no-drag
                onWheel={(e) => e.stopPropagation()}
                onTouchMove={(e) => e.stopPropagation()}
                className={cn(
                    "overflow-y-auto overscroll-contain p-2 touch-pan-y",
                    isMobile
                        ? "flex-1 min-h-0"
                        : "min-h-0 max-h-[min(28rem,calc(var(--radix-popover-content-available-height,70dvh)-3.5rem))]"
                )}
                style={{ touchAction: 'pan-y', WebkitOverflowScrolling: 'touch' }}
            >
                {isLoading ? (
                    <div className="flex flex-col gap-1 p-1">
                        {Array.from({ length: 6 }).map((_, index) => (
                            <div key={index} className="flex items-center gap-2.5 rounded-xl px-2 py-2">
                                <span className="size-8 shrink-0 animate-pulse rounded-lg bg-muted dark:bg-white/[0.06]" />
                                <span className="h-3 flex-1 animate-pulse rounded-full bg-muted dark:bg-white/[0.06]" />
                            </div>
                        ))}
                    </div>
                ) : (
                    <>
                        {sections.map((section) => (
                            <CommandGroup
                                key={section.title}
                                heading={section.title}
                                className="px-0 pb-2 [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-[10px] [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-wider [&_[cmdk-group-heading]]:text-muted-foreground"
                            >
                                {section.items.map(renderItem)}
                            </CommandGroup>
                        ))}
                        <CommandEmpty className="py-6 text-center">
                            <p className="text-sm text-foreground">No currency matches “{search.trim()}”</p>
                            <button
                                type="button"
                                onClick={() => setSearch("")}
                                className="mt-1.5 text-xs font-medium text-primary hover:underline"
                            >
                                Clear search
                            </button>
                        </CommandEmpty>
                    </>
                )}
            </CommandList>
        </Command>
    )

    if (isMobile) {
        return (
            <Sheet open={open} onOpenChange={(next) => (next ? setOpen(true) : close())}>
                <SheetTrigger asChild>
                    {trigger}
                </SheetTrigger>
                <SheetContent
                    side="bottom"
                    className="flex h-[82dvh] max-h-[82dvh] flex-col gap-0 p-0 rounded-t-[28px] border-t dark:border-white/10 bg-background/95 backdrop-blur-2xl z-[70] overflow-hidden"
                >
                    <SheetHeader className="shrink-0 px-4 pt-4 pb-2.5 border-b border-border/60 text-left">
                        <SheetTitle className="text-base font-semibold">Select currency</SheetTitle>
                        <SheetDescription className="sr-only">Search and choose a currency</SheetDescription>
                    </SheetHeader>
                    {commandContent}
                </SheetContent>
            </Sheet>
        )
    }

    return (
        <Popover modal={true} open={open} onOpenChange={(next) => (next ? setOpen(true) : close())}>
            <PopoverTrigger asChild>
                {trigger}
            </PopoverTrigger>

            <PopoverContent
                align="start"
                sideOffset={8}
                className="flex w-[min(24rem,calc(100vw-24px))] flex-col overflow-hidden p-0"
            >
                {commandContent}
            </PopoverContent>
        </Popover>
    )
}
