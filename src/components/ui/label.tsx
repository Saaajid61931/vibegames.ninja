"use client"

import * as React from "react"
import * as LabelPrimitive from "@radix-ui/react-label"
import { cn } from "@/lib/utils"

interface LabelProps extends React.ComponentPropsWithoutRef<typeof LabelPrimitive.Root> {
  variant?: "studio" | "arcade"
}

const Label = React.forwardRef<
  React.ElementRef<typeof LabelPrimitive.Root>,
  LabelProps
>(({ className, variant = "studio", ...props }, ref) => (
  <LabelPrimitive.Root
    ref={ref}
    className={cn(
      "leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70",
      variant === "studio" && [
        "text-sm font-medium text-[var(--color-text-secondary)]",
      ],
      variant === "arcade" && [
        "text-[10px] font-bold uppercase tracking-wider text-[var(--color-arcade-yellow)] font-pixel",
      ],
      className
    )}
    {...props}
  />
))
Label.displayName = LabelPrimitive.Root.displayName

export { Label }
