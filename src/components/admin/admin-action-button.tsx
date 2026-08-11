"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"
import { Button, type ButtonProps } from "@/components/ui/button"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import { useToast } from "@/components/ui/toast"

interface AdminActionButtonProps extends Omit<ButtonProps, "onClick"> {
  action: string
  method?: string
  confirmMessage?: string
  successMessage?: string
  children: React.ReactNode
}

export function AdminActionButton({
  action,
  method = "POST",
  confirmMessage,
  successMessage = "The admin action was completed.",
  children,
  ...buttonProps
}: AdminActionButtonProps) {
  const router = useRouter()
  const showToast = useToast()
  const [loading, setLoading] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)

  const runAction = async () => {
    setLoading(true)
    try {
      const res = await fetch(action, { method })
      if (res.ok) {
        showToast({ title: "Action complete", description: successMessage, tone: "success" })
        router.refresh()
      } else {
        const data = await res.json().catch(() => ({}))
        showToast({
          title: "Action failed",
          description: data.error || "Please try again.",
          tone: "error",
        })
      }
    } catch {
      showToast({
        title: "Network error",
        description: "Check your connection and try again.",
        tone: "error",
      })
    } finally {
      setLoading(false)
    }
  }

  const requiresConfirmation = Boolean(confirmMessage) || buttonProps.variant === "destructive"

  return (
    <>
      <Button
        {...buttonProps}
        disabled={loading || buttonProps.disabled}
        onClick={() => {
          if (requiresConfirmation) {
            setConfirmOpen(true)
          } else {
            void runAction()
          }
        }}
      >
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Working...
          </>
        ) : (
          children
        )}
      </Button>
      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Confirm admin action"
        description={confirmMessage || "This action changes moderated content and may not be easy to reverse."}
        confirmLabel="Continue"
        confirmVariant={buttonProps.variant === "destructive" ? "arcade-red" : "arcade"}
        onConfirm={runAction}
      />
    </>
  )
}
