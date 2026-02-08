"use client"

import * as React from "react"
import * as SelectPrimitive from "@radix-ui/react-select"
import { ChevronDown, Check } from "lucide-react"
import { cn } from "@/lib/utils"

const Select = SelectPrimitive.Root
const SelectGroup = SelectPrimitive.Group
const SelectValue = SelectPrimitive.Value

interface SelectTriggerProps extends React.ComponentPropsWithoutRef<typeof SelectPrimitive.Trigger> {
  variant?: "studio" | "arcade"
}

const SelectTrigger = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Trigger>,
  SelectTriggerProps
>(({ className, children, variant = "studio", ...props }, ref) => (
  <SelectPrimitive.Trigger
    ref={ref}
    className={cn(
      "flex w-full items-center justify-between",
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
        "text-base",
        "focus:border-[var(--color-arcade-yellow)] focus:outline-none",
      ],
      className
    )}
    {...props}
  >
    {children}
    <SelectPrimitive.Icon asChild>
      <ChevronDown className="h-4 w-4 opacity-50" />
    </SelectPrimitive.Icon>
  </SelectPrimitive.Trigger>
))
SelectTrigger.displayName = SelectPrimitive.Trigger.displayName

interface SelectContentProps extends React.ComponentPropsWithoutRef<typeof SelectPrimitive.Content> {
  variant?: "studio" | "arcade"
}

const SelectContent = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Content>,
  SelectContentProps
>(({ className, children, position = "popper", variant = "studio", ...props }, ref) => (
  <SelectPrimitive.Portal>
    <SelectPrimitive.Content
      ref={ref}
      className={cn(
        "relative z-50 max-h-96 min-w-[8rem] overflow-hidden",
        "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
        position === "popper" &&
          "data-[side=bottom]:translate-y-1 data-[side=left]:-translate-x-1 data-[side=right]:translate-x-1 data-[side=top]:-translate-y-1",
        variant === "studio" && [
          "bg-[var(--color-surface)] text-[var(--color-text)]",
          "border border-[var(--color-border)] rounded-md",
          "shadow-lg",
        ],
        variant === "arcade" && [
          "bg-[var(--color-surface)] text-[var(--color-text)]",
          "border-[3px] border-[var(--color-border-strong)]",
          "shadow-[4px_4px_0_var(--color-base)]",
        ],
        className
      )}
      position={position}
      {...props}
    >
      <SelectPrimitive.Viewport
        className={cn(
          "p-1",
          position === "popper" &&
            "h-[var(--radix-select-trigger-height)] w-full min-w-[var(--radix-select-trigger-width)]"
        )}
      >
        {children}
      </SelectPrimitive.Viewport>
    </SelectPrimitive.Content>
  </SelectPrimitive.Portal>
))
SelectContent.displayName = SelectPrimitive.Content.displayName

interface SelectItemProps extends React.ComponentPropsWithoutRef<typeof SelectPrimitive.Item> {
  variant?: "studio" | "arcade"
}

const SelectItem = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Item>,
  SelectItemProps
>(({ className, children, variant = "studio", ...props }, ref) => (
  <SelectPrimitive.Item
    ref={ref}
    className={cn(
      "relative flex w-full cursor-pointer select-none items-center py-2 pl-8 pr-2 outline-none",
      "data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
      variant === "studio" && [
        "text-sm text-[var(--color-text)]",
        "rounded-sm",
        "focus:bg-[var(--color-surface-2)]",
      ],
      variant === "arcade" && [
        "text-base text-[var(--color-text)]",
        "focus:bg-[var(--color-base)]",
      ],
      className
    )}
    {...props}
  >
    <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
      <SelectPrimitive.ItemIndicator>
        <Check className={cn(
          "h-4 w-4",
          variant === "studio" ? "text-[var(--color-primary)]" : "text-[var(--color-arcade-yellow)]"
        )} />
      </SelectPrimitive.ItemIndicator>
    </span>
    <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
  </SelectPrimitive.Item>
))
SelectItem.displayName = SelectPrimitive.Item.displayName

export {
  Select,
  SelectGroup,
  SelectValue,
  SelectTrigger,
  SelectContent,
  SelectItem,
}
