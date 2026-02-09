"use client"

import { useState } from "react"
import { Check, Loader2, Share2 } from "lucide-react"
import { Button } from "@/components/ui/button"

interface ShareButtonProps {
  title: string
}

export function ShareButton({ title }: ShareButtonProps) {
  const [sharing, setSharing] = useState(false)
  const [shared, setShared] = useState(false)

  const handleShare = async () => {
    if (sharing) {
      return
    }

    setSharing(true)

    try {
      const url = window.location.href

      if (navigator.share) {
        await navigator.share({ title, url })
      } else if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(url)
      }

      setShared(true)
      setTimeout(() => setShared(false), 2000)
    } catch (error) {
      if (!(error instanceof DOMException && error.name === "AbortError")) {
        console.error("Share failed:", error)
      }
    } finally {
      setSharing(false)
    }
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      className="gap-2 font-arcade flex-1 sm:flex-none min-w-[108px]"
      onClick={handleShare}
      disabled={sharing}
    >
      {sharing ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : shared ? (
        <Check className="h-4 w-4" />
      ) : (
        <Share2 className="h-4 w-4" />
      )}
      {shared ? "[COPIED]" : "[SHARE]"}
    </Button>
  )
}
