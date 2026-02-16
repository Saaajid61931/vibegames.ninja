"use client"

import { useCallback, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Star, Play, SquarePen, Loader2, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { timeAgo } from "@/lib/utils"

const PAGE_SIZE = 20

interface LevelListItem {
  id: string
  name: string
  description: string | null
  thumbnail: string | null
  plays: number
  avgRating: number
  ratingCount: number
  createdAt: string
  creator: {
    id: string
    name: string | null
    username: string | null
  }
}

interface CommunityLevelsProps {
  gameId: string
  slug: string
  selectedLevelId?: string | null
  currentUserId?: string | null
}

interface LevelsResponse {
  data?: LevelListItem[]
  total?: number
  hasMore?: boolean
  error?: string
}

export function CommunityLevels({ gameId, slug, selectedLevelId, currentUserId }: CommunityLevelsProps) {
  const router = useRouter()
  const [levels, setLevels] = useState<LevelListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [sort, setSort] = useState<"new" | "top" | "plays">("new")
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [hasMore, setHasMore] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [error, setError] = useState("")

  const fetchLevels = useCallback(async (nextPage: number, append: boolean) => {
    if (append) {
      setLoadingMore(true)
    } else {
      setLoading(true)
    }

    setError("")

    try {
      const params = new URLSearchParams({
        sort,
        page: String(nextPage),
        limit: String(PAGE_SIZE),
      })

      const res = await fetch(`/api/games/${gameId}/levels?${params.toString()}`)
      const data = (await res.json()) as LevelsResponse

      if (!res.ok) {
        throw new Error(data.error || "Failed to load levels")
      }

      const nextLevels = Array.isArray(data.data) ? data.data : []
      setLevels((prev) => (append ? [...prev, ...nextLevels] : nextLevels))
      setPage(nextPage)
      setHasMore(Boolean(data.hasMore))
      setTotal((prevTotal) =>
        typeof data.total === "number"
          ? data.total
          : append
            ? prevTotal + nextLevels.length
            : nextLevels.length
      )
    } catch (fetchError) {
      setError(fetchError instanceof Error ? fetchError.message : "Failed to load levels")
    } finally {
      if (append) {
        setLoadingMore(false)
      } else {
        setLoading(false)
      }
    }
  }, [gameId, sort])

  useEffect(() => {
    void fetchLevels(1, false)
  }, [fetchLevels])

  const handleDeleteLevel = async (level: LevelListItem) => {
    if (!window.confirm(`Delete "${level.name}"? This cannot be undone.`)) {
      return
    }

    setDeletingId(level.id)
    setError("")

    try {
      const res = await fetch(`/api/levels/${level.id}`, { method: "DELETE" })
      const data = (await res.json()) as { error?: string }

      if (!res.ok) {
        throw new Error(data.error || "Failed to delete level")
      }

      setLevels((prev) => prev.filter((item) => item.id !== level.id))
      setTotal((prevTotal) => Math.max(prevTotal - 1, 0))

      if (selectedLevelId === level.id) {
        router.push(`/play/${slug}`)
      }
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "Failed to delete level")
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="border-2 border-[#4a4a6a] bg-[#0d0d15] p-4 sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <h3 className="font-arcade text-xs sm:text-sm text-[#ffff00]">COMMUNITY LEVELS {total > 0 ? `(${total})` : ""}</h3>
        <div className="flex flex-wrap gap-2">
          <Button variant={sort === "new" ? "arcade" : "arcade-outline"} size="sm" onClick={() => setSort("new")}>NEW</Button>
          <Button variant={sort === "top" ? "arcade" : "arcade-outline"} size="sm" onClick={() => setSort("top")}>TOP</Button>
          <Button variant={sort === "plays" ? "arcade" : "arcade-outline"} size="sm" onClick={() => setSort("plays")}>PLAYS</Button>
          <Link href={`/play/${slug}/editor`}>
            <Button variant="arcade" size="sm" className="gap-2">
              <SquarePen className="h-4 w-4" />
              CREATE LEVEL
            </Button>
          </Link>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 text-[#ffff00] animate-spin" />
        </div>
      ) : levels.length === 0 ? (
        <div className="space-y-2">
          {error && <p className="font-arcade text-[10px] text-[#ff0040]">{error}</p>}
          <p className="font-arcade text-xs text-[#4a4a6a]">No levels yet. Be the first to build one.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {error && <p className="font-arcade text-[10px] text-[#ff0040]">{error}</p>}

          {levels.map((level) => {
            const active = selectedLevelId === level.id
            const isOwner = currentUserId === level.creator.id

            return (
              <div
                key={level.id}
                className={`border p-3 transition-colors ${
                  active
                    ? "border-[#ffff00] bg-[#1a1a2e]"
                    : "border-[#2e3446] bg-[#111626] hover:border-[#4a4a6a]"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <Link href={`/play/${slug}?level=${level.id}`} className="min-w-0 flex-1">
                    <h4 className="font-arcade text-xs text-white truncate">{level.name}</h4>
                    {level.description ? (
                      <p className="font-arcade text-[10px] text-[#4a4a6a] mt-1 line-clamp-2">{level.description}</p>
                    ) : null}
                    <p className="font-arcade text-[10px] text-[#4a4a6a] mt-2">
                      by {level.creator.username || level.creator.name || "anonymous"} • {timeAgo(new Date(level.createdAt))}
                    </p>
                  </Link>

                  <div className="text-right space-y-1">
                    <div className="inline-flex items-center gap-1 text-[#ffff00] font-arcade text-[10px]">
                      <Star className="h-3 w-3 fill-[#ffff00]" />
                      {level.avgRating.toFixed(1)}
                      <span className="text-[#4a4a6a]">({level.ratingCount})</span>
                    </div>
                    <div className="inline-flex items-center gap-1 text-[#4a4a6a] font-arcade text-[10px]">
                      <Play className="h-3 w-3" />
                      {level.plays}
                    </div>
                  </div>
                </div>

                {isOwner && (
                  <div className="mt-3 flex flex-wrap justify-end gap-2">
                    <Button asChild variant="arcade-outline" size="sm" className="gap-2">
                      <Link href={`/play/${slug}/editor?level=${level.id}`}>EDIT</Link>
                    </Button>

                    <Button
                      type="button"
                      variant="arcade-red"
                      size="sm"
                      className="gap-2"
                      disabled={deletingId === level.id}
                      onClick={() => {
                        void handleDeleteLevel(level)
                      }}
                    >
                      {deletingId === level.id ? (
                        <>
                          <Loader2 className="h-3 w-3 animate-spin" />
                          DELETING...
                        </>
                      ) : (
                        <>
                          <Trash2 className="h-3 w-3" />
                          DELETE
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </div>
            )
          })}

          {hasMore && (
            <div className="flex justify-center pt-2">
              <Button
                type="button"
                variant="arcade-outline"
                size="sm"
                disabled={loadingMore}
                onClick={() => {
                  void fetchLevels(page + 1, true)
                }}
              >
                {loadingMore ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    LOADING...
                  </>
                ) : (
                  "LOAD MORE"
                )}
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
