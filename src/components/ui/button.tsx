import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap font-medium transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        // Studio variants - clean, professional
        default: [
          "bg-[var(--color-primary)] text-white",
          "rounded-md",
          "hover:bg-[var(--color-primary-hover)]",
          "active:scale-[0.98]",
        ],
        secondary: [
          "bg-[var(--color-surface-2)] text-[var(--color-text)]",
          "border border-[var(--color-border)]",
          "rounded-md",
          "hover:bg-[var(--color-surface)] hover:border-[var(--color-border-strong)]",
        ],
        outline: [
          "bg-transparent text-[var(--color-text)]",
          "border border-[var(--color-border)]",
          "rounded-md",
          "hover:bg-[var(--color-surface)] hover:border-[var(--color-border-strong)]",
        ],
        ghost: [
          "bg-transparent text-[var(--color-text-secondary)]",
          "rounded-md",
          "hover:bg-[var(--color-surface)] hover:text-[var(--color-text)]",
        ],
        destructive: [
          "bg-[var(--color-danger)] text-white",
          "rounded-md",
          "hover:bg-[#dc2626]",
        ],
        success: [
          "bg-[var(--color-success)] text-white",
          "rounded-md",
          "hover:bg-[#16a34a]",
        ],
        // Arcade variants - chunky, playful
        arcade: [
          "bg-[var(--color-primary)] text-white",
          "border-[3px] border-white",
          "font-pixel text-xs uppercase tracking-wider",
          "shadow-[0_4px_0_var(--color-base)]",
          "hover:bg-[var(--color-arcade-yellow)] hover:text-[var(--color-base)]",
          "hover:-translate-y-0.5 hover:shadow-[0_6px_0_var(--color-base)]",
          "active:translate-y-1 active:shadow-[0_2px_0_var(--color-base)]",
        ],
        "arcade-red": [
          "bg-[var(--color-arcade-red)] text-white",
          "border-[3px] border-white",
          "font-pixel text-xs uppercase tracking-wider",
          "shadow-[0_4px_0_var(--color-base)]",
          "hover:bg-[var(--color-arcade-yellow)] hover:text-[var(--color-base)]",
          "hover:-translate-y-0.5 hover:shadow-[0_6px_0_var(--color-base)]",
          "active:translate-y-1 active:shadow-[0_2px_0_var(--color-base)]",
        ],
        "arcade-outline": [
          "bg-transparent text-white",
          "border-[3px] border-[var(--color-border-strong)]",
          "font-pixel text-xs uppercase tracking-wider",
          "hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]",
        ],
      },
      size: {
        default: "h-10 px-4 py-2 text-sm",
        sm: "h-10 px-3 text-xs",
        lg: "h-11 px-6 text-base",
        xl: "h-12 px-8 text-base",
        icon: "h-10 w-10",
        // Arcade sizes
        "arcade-sm": "h-10 px-4 py-2",
        "arcade-default": "h-12 px-6 py-3",
        "arcade-lg": "h-14 px-8 py-4",
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
