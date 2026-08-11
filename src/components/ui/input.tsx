import * as React from "react"
import { cn } from "@/lib/utils"

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  variant?: "studio" | "arcade"
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, variant = "arcade", ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex w-full transition-all duration-150",
          "disabled:cursor-not-allowed disabled:opacity-50",
          variant === "studio" && [
            "h-10 px-3 py-2",
            "rounded-md border border-border bg-canvas text-sm text-text placeholder:text-text-tertiary",
            "focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20",
          ],
          variant === "arcade" && [
            "h-12 px-4 py-2",
            "border-3 border-border-strong bg-canvas text-base text-text placeholder:text-text-tertiary",
            "focus:border-arcade-yellow focus:outline-none",
            "focus:shadow-none",
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
