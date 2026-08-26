"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Star, Play, SquarePen, Loader2, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import { useToast } from "@/components/ui/toast"
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
  const showToast = useToast()
  const rootRef = useRef<HTMLDivElement>(null)
  const [hasIntersected, setHasIntersected] = useState(false)
  const [levels, setLevels] = useState<LevelListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [sort, setSort] = useState<"new" | "top" | "plays">("new")
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [hasMore, setHasMore] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<LevelListItem | null>(null)
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
    const root = rootRef.current
    if (!root || hasIntersected) {
      return
    }

    if (typeof IntersectionObserver === "undefined") {
      setHasIntersected(true)
      return
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setHasIntersected(true)
          observer.disconnect()
        }
      },
      { rootMargin: "300px 0px" }
    )

    observer.observe(root)
    return () => observer.disconnect()
  }, [hasIntersected])

  useEffect(() => {
    if (!hasIntersected) {
      return
    }

    void fetchLevels(1, false)
  }, [fetchLevels, hasIntersected])

  const handleDeleteLevel = async () => {
    const level = deleteTarget
    if (!level) return

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
      showToast({
        title: "Level deleted",
        description: `“${level.name}” was removed from the community levels.`,
        tone: "success",
      })
    } catch (deleteError) {
      const message = deleteError instanceof Error ? deleteError.message : "Failed to delete level"
      setError(message)
      showToast({ title: "Delete failed", description: message, tone: "error" })
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div ref={rootRef} className="border-2 border-border-strong bg-canvas p-4 sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <h3 className="font-arcade text-xs sm:text-sm text-arcade-yellow">COMMUNITY LEVELS {total > 0 ? `(${total})` : ""}</h3>
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
          <Loader2 className="h-6 w-6 text-arcade-yellow animate-spin" />
        </div>
      ) : levels.length === 0 ? (
        <div className="space-y-2">
          {error && <p className="font-arcade text-xs text-arcade-red">{error}</p>}
          <p className="font-arcade text-xs text-text-secondary">No levels yet. Be the first to build one.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {error && <p className="font-arcade text-xs text-arcade-red">{error}</p>}

          {levels.map((level) => {
            const active = selectedLevelId === level.id
            const isOwner = currentUserId === level.creator.id

            return (
              <div
                key={level.id}
                className={`border p-3 transition-colors ${
                  active
                    ? "border-arcade-yellow bg-surface-2"
                    : "border-border bg-surface hover:border-border-strong"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex gap-3 min-w-0 flex-1">
                    {level.thumbnail && (
                      <Link href={`/play/${slug}?level=${level.id}`} className="flex-shrink-0">
                        <Image
                          src={level.thumbnail}
                          alt={`Level thumbnail for ${level.name}`}
                          width={64}
                          height={40}
                          className="w-16 h-10 object-cover border border-border rounded-sm"
                        />
                      </Link>
                    )}
                    <div className="min-w-0 flex-1">
                      <Link href={`/play/${slug}?level=${level.id}`} className="block min-w-0">
                        <h4 className="font-arcade text-xs text-white truncate">{level.name}</h4>
                        {level.description ? (
                          <p className="font-arcade text-xs text-text-secondary mt-1 line-clamp-2">{level.description}</p>
                        ) : null}
                      </Link>
                    <p className="font-arcade text-xs text-text-secondary mt-2">
                      by{" "}
                      {level.creator.username ? (
                        <Link
                          href={`/creator/${level.creator.username}`}
                          className="text-text-secondary hover:text-arcade-yellow transition-colors"
                        >
                          {level.creator.username}
                        </Link>
                      ) : (
                        level.creator.name || "anonymous"
                      )}{" "}
                      • {timeAgo(new Date(level.createdAt))}
                    </p>
                    </div>
                  </div>

                  <div className="text-right space-y-1">
                    <div className="inline-flex items-center gap-1 text-arcade-yellow font-arcade text-xs">
                      <Star className="h-3 w-3 fill-arcade-yellow" />
                      {level.avgRating.toFixed(1)}
                      <span className="text-text-secondary">({level.ratingCount})</span>
                    </div>
                    <div className="inline-flex items-center gap-1 text-text-secondary font-arcade text-xs">
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
                        setDeleteTarget(level)
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

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => {
          if (!open && !deletingId) setDeleteTarget(null)
        }}
        title="Delete this level?"
        description={deleteTarget ? `“${deleteTarget.name}” will be permanently removed.` : "This level will be permanently removed."}
        confirmLabel="Delete level"
        confirmVariant="arcade-red"
        onConfirm={handleDeleteLevel}
      />
    </div>
  )
}
