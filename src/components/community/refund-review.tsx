"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
export function RefundReview({ id }: { id: string }) {
  const router = useRouter(),
    [note, setNote] = useState(""),
    [message, setMessage] = useState(""),
    [busy, setBusy] = useState(false)
  async function act(action: string) {
    if (
      action === "refund" &&
      !window.confirm("Issue a full refund and reverse the creator transfer for this purchase?")
    )
      return
    setBusy(true)
    try {
      const r = await fetch("/api/source/orders/" + id + "/refund", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, note }),
      })
      const d = await r.json()
      if (!r.ok) throw new Error(d.error)
      setMessage(d.pending ? "Provider is processing the refund." : "Saved.")
      router.refresh()
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Could not process request.")
    } finally {
      setBusy(false)
    }
  }
  return (
    <div className="community-form mt-4">
      <label>
        Reply to buyer
        <textarea value={note} maxLength={2000} onChange={(e) => setNote(e.target.value)} />
      </label>
      <div className="flex flex-wrap gap-3">
        <button
          disabled={busy || note.trim().length < 5}
          onClick={() => act("reply")}
          className="community-button"
        >
          Send reply
        </button>
        <button
          disabled={busy || note.trim().length < 5}
          onClick={() => act("refund")}
          className="community-button"
        >
          Issue full refund
        </button>
      </div>
      {message && (
        <p role="status" className="text-sm">
          {message}
        </p>
      )}
    </div>
  )
}
