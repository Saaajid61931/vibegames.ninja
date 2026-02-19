import type { Metadata } from "next"
import Link from "next/link"
import { unstable_cache } from "next/cache"
import { Gamepad2, Upload, Trophy, Zap, ChevronRight, Star, Heart } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { GameCard } from "@/components/games/game-card"
import { GameOfTheDay } from "@/components/games/game-of-the-day"
import { ActiveJamBanner } from "@/components/jams/active-jam-banner"
import prisma from "@/lib/prisma"
import { getDiscoveryOrderBy } from "@/lib/discovery"
import { SITE_DESCRIPTION, SITE_NAME, SITE_URL } from "@/lib/site"

export const metadata: Metadata = {
  title: "AI Arcade - Build, Play & Get Inspired",
  description: "A community for AI-made games. Build with AI, play amazing creations, and get inspired by other creators.",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: `${SITE_NAME} - AI Arcade`,
    description: SITE_DESCRIPTION,
    url: SITE_URL,
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE_NAME} - AI Arcade`,
    description: SITE_DESCRIPTION,
  },
}

const getFeaturedGames = unstable_cache(async () => {
  const games = await prisma.game.findMany({
    where: { status: "PUBLISHED" },
    include: {
      studioProfile: {
        select: { id: true, handle: true, displayName: true, image: true },
      },
      creator: {
        select: { id: true, name: true, username: true, image: true }
      }
    },
    orderBy: getDiscoveryOrderBy("trending"),
    take: 6,
  })
  return games
}, ["home-featured-games"], { revalidate: 60, tags: ["games"] })

const getStats = unstable_cache(async () => {
  const [gamesCount, creatorUsersCount, studioProfilesCount, totalPlays] = await Promise.all([
    prisma.game.count({ where: { status: "PUBLISHED" } }),
    prisma.user.count({ where: { role: { in: ["CREATOR", "ADMIN"] } } }),
    prisma.studioProfile.count(),
    prisma.game.aggregate({ _sum: { plays: true } }),
  ])
  return {
    games: gamesCount,
    creators: creatorUsersCount + studioProfilesCount,
    plays: totalPlays._sum.plays || 0,
  }
}, ["home-stats"], { revalidate: 60, tags: ["games", "users"] })

const getGameOfTheDay = unstable_cache(async () => {
  // Today in UTC (midnight)
  const today = new Date()
  today.setUTCHours(0, 0, 0, 0)

  const gameSelect = {
    id: true,
    slug: true,
    title: true,
    description: true,
    thumbnail: true,
    category: true,
    plays: true,
    likes: true,
    avgRating: true,
    ratingCount: true,
    aiModel: true,
    supportsMobile: true,
    hasLevelEditor: true,
    createdAt: true,
    publishedAt: true,
    status: true,
    creator: {
      select: { id: true, name: true, username: true, image: true },
    },
    studioProfile: {
      select: { id: true, handle: true, displayName: true, image: true },
    },
  }

  // 1. Check for a manual pick
  const manualPick = await prisma.featuredGame.findUnique({
    where: { date: today },
    include: {
      game: { select: gameSelect },
    },
  })

  if (manualPick && manualPick.game.status === "PUBLISHED") {
    return {
      game: manualPick.game,
      note: manualPick.note,
      isFallback: false,
    }
  }

  // 2. Auto-fallback
  const thirtyDaysAgo = new Date(today)
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  const recentlyFeatured = await prisma.featuredGame.findMany({
    where: { date: { gte: thirtyDaysAgo } },
    select: { gameId: true },
  })
  const excludeIds = recentlyFeatured.map((f: { gameId: string }) => f.gameId)

  let fallbackGame = await prisma.game.findFirst({
    where: {
      status: "PUBLISHED",
      plays: { gt: 0 },
      ...(excludeIds.length > 0 ? { id: { notIn: excludeIds } } : {}),
    },
    select: gameSelect,
    orderBy: [{ avgRating: "desc" }, { plays: "desc" }, { publishedAt: "desc" }],
  })

  // If all recently featured, relax exclusion
  if (!fallbackGame) {
    fallbackGame = await prisma.game.findFirst({
      where: { status: "PUBLISHED", plays: { gt: 0 } },
      select: gameSelect,
      orderBy: [{ avgRating: "desc" }, { plays: "desc" }, { publishedAt: "desc" }],
    })
  }

  if (!fallbackGame) return null

  return {
    game: fallbackGame,
    note: null,
    isFallback: true,
  }
}, ["home-game-of-the-day"], { revalidate: 60, tags: ["featured", "games"] })

export default async function HomePage() {
  const [games, stats, gotd] = await Promise.all([getFeaturedGames(), getStats(), getGameOfTheDay()])
  const normalizedGames = games.map((game) => ({
    ...game,
    createdAt: new Date(game.createdAt),
  }))

  const features = [
    { icon: Zap, title: "EXPLORE IDEAS", desc: "Discover games made by creative people worldwide", color: "#ffff00" },
    { icon: Upload, title: "NO SKILLS NEEDED", desc: "Build with AI. No coding required", color: "#0080ff" },
    { icon: Heart, title: "SHARE & INSPIRE", desc: "Comment, share, and build community levels", color: "#ff0040" },
    { icon: Trophy, title: "ZERO BARRIERS", desc: "Free forever. Everyone is a creator", color: "#00ff40" },
  ]

  const websiteJsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE_NAME,
    url: SITE_URL,
    description: SITE_DESCRIPTION,
    potentialAction: {
      "@type": "SearchAction",
      target: `${SITE_URL}/games?q={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  }

  const organizationJsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: SITE_NAME,
    url: SITE_URL,
    logo: `${SITE_URL}/icon.svg`,
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#0d0d15]">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }} />
      <Header />
      
      <main className="flex-1">
        {/* Hero Section - Arcade Cabinet Style */}
        <section className="relative overflow-hidden border-b-2 sm:border-b-4 border-[#4a4a6a]">
          {/* Pixel Background */}
          <div className="absolute inset-0 pixel-bg" />
          
          {/* Screen Glow */}
          <div className="absolute inset-0 bg-gradient-to-b from-[#0080ff]/10 via-transparent to-[#ff0040]/10" />
          
          <div className="relative container mx-auto px-4 py-14 sm:py-20 md:py-32">
            {/* High Score Display Removed */}

            <div className="max-w-5xl mx-auto text-center">
              {/* Main Title */}
              <h1 className="mb-8">
                <span
                  className="block text-[clamp(1.6rem,8.5vw,2.3rem)] sm:text-5xl md:text-6xl lg:text-7xl font-bold text-white mb-3 sm:mb-4 leading-[1.05]"
                  style={{ fontFamily: "var(--font-pixel), monospace" }}
                >
                  EXPLORE
                </span>
                <span
                  className="block text-[clamp(1.6rem,8.5vw,2.3rem)] sm:text-5xl md:text-6xl lg:text-7xl font-bold text-[#ffff00] leading-[1.05] drop-shadow-[3px_3px_0_#ff0040] sm:drop-shadow-[4px_4px_0_#ff0040]"
                  style={{ fontFamily: "var(--font-pixel), monospace" }}
                >
                  CREATIVITY
                </span>
              </h1>
              
              <p className="text-base sm:text-xl md:text-2xl text-[#4a4a6a] mb-8 sm:mb-12 max-w-2xl mx-auto font-arcade">
                Build, play, and remix games created with AI. 
                Skills shouldn't be an issue to explore creativity.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/games">
                  <Button variant="arcade" size="xl" className="gap-3">
                    <Gamepad2 className="h-5 w-5" />
                    START EXPLORING
                  </Button>
                </Link>
                <Link href="/upload">
                  <Button variant="outline" size="xl" className="gap-3">
                    <Upload className="h-5 w-5" />
                    CREATE A GAME
                  </Button>
                </Link>
              </div>

              {/* Stats Bar - Arcade Score Style */}
              <div className="mt-12 sm:mt-16 pt-6 sm:pt-8 border-t-2 sm:border-t-4 border-[#4a4a6a] grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 max-w-3xl mx-auto">
                <div className="text-center p-3 sm:p-4 bg-[#1a1a2e] border-2 border-[#0080ff]">
                  <div className="text-[10px] text-[#0080ff] mb-1 font-pixel">GAMES</div>
                  <div className="text-xl sm:text-2xl md:text-3xl font-bold text-white font-pixel">
                    {stats.games.toString().padStart(6, '0')}
                  </div>
                </div>
                <div className="text-center p-3 sm:p-4 bg-[#1a1a2e] border-2 border-[#ff0040]">
                  <div className="text-[10px] text-[#ff0040] mb-1 font-pixel">CREATORS</div>
                  <div className="text-xl sm:text-2xl md:text-3xl font-bold text-white font-pixel">
                    {stats.creators.toString().padStart(6, '0')}
                  </div>
                </div>
                <div className="text-center p-3 sm:p-4 bg-[#1a1a2e] border-2 border-[#ffff00]">
                  <div className="text-[10px] text-[#ffff00] mb-1 font-pixel">PLAYS</div>
                  <div className="text-xl sm:text-2xl md:text-3xl font-bold text-white font-pixel">
                    {(stats.plays % 1000000).toString().padStart(6, '0')}
                  </div>
                </div>
              </div>
            </div>
          </div>

        </section>

        {/* Categories Quick Links */}
        <section className="border-b-2 sm:border-b-4 border-[#4a4a6a] bg-[#1a1a2e] py-6 overflow-hidden">
          <div className="container mx-auto px-4">
            <div className="flex flex-wrap justify-center gap-3 sm:gap-4">
              <Link href="/games">
                <Button variant="arcade-outline" size="sm" className="rounded-full">ALL GAMES</Button>
              </Link>
              <Link href="/games?category=action">
                <Button variant="outline" size="sm" className="rounded-full border-[#0080ff] text-[#0080ff] hover:bg-[#0080ff] hover:text-white">ACTION</Button>
              </Link>
              <Link href="/games?category=puzzle">
                <Button variant="outline" size="sm" className="rounded-full border-[#ffff00] text-[#ffff00] hover:bg-[#ffff00] hover:text-black">PUZZLE</Button>
              </Link>
              <Link href="/games?category=rpg">
                <Button variant="outline" size="sm" className="rounded-full border-[#ff0040] text-[#ff0040] hover:bg-[#ff0040] hover:text-white">RPG</Button>
              </Link>
              <Link href="/games?category=adventure">
                <Button variant="outline" size="sm" className="rounded-full border-[#00ff40] text-[#00ff40] hover:bg-[#00ff40] hover:text-black">ADVENTURE</Button>
              </Link>
              <Link href="/games?category=arcade">
                <Button variant="outline" size="sm" className="rounded-full border-[#ffa500] text-[#ffa500] hover:bg-[#ffa500] hover:text-black">ARCADE</Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Active Game Jam Banner */}
        <ActiveJamBanner />

        {/* Game of the Day */}
        {gotd?.game && (
          <GameOfTheDay
            game={gotd.game}
            note={gotd.note}
            isFallback={gotd.isFallback}
          />
        )}

        {/* Featured Games */}
        <section className="py-14 sm:py-20 border-b-2 sm:border-b-4 border-[#4a4a6a]">
          <div className="container mx-auto px-4">
            <div className="flex flex-wrap items-center justify-between gap-4 mb-8 sm:mb-12">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Trophy className="h-5 w-5 text-[#ffff00]" />
                  <span className="text-[10px] text-[#ffff00] font-pixel">TOP GAMES</span>
                </div>
                <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-white font-pixel">
                  FEATURED ARCADE
                </h2>
              </div>
              <Link href="/games">
                <Button variant="secondary" size="sm" className="gap-2">
                  VIEW ALL
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
            
            {normalizedGames.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-8">
                {normalizedGames.map((game) => (
                  <GameCard key={game.id} game={game} />
                ))}
              </div>
            ) : (
              <div className="text-center py-20 border-4 border-dashed border-[#4a4a6a]">
                <Gamepad2 className="h-16 w-16 text-[#4a4a6a] mx-auto mb-4" />
                <h3 className="text-xl font-bold text-[#4a4a6a] mb-2 font-pixel">NO GAMES FOUND</h3>
                <p className="text-[#4a4a6a] mb-6 font-arcade text-lg">Be the first to deploy!</p>
                <Link href="/upload">
                  <Button variant="arcade">UPLOAD GAME</Button>
                </Link>
              </div>
            )}
          </div>
        </section>

        {/* Features - Arcade Cabinet Style */}
        <section className="py-14 sm:py-20 border-b-2 sm:border-b-4 border-[#4a4a6a]">
          <div className="container mx-auto px-4">
            <div className="text-center mb-10 sm:mb-16">
              <div className="inline-flex items-center gap-2 mb-4 px-3 sm:px-4 py-2 bg-[#1a1a2e] border-2 sm:border-4 border-[#ff0040]">
                <Star className="h-5 w-5 text-[#ff0040]" />
                <span className="text-[10px] text-[#ff0040] font-pixel">POWER UPS</span>
              </div>
              <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-white font-pixel">
                WHY PLAY HERE?
              </h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {features.map((feature) => {
                const Icon = feature.icon
                return (
                  <div 
                    key={feature.title}
                    className="p-5 sm:p-6 bg-[#1a1a2e] border-2 sm:border-4 border-[#4a4a6a] hover:border-[#ffff00] transition-all group hover:shadow-[4px_4px_0_#ffff00] hover:-translate-x-1 hover:-translate-y-1"
                  >
                    <div 
                      className="w-14 h-14 sm:w-16 sm:h-16 border-2 sm:border-4 border-[#4a4a6a] group-hover:border-white flex items-center justify-center mb-4 sm:mb-6 transition-all"
                      style={{ backgroundColor: `${feature.color}20` }}
                    >
                      <Icon className="h-7 w-7 sm:h-8 sm:w-8" style={{ color: feature.color }} />
                    </div>
                    <h3 className="text-sm font-bold text-white mb-3 font-pixel" style={{ color: feature.color }}>
                      {feature.title}
                    </h3>
                    <p className="text-sm sm:text-base text-[#4a4a6a] font-arcade">{feature.desc}</p>
                  </div>
                )
              })}
            </div>
          </div>
        </section>

        {/* Community CTA */}
        <section className="py-14 sm:py-20">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto bg-[#1a1a2e] border-2 sm:border-4 border-[#ffff00] p-6 sm:p-8 md:p-12 relative">
              {/* Corner decorations */}
              <div className="absolute -top-2 -left-2 w-6 h-6 bg-[#ffff00]" />
              <div className="absolute -top-2 -right-2 w-6 h-6 bg-[#ffff00]" />
              <div className="absolute -bottom-2 -left-2 w-6 h-6 bg-[#ffff00]" />
              <div className="absolute -bottom-2 -right-2 w-6 h-6 bg-[#ffff00]" />
              
              <div className="text-center">
                <div className="flex items-center justify-center gap-3 sm:gap-4 mb-6">
                  <Heart className="h-6 w-6 sm:h-8 sm:w-8 text-[#ff0040] animate-pulse" />
                  <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-white font-pixel text-center">
                    JOIN THE COMMUNITY
                  </h2>
                  <Heart className="h-6 w-6 sm:h-8 sm:w-8 text-[#ff0040] animate-pulse" />
                </div>
                
                <div className="space-y-3 sm:space-y-4 text-sm sm:text-lg text-[#4a4a6a] mb-8 font-arcade">
                  <p>✨ Share your creativity with the world</p>
                  <p>🚀 Get inspired by other creators</p>
                  <p>💬 Connect and collaborate</p>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Link href="/register">
                    <Button variant="arcade" size="lg" className="gap-3">
                      <Upload className="h-5 w-5" />
                      START CREATING
                    </Button>
                  </Link>
                  <Link href="/games">
                    <Button variant="secondary" size="lg" className="gap-3">
                      <Gamepad2 className="h-5 w-5" />
                      BROWSE GAMES
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
      
      <Footer />
    </div>
  )
}
