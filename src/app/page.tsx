import type { Metadata } from "next"
import Link from "next/link"
import { unstable_cache } from "next/cache"
import { Gamepad2, Upload, Trophy, Zap, ChevronRight, Star, Heart } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { GameCard } from "@/components/games/game-card"
import { GameOfTheDay } from "@/components/games/game-of-the-day"
import { RecentlyPlayed } from "@/components/games/recently-played"
import { ActiveJamBanner } from "@/components/jams/active-jam-banner"
import prisma from "@/lib/prisma"
import { getDiscoveryOrderBy } from "@/lib/discovery"
import { CATEGORIES } from "@/lib/utils"
import { SITE_DESCRIPTION, SITE_NAME, SITE_URL } from "@/lib/site"

export const dynamic = "force-dynamic"

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

const homeGameCardSelect = {
  id: true,
  slug: true,
  title: true,
  thumbnail: true,
  thumbnailSlides: true,
  category: true,
  plays: true,
  likes: true,
  createdAt: true,
  publishedAt: true,
  supportsMobile: true,
  hasLevelEditor: true,
  aiTool: true,
  aiModel: true,
  seekingFeedback: true,
  latestUpdateNote: true,
  studioProfile: {
    select: { id: true, handle: true, displayName: true, image: true },
  },
  creator: {
    select: { id: true, name: true, username: true, image: true },
  },
} as const

const getFeaturedGames = unstable_cache(async () => {
  const curatedPicks = await prisma.featuredGame.findMany({
    where: {
      game: { status: "PUBLISHED" },
    },
    include: {
      game: {
        select: homeGameCardSelect,
      },
    },
    orderBy: { date: "desc" },
    take: 6,
  })

  const curatedGames = curatedPicks.map((entry) => entry.game)

  if (curatedGames.length >= 6) {
    return curatedGames
  }

  const fallbackGames = await prisma.game.findMany({
    where: {
      status: "PUBLISHED",
      id: {
        notIn: curatedGames.map((game) => game.id),
      },
    },
    select: homeGameCardSelect,
    orderBy: getDiscoveryOrderBy("trending"),
    take: Math.max(6 - curatedGames.length, 0),
  })

  return [...curatedGames, ...fallbackGames]
}, ["home-featured-games"], { revalidate: 60, tags: ["games"] })

const getMobileGames = unstable_cache(async () => {
  return prisma.game.findMany({
    where: {
      status: "PUBLISHED",
      supportsMobile: true,
    },
    select: homeGameCardSelect,
    orderBy: getDiscoveryOrderBy("popular"),
    take: 4,
  })
}, ["home-mobile-games"], { revalidate: 60, tags: ["games"] })

const getEditorGames = unstable_cache(async () => {
  return prisma.game.findMany({
    where: {
      status: "PUBLISHED",
      hasLevelEditor: true,
    },
    select: homeGameCardSelect,
    orderBy: getDiscoveryOrderBy("trending"),
    take: 4,
  })
}, ["home-editor-games"], { revalidate: 60, tags: ["games"] })

const getJustLaunchedGames = unstable_cache(async () => {
  const since = new Date(Date.now() - 72 * 60 * 60 * 1000)
  return prisma.game.findMany({
    where: {
      status: "PUBLISHED",
      publishedAt: {
        gte: since,
      },
    },
    select: homeGameCardSelect,
    orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
    take: 4,
  })
}, ["home-just-launched-games"], { revalidate: 60, tags: ["games"] })

const getNeedsFeedbackGames = unstable_cache(async () => {
  return prisma.game.findMany({
    where: {
      status: "PUBLISHED",
      seekingFeedback: true,
    },
    select: homeGameCardSelect,
    orderBy: [{ plays: "asc" }, { publishedAt: "desc" }],
    take: 4,
  })
}, ["home-needs-feedback-games"], { revalidate: 60, tags: ["games"] })

const getUpdatedThisWeekGames = unstable_cache(async () => {
  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
  return prisma.game.findMany({
    where: {
      status: "PUBLISHED",
      updatedAt: {
        gte: since,
      },
    },
    select: homeGameCardSelect,
    orderBy: [{ updatedAt: "desc" }, { publishedAt: "desc" }],
    take: 4,
  })
}, ["home-updated-this-week-games"], { revalidate: 60, tags: ["games"] })

const getBuiltWithToolsGames = unstable_cache(async () => {
  return prisma.game.findMany({
    where: {
      status: "PUBLISHED",
      aiTool: {
        in: ["chatgpt", "claude", "cursor"],
      },
    },
    select: homeGameCardSelect,
    orderBy: getDiscoveryOrderBy("new"),
    take: 4,
  })
}, ["home-built-with-tools-games"], { revalidate: 60, tags: ["games"] })

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

