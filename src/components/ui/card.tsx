import { cn } from "@/lib/utils"

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "studio" | "arcade"
}

function Card({ className, variant = "studio", ...props }: CardProps) {
  return (
    <div
      className={cn(
        "relative overflow-hidden",
        variant === "studio" && [
          "bg-[var(--color-surface)]",
          "border border-[var(--color-border)]",
          "rounded-lg",
        ],
        variant === "arcade" && [
          "bg-[var(--color-surface)]",
          "border-[3px] border-[var(--color-border-strong)]",
          "shadow-[4px_4px_0_var(--color-base)]",
          "transition-all duration-150",
          "hover:border-[var(--color-primary)]",
          "hover:shadow-[6px_6px_0_var(--color-primary)]",
          "hover:-translate-x-0.5 hover:-translate-y-0.5",
        ],
        className
      )}
      {...props}
    />
  )
}

interface CardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "studio" | "arcade"
}

function CardHeader({ className, variant = "studio", ...props }: CardHeaderProps) {
  return (
    <div
      className={cn(
        "flex flex-col space-y-1.5 p-4",
        variant === "studio" && [
          "border-b border-[var(--color-border)]",
        ],
        variant === "arcade" && [
          "border-b-[3px] border-[var(--color-border-strong)]",
          "bg-[var(--color-surface-2)]",
        ],
        className
      )}
      {...props}
    />
  )
}

function CardTitle({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3
      className={cn(
        "text-lg font-semibold text-[var(--color-text)]",
        className
      )}
      {...props}
    />
  )
}

function CardDescription({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p
      className={cn(
        "text-sm text-[var(--color-text-secondary)]",
        className
      )}
      {...props}
    />
  )
}

function CardContent({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div 
      className={cn(
        "p-4",
        className
      )} 
      {...props} 
    />
  )
}

interface CardFooterProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "studio" | "arcade"
}

function CardFooter({ className, variant = "studio", ...props }: CardFooterProps) {
  return (
    <div
      className={cn(
        "flex items-center p-4 pt-0",
        variant === "studio" && [
          "border-t border-[var(--color-border)] mt-4",
        ],
        variant === "arcade" && [
          "border-t-[3px] border-[var(--color-border-strong)] mt-4",
        ],
        className
      )}
      {...props}
    />
  )
}

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent }
