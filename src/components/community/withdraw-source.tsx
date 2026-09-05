"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
export function WithdrawSource({ id }: { id: string }) {
  const router = useRouter(),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false)
  return (
    <span>
      <button
        className="community-button mt-3 ml-2"
        disabled={busy}
        onClick={async () => {
          if (
            !window.confirm(
              "Stop new downloads and purchases of this version? Existing buyers keep access.",
            )
          )
            return
          setBusy(true)
          try {
            const r = await fetch("/api/source/" + id + "/review", {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                status: "WITHDRAWN",
                note: "Withdrawn from new distribution by its creator.",
              }),
            })
            const d = await r.json()
            if (!r.ok) throw new Error(d.error)
            router.refresh()
          } catch (e) {
            setError(e instanceof Error ? e.message : "Could not withdraw project.")
          } finally {
            setBusy(false)
          }
        }}
      >
        Withdraw version
      </button>
      {error && (
        <span role="alert" className="block text-sm text-danger-text">
          {error}
        </span>
      )}
    </span>
  )
}
