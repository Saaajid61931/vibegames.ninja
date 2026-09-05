"use client"

import { startTransition, useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { AlertTriangle, Gamepad2, Loader2, RefreshCw, Search, Smartphone, SquarePen, X } from "lucide-react"
import { GameCard } from "@/components/games/game-card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { LoadingScreen } from "@/components/ui/loading-screen"
import { useDebounce } from "@/hooks/use-debounce"
import { CATEGORIES } from "@/lib/utils"
import { MAX_DISCOVERY_SEARCH_LENGTH } from "@/lib/discovery-query"
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
  initialPage?: number
  initialCategory?: string
  initialSort?: string
  initialQuery?: string
  initialSupportsMobile?: boolean
  initialEditorOnly?: boolean
}

type BrowseRequest = {
  targetPage: number
  append: boolean
  apiUrl: string
  browseUrl: string
}

function createBrowseUrl(
  targetPage: number,
  category: string,
  sort: string,
  query: string,
  supportsMobile: boolean,
  editorOnly: boolean
) {
  const params = new URLSearchParams()
  if (category && category !== "all") params.set("category", category)
  if (sort && sort !== "trending") params.set("sort", sort)
  if (query) params.set("q", query)
  if (supportsMobile) params.set("mobile", "true")
  if (editorOnly) params.set("editor", "true")
  if (targetPage > 1) params.set("page", String(targetPage))
  const queryString = params.toString()

  return queryString ? `/games?${queryString}` : "/games"
}

