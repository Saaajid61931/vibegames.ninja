"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"
import { StarRating } from "@/components/games/star-rating"
import { rateLevel } from "@/actions/ratings"

interface LevelRatingProps {
  levelId: string
  initialAverage: number
  initialCount: number
  initialUserScore: number | null
  isAuthenticated: boolean
}

export function LevelRating({
  levelId,
  initialAverage,
  initialCount,
  initialUserScore,
  isAuthenticated,
}: LevelRatingProps) {
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
      const result = await rateLevel(levelId, score)
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
    <div className="border-2 border-[#4a4a6a] bg-[#1a1a2e] px-4 py-3">
      <p className="font-arcade text-xs text-[#4a4a6a] mb-2">RATE THIS LEVEL</p>
      <div className="flex flex-wrap items-center gap-3">
        <StarRating value={userScore ?? 0} onChange={submit} disabled={saving} />
        {saving ? (
          <Loader2 className="h-4 w-4 text-[#ffff00] animate-spin" />
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
