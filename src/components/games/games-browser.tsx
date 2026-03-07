"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Search, Gamepad2, ChevronLeft, Loader2, Smartphone, SquarePen } from "lucide-react"
import { GameCard } from "@/components/games/game-card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { CATEGORIES } from "@/lib/utils"
import { useDebounce } from "@/hooks/use-debounce"
import type { GameCardData } from "@/types"

type BrowserGame = Omit<GameCardData, "createdAt"> & {
  createdAt: Date
}

type ApiBrowserGame = Omit<GameCardData, "createdAt"> & {
  createdAt: string | Date
}

interface GamesBrowserProps {
  initialGames: BrowserGame[]
  initialTotal: number
  initialHasMore: boolean
  initialCategory?: string
  initialSort?: string
  initialQuery?: string
  initialSupportsMobile?: boolean
  initialEditorOnly?: boolean
}

export function GamesBrowser({ 
  initialGames, 
  initialTotal,
  initialHasMore,
  initialCategory, 
  initialSort, 
  initialQuery,
  initialSupportsMobile = false,
  initialEditorOnly = false,
}: GamesBrowserProps) {
  const router = useRouter()
  
  const [games, setGames] = useState<BrowserGame[]>(initialGames)
  const [loading, setLoading] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(initialTotal)
  const [hasMore, setHasMore] = useState(initialHasMore)
  
  const [category, setCategory] = useState(initialCategory || "all")
  const [sort, setSort] = useState(initialSort || "trending")
  const [q, setQ] = useState(initialQuery || "")
  const [supportsMobile, setSupportsMobile] = useState(initialSupportsMobile)
  const [editorOnly, setEditorOnly] = useState(initialEditorOnly)
  
  const debouncedQ = useDebounce(q, 500)
  
  // Ref to skip initial effect run
  const isFirstRun = useRef(true)

  const buildParams = useCallback((targetPage: number) => {
    const params = new URLSearchParams()
    if (category && category !== "all") params.set("category", category)
    if (sort && sort !== "trending") params.set("sort", sort)
    if (debouncedQ) params.set("q", debouncedQ)
    if (supportsMobile) params.set("mobile", "true")
    if (editorOnly) params.set("editor", "true")
    if (targetPage > 1) params.set("page", String(targetPage))
    return params
  }, [category, sort, debouncedQ, supportsMobile, editorOnly])

  const fetchGames = useCallback(async (targetPage: number, append: boolean) => {
    if (append) {
      setLoadingMore(true)
    } else {
      setLoading(true)
    }

    try {
      const params = buildParams(targetPage)
      const queryString = params.toString()
      const browseUrl = queryString ? `/games?${queryString}` : "/games"
      router.replace(browseUrl, { scroll: false })

      const res = await fetch(`/api/games?${queryString}`)
      const data = await res.json()

      if (data.data) {
        const normalized: BrowserGame[] = (data.data as ApiBrowserGame[]).map((game) => ({
          ...game,
          createdAt: new Date(game.createdAt),
        }))

        setGames((prev) => (append ? [...prev, ...normalized] : normalized))
        setPage(targetPage)
        setTotal(typeof data.total === "number" ? data.total : normalized.length)
        setHasMore(Boolean(data.hasMore))
      }
    } catch (error) {
      console.error("Failed to fetch games:", error)
    } finally {
      if (append) {
        setLoadingMore(false)
      } else {
        setLoading(false)
      }
    }
  }, [buildParams, router])

  useEffect(() => {
    if (isFirstRun.current) {
      isFirstRun.current = false
      return
    }
    void fetchGames(1, false)
  }, [category, sort, debouncedQ, supportsMobile, editorOnly, fetchGames])

  const resetFilters = () => {
    setCategory("all")
    setSort("trending")
    setQ("")
    setSupportsMobile(false)
    setEditorOnly(false)
  }

  return (
    <div className="container mx-auto px-4 py-6 sm:py-8">
      {/* Back Link */}
      <Link href="/" className="inline-flex items-center gap-2 text-[#4a4a6a] hover:text-[#ffff00] mb-4 sm:mb-6 transition-colors font-arcade text-sm sm:text-base">
        <ChevronLeft className="h-5 w-5" />
        BACK TO ARCADE
      </Link>

      {/* Header */}
      <div className="mb-6 sm:mb-8 pb-6 sm:pb-8 border-b-2 sm:border-b-4 border-[#4a4a6a]">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-[#ffff00] border-2 sm:border-4 border-[#ffff00]">
            <Gamepad2 className="h-5 w-5 sm:h-6 sm:w-6 text-[#0d0d15]" />
          </div>
          <div>
            <span className="text-[10px] text-[#ffff00] font-pixel block">GAME SELECT</span>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-white font-pixel">ARCADE FLOOR</h1>
          </div>
        </div>
        
        {/* Player Score Display */}
        <div className="flex flex-wrap items-center gap-3 sm:gap-4">
            <div className="bg-[#1a1a2e] border-2 sm:border-4 border-[#0080ff] px-3 sm:px-4 py-2">
              <span className="text-[10px] text-[#0080ff] font-pixel block">GAMES</span>
              <span className="text-lg sm:text-xl text-white font-pixel">{total.toString().padStart(3, '0')}</span>
            </div>
          <div className="bg-[#1a1a2e] border-2 sm:border-4 border-[#ff0040] px-3 sm:px-4 py-2">
            <span className="text-[10px] text-[#ff0040] font-pixel block">CREDITS</span>
            <span className="text-lg sm:text-xl text-white font-pixel">∞</span>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-8 space-y-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-[#4a4a6a]" />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="SEARCH ARCADE..."
              className="pl-12 text-base sm:text-lg"
            />
          </div>
          
          <div className="mobile-scroll-row md:overflow-visible md:pb-0">
            {[
              { key: "trending", label: "TRENDING" },
              { key: "new", label: "NEW" },
              { key: "popular", label: "POPULAR" },
              { key: "top", label: "TOP" },
            ].map((s) => (
              <Button
                key={s.key}
                variant={sort === s.key ? "arcade" : "arcade-outline"}
                size="sm"
                className="min-w-[110px]"
                onClick={() => setSort(s.key)}
              >
                {s.label}
              </Button>
            ))}
            <Button
              variant={supportsMobile ? "arcade" : "arcade-outline"}
              size="sm"
              className="min-w-[110px]"
              onClick={() => setSupportsMobile(!supportsMobile)}
            >
              <Smartphone className="mr-2 h-4 w-4" />
              MOBILE
            </Button>
            <Button
              variant={editorOnly ? "arcade" : "arcade-outline"}
              size="sm"
              className="min-w-[110px]"
              onClick={() => setEditorOnly(!editorOnly)}
            >
              <SquarePen className="mr-2 h-4 w-4" />
              EDITOR
            </Button>
          </div>
        </div>

        {/* Categories */}
        <div className="bg-[#1a1a2e] border-2 sm:border-4 border-[#4a4a6a] p-3 sm:p-4">
          <span className="text-[10px] text-[#4a4a6a] font-pixel block mb-3">SELECT CATEGORY</span>
          <div className="mobile-scroll-row sm:flex-wrap sm:overflow-visible sm:pb-0 gap-2 flex">
            <Button 
              variant={category === "all" ? "arcade" : "outline"}
              size="sm"
              className="min-w-[120px]"
              onClick={() => setCategory("all")}
            >
              ALL GAMES
            </Button>
            {CATEGORIES.map((cat) => (
              <Button 
                key={cat.value}
                variant={category === cat.value.toLowerCase() ? "arcade" : "outline"}
                size="sm"
                className="min-w-[120px]"
                onClick={() => setCategory(cat.value.toLowerCase())}
              >
                {cat.label}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex justify-center py-12">
            <Loader2 className="h-10 w-10 text-[#ffff00] animate-spin" />
        </div>
      )}

      {/* Games Grid */}
      {!loading && (
        games.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
            {games.map((game) => (
              <GameCard key={game.id} game={game} />
            ))}
          </div>
        ) : (
          <div className="text-center py-20 border-4 border-dashed border-[#4a4a6a]">
            <Gamepad2 className="h-16 w-16 text-[#4a4a6a] mx-auto mb-4" />
            <h3 className="text-xl font-bold text-[#4a4a6a] mb-2 font-pixel">NO GAMES FOUND</h3>
            <p className="text-[#4a4a6a] mb-6 font-arcade text-lg">Try adjusting your search</p>
            <Button variant="arcade" onClick={resetFilters}>RESET FILTERS</Button>
          </div>
        )
      )}

      {!loading && games.length > 0 && hasMore && (
        <div className="flex justify-center pt-8">
          <Button
            variant="arcade-outline"
            size="arcade-default"
            onClick={() => {
              void fetchGames(page + 1, true)
            }}
            disabled={loadingMore}
          >
            {loadingMore ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                LOADING...
              </>
            ) : (
              "LOAD MORE"
            )}
          </Button>
        </div>
      )}
    </div>
  )
}
