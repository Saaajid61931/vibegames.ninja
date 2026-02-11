import Link from "next/link"
import { unstable_cache } from "next/cache"
import { Search, Gamepad2, ChevronLeft } from "lucide-react"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { GameCard } from "@/components/games/game-card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import prisma from "@/lib/prisma"
import { CATEGORIES } from "@/lib/utils"
import { DiscoverySort, getDiscoveryOrderBy } from "@/lib/discovery"

type GamesSearchParams = {
  category?: string
  sort?: string
  q?: string
}

interface PageProps {
  searchParams: Promise<GamesSearchParams>
}

const getGames = unstable_cache(async (category?: string, sort?: string, q?: string) => {
  const where: Record<string, unknown> = {
    status: "PUBLISHED",
  }

  if (category && category !== "all") {
    where.category = category.toUpperCase()
  }

  if (q) {
    where.OR = [
      { title: { contains: q } },
      { description: { contains: q } },
    ]
  }

  const parsedSort: DiscoverySort = ["trending", "new", "popular", "top"].includes(sort || "")
    ? (sort as DiscoverySort)
    : "trending"
  const orderBy = getDiscoveryOrderBy(parsedSort)

  const games = await prisma.game.findMany({
    where,
    include: {
      studioProfile: {
        select: { id: true, handle: true, displayName: true, image: true },
      },
      creator: {
        select: { id: true, name: true, username: true, image: true },
      },
    },
    orderBy,
    take: 24,
  })

  return games
}, ["games-page-list"], { revalidate: 30, tags: ["games"] })

export default async function GamesPage({ searchParams }: PageProps) {
  const params = await searchParams
  const games = await getGames(params.category, params.sort, params.q)
  const normalizedGames = games.map((game) => ({
    ...game,
    createdAt: new Date(game.createdAt),
  }))

  return (
    <div className="min-h-screen flex flex-col bg-[#0d0d15]">
      <Header />
      
      <main className="flex-1 container mx-auto px-4 py-6 sm:py-8">
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
              <span className="text-lg sm:text-xl text-white font-pixel">{normalizedGames.length.toString().padStart(3, '0')}</span>
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
            <form action="/games" method="GET" className="flex-1">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-[#4a4a6a]" />
                <Input
                  name="q"
                  type="search"
                  placeholder="SEARCH ARCADE..."
                  className="pl-12 text-base sm:text-lg"
                />
              </div>
            </form>
            
            <div className="mobile-scroll-row md:overflow-visible md:pb-0">
              {[
                { key: "trending", label: "TRENDING" },
                { key: "new", label: "NEW" },
                { key: "popular", label: "POPULAR" },
                { key: "top", label: "TOP" },
              ].map((sort) => {
                const isActive = params.sort === sort.key || (!params.sort && sort.key === "trending")
                return (
                  <Link
                    key={sort.key}
                    href={`/games?sort=${sort.key}${params.category ? `&category=${params.category}` : ""}`}
                  >
                    <Button
                      variant={isActive ? "arcade" : "arcade-outline"}
                      size="sm"
                      className="min-w-[110px]"
                    >
                      {sort.label}
                    </Button>
                  </Link>
                )
              })}
            </div>
          </div>

          {/* Categories */}
          <div className="bg-[#1a1a2e] border-2 sm:border-4 border-[#4a4a6a] p-3 sm:p-4">
            <span className="text-[10px] text-[#4a4a6a] font-pixel block mb-3">SELECT CATEGORY</span>
            <div className="mobile-scroll-row sm:flex-wrap sm:overflow-visible sm:pb-0">
              <Link href="/games">
                <Button 
                  variant={!params.category || params.category === "all" ? "arcade" : "outline"}
                  size="sm"
                  className="min-w-[120px]"
                >
                  ALL GAMES
                </Button>
              </Link>
              {CATEGORIES.map((cat) => (
                <Link key={cat.value} href={`/games?category=${cat.value.toLowerCase()}`}>
                  <Button 
                    variant={params.category?.toUpperCase() === cat.value ? "arcade" : "outline"}
                    size="sm"
                    className="min-w-[120px]"
                  >
                    {cat.label}
                  </Button>
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Games Grid */}
        {normalizedGames.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
            {normalizedGames.map((game) => (
              <GameCard key={game.id} game={game} />
            ))}
          </div>
        ) : (
          <div className="text-center py-20 border-4 border-dashed border-[#4a4a6a]">
            <Gamepad2 className="h-16 w-16 text-[#4a4a6a] mx-auto mb-4" />
            <h3 className="text-xl font-bold text-[#4a4a6a] mb-2 font-pixel">NO GAMES FOUND</h3>
            <p className="text-[#4a4a6a] mb-6 font-arcade text-lg">Try adjusting your search</p>
            <Link href="/games">
              <Button variant="arcade">RESET FILTERS</Button>
            </Link>
          </div>
        )}
      </main>
      
      <Footer />
    </div>
  )
}
