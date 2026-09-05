"use client"
import {SaveGameButton} from "@/components/community/save-game-button"
import { MobileHomeIntroSlide } from "@/components/home/mobile-home-intro-slide"


import { useState, useEffect, useRef, useCallback } from "react"
import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import {
  ArrowUpRight,
  Flag,
  Gamepad2,
  Heart,
  Lightbulb,
  Loader2,
  Maximize2,
  MessageCircle,
  RefreshCcw,
  Share2,
} from "lucide-react"
import { DownloadCodeButton } from "@/components/games/download-code-button"
import { GameThumbnailPlaceholder } from "@/components/games/game-thumbnail-placeholder"
import { NinjaConsole } from "@/components/icons/ninja-console"

import type { HomeBackdropGame } from "@/components/home/home-game-backdrop"
import type { HomePageData } from "@/lib/home-page-data"

interface FeedGame {
  id: string
  slug: string
  title: string
  description: string
  gameUrl: string
  thumbnail: string | null
  thumbnailSlides?: string[]
  category?: { value: string; label: string } | string | null
  plays: number
  likes: number
  supportsMobile: boolean
  mobileOrientation: "BOTH" | "PORTRAIT" | "LANDSCAPE"
  hasLevelEditor?: boolean
  aiTool: string | null
  aiModel: string | null
  seekingFeedback?: boolean
  latestUpdateNote?: string | null
  studioProfile?: { id: string; handle: string; displayName: string; image: string | null } | null
  creator?: { id: string; name: string | null; username: string | null; image: string | null; bio?: string | null }
}

interface MobileReelsFeedProps {
  games: FeedGame[]
  backgroundGames: HomeBackdropGame[]
  stats: HomePageData["stats"]
}

type LockableScreenOrientation = ScreenOrientation & {
  lock?: (orientation: "landscape") => Promise<void>
  unlock?: () => void
}

type VendorFullscreenElement = HTMLElement & {
  webkitRequestFullscreen?: () => Promise<void> | void
  msRequestFullscreen?: () => Promise<void> | void
}

type VendorFullscreenDocument = Document & {
  webkitExitFullscreen?: () => Promise<void> | void
  msExitFullscreen?: () => Promise<void> | void
}

type FeedLoadState = "loading" | "ready" | "empty" | "error"
type FrameLoadState = "loading" | "ready" | "slow"
type FeedbackKind = "IDEA" | "BUG"
type FeedbackStatus = { type: "success" | "error"; message: string } | null

const MAX_FEED_ITEMS = 80

const reelActionClass =
  "flex h-12 w-full min-w-0 items-center justify-center border-2 border-border-strong bg-surface text-text-secondary shadow-[2px_2px_0_#000] transition-colors hover:border-arcade-yellow hover:text-arcade-yellow active:translate-x-0.5 active:translate-y-0.5 active:shadow-none disabled:opacity-50"

const normalizeFeedGames = (items: FeedGame[]) =>
  items.filter(
    (game) =>
      Boolean(game?.id) &&
      Boolean(game?.slug) &&
      Boolean(game?.gameUrl?.trim())
  )

function ReelPoster({ game, muted = false }: { game: FeedGame; muted?: boolean }) {
  const [imageFailed, setImageFailed] = useState(false)
  const thumbnail = game.thumbnail?.trim() || ""
  const showThumbnail = Boolean(thumbnail) && !imageFailed

  return (
    <div className="absolute inset-0 overflow-hidden bg-surface">
      {showThumbnail ? (
        <Image
          src={thumbnail}
          alt=""
          fill
          sizes="(max-width: 767px) 100vw, 1px"
          draggable={false}
          onError={() => setImageFailed(true)}
          className={`h-full w-full object-cover transition-opacity ${muted ? "opacity-45" : "opacity-70"}`}
        />
      ) : (
        <GameThumbnailPlaceholder title={game.title} compact />
      )}
      <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(7,9,14,0.1),rgba(7,9,14,0.48))]" />
    </div>
  )
}

interface ActiveGameFrameProps {
  game: FeedGame
  index: number
  isActive: boolean
  isInteractive: boolean
  isFullscreen: boolean
  rotateLandscape: boolean
  width: number
  height: number
  logicalWidth: number
  logicalHeight: number
  onInteractionChange: (interactive: boolean) => void
  onTouchStart: (event: React.TouchEvent) => void
  onTouchEnd: (event: React.TouchEvent) => void
  onOpenGame: () => void
}

