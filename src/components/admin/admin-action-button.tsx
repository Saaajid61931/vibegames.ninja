"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"
import { Button, type ButtonProps } from "@/components/ui/button"

interface AdminActionButtonProps extends Omit<ButtonProps, "onClick"> {
  action: string
  method?: string
  confirmMessage?: string
  children: React.ReactNode
}

export function AdminActionButton({
  action,
  method = "POST",
  confirmMessage,
  children,
  ...buttonProps
}: AdminActionButtonProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const handleClick = async () => {
    if (confirmMessage && !window.confirm(confirmMessage)) return

    setLoading(true)
    try {
      const res = await fetch(action, { method })
      if (res.ok) {
        router.refresh()
      } else {
        const data = await res.json().catch(() => ({}))
        alert(data.error || "Action failed. Please try again.")
      }
    } catch {
      alert("Network error. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button
      {...buttonProps}
      disabled={loading || buttonProps.disabled}
      onClick={handleClick}
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
  )
}
