"use client"
import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Bookmark, Check, Loader2 } from "lucide-react"
let cachedUser = ""
let savedRequest: Promise<string[]> | null = null
function savedGames(userId: string) {
  if (cachedUser !== userId || !savedRequest) {
    cachedUser = userId
    savedRequest = fetch("/api/saved")
      .then(async (response) => {
        if (!response.ok) throw new Error("Could not load saved games")
        return (await response.json()).gameIds as string[]
      })
      .catch((error) => {
        savedRequest = null
        throw error
      })
  }
  return savedRequest
}
export function SaveGameButton({
  gameId,
  slug,
  compact = false,
}: {
  gameId: string
  slug: string
  compact?: boolean
}) {
  const { data: session } = useSession()
  const router = useRouter()
  const [saved, setSaved] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState("")
  useEffect(() => {
    let active = true
    setSaved(false)
    const refresh = () => {
      if (session?.user?.id)
        void savedGames(session.user.id)
          .then((ids) => {
            if (active) setSaved(ids.includes(gameId))
          })
          .catch(() => {})
    }
    refresh()
    window.addEventListener("vg-saved-changed", refresh)
    return () => {
      active = false
      window.removeEventListener("vg-saved-changed", refresh)
    }
  }, [session?.user?.id, gameId])
  async function save() {
    if (!session?.user?.id) {
      router.push("/login?callbackUrl=" + encodeURIComponent("/play/" + slug))
      return
    }
    setBusy(true)
    setError("")
    try {
      const response = await fetch("/api/saved", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ gameId, saved: !saved }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || "Could not save. Try again.")
      setSaved(data.saved)
      savedRequest = null
      window.dispatchEvent(new Event("vg-saved-changed"))
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save.")
    } finally {
      setBusy(false)
    }
  }
  return (
    <span className="inline-flex flex-col items-start">
      <button
        type="button"
        onClick={save}
        disabled={busy}
        aria-pressed={saved}
        aria-label={saved ? "Remove saved game" : "Save game for inspiration"}
        className={
          compact
            ? "inline-flex min-h-10 items-center gap-1.5 text-xs text-text-secondary hover:text-primary-text"
            : "community-button"
        }
      >
        {busy ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : saved ? (
          <Check className="h-4 w-4" />
        ) : (
          <Bookmark className="h-4 w-4" />
        )}
        {saved ? "Saved" : "Save"}
      </button>
      {error && (
        <span role="alert" className="max-w-48 text-xs text-danger-text">
          {error}
        </span>
      )}
    </span>
  )
}
