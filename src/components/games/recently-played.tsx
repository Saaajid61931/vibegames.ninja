"use client"

import { useMemo, useSyncExternalStore } from "react"
import { Clock3 } from "lucide-react"
import { GameCard } from "@/components/games/game-card"
import type { GameCardData } from "@/types"

type RecentEntry = {
  gameId: string
  playedAt: string
}

interface RecentlyPlayedProps {
  games: GameCardData[]
  animateThumbnailSlides?: boolean
}

const RECENTLY_PLAYED_STORAGE_KEY = "vg-recently-played"
const RECENTLY_PLAYED_EVENT = "vg-recently-played-change"

function subscribeToRecentlyPlayed(onStoreChange: () => void) {
  window.addEventListener("storage", onStoreChange)
  window.addEventListener(RECENTLY_PLAYED_EVENT, onStoreChange)

  return () => {
    window.removeEventListener("storage", onStoreChange)
    window.removeEventListener(RECENTLY_PLAYED_EVENT, onStoreChange)
  }
}

function getRecentlyPlayedSnapshot() {
  try {
    return window.localStorage.getItem(RECENTLY_PLAYED_STORAGE_KEY) || ""
  } catch {
    return ""
  }
}

function getServerRecentlyPlayedSnapshot() {
  return ""
}

export function RecentlyPlayed({
  games,
  animateThumbnailSlides = true,
}: RecentlyPlayedProps) {
  const recentGamesSnapshot = useSyncExternalStore(
    subscribeToRecentlyPlayed,
    getRecentlyPlayedSnapshot,
    getServerRecentlyPlayedSnapshot
  )

  const recentGames = useMemo(() => {
    try {
      if (!recentGamesSnapshot) {
        return []
      }

      const parsed = JSON.parse(recentGamesSnapshot) as RecentEntry[]
      if (!Array.isArray(parsed) || parsed.length === 0) {
        return []
      }

      const gamesById = new Map(games.map((game) => [game.id, game]))
      const ordered = parsed
        .map((entry) => gamesById.get(entry.gameId))
        .filter((game): game is GameCardData => Boolean(game))

      return ordered.slice(0, 4)
    } catch {
      return []
    }
  }, [games, recentGamesSnapshot])

  if (recentGames.length === 0) {
    return null
  }

  return (
    <section className="py-14 sm:py-20 border-b-2 sm:border-b-4 border-border-strong bg-surface">
      <div className="container mx-auto px-4">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="mb-2 flex items-center gap-2">
              <Clock3 className="h-5 w-5 text-arcade-cyan" />
              <span className="text-kicker text-arcade-cyan">CONTINUE PLAYING</span>
            </div>
            <h2 className="heading-pixel-lg text-white">RECENT RUNS</h2>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-4">
          {recentGames.map((game) => (
            <GameCard
              key={game.id}
              game={game}
              animateThumbnailSlides={animateThumbnailSlides}
            />
          ))}
        </div>
      </div>
    </section>
  )
}
