"use client"

import { useEffect } from "react"

interface PlayTrackerProps {
  gameId: string
  levelId?: string | null
}

export function PlayTracker({ gameId, levelId }: PlayTrackerProps) {
  useEffect(() => {
    const params = new URLSearchParams()
    if (levelId) {
      params.set("levelId", levelId)
    }

    const endpoint = params.size > 0
      ? `/api/games/${gameId}/play?${params.toString()}`
      : `/api/games/${gameId}/play`

    const trackPlay = async () => {
      try {
        await fetch(endpoint, {
          method: "POST",
          cache: "no-store",
        })
      } catch (error) {
        console.error("Failed to track play", error)
      }
    }

    void trackPlay()
  }, [gameId, levelId])

  return null
}
