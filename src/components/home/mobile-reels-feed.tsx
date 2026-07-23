"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Loader2 } from "lucide-react"
import { GameThumbnailSlideshow } from "@/components/games/game-thumbnail-slideshow"

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
}

interface CommentItem {
  id: string
  content: string
  createdAt: string
  user: {
    id: string
    name: string | null
    username: string | null
    image: string | null
  }
}

type BrowserScreenOrientation = ScreenOrientation & {
  lock?: (orientation: "landscape") => Promise<void>
  unlock?: () => void
}

type BrowserFullscreenElement = HTMLElement & {
  webkitRequestFullscreen?: () => Promise<void> | void
  msRequestFullscreen?: () => Promise<void> | void
}

type BrowserFullscreenDocument = Document & {
  webkitExitFullscreen?: () => Promise<void> | void
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

const getCategoryLabel = (category: FeedGame["category"]) => {
  if (!category) return "OTHER"
  if (typeof category === "string") return category
  return category.label || category.value
}

const getCreatorLabel = (game: FeedGame) => {
  return game.studioProfile?.displayName
    || game.creator?.username
    || game.creator?.name
    || "VibeGames creator"
}

export function MobileReelsFeed({ games }: MobileReelsFeedProps) {
  const router = useRouter()
  const { data: session } = useSession()
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const gameFrameRef = useRef<HTMLDivElement>(null)

  // Endless scrolling randomized feed state
  const [feedGames, setFeedGames] = useState<FeedGame[]>([])
  const [activeIndex, setActiveIndex] = useState(0)

  // Pagination states
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [isLoadingMore, setIsLoadingMore] = useState(false)

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

  // Comment Drawer states
  const [commentsOpen, setCommentsOpen] = useState(false)
  const [commentsGameId, setCommentsGameId] = useState<string | null>(null)
  const [commentsList, setCommentsList] = useState<CommentItem[]>([])
  const [commentContent, setCommentContent] = useState("")
  const [commentsLoading, setCommentsLoading] = useState(false)
  const [postCommentLoading, setPostCommentLoading] = useState(false)
  const [commentsCountState, setCommentsCountState] = useState<Record<string, number>>({})

  // Feedback states
  const [toastMessage, setToastMessage] = useState<string | null>(null)

  // Track session checks we've already done
  const [fetchedSessionIds, setFetchedSessionIds] = useState<Set<string>>(new Set())

  // Initialize randomized endless feed
  useEffect(() => {
    if (games.length > 0) {
      setFeedGames(shuffleArray(games))
      if (games.length < 20) {
        setHasMore(false)
      }
    }
  }, [games])

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
      const orientation = screen.orientation as BrowserScreenOrientation | undefined
      setIsFullscreen(isCurrentlyFullscreen)

      if (isCurrentlyFullscreen) {
        try {
          const game = feedGames[activeIndex]
          if (game && game.mobileOrientation === "LANDSCAPE" && orientation?.lock) {
            await orientation.lock("landscape")
          }
        } catch (e) {
          console.warn("Screen orientation lock failed:", e)
        }
      } else {
        try {
          orientation?.unlock?.()
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

  // Initialize likes and comments counts for the feed list
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
    setCommentsCountState((prev) => {
      const next = { ...prev }
      feedGames.forEach((game) => {
        if (next[game.id] === undefined) {
          next[game.id] = 0
        }
      })
      return next
    })
  }, [feedGames])

  // Keep the feed usable for keyboard and switch-control users while in browse mode.
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (isInteractive || commentsOpen || feedGames.length === 0) return

      const nextDirection = ["ArrowDown", "PageDown"].includes(event.key)
      const previousDirection = ["ArrowUp", "PageUp"].includes(event.key)
      if (!nextDirection && !previousDirection) return

      event.preventDefault()
      const nextIndex = Math.min(
        Math.max(activeIndex + (nextDirection ? 1 : -1), 0),
        feedGames.length - 1
      )
      const nextSlide = scrollContainerRef.current?.querySelector<HTMLElement>(`[data-index="${nextIndex}"]`)
      nextSlide?.scrollIntoView({ behavior: "smooth", block: "start" })
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [activeIndex, commentsOpen, feedGames.length, isInteractive])

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

  // IntersectionObserver to detect active index smoothly
  useEffect(() => {
    const container = scrollContainerRef.current
    if (!container) return

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const index = Number(entry.target.getAttribute("data-index"))
            if (!isNaN(index)) {
              setActiveIndex(index)
            }
          }
        })
      },
      {
        root: container,
        threshold: 0.5,
      }
    )

    const slides = container.querySelectorAll("[data-slide]")
    slides.forEach((slide) => observer.observe(slide))

    return () => {
      observer.disconnect()
    }
  }, [feedGames])

  // Load next page function
  const loadNextPage = useCallback(async () => {
    if (isLoadingMore) return
    setIsLoadingMore(true)
    const nextPage = page + 1
    try {
      // If all database games are finished or we only have a small local set, we reload and randomize
      if (!hasMore || games.length < 20) {
        const reshuffled = shuffleArray(games)
        setFeedGames((prev) => [...prev, ...reshuffled])
        if (games.length < 20) {
          setHasMore(false)
        } else {
          setPage(1)
          setHasMore(true)
        }
        setIsLoadingMore(false)
        return
      }

      const res = await fetch(`/api/games?mobile=true&limit=20&page=${nextPage}&sort=popular`)
      if (res.ok) {
        const data = await res.json()
        if (data.data && data.data.length > 0) {
          const newGames = shuffleArray(data.data)
          setFeedGames((prev) => [...prev, ...newGames])
          setPage(nextPage)
          setHasMore(data.hasMore)
        } else {
          // If no more games returned from database, loop and reshuffle
          const reshuffled = shuffleArray(games)
          setFeedGames((prev) => [...prev, ...reshuffled])
          setPage(1)
          setHasMore(true)
        }
      } else {
        // Fallback on error
        const reshuffled = shuffleArray(games)
        setFeedGames((prev) => [...prev, ...reshuffled])
      }
    } catch (e) {
      console.error("Error loading next page:", e)
      const reshuffled = shuffleArray(games)
      setFeedGames((prev) => [...prev, ...reshuffled])
    } finally {
      setIsLoadingMore(false)
    }
  }, [page, hasMore, isLoadingMore, games])

  // Trigger loading next page when close to end of feed (5 items buffer)
  useEffect(() => {
    if (activeIndex >= feedGames.length - 5 && feedGames.length > 0) {
      void loadNextPage()
    }
  }, [activeIndex, feedGames.length, loadNextPage])

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
        triggerToast(data.liked ? "SAVED TO CABINET!" : "REMOVED FROM FAVORITES")
      }
    } catch (e) {
      console.error("Like failed:", e)
    } finally {
      setLikesLoading((prev) => ({ ...prev, [gameId]: false }))
    }
  }

  // Handle Comments drawer loading
  const openComments = async (gameId: string) => {
    setCommentsGameId(gameId)
    setCommentsOpen(true)
    setCommentsLoading(true)
    try {
      const res = await fetch(`/api/games/${gameId}/comments`)
      if (res.ok) {
        const data = await res.json()
        setCommentsList(data.comments || [])
        setCommentsCountState((prev) => ({ ...prev, [gameId]: data.comments?.length || 0 }))
      }
    } catch (e) {
      console.error("Failed to load comments:", e)
    } finally {
      setCommentsLoading(false)
    }
  }

  // Handle Post Comment
  const postComment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!session?.user?.id || !commentsGameId || !commentContent.trim() || postCommentLoading) return

    setPostCommentLoading(true)
    try {
      const res = await fetch(`/api/games/${commentsGameId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: commentContent.trim() })
      })

      if (res.ok) {
        const data = await res.json()
        setCommentsList((prev) => [data.comment, ...prev])
        setCommentContent("")
        setCommentsCountState((prev) => ({
          ...prev,
          [commentsGameId]: (prev[commentsGameId] || 0) + 1
        }))
        triggerToast("COMMENT BROADCAST SUCCESSFUL!")
      } else {
        const err = await res.json()
        triggerToast(err.error || "POST FAILED")
      }
    } catch (error) {
      console.error("Failed to post comment:", error)
      triggerToast("TRANSMISSION ERROR")
    } finally {
      setPostCommentLoading(false)
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
        triggerToast("SHARE LINK COPIED TO CLIPBOARD!")
      } catch (e) {
        console.error("Copy failed:", e)
      }
    }
  }

  // Directly Fullscreen the wrapper container of the active Iframe
  const toggleFullscreen = (index: number) => {
    const activeId = feedGames[index]?.id
    if (!activeId) return
    const container = document.getElementById(`frame-container-${activeId}`)
    if (container) {
      const fullscreenContainer = container as BrowserFullscreenElement
      try {
        if (container.requestFullscreen) {
          void container.requestFullscreen()
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

  // Measured width and height fallbacks
  const width = frameWidth || (typeof window !== "undefined" ? window.innerWidth : 360)
  const height = frameHeight || (typeof window !== "undefined" ? window.innerHeight - 82 : 560)

  return (
    <div className="relative w-full h-[100dvh] flex flex-col bg-[#0d0d15] text-white overflow-hidden">
      {/* Persistent product navigation */}
      <div className="pointer-events-auto absolute left-0 right-0 top-0 z-40 flex items-center justify-between gap-2 bg-gradient-to-b from-black/90 via-black/55 to-transparent px-3 pb-8 pt-[max(0.75rem,env(safe-area-inset-top))]">
        <button
          type="button"
          onClick={() => router.push("/games")}
          aria-label="Open the VibeGames library"
          className="flex items-center gap-2 border border-[#6670ff]/80 bg-[#11111d]/90 px-2.5 py-2 text-left shadow-[2px_2px_0_#ff0040] backdrop-blur-sm"
        >
          <span className="font-pixel text-[9px] text-[#ffff00]">VIBE</span>
          <span className="font-pixel text-[9px] text-white">GAMES</span>
          <span className="font-pixel text-[7px] text-[#8f9bb3]">EXPLORE</span>
        </button>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => router.push("/upload")}
            className="border border-white/20 bg-black/55 px-2.5 py-2 font-pixel text-[7px] text-white backdrop-blur-sm transition-colors hover:border-[#ffff00] hover:text-[#ffff00]"
          >
            UPLOAD
          </button>
          <button
            type="button"
            onClick={() => router.push(session?.user ? "/creator" : `/login?callbackUrl=${encodeURIComponent("/")}`)}
            className="border border-white/20 bg-black/55 px-2.5 py-2 font-pixel text-[7px] text-white backdrop-blur-sm transition-colors hover:border-[#00d1ff] hover:text-[#00d1ff]"
          >
            {session?.user ? "PROFILE" : "SIGN IN"}
          </button>
        </div>
      </div>

      {/* Snap Scroll Reels container */}
      <div
        ref={scrollContainerRef}
        className="flex-1 w-full overflow-y-scroll snap-y snap-mandatory scrollbar-none flex flex-col"
      >
        {feedGames.map((game, index) => {
          const isActive = index === activeIndex
          const shouldRender = Math.abs(index - activeIndex) <= 2

          const gameLikes = likesState[game.id] || { liked: false, count: game.likes }
          const commentsCount = commentsCountState[game.id] || 0
          const categoryLabel = getCategoryLabel(game.category)
          const creatorLabel = getCreatorLabel(game)

          // Check if rotation to landscape is needed on a portrait mobile screen
          const rotateLandscape = height > width && game.mobileOrientation === "LANDSCAPE"
          const logicalHeight = rotateLandscape ? width : height
          const logicalWidth = rotateLandscape ? height : width

          // Virtualized empty slide spacer to protect mobile memory
          if (!shouldRender) {
            return (
              <div
                key={`${game.id}-${index}`}
                data-index={index}
                data-slide
                className="w-full h-full snap-start snap-always shrink-0 bg-[#0d0d15]"
                style={{ height: "100%" }}
              />
            )
          }

          return (
            <div
              key={`${game.id}-${index}`}
              data-index={index}
              data-slide
              className="w-full h-full snap-start snap-always flex flex-col landscape:flex-row bg-[#0d0d15] relative shrink-0 overflow-hidden"
              style={{ height: "100%" }}
            >
              {/* Game Frame Area */}
              <div
                ref={isActive ? gameFrameRef : null}
                id={`frame-container-${game.id}`}
                className="flex-1 w-full bg-black relative flex items-center justify-center overflow-hidden"
              >
                {isActive ? (
                  <div className="relative w-full h-full flex items-center justify-center">
                    <iframe
                      id={`iframe-${game.id}`}
                      src={game.gameUrl}
                      title={game.title}
                      className={`border-0 transition-all duration-300 ${
                        isInteractive || isFullscreen ? "pointer-events-auto" : "pointer-events-none"
                      }`}
                      sandbox="allow-scripts allow-same-origin allow-pointer-lock allow-forms"
                      allow="fullscreen; gamepad; accelerometer; gyroscope"
                      allowFullScreen
                      style={
                        rotateLandscape ? {
                          width: `${logicalWidth}px`,
                          height: `${logicalHeight}px`,
                          transform: "rotate(90deg)",
                          transformOrigin: "center",
                          position: "absolute",
                          left: `${(width - logicalWidth) / 2}px`,
                          top: `${(height - logicalHeight) / 2}px`
                        } : {
                          width: "100%",
                          height: "100%",
                          position: "absolute",
                          inset: 0
                        }
                      }
                    />
                    {!isInteractive && (
                      <button
                        type="button"
                        onTouchStart={handleTouchStart}
                        onTouchEnd={handleTouchEnd}
                        onClick={() => setIsInteractive(true)}
                        aria-label={`Play ${game.title}`}
                        className="absolute inset-0 z-20 flex touch-pan-y cursor-pointer flex-col items-center justify-center gap-3 bg-black/10 px-6 text-center"
                      >
                        <span className="flex items-center gap-2 border-2 border-[#ffff00] bg-black/80 px-4 py-3 font-pixel text-[10px] text-[#ffff00] shadow-[4px_4px_0_#ff0040] backdrop-blur-sm">
                          <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24" aria-hidden="true">
                            <path d="M8 5v14l11-7z" />
                          </svg>
                          TAP TO PLAY
                        </span>
                        <span className="rounded-full bg-black/65 px-3 py-1.5 text-[10px] font-medium tracking-wide text-white/80 backdrop-blur-sm">
                          Swipe up for the next game
                        </span>
                      </button>
                    )}
                    {isInteractive && !isFullscreen && (
                      <button
                        type="button"
                        onClick={() => setIsInteractive(false)}
                        aria-label="Exit play mode and return to browsing"
                        className="pointer-events-auto absolute right-3 top-[68px] z-30 border border-[#ffff00]/70 bg-black/75 px-3 py-2 font-pixel text-[7px] text-[#ffff00] shadow-[2px_2px_0_#ff0040] backdrop-blur-sm"
                      >
                        EXIT PLAY
                      </button>
                    )}
                    {isFullscreen && (
                      <button
                        type="button"
                        onClick={() => {
                          const fullscreenDocument = document as BrowserFullscreenDocument
                          if (document.exitFullscreen) {
                            void document.exitFullscreen()
                          } else if (fullscreenDocument.webkitExitFullscreen) {
                            void fullscreenDocument.webkitExitFullscreen()
                          }
                        }}
                        aria-label="Exit fullscreen"
                        className="absolute top-4 right-4 z-30 bg-black/60 hover:bg-black/80 border border-white/20 text-white/80 hover:text-white rounded-full w-8 h-8 flex items-center justify-center font-pixel text-xs transition-all pointer-events-auto shadow-md"
                        title="Exit Fullscreen"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="w-full h-full relative flex items-center justify-center bg-[#11111d]">
                    {game.thumbnail ? (
                      <GameThumbnailSlideshow
                        title={game.title}
                        thumbnail={game.thumbnail}
                        thumbnailSlides={game.thumbnailSlides}
                        sizes="100vw"
                        animateSlides={false}
                        imageClassName="object-cover opacity-50"
                      />
                    ) : (
                      <div className="flex flex-col items-center justify-center gap-2">
                        <svg className="w-12 h-12 text-[#4a4a6a]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                          <rect x="2" y="6" width="20" height="12" rx="2" />
                          <path d="M6 12h4M8 10v4M15 11h.01M18 13h.01" strokeWidth="2.5" />
                        </svg>
                        <span className="font-arcade text-xs text-[#4a4a6a]">ROM_LOAD_PENDING</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Persistent game identity and creator context */}
                <div className={`pointer-events-none absolute bottom-3 left-3 right-3 z-30 transition-opacity ${isActive ? "opacity-100" : "opacity-0"}`}>
                  <button
                    type="button"
                    onClick={() => router.push(`/play/${game.slug}`)}
                    aria-label={`View details for ${game.title}`}
                    className="pointer-events-auto max-w-[78%] rounded-sm border border-white/15 bg-black/70 p-2.5 text-left shadow-lg backdrop-blur-md transition-colors hover:border-[#00d1ff]/70"
                  >
                    <span className="font-pixel text-[7px] text-[#00d1ff]">{categoryLabel.toUpperCase()}</span>
                    <h3 className="mt-1 truncate text-sm font-bold text-white drop-shadow-md">{game.title}</h3>
                    <p className="mt-0.5 truncate text-[10px] text-[#b8c1d5]">by {creatorLabel}</p>
                  </button>
                </div>
              </div>

              {/* Clear, labelled actions that stay outside the playable iframe */}
              <div className="z-10 flex h-[82px] w-full shrink-0 select-none items-center border-t-2 border-[#20263a] bg-[#0d0d15] p-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] landscape:h-full landscape:w-[84px] landscape:border-l-2 landscape:border-t-0 landscape:pb-2">
                <div className="flex w-full items-center justify-between gap-1 px-1 landscape:flex-col landscape:justify-center landscape:gap-2">
                  
                  {/* Button 1: Like */}
                  <button
                    type="button"
                    onClick={() => handleLike(game.id)}
                    disabled={likesLoading[game.id]}
                    aria-label={`${gameLikes.liked ? "Remove" : "Save"} ${game.title}. ${gameLikes.count} saves`}
                    aria-pressed={gameLikes.liked}
                    className={`flex h-14 min-w-0 max-w-[60px] flex-1 flex-col items-center justify-center rounded border-2 transition-all landscape:h-12 landscape:w-12 landscape:flex-none ${
                      gameLikes.liked
                        ? "bg-[#ff4500]/20 border-[#ff4500] text-[#ff4500] shadow-[2px_2px_0_#ff4500]"
                        : "bg-transparent border-[#4a4a6a] text-[#8b93a6] hover:border-[#ff4500] hover:text-[#ff4500]"
                    }`}
                  >
                    {likesLoading[game.id] ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <svg
                        className={`w-5 h-5 transition-transform ${gameLikes.liked ? "fill-current scale-110 animate-bounce" : "fill-none stroke-current"}`}
                        viewBox="0 0 24 24"
                        strokeWidth="2.5"
                      >
                        <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                      </svg>
                    )}
                    <span className="mt-1 font-pixel text-[6px] leading-none">
                      SAVE {gameLikes.count}
                    </span>
                  </button>

                  {/* Button 2: Comment */}
                  <button
                    type="button"
                    onClick={() => openComments(game.id)}
                    aria-label={`Open comments for ${game.title}. ${commentsCount} comments`}
                    className="flex h-14 min-w-0 max-w-[60px] flex-1 flex-col items-center justify-center rounded border-2 border-[#4a4a6a] bg-transparent text-[#8b93a6] transition-all hover:border-[#0080ff] hover:text-[#0080ff] landscape:h-12 landscape:w-12 landscape:flex-none"
                  >
                    <svg className="w-5 h-5 fill-none stroke-current" viewBox="0 0 24 24" strokeWidth="2.5">
                      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                    </svg>
                    <span className="mt-1 font-pixel text-[6px] leading-none">CHAT{commentsCount > 0 ? ` ${commentsCount}` : ""}</span>
                  </button>

                  {/* Button 3: Share */}
                  <button
                    type="button"
                    onClick={() => shareGame(game)}
                    aria-label={`Share ${game.title}`}
                    className="flex h-14 min-w-0 max-w-[60px] flex-1 flex-col items-center justify-center rounded border-2 border-[#4a4a6a] bg-transparent text-[#8b93a6] transition-all hover:border-[#ffff00] hover:text-[#ffff00] landscape:h-12 landscape:w-12 landscape:flex-none"
                  >
                    <svg className="w-5 h-5 fill-none stroke-current" viewBox="0 0 24 24" strokeWidth="2.5">
                      <circle cx="18" cy="5" r="3" />
                      <circle cx="6" cy="12" r="3" />
                      <circle cx="18" cy="19" r="3" />
                      <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
                      <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
                    </svg>
                    <span className="mt-1 font-pixel text-[6px] leading-none">SHARE</span>
                  </button>

                  {/* Button 4: Full Screen */}
                  <button
                    type="button"
                    onClick={() => toggleFullscreen(index)}
                    aria-label={`Play ${game.title} in fullscreen`}
                    className={`flex h-14 min-w-0 max-w-[60px] flex-1 flex-col items-center justify-center rounded border-2 bg-transparent transition-all landscape:h-12 landscape:w-12 landscape:flex-none ${
                      isActive && showFullscreenHint
                        ? "border-[#ffff00] text-[#ffff00] bg-[#ffff00]/10 scale-110 shadow-[0_0_15px_rgba(255,255,0,0.8)] animate-pulse"
                        : "border-[#4a4a6a] text-[#8b93a6] hover:border-[#8d6e63] hover:text-[#8d6e63]"
                    }`}
                  >
                    <svg className="w-5 h-5 fill-none stroke-current" viewBox="0 0 24 24" strokeWidth="2.5">
                      <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" />
                    </svg>
                    <span className="mt-1 font-pixel text-[6px] leading-none">FULL</span>
                  </button>

                  {/* Button 5: Game details */}
                  <button
                    type="button"
                    onClick={() => router.push(`/play/${game.slug}`)}
                    aria-label={`View details for ${game.title}`}
                    className="flex h-14 min-w-0 max-w-[60px] flex-1 flex-col items-center justify-center rounded border-2 border-[#4a4a6a] bg-transparent text-[#8b93a6] transition-all hover:border-white hover:text-white landscape:h-12 landscape:w-12 landscape:flex-none"
                  >
                    <svg className="w-5 h-5 fill-none stroke-current" viewBox="0 0 24 24" strokeWidth="2.5">
                      <circle cx="12" cy="12" r="10" />
                      <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />
                    </svg>
                    <span className="mt-1 font-pixel text-[6px] leading-none">DETAILS</span>
                  </button>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Floating Retro Toast Alert */}
      {toastMessage && (
        <div className="absolute bottom-24 left-1/2 z-50 -translate-x-1/2 border-2 border-[#ffff00] bg-[#1a1a2e] px-4 py-2 font-pixel text-[10px] text-[#ffff00] shadow-[4px_4px_0_#ff0040]">
          {toastMessage}
        </div>
      )}

      {/* Dynamic Comments Bottom Drawer */}
      {commentsOpen && commentsGameId && (
        <div className="absolute inset-0 z-40 bg-black/60 backdrop-blur-xs flex flex-col justify-end">
          <div className="flex-1" onClick={() => setCommentsOpen(false)} />
          
          <div className="h-[65%] w-full bg-[#1a1a2e] border-t-4 border-[#0080ff] flex flex-col shadow-2xl relative animate-slide-up">
            {/* Drawer Header */}
            <div className="px-4 py-3 border-b-2 border-[#20263a] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 text-[#0080ff] fill-none stroke-current" viewBox="0 0 24 24" strokeWidth="2.5">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                </svg>
                <span className="font-pixel text-[11px] text-[#0080ff]">
                  COMMENTS ({commentsList.length})
                </span>
              </div>
              <button
                type="button"
                onClick={() => setCommentsOpen(false)}
                aria-label="Close comments"
                className="font-pixel text-[11px] text-[#8b93a6] hover:text-white px-2 py-1"
              >
                CLOSE
              </button>
            </div>

            {/* Comments scroll container */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {commentsLoading ? (
                <div className="flex flex-col items-center justify-center h-full gap-2">
                  <Loader2 className="w-6 h-6 animate-spin text-[#0080ff]" />
                  <span className="font-arcade text-[10px] text-[#8b93a6]">FETCHING_LOGS...</span>
                </div>
              ) : commentsList.length > 0 ? (
                commentsList.map((c) => {
                  const author = c.user.username || c.user.name || "player"
                  return (
                    <div key={c.id} className="flex gap-3 border-b border-[#20263a] pb-3 last:border-0 last:pb-0">
                      <Avatar className="h-8 w-8 border border-[#4a4a6a]">
                        <AvatarImage src={c.user.image || undefined} />
                        <AvatarFallback className="bg-[#0d0d15] text-[#8b93a6] text-[10px]">
                          {author.slice(0,2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-baseline gap-2">
                          <span className="font-arcade text-xs text-[#ffff00]">@{author}</span>
                          <span className="font-arcade text-[9px] text-[#4a4a6a]">
                            {new Date(c.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="font-arcade text-xs text-[#e5e5e5] mt-1 whitespace-pre-wrap leading-relaxed">
                          {c.content}
                        </p>
                      </div>
                    </div>
                  )
                })
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <span className="text-sm font-medium text-[#c5ccdb]">No comments yet</span>
                  <span className="mt-1 text-xs text-[#68738a]">Start the conversation about this game.</span>
                </div>
              )}
            </div>

            {/* Comment Post Form */}
            <form onSubmit={postComment} className="p-3 border-t-2 border-[#20263a] bg-[#0d0d15] flex flex-col gap-2">
              {session?.user?.id ? (
                <>
                  <Textarea
                     value={commentContent}
                     onChange={(e) => setCommentContent(e.target.value)}
                     placeholder="Share feedback about this game..."
                     maxLength={1000}
                     className="font-arcade text-xs min-h-[50px] bg-[#1a1a2e] border-[#4a4a6a] text-white focus:border-[#0080ff] focus:ring-0"
                     disabled={postCommentLoading}
                  />
                  <div className="flex items-center justify-between">
                    <span className="font-arcade text-[9px] text-[#4a4a6a]">
                      {commentContent.length}/1000 CHARS
                    </span>
                    <Button
                      type="submit"
                      disabled={postCommentLoading || !commentContent.trim()}
                      className="font-pixel text-[9px] h-7 bg-[#0080ff] hover:bg-[#0080ff]/80 text-white rounded-sm"
                    >
                      {postCommentLoading ? (
                        <Loader2 className="w-3 h-3 animate-spin mr-1.5" />
                      ) : null}
                      POST
                    </Button>
                  </div>
                </>
              ) : (
                <div className="text-center py-2">
                  <p className="mb-2 text-xs text-[#8b93a6]">Sign in to join the conversation.</p>
                  <Button
                    onClick={() => router.push(`/login?callbackUrl=${encodeURIComponent("/")}`)}
                    className="font-pixel text-[9px] h-7 bg-[#ffff00] text-black hover:bg-[#ffff00]/80 rounded-sm"
                  >
                    SIGN IN
                  </Button>
                </div>
              )}
            </form>
          </div>
        </div>
      )}

    </div>
  )
}
