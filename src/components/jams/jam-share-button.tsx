"use client"

import { useMemo, useState } from "react"
import { Check, Copy, Facebook, Loader2, MessageCircle, Send, Share2 } from "lucide-react"
import { Button } from "@/components/ui/button"

type ShareTarget = {
  label: string
  href: string
  icon: typeof Share2
}

export function JamShareButton({ title }: { title: string }) {
  const [sharing, setSharing] = useState(false)
  const [shared, setShared] = useState(false)

  const shareUrl = typeof window !== "undefined" ? window.location.href : ""
  const encodedUrl = encodeURIComponent(shareUrl)
  const shareMessage = useMemo(
    () => shareUrl
      ? `${shareUrl}\nJoin the ${title} game jam on VibeGames.Ninja`
      : `Join the ${title} game jam on VibeGames.Ninja`,
    [shareUrl, title]
  )
  const encodedShareMessage = encodeURIComponent(shareMessage)
  const encodedTitle = encodeURIComponent(`Join the ${title} game jam on VibeGames.Ninja`)
  const shareTargets = useMemo<ShareTarget[]>(() => [
    {
      label: "X",
      href: `https://twitter.com/intent/tweet?text=${encodedShareMessage}`,
      icon: Share2,
    },
    {
      label: "Reddit",
      href: `https://www.reddit.com/submit?url=${encodedUrl}&title=${encodedTitle}`,
      icon: MessageCircle,
    },
    {
      label: "Facebook",
      href: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}&quote=${encodeURIComponent(`Join the ${title} game jam on VibeGames.Ninja`)}`,
      icon: Facebook,
    },
    {
      label: "WhatsApp",
      href: `https://wa.me/?text=${encodedShareMessage}`,
      icon: Send,
    },
  ], [encodedShareMessage, encodedTitle, encodedUrl, title])

  function markShared() {
    setShared(true)
    window.setTimeout(() => setShared(false), 2000)
  }

  async function handleShare() {
    if (sharing || !shareUrl) {
      return
    }

    setSharing(true)

    try {
      if (navigator.share) {
        await navigator.share({ title, text: shareMessage })
      } else if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(shareMessage)
      } else {
        throw new Error("Clipboard not available")
      }

      markShared()
    } catch (error) {
      if (!(error instanceof DOMException && error.name === "AbortError")) {
        console.error("Jam share failed:", error)
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
        className="gap-2 font-arcade"
        onClick={handleShare}
        disabled={sharing}
      >
        {sharing ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : shared ? (
          <Check className="h-4 w-4" />
        ) : (
          <Copy className="h-4 w-4" />
        )}
        {shared ? "[COPIED]" : "[SHARE JAM]"}
      </Button>

      {shareTargets.map((target) => {
        const Icon = target.icon
        return (
          <a
            key={target.label}
            href={target.href}
            target="_blank"
            rel="noreferrer"
            className="inline-flex h-10 min-w-10 items-center justify-center rounded-md border border-[var(--color-border)] bg-transparent px-3 text-[var(--color-text-secondary)] transition-colors hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]"
            aria-label={`Share jam on ${target.label}`}
            title={`Share jam on ${target.label}`}
          >
            <Icon className="h-4 w-4" />
          </a>
        )
      })}
    </div>
  )
}
