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
            "bg-canvas text-text",
            "border border-border rounded-md",
            "text-sm placeholder:text-text-tertiary",
            "focus:border-primary focus:outline-none",
            "focus:ring-2 focus:ring-primary/20",
          ],
          variant === "arcade" && [
            "px-4 py-3",
            "bg-canvas text-text",
            "border-[3px] border-border-strong",
            "text-base placeholder:text-text-tertiary",
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
Textarea.displayName = "Textarea"

export { Textarea }
