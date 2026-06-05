"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Loader2 } from "lucide-react"
import { DownloadCodeButton } from "@/components/games/download-code-button"

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

// Fisher-Yates Shuffle algorithm
const shuffleArray = (array: FeedGame[]) => {
  const arr = [...array]
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

export function MobileReelsFeed({ games }: MobileReelsFeedProps) {
  const router = useRouter()
  const { data: session } = useSession()
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const gameFrameRef = useRef<HTMLDivElement>(null)

  // Endless scrolling randomized feed state
  const [feedGames, setFeedGames] = useState<FeedGame[]>([])
  const [activeIndex, setActiveIndex] = useState(0)
  const [showMeta, setShowMeta] = useState(true)

  // Pagination states
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [isLoadingMore, setIsLoadingMore] = useState(false)

  // Fullscreen tracking state
  const [isFullscreen, setIsFullscreen] = useState(false)

  // Fullscreen button animation reminder state
  const [showFullscreenHint, setShowFullscreenHint] = useState(false)

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
      if (games.length < 15) {
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

  // Auto fade-out timer for game details (meta)
  useEffect(() => {
    setShowMeta(true)
    const timer = setTimeout(() => {
      setShowMeta(false)
    }, 5000)
    return () => clearTimeout(timer)
  }, [activeIndex])

  // Fullscreen change listener to toggle pointer-events
  useEffect(() => {
    const handleFullscreenChange = () => {
      const isCurrentlyFullscreen = !!document.fullscreenElement
      setIsFullscreen(isCurrentlyFullscreen)
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
  }, [])

  // Fullscreen hint timer: turns on after 1 minute of active slide inactivity
  useEffect(() => {
    setShowFullscreenHint(false)
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
    if (isLoadingMore || !hasMore || feedGames.length >= 45) return
    setIsLoadingMore(true)
    const nextPage = page + 1
    try {
      const res = await fetch(`/api/games?mobile=true&limit=15&page=${nextPage}&sort=popular`)
      if (res.ok) {
        const data = await res.json()
        if (data.data && data.data.length > 0) {
          const newGames = shuffleArray(data.data)
          setFeedGames((prev) => [...prev, ...newGames])
          setPage(nextPage)
          setHasMore(data.hasMore && nextPage < 3) // Cap total games at 45
        } else {
          setHasMore(false)
        }
      } else {
        setHasMore(false)
      }
    } catch (e) {
      console.error("Error loading next page:", e)
      setHasMore(false)
    } finally {
      setIsLoadingMore(false)
    }
  }, [page, hasMore, isLoadingMore, feedGames.length])

  // Trigger loading next page when close to end of feed
  useEffect(() => {
    if (activeIndex >= feedGames.length - 3 && feedGames.length > 0 && feedGames.length < 45) {
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
  const handleLike = async (gameId: string, slug: string) => {
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

  // Directly Fullscreen the active Iframe
  const toggleFullscreen = (index: number) => {
    const activeId = feedGames[index]?.id
    if (!activeId) return
    const iframe = document.getElementById(`iframe-${activeId}`)
    if (iframe) {
      try {
        if (iframe.requestFullscreen) {
          void iframe.requestFullscreen()
        } else if ((iframe as any).webkitRequestFullscreen) {
          void (iframe as any).webkitRequestFullscreen()
        } else if ((iframe as any).msRequestFullscreen) {
          void (iframe as any).msRequestFullscreen()
        }
      } catch (error) {
        console.error("Fullscreen request failed:", error)
        router.push(`/play/${feedGames[index].slug}`)
      }
    }
  }

  // Measured width and height fallbacks
  const width = frameWidth || (typeof window !== "undefined" ? window.innerWidth : 360)
  const height = frameHeight || (typeof window !== "undefined" ? window.innerHeight - 135 : 480)

  return (
    <div className="relative w-full h-[100dvh] flex flex-col bg-[#0d0d15] text-white overflow-hidden">
      {/* Top Banner overlay */}
      <div className="absolute top-0 left-0 right-0 z-20 pointer-events-none p-4 flex items-center justify-between bg-gradient-to-b from-black/80 to-transparent">
        <div className="flex items-center gap-2">
          <span className="font-pixel text-[11px] text-[#ffff00] bg-[#1a1a2e] border border-[#ffff00] px-2 py-0.5 shadow-[2px_2px_0_#ff0040]">
            AI ARCADE FEED
          </span>
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

          // Check if rotation to landscape is needed on a portrait mobile screen
          const rotateLandscape = height > width && game.mobileOrientation === "LANDSCAPE"
          const logicalHeight = Math.min(width, height / 1.777)
          const logicalWidth = logicalHeight * 1.777

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
              className="w-full h-full snap-start snap-always flex flex-col bg-[#0d0d15] relative shrink-0 overflow-hidden"
              style={{ height: "100%" }}
            >
              {/* Game Frame Area */}
              <div
                ref={isActive ? gameFrameRef : null}
                className="flex-1 w-full bg-black relative flex items-center justify-center overflow-hidden"
              >
                {isActive ? (
                  <div className="relative w-full h-full flex items-center justify-center">
                    <iframe
                      id={`iframe-${game.id}`}
                      src={game.gameUrl}
                      title={game.title}
                      className={`border-0 transition-all duration-300 ${
                        isFullscreen ? "pointer-events-auto" : "pointer-events-none"
                      }`}
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
                          top: `${(height - logicalHeight) / 2}px`
                        } : {
                          width: "100%",
                          height: "100%",
                          position: "absolute",
                          inset: 0
                        }
                      }
                    />
                  </div>
                ) : (
                  <div className="w-full h-full relative flex items-center justify-center bg-[#11111d]">
                    {game.thumbnail ? (
                      <img
                        src={game.thumbnail}
                        alt={game.title}
                        className="w-full h-full object-cover opacity-50"
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

                {/* Left Side Game Meta Tag Details (Fades out after 5 seconds on active slide) */}
                <div
                  className={`absolute bottom-4 left-4 z-10 flex flex-col gap-1 pointer-events-none max-w-[70%] bg-black/50 p-2 rounded backdrop-blur-xs transition-opacity duration-1000 ${
                    isActive && showMeta ? "opacity-100" : "opacity-0"
                  }`}
                >
                  <span className="font-pixel text-[9px] text-[#00d1ff] bg-[#00d1ff]/10 border border-[#00d1ff]/30 px-1.5 py-0.5 rounded-sm self-start">
                    {String(game.category || "OTHER").toUpperCase()}
                  </span>
                  <h3 className="font-arcade text-white text-sm drop-shadow-md font-bold truncate">
                    {game.title}
                  </h3>
                  <p className="font-arcade text-[10px] text-[#a5aec4] drop-shadow-md line-clamp-2 leading-tight">
                    {game.description}
                  </p>
                </div>
              </div>

              {/* Bottom Navigation & Controls (Never Overlaps Iframe) */}
              <div className="h-[135px] w-full bg-[#0d0d15] border-t-2 border-[#20263a] flex flex-col justify-between p-3 shrink-0 z-10 select-none">
                {/* 5 square colored buttons row */}
                <div className="flex items-center justify-between gap-3 px-1">
                  
                  {/* Button 1: Like */}
                  <button
                    onClick={() => handleLike(game.id, game.slug)}
                    disabled={likesLoading[game.id]}
                    className={`w-12 h-12 flex flex-col items-center justify-center rounded border-2 transition-all ${
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
                    <span className="text-[8px] font-pixel mt-0.5 leading-none">
                      {gameLikes.count}
                    </span>
                  </button>

                  {/* Button 2: Comment */}
                  <button
                    onClick={() => openComments(game.id)}
                    className="w-12 h-12 flex flex-col items-center justify-center rounded border-2 bg-transparent border-[#4a4a6a] text-[#8b93a6] hover:border-[#0080ff] hover:text-[#0080ff] transition-all"
                  >
                    <svg className="w-5 h-5 fill-none stroke-current" viewBox="0 0 24 24" strokeWidth="2.5">
                      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                    </svg>
                    {commentsCount > 0 && (
                      <span className="text-[8px] font-pixel mt-0.5 leading-none">
                        {commentsCount}
                      </span>
                    )}
                  </button>

                  {/* Button 3: Share */}
                  <button
                    onClick={() => shareGame(game)}
                    className="w-12 h-12 flex flex-col items-center justify-center rounded border-2 bg-transparent border-[#4a4a6a] text-[#8b93a6] hover:border-[#ffff00] hover:text-[#ffff00] transition-all"
                  >
                    <svg className="w-5 h-5 fill-none stroke-current" viewBox="0 0 24 24" strokeWidth="2.5">
                      <circle cx="18" cy="5" r="3" />
                      <circle cx="6" cy="12" r="3" />
                      <circle cx="18" cy="19" r="3" />
                      <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
                      <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
                    </svg>
                  </button>

                  {/* Button 4: Full Screen */}
                  <button
                    onClick={() => toggleFullscreen(index)}
                    className={`w-12 h-12 flex flex-col items-center justify-center rounded border-2 bg-transparent transition-all ${
                      isActive && showFullscreenHint
                        ? "border-[#ffff00] text-[#ffff00] bg-[#ffff00]/10 scale-110 shadow-[0_0_15px_rgba(255,255,0,0.8)] animate-pulse"
                        : "border-[#4a4a6a] text-[#8b93a6] hover:border-[#8d6e63] hover:text-[#8d6e63]"
                    }`}
                  >
                    <svg className="w-5 h-5 fill-none stroke-current" viewBox="0 0 24 24" strokeWidth="2.5">
                      <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" />
                    </svg>
                  </button>

                  {/* Button 5: Explore Page */}
                  <button
                    onClick={() => router.push("/games")}
                    className="w-12 h-12 flex flex-col items-center justify-center rounded border-2 bg-transparent border-[#4a4a6a] text-[#8b93a6] hover:border-white hover:text-white transition-all"
                  >
                    <svg className="w-5 h-5 fill-none stroke-current" viewBox="0 0 24 24" strokeWidth="2.5">
                      <circle cx="12" cy="12" r="10" />
                      <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />
                    </svg>
                  </button>
                </div>

                {/* Download Code Button */}
                <DownloadCodeButton game={game} variant="feed" />

              </div>
            </div>
          )
        })}
      </div>

      {/* Floating Retro Toast Alert */}
      {toastMessage && (
        <div className="absolute bottom-40 left-1/2 -translate-x-1/2 z-50 bg-[#1a1a2e] border-2 border-[#ffff00] px-4 py-2 text-[#ffff00] font-pixel text-[10px] shadow-[4px_4px_0_#ff0040] animate-bounce">
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
                onClick={() => setCommentsOpen(false)}
                className="font-pixel text-[11px] text-[#8b93a6] hover:text-white px-2 py-1"
              >
                [X] CLOSE
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
                  <span className="font-arcade text-xs text-[#4a4a6a]">NO_COMMENTS_FOUND</span>
                  <span className="font-arcade text-[10px] text-[#4a4a6a] mt-1">Be the first to comment!</span>
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
                     placeholder="Type comments to broadcast..."
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
                      POST_COMMENT
                    </Button>
                  </div>
                </>
              ) : (
                <div className="text-center py-2">
                  <p className="font-arcade text-xs text-[#8b93a6] mb-2">YOU MUST BE LOGGED IN TO COMMENT</p>
                  <Button
                    onClick={() => router.push(`/login?callbackUrl=${encodeURIComponent("/")}`)}
                    className="font-pixel text-[9px] h-7 bg-[#ffff00] text-black hover:bg-[#ffff00]/80 rounded-sm"
                  >
                    LOGIN_TO_ACCOUNT
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
