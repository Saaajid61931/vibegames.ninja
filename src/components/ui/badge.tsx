import { cn } from "@/lib/utils"

type BadgeVariant = "default" | "secondary" | "success" | "warning" | "danger" | "outline" | "arcade" | "arcade-success" | "arcade-warning" | "arcade-danger"

function Badge({
  className,
  variant = "arcade",
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & {
  variant?: BadgeVariant
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center font-medium",
        {
          "px-2.5 py-0.5 text-xs rounded-md bg-primary text-white": variant === "default",
          "px-2.5 py-0.5 text-xs rounded-md bg-surface-2 text-text-secondary border border-border": variant === "secondary",
          "px-2.5 py-0.5 text-xs rounded-md bg-success/15 text-success border border-success": variant === "success",
          "px-2.5 py-0.5 text-xs rounded-md bg-warning/15 text-warning border border-warning": variant === "warning",
          "px-2.5 py-0.5 text-xs rounded-md bg-danger/15 text-danger border border-danger": variant === "danger",
          "px-2.5 py-0.5 text-xs rounded-md bg-transparent text-text border border-border": variant === "outline",
          // Arcade variants - chunky, playful
          "px-3 py-1 text-xs font-bold uppercase tracking-widest font-sans border-2 bg-arcade-yellow text-canvas border-canvas shadow-[2px_2px_0_var(--color-canvas)]": variant === "arcade",
          "px-3 py-1 text-xs font-bold uppercase tracking-widest font-sans border-2 bg-success text-white border-canvas shadow-[2px_2px_0_var(--color-canvas)]": variant === "arcade-success",
          "px-3 py-1 text-xs font-bold uppercase tracking-widest font-sans border-2 bg-warning text-canvas border-canvas shadow-[2px_2px_0_var(--color-canvas)]": variant === "arcade-warning",
          "px-3 py-1 text-xs font-bold uppercase tracking-widest font-sans border-2 bg-arcade-red text-white border-canvas shadow-[2px_2px_0_var(--color-canvas)]": variant === "arcade-danger",
        },
        className
      )}
      {...props}
    />
  )
}

export { Badge }