const SORT_OPTIONS = [
  { key: "trending", label: "Most played" },
  { key: "new", label: "New" },
  { key: "popular", label: "Most loved" },
  { key: "top", label: "Highest rated" },
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
  initialPage = 1,
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
  const [page, setPage] = useState(initialPage)
  const [total, setTotal] = useState(initialTotal)
  const [hasMore, setHasMore] = useState(initialHasMore)

  const [category, setCategory] = useState(initialCategory || "all")
  const [sort, setSort] = useState(initialSort || "trending")
  const [q, setQ] = useState(initialQuery || "")
  const [supportsMobile, setSupportsMobile] = useState(initialSupportsMobile)
  const [editorOnly, setEditorOnly] = useState(initialEditorOnly)
  const [showAllCategories, setShowAllCategories] = useState(false)
  const [requestError, setRequestError] = useState<string | null>(null)
  const [failedRequest, setFailedRequest] = useState<BrowseRequest | null>(null)

  const debouncedQ = useDebounce(q, 500)

  const isFirstRun = useRef(true)
  const isInitialPropsSyncRef = useRef(true)
  const abortControllerRef = useRef<AbortController | null>(null)
  const requestIdRef = useRef(0)
  const locallyNavigatedUrlsRef = useRef(new Set<string>())
  const syncedQueryRef = useRef<string | null>(null)

  const initialBrowseUrl = createBrowseUrl(
    initialPage,
    initialCategory || "all",
    initialSort || "trending",
    (initialQuery || "").trim(),
    initialSupportsMobile,
    initialEditorOnly
  )

  const buildRequest = useCallback((targetPage: number, append: boolean): BrowseRequest => {
    const search = debouncedQ.trim()
    const browseUrl = createBrowseUrl(
      targetPage,
      category,
      sort,
      search,
      supportsMobile,
      editorOnly
    )
    const queryString = browseUrl.startsWith("/games?")
      ? browseUrl.slice("/games?".length)
      : ""

    return {
      targetPage,
      append,
      apiUrl: `/api/games?${queryString}`,
      browseUrl,
    }
  }, [category, sort, debouncedQ, supportsMobile, editorOnly])

  const fetchGames = useCallback(async (request: BrowseRequest, updateUrl = false) => {
    abortControllerRef.current?.abort()
    const controller = new AbortController()
    abortControllerRef.current = controller
    const requestId = requestIdRef.current + 1
    requestIdRef.current = requestId

    if (request.append) {
      setLoadingMore(true)
    } else {
      setLoading(true)
    }
    setRequestError(null)
    setFailedRequest(null)

    try {
      if (updateUrl) {
        locallyNavigatedUrlsRef.current.add(request.browseUrl)
        startTransition(() => {
          router.push(request.browseUrl, { scroll: false })
        })
      }

      const res = await fetch(request.apiUrl, { signal: controller.signal })
      const data = await res.json().catch(() => null)

      if (!res.ok) {
        const message = typeof data?.message === "string"
          ? data.message
          : typeof data?.error === "string"
            ? data.error
            : "The arcade could not load those games."
        throw new Error(message)
      }

      if (requestId !== requestIdRef.current) {
        return
      }

      if (!Array.isArray(data?.data)) {
        throw new Error("The arcade returned an invalid game list.")
      }

      const normalized: BrowserGame[] = (data.data as ApiBrowserGame[]).map((game) => ({
        ...game,
        createdAt: new Date(game.createdAt),
      }))

      setGames((prev) => (request.append ? [...prev, ...normalized] : normalized))
      setPage(request.targetPage)
      setTotal(typeof data.total === "number" ? data.total : normalized.length)
      setHasMore(Boolean(data.hasMore))
      setRequestError(null)
      setFailedRequest(null)
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        return
      }

      if (requestId === requestIdRef.current) {
        setRequestError(error instanceof Error ? error.message : "The arcade could not load those games.")
        setFailedRequest(request)
      }
    } finally {
      if (requestId !== requestIdRef.current) {
        return
      }

      if (request.append) {
        setLoadingMore(false)
      } else {
        setLoading(false)
      }
    }
  }, [router])

  const fetchCurrentGames = useCallback((targetPage: number, append: boolean) => {
    return fetchGames(buildRequest(targetPage, append), true)
  }, [buildRequest, fetchGames])

  useEffect(() => {
    if (isFirstRun.current) {
      isFirstRun.current = false
      return
    }

    if (syncedQueryRef.current !== null) {
      if (debouncedQ !== syncedQueryRef.current) {
        return
      }

      syncedQueryRef.current = null
      return
    }

    void fetchCurrentGames(1, false)
  }, [category, sort, debouncedQ, supportsMobile, editorOnly, fetchCurrentGames])

  useEffect(() => {
    if (isInitialPropsSyncRef.current) {
      isInitialPropsSyncRef.current = false
      return
    }

    if (locallyNavigatedUrlsRef.current.has(initialBrowseUrl)) {
      locallyNavigatedUrlsRef.current.delete(initialBrowseUrl)
      return
    }

    locallyNavigatedUrlsRef.current.clear()
    abortControllerRef.current?.abort()
    requestIdRef.current += 1
    syncedQueryRef.current = initialQuery || ""
    setGames(initialGames)
    setPage(initialPage)
    setTotal(initialTotal)
    setHasMore(initialHasMore)
    setCategory(initialCategory || "all")
    setSort(initialSort || "trending")
    setQ(initialQuery || "")
    setSupportsMobile(initialSupportsMobile)
    setEditorOnly(initialEditorOnly)
    setRequestError(null)
    setFailedRequest(null)
  }, [
    initialCategory,
    initialEditorOnly,
    initialGames,
    initialHasMore,
    initialPage,
    initialBrowseUrl,
    initialQuery,
    initialSort,
    initialSupportsMobile,
    initialTotal,
  ])

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

  const activeFilterLabels = useMemo(() => {
    const labels: string[] = []
    const selectedCategory = CATEGORY_OPTIONS.find((option) => option.value === category)
    const selectedSort = SORT_OPTIONS.find((option) => option.key === sort)

    if (category !== "all") {
      labels.push(selectedCategory?.label || category.toUpperCase())
    }

    if (sort !== "trending") {
      labels.push(selectedSort?.label || sort.toUpperCase())
    }

    if (q.trim()) {
      labels.push(`"${q.trim()}"`)
    }

    if (supportsMobile) {
      labels.push("MOBILE")
    }

    if (editorOnly) {
      labels.push("EDITOR")
    }

    return labels
  }, [category, editorOnly, q, sort, supportsMobile])

  const resetFilters = () => {
    setCategory("all")
    setSort("trending")
    setQ("")
    setSupportsMobile(false)
    setEditorOnly(false)
    setShowAllCategories(false)
  }

  return (
    <div className="community-browser container mx-auto px-4 py-5 sm:py-7">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3"><div><h1 className="heading-pixel-lg text-white">Explore games</h1><p className="mt-1 hidden text-sm text-text-secondary sm:block">Find something fun. Leave with an idea.</p></div><Link href="/quick-play" className="community-button">Quick play</Link></div>

      <>
        <div className="mb-4 space-y-3">
          <div className="relative">
            <label htmlFor="arcade-search" className="sr-only">Search the arcade</label>
            <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-text-secondary" aria-hidden="true" />
            <Input
              id="arcade-search"
              type="search"
              value={q}
              onChange={(event) => setQ(event.target.value)}
              maxLength={MAX_DISCOVERY_SEARCH_LENGTH}
              placeholder="Search games, mechanics, or ideas"
              className="pl-12 pr-12 text-base sm:text-lg"
            />
            {q ? (
              <button
                type="button"
                aria-label="Clear search"
                className="absolute right-3 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center text-text-secondary transition-colors hover:bg-surface-2 hover:text-white"
                onClick={() => setQ("")}
              >
                <X className="h-4 w-4" />
              </button>
            ) : null}
          </div>

          <div className="community-filter-bar">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="text-kicker text-text-secondary">Filters</span>
              {activeFilterCount > 0 ? (
                <span className="rounded border border-arcade-yellow/40 px-2 py-1 text-xs text-arcade-yellow">
                  {activeFilterCount} active
                </span>
              ) : null}
            </div>
            {activeFilterCount > 0 ? (
              <Button
                variant="ghost"
                size="sm"
                className="h-auto px-0 py-0 font-arcade text-xs text-arcade-yellow"
                onClick={resetFilters}
              >
                RESET FILTERS
              </Button>
            ) : (
              <span className="font-arcade text-xs text-text-secondary">Showing everything</span>
            )}
          </div>

          <div className="scrollbar-none mt-3 flex gap-2 overflow-x-auto pb-1 lg:flex-wrap lg:overflow-visible">
            {SORT_OPTIONS.map((option) => (
              <Button
                key={option.key}
                variant={sort === option.key ? "arcade" : "arcade-outline"}
                size="sm"
                className="shrink-0 justify-center"
                aria-pressed={sort === option.key}
                onClick={() => setSort(option.key)}
              >
                {option.label}
              </Button>
            ))}
            <Button
              variant={supportsMobile ? "arcade" : "arcade-outline"}
              size="sm"
              className="shrink-0 justify-center"
              aria-pressed={supportsMobile}
              onClick={() => setSupportsMobile(!supportsMobile)}
            >
              <Smartphone className="mr-2 h-4 w-4" />
              MOBILE
            </Button>
            <Button
              variant={editorOnly ? "arcade" : "arcade-outline"}
              size="sm"
              className="shrink-0 justify-center"
              aria-pressed={editorOnly}
              onClick={() => setEditorOnly(!editorOnly)}
            >
              <SquarePen className="mr-2 h-4 w-4" />
              EDITOR
            </Button>
          </div>
          </div>
        </div>

        <div className="mb-4">
          <div className="flex items-center justify-between gap-3">
            <span className="sr-only">Select category</span>
            
          </div>

          <div className="mt-2 flex gap-2 overflow-x-auto pb-1 sm:flex-wrap">
            {visibleCategories.map((option) => (
              <Button
                key={option.value}
                variant={category === option.value ? "arcade" : "outline"}
                size="sm"
                className="shrink-0 justify-center"
                aria-pressed={category === option.value}
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
              className="mt-3 w-full font-arcade text-xs text-arcade-yellow sm:w-auto"
              onClick={() => setShowAllCategories(true)}
            >
              SHOW ALL CATEGORIES
            </Button>
          ) : showAllCategories ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="mt-3 w-full font-arcade text-xs text-text-secondary sm:w-auto"
              onClick={() => setShowAllCategories(false)}
            >
              SHOW FEWER CATEGORIES
            </Button>
          ) : null}
        </div>
      </>

      {requestError && failedRequest ? (
        <div role="alert" className="mb-6 flex flex-col gap-3 border-2 border-arcade-red bg-arcade-red/10 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-arcade-red" aria-hidden="true" />
            <div>
              <p className="text-sm font-bold text-white">Arcade update failed</p>
              <p className="mt-1 text-sm text-text-secondary">{requestError} The current results are still shown.</p>
            </div>
          </div>
          <Button
            type="button"
            variant="arcade-outline"
            size="sm"
            className="shrink-0"
            disabled={loading || loadingMore}
            onClick={() => void fetchGames(failedRequest)}
          >
            <RefreshCw className="mr-2 h-4 w-4" aria-hidden="true" />
            RETRY
          </Button>
        </div>
      ) : null}

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="font-arcade text-sm text-text-secondary" role="status" aria-live="polite">
          {loading ? "Updating arcade floor..." : `${games.length} of ${total} ${total === 1 ? "game" : "games"} shown`}
        </p>
        {activeFilterLabels.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {activeFilterLabels.map((label) => (
              <span
                key={label}
                className="rounded border border-border-strong bg-surface px-2 py-1 text-xs text-text"
              >
                {label}
              </span>
            ))}
          </div>
        ) : null}
      </div>

      {loading && games.length === 0 ? (
        <div aria-label="Updating game results">
          <LoadingScreen fullScreen={false} message="UPDATING THE ARCADE FLOOR..." />
        </div>
      ) : games.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 sm:gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {games.map((game) => (
            <GameCard key={game.id} game={game} />
          ))}
        </div>
      ) : (
        <div className="border-4 border-dashed border-border-strong py-20 text-center">
          <Gamepad2 className="mx-auto mb-4 h-16 w-16 text-text-secondary" />
          <h3 className="heading-pixel-md mb-2 text-text">No games found</h3>
          <p className="mb-6 text-sm text-text-secondary">
            {q.trim() ? `Nothing matches “${q.trim()}” yet.` : "Try a different category or clear the active filters."}
          </p>
          <div className="flex flex-col justify-center gap-3 sm:flex-row">
            <Button variant="arcade" onClick={resetFilters}>Reset filters</Button>
            <Button asChild variant="arcade-outline">
              <Link href="/upload">Upload a game</Link>
            </Button>
          </div>
        </div>
      )}

      {!loading && games.length > 0 && hasMore ? (
        <div className="flex justify-center pt-8">
          <Button
            variant="arcade-outline"
            size="arcade-default"
            onClick={() => {
              void fetchCurrentGames(page + 1, true)
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
