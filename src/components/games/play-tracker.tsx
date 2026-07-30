"use client"

import { useEffect, useRef } from "react"

interface PlayTrackerProps {
  gameId: string
  levelId?: string | null
}

export function PlayTracker({ gameId, levelId }: PlayTrackerProps) {
  const startedAtRef = useRef<number>(0)
  const hasStartedRef = useRef(false)
  const shouldReportSessionRef = useRef(false)
  const hasReportedSessionRef = useRef(false)

  useEffect(() => {
    const params = new URLSearchParams()
    if (levelId) {
      params.set("levelId", levelId)
    }

    const playEndpoint = params.size > 0
      ? `/api/games/${gameId}/play?${params.toString()}`
      : `/api/games/${gameId}/play`
    const impressionEndpoint = `/api/games/${gameId}/impression`
    const sessionEndpoint = `/api/games/${gameId}/session`

    hasStartedRef.current = false
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

    const saveRecentlyPlayed = () => {
      try {
        const raw = window.localStorage.getItem("vg-recently-played")
        const parsed = raw ? JSON.parse(raw) : []
        const entries = Array.isArray(parsed) ? parsed : []
        const nextEntries = [
          { gameId, playedAt: new Date().toISOString() },
          ...entries.filter(
            (entry) =>
              entry &&
              typeof entry.gameId === "string" &&
              entry.gameId !== gameId
          ),
        ].slice(0, 12)
        window.localStorage.setItem(
          "vg-recently-played",
          JSON.stringify(nextEntries)
        )
        window.dispatchEvent(new Event("vg-recently-played-change"))
      } catch {
        // Recent-play history is a convenience only.
      }
    }

    const trackPlay = async () => {
      if (hasStartedRef.current) {
        return
      }

      hasStartedRef.current = true
      startedAtRef.current = Date.now()
      saveRecentlyPlayed()

      try {
        const res = await fetch(playEndpoint, {
          method: "POST",
          cache: "no-store",
        })
        const data = await res.json().catch(() => null)
        shouldReportSessionRef.current = Boolean(data?.gameIncremented)
      } catch (error) {
        console.error("Failed to track play", error)
      }
    }

    const trackImpression = async () => {
      try {
        await fetch(impressionEndpoint, {
          method: "POST",
          cache: "no-store",
        })
      } catch (error) {
        console.error("Failed to track impression", error)
      }
    }

    const handlePageHide = () => {
      reportSession()
    }

    const handlePlayStart = () => {
      void trackPlay()
    }

    window.addEventListener("pagehide", handlePageHide)
    window.addEventListener("vg-game-play-start", handlePlayStart)
    void trackImpression()

    return () => {
      window.removeEventListener("pagehide", handlePageHide)
      window.removeEventListener("vg-game-play-start", handlePlayStart)
      reportSession()
    }
  }, [gameId, levelId])

  return null
}
