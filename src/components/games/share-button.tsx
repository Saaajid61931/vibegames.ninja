"use client"

import { useMemo, useState } from "react"
import { Check, Copy, Facebook, Loader2, MessageCircle, Send, Share2 } from "lucide-react"
import { Button } from "@/components/ui/button"

interface ShareButtonProps {
  gameId: string
  title: string
}

type ShareTarget = {
  label: string
  href: string
  icon: typeof Share2
}

export function ShareButton({ gameId, title }: ShareButtonProps) {
  const [sharing, setSharing] = useState(false)
  const [shared, setShared] = useState(false)

  const shareUrl = typeof window !== "undefined" ? window.location.href : ""
  const encodedUrl = encodeURIComponent(shareUrl)
  const encodedTitle = encodeURIComponent(`Play ${title} on VibeGames.Ninja`)
  const shareTargets = useMemo<ShareTarget[]>(() => [
    {
      label: "X",
      href: `https://twitter.com/intent/tweet?text=${encodedTitle}&url=${encodedUrl}`,
      icon: Share2,
    },
    {
      label: "Reddit",
      href: `https://www.reddit.com/submit?url=${encodedUrl}&title=${encodedTitle}`,
      icon: MessageCircle,
    },
    {
      label: "Facebook",
      href: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
      icon: Facebook,
    },
    {
      label: "Discord",
      href: `https://discord.com/channels/@me`,
      icon: Send,
    },
  ], [encodedTitle, encodedUrl])

  const trackShare = () => {
    void fetch(`/api/games/${gameId}/share`, {
      method: "POST",
      cache: "no-store",
    }).catch(() => undefined)
  }

  const markShared = () => {
    setShared(true)
    window.setTimeout(() => setShared(false), 2000)
  }

  const handleCopy = async () => {
    if (sharing || !shareUrl) {
      return
    }

    setSharing(true)

    try {
      if (navigator.share) {
        await navigator.share({ title, url: shareUrl })
      } else if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(shareUrl)
      } else {
        throw new Error("Clipboard not available")
      }

      trackShare()
      markShared()
    } catch (error) {
      if (!(error instanceof DOMException && error.name === "AbortError")) {
        console.error("Share failed:", error)
      }
    } finally {
      setSharing(false)
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="min-w-[108px] flex-1 gap-2 font-arcade sm:flex-none"
        onClick={handleCopy}
        disabled={sharing}
      >
        {sharing ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : shared ? (
          <Check className="h-4 w-4" />
        ) : (
          <Copy className="h-4 w-4" />
        )}
        {shared ? "[COPIED]" : "[COPY LINK]"}
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
            className="inline-flex h-10 min-w-10 items-center justify-center rounded-md border border-[var(--color-border)] bg-transparent px-3 text-[var(--color-text-secondary)] transition-colors hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]"
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
