"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
type Story = {
  idea: string
  lessons: string
  nextIdea: string
  inspiredBySlug: string
  builtFromPackageId: string
}
export function SourceEditor({
  gameId,
  initialStory,
  uploadsReady,
  sourceChoices,
}: {
  gameId: string
  initialStory: Story
  uploadsReady: boolean
  sourceChoices: { id: string; label: string }[]
}) {
  const router = useRouter()
  const [story, setStory] = useState(initialStory)
  const [message, setMessage] = useState(""),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false)
  const [mode, setMode] = useState("play")
  async function saveStory(event: React.FormEvent) {
    event.preventDefault()
    setBusy(true)
    setError("")
    setMessage("")
    try {
      const r = await fetch("/api/games/" + gameId + "/community", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(story),
      })
      const d = await r.json()
      if (!r.ok) throw new Error(d.error)
      setMessage("Your creator story is saved.")
      router.refresh()
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save.")
    } finally {
      setBusy(false)
    }
  }
  async function upload(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setBusy(true)
    setError("")
    setMessage("")
    const form = new FormData(event.currentTarget)
    const value = (name: string) => String(form.get(name) || "")
    const price = mode === "free" ? 0 : Math.round(Number(value("price")) * 100)
    const metadata = {
      version: value("version"),
      description: value("description"),
      readme: value("readme"),
      license: value("license"),
      format: value("format"),
      requirements: value("requirements"),
      exclusions: value("exclusions"),
      priceCents: price,
      rightsConfirmed: form.get("rights") === "on",
    }
    const body = new FormData()
    body.set("metadata", JSON.stringify(metadata))
    body.set("file", form.get("file") as File)
    try {
      const r = await fetch("/api/games/" + gameId + "/source", { method: "POST", body })
      const d = await r.json()
      if (!r.ok) throw new Error(d.error)
      setMessage("Project submitted for review. It will only be available after approval.")
      router.refresh()
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not upload.")
    } finally {
      setBusy(false)
    }
  }
  return (
    <div className="space-y-8">
      {error && (
        <p role="alert" className="text-danger-text">
          {error}
        </p>
      )}
      {message && (
        <p role="status" className="text-success">
          {message}
        </p>
      )}
      <form onSubmit={saveStory} className="community-form inspiration-tile">
        <h2 className="heading-pixel-sm text-white">Behind your game</h2>
        <p className="text-sm leading-6 text-text-secondary">
          Optional notes that help someone understand your idea and find a spark of their own.
        </p>
        {(
          [
            ["idea", "What idea were you exploring?"],
            ["lessons", "What did you learn?"],
            ["nextIdea", "What would you try next?"],
          ] as const
        ).map(([key, label]) => (
          <label key={key}>
            {label}
            <textarea
              value={story[key]}
              onChange={(e) => setStory({ ...story, [key]: e.target.value })}
              maxLength={key === "nextIdea" ? 2000 : 3000}
            />
          </label>
        ))}
        <label>
          Inspired by a game on VibeGames (optional slug)
          <input
            value={story.inspiredBySlug}
            onChange={(e) => setStory({ ...story, inspiredBySlug: e.target.value })}
            placeholder="For example: bit-butcher"
            maxLength={160}
          />
          <span className="text-xs">
            Credits an influence; it does not claim that you reused its source.
          </span>
        </label>
        <label>
          Built from source you acquired (optional)
          <select
            value={story.builtFromPackageId}
            onChange={(e) => setStory({ ...story, builtFromPackageId: e.target.value })}
          >
            <option value="">No source reused</option>
            {sourceChoices.map((p) => (
              <option key={p.id} value={p.id}>
                {p.label}
              </option>
            ))}
          </select>
          <span className="text-xs">
            Credits the exact project version. Its license still determines what you can share.
          </span>
        </label>
        <button disabled={busy} className="community-button primary justify-self-start">
          Save creator story
        </button>
      </form>
      <section className="inspiration-tile">
        <h2 className="heading-pixel-sm text-white">Sharing source is your choice.</h2>
        <p className="mt-2 text-sm leading-7 text-text-secondary">
          Your playable game stays free. Upload an editable project separately if you want others to
          build on it. Existing source listings are managed below.
        </p>
        <div className="my-5 flex flex-wrap gap-3">
          {[
            ["play", "Play only"],
            ["free", "Free source"],
            ["paid", "Paid source"],
          ].map(([key, label]) => (
            <button
              key={key}
              type="button"
              aria-pressed={mode === key}
              className={"community-button " + (mode === key ? "primary" : "")}
              onClick={() => setMode(key)}
            >
              {label}
            </button>
          ))}
        </div>
        {mode !== "play" &&
          (!uploadsReady ? (
            <p className="text-sm text-text-secondary">
              Source uploads are not available yet. You can still share your game and creator story.
            </p>
          ) : (
            <form onSubmit={upload} className="community-form">
              <label>
                Editable project ZIP (up to 20 MB)
                <input name="file" type="file" accept=".zip" required />
              </label>
              <p className="text-xs leading-6 text-text-secondary">
                Include actual source and a README. Remove installed dependencies, secrets and
                executable binaries. Projects are reviewed before release.
              </p>
              <div className="grid gap-4 sm:grid-cols-2">
                <label>
                  Version
                  <input name="version" defaultValue="1.0.0" required maxLength={40} />
                </label>
                <label>
                  Project format / engine
                  <input
                    name="format"
                    placeholder="HTML + JavaScript, Godot 4…"
                    required
                    maxLength={80}
                  />
                </label>
              </div>
              {mode === "paid" && (
                <label>
                  Price in USD
                  <input
                    name="price"
                    type="number"
                    min="1"
                    max="1000"
                    step=".01"
                    defaultValue="1"
                    required
                  />
                  <span className="text-xs">
                    Choose a price for the reusable project. Payout setup must be completed before
                    anyone can purchase it.
                  </span>
                </label>
              )}
              <label>
                What does the buyer get?
                <textarea name="description" minLength={20} maxLength={2000} required />
              </label>
              <label>
                Setup instructions and support/update scope
                <textarea
                  name="readme"
                  minLength={40}
                  maxLength={20000}
                  required
                  placeholder="How to run it, what can be changed, and which updates or support are included."
                />
              </label>
              <label>
                Dependencies or paid services needed
                <textarea name="requirements" maxLength={3000} />
              </label>
              <label>
                Assets or services not included
                <textarea name="exclusions" maxLength={3000} />
              </label>
              <label>
                Reuse permissions / license text
                <textarea
                  name="license"
                  minLength={40}
                  maxLength={12000}
                  required
                  placeholder="State modification, attribution, commercial-use and redistribution permissions. Include the applicable license text."
                />
              </label>
              <label className="!flex !flex-row items-start">
                <input className="mt-1" type="checkbox" name="rights" required />
                <span>
                  I have permission to distribute all included code and assets under these terms.
                  This project matches the playable demo.
                </span>
              </label>
              <button disabled={busy} className="community-button primary justify-self-start">
                Submit source project for review
              </button>
            </form>
          ))}
      </section>
    </div>
  )
}
