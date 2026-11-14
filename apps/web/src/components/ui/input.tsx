import * as React from "react"

import { cn } from "@/lib/utils"

const DATE_INPUT_TYPES = new Set(["date", "datetime-local", "month", "week", "time"])

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, onClick, ...props }, ref) => {
    const isDateInput = type ? DATE_INPUT_TYPES.has(type) : false

    const handleClick: React.MouseEventHandler<HTMLInputElement> = (event) => {
      onClick?.(event)
      if (event.defaultPrevented) return
      if (!isDateInput || props.disabled || props.readOnly) return

      ;(event.currentTarget as HTMLInputElement & { showPicker?: () => void }).showPicker?.()
    }

    return (
      <input
        type={type}
        className={cn(
          "flex h-10 w-full rounded-xl border border-input bg-transparent px-3.5 py-1 text-base shadow-sm transition-colors dark:border-white/10 dark:bg-white/[0.04] dark:hover:border-white/20 focus-visible:border-primary/60 focus-visible:ring-2 focus-visible:ring-primary/25 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
          className
        )}
        ref={ref}
        onClick={handleClick}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }
