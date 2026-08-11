"use client"

import * as DialogPrimitive from "@radix-ui/react-dialog"
import { Loader2 } from "lucide-react"
import { useState } from "react"
import { Button, type ButtonProps } from "@/components/ui/button"

interface ConfirmDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description: string
  confirmLabel?: string
  cancelLabel?: string
  confirmVariant?: ButtonProps["variant"]
  onConfirm: () => void | Promise<void>
}

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  confirmVariant = "arcade-red",
  onConfirm,
}: ConfirmDialogProps) {
  const [pending, setPending] = useState(false)

  const confirm = async () => {
    setPending(true)
    try {
      await onConfirm()
      onOpenChange(false)
    } finally {
      setPending(false)
    }
  }

  return (
    <DialogPrimitive.Root
      open={open}
      onOpenChange={(nextOpen) => {
        if (!pending) onOpenChange(nextOpen)
      }}
    >
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm" />
        <DialogPrimitive.Content className="fixed left-1/2 top-1/2 z-50 w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 border-3 border-border-strong bg-surface p-6 shadow-hard-8">
          <DialogPrimitive.Title className="heading-pixel-sm text-text">
            {title}
          </DialogPrimitive.Title>
          <DialogPrimitive.Description className="mt-3 text-sm leading-6 text-text-secondary">
            {description}
          </DialogPrimitive.Description>
          <div className="mt-6 flex justify-end gap-3">
            <DialogPrimitive.Close asChild>
              <Button variant="outline" disabled={pending}>{cancelLabel}</Button>
            </DialogPrimitive.Close>
            <Button
              variant={confirmVariant}
              disabled={pending}
              onClick={() => void confirm()}
            >
              {pending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {pending ? "Working..." : confirmLabel}
            </Button>
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  )
}
