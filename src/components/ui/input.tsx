import * as React from "react"
import { cn } from "@/lib/utils"

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  variant?: "studio" | "arcade"
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, variant = "studio", ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex w-full transition-all duration-150",
          "disabled:cursor-not-allowed disabled:opacity-50",
          variant === "studio" && [
            "h-10 px-3 py-2",
            "bg-[var(--color-base)] text-[var(--color-text)]",
            "border border-[var(--color-border)] rounded-md",
            "text-sm placeholder:text-[var(--color-text-tertiary)]",
            "focus:border-[var(--color-primary)] focus:outline-none",
            "focus:ring-2 focus:ring-[var(--color-primary)]/20",
          ],
          variant === "arcade" && [
            "h-12 px-4 py-2",
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
Input.displayName = "Input"

export { Input }
