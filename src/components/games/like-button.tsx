"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { Heart, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { formatNumber } from "@/lib/utils"

interface LikeButtonProps {
  gameId: string
  slug: string
  initialLikes: number
  initialLiked: boolean
}

export function LikeButton({ gameId, slug, initialLikes, initialLiked }: LikeButtonProps) {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [likes, setLikes] = useState(initialLikes)
  const [liked, setLiked] = useState(initialLiked)
  const [loading, setLoading] = useState(false)

  const handleLike = async () => {
    if (loading || status === "loading") {
      return
    }

    const callbackUrl = encodeURIComponent(`/play/${slug}`)

    if (!session?.user?.id) {
      router.push(`/login?callbackUrl=${callbackUrl}`)
      return
    }

    setLoading(true)

    try {
      const res = await fetch(`/api/games/${gameId}/like`, {
        method: "POST",
      })

      if (res.status === 401) {
        router.push(`/login?callbackUrl=${callbackUrl}`)
        return
      }

      const data = await res.json().catch(() => ({} as { detail?: string; error?: string; liked?: boolean; likes?: number }))
      if (!res.ok) {
        throw new Error(data.detail || data.error || "Failed to update like")
      }

      setLiked(Boolean(data.liked))
      setLikes(Number(data.likes) || 0)
    } catch (error) {
      console.error("Like toggle failed:", error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button
      type="button"
      variant={liked ? "default" : "outline"}
      size="sm"
      className="min-w-24 flex-1 gap-2 rounded-lg sm:flex-none"
      onClick={handleLike}
      disabled={loading || status === "loading"}
      aria-pressed={liked}
    >
      {loading || status === "loading" ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Heart className={`h-4 w-4 ${liked ? "fill-current" : ""}`} />
      )}
      {liked ? "Liked" : "Like"}
      <span className="text-xs opacity-75">{formatNumber(likes)}</span>
    </Button>
  )
}
