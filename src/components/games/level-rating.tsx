"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"
import { StarRating } from "@/components/games/star-rating"

interface LevelRatingProps {
  levelId: string
  initialAverage: number
  initialCount: number
  initialUserScore: number | null
  isAuthenticated: boolean
}

function isValidRatingResponse(value: unknown): value is {
  score: number
  avgRating: number
  ratingCount: number
} {
  if (typeof value !== "object" || value === null) {
    return false
  }

  const result = value as Record<string, unknown>
  return Number.isInteger(result.score)
    && typeof result.score === "number"
    && result.score >= 1
    && result.score <= 5
    && typeof result.avgRating === "number"
    && Number.isFinite(result.avgRating)
    && typeof result.ratingCount === "number"
    && Number.isInteger(result.ratingCount)
    && result.ratingCount >= 0
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
      const response = await fetch(`/api/levels/${levelId}/rate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ score }),
      })
      const result = await response.json().catch(() => null) as {
        error?: string
        message?: string
      } | null

      if (!response.ok) {
        setError(result?.message || result?.error || "Failed to save rating. Please try again.")
        return
      }

      if (!isValidRatingResponse(result)) {
        setError("The arcade returned an invalid rating response. Please try again.")
        return
      }

      setUserScore(result.score)
      setAverage(result.avgRating)
      setCount(result.ratingCount)
    } catch {
      setError("Failed to save rating. Please try again.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="border-2 border-border-strong bg-surface-2 px-4 py-3">
      <p className="font-arcade text-xs text-text-secondary mb-2">RATE THIS LEVEL</p>
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
        <p className="font-arcade text-xs text-red-400 mt-2" role="alert">{error}</p>
      )}
    </div>
  )
}
