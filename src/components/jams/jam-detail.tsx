"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { JamShareButton } from "@/components/jams/jam-share-button"
import {
  Trophy,
  Clock,
  Users,
  Star,
  Calendar,
  Zap,
  Vote,
  Gamepad2,
  ArrowLeft,
  Send,
  Upload,
  X,
  Loader2,
} from "lucide-react"

type JamEntry = {
  id: string
  game: {
    id: string
    slug: string
    title: string
    thumbnail: string | null
    plays: number
    category: string
    createdAt: string
  }
  user: {
    id: string
    name: string | null
    username: string | null
    image: string | null
  }
  submittedAt: string
  avgScore: number
  voteCount: number
  userVote: number | null
}

type JamData = {
  id: string
  title: string
  slug: string
  description: string
  theme: string | null
  rules: string | null
  bannerImage: string | null
  status: string
  startDate: string
  endDate: string
  votingEndDate: string
  maxEntries: number
  createdBy: {
    id: string
    name: string | null
    username: string | null
  }
  entries: JamEntry[]
}

type UserGame = {
  id: string
  title: string
  slug: string
}

function Countdown({ targetDate, label }: { targetDate: string; label: string }) {
  const [timeLeft, setTimeLeft] = useState("")

  useEffect(() => {
    function update() {
      const target = new Date(targetDate).getTime()
      const now = Date.now()
      const diff = target - now

      if (diff <= 0) {
        setTimeLeft("NOW")
        return
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24))
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
      const seconds = Math.floor((diff % (1000 * 60)) / 1000)

      if (days > 0) {
        setTimeLeft(`${days}d ${hours}h ${minutes}m ${seconds}s`)
      } else {
        setTimeLeft(`${hours}h ${minutes}m ${seconds}s`)
      }
    }

    update()
    const interval = setInterval(update, 1000)
    return () => clearInterval(interval)
  }, [targetDate])

  return (
    <div className="text-center">
      <p className="text-[#8080a0] text-xs mb-1">{label}</p>
      <p className="font-pixel text-lg text-[#ff0040]">{timeLeft}</p>
    </div>
  )
}

function StarRating({
  score,
  onRate,
  disabled,
}: {
  score: number | null
  onRate: (score: number) => void
  disabled?: boolean
}) {
  const [hover, setHover] = useState(0)

  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <button
          key={i}
          disabled={disabled}
          onClick={() => onRate(i)}
          onMouseEnter={() => !disabled && setHover(i)}
          onMouseLeave={() => setHover(0)}
          className={`p-0.5 transition-colors ${disabled ? "cursor-default" : "cursor-pointer hover:scale-110"}`}
        >
          <Star
            className={`w-5 h-5 ${
              (hover || score || 0) >= i
                ? "fill-[#ffff00] text-[#ffff00]"
                : "text-[#4a4a6a]"
            }`}
          />
        </button>
      ))}
    </div>
  )
}

