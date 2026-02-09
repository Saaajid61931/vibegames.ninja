"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { usePathname, useSearchParams } from "next/navigation"

const LOADING_PHRASES = [
  "INITIALIZING VIBE ENGINE...",
  "INSERTING VIRTUAL COIN...",
  "GENERATING PIXELS...",
  "TUNING PHYSICS...",
  "SPAWNING BOSSES...",
  "PRESSING START...",
]

const PHRASE_INTERVAL_MS = 600
const COMPLETE_DELAY_MS = 280
const FAILSAFE_TIMEOUT_MS = 12000

function isModifiedClick(event: MouseEvent) {
  return event.metaKey || event.ctrlKey || event.shiftKey || event.altKey
}

export function PageTransitionLoader() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const routeSignature = useMemo(
    () => `${pathname}?${searchParams.toString()}`,
    [pathname, searchParams]
  )

  const [isActive, setIsActive] = useState(false)
  const [isReady, setIsReady] = useState(false)
  const [phraseIndex, setPhraseIndex] = useState(0)
  const [progress, setProgress] = useState(0)

  const phraseIntervalRef = useRef<number | null>(null)
  const progressFrameRef = useRef<number | null>(null)
  const finishTimeoutRef = useRef<number | null>(null)
  const failsafeTimeoutRef = useRef<number | null>(null)
  const finishFrameRef = useRef<number | null>(null)
  const currentRouteRef = useRef(routeSignature)
  const transitionPendingRef = useRef(false)

  const stopMotion = useCallback(() => {
    if (phraseIntervalRef.current) {
      window.clearInterval(phraseIntervalRef.current)
      phraseIntervalRef.current = null
    }

    if (progressFrameRef.current) {
      window.cancelAnimationFrame(progressFrameRef.current)
      progressFrameRef.current = null
    }

    if (failsafeTimeoutRef.current) {
      window.clearTimeout(failsafeTimeoutRef.current)
      failsafeTimeoutRef.current = null
    }

    if (finishFrameRef.current) {
      window.cancelAnimationFrame(finishFrameRef.current)
      finishFrameRef.current = null
    }
  }, [])

  const finishTransition = useCallback(() => {
    if (!transitionPendingRef.current) {
      return
    }

    transitionPendingRef.current = false
    stopMotion()

    setIsReady(true)
    setProgress(100)

    if (finishTimeoutRef.current) {
      window.clearTimeout(finishTimeoutRef.current)
    }

    finishTimeoutRef.current = window.setTimeout(() => {
      setIsActive(false)
      setIsReady(false)
      setPhraseIndex(0)
      setProgress(0)
      finishTimeoutRef.current = null
    }, COMPLETE_DELAY_MS)
  }, [stopMotion])

  const startTransition = useCallback(() => {
    if (transitionPendingRef.current) {
      return
    }

    transitionPendingRef.current = true

    if (finishTimeoutRef.current) {
      window.clearTimeout(finishTimeoutRef.current)
      finishTimeoutRef.current = null
    }

    setIsActive(true)
    setIsReady(false)
    setPhraseIndex(0)
    setProgress(0)

    phraseIntervalRef.current = window.setInterval(() => {
      setPhraseIndex((prev) => (prev + 1) % LOADING_PHRASES.length)
    }, PHRASE_INTERVAL_MS)

    const animateProgress = () => {
      setProgress((prev) => {
        if (prev >= 90) {
          return prev
        }

        const increment = Math.max((90 - prev) * 0.08, 0.25)
        return Math.min(prev + increment, 90)
      })

      progressFrameRef.current = window.requestAnimationFrame(animateProgress)
    }

    progressFrameRef.current = window.requestAnimationFrame(animateProgress)
    failsafeTimeoutRef.current = window.setTimeout(
      finishTransition,
      FAILSAFE_TIMEOUT_MS
    )
  }, [finishTransition])

  useEffect(() => {
    const onDocumentClick = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0 || isModifiedClick(event)) {
        return
      }

      const target = event.target
      if (!(target instanceof Element)) {
        return
      }

      const anchor = target.closest("a")
      if (!(anchor instanceof HTMLAnchorElement)) {
        return
      }

      if (anchor.target && anchor.target !== "_self") {
        return
      }

      if (anchor.hasAttribute("download") || anchor.dataset.noLoader === "true") {
        return
      }

      const href = anchor.getAttribute("href")
      if (!href || href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("tel:")) {
        return
      }

      const nextUrl = new URL(anchor.href, window.location.href)
      const currentUrl = new URL(window.location.href)
      const isSamePage =
        nextUrl.origin === currentUrl.origin &&
        nextUrl.pathname === currentUrl.pathname &&
        nextUrl.search === currentUrl.search

      if (nextUrl.origin !== currentUrl.origin || isSamePage) {
        return
      }

      startTransition()
    }

    const onPopState = () => {
      startTransition()
    }

    const onFormSubmit = (event: SubmitEvent) => {
      if (event.defaultPrevented) {
        return
      }

      const target = event.target
      if (!(target instanceof HTMLFormElement)) {
        return
      }

      if (target.target && target.target !== "_self") {
        return
      }

      startTransition()
    }

    document.addEventListener("click", onDocumentClick, true)
    document.addEventListener("submit", onFormSubmit, true)
    window.addEventListener("popstate", onPopState)

    return () => {
      document.removeEventListener("click", onDocumentClick, true)
      document.removeEventListener("submit", onFormSubmit, true)
      window.removeEventListener("popstate", onPopState)
    }
  }, [startTransition])

  useEffect(() => {
    if (currentRouteRef.current !== routeSignature) {
      currentRouteRef.current = routeSignature

      finishFrameRef.current = window.requestAnimationFrame(() => {
        finishFrameRef.current = null
        finishTransition()
      })
    }
  }, [finishTransition, routeSignature])

  useEffect(() => {
    return () => {
      stopMotion()

      if (finishTimeoutRef.current) {
        window.clearTimeout(finishTimeoutRef.current)
        finishTimeoutRef.current = null
      }
    }
  }, [stopMotion])

  return (
    <div
      id="vibe-loader"
      className={isActive ? "vibe-loader vibe-loader-active" : "vibe-loader vibe-loader-hidden"}
      aria-hidden={!isActive}
    >
      <div className="vibe-loader-grid" />

      <div className="vibe-loader-content">
        <div className="vibe-loader-icon" aria-hidden="true">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
            <path d="M21 6H3c-1.1 0-2 .9-2 2v8c0 1.1.9 2 2 2h18c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm-10 7H8v3H6v-3H3v-2h3V8h2v3h3v2zm4.5 2c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm3-3c-.83 0-1.5-.67-1.5-1.5S17.67 9 18.5 9s1.5.67 1.5 1.5-.67 1.5-1.5 1.5z" />
          </svg>
        </div>

        <h2 id="loader-text" className="vibe-loader-title">
          {isReady ? "READY!" : LOADING_PHRASES[phraseIndex]}
        </h2>

        <div className="vibe-loader-progress-box">
          <div className="vibe-loader-progress-track">
            <div
              id="progress-fill"
              className={`vibe-loader-progress-fill${isReady ? " is-ready" : ""}`}
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        <p className="vibe-loader-blink">PLEASE WAIT</p>
      </div>
    </div>
  )
}
