"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
export function SourceReviewAction({
  id,
  currentStatus = "PENDING",
}: {
  id: string
  currentStatus?: string
}) {
  const router = useRouter()
  const [note, setNote] = useState(""),
    [checked, setChecked] = useState(false),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("")
  async function review(status: string) {
    setBusy(true)
    setError("")
    try {
      const r = await fetch("/api/source/" + id + "/review", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, note }),
      })
      const d = await r.json()
      if (!r.ok) throw new Error(d.error)
      router.refresh()
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save review.")
    } finally {
      setBusy(false)
    }
  }
  return (
    <div className="community-form mt-5">
      <label>
        Review notes
        <textarea
          minLength={5}
          maxLength={2000}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Record setup steps tested, license and asset review, and anything the creator should fix."
        />
      </label>
      <label className="!flex !flex-row items-start">
        <input type="checkbox" checked={checked} onChange={(e) => setChecked(e.target.checked)} />
        <span>
          I inspected the files, verified the documented setup, and reviewed the reuse terms and
          asset permissions.
        </span>
      </label>
      <div className="flex flex-wrap gap-3">
        <button
          disabled={busy || !checked || note.trim().length < 5}
          onClick={() => review("APPROVED")}
          className="community-button primary"
        >
          Approve source project
        </button>
        <button
          disabled={busy || note.trim().length < 5}
          onClick={() => review(currentStatus === "PENDING" ? "REJECTED" : "BLOCKED")}
          className="community-button"
        >
          {currentStatus === "PENDING" ? "Request changes" : "Block downloads and sales"}
        </button>
      </div>
      {error && (
        <p role="alert" className="text-danger-text">
          {error}
        </p>
      )}
    </div>
  )
}