function ActiveGameFrame({
  game,
  index,
  isActive,
  isInteractive,
  isFullscreen,
  rotateLandscape,
  width,
  height,
  logicalWidth,
  logicalHeight,
  onInteractionChange,
  onTouchStart,
  onTouchEnd,
  onOpenGame,
}: ActiveGameFrameProps) {
  const [frameState, setFrameState] = useState<FrameLoadState>("loading")
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    if (frameState !== "loading") return

    const timer = window.setTimeout(() => {
      setFrameState((current) => current === "loading" ? "slow" : current)
    }, 9000)

    return () => window.clearTimeout(timer)
  }, [attempt, frameState])

  const retry = () => {
    setFrameState("loading")
    setAttempt((current) => current + 1)
  }

  const exitFullscreen = () => {
    const fullscreenDocument = document as VendorFullscreenDocument
    if (fullscreenDocument.exitFullscreen) {
      void fullscreenDocument.exitFullscreen()
    } else if (fullscreenDocument.webkitExitFullscreen) {
      void fullscreenDocument.webkitExitFullscreen()
    } else if (fullscreenDocument.msExitFullscreen) {
      void fullscreenDocument.msExitFullscreen()
    }
  }

  return (
    <div className="relative flex h-full w-full items-center justify-center bg-canvas">
      <ReelPoster game={game} />

      <iframe
        key={`${game.id}-${index}-${attempt}`}
        id={`iframe-${game.id}-${index}`}
        src={game.gameUrl}
        title={game.title}
        loading="eager"
        onLoad={() => setFrameState("ready")}
        onError={() => setFrameState("slow")}
        className={`border-0 bg-black transition-opacity duration-500 ${
          frameState === "ready" ? "opacity-100" : "opacity-0"
        } ${isInteractive || isFullscreen ? "pointer-events-auto" : "pointer-events-none"}`}
        sandbox="allow-scripts allow-same-origin allow-pointer-lock allow-forms"
        allow="fullscreen; gamepad; accelerometer; gyroscope"
        style={
          rotateLandscape ? {
            width: `${logicalWidth}px`,
            height: `${logicalHeight}px`,
            transform: "rotate(90deg)",
            transformOrigin: "center",
            position: "absolute",
            left: `${(width - logicalWidth) / 2}px`,
            top: `${(height - logicalHeight) / 2}px`,
          } : {
            width: "100%",
            height: "100%",
            position: "absolute",
            inset: 0,
          }
        }
      />

      {isActive && frameState === "slow" ? (
        <div className="absolute inset-0 z-30 flex items-center justify-center bg-canvas/82 p-6">
          <div className="w-full max-w-xs border-2 border-border-strong bg-surface p-5 text-center shadow-[5px_5px_0_#000]">
            <span className="mx-auto flex h-11 w-11 items-center justify-center border-2 border-arcade-yellow bg-canvas text-arcade-yellow">
              <Gamepad2 className="h-5 w-5" />
            </span>
            <h3 className="mt-4 text-kicker  text-white">GAME STILL LOADING</h3>
            <p className="mt-2 text-xs leading-relaxed text-text-secondary">
              The game host is taking longer than usual. Retry here or open its full page.
            </p>
            <div className="mt-4 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={retry}
                className="flex h-10 items-center justify-center gap-2 border-2 border-border-strong bg-canvas text-kicker  text-white"
              >
                <RefreshCcw className="h-3.5 w-3.5" /> Retry
              </button>
              <button
                type="button"
                onClick={onOpenGame}
                className="flex h-10 items-center justify-center gap-2 border-2 border-arcade-yellow bg-arcade-yellow text-kicker text-canvas"
              >
                Open <ArrowUpRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {frameState === "ready" && !isInteractive && !isFullscreen ? (
        <div
          role="button"
          tabIndex={0}
          aria-label={`Tap to play ${game.title}`}
          onTouchStart={onTouchStart}
          onTouchEnd={onTouchEnd}
          onClick={() => onInteractionChange(true)}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault()
              onInteractionChange(true)
            }
          }}
          className="absolute inset-0 z-20 cursor-pointer touch-pan-y"
        >
          <span className="text-kicker pointer-events-none absolute bottom-4 left-1/2 flex -translate-x-1/2 items-center gap-2 whitespace-nowrap border-2 border-white bg-canvas/90 px-3 py-2 text-white [--shadow-color:var(--color-arcade-red)] shadow-hard-4">
            <Gamepad2 className="h-3.5 w-3.5 text-arcade-yellow" /> TAP TO PLAY
          </span>
        </div>
      ) : null}

      {isFullscreen ? (
        <button
          type="button"
          onClick={exitFullscreen}
          className="absolute right-4 top-4 z-30 flex h-9 w-9 items-center justify-center border-2 border-white bg-canvas text-sm text-white [--shadow-color:var(--color-arcade-red)] shadow-hard-2"
          title="Exit fullscreen"
          aria-label="Exit fullscreen"
        >
          ×
        </button>
      ) : null}
    </div>
  )
}

