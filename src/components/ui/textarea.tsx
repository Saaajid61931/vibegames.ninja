import * as React from "react"
import { cn } from "@/lib/utils"

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  variant?: "studio" | "arcade"
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, variant = "studio", ...props }, ref) => {
    return (
      <textarea
        className={cn(
          "flex min-h-[120px] w-full transition-all duration-150 resize-none",
          "disabled:cursor-not-allowed disabled:opacity-50",
          variant === "studio" && [
            "px-3 py-2",
            "bg-[var(--color-base)] text-[var(--color-text)]",
            "border border-[var(--color-border)] rounded-md",
            "text-sm placeholder:text-[var(--color-text-tertiary)]",
            "focus:border-[var(--color-primary)] focus:outline-none",
            "focus:ring-2 focus:ring-[var(--color-primary)]/20",
          ],
          variant === "arcade" && [
            "px-4 py-3",
            "bg-[var(--color-base)] text-[var(--color-text)]",
            "border-[3px] border-[var(--color-border-strong)]",
            "text-base placeholder:text-[var(--color-text-tertiary)]",
            "focus:border-[var(--color-arcade-yellow)] focus:outline-none",
            "focus:shadow-[0_0_10px_rgba(250,204,21,0.3)]",
          ],
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Textarea.displayName = "Textarea"

export { Textarea }
