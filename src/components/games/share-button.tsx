"use client"

import { useMemo, useState } from "react"
import { Check, Copy, Loader2, Share2 } from "lucide-react"
import { Button } from "@/components/ui/button"

import React from "react"

function XIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  )
}

interface ShareButtonProps {
  gameId: string
  title: string
}

type ShareTarget = {
  label: string
  href: string
  icon: React.ComponentType<{ className?: string }>
}

export function ShareButton({ gameId, title }: ShareButtonProps) {
  const [sharing, setSharing] = useState(false)
  const [shareFeedback, setShareFeedback] = useState<"shared" | "copied" | null>(null)

  const shareUrl = typeof window !== "undefined" ? window.location.href : ""
  const canUseNativeShare = typeof navigator !== "undefined" && typeof navigator.share === "function"
  const canCopyLink = typeof navigator !== "undefined" && typeof navigator.clipboard?.writeText === "function"
  const encodedUrl = encodeURIComponent(shareUrl)
  const encodedTitle = encodeURIComponent(`Play ${title} on VibeGames.Ninja @VibeGamesNinja`)
  const shareTargets = useMemo<ShareTarget[]>(() => [
    {
      label: "X",
      href: `https://twitter.com/intent/tweet?text=${encodedTitle}&url=${encodedUrl}`,
      icon: XIcon,
    },
  ], [encodedTitle, encodedUrl])

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
    ? "[SHARED]"
    : shareFeedback === "copied"
      ? "[COPIED]"
      : canUseNativeShare
        ? "[SHARE]"
        : "[COPY LINK]"

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="min-w-[108px] flex-1 gap-2 font-arcade sm:flex-none"
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

      {shareTargets.map((target) => {
        const Icon = target.icon
        return (
          <a
            key={target.label}
            href={target.href}
            target="_blank"
            rel="noreferrer"
            onClick={trackShare}
            className="hidden h-10 min-w-10 items-center justify-center rounded-md border border-[var(--color-border)] bg-transparent px-3 text-[var(--color-text-secondary)] transition-colors hover:border-[var(--color-primary)] hover:text-[var(--color-primary)] sm:inline-flex"
            aria-label={`Share on ${target.label}`}
            title={`Share on ${target.label}`}
          >
            <Icon className="h-4 w-4" />
          </a>
        )
      })}
    </div>
  )
}
