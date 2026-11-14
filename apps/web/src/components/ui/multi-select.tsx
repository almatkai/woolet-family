import * as React from "react"
import { ChevronDown } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import { Checkbox } from "@/components/ui/checkbox"
import { Separator } from "@/components/ui/separator"
import { selectTriggerSurface } from "./select-styles"

export interface Option {
    label: string
    value: string
    icon?: React.ReactNode
}

interface MultiSelectProps {
    options: Option[]
    selected: string[]
    onChange: (selected: string[]) => void
    placeholder?: string
    className?: string
}

export function MultiSelect({
    options,
    selected,
    onChange,
    placeholder = "Select options...",
    className,
}: MultiSelectProps) {
    const [open, setOpen] = React.useState(false)

    return (
        <Popover modal={true} open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className={cn(selectTriggerSurface, "h-10 w-full min-w-0 justify-between px-3.5", className)}
                >
                    <div className="flex items-center gap-1 overflow-hidden min-w-0">
                        {selected.length === 0 ? (
                            <span className="text-muted-foreground font-normal truncate">{placeholder}</span>
                        ) : (
                            <span className="text-foreground truncate font-medium">
                                {selected.length > 2 
                                    ? `${selected.length} Selected` 
                                    : selected.map(id => options.find(o => o.value === id)?.label).join(", ")
                                }
                            </span>
                        )}
                    </div>
                    <span className="flex size-6 shrink-0 items-center justify-center rounded-lg bg-foreground/[0.04] text-muted-foreground dark:bg-white/[0.06]" aria-hidden="true">
                        <ChevronDown className={cn("size-4 transition-transform duration-200 motion-reduce:transition-none", open && "rotate-180")} />
                    </span>
                </Button>
            </PopoverTrigger>
            <PopoverContent className="flex w-[var(--radix-popover-trigger-width)] flex-col overflow-hidden p-0" align="end">
                <div className="shrink-0 border-b border-border/60 p-2">
                    <p className="text-xs font-medium text-muted-foreground px-2">Categories</p>
                </div>
                <div
                    data-vaul-no-drag
                    onWheel={(e) => e.stopPropagation()}
                    onTouchMove={(e) => e.stopPropagation()}
                    className="min-h-0 max-h-64 flex-1 overflow-y-auto overscroll-contain p-1.5 touch-pan-y"
                    style={{ touchAction: 'pan-y', WebkitOverflowScrolling: 'touch' }}
                >
                    {/* Select All Option (Implicitly if empty, but explicit is nice) */}
                    <div
                        className="flex cursor-pointer items-center space-x-2 rounded-xl p-2.5 hover:bg-primary/10 dark:hover:bg-white/[0.1]"
                        onClick={() => {
                            if (selected.length === options.length) {
                                onChange([])
                            } else {
                                onChange(options.map(o => o.value))
                            }
                        }}
                    >
                        <Checkbox
                            checked={selected.length === options.length && options.length > 0}
                            onCheckedChange={() => { }} // Controlled by div click
                        />
                        <span className="text-sm font-medium">Select All</span>
                    </div>
                    <Separator className="my-1" />
                    {options.map((option) => (
                        <div
                            key={option.value}
                            className="flex cursor-pointer items-center space-x-2 rounded-xl p-2.5 hover:bg-primary/10 dark:hover:bg-white/[0.1]"
                            onClick={() => {
                                if (selected.includes(option.value)) {
                                    onChange(selected.filter((item) => item !== option.value))
                                } else {
                                    onChange([...selected, option.value])
                                }
                            }}
                        >
                            <Checkbox
                                checked={selected.includes(option.value)}
                                onCheckedChange={() => { }} // Controlled by div click
                                id={option.value}
                            />
                            <div className="flex items-center gap-2 text-sm">
                                {option.icon}
                                {option.label}
                            </div>
                        </div>
                    ))}
                    {options.length === 0 && (
                        <p className="text-sm text-muted-foreground p-2 text-center">No categories found.</p>
                    )}
                </div>
            </PopoverContent>
        </Popover>
    )
}
