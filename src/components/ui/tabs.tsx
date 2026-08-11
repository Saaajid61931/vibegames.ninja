"use client"

import * as React from "react"
import * as TabsPrimitive from "@radix-ui/react-tabs"
import { cn } from "@/lib/utils"

const Tabs = TabsPrimitive.Root

interface TabsListProps extends React.ComponentPropsWithoutRef<typeof TabsPrimitive.List> {
  variant?: "studio" | "arcade"
}

const TabsList = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.List>,
  TabsListProps
>(({ className, variant = "studio", ...props }, ref) => (
  <TabsPrimitive.List
    ref={ref}
    className={cn(
      "inline-flex items-center justify-center gap-1",
      variant === "studio" && [
        "h-10 p-1",
        "bg-surface-2 rounded-lg",
      ],
      variant === "arcade" && [
        "h-12 p-1 gap-2",
        "bg-surface border-[3px] border-border-strong",
      ],
      className
    )}
    {...props}
  />
))
TabsList.displayName = TabsPrimitive.List.displayName

interface TabsTriggerProps extends React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger> {
  variant?: "studio" | "arcade"
}

const TabsTrigger = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Trigger>,
  TabsTriggerProps
>(({ className, variant = "studio", ...props }, ref) => (
  <TabsPrimitive.Trigger
    ref={ref}
    className={cn(
      "inline-flex items-center justify-center whitespace-nowrap transition-all",
      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
      "disabled:pointer-events-none disabled:opacity-50",
      variant === "studio" && [
        "px-3 py-1.5 text-sm font-medium rounded-md",
        "text-text-secondary",
        "data-[state=active]:bg-surface",
        "data-[state=active]:text-text",
        "data-[state=active]:shadow-sm",
      ],
      variant === "arcade" && [
        "px-4 py-2 text-xs font-bold uppercase tracking-widest font-sans",
        "border-2 border-transparent",
        "text-text-secondary",
        "data-[state=active]:border-arcade-yellow",
        "data-[state=active]:bg-arcade-yellow",
        "data-[state=active]:text-canvas",
        "data-[state=active]:shadow-[2px_2px_0_var(--color-primary)]",
      ],
      className
    )}
    {...props}
  />
))
TabsTrigger.displayName = TabsPrimitive.Trigger.displayName

const TabsContent = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Content
    ref={ref}
    className={cn(
      "mt-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
      className
    )}
    {...props}
  />
))
TabsContent.displayName = TabsPrimitive.Content.displayName

export { Tabs, TabsList, TabsTrigger, TabsContent }
