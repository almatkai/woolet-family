// Shared glass surfaces for Radix selects and popover-based selectors.
// Keep the layer translucent: a solid inner surface would hide the backdrop blur.
export const selectTriggerSurface = [
    "rounded-2xl border border-input bg-background/70",
    "bg-[linear-gradient(to_bottom,var(--tw-gradient-stops))] from-white/60 to-white/20 backdrop-blur-xl backdrop-saturate-150",
    "shadow-[inset_0_1px_0_rgba(255,255,255,0.8),0_3px_12px_-6px_rgba(0,0,0,0.12)]",
    "dark:border-white/[0.14] dark:bg-white/[0.05] dark:from-white/[0.09] dark:to-white/[0.01]",
    "dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.16),inset_0_-1px_0_rgba(255,255,255,0.03),0_4px_16px_-8px_rgba(0,0,0,0.4)]",
    "transition-[background-color,border-color,box-shadow] duration-200 motion-reduce:transition-none",
    "hover:border-primary/25 hover:bg-accent/50 dark:hover:border-white/25 dark:hover:bg-white/[0.09]",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
    "data-[state=open]:border-primary/40 data-[state=open]:ring-2 data-[state=open]:ring-primary/15",
    "disabled:cursor-not-allowed disabled:opacity-50",
].join(" ")

export const selectMenuSurface = [
    "rounded-2xl border border-border/70 bg-popover/80 text-popover-foreground",
    "bg-[linear-gradient(to_bottom,var(--tw-gradient-stops))] from-white/40 to-white/10 backdrop-blur-2xl backdrop-saturate-150",
    "shadow-[inset_0_1px_0_rgba(255,255,255,0.85),0_18px_40px_-12px_rgba(0,0,0,0.2)]",
    "dark:border-white/[0.16] dark:bg-background/70 dark:from-white/[0.09] dark:to-white/[0.02]",
    "dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.18),inset_0_-1px_0_rgba(255,255,255,0.04),0_24px_56px_-12px_rgba(0,0,0,0.6)]",
].join(" ")

export const selectOptionSurface = [
    "rounded-xl outline-none transition-colors motion-reduce:transition-none",
    "focus:bg-primary/10 data-[highlighted]:bg-primary/10 data-[selected=true]:bg-primary/10",
    "dark:focus:bg-white/[0.1] dark:data-[highlighted]:bg-white/[0.1] dark:data-[selected=true]:bg-white/[0.1]",
    "data-[state=checked]:text-primary dark:data-[state=checked]:text-violet-200",
    // cmdk emits data-disabled="false" on enabled items; Radix uses an empty
    // data attribute for disabled items. Their aria-disabled value is consistent.
    "aria-[disabled=true]:pointer-events-none aria-[disabled=true]:opacity-50",
].join(" ")