const getGameOfTheMonth = unstable_cache(async () => {
  const now = new Date()
  const startOfMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1))

  const gameSelect = {
    id: true,
    slug: true,
    title: true,
    description: true,
    thumbnail: true,
    thumbnailSlides: true,
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

  // Find the game with the most total stars received this month
  const topRated = await prisma.gameRating.groupBy({
    by: ["gameId"],
    where: {
      createdAt: { gte: startOfMonth },
    },
    _sum: { score: true },
    _count: { score: true },
    orderBy: { _sum: { score: "desc" } },
    take: 10,
  })

  const publishedTopRatedGames = topRated.length
    ? await prisma.game.findMany({
        where: {
          id: { in: topRated.map((entry) => entry.gameId) },
          status: "PUBLISHED",
        },
        select: gameSelect,
      })
    : []

  const publishedTopRatedGamesById = new Map(
    publishedTopRatedGames.map((game) => [game.id, game])
  )

  // Find the first one that is actually published without extra per-row queries
  for (const entry of topRated) {
    const game = publishedTopRatedGamesById.get(entry.gameId)
    if (game && game.status === "PUBLISHED") {
      return {
        game,
        monthlyStars: entry._sum.score ?? 0,
        monthlyRatings: entry._count.score ?? 0,
      }
    }
  }

  // Fallback: game with highest overall avgRating
  const fallback = await prisma.game.findFirst({
    where: { status: "PUBLISHED", ratingCount: { gt: 0 } },
    select: gameSelect,
    orderBy: [{ avgRating: "desc" }, { ratingCount: "desc" }],
  })

  if (!fallback) return null

  return {
    game: fallback,
    monthlyStars: 0,
    monthlyRatings: 0,
  }
}, ["home-game-of-the-month"], { revalidate: 60, tags: ["featured", "games"] })