function EntryCard({
  entry,
  rank,
  jamStatus,
  jamSlug,
  userId,
  onVote,
  votingEnabled,
  voting,
}: {
  entry: JamEntry
  rank: number
  jamStatus: string
  jamSlug: string
  userId: string | null
  onVote: (entryId: string, score: number) => void
  votingEnabled: boolean
  voting: boolean
}) {
  const isOwnEntry = userId === entry.user.id
  const showRank = jamStatus === "COMPLETED" || jamStatus === "VOTING"

  return (
    <Card className="bg-[#1a1a2e] border-[#2a2a4a] overflow-hidden hover:border-[#4a4a6a] transition-colors">
      <div className="flex flex-col sm:flex-row">
        {/* Thumbnail */}
        <Link href={`/play/${entry.game.slug}`} className="sm:w-40 h-28 sm:h-auto block flex-shrink-0">
          {entry.game.thumbnail ? (
            <img
              src={entry.game.thumbnail}
              alt={entry.game.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-[#2a2a4a] flex items-center justify-center">
              <Gamepad2 className="w-8 h-8 text-[#4a4a6a]" />
            </div>
          )}
        </Link>

        {/* Content */}
        <div className="flex-1 p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-start justify-between gap-2 mb-1">
              <div className="flex items-center gap-2">
                {showRank && (
                  <span
                    className={`font-pixel text-sm ${
                      rank === 1
                        ? "text-[#ffff00]"
                        : rank === 2
                          ? "text-[#c0c0c0]"
                          : rank === 3
                            ? "text-[#cd7f32]"
                            : "text-[#8080a0]"
                    }`}
                  >
                    #{rank}
                  </span>
                )}
                <Link
                  href={`/play/${entry.game.slug}`}
                  className="font-pixel text-xs text-white hover:text-[#ff0040] transition-colors"
                >
                  {entry.game.title}
                </Link>
              </div>
              <Badge className="bg-[#2a2a4a] text-[#b0b0d0] border-[#4a4a6a] text-[10px] flex-shrink-0">
                {entry.game.category}
              </Badge>
            </div>

            <div className="flex items-center gap-2 text-xs text-[#8080a0] mb-2">
              <span>by {entry.user.username || entry.user.name || "Anonymous"}</span>
              <span>&middot;</span>
              <span>{entry.game.plays} plays</span>
            </div>
          </div>

          <div className="flex items-center justify-between">
            {/* Score display */}
            <div className="flex items-center gap-3">
              {entry.voteCount > 0 && (
                <div className="flex items-center gap-1">
                  <Star className="w-4 h-4 fill-[#ffff00] text-[#ffff00]" />
                  <span className="text-[#ffff00] text-sm font-pixel">
                    {entry.avgScore.toFixed(1)}
                  </span>
                  <span className="text-[#8080a0] text-xs">({entry.voteCount})</span>
                </div>
              )}
            </div>

            {/* Voting */}
            {votingEnabled && !isOwnEntry && (
              <div className="flex items-center gap-2">
                <StarRating
                  score={entry.userVote}
                  onRate={(score) => onVote(entry.id, score)}
                  disabled={voting}
                />
                {voting && <Loader2 className="w-4 h-4 text-[#ffff00] animate-spin" />}
              </div>
            )}
            {votingEnabled && isOwnEntry && (
              <span className="text-[#8080a0] text-xs italic">Your entry</span>
            )}
          </div>
        </div>
      </div>
    </Card>
  )
}

export function JamDetail({
  jam,
  userId,
  userGames,
}: {
  jam: JamData
  userId: string | null
  userGames: UserGame[]
}) {
  const router = useRouter()
  const [submitting, setSubmitting] = useState(false)
  const [withdrawingGameId, setWithdrawingGameId] = useState<string | null>(null)
  const [votingEntryId, setVotingEntryId] = useState<string | null>(null)
  const [selectedGameId, setSelectedGameId] = useState("")
  const [showSubmitForm, setShowSubmitForm] = useState(false)
  const [error, setError] = useState("")
  const [entries, setEntries] = useState(jam.entries)
  const uploadHref = `/upload?jam=${encodeURIComponent(jam.slug)}`
  const uploadLoginHref = `/login?callbackUrl=${encodeURIComponent(uploadHref)}`

  // Games not already submitted
  const submittedGameIds = new Set(entries.map((e) => e.game.id))
  const availableGames = userGames.filter((g) => !submittedGameIds.has(g.id))

  // Check if user already submitted max entries
  const userEntryCount = entries.filter((e) => e.user.id === userId).length
  const canSubmit = jam.status === "ACTIVE" && userId && userEntryCount < jam.maxEntries && availableGames.length > 0
  const canStartJamUpload = !userId || userEntryCount < jam.maxEntries

  const handleSubmit = useCallback(async () => {
    if (!selectedGameId) return
    setSubmitting(true)
    setError("")

    try {
      const res = await fetch(`/api/jams/${jam.slug}/entries`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ gameId: selectedGameId }),
      })

      if (!res.ok) {
        const data = await res.json()
        setError(data.error || "Failed to submit")
        return
      }

      setShowSubmitForm(false)
      setSelectedGameId("")
      router.refresh()
    } catch {
      setError("Failed to submit entry")
    } finally {
      setSubmitting(false)
    }
  }, [selectedGameId, jam.slug, router])

  const handleWithdraw = useCallback(async (gameId: string) => {
    if (!confirm("Withdraw this entry from the jam?")) return

    setWithdrawingGameId(gameId)
    try {
      const res = await fetch(`/api/jams/${jam.slug}/entries`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ gameId }),
      })

      if (res.ok) {
        router.refresh()
      }
    } catch {
      // silent fail
    } finally {
      setWithdrawingGameId(null)
    }
  }, [jam.slug, router])

  const handleVote = useCallback(async (entryId: string, score: number) => {
    setVotingEntryId(entryId)
    try {
      const res = await fetch(`/api/jams/${jam.slug}/entries/${entryId}/vote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ score }),
      })

      if (res.ok) {
        // Optimistic update
        setEntries((prev) =>
          prev.map((e) =>
            e.id === entryId ? { ...e, userVote: score } : e
          )
        )
        router.refresh()
      }
    } catch {
      // silent fail
    } finally {
      setVotingEntryId(null)
    }
  }, [jam.slug, router])

  const statusConfig: Record<string, { color: string; icon: React.ReactNode; label: string }> = {
    ACTIVE: { color: "#00ff40", icon: <Zap className="w-5 h-5" />, label: "SUBMISSIONS OPEN" },
    UPCOMING: { color: "#00d4ff", icon: <Clock className="w-5 h-5" />, label: "COMING SOON" },
    VOTING: { color: "#ffff00", icon: <Vote className="w-5 h-5" />, label: "VOTING OPEN" },
    COMPLETED: { color: "#b0b0d0", icon: <Trophy className="w-5 h-5" />, label: "COMPLETED" },
  }

  const sc = statusConfig[jam.status] || statusConfig.COMPLETED

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Back link */}
      <Link
        href="/jams"
        className="inline-flex items-center gap-1 text-[#8080a0] hover:text-white text-sm mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        All Jams
      </Link>

      {/* Banner */}
      {jam.bannerImage && (
        <div className="mb-6 aspect-[3/1] w-full overflow-hidden rounded-lg">
          <img
            src={jam.bannerImage}
            alt={jam.title}
            className="w-full h-full object-cover"
          />
        </div>
      )}

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-3">
          <Badge
            className="font-pixel text-[10px] border"
            style={{ color: sc.color, borderColor: sc.color + "40", backgroundColor: sc.color + "15" }}
          >
            {sc.icon}
            <span className="ml-1">{sc.label}</span>
          </Badge>
        </div>

        <h1 className="text-xl md:text-2xl font-pixel text-white mb-3 leading-relaxed">{jam.title}</h1>

        {jam.theme && (
          <p className="font-pixel text-sm text-[#ffff00] mb-3">THEME: {jam.theme}</p>
        )}

        <p className="text-[#b0b0d0] whitespace-pre-wrap mb-4">{jam.description}</p>

        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div className="text-xs text-[#8080a0]">
            Share this jam to bring in more builders, players, and voters.
          </div>
          <JamShareButton title={jam.title} />
        </div>

        {/* Dates and countdown */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <Card className="bg-[#1a1a2e] border-[#2a2a4a] p-4 text-center">
            <Calendar className="w-4 h-4 text-[#00d4ff] mx-auto mb-1" />
            <p className="text-[#8080a0] text-xs mb-1">Submissions</p>
            <p className="text-white text-sm">
              {new Date(jam.startDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
              {" - "}
              {new Date(jam.endDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
            </p>
          </Card>
          <Card className="bg-[#1a1a2e] border-[#2a2a4a] p-4 text-center">
            <Vote className="w-4 h-4 text-[#ffff00] mx-auto mb-1" />
            <p className="text-[#8080a0] text-xs mb-1">Voting</p>
            <p className="text-white text-sm">
              {new Date(jam.endDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
              {" - "}
              {new Date(jam.votingEndDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
            </p>
          </Card>
          <Card className="bg-[#1a1a2e] border-[#2a2a4a] p-4">
            {jam.status === "ACTIVE" && (
              <Countdown targetDate={jam.endDate} label="Submissions close in" />
            )}
            {jam.status === "UPCOMING" && (
              <Countdown targetDate={jam.startDate} label="Starts in" />
            )}
            {jam.status === "VOTING" && (
              <Countdown targetDate={jam.votingEndDate} label="Voting ends in" />
            )}
            {jam.status === "COMPLETED" && (
              <div className="text-center">
                <Trophy className="w-4 h-4 text-[#ffff00] mx-auto mb-1" />
                <p className="text-[#8080a0] text-xs mb-1">Final Results</p>
                <p className="text-white text-sm font-pixel">{entries.length} entries</p>
              </div>
            )}
          </Card>
        </div>

        {/* Stats bar */}
        <div className="flex items-center gap-6 text-sm text-[#8080a0]">
          <span className="flex items-center gap-1">
            <Users className="w-4 h-4" />
            {entries.length} {entries.length === 1 ? "entry" : "entries"}
          </span>
          {jam.maxEntries > 1 && (
            <span>Up to {jam.maxEntries} entries per person</span>
          )}
        </div>
      </div>

      {/* Rules */}
      {jam.rules && (
        <Card className="bg-[#1a1a2e] border-[#2a2a4a] p-5 mb-8">
          <h2 className="font-pixel text-sm text-white mb-3">RULES</h2>
          <div className="text-[#b0b0d0] text-sm whitespace-pre-wrap">{jam.rules}</div>
        </Card>
      )}

      {jam.status === "ACTIVE" && (
        <Card className="bg-[#1a1a2e] border-[#ff0040]/30 p-5 mb-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="font-pixel text-sm text-white mb-1">BUILD SOMETHING NEW FOR THIS JAM</h2>
              <p className="text-[#8080a0] text-sm">
                {canStartJamUpload
                  ? "Start from a fresh upload and this jam will already be selected for you."
                  : `You have already used all ${jam.maxEntries} ${jam.maxEntries === 1 ? "entry slot" : "entry slots"} for this jam.`}
              </p>
            </div>
            {canStartJamUpload && (
              <Link href={userId ? uploadHref : uploadLoginHref}>
                <Button className="bg-[#ff0040] text-white hover:bg-[#e0003a] font-pixel text-xs">
                  <Upload className="w-4 h-4 mr-1" />
                  UPLOAD FOR JAM
                </Button>
              </Link>
            )}
          </div>
        </Card>
      )}

      {/* Submit entry */}
      {canSubmit && (
        <Card className="bg-[#1a1a2e] border-[#00ff40]/30 p-5 mb-8">
          {!showSubmitForm ? (
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-pixel text-sm text-[#00ff40] mb-1">SUBMIT YOUR GAME</h3>
                <p className="text-[#8080a0] text-sm">Submit a published game to this jam, or upload a new one with the jam already selected.</p>
              </div>
              <Button
                onClick={() => setShowSubmitForm(true)}
                className="bg-[#00ff40] text-black hover:bg-[#00cc33] font-pixel text-xs"
              >
                <Send className="w-4 h-4 mr-1" />
                SUBMIT
              </Button>
            </div>
          ) : (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-pixel text-sm text-[#00ff40]">SELECT A GAME</h3>
                <button onClick={() => setShowSubmitForm(false)} className="text-[#8080a0] hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="space-y-2 mb-4">
                {availableGames.map((game) => (
                  <button
                    key={game.id}
                    onClick={() => setSelectedGameId(game.id)}
                    className={`w-full text-left p-3 rounded border transition-colors ${
                      selectedGameId === game.id
                        ? "border-[#00ff40] bg-[#00ff40]/10 text-white"
                        : "border-[#2a2a4a] hover:border-[#4a4a6a] text-[#b0b0d0]"
                    }`}
                  >
                    <span className="font-pixel text-xs">{game.title}</span>
                  </button>
                ))}
              </div>
              {error && <p className="text-[#ff0040] text-sm mb-3">{error}</p>}
              <Button
                onClick={handleSubmit}
                disabled={!selectedGameId || submitting}
                className="bg-[#00ff40] text-black hover:bg-[#00cc33] font-pixel text-xs"
              >
                {submitting ? "SUBMITTING..." : "CONFIRM SUBMISSION"}
              </Button>
            </div>
          )}
        </Card>
      )}

      {/* Not logged in message for active jams */}
      {jam.status === "ACTIVE" && !userId && (
        <Card className="bg-[#1a1a2e] border-[#2a2a4a] p-5 mb-8 text-center">
          <p className="text-[#b0b0d0] mb-3">
            <Link href={uploadLoginHref} className="text-[#ff0040] hover:underline">Sign in</Link> to upload or submit your game to this jam.
          </p>
        </Card>
      )}

      {/* Entries list */}
      <div>
        <h2 className="font-pixel text-sm text-white mb-4 flex items-center gap-2">
          <Gamepad2 className="w-5 h-5 text-[#ff0040]" />
          {jam.status === "COMPLETED" ? "RESULTS" : "ENTRIES"}
          <span className="text-[#8080a0] font-sans text-xs">({entries.length})</span>
        </h2>

        {entries.length === 0 ? (
          <Card className="bg-[#1a1a2e] border-[#2a2a4a] p-8 text-center">
            <Gamepad2 className="w-8 h-8 text-[#4a4a6a] mx-auto mb-3" />
            <p className="text-[#b0b0d0] font-pixel text-xs">NO ENTRIES YET</p>
            <p className="text-[#8080a0] text-sm mt-1">Be the first to submit a game!</p>
          </Card>
        ) : (
          <div className="space-y-3">
            {entries.map((entry, i) => (
              <div key={entry.id} className="relative">
                <EntryCard
                  entry={entry}
                  rank={i + 1}
                  jamStatus={jam.status}
                  jamSlug={jam.slug}
                  userId={userId}
                  onVote={handleVote}
                  votingEnabled={jam.status === "VOTING" && !!userId}
                  voting={votingEntryId === entry.id}
                />
                {/* Withdraw button for own entries during active phase */}
                {jam.status === "ACTIVE" && entry.user.id === userId && (
                  <button
                    onClick={() => handleWithdraw(entry.game.id)}
                    disabled={withdrawingGameId === entry.game.id}
                    className="absolute top-2 right-2 text-[#8080a0] hover:text-[#ff0040] text-xs transition-colors disabled:opacity-50"
                  >
                    {withdrawingGameId === entry.game.id ? (
                      <span className="flex items-center gap-1">
                        <Loader2 className="w-3 h-3 animate-spin" />
                        Withdrawing...
                      </span>
                    ) : (
                      "Withdraw"
                    )}
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
