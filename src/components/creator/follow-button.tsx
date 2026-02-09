"use client"

import { useState } from "react"
import { usePathname, useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { Loader2, UserCheck, UserPlus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { formatNumber } from "@/lib/utils"

interface FollowButtonProps {
  creatorId: string
  creatorUsername?: string | null
  initialFollowers: number
  initialFollowing: boolean
}

export function FollowButton({
  creatorId,
  creatorUsername,
  initialFollowers,
  initialFollowing,
}: FollowButtonProps) {
  const { data: session } = useSession()
  const router = useRouter()
  const pathname = usePathname()

  const [followers, setFollowers] = useState(initialFollowers)
  const [following, setFollowing] = useState(initialFollowing)
  const [loading, setLoading] = useState(false)

  const isOwnProfile = session?.user?.id === creatorId

  const handleToggleFollow = async () => {
    if (isOwnProfile || loading) {
      return
    }

    if (!session?.user?.id) {
      const callbackUrl = encodeURIComponent(pathname || `/creator/${creatorUsername || ""}`)
      router.push(`/login?callbackUrl=${callbackUrl}`)
      return
    }

    setLoading(true)

    try {
      const res = await fetch(`/api/creators/${creatorId}/follow`, {
        method: "POST",
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || "Failed to update follow")
      }

      setFollowing(Boolean(data.following))
      setFollowers(Number(data.followers) || 0)
    } catch (error) {
      console.error("Follow toggle failed:", error)
    } finally {
      setLoading(false)
    }
  }

  if (isOwnProfile) {
    return (
      <div className="w-full rounded-md border border-[var(--color-border)] px-3 py-2 text-center text-xs text-[var(--color-text-tertiary)]">
        This is your creator profile
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2">
      <Button
        type="button"
        onClick={handleToggleFollow}
        disabled={loading}
        variant={following ? "outline" : "default"}
        className="gap-2"
      >
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : following ? (
          <UserCheck className="h-4 w-4" />
        ) : (
          <UserPlus className="h-4 w-4" />
        )}
        {following ? "Following" : "Follow"}
      </Button>
      <span className="text-xs text-[var(--color-text-tertiary)]">{formatNumber(followers)} followers</span>
    </div>
  )
}
