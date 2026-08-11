import { cn } from "@/lib/utils"

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "arcade"
}

function Card({ className, variant = "arcade", ...props }: CardProps) {
  return (
    <div
      className={cn(
        "relative overflow-hidden",
        variant === "arcade" && [
          "border-3 border-border-strong bg-surface",
          "shadow-hard-4",
          "transition-all duration-150",
          "hover:border-primary",
          "hover:[--shadow-color:var(--color-primary)] hover:shadow-hard-8",
          "hover:-translate-x-0.5 hover:-translate-y-0.5",
        ],
        className
      )}
      {...props}
    />
  )
}

interface CardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "arcade"
}

function CardHeader({ className, variant = "arcade", ...props }: CardHeaderProps) {
  return (
    <div
      className={cn(
        "flex flex-col space-y-1.5 p-4",
        variant === "arcade" && [
          "border-b-3 border-border-strong",
          "bg-surface-2",
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
        "text-lg font-semibold text-text",
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
        "text-sm text-text-secondary",
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
  variant?: "arcade"
}

function CardFooter({ className, variant = "arcade", ...props }: CardFooterProps) {
  return (
    <div
      className={cn(
        "flex items-center p-4 pt-0",
        variant === "arcade" && [
          "mt-4 border-t-3 border-border-strong",
        ],
        className
      )}
      {...props}
    />
  )
}

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent }
