
import * as React from "react"
import { CheckIcon } from "@radix-ui/react-icons"
import { ChevronDown, ChevronUp } from "lucide-react"
import * as SelectPrimitive from "@radix-ui/react-select"

import { cn } from "@/lib/utils"
import { selectMenuSurface, selectOptionSurface, selectTriggerSurface } from "./select-styles"

const Select = SelectPrimitive.Root

const SelectGroup = SelectPrimitive.Group

const SelectValue = SelectPrimitive.Value

const SelectTrigger = React.forwardRef<
    React.ElementRef<typeof SelectPrimitive.Trigger>,
    React.ComponentPropsWithoutRef<typeof SelectPrimitive.Trigger>
>(({ className, children, ...props }, ref) => (
    <SelectPrimitive.Trigger
        ref={ref}
        className={cn(
            selectTriggerSurface,
            "group flex h-10 w-full min-w-0 items-center justify-between gap-2 px-3.5 py-2 text-sm ring-offset-background data-[placeholder]:text-muted-foreground [&>span:first-child]:truncate",
            className
        )}
        {...props}
    >
        {children}
        <SelectPrimitive.Icon asChild>
            <span className="flex size-6 shrink-0 items-center justify-center rounded-lg bg-foreground/[0.04] text-muted-foreground dark:bg-white/[0.06]" aria-hidden="true">
                <ChevronDown className="size-4 transition-transform duration-200 group-data-[state=open]:rotate-180 motion-reduce:transition-none" />
            </span>
        </SelectPrimitive.Icon>
    </SelectPrimitive.Trigger>
))
SelectTrigger.displayName = SelectPrimitive.Trigger.displayName

const SelectContent = React.forwardRef<
    React.ElementRef<typeof SelectPrimitive.Content>,
    React.ComponentPropsWithoutRef<typeof SelectPrimitive.Content>
>(({ className, children, position = "popper", collisionPadding = 12, sideOffset = 8, ...props }, ref) => (
    <SelectPrimitive.Portal>
        <SelectPrimitive.Content
            ref={ref}
            className={cn(
                selectMenuSurface,
                "relative z-50 flex min-w-[8rem] flex-col overflow-hidden outline-none",
                "max-h-[min(24rem,var(--radix-select-content-available-height,calc(100dvh-24px)))] max-w-[min(calc(100vw-24px),var(--radix-select-content-available-width,100vw))]",
                "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 motion-reduce:animate-none",
                className
            )}
            position={position}
            collisionPadding={collisionPadding}
            sideOffset={sideOffset}
            {...props}
        >
            <SelectPrimitive.ScrollUpButton className="flex shrink-0 items-center justify-center py-1 text-muted-foreground">
                <ChevronUp className="size-4" />
            </SelectPrimitive.ScrollUpButton>
            <SelectPrimitive.Viewport
                className={cn(
                    "min-h-0 flex-1 overscroll-contain p-1.5",
                    position === "popper" &&
                    "w-full min-w-[min(var(--radix-select-trigger-width),var(--radix-select-content-available-width))]"
                )}
            >
                {children}
            </SelectPrimitive.Viewport>
            <SelectPrimitive.ScrollDownButton className="flex shrink-0 items-center justify-center py-1 text-muted-foreground">
                <ChevronDown className="size-4" />
            </SelectPrimitive.ScrollDownButton>
        </SelectPrimitive.Content>
    </SelectPrimitive.Portal>
))
SelectContent.displayName = SelectPrimitive.Content.displayName

const SelectLabel = React.forwardRef<
    React.ElementRef<typeof SelectPrimitive.Label>,
    React.ComponentPropsWithoutRef<typeof SelectPrimitive.Label>
>(({ className, ...props }, ref) => (
    <SelectPrimitive.Label
        ref={ref}
        className={cn("px-2.5 py-2 text-xs font-medium text-muted-foreground", className)}
        {...props}
    />
))
SelectLabel.displayName = SelectPrimitive.Label.displayName

const SelectItem = React.forwardRef<
    React.ElementRef<typeof SelectPrimitive.Item>,
    React.ComponentPropsWithoutRef<typeof SelectPrimitive.Item>
>(({ className, children, ...props }, ref) => (
    <SelectPrimitive.Item
        ref={ref}
        className={cn(
            selectOptionSurface,
            "relative flex w-full min-w-0 cursor-pointer select-none items-center py-2.5 pl-2.5 pr-9 text-sm [&>span:last-child]:min-w-0 [&>span:last-child]:break-words",
            className
        )}
        {...props}
    >
        <span className="absolute right-2.5 flex size-4 items-center justify-center text-primary dark:text-violet-300">
            <SelectPrimitive.ItemIndicator>
                <CheckIcon className="h-4 w-4" />
            </SelectPrimitive.ItemIndicator>
        </span>
        <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
    </SelectPrimitive.Item>
))
SelectItem.displayName = SelectPrimitive.Item.displayName

const SelectSeparator = React.forwardRef<
    React.ElementRef<typeof SelectPrimitive.Separator>,
    React.ComponentPropsWithoutRef<typeof SelectPrimitive.Separator>
>(({ className, ...props }, ref) => (
    <SelectPrimitive.Separator
        ref={ref}
        className={cn("mx-1 my-1.5 h-px bg-border/60", className)}
        {...props}
    />
))
SelectSeparator.displayName = SelectPrimitive.Separator.displayName

export {
    Select,
    SelectGroup,
    SelectValue,
    SelectTrigger,
    SelectContent,
    SelectLabel,
    SelectItem,
    SelectSeparator,
}
