import { cn } from "@/lib/utils"

type BadgeVariant = "default" | "secondary" | "success" | "warning" | "danger" | "outline" | "arcade" | "arcade-success" | "arcade-warning" | "arcade-danger"

function Badge({
  className,
  variant = "default",
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & {
  variant?: BadgeVariant
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center font-medium",
        {
          // Studio variants - clean, professional
          "px-2.5 py-0.5 text-xs rounded-md bg-[var(--color-primary)] text-white": variant === "default",
          "px-2.5 py-0.5 text-xs rounded-md bg-[var(--color-surface-2)] text-[var(--color-text-secondary)] border border-[var(--color-border)]": variant === "secondary",
          "px-2.5 py-0.5 text-xs rounded-md bg-[var(--color-success)]/15 text-[var(--color-success)] border border-[var(--color-success)]": variant === "success",
          "px-2.5 py-0.5 text-xs rounded-md bg-[var(--color-warning)]/15 text-[var(--color-warning)] border border-[var(--color-warning)]": variant === "warning",
          "px-2.5 py-0.5 text-xs rounded-md bg-[var(--color-danger)]/15 text-[var(--color-danger)] border border-[var(--color-danger)]": variant === "danger",
          "px-2.5 py-0.5 text-xs rounded-md bg-transparent text-[var(--color-text)] border border-[var(--color-border)]": variant === "outline",
          // Arcade variants - chunky, playful
          "px-3 py-1 text-[10px] font-bold uppercase tracking-wider font-pixel border-2 bg-[var(--color-arcade-yellow)] text-[var(--color-base)] border-[var(--color-base)] shadow-[2px_2px_0_var(--color-base)]": variant === "arcade",
          "px-3 py-1 text-[10px] font-bold uppercase tracking-wider font-pixel border-2 bg-[var(--color-success)] text-white border-[var(--color-base)] shadow-[2px_2px_0_var(--color-base)]": variant === "arcade-success",
          "px-3 py-1 text-[10px] font-bold uppercase tracking-wider font-pixel border-2 bg-[var(--color-warning)] text-[var(--color-base)] border-[var(--color-base)] shadow-[2px_2px_0_var(--color-base)]": variant === "arcade-warning",
          "px-3 py-1 text-[10px] font-bold uppercase tracking-wider font-pixel border-2 bg-[var(--color-arcade-red)] text-white border-[var(--color-base)] shadow-[2px_2px_0_var(--color-base)]": variant === "arcade-danger",
        },
        className
      )}
      {...props}
    />
  )
}

export { Badge }
