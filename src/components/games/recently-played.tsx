"use client"

import { useEffect, useState } from "react"
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

export function RecentlyPlayed({
  games,
  animateThumbnailSlides = true,
}: RecentlyPlayedProps) {
  const [recentGames, setRecentGames] = useState<GameCardData[]>([])

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem("vg-recently-played")
      if (!raw) {
        setRecentGames([])
        return
      }

      const parsed = JSON.parse(raw) as RecentEntry[]
      if (!Array.isArray(parsed) || parsed.length === 0) {
        setRecentGames([])
        return
      }

      const gamesById = new Map(games.map((game) => [game.id, game]))
      const ordered = parsed
        .map((entry) => gamesById.get(entry.gameId))
        .filter((game): game is GameCardData => Boolean(game))

      setRecentGames(ordered.slice(0, 4))
    } catch {
      setRecentGames([])
    }
  }, [games])

  if (recentGames.length === 0) {
    return null
  }

  return (
    <section className="py-14 sm:py-20 border-b-2 sm:border-b-4 border-[#4a4a6a] bg-[#11111d]">
      <div className="container mx-auto px-4">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="mb-2 flex items-center gap-2">
              <Clock3 className="h-5 w-5 text-[#00d1ff]" />
              <span className="font-pixel text-[10px] text-[#00d1ff]">CONTINUE PLAYING</span>
            </div>
            <h2 className="font-pixel text-xl text-white sm:text-2xl md:text-3xl">RECENT RUNS</h2>
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