// Fisher-Yates Shuffle algorithm
const shuffleArray = (array: FeedGame[]) => {
  const arr = [...array]
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

const buildSeamlessFeed = (items: FeedGame[]) => {
  const source = normalizeFeedGames(items).slice(0, MAX_FEED_ITEMS)
  if (source.length === 0) return []

  const feed: FeedGame[] = []
  while (feed.length < MAX_FEED_ITEMS) {
    const batch = shuffleArray(source)
    const previousGame = feed.at(-1)

    if (batch.length > 1 && previousGame?.id === batch[0]?.id) {
      batch.push(batch.shift() as FeedGame)
    }

    feed.push(...batch.slice(0, MAX_FEED_ITEMS - feed.length))
  }

  return feed
}

export function MobileReelsFeed({
  games,
  backgroundGames,
  stats,
}: MobileReelsFeedProps) {
  const router = useRouter()
  const { data: session } = useSession()
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const firstGameSlideRef = useRef<HTMLDivElement>(null)
  const gameFrameRef = useRef<HTMLDivElement>(null)
  const scrollFrameRef = useRef<number | null>(null)
  const recoveryAbortRef = useRef<AbortController | null>(null)

  // Endless scrolling randomized feed state
  const [feedGames, setFeedGames] = useState<FeedGame[]>([])
  const [feedLoadState, setFeedLoadState] = useState<FeedLoadState>("loading")
  const [activeIndex, setActiveIndex] = useState(-1)

  // Fullscreen tracking state
  const [isFullscreen, setIsFullscreen] = useState(false)

  // Fullscreen button animation reminder state
  const [showFullscreenHint, setShowFullscreenHint] = useState(false)

  // Interactive play state inside feed
  const [isInteractive, setIsInteractive] = useState(false)
  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null)

  // Dynamic iframe sizing state measured via ResizeObserver
  const [frameWidth, setFrameWidth] = useState(0)
  const [frameHeight, setFrameHeight] = useState(0)

  // Local likes tracking
  const [likesState, setLikesState] = useState<Record<string, { liked: boolean; count: number }>>({})
  const [likesLoading, setLikesLoading] = useState<Record<string, boolean>>({})

  // Suggest/report drawer state
  const [feedbackOpen, setFeedbackOpen] = useState(false)
  const [feedbackGameId, setFeedbackGameId] = useState<string | null>(null)
  const [feedbackKind, setFeedbackKind] = useState<FeedbackKind | null>(null)
  const [feedbackComment, setFeedbackComment] = useState("")
  const [feedbackSaving, setFeedbackSaving] = useState(false)
  const [feedbackStatus, setFeedbackStatus] = useState<FeedbackStatus>(null)

  const [toastMessage, setToastMessage] = useState<string | null>(null)

  // Track session checks we've already done
  const [fetchedSessionIds, setFetchedSessionIds] = useState<Set<string>>(new Set())

  const loadInitialGames = useCallback(async () => {
    recoveryAbortRef.current?.abort()
    const controller = new AbortController()
    recoveryAbortRef.current = controller
    setFeedLoadState("loading")

    try {
      const response = await fetch("/api/games?mobile=true&limit=50&page=1&sort=popular", {
        signal: controller.signal,
      })
      if (!response.ok) throw new Error("Feed request failed")

      const payload = await response.json()
      const recoveredGames = Array.isArray(payload.data)
        ? normalizeFeedGames(payload.data as FeedGame[])
        : []

      if (recoveredGames.length === 0) {
        setFeedGames([])
        setFeedLoadState("empty")
        return
      }

      setFeedGames(buildSeamlessFeed(recoveredGames))
      setFeedLoadState("ready")
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return
      console.error("Failed to recover Arcade Reels:", error)
      setFeedLoadState("error")
    }
  }, [])

  // Use the server payload immediately when available. If its database query
  // transiently returned an empty fallback, recover from the client API.
  useEffect(() => {
    const initialGames = normalizeFeedGames(games)
    if (initialGames.length > 0) {
      recoveryAbortRef.current?.abort()
      setFeedGames(buildSeamlessFeed(initialGames))
      setFeedLoadState("ready")
      return
    }

    void loadInitialGames()
  }, [games, loadInitialGames])

  useEffect(() => {
    return () => recoveryAbortRef.current?.abort()
  }, [])

  // Measure active game container height dynamically
  useEffect(() => {
    const element = gameFrameRef.current
    if (!element) return

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect
        setFrameWidth(width)
        setFrameHeight(height)
      }
    })

    observer.observe(element)
    return () => {
      observer.disconnect()
    }
  }, [activeIndex])

  // Fullscreen change listener to toggle pointer-events and orientation lock
  useEffect(() => {
    const handleFullscreenChange = async () => {
      const isCurrentlyFullscreen = !!document.fullscreenElement
      setIsFullscreen(isCurrentlyFullscreen)

      if (isCurrentlyFullscreen) {
        try {
          const game = feedGames[activeIndex]
          const orientation = screen.orientation as LockableScreenOrientation
          if (game && game.mobileOrientation === "LANDSCAPE" && orientation.lock) {
            await orientation.lock("landscape")
          }
        } catch (e) {
          console.warn("Screen orientation lock failed:", e)
        }
      } else {
        try {
          const orientation = screen.orientation as LockableScreenOrientation
          orientation.unlock?.()
        } catch (e) {
          console.warn("Screen orientation unlock failed:", e)
        }
      }
    }

    document.addEventListener("fullscreenchange", handleFullscreenChange)
    document.addEventListener("webkitfullscreenchange", handleFullscreenChange)
    document.addEventListener("mozfullscreenchange", handleFullscreenChange)
    document.addEventListener("MSFullscreenChange", handleFullscreenChange)

    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange)
      document.removeEventListener("webkitfullscreenchange", handleFullscreenChange)
      document.removeEventListener("mozfullscreenchange", handleFullscreenChange)
      document.removeEventListener("MSFullscreenChange", handleFullscreenChange)
    }
  }, [activeIndex, feedGames])

  // Fullscreen hint timer: turns on after 1 minute of active slide inactivity
  // Also reset inline feed game interaction on active slide change
  useEffect(() => {
    setShowFullscreenHint(false)
    setIsInteractive(false)
    const timer = setTimeout(() => {
      setShowFullscreenHint(true)
    }, 60000) // 1 minute (60,000 ms)
    return () => clearTimeout(timer)
  }, [activeIndex])

  // Initialize likes for the feed list
  useEffect(() => {
    if (feedGames.length === 0) return
    setLikesState((prev) => {
      const next = { ...prev }
      feedGames.forEach((game) => {
        if (next[game.id] === undefined) {
          next[game.id] = { liked: false, count: game.likes }
        }
      })
      return next
    })
  }, [feedGames])

  // Fetch session data only for active and adjacent slides
  useEffect(() => {
    if (feedGames.length === 0 || !session?.user?.id) return

    const indicesToFetch = [activeIndex - 1, activeIndex, activeIndex + 1, activeIndex + 2]
      .filter((idx) => idx >= 0 && idx < feedGames.length)

    indicesToFetch.forEach(async (idx) => {
      const game = feedGames[idx]
      if (!game || fetchedSessionIds.has(game.id)) return

      // Add to fetched list immediately to prevent duplicate concurrent calls
      setFetchedSessionIds((prev) => {
        const next = new Set(prev)
        next.add(game.id)
        return next
      })

      try {
        const res = await fetch(`/api/games/${game.id}/like`)
        if (res.ok) {
          const data = await res.json()
          setLikesState((prev) => ({
            ...prev,
            [game.id]: { liked: Boolean(data.liked), count: Number(data.likes) || game.likes }
          }))
        }
      } catch (e) {
        console.error("Failed to check game like status:", e)
        setFetchedSessionIds((prev) => {
          const next = new Set(prev)
          next.delete(game.id)
          return next
        })
      }
    })
  }, [activeIndex, feedGames, session, fetchedSessionIds])

  // Calculate the snapped slide directly from scroll position. This keeps the
  // active iframe in sync even when a fast swipe skips virtualized slides.
  const syncActiveSlide = useCallback(() => {
    const container = scrollContainerRef.current
    if (!container) return

    const slideHeight = Math.max(container.clientHeight, 1)
    const snappedPosition = Math.round(container.scrollTop / slideHeight)
    const maxIndex = Math.max(feedGames.length - 1, 0)
    const nextIndex = Math.min(Math.max(snappedPosition - 1, -1), maxIndex)
    setActiveIndex((current) => current === nextIndex ? current : nextIndex)
  }, [feedGames.length])

  const handleFeedScroll = useCallback(() => {
    if (scrollFrameRef.current !== null) return

    scrollFrameRef.current = window.requestAnimationFrame(() => {
      scrollFrameRef.current = null
      syncActiveSlide()
    })
  }, [syncActiveSlide])

  useEffect(() => {
    syncActiveSlide()
    window.addEventListener("resize", syncActiveSlide)
    window.visualViewport?.addEventListener("resize", syncActiveSlide)

    return () => {
      window.removeEventListener("resize", syncActiveSlide)
      window.visualViewport?.removeEventListener("resize", syncActiveSlide)
      if (scrollFrameRef.current !== null) {
        window.cancelAnimationFrame(scrollFrameRef.current)
        scrollFrameRef.current = null
      }
    }
  }, [syncActiveSlide])

  // Custom toast trigger
  const triggerToast = (msg: string) => {
    setToastMessage(msg)
    setTimeout(() => {
      setToastMessage(null)
    }, 2500)
  }

  // Handle Like Action
  const handleLike = async (gameId: string) => {
    if (!session?.user?.id) {
      router.push(`/login?callbackUrl=${encodeURIComponent("/")}`)
      return
    }

    if (likesLoading[gameId]) return

    setLikesLoading((prev) => ({ ...prev, [gameId]: true }))
    try {
      const res = await fetch(`/api/games/${gameId}/like`, { method: "POST" })
      if (res.ok) {
        const data = await res.json()
        setLikesState((prev) => ({
          ...prev,
          [gameId]: { liked: Boolean(data.liked), count: Number(data.likes) || 0 }
        }))
        triggerToast(data.liked ? "Appreciation sent" : "Appreciation removed")
      }
    } catch (e) {
      console.error("Like failed:", e)
    } finally {
      setLikesLoading((prev) => ({ ...prev, [gameId]: false }))
    }
  }

  const openFeedback = (gameId: string) => {
    setFeedbackGameId(gameId)
    setFeedbackKind(null)
    setFeedbackComment("")
    setFeedbackStatus(null)
    setFeedbackOpen(true)
  }

  const submitFeedback = async (event: React.FormEvent) => {
    event.preventDefault()
    if (
      !session?.user?.id ||
      !feedbackGameId ||
      !feedbackKind ||
      feedbackComment.trim().length < 5 ||
      feedbackSaving
    ) return

    setFeedbackSaving(true)
    setFeedbackStatus(null)

    try {
      const response = await fetch(`/api/games/${feedbackGameId}/feedback`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kind: feedbackKind,
          comment: feedbackComment.trim(),
          context: {
            userAgent: navigator.userAgent,
            viewport: `${window.innerWidth}x${window.innerHeight}`,
          },
        }),
      })
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Could not send feedback")
      }

      const message = data.message || "Feedback sent to the creator."
      setFeedbackStatus({ type: "success", message })
      setFeedbackComment("")
      triggerToast(message)
    } catch (error) {
      setFeedbackStatus({
        type: "error",
        message: error instanceof Error ? error.message : "Could not send feedback",
      })
    } finally {
      setFeedbackSaving(false)
    }
  }

  // Share Game Action
  const shareGame = async (game: FeedGame) => {
    const url = `${window.location.origin}/play/${game.slug}`
    if (navigator.share) {
      try {
        await navigator.share({
          title: game.title,
          text: `Play ${game.title} - AI arcade games on VibeGames!`,
          url: url
        })
      } catch (e) {
        console.error("Native share failed:", e)
      }
    } else {
      try {
        await navigator.clipboard.writeText(url)
        triggerToast("Share link copied")
      } catch (e) {
        console.error("Copy failed:", e)
      }
    }
  }

  // Directly Fullscreen the wrapper container of the active Iframe
  const toggleFullscreen = (index: number) => {
    const activeId = feedGames[index]?.id
    if (!activeId) return
    const container = document.getElementById(`frame-container-${activeId}-${index}`)
    if (container) {
      try {
        const fullscreenContainer = container as VendorFullscreenElement
        if (fullscreenContainer.requestFullscreen) {
          void fullscreenContainer.requestFullscreen()
        } else if (fullscreenContainer.webkitRequestFullscreen) {
          void fullscreenContainer.webkitRequestFullscreen()
        } else if (fullscreenContainer.msRequestFullscreen) {
          void fullscreenContainer.msRequestFullscreen()
        }
      } catch (error) {
        console.error("Fullscreen request failed:", error)
        router.push(`/play/${feedGames[index].slug}`)
      }
    }
  }

  // Touch gesture handlers to detect clicks vs scrolls
  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0]
    if (touch) {
      touchStartRef.current = {
        x: touch.clientX,
        y: touch.clientY,
        time: Date.now()
      }
    }
  }

  const handleTouchEnd = (e: React.TouchEvent) => {
    const start = touchStartRef.current
    if (!start) return
    touchStartRef.current = null

    const touch = e.changedTouches[0]
    if (touch) {
      const dx = Math.abs(touch.clientX - start.x)
      const dy = Math.abs(touch.clientY - start.y)
      const dt = Date.now() - start.time

      // If it's a tap (moved less than 10px and duration less than 250ms)
      if (dx < 10 && dy < 10 && dt < 250) {
        setIsInteractive(true)
      }
    }
  }

  const startPlaying = () => {
    const container = scrollContainerRef.current
    if (!container) return
    container.scrollTo({
      top: container.clientHeight,
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
    })
  }

  // Measured width and height fallbacks
  const width = frameWidth || (typeof window !== "undefined" ? window.innerWidth : 360)
  const height = frameHeight || (typeof window !== "undefined" ? window.innerHeight - 80 : 480)

  return (
    <div className="relative flex h-[100dvh] w-full flex-col overflow-hidden bg-canvas text-white">
      {activeIndex >= 0 && !isFullscreen ? (
        <nav
          aria-label="Arcade Reels shortcuts"
          className="absolute inset-x-0 top-0 z-40 flex items-center justify-between px-[max(0.75rem,env(safe-area-inset-left))] pt-[max(0.75rem,env(safe-area-inset-top))]"
        >
          <Link
            href="/games"
            className="text-kicker flex h-9 items-center gap-2 border-2 border-border-strong bg-canvas/90 px-3 text-white shadow-hard-2 backdrop-blur hover:border-arcade-yellow hover:text-arcade-yellow"
          >
            <Gamepad2 className="h-3.5 w-3.5" aria-hidden="true" />
            Browse
          </Link>
          <Link
            href="/upload"
            prefetch={false}
            className="text-kicker flex h-9 items-center gap-2 border-2 border-arcade-yellow bg-canvas/90 px-3 text-arcade-yellow shadow-hard-2 backdrop-blur hover:bg-arcade-yellow hover:text-canvas"
          >
            Share
            <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
          </Link>
        </nav>
      ) : null}
      <div
        ref={scrollContainerRef}
        onScroll={handleFeedScroll}
        className="scrollbar-none flex min-h-0 w-full flex-1 touch-pan-y snap-y snap-mandatory flex-col overflow-y-scroll overscroll-y-contain"
        style={{ WebkitOverflowScrolling: "touch" }}
      >


        <MobileHomeIntroSlide
          backgroundGames={games.length ? games : backgroundGames}
          stats={stats}
          onStart={startPlaying}
        />

        {feedGames.length === 0 ? (
          <div
            ref={firstGameSlideRef}
            data-index="0"
            data-slide
            aria-live="polite"
            className="relative flex h-full w-full shrink-0 snap-start snap-always items-center justify-center overflow-hidden bg-canvas px-7 text-center"
            style={{ height: "100%" }}
          >
            <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(0,209,255,0.08),transparent_45%,rgba(244,63,94,0.08))]" />
            <div className="relative w-full max-w-xs border-2 border-border-strong bg-surface p-7 shadow-[6px_6px_0_#000]">
              <span className="mx-auto flex h-14 w-14 items-center justify-center border-2 border-arcade-yellow bg-canvas text-arcade-yellow">
                {feedLoadState === "loading" ? (
                  <NinjaConsole className="h-10 w-10" animated />
                ) : feedLoadState === "error" ? (
                  <RefreshCcw className="h-6 w-6" />
                ) : (
                  <Gamepad2 className="h-6 w-6" />
                )}
              </span>
              <p className="mt-5 text-kicker  text-arcade-cyan">ARCADE REELS</p>
              <h2 className="heading-pixel-sm mt-3 text-white">
                {feedLoadState === "loading"
                  ? "Loading the next cabinet"
                  : feedLoadState === "error"
                    ? "The feed missed a beat"
                    : "No mobile games yet"}
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-text-secondary">
                {feedLoadState === "loading"
                  ? "Finding mobile-ready games for you now."
                  : feedLoadState === "error"
                    ? "The arcade list did not arrive. Try again in a moment."
                    : "Fresh mobile-ready games will appear here as creators publish them."}
              </p>
              {feedLoadState !== "loading" ? (
                <div className="mt-5 grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => void loadInitialGames()}
                    className="flex h-11 items-center justify-center gap-2 border-2 border-border-strong bg-canvas text-kicker  text-white"
                  >
                    <RefreshCcw className="h-3.5 w-3.5" /> Retry
                  </button>
                  <button
                    type="button"
                    onClick={() => router.push("/games?mobile=true")}
                    className="flex h-11 items-center justify-center gap-2 border-2 border-arcade-yellow bg-arcade-yellow text-kicker text-canvas"
                  >
                    Browse <ArrowUpRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              ) : null}
            </div>
          </div>
        ) : null}

        {feedGames.map((game, index) => {
          const isActive = index === activeIndex
          const shouldRender = index === activeIndex

          const gameLikes = likesState[game.id] || { liked: false, count: game.likes }

          // Check if rotation to landscape is needed on a portrait mobile screen
          const rotateLandscape = height > width && game.mobileOrientation === "LANDSCAPE"
          const logicalHeight = rotateLandscape ? width : height
          const logicalWidth = rotateLandscape ? height : width

          // A lightweight poster keeps fast swipes from ever landing on an
          // empty spacer while the active iframe catches up.
          if (!shouldRender) {
            return (
              <div
                key={`${game.id}-${index}`}
                data-index={index}
                data-slide
                className="relative h-full w-full shrink-0 snap-start snap-always overflow-hidden bg-canvas"
                style={{ height: "100%" }}
              >
                <ReelPoster game={game} muted />
              </div>
            )
          }

          return (
            <div
              ref={index === 0 ? firstGameSlideRef : undefined}
              key={`${game.id}-${index}`}
              data-index={index}
              data-slide
              className="relative flex h-full w-full shrink-0 snap-start snap-always flex-col overflow-hidden bg-canvas landscape:flex-row"
              style={{ height: "100%" }}
            >
              {!isFullscreen && <div className="z-30 flex min-h-24 shrink-0 items-end justify-between gap-3 bg-canvas px-4 pb-2 pt-12"><div className="min-w-0"><Link href={`/play/${game.slug}`} className="block truncate text-sm font-semibold">{game.title}</Link>{game.creator?.username && <Link href={`/creator/${game.creator.username}`} className="block truncate text-xs text-primary-text">by {game.creator.name || game.creator.username}</Link>}</div><SaveGameButton gameId={game.id} slug={game.slug} compact /></div>}
              {/* Game Frame Area */}
              <div
                ref={isActive ? gameFrameRef : null}
                id={`frame-container-${game.id}-${index}`}
                className="relative flex w-full flex-1 items-center justify-center overflow-hidden bg-canvas"
              >
                <ActiveGameFrame
                  game={game}
                  index={index}
                  isActive={isActive}
                  isInteractive={isActive && isInteractive}
                  isFullscreen={isActive && isFullscreen}
                  rotateLandscape={rotateLandscape}
                  width={width}
                  height={height}
                  logicalWidth={logicalWidth}
                  logicalHeight={logicalHeight}
                  onInteractionChange={setIsInteractive}
                  onTouchStart={handleTouchStart}
                  onTouchEnd={handleTouchEnd}
                  onOpenGame={() => router.push(`/play/${game.slug}`)}
                />
              </div>

              <div className="z-10 w-full shrink-0 select-none border-t-2 border-border-strong bg-canvas px-3 pb-[max(0.65rem,env(safe-area-inset-bottom))] pt-3 landscape:h-full landscape:w-[112px] landscape:border-l-2 landscape:border-t-0 landscape:p-2">
                <div className="grid grid-cols-5 gap-2 landscape:h-full landscape:grid-cols-2 landscape:content-center">
                  <button
                    type="button"
                    onClick={() => handleLike(game.id)}
                    disabled={likesLoading[game.id]}
                    className={`${reelActionClass} ${gameLikes.liked ? "border-arcade-red bg-arcade-red/15 text-arcade-red" : ""}`}
                    aria-label={`${gameLikes.liked ? "Unlike" : "Like"} ${game.title}`}
                    title={gameLikes.liked ? "Unlike" : "Like"}
                  >
                    {likesLoading[game.id] ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <Heart className={`h-5 w-5 ${gameLikes.liked ? "fill-current" : ""}`} />
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => openFeedback(game.id)}
                    className={reelActionClass}
                    aria-label={`Suggest an improvement or report a problem with ${game.title}`}
                    title="Suggest or report"
                  >
                    <MessageCircle className="h-5 w-5" />
                  </button>

                  <button
                    type="button"
                    onClick={() => shareGame(game)}
                    className={reelActionClass}
                    aria-label={`Share ${game.title}`}
                    title="Share"
                  >
                    <Share2 className="h-5 w-5" />
                  </button>

                  <button
                    type="button"
                    onClick={() => toggleFullscreen(index)}
                    className={`${reelActionClass} ${isActive && showFullscreenHint ? "border-arcade-yellow bg-arcade-yellow/15 text-arcade-yellow" : ""}`}
                    aria-label={`Play ${game.title} fullscreen`}
                    title="Fullscreen"
                  >
                    <Maximize2 className="h-5 w-5" />
                  </button>

                  <DownloadCodeButton game={game} variant="feed" className="landscape:col-span-2" />
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {toastMessage && (
        <div className="text-kicker absolute bottom-24 left-1/2 z-50 -translate-x-1/2 whitespace-nowrap border-2 border-arcade-yellow bg-canvas px-4 py-3 text-arcade-yellow [--shadow-color:var(--color-arcade-red)] shadow-hard-4">
          {toastMessage}
        </div>
      )}

      {feedbackOpen && feedbackGameId && (
        <div className="absolute inset-0 z-40 flex flex-col justify-end bg-black/80">
          <button
            type="button"
            className="flex-1 cursor-default"
            onClick={() => setFeedbackOpen(false)}
            aria-label="Close player input"
          />

          <div className="relative w-full animate-slide-up border-t-4 border-arcade-cyan bg-canvas shadow-[0_-6px_0_rgba(0,0,0,0.55)]">
            <div className="flex items-center justify-between border-b-2 border-border-strong px-4 py-3">
              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center border-2 border-arcade-cyan bg-surface text-arcade-cyan">
                  <MessageCircle className="h-4 w-4" />
                </span>
                <div>
                  <h2 className="text-kicker  text-white">PLAYER INPUT</h2>
                  <p className="mt-1 text-kicker  text-text-secondary">SEND IT TO THE CREATOR</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setFeedbackOpen(false)}
                className="border-2 border-border-strong bg-surface px-3 py-2 text-kicker  text-text-secondary hover:border-white hover:text-white"
              >
                [X]
              </button>
            </div>

            <form
              onSubmit={submitFeedback}
              className="space-y-3 px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-4"
            >
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setFeedbackKind("IDEA")
                    setFeedbackStatus(null)
                  }}
                  className={`flex h-14 items-center justify-center gap-2 border-2 text-kicker  shadow-[3px_3px_0_#000] transition-colors ${
                    feedbackKind === "IDEA"
                      ? "border-arcade-cyan bg-arcade-cyan/10 text-arcade-cyan"
                      : "border-border-strong bg-surface text-text-secondary"
                  }`}
                >
                  <Lightbulb className="h-4 w-4" /> SUGGEST
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setFeedbackKind("BUG")
                    setFeedbackStatus(null)
                  }}
                  className={`flex h-14 items-center justify-center gap-2 border-2 text-kicker  shadow-[3px_3px_0_#000] transition-colors ${
                    feedbackKind === "BUG"
                      ? "border-arcade-red bg-arcade-red/10 text-arcade-red"
                      : "border-border-strong bg-surface text-text-secondary"
                  }`}
                >
                  <Flag className="h-4 w-4" /> REPORT
                </button>
              </div>

              {feedbackKind ? (
                <>
                  <Textarea
                    value={feedbackComment}
                    onChange={(event) => {
                      setFeedbackComment(event.target.value)
                      setFeedbackStatus(null)
                    }}
                    maxLength={500}
                    placeholder={
                      feedbackKind === "IDEA"
                        ? "What would make this game better?"
                        : "What broke, glitched, or did not work?"
                    }
                    className="min-h-[88px] rounded-none border-2 border-border-strong bg-surface text-xs text-white placeholder:text-text-secondary focus:border-arcade-cyan focus:ring-0"
                    disabled={feedbackSaving}
                  />
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-kicker  text-text-secondary">{feedbackComment.length}/500</span>
                    {session?.user?.id ? (
                      <Button
                        type="submit"
                        disabled={feedbackSaving || feedbackComment.trim().length < 5}
                        className={`h-10 rounded-none border-2 px-4 text-kicker  shadow-[3px_3px_0_#000] ${
                          feedbackKind === "IDEA"
                            ? "border-arcade-cyan bg-arcade-cyan text-canvas hover:bg-info-text"
                            : "border-arcade-red bg-arcade-red text-white hover:bg-danger-hover"
                        }`}
                      >
                        {feedbackSaving ? <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" /> : null}
                        {feedbackSaving
                          ? "SENDING..."
                          : feedbackKind === "IDEA"
                            ? "SEND SUGGESTION"
                            : "SEND REPORT"}
                      </Button>
                    ) : (
                      <Button
                        type="button"
                        onClick={() => router.push(`/login?callbackUrl=${encodeURIComponent("/")}`)}
                        className="text-kicker h-10 rounded-none border-2 border-arcade-yellow bg-arcade-yellow px-4 text-canvas shadow-hard-4 hover:bg-warning-text"
                      >
                        LOG IN TO SEND
                      </Button>
                    )}
                  </div>
                </>
              ) : (
                <p className="border border-border-strong bg-surface px-3 py-3 text-center text-kicker  leading-relaxed text-text-secondary">
                  CHOOSE SUGGEST OR REPORT
                </p>
              )}

              {feedbackStatus ? (
                <p
                  className={`border-2 px-3 py-3 text-center text-xs ${
                    feedbackStatus.type === "error"
                      ? "border-arcade-red bg-arcade-red/10 text-danger-text"
                      : "border-arcade-cyan bg-arcade-cyan/10 text-info-text"
                  }`}
                >
                  {feedbackStatus.message}
                </p>
              ) : null}
            </form>
          </div>
        </div>
      )}

    </div>
  )
}
