"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"
import { StarRating } from "@/components/games/star-rating"
import { rateGame } from "@/actions/ratings"

interface GameRatingProps {
  gameId: string
  initialAverage: number
  initialCount: number
  initialUserScore: number | null
  isAuthenticated: boolean
}

export function GameRating({
  gameId,
  initialAverage,
  initialCount,
  initialUserScore,
  isAuthenticated,
}: GameRatingProps) {
  const router = useRouter()
  const [average, setAverage] = useState(initialAverage)
  const [count, setCount] = useState(initialCount)
  const [userScore, setUserScore] = useState(initialUserScore)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const submit = async (score: number) => {
    if (!isAuthenticated) {
      router.push("/login")
      return
    }

    if (saving) {
      return
    }

    setSaving(true)
    setError(null)
    try {
      const result = await rateGame(gameId, score)
      if (!result.success) {
        setError(result.error)
        return
      }

      setUserScore(result.score)
      setAverage(result.avgRating)
      setCount(result.ratingCount)
    } catch (err) {
      console.error(err)
      setError("Failed to save rating. Please try again.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="border-2 border-border-strong bg-surface-2 px-4 py-3">
      <p className="font-arcade text-xs text-text-secondary mb-2">RATE THIS GAME</p>
      <div className="flex flex-wrap items-center gap-3">
        <StarRating value={userScore ?? 0} onChange={submit} disabled={saving} />
        {saving ? (
          <Loader2 className="h-4 w-4 text-arcade-yellow animate-spin" />
        ) : (
          <span className="font-arcade text-xs text-white">
            {(average || 0).toFixed(1)} / 5 ({count})
          </span>
        )}
      </div>
      {error && (
        <p className="font-arcade text-xs text-red-400 mt-2">{error}</p>
      )}
    </div>
  )
}
