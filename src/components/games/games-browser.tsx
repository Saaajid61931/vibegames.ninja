"use client"

import { startTransition, useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { AlertTriangle, ArrowDown, ArrowUpRight, ChevronDown, Gamepad2, Loader2, RefreshCw, Search, Shuffle, SlidersHorizontal, Smartphone, SquarePen, X } from "lucide-react"
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
  const gameCards = useMemo(() => games.map((game) => <GameCard key={game.id} game={game} />), [games])

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

    setLoadingMore(request.append)
    setLoading(!request.append)
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
    setLoading(false)
    setLoadingMore(false)
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

  const activeFilters = useMemo(() => {
    const filters: { key: string; label: string; remove: () => void }[] = []
    const selectedCategory = CATEGORY_OPTIONS.find((option) => option.value === category)
    const selectedSort = SORT_OPTIONS.find((option) => option.key === sort)

    if (category !== "all") {
      filters.push({ key: "category", label: selectedCategory?.label || category.toUpperCase(), remove: () => setCategory("all") })
    }

    if (sort !== "trending") {
      filters.push({ key: "sort", label: selectedSort?.label || sort.toUpperCase(), remove: () => setSort("trending") })
    }

    if (q.trim()) {
      filters.push({ key: "search", label: `“${q.trim()}”`, remove: () => setQ("") })
    }

    if (supportsMobile) {
      filters.push({ key: "mobile", label: "Mobile friendly", remove: () => setSupportsMobile(false) })
    }

    if (editorOnly) {
      filters.push({ key: "editor", label: "Level editor", remove: () => setEditorOnly(false) })
    }

    return filters
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
    <div className="community-browser container mx-auto px-4 pb-12 pt-5 sm:pb-16 sm:pt-9">
      <header className="mb-5 flex flex-col justify-between gap-3 sm:mb-7 sm:flex-row sm:items-end">
        <div>
          <p className="mb-3 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-arcade-cyan"><span className="h-1.5 w-1.5 bg-arcade-cyan" aria-hidden="true" />01 / The game library</p>
          <h1 className="heading-pixel-lg text-text">Pick your next<br /><span className="text-arcade-yellow">obsession.</span></h1>
          <p className="mt-3 max-w-lg text-sm leading-6 text-text-secondary">Fresh ideas. Unexpected favorites. Jump right in.</p>
        </div>
        <Link href="/quick-play" prefetch={false} className="inline-flex min-h-12 w-fit items-center justify-center gap-3 border border-border-strong bg-surface px-5 text-xs font-bold uppercase tracking-widest text-text shadow-[3px_3px_0_#05070d] transition-colors hover:border-arcade-cyan hover:text-arcade-cyan focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-arcade-cyan"><Shuffle className="h-4 w-4 text-arcade-cyan" aria-hidden="true" />Surprise me <ArrowUpRight className="h-4 w-4" aria-hidden="true" /></Link>
      </header>

      <section aria-label="Find games" className="mb-5 border border-border-strong bg-surface shadow-[4px_4px_0_#05070d] sm:mb-7">
        <div className="flex flex-col gap-2 p-3 sm:gap-3 sm:p-5 lg:flex-row">
          <div className="relative min-w-0 flex-1">
            <label htmlFor="arcade-search" className="sr-only">Search the arcade</label>
            <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-arcade-cyan" aria-hidden="true" />
            <Input id="arcade-search" type="search" value={q} onChange={(event) => setQ(event.target.value)} maxLength={MAX_DISCOVERY_SEARCH_LENGTH} placeholder="Find your next game" className="h-12 border pl-12 pr-12 text-base focus:border-arcade-cyan [&::-webkit-search-cancel-button]:appearance-none" />
            {q ? <button type="button" aria-label="Clear search" className="absolute right-1 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center text-text-secondary transition-colors hover:text-arcade-cyan focus-visible:outline-2 focus-visible:outline-arcade-cyan" onClick={() => setQ("")}><X className="h-4 w-4" aria-hidden="true" /></button> : null}
          </div>
          <div className="flex items-center gap-3 border border-border-strong bg-canvas px-3 lg:w-60">
            <SlidersHorizontal className="h-4 w-4 shrink-0 text-text-secondary" aria-hidden="true" />
            <label htmlFor="arcade-sort" className="text-xs text-text-secondary">Sort</label>
            <select id="arcade-sort" value={sort} onChange={(event) => setSort(event.target.value)} className="min-h-12 min-w-0 flex-1 cursor-pointer bg-canvas text-base font-medium text-text focus-visible:outline-2 focus-visible:outline-arcade-cyan">
              {SORT_OPTIONS.map((option) => <option key={option.key} value={option.key}>{option.label}</option>)}
            </select>
          </div>
        </div>

        <div className="border-t border-border p-3 sm:px-5 sm:py-4">
          <div className="mb-2 flex flex-wrap items-center justify-between gap-2 sm:mb-3">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-text-secondary">Choose your lane</p>
            <div className="flex items-center gap-2 text-xs text-text-secondary">
              {activeFilterCount > 0 ? <><span>{activeFilterCount} {activeFilterCount === 1 ? "filter" : "filters"} active</span><button type="button" className="min-h-9 px-2 font-semibold text-arcade-yellow hover:text-white focus-visible:outline-2 focus-visible:outline-arcade-cyan" onClick={resetFilters}>Reset all</button></> : <span className="hidden min-h-9 content-center sm:block">All play styles welcome</span>}
            </div>
          </div>
          <div className="flex flex-wrap gap-2" role="group" aria-label="Game category">
            {visibleCategories.map((option) => (
              <button key={option.value} type="button" aria-pressed={category === option.value} onClick={() => setCategory(option.value)} className={`min-h-11 border px-3 text-[11px] font-bold uppercase tracking-wide transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-arcade-cyan ${category === option.value ? "border-arcade-yellow bg-arcade-yellow text-canvas shadow-[2px_2px_0_#05070d]" : "border-border-strong bg-canvas text-text-secondary hover:border-arcade-cyan hover:text-arcade-cyan"}`}>{option.label}</button>
            ))}
            {CATEGORY_OPTIONS.length > visibleCategories.length || showAllCategories ? <button type="button" aria-expanded={showAllCategories} className="inline-flex min-h-11 items-center gap-1.5 px-2 text-xs text-text-secondary transition-colors hover:text-arcade-cyan focus-visible:outline-2 focus-visible:outline-arcade-cyan" onClick={() => setShowAllCategories(!showAllCategories)}>{showAllCategories ? "Fewer genres" : "More genres"}<ChevronDown className={`h-3.5 w-3.5 ${showAllCategories ? "rotate-180" : ""}`} aria-hidden="true" /></button> : null}
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-border pt-3 sm:mt-4 sm:pt-4" role="group" aria-label="Game features">
            <span className="mr-1 hidden text-[10px] font-bold uppercase tracking-widest text-text-secondary sm:inline">Made for</span>
            <button type="button" aria-pressed={supportsMobile} onClick={() => setSupportsMobile(!supportsMobile)} className={`inline-flex min-h-11 items-center gap-2 border px-3 text-xs transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-arcade-cyan ${supportsMobile ? "border-arcade-cyan bg-arcade-cyan/10 text-arcade-cyan" : "border-border-strong text-text-secondary hover:border-arcade-cyan hover:text-text"}`}><Smartphone className="h-4 w-4" aria-hidden="true" />Mobile friendly</button>
            <button type="button" aria-pressed={editorOnly} onClick={() => setEditorOnly(!editorOnly)} className={`inline-flex min-h-11 items-center gap-2 border px-3 text-xs transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-arcade-cyan ${editorOnly ? "border-arcade-cyan bg-arcade-cyan/10 text-arcade-cyan" : "border-border-strong text-text-secondary hover:border-arcade-cyan hover:text-text"}`}><SquarePen className="h-4 w-4" aria-hidden="true" />Level editor</button>
          </div>
        </div>
      </section>

      {requestError && failedRequest ? (
        <div role="alert" className="mb-6 flex flex-col gap-3 border border-arcade-red/60 bg-arcade-red/5 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-arcade-red" aria-hidden="true" />
            <div><p className="text-sm font-bold text-white">The arcade could not update</p><p className="mt-1 text-sm text-text-secondary">{requestError} Your current results are still here.</p></div>
          </div>
          <Button type="button" variant="arcade-outline" size="sm" className="shrink-0" disabled={loading || loadingMore} onClick={() => void fetchGames(failedRequest)}><RefreshCw className="mr-2 h-4 w-4" aria-hidden="true" />Try again</Button>
        </div>
      ) : null}

      <div className="mb-5 flex flex-col gap-3 border-b border-border pb-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex shrink-0 items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center border border-border-strong bg-surface text-arcade-cyan"><Gamepad2 className="h-4 w-4" aria-hidden="true" /></span>
          <div><h2 className="text-sm font-bold text-text">{category === "all" ? "The arcade floor" : `${CATEGORY_OPTIONS.find((option) => option.value === category)?.label || category} games`}</h2><p className="mt-0.5 text-xs text-text-secondary" role="status" aria-live="polite">{loading ? "Finding your next game…" : `${games.length} of ${total} ${total === 1 ? "game" : "games"}`}</p></div>
          {loading ? <Loader2 className="h-4 w-4 animate-spin text-arcade-cyan motion-reduce:animate-none" aria-hidden="true" /> : null}
        </div>
        {activeFilters.length > 0 ? <div className="flex min-w-0 flex-wrap gap-2">{activeFilters.map((filter) => <button key={filter.key} type="button" aria-label={`Remove ${filter.label} filter`} onClick={filter.remove} className="inline-flex min-h-10 max-w-full items-center gap-2 border border-border-strong bg-surface px-2.5 text-xs text-text-secondary transition-colors hover:border-arcade-cyan hover:text-text focus-visible:outline-2 focus-visible:outline-arcade-cyan"><span className="max-w-48 truncate">{filter.label}</span><X className="h-3 w-3 shrink-0" aria-hidden="true" /></button>)}</div> : null}
      </div>

      <div aria-busy={loading || loadingMore}>
        {loading && games.length === 0 ? (
          <div aria-label="Updating game results"><LoadingScreen fullScreen={false} message="FINDING YOUR NEXT GAME..." /></div>
        ) : games.length > 0 ? (
          <div className={`grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 ${loading ? "opacity-60" : ""}`}>{gameCards}</div>
        ) : (
          <div className="border border-dashed border-border-strong bg-surface px-5 py-14 text-center sm:py-20">
            <span className="mx-auto mb-6 flex h-16 w-16 items-center justify-center border border-arcade-cyan/40 bg-arcade-cyan/5 text-arcade-cyan shadow-[4px_4px_0_#05070d]"><Gamepad2 className="h-8 w-8" aria-hidden="true" /></span>
            <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.2em] text-arcade-cyan">A little too off the beaten path</p>
            <h3 className="heading-pixel-sm text-text">No games found</h3>
            <p className="mx-auto mb-6 mt-3 max-w-md break-words text-sm leading-6 text-text-secondary">{q.trim() ? `Nothing matches “${q.trim()}” yet. Try a shorter search or a different genre.` : "There are more worlds to explore. Clear a filter and see what turns up."}</p>
            <div className="flex flex-col justify-center gap-3 sm:flex-row"><Button variant="arcade" onClick={resetFilters}>Reset filters</Button><Button asChild variant="arcade-outline"><Link href="/upload" prefetch={false}>Publish a game</Link></Button></div>
          </div>
        )}
      </div>

      {!loading && games.length > 0 ? (
        <div className="mt-9 flex flex-col items-center gap-4 border-t border-border pt-7">
          {hasMore ? <Button variant="arcade-outline" size="arcade-default" className="min-w-56" onClick={() => void fetchCurrentGames(page + 1, true)} disabled={loadingMore}>{loadingMore ? <><Loader2 className="mr-2 h-4 w-4 animate-spin motion-reduce:animate-none" aria-hidden="true" />Loading games…</> : <>More games to play <ArrowDown className="ml-3 h-4 w-4" aria-hidden="true" /></>}</Button> : <p className="text-xs text-text-secondary">You’ve reached the end. A different filter opens a new door.</p>}
          <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-text-tertiary">{games.length} / {total} games explored</p>
        </div>
      ) : null}
    </div>
  )
}
