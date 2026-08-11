import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex cursor-pointer items-center justify-center whitespace-nowrap font-medium transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-canvas disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
  {
    variants: {
      variant: {
        studio: [
          "bg-primary text-white",
          "rounded-md",
          "hover:bg-primary-hover",
          "active:scale-[0.98]",
        ],
        secondary: [
          "bg-surface-2 text-text",
          "border border-border",
          "rounded-md",
          "hover:border-border-strong hover:bg-surface",
        ],
        outline: [
          "bg-transparent text-text",
          "border border-border",
          "rounded-md",
          "hover:border-border-strong hover:bg-surface",
        ],
        ghost: [
          "bg-transparent text-text-secondary",
          "rounded-md",
          "hover:bg-surface hover:text-text",
        ],
        destructive: [
          "bg-danger text-white",
          "rounded-md",
          "hover:bg-danger-hover",
        ],
        success: [
          "bg-success text-white",
          "rounded-md",
          "hover:bg-success-hover",
        ],
        default: [
          "border-3 border-white bg-primary text-white",
          "font-sans text-xs font-bold uppercase tracking-widest",
          "shadow-hard-4",
          "hover:-translate-x-0.5 hover:-translate-y-0.5 hover:bg-arcade-yellow hover:text-canvas hover:shadow-hard-8",
          "active:translate-x-0.5 active:translate-y-0.5 active:shadow-hard-2",
        ],
        arcade: [
          "border-3 border-white bg-primary text-white",
          "font-sans text-xs font-bold uppercase tracking-widest",
          "shadow-hard-4",
          "hover:-translate-x-0.5 hover:-translate-y-0.5 hover:bg-arcade-yellow hover:text-canvas hover:shadow-hard-8",
          "active:translate-x-0.5 active:translate-y-0.5 active:shadow-hard-2",
        ],
        "arcade-red": [
          "border-3 border-white bg-arcade-red text-white",
          "font-sans text-xs font-bold uppercase tracking-widest",
          "shadow-hard-4",
          "hover:-translate-x-0.5 hover:-translate-y-0.5 hover:bg-arcade-yellow hover:text-canvas hover:shadow-hard-8",
          "active:translate-x-0.5 active:translate-y-0.5 active:shadow-hard-2",
        ],
        "arcade-outline": [
          "bg-transparent text-white",
          "border-3 border-border-strong",
          "font-sans text-xs font-bold uppercase tracking-widest",
          "hover:border-primary hover:text-primary-text",
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
      variant: "arcade",
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
