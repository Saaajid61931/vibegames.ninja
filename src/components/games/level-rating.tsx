"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { StarRating } from "@/components/games/star-rating"

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

  const submit = async (score: number) => {
    if (!isAuthenticated) {
      router.push("/login")
      return
    }

    if (saving) {
      return
    }

    setSaving(true)
    try {
      const res = await fetch(`/api/levels/${levelId}/rate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ score }),
      })
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || "Failed to save rating")
      }

      setUserScore(data.score)
      setAverage(data.avgRating)
      setCount(data.ratingCount)
    } catch (error) {
      console.error(error)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="border-2 border-[#4a4a6a] bg-[#1a1a2e] px-4 py-3">
      <p className="font-arcade text-xs text-[#4a4a6a] mb-2">RATE THIS LEVEL</p>
      <div className="flex flex-wrap items-center gap-3">
        <StarRating value={userScore ?? 0} onChange={submit} disabled={saving} />
        <span className="font-arcade text-xs text-white">
          {(average || 0).toFixed(1)} / 5 ({count})
        </span>
      </div>
    </div>
  )
}
