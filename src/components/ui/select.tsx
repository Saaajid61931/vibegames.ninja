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
      "flex w-full cursor-pointer items-center justify-between",
      "disabled:cursor-not-allowed disabled:opacity-50",
      variant === "studio" && [
        "h-10 px-3 py-2",
        "bg-canvas text-text",
        "border border-border rounded-md",
        "text-sm placeholder:text-text-tertiary",
        "focus:border-primary focus:outline-none",
        "focus:ring-2 focus:ring-primary/20",
      ],
      variant === "arcade" && [
        "h-12 px-4 py-2",
        "bg-canvas text-text",
        "border-[3px] border-border-strong",
        "text-base",
        "focus:border-arcade-yellow focus:outline-none",
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
          "bg-surface text-text",
          "border border-border rounded-md",
          "shadow-lg",
        ],
        variant === "arcade" && [
          "bg-surface text-text",
          "border-[3px] border-border-strong",
          "shadow-[4px_4px_0_var(--color-canvas)]",
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
        "text-sm text-text",
        "rounded-sm",
        "focus:bg-surface-2",
      ],
      variant === "arcade" && [
        "text-base text-text",
        "focus:bg-canvas",
      ],
      className
    )}
    {...props}
  >
    <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
      <SelectPrimitive.ItemIndicator>
        <Check className={cn(
          "h-4 w-4",
          variant === "studio" ? "text-primary-text" : "text-arcade-yellow"
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
