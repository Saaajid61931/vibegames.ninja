"use client"

import { Star } from "lucide-react"

interface StarRatingProps {
  value: number
  onChange?: (next: number) => void
  size?: "sm" | "md"
  disabled?: boolean
}

export function StarRating({ value, onChange, size = "md", disabled = false }: StarRatingProps) {
  const stars = [1, 2, 3, 4, 5]
  const iconSize = size === "sm" ? "h-4 w-4" : "h-5 w-5"

  return (
    <div className="flex items-center gap-1">
      {stars.map((star) => {
        const active = value >= star
        return (
          <button
            key={star}
            type="button"
            onClick={() => onChange?.(star)}
            disabled={disabled || !onChange}
            className="disabled:cursor-default"
            aria-label={`Rate ${star} stars`}
          >
            <Star
              className={`${iconSize} ${active ? "fill-arcade-yellow text-arcade-yellow" : "text-text-secondary"}`}
            />
          </button>
        )
      })}
    </div>
  )
}
