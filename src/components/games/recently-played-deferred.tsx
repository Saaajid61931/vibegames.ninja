"use client"

import dynamic from "next/dynamic"
import { useEffect, useState } from "react"
import type { GameCardData } from "@/types"

const DeferredRecentlyPlayed = dynamic(
  () => import("@/components/games/recently-played").then((mod) => mod.RecentlyPlayed),
  {
    ssr: false,
    loading: () => null,
  }
)

interface RecentlyPlayedDeferredProps {
  games: GameCardData[]
  animateThumbnailSlides?: boolean
}

export function RecentlyPlayedDeferred({
  games,
  animateThumbnailSlides = true,
}: RecentlyPlayedDeferredProps) {
  const [shouldRender, setShouldRender] = useState(false)

  useEffect(() => {
    let cancelled = false
    let firstFrameId: number | null = null
    let secondFrameId: number | null = null

    firstFrameId = window.requestAnimationFrame(() => {
      secondFrameId = window.requestAnimationFrame(() => {
        if (!cancelled) {
          setShouldRender(true)
        }
      })
    })

    return () => {
      cancelled = true

      if (firstFrameId !== null) {
        window.cancelAnimationFrame(firstFrameId)
      }

      if (secondFrameId !== null) {
        window.cancelAnimationFrame(secondFrameId)
      }
    }
  }, [])

  if (!shouldRender) {
    return null
  }

  return (
    <DeferredRecentlyPlayed
      games={games}
      animateThumbnailSlides={animateThumbnailSlides}
    />
  )
}