export default async function HomePage() {
  const [games, stats, gotd, mobileGames, editorGames, justLaunchedGames, needsFeedbackGames, updatedThisWeekGames, builtWithToolsGames] = await Promise.all([
    getFeaturedGames(),
    getStats(),
    getGameOfTheMonth(),
    getMobileGames(),
    getEditorGames(),
    getJustLaunchedGames(),
    getNeedsFeedbackGames(),
    getUpdatedThisWeekGames(),
    getBuiltWithToolsGames(),
  ])
  const normalizedGames = games.map((game) => ({
    ...game,
    createdAt: new Date(game.createdAt),
  }))
  const normalizedMobileGames = mobileGames.map((game) => ({
    ...game,
    createdAt: new Date(game.createdAt),
  }))
  const normalizedEditorGames = editorGames.map((game) => ({
    ...game,
    createdAt: new Date(game.createdAt),
  }))
  const normalizedJustLaunchedGames = justLaunchedGames.map((game) => ({
    ...game,
    createdAt: new Date(game.createdAt),
  }))
  const normalizedNeedsFeedbackGames = needsFeedbackGames.map((game) => ({
    ...game,
    createdAt: new Date(game.createdAt),
  }))
  const normalizedUpdatedThisWeekGames = updatedThisWeekGames.map((game) => ({
    ...game,
    createdAt: new Date(game.createdAt),
  }))
  const normalizedBuiltWithToolsGames = builtWithToolsGames.map((game) => ({
    ...game,
    createdAt: new Date(game.createdAt),
  }))
  const categoryLinks = CATEGORIES.slice(0, 6).map((category) => ({
    ...category,
    href: `/games?category=${category.value.toLowerCase()}`,
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
                Skills shouldn&apos;t be an issue to explore creativity.
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

        <section className="border-b-2 sm:border-b-4 border-[#4a4a6a] bg-[#11111d] py-10 sm:py-14">
          <div className="container mx-auto px-4">
            <div className="grid gap-4 lg:grid-cols-[1.3fr_1fr]">
              <div className="border-2 border-[#4a4a6a] bg-[#1a1a2e] p-5 sm:p-6">
                <p className="font-pixel text-[10px] text-[#22c55e]">COMMUNITY MOMENTUM</p>
                <h2 className="mt-2 font-pixel text-lg text-white sm:text-2xl">GAME JAMS DRIVE THE ENERGY</h2>
                <p className="mt-3 max-w-2xl font-arcade text-sm text-[#c9d1ff]">
                  One strong jam system is better than scattered mini-events. Themes, deadlines, banners, submissions, and voting now live in one place.
                </p>
                <p className="mt-2 font-arcade text-sm text-[#8b93a6]">
                  Join an active jam to build around a theme, get discovered faster, and give creators a clearer reason to upload now.
                </p>
                <div className="mt-5 flex flex-wrap gap-3">
                  <Link href="/jams">
                    <Button variant="arcade">VIEW GAME JAMS</Button>
                  </Link>
                  <Link href="/upload">
                    <Button variant="outline">UPLOAD A JAM BUILD</Button>
                  </Link>
                </div>
              </div>

              <div className="border-2 border-[#4a4a6a] bg-[#1a1a2e] p-5 sm:p-6">
                <p className="font-pixel text-[10px] text-[#00d1ff]">WHY CREATORS USE THIS</p>
                <div className="mt-3 space-y-3 font-arcade text-sm text-[#c9d1ff]">
                  <p>Every new launch gets a real discovery lane.</p>
                  <p>You can mark one game as seeking feedback when you want eyes, not just likes.</p>
                  <p>Your public profile now works more like a living portfolio than a file dump.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <RecentlyPlayed games={[...normalizedGames, ...normalizedMobileGames, ...normalizedEditorGames]} />

        {/* Game of the Month */}
        {gotd?.game && (
          <GameOfTheDay
            game={gotd.game}
            monthlyStars={gotd.monthlyStars}
            monthlyRatings={gotd.monthlyRatings}
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

        {normalizedJustLaunchedGames.length > 0 && (
          <section className="py-14 sm:py-20 border-b-2 sm:border-b-4 border-[#4a4a6a] bg-[#11111d]">
            <div className="container mx-auto px-4">
              <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
                <div>
                  <span className="font-pixel text-[10px] text-[#22c55e]">AUTOMATIC DISCOVERY</span>
                  <h2 className="mt-2 font-pixel text-xl text-white sm:text-2xl md:text-3xl">JUST LAUNCHED</h2>
                  <p className="mt-2 font-arcade text-sm text-[#8b93a6]">Fresh uploads get a visibility window instead of competing only with old winners.</p>
                </div>
                <Link href="/games?sort=new">
                  <Button variant="secondary" size="sm">SEE NEW GAMES</Button>
                </Link>
              </div>
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-4">
                {normalizedJustLaunchedGames.map((game) => (
                  <GameCard key={game.id} game={game} />
                ))}
              </div>
            </div>
          </section>
        )}

        {normalizedNeedsFeedbackGames.length > 0 && (
          <section className="py-14 sm:py-20 border-b-2 sm:border-b-4 border-[#4a4a6a]">
            <div className="container mx-auto px-4">
              <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
                <div>
                  <span className="font-pixel text-[10px] text-[#ff7a00]">CREATOR SUPPORT</span>
                  <h2 className="mt-2 font-pixel text-xl text-white sm:text-2xl md:text-3xl">NEEDS FEEDBACK</h2>
                  <p className="mt-2 font-arcade text-sm text-[#8b93a6]">Creators can spotlight one game when they want useful player input, not just passive traffic.</p>
                </div>
                <Link href="/upload">
                  <Button variant="secondary" size="sm">UPLOAD YOUR BUILD</Button>
                </Link>
              </div>
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-4">
                {normalizedNeedsFeedbackGames.map((game) => (
                  <GameCard key={game.id} game={game} />
                ))}
              </div>
            </div>
          </section>
        )}

        {normalizedUpdatedThisWeekGames.length > 0 && (
          <section className="py-14 sm:py-20 border-b-2 sm:border-b-4 border-[#4a4a6a] bg-[#11111d]">
            <div className="container mx-auto px-4">
              <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
                <div>
                  <span className="font-pixel text-[10px] text-[#00d1ff]">ACTIVE CREATORS</span>
                  <h2 className="mt-2 font-pixel text-xl text-white sm:text-2xl md:text-3xl">UPDATED THIS WEEK</h2>
                  <p className="mt-2 font-arcade text-sm text-[#8b93a6]">Keep players returning with visible update momentum, not just one-and-done launches.</p>
                </div>
                <Link href="/creator">
                  <Button variant="secondary" size="sm">OPEN DASHBOARD</Button>
                </Link>
              </div>
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-4">
                {normalizedUpdatedThisWeekGames.map((game) => (
                  <GameCard key={game.id} game={game} />
                ))}
              </div>
            </div>
          </section>
        )}

        {normalizedBuiltWithToolsGames.length > 0 && (
          <section className="py-14 sm:py-20 border-b-2 sm:border-b-4 border-[#4a4a6a]">
            <div className="container mx-auto px-4">
              <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
                <div>
                  <span className="font-pixel text-[10px] text-[#ffff00]">AI HOBBYIST ENERGY</span>
                  <h2 className="mt-2 font-pixel text-xl text-white sm:text-2xl md:text-3xl">BUILT WITH GPT, CLAUDE, OR CURSOR</h2>
                  <p className="mt-2 font-arcade text-sm text-[#8b93a6]">Show creators they are among peers shipping fast, remixing ideas, and getting public feedback.</p>
                </div>
                <Link href="/games">
                  <Button variant="secondary" size="sm">BROWSE MORE</Button>
                </Link>
              </div>
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-4">
                {normalizedBuiltWithToolsGames.map((game) => (
                  <GameCard key={game.id} game={game} />
                ))}
              </div>
            </div>
          </section>
        )}

        <section className="border-b-2 sm:border-b-4 border-[#4a4a6a] bg-[#11111d] py-14 sm:py-20">
          <div className="container mx-auto px-4">
            <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
              <div>
                <div className="mb-2 flex items-center gap-2">
                  <Zap className="h-5 w-5 text-[#00d1ff]" />
                  <span className="font-pixel text-[10px] text-[#00d1ff]">DISCOVERY SHORTCUTS</span>
                </div>
                <h2 className="font-pixel text-xl text-white sm:text-2xl md:text-3xl">FIND YOUR NEXT RABBIT HOLE</h2>
                <p className="mt-2 max-w-3xl font-arcade text-sm text-[#8b93a6] sm:text-base">
                  Explore mobile-ready games, level-editor sandboxes, and genre collections built to be easy to share and easy to revisit.
                </p>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <Link href="/games?mobile=true" className="group border-2 border-[#4a4a6a] bg-[#1a1a2e] p-5 transition-all hover:border-[#22c55e] hover:-translate-y-1">
                <p className="font-pixel text-[10px] text-[#22c55e]">PLAY ANYWHERE</p>
                <h3 className="mt-2 font-pixel text-sm text-white">MOBILE-FRIENDLY GAMES</h3>
                <p className="mt-3 font-arcade text-sm text-[#8b93a6]">Short sessions, touch controls, and games that feel good on the go.</p>
              </Link>
              <Link href="/games?editor=true" className="group border-2 border-[#4a4a6a] bg-[#1a1a2e] p-5 transition-all hover:border-[#ffff00] hover:-translate-y-1">
                <p className="font-pixel text-[10px] text-[#ffff00]">MAKE IT YOURS</p>
                <h3 className="mt-2 font-pixel text-sm text-white">LEVEL EDITOR PICKS</h3>
                <p className="mt-3 font-arcade text-sm text-[#8b93a6]">Play, remix, and publish community levels to keep games alive longer.</p>
              </Link>
              <Link href="/jams" className="group border-2 border-[#4a4a6a] bg-[#1a1a2e] p-5 transition-all hover:border-[#ff0040] hover:-translate-y-1">
                <p className="font-pixel text-[10px] text-[#ff0040]">COMMUNITY EVENTS</p>
                <h3 className="mt-2 font-pixel text-sm text-white">JOIN A GAME JAM</h3>
                <p className="mt-3 font-arcade text-sm text-[#8b93a6]">Compete, get discovered, and ride the momentum of deadline-driven launches.</p>
              </Link>
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              {categoryLinks.map((category) => (
                <Link key={category.value} href={category.href}>
                  <Button variant="outline" size="sm" className="rounded-full border-[#4a4a6a] text-[#c9d1ff] hover:border-[#ffff00] hover:text-[#ffff00]">
                    {category.label}
                  </Button>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {normalizedMobileGames.length > 0 && (
          <section className="py-14 sm:py-20 border-b-2 sm:border-b-4 border-[#4a4a6a]">
            <div className="container mx-auto px-4">
              <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
                <div>
                  <span className="font-pixel text-[10px] text-[#22c55e]">MOBILE COLLECTION</span>
                  <h2 className="mt-2 font-pixel text-xl text-white sm:text-2xl md:text-3xl">QUICK PLAYS FOR PHONE SCREENS</h2>
                </div>
                <Link href="/games?mobile=true">
                  <Button variant="secondary" size="sm">SEE MOBILE GAMES</Button>
                </Link>
              </div>
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-4">
                {normalizedMobileGames.map((game) => (
                  <GameCard key={game.id} game={game} />
                ))}
              </div>
            </div>
          </section>
        )}

        {normalizedEditorGames.length > 0 && (
          <section className="py-14 sm:py-20 border-b-2 sm:border-b-4 border-[#4a4a6a] bg-[#11111d]">
            <div className="container mx-auto px-4">
              <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
                <div>
                  <span className="font-pixel text-[10px] text-[#ffff00]">REMIX-FRIENDLY</span>
                  <h2 className="mt-2 font-pixel text-xl text-white sm:text-2xl md:text-3xl">GAMES WITH LEVEL EDITORS</h2>
                </div>
                <Link href="/games?editor=true">
                  <Button variant="secondary" size="sm">BROWSE EDITOR GAMES</Button>
                </Link>
              </div>
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-4">
                {normalizedEditorGames.map((game) => (
                  <GameCard key={game.id} game={game} />
                ))}
              </div>
            </div>
          </section>
        )}
      </main>
      
      <Footer />
    </div>
  )
}
