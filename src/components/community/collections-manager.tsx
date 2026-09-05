"use client"
import { useEffect, useState } from "react"
import Link from "next/link"
import { useSession } from "next-auth/react"
type Game = { id: string; title: string; slug: string }
type Collection = {
  id: string
  name: string
  description: string
  isPublic: boolean
  items: { game: Game }[]
}
export function CollectionsManager() {
  const { data: session, status } = useSession()
  const [collections, setCollections] = useState<Collection[]>([])
  const [saved, setSaved] = useState<Game[]>([])
  const [name, setName] = useState("")
  const [error, setError] = useState("")
  const [busy, setBusy] = useState(false)
  async function load() {
    const r = await fetch("/api/collections")
    const d = await r.json()
    if (!r.ok) throw new Error(d.error)
    setCollections(d.collections)
    setSaved(d.saved)
  }
  useEffect(() => {
    if (session?.user) void load().catch((e) => setError(e.message))
  }, [session?.user])
  async function change(url: string, method: string, body?: unknown) {
    setBusy(true)
    setError("")
    try {
      const r = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: body ? JSON.stringify(body) : undefined,
      })
      const d = await r.json()
      if (!r.ok) throw new Error(d.error)
      await load()
      setName("")
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not update collection.")
    } finally {
      setBusy(false)
    }
  }
  if (status === "loading") return <p>Loading your collections…</p>
  if (!session?.user)
    return (
      <div className="inspiration-tile">
        <h2 className="heading-pixel-sm text-white">Keep your next idea close.</h2>
        <p className="my-3 text-text-secondary">
          Save games into private collections, then share a collection whenever you want.
        </p>
        <Link href="/login?callbackUrl=%2Fcollections" className="community-button">
          Sign in to collect ideas
        </Link>
      </div>
    )
  return (
    <section>
      <h2 className="mb-4 heading-pixel-md text-white">Your collections</h2>
      <form
        className="community-form mb-6"
        onSubmit={(e) => {
          e.preventDefault()
          void change("/api/collections", "POST", { name })
        }}
      >
        <label>
          New collection
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={80}
            required
            placeholder="Ideas for my next game"
          />
        </label>
        <button className="community-button primary justify-self-start" disabled={busy}>
          Create private collection
        </button>
      </form>
      {error && (
        <p role="alert" className="mb-4 text-danger-text">
          {error}
        </p>
      )}
      <div className="grid gap-4 lg:grid-cols-2">
        {collections.map((c) => (
          <article key={c.id} className="inspiration-tile">
            <h3 className="heading-pixel-sm text-white">{c.name}</h3>
            <label className="my-3 flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={c.isPublic}
                disabled={busy}
                onChange={(e) =>
                  void change("/api/collections/" + c.id, "PATCH", { isPublic: e.target.checked })
                }
              />
              Public — anyone with the link can view
            </label>
            <Link href={"/collections/" + c.id} className="text-sm text-primary-text">
              {c.isPublic ? "Open shareable collection" : "Preview private collection"} →
            </Link>
            <ul className="my-4 space-y-2">
              {c.items.map(({ game }) => (
                <li key={game.id} className="flex items-center justify-between gap-2">
                  <Link href={"/play/" + game.slug} className="text-sm hover:text-primary-text">
                    {game.title}
                  </Link>
                  <button
                    disabled={busy}
                    className="min-h-10 text-xs text-text-secondary"
                    onClick={() =>
                      void change("/api/collections/" + c.id, "PATCH", {
                        gameId: game.id,
                        remove: true,
                      })
                    }
                  >
                    Remove
                  </button>
                </li>
              ))}
            </ul>
            <label className="community-form">
              <span className="text-sm">Add a saved game</span>
              <select
                value=""
                disabled={busy}
                onChange={(e) => {
                  if (e.target.value)
                    void change("/api/collections/" + c.id, "PATCH", { gameId: e.target.value })
                }}
              >
                <option value="">Choose a game…</option>
                {saved
                  .filter((g) => !c.items.some((i) => i.game.id === g.id))
                  .map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.title}
                    </option>
                  ))}
              </select>
            </label>
            {saved.length === 0 && (
              <p className="mt-3 text-sm text-text-secondary">
                Use Save on a game to collect it here.
              </p>
            )}
            <button
              className="mt-4 min-h-10 text-xs text-danger-text"
              disabled={busy}
              onClick={() => {
                if (window.confirm("Delete this collection? Your saved games will stay saved."))
                  void change("/api/collections/" + c.id, "DELETE")
              }}
            >
              Delete collection
            </button>
          </article>
        ))}
      </div>
    </section>
  )
}
