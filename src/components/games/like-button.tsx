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
  const { data: session } = useSession()
  const router = useRouter()
  const [likes, setLikes] = useState(initialLikes)
  const [liked, setLiked] = useState(initialLiked)
  const [loading, setLoading] = useState(false)

  const handleLike = async () => {
    if (loading) {
      return
    }

    if (!session?.user?.id) {
      router.push(`/login?callbackUrl=${encodeURIComponent(`/play/${slug}`)}`)
      return
    }

    setLoading(true)

    try {
      const res = await fetch(`/api/games/${gameId}/like`, {
        method: "POST",
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || "Failed to update like")
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
      className="gap-2 font-arcade flex-1 sm:flex-none min-w-[108px]"
      onClick={handleLike}
      disabled={loading}
    >
      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Heart className="h-4 w-4" />}
      {liked ? "[SAVED]" : "[SAVE_FAV]"}
      <span className="text-[10px]">{formatNumber(likes)}</span>
    </Button>
  )
}
