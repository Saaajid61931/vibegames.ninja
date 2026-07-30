"use client"

import { useState } from "react"
import { Check, Copy, Loader2, Share2 } from "lucide-react"
import { Button } from "@/components/ui/button"

interface ShareButtonProps {
  gameId: string
  title: string
}

export function ShareButton({ gameId, title }: ShareButtonProps) {
  const [sharing, setSharing] = useState(false)
  const [shareFeedback, setShareFeedback] = useState<"shared" | "copied" | null>(null)

  const shareUrl = typeof window !== "undefined" ? window.location.href : ""
  const canUseNativeShare = typeof navigator !== "undefined" && typeof navigator.share === "function"
  const canCopyLink = typeof navigator !== "undefined" && typeof navigator.clipboard?.writeText === "function"
  const trackShare = () => {
    void fetch(`/api/games/${gameId}/share`, {
      method: "POST",
      cache: "no-store",
    }).catch(() => undefined)
  }

  const markFeedback = (type: "shared" | "copied") => {
    setShareFeedback(type)
    window.setTimeout(() => setShareFeedback(null), 2000)
  }

  const handlePrimaryShare = async () => {
    if (sharing || !shareUrl) {
      return
    }

    setSharing(true)

    try {
      if (canUseNativeShare) {
        await navigator.share({ title, url: shareUrl })
        trackShare()
        markFeedback("shared")
      } else if (canCopyLink) {
        await navigator.clipboard.writeText(shareUrl)
        trackShare()
        markFeedback("copied")
      } else {
        throw new Error("Clipboard not available")
      }
    } catch (error) {
      if (!(error instanceof DOMException && error.name === "AbortError")) {
        console.error("Share failed:", error)
      }
    } finally {
      setSharing(false)
    }
  }

  const primaryLabel = shareFeedback === "shared"
    ? "Shared"
    : shareFeedback === "copied"
      ? "Link copied"
      : canUseNativeShare
        ? "Share"
        : "Copy link"

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      className="min-w-24 flex-1 gap-2 rounded-lg sm:flex-none"
      onClick={handlePrimaryShare}
      disabled={sharing}
    >
      {sharing ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : shareFeedback ? (
        <Check className="h-4 w-4" />
      ) : canUseNativeShare ? (
        <Share2 className="h-4 w-4" />
      ) : (
        <Copy className="h-4 w-4" />
      )}
      {primaryLabel}
    </Button>
  )
}
