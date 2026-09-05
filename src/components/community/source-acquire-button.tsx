"use client"
import { useRef, useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import { useSession } from "next-auth/react"
export function SourceAcquireButton({
  id,
  priceCents,
  available,
}: {
  id: string
  priceCents: number
  available: boolean
}) {
  const { data: session } = useSession()
  const router = useRouter()
  const pathname = usePathname()
  const [busy, setBusy] = useState(false),
    [error, setError] = useState("")
  const key = useRef<string | null>(null)
  async function acquire() {
    if (!session?.user) {
      router.push("/login?callbackUrl=" + encodeURIComponent(pathname + "#source-project"))
      return
    }
    setBusy(true)
    setError("")
    try {
      key.current ||= crypto.randomUUID()
      const r = await fetch("/api/source/" + id + "/checkout", {
        method: "POST",
        headers: { "Idempotency-Key": key.current },
      })
      const d = await r.json()
      if (!r.ok) throw new Error(d.error)
      window.location.assign(d.url)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not open checkout.")
      setBusy(false)
    }
  }
  return (
    <div>
      <button
        className="community-button primary"
        disabled={busy || (!available && priceCents > 0)}
        onClick={acquire}
      >
        {busy
          ? "Opening…"
          : priceCents === 0
            ? "Get free source"
            : available
              ? "Get source — $" + (priceCents / 100).toFixed(2)
              : "Purchases unavailable"}
      </button>
      {error && (
        <p role="alert" className="mt-2 text-sm text-danger-text">
          {error}
        </p>
      )}
    </div>
  )
}
