"use client"

import { useEffect, useRef } from "react"

interface PlayTrackerProps {
  gameId: string
  levelId?: string | null
}

export function PlayTracker({ gameId, levelId }: PlayTrackerProps) {
  const startedAtRef = useRef<number>(0)
  const shouldReportSessionRef = useRef(false)
  const hasReportedSessionRef = useRef(false)

  useEffect(() => {
    const params = new URLSearchParams()
    if (levelId) {
      params.set("levelId", levelId)
    }

    const endpoint = params.size > 0
      ? `/api/games/${gameId}/play?${params.toString()}`
      : `/api/games/${gameId}/play`
    const sessionEndpoint = `/api/games/${gameId}/session`

    try {
      const raw = window.localStorage.getItem("vg-recently-played")
      const parsed = raw ? JSON.parse(raw) : []
      const entries = Array.isArray(parsed) ? parsed : []
      const nextEntries = [
        { gameId, playedAt: new Date().toISOString() },
        ...entries.filter((entry) => entry && typeof entry.gameId === "string" && entry.gameId !== gameId),
      ].slice(0, 12)
      window.localStorage.setItem("vg-recently-played", JSON.stringify(nextEntries))
      window.dispatchEvent(new Event("vg-recently-played-change"))
    } catch {
      // Ignore storage issues.
    }

    startedAtRef.current = Date.now()
    shouldReportSessionRef.current = false
    hasReportedSessionRef.current = false

    const reportSession = () => {
      if (!shouldReportSessionRef.current || hasReportedSessionRef.current) {
        return
      }

      const sessionMinutes = Math.max(0.05, (Date.now() - startedAtRef.current) / 60000)
      const payload = JSON.stringify({ sessionMinutes })
      hasReportedSessionRef.current = true

      if (navigator.sendBeacon) {
        navigator.sendBeacon(sessionEndpoint, new Blob([payload], { type: "application/json" }))
        return
      }

      void fetch(sessionEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: payload,
        keepalive: true,
      }).catch(() => undefined)
    }

    const trackPlay = async () => {
      try {
        const res = await fetch(endpoint, {
          method: "POST",
          cache: "no-store",
        })
        const data = await res.json().catch(() => null)
        shouldReportSessionRef.current = Boolean(data?.gameIncremented)
      } catch (error) {
        console.error("Failed to track play", error)
      }
    }

    const handlePageHide = () => {
      reportSession()
    }

    window.addEventListener("pagehide", handlePageHide)
    void trackPlay()

    return () => {
      window.removeEventListener("pagehide", handlePageHide)
      reportSession()
    }
  }, [gameId, levelId])

  return null
}
