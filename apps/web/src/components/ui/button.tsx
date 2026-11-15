import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold transition-all duration-200 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        neutral: "bg-foreground text-background shadow-none hover:bg-foreground/90 focus-visible:ring-ring",
        // Violet gradient with a specular top edge and soft glow, like the mobile primary actions
        default:
          "bg-gradient-to-b from-violet-500 to-violet-600 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.28),0_8px_20px_-8px_rgba(139,92,246,0.75)] hover:from-violet-400 hover:to-violet-600 hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.32),0_10px_26px_-8px_rgba(139,92,246,0.9)]",
        destructive:
          "bg-gradient-to-b from-rose-500 to-rose-600 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.25),0_8px_20px_-8px_rgba(244,63,94,0.7)] hover:from-rose-400 hover:to-rose-600 hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.3),0_10px_26px_-8px_rgba(244,63,94,0.8)] focus-visible:ring-rose-500/50",
        success:
          "bg-gradient-to-b from-emerald-500 to-emerald-600 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.25),0_8px_20px_-8px_rgba(16,185,129,0.7)] hover:from-emerald-400 hover:to-emerald-600 hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.3),0_10px_26px_-8px_rgba(16,185,129,0.8)] focus-visible:ring-emerald-500/50",
        // Frosted glass surfaces for secondary actions
        outline:
          "border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground dark:border-white/[0.12] dark:bg-white/[0.04] dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] dark:backdrop-blur-xl dark:hover:border-white/20 dark:hover:bg-white/[0.08]",
        secondary:
          "bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80 dark:border dark:border-white/10 dark:bg-white/[0.08] dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_6px_16px_-8px_rgba(0,0,0,0.6)] dark:backdrop-blur-xl dark:hover:bg-white/[0.12]",
        ghost: "hover:bg-accent hover:text-accent-foreground dark:hover:bg-white/[0.07]",
        link: "text-primary underline-offset-4 hover:underline dark:text-violet-300",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-8 rounded-lg px-3 text-xs",
        lg: "h-11 rounded-2xl px-8",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

/**
 * @component
 */
const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
