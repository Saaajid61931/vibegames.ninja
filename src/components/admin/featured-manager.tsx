"use client"

import { useState, useEffect, useCallback } from "react"
import Image from "next/image"
import { Gamepad2, Crown, Trash2, Search, Calendar, Loader2, CheckCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface ScheduledGame {
  id: string
  date: string
  note: string | null
  game: {
    id: string
    title: string
    slug: string
    thumbnail: string | null
    category: string
    plays: number
    creator: { name: string | null; username: string | null }
    studioProfile: { handle: string; displayName: string } | null
  }
  createdBy: { name: string | null; username: string | null }
}

interface SearchResult {
  id: string
  slug: string
  title: string
  thumbnail: string | null
  category: string
  plays: number
  creator: { name: string | null; username: string | null }
  studioProfile: { handle: string; displayName: string } | null
}

export function FeaturedManager() {
  const [schedule, setSchedule] = useState<ScheduledGame[]>([])
  const [recentPicks, setRecentPicks] = useState<ScheduledGame[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Form state
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [searching, setSearching] = useState(false)
  const [selectedGame, setSelectedGame] = useState<SearchResult | null>(null)
  const [date, setDate] = useState(() => {
    const today = new Date()
    return today.toISOString().split("T")[0]
  })
  const [note, setNote] = useState("")

  const fetchSchedule = useCallback(async () => {
    try {
      const res = await fetch("/api/featured/schedule")
      if (res.ok) {
        const data = await res.json()
        setSchedule(data.schedule || [])
        setRecentPicks(data.recentPicks || [])
      }
    } catch {
      // silent
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchSchedule()
  }, [fetchSchedule])

  // Debounced game search
  useEffect(() => {
    if (searchQuery.length < 2) {
      setSearchResults([])
      return
    }

    const timer = setTimeout(async () => {
      setSearching(true)
      try {
        const res = await fetch(`/api/games?q=${encodeURIComponent(searchQuery)}&limit=8`)
        if (res.ok) {
          const data = await res.json()
          setSearchResults(data.data || [])
        }
      } catch {
        // silent
      } finally {
        setSearching(false)
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [searchQuery])

  const handleSubmit = async () => {
    if (!selectedGame) {
      setError("Select a game first")
      return
    }

    setSubmitting(true)
    setError(null)
    setSuccess(null)

    try {
      const res = await fetch("/api/featured", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          gameId: selectedGame.id,
          date,
          note: note.trim() || undefined,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        setError(data.error || "Failed to set featured game")
        return
      }

      setSuccess(`"${selectedGame.title}" set as Game of the Day for ${date}`)
      setSelectedGame(null)
      setSearchQuery("")
      setNote("")
      setSearchResults([])
      fetchSchedule()
    } catch {
      setError("Network error. Try again.")
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id: string) => {
    setDeleting(id)
    setError(null)

    try {
      const res = await fetch(`/api/featured/${id}`, { method: "DELETE" })
      if (res.ok) {
        fetchSchedule()
      } else {
        const data = await res.json()
        setError(data.error || "Failed to remove")
      }
    } catch {
      setError("Network error")
    } finally {
      setDeleting(null)
    }
  }

  const getCreatorName = (game: { creator: { name: string | null; username: string | null }; studioProfile: { displayName: string } | null }) => {
    return game.studioProfile?.displayName || game.creator.username || game.creator.name || "Anonymous"
  }

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr)
    return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric", timeZone: "UTC" })
  }

  const isToday = (dateStr: string) => {
    const d = new Date(dateStr)
    const today = new Date()
    return d.toISOString().split("T")[0] === today.toISOString().split("T")[0]
  }

  return (
    <div className="space-y-8">
      {/* Set Featured Game Form */}
      <div className="border-2 border-border-strong bg-surface-2 p-6 space-y-5">
        <h3 className="heading-pixel-sm flex items-center gap-2 font-bold text-white">
          <Crown className="h-4 w-4 text-arcade-yellow" />
          SET GAME OF THE DAY
        </h3>

        {/* Date picker */}
        <div>
          <Label htmlFor="featured-date" className="mb-1.5 block text-xs text-text-secondary">
            DATE
          </Label>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-secondary" />
            <Input
              id="featured-date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Game search */}
        <div>
          <Label className="mb-1.5 block text-xs text-text-secondary">
            GAME
          </Label>

          {selectedGame ? (
            <div className="flex items-center gap-3 p-3 bg-canvas border-2 border-arcade-yellow">
              <div className="w-12 h-8 bg-surface-2 border border-border-strong overflow-hidden flex-shrink-0">
                {selectedGame.thumbnail ? (
                  <Image
                    src={selectedGame.thumbnail}
                    alt={selectedGame.title}
                    width={48}
                    height={32}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Gamepad2 className="h-3 w-3 text-text-secondary" />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="truncate text-sm font-bold text-white">{selectedGame.title}</p>
                <p className="text-xs text-text-secondary font-arcade">by {getCreatorName(selectedGame)}</p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSelectedGame(null)
                  setSearchQuery("")
                }}
                className="text-arcade-red hover:text-white"
              >
                Change
              </Button>
            </div>
          ) : (
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-secondary" />
              <Input
                placeholder="Search published games..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
              {searching && (
                <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-secondary animate-spin" />
              )}

              {/* Search dropdown */}
              {searchResults.length > 0 && (
                <div className="absolute z-50 w-full mt-1 bg-canvas border-2 border-border-strong max-h-64 overflow-y-auto">
                  {searchResults.map((game) => (
                    <button
                      key={game.id}
                      onClick={() => {
                        setSelectedGame(game)
                        setSearchQuery("")
                        setSearchResults([])
                      }}
                      className="w-full flex items-center gap-3 p-3 hover:bg-surface-2 transition-colors text-left"
                    >
                <div className="w-10 h-7 bg-surface-2 border border-border-strong overflow-hidden flex-shrink-0">
                  {game.thumbnail ? (
                    <Image
                      src={game.thumbnail}
                      alt={game.title}
                      width={40}
                      height={28}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Gamepad2 className="h-3 w-3 text-text-secondary" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-white truncate">{game.title}</p>
                        <p className="text-xs text-text-secondary">
                          {getCreatorName(game)} &middot; {game.plays} plays
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {searchQuery.length >= 2 && !searching && searchResults.length === 0 && (
                <div className="absolute z-50 w-full mt-1 bg-canvas border-2 border-border-strong p-4 text-center text-sm text-text-secondary font-arcade">
                  No published games found
                </div>
              )}
            </div>
          )}
        </div>

        {/* Note */}
        <div>
          <Label htmlFor="featured-note" className="mb-1.5 block text-xs text-text-secondary">
            NOTE (OPTIONAL)
          </Label>
          <Input
            id="featured-note"
            placeholder="e.g. Jam winner, Editor's pick..."
            value={note}
            onChange={(e) => setNote(e.target.value)}
            maxLength={200}
          />
        </div>

        {/* Submit */}
        {error && (
          <p className="text-sm text-arcade-red font-arcade">{error}</p>
        )}
        {success && (
          <div className="flex items-center gap-2 text-sm text-arcade-green font-arcade">
            <CheckCircle className="h-4 w-4" />
            {success}
          </div>
        )}

        <Button
          variant="arcade"
          onClick={handleSubmit}
          disabled={!selectedGame || submitting}
          className="w-full sm:w-auto gap-2"
        >
          {submitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Setting...
            </>
          ) : (
            <>
              <Crown className="h-4 w-4" />
              SET FEATURED
            </>
          )}
        </Button>
      </div>

      {/* Current & Upcoming Schedule */}
      <div>
        <h3 className="heading-pixel-sm mb-4 font-bold text-white">
          SCHEDULE
        </h3>

        {loading ? (
          <div className="text-center py-8 text-text-secondary">
            <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
            <p className="font-arcade">Loading schedule...</p>
          </div>
        ) : schedule.length === 0 ? (
          <div className="text-center py-8 border-2 border-dashed border-border-strong text-text-secondary font-arcade">
            No upcoming featured games scheduled.
            <br />
            Auto-fallback will select the best game automatically.
          </div>
        ) : (
          <div className="space-y-2">
            {schedule.map((item) => (
              <div
                key={item.id}
                className={`flex items-center gap-3 p-3 border-2 bg-surface-2 ${
                  isToday(item.date) ? "border-arcade-yellow" : "border-border-strong"
                }`}
              >
                <div className="text-center min-w-[60px]">
                  <p className={`text-xs font-bold uppercase tracking-wide ${isToday(item.date) ? "text-arcade-yellow" : "text-text-secondary"}`}>
                    {isToday(item.date) ? "TODAY" : formatDate(item.date).split(",")[0]}
                  </p>
                  <p className="text-xs text-text-secondary">
                    {formatDate(item.date).split(",").slice(1).join(",").trim()}
                  </p>
                </div>

                <div className="w-14 h-9 bg-canvas border border-border-strong overflow-hidden flex-shrink-0">
                  {item.game.thumbnail ? (
                    <Image
                      src={item.game.thumbnail}
                      alt={item.game.title}
                      width={56}
                      height={36}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Gamepad2 className="h-3 w-3 text-text-secondary" />
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <p className="truncate text-sm font-bold text-white">{item.game.title}</p>
                  <p className="text-xs text-text-secondary font-arcade truncate">
                    by {getCreatorName(item.game)}
                    {item.note && <span className="text-arcade-yellow/60"> &middot; {item.note}</span>}
                  </p>
                </div>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDelete(item.id)}
                  disabled={deleting === item.id}
                  className="text-arcade-red hover:text-white flex-shrink-0"
                >
                  {deleting === item.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4" />
                  )}
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recent Past Picks */}
      {recentPicks.length > 0 && (
        <div>
          <h3 className="heading-pixel-sm mb-3 font-bold text-text-secondary">
            RECENT PICKS (LAST 7 DAYS)
          </h3>
          <div className="space-y-1.5">
            {recentPicks.map((item) => (
              <div
                key={item.id}
                className="flex items-center gap-3 p-2.5 border border-border-strong/50 bg-canvas"
              >
                <p className="min-w-[50px] text-xs text-text-secondary">
                  {formatDate(item.date).split(",")[0]}
                </p>
                <p className="text-xs text-text-secondary font-arcade truncate flex-1">
                  {item.game.title} — by {getCreatorName(item.game)}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
