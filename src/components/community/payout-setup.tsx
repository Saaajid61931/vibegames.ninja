"use client"
import { useState } from "react"
export function PayoutSetup({ available }: { available: boolean }) {
  const [message, setMessage] = useState(""),
    [busy, setBusy] = useState(false)
  async function setup() {
    setBusy(true)
    try {
      const r = await fetch("/api/source/payouts", { method: "POST" })
      const d = await r.json()
      if (!r.ok) throw new Error(d.error)
      window.location.assign(d.url)
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Could not open payout setup.")
      setBusy(false)
    }
  }
  async function check() {
    setBusy(true)
    try {
      const r = await fetch("/api/source/payouts")
      const d = await r.json()
      if (!r.ok) throw new Error(d.error)
      setMessage(
        d.ready
          ? "Your payouts are ready."
          : "Payout setup is not complete yet. Complete the provider's steps before selling.",
      )
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Could not check payouts.")
    } finally {
      setBusy(false)
    }
  }
  return (
    <div className="inspiration-tile mb-7">
      <h2 className="text-lg font-semibold">Creator payouts</h2>
      <p className="mt-2 text-sm text-text-secondary">
        {available
          ? "Set up your creator account with the payment provider before selling source projects."
          : "Paid source sales are not enabled yet. Free play, creator notes, and collections are available."}
      </p>
      {available && (
        <div className="mt-4 flex flex-wrap gap-3">
          <button disabled={busy} className="community-button" onClick={setup}>
            Set up creator payouts
          </button>
          <button disabled={busy} className="community-button" onClick={check}>
            Check payout status
          </button>
        </div>
      )}
      {message && (
        <p role="status" className="mt-3 text-sm">
          {message}
        </p>
      )}
    </div>
  )
}
