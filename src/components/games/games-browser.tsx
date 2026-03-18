"use client"

import { startTransition, useCallback, useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ChevronLeft, Gamepad2, Loader2, Search, Smartphone, SquarePen } from "lucide-react"
import { GameCard } from "@/components/games/game-card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useDebounce } from "@/hooks/use-debounce"
import { CATEGORIES } from "@/lib/utils"
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

const SORT_OPTIONS = [
  { key: "trending", label: "TRENDING" },
  { key: "new", label: "NEW" },
  { key: "popular", label: "POPULAR" },
  { key: "top", label: "TOP" },
] as const

const CATEGORY_OPTIONS = [
  { value: "all", label: "ALL GAMES" },
  ...CATEGORIES.map((category) => ({
    value: category.value.toLowerCase(),
    label: category.label.toUpperCase(),
  })),
]

const FEATURED_CATEGORY_ORDER = ["all", "action", "puzzle", "arcade", "adventure", "rpg"]

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
  const [showAllCategories, setShowAllCategories] = useState(false)

  const debouncedQ = useDebounce(q, 500)

  const isFirstRun = useRef(true)
  const abortControllerRef = useRef<AbortController | null>(null)
  const requestIdRef = useRef(0)

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
    abortControllerRef.current?.abort()
    const controller = new AbortController()
    abortControllerRef.current = controller
    const requestId = requestIdRef.current + 1
    requestIdRef.current = requestId

    if (append) {
      setLoadingMore(true)
    } else {
      setLoading(true)
    }

    try {
      const params = buildParams(targetPage)
      const queryString = params.toString()
      const browseUrl = queryString ? `/games?${queryString}` : "/games"

      startTransition(() => {
        router.replace(browseUrl, { scroll: false })
      })

      const res = await fetch(`/api/games?${queryString}`, { signal: controller.signal })
      const data = await res.json()

      if (requestId !== requestIdRef.current) {
        return
      }

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
      if (error instanceof DOMException && error.name === "AbortError") {
        return
      }
    } finally {
      if (requestId !== requestIdRef.current) {
        return
      }

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

  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort()
    }
  }, [])

  const visibleCategories = showAllCategories
    ? CATEGORY_OPTIONS
    : CATEGORY_OPTIONS.filter((option) => option.value === category || FEATURED_CATEGORY_ORDER.includes(option.value))

  const activeFilterCount = [
    category !== "all",
    sort !== "trending",
    Boolean(q.trim()),
    supportsMobile,
    editorOnly,
  ].filter(Boolean).length

  const resetFilters = () => {
    setCategory("all")
    setSort("trending")
    setQ("")
    setSupportsMobile(false)
    setEditorOnly(false)
    setShowAllCategories(false)
  }

  return (
    <div className="container mx-auto px-4 py-6 sm:py-8">
      <Link
        href="/"
        className="mb-4 inline-flex items-center gap-2 font-arcade text-sm text-[#8b93a6] transition-colors hover:text-[#ffff00] sm:mb-6 sm:text-base"
      >
        <ChevronLeft className="h-5 w-5" />
        BACK TO ARCADE
      </Link>

      <div className="mb-6 border-b-2 border-[#4a4a6a] pb-6 sm:mb-8 sm:border-b-4 sm:pb-8">
        <div className="mb-4 flex items-center gap-3">
          <div className="border-2 border-[#ffff00] bg-[#ffff00] p-2 sm:border-4">
            <Gamepad2 className="h-5 w-5 text-[#0d0d15] sm:h-6 sm:w-6" />
          </div>
          <div>
            <span className="block font-pixel text-[10px] text-[#ffff00]">GAME SELECT</span>
            <h1 className="font-pixel text-xl font-bold text-white sm:text-2xl md:text-3xl">ARCADE FLOOR</h1>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 sm:gap-4">
          <div className="border-2 border-[#0080ff] bg-[#1a1a2e] px-3 py-2 sm:border-4 sm:px-4">
            <span className="block font-pixel text-[10px] text-[#0080ff]">GAMES</span>
            <span className="font-pixel text-lg text-white sm:text-xl">{total.toString().padStart(3, "0")}</span>
          </div>
          <div className="border-2 border-[#ff0040] bg-[#1a1a2e] px-3 py-2 sm:border-4 sm:px-4">
            <span className="block font-pixel text-[10px] text-[#ff0040]">CREDITS</span>
            <span className="font-pixel text-lg text-white sm:text-xl">INF</span>
          </div>
        </div>
      </div>

      <div className="mb-8 space-y-6">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#8b93a6]" />
          <Input
            value={q}
            onChange={(event) => setQ(event.target.value)}
            placeholder="SEARCH ARCADE..."
            className="pl-12 text-base sm:text-lg"
          />
        </div>

        <div className="rounded-lg border-2 border-[#4a4a6a] bg-[#11111d] p-3 sm:p-4">
          <div className="flex items-center justify-between gap-3">
            <span className="font-pixel text-[10px] text-[#8b93a6]">FILTERS</span>
            {activeFilterCount > 0 ? (
              <Button
                variant="ghost"
                size="sm"
                className="h-auto px-0 py-0 font-arcade text-xs text-[#ffff00]"
                onClick={resetFilters}
              >
                RESET FILTERS
              </Button>
            ) : (
              <span className="font-arcade text-[11px] text-[#8b93a6]">Showing everything</span>
            )}
          </div>

          <div className="mt-3 grid grid-cols-2 gap-2 lg:flex lg:flex-wrap">
            {SORT_OPTIONS.map((option) => (
              <Button
                key={option.key}
                variant={sort === option.key ? "arcade" : "arcade-outline"}
                size="sm"
                className="w-full justify-center lg:w-auto lg:min-w-[120px]"
                onClick={() => setSort(option.key)}
              >
                {option.label}
              </Button>
            ))}
            <Button
              variant={supportsMobile ? "arcade" : "arcade-outline"}
              size="sm"
              className="w-full justify-center lg:w-auto lg:min-w-[120px]"
              onClick={() => setSupportsMobile(!supportsMobile)}
            >
              <Smartphone className="mr-2 h-4 w-4" />
              MOBILE
            </Button>
            <Button
              variant={editorOnly ? "arcade" : "arcade-outline"}
              size="sm"
              className="w-full justify-center lg:w-auto lg:min-w-[120px]"
              onClick={() => setEditorOnly(!editorOnly)}
            >
              <SquarePen className="mr-2 h-4 w-4" />
              EDITOR
            </Button>
          </div>
        </div>

        <div className="border-2 border-[#4a4a6a] bg-[#1a1a2e] p-3 sm:border-4 sm:p-4">
          <div className="flex items-center justify-between gap-3">
            <span className="block font-pixel text-[10px] text-[#8b93a6]">SELECT CATEGORY</span>
            {!showAllCategories && visibleCategories.length < CATEGORY_OPTIONS.length ? (
              <span className="font-arcade text-[11px] text-[#8b93a6]">Top picks first</span>
            ) : null}
          </div>

          <div className="mt-3 grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
            {visibleCategories.map((option) => (
              <Button
                key={option.value}
                variant={category === option.value ? "arcade" : "outline"}
                size="sm"
                className="w-full justify-center sm:min-w-[120px] sm:w-auto"
                onClick={() => setCategory(option.value)}
              >
                {option.label}
              </Button>
            ))}
          </div>

          {CATEGORY_OPTIONS.length > visibleCategories.length ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="mt-3 w-full font-arcade text-xs text-[#ffff00] sm:hidden"
              onClick={() => setShowAllCategories(true)}
            >
              SHOW ALL CATEGORIES
            </Button>
          ) : showAllCategories ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="mt-3 w-full font-arcade text-xs text-[#8b93a6] sm:hidden"
              onClick={() => setShowAllCategories(false)}
            >
              SHOW FEWER CATEGORIES
            </Button>
          ) : null}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-10 w-10 animate-spin text-[#ffff00]" />
        </div>
      ) : games.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 sm:gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {games.map((game) => (
            <GameCard key={game.id} game={game} />
          ))}
        </div>
      ) : (
        <div className="border-4 border-dashed border-[#4a4a6a] py-20 text-center">
          <Gamepad2 className="mx-auto mb-4 h-16 w-16 text-[#4a4a6a]" />
          <h3 className="mb-2 font-pixel text-xl font-bold text-[#8b93a6]">NO GAMES FOUND</h3>
          <p className="mb-6 font-arcade text-lg text-[#8b93a6]">Try adjusting your search</p>
          <Button variant="arcade" onClick={resetFilters}>RESET FILTERS</Button>
        </div>
      )}

      {!loading && games.length > 0 && hasMore ? (
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
      ) : null}
    </div>
  )
}
