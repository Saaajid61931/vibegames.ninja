"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { usePathname, useSearchParams } from "next/navigation"

const COMPLETE_DELAY_MS = 200
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
  const [progress, setProgress] = useState(0)

  const progressFrameRef = useRef<number | null>(null)
  const finishTimeoutRef = useRef<number | null>(null)
  const failsafeTimeoutRef = useRef<number | null>(null)
  const finishFrameRef = useRef<number | null>(null)
  const currentRouteRef = useRef(routeSignature)
  const transitionPendingRef = useRef(false)

  const stopMotion = useCallback(() => {
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

    setProgress(100)

    if (finishTimeoutRef.current) {
      window.clearTimeout(finishTimeoutRef.current)
    }

    finishTimeoutRef.current = window.setTimeout(() => {
      setIsActive(false)
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
    setProgress(0)

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
      className="fixed top-0 left-0 right-0 z-[9999] pointer-events-none"
      style={{ 
        opacity: isActive ? 1 : 0, 
        transition: "opacity 200ms ease-in-out" 
      }}
      aria-hidden={!isActive}
    >
      <div
        className="h-[3px] bg-[var(--color-primary)] shadow-[0_0_10px_var(--color-primary)]"
        style={{
          width: `${progress}%`,
          transition: progress === 100 ? "width 100ms ease-out" : "width 100ms linear"
        }}
      />
    </div>
  )
}
