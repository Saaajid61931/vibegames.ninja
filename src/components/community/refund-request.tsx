"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
export function RefundRequest({
  id,
  requested,
  reply,
}: {
  id: string
  requested: boolean
  reply: string | null
}) {
  const router = useRouter(),
    [reason, setReason] = useState(""),
    [message, setMessage] = useState(""),
    [busy, setBusy] = useState(false)
  if (requested)
    return (
      <div className="mt-4 text-sm">
        <p>Support request received.</p>
        <p className="mt-2 whitespace-pre-wrap text-text-secondary">
          {reply || "Your request is waiting for review. Updates will appear here."}
        </p>
      </div>
    )
  return (
    <details className="mt-4">
      <summary className="cursor-pointer py-2 text-sm text-primary-text">
        Problem with your purchase? Request help or a refund.
      </summary>
      <form
        className="community-form mt-3"
        onSubmit={async (e) => {
          e.preventDefault()
          setBusy(true)
          try {
            const r = await fetch("/api/source/orders/" + id + "/refund", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ reason }),
            })
            const d = await r.json()
            if (!r.ok) throw new Error(d.error)
            router.refresh()
          } catch (e) {
            setMessage(e instanceof Error ? e.message : "Could not send request.")
          } finally {
            setBusy(false)
          }
        }}
      >
        <label>
          Tell us what went wrong (private)
          <textarea
            required
            minLength={10}
            maxLength={2000}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
        </label>
        <button disabled={busy} className="community-button justify-self-start">
          Send request
        </button>
        {message && <p role="alert">{message}</p>}
      </form>
    </details>
  )
}
