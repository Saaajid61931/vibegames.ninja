import { unstable_cache } from "next/cache"
import prisma, { isPrismaDatasourceConfigured } from "@/lib/prisma"
import { getDiscoveryOrderBy } from "@/lib/discovery"
import { pickPrimaryJam, toPrimaryJamBadge } from "@/lib/jams"
import { countUniqueCreators } from "@/lib/home-stats"
import { logServerError } from "@/lib/server-log"
import { startOfUtcDay } from "@/lib/game-analytics"
import { CATEGORIES } from "@/lib/utils"

const mobileReelsGameSelect = {
  id: true,
  slug: true,
  title: true,
  description: true,
  gameUrl: true,
  thumbnail: true,
  category: true,
  plays: true,
  likes: true,
  supportsMobile: true,
  mobileOrientation: true,
  aiTool: true,
  aiModel: true,
} as const

const homeHeroGameSelect = {
  id: true,
  title: true,
  thumbnail: true,
} as const

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
  mobileOrientation: true,
  gameUrl: true,
  description: true,
  hasLevelEditor: true,
  aiTool: true,
  aiModel: true,
  seekingFeedback: true,
  latestUpdateNote: true,
  jamEntries: {
    orderBy: { submittedAt: "desc" },
    take: 4,
    select: {
      jam: {
        select: {
          slug: true,
          title: true,
          theme: true,
          status: true,
          startDate: true,
          endDate: true,
          votingEndDate: true,
        },
      },
    },
  },


  studioProfile: {
    select: { id: true, handle: true, displayName: true, image: true },
  },
  creator: {
    select: { id: true, name: true, username: true, image: true },
  },
} as const

const getFeaturedGames = unstable_cache(async () => {
  if (!isPrismaDatasourceConfigured()) {
    return []
  }

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
  if (!isPrismaDatasourceConfigured()) {
    return []
  }

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

const getAllMobileGames = unstable_cache(async () => {
  if (!isPrismaDatasourceConfigured()) {
    return []
  }

  return prisma.game.findMany({
    where: {
      status: "PUBLISHED",
      supportsMobile: true,
    },
    select: mobileReelsGameSelect,
    orderBy: getDiscoveryOrderBy("popular"),
    take: 20,
  })
}, ["home-all-mobile-games"], { revalidate: 60, tags: ["games"] })

const getPreviousDayTopHeroGames = unstable_cache(async () => {
  if (!isPrismaDatasourceConfigured()) {
    return []
  }

  const todayStart = startOfUtcDay(new Date())
  const previousDayStart = new Date(todayStart.getTime() - 24 * 60 * 60 * 1000)

  const analytics = await prisma.gameAnalytics.findMany({
    where: {
      date: previousDayStart,
      plays: { gt: 0 },
      game: {
        status: "PUBLISHED",
        thumbnail: { not: null },
      },
    },
    select: {
      game: {
        select: homeHeroGameSelect,
      },
    },
    orderBy: [{ plays: "desc" }, { gameId: "asc" }],
    take: 20,
  })

  const previousDayGames = analytics
    .map((entry) => entry.game)
    .filter((game) => Boolean(game.thumbnail?.trim()))

  if (previousDayGames.length >= 10) {
    return previousDayGames.slice(0, 10)
  }

  const fallbackGames = await prisma.game.findMany({
    where: {
      status: "PUBLISHED",
      thumbnail: { not: null },
    },
    select: homeHeroGameSelect,
    orderBy: getDiscoveryOrderBy("popular"),
    take: 20,
  })

  const seenGameIds = new Set<string>()

  return [...previousDayGames, ...fallbackGames]
    .filter((game) => {
      if (!game.thumbnail?.trim() || seenGameIds.has(game.id)) {
        return false
      }

      seenGameIds.add(game.id)
      return true
    })
    .slice(0, 10)
}, ["home-previous-day-top-hero-games-v2"], { revalidate: 60, tags: ["games"] })

const getEditorGames = unstable_cache(async () => {
  if (!isPrismaDatasourceConfigured()) {
    return []
  }

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
  if (!isPrismaDatasourceConfigured()) {
    return []
  }

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
  if (!isPrismaDatasourceConfigured()) {
    return []
  }

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
  if (!isPrismaDatasourceConfigured()) {
    return []
  }

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
  if (!isPrismaDatasourceConfigured()) {
    return []
  }

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
  if (!isPrismaDatasourceConfigured()) {
    return {
      games: 0,
      creators: 0,
      plays: 0,
    }
  }

  // Production uses a single pooled database connection. Keep these queries
  // sequential so the pool cannot time out while the homepage is revalidating.
  const gamesCount = await prisma.game.count({ where: { status: "PUBLISHED" } })
  const creatorUsers = await prisma.user.findMany({
    where: { role: { in: ["CREATOR", "ADMIN"] } },
    select: { id: true },
  })
  const studioProfiles = await prisma.studioProfile.findMany({
    select: { ownerId: true },
  })
  const totalPlays = await prisma.game.aggregate({ _sum: { plays: true } })

  return {
    games: gamesCount,
    creators: countUniqueCreators(
      creatorUsers.map((user) => user.id),
      studioProfiles.map((studioProfile) => studioProfile.ownerId)
    ),
    plays: totalPlays._sum.plays || 0,
  }
}, ["home-stats-v2"], { revalidate: 60, tags: ["games"] })

const getGameOfTheMonth = unstable_cache(async () => {
  if (!isPrismaDatasourceConfigured()) {
    return null
  }

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
  } as const

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

  const fallback = await prisma.game.findFirst({
    where: { status: "PUBLISHED", ratingCount: { gt: 0 } },
    select: gameSelect,
    orderBy: [{ avgRating: "desc" }, { ratingCount: "desc" }],
  })

  if (!fallback) {
    return null
  }

  return {
    game: fallback,
    monthlyStars: 0,
    monthlyRatings: 0,
  }
}, ["home-game-of-the-month"], { revalidate: 60, tags: ["featured", "games"] })

function decorateGameCards<
  T extends {
    createdAt: Date
    jamEntries: Array<{
      jam: {
        slug: string
        title: string
        theme: string | null
        status: string
        startDate: Date
        endDate: Date
        votingEndDate: Date
      }
    }>
  },
>(items: T[]) {
  return items.map((game) => ({
    ...game,
    createdAt: new Date(game.createdAt),
    primaryJam: toPrimaryJamBadge(pickPrimaryJam(game.jamEntries)),
  }))
}

export const HOME_FEATURES = [
  { icon: "Zap", title: "EXPLORE IDEAS", desc: "Discover games made by creative people worldwide", color: "var(--color-arcade-yellow)" },
  { icon: "Upload", title: "NO SKILLS NEEDED", desc: "Build with AI. No coding required", color: "var(--color-arcade-blue)" },
  { icon: "Heart", title: "SHARE & INSPIRE", desc: "Comment, share, and build community levels", color: "var(--color-arcade-red)" },
  { icon: "Trophy", title: "ZERO BARRIERS", desc: "Free forever. Everyone is a creator", color: "var(--color-arcade-green)" },
] as const

async function getHomeDataValue<T>(
  label: string,
  load: () => Promise<T>,
  fallback: T,
) {
  try {
    return await load()
  } catch (error) {
    logServerError("Home page data query failed", error, {
      route: "app/home",
      query: label,
    })

    return fallback
  }
}

export async function getHomePageData() {
  if (!isPrismaDatasourceConfigured()) {
    return {
      stats: {
        games: 0,
        creators: 0,
        plays: 0,
      },
      gameOfTheMonth: null,
      games: [],
      mobileGames: [],
      allMobileGames: [],
      heroGames: [],
      editorGames: [],
      justLaunchedGames: [],
      needsFeedbackGames: [],
      updatedThisWeekGames: [],
      builtWithToolsGames: [],
      categoryLinks: CATEGORIES.slice(0, 6).map((category) => ({
        ...category,
        href: `/games?category=${category.value.toLowerCase()}`,
      })),
    }
  }

  // These loaders intentionally run one at a time. The production pool has a
  // single connection, and parallel revalidation previously replaced real
  // metrics and games with empty fallbacks after P2024 pool timeouts.
  const stats = await getHomeDataValue("stats", getStats, {
    games: 0,
    creators: 0,
    plays: 0,
  })
  const games = await getHomeDataValue(
    "featuredGames",
    getFeaturedGames,
    [] as Awaited<ReturnType<typeof getFeaturedGames>>,
  )
  const allMobileGames = await getHomeDataValue(
    "allMobileGames",
    getAllMobileGames,
    [] as Awaited<ReturnType<typeof getAllMobileGames>>,
  )
  const mobileGames = await getHomeDataValue(
    "mobileGames",
    getMobileGames,
    [] as Awaited<ReturnType<typeof getMobileGames>>,
  )
  const heroGames = await getHomeDataValue(
    "heroGames",
    getPreviousDayTopHeroGames,
    [] as Awaited<ReturnType<typeof getPreviousDayTopHeroGames>>,
  )
  const editorGames = await getHomeDataValue(
    "editorGames",
    getEditorGames,
    [] as Awaited<ReturnType<typeof getEditorGames>>,
  )
  const gameOfTheMonth = await getHomeDataValue(
    "gameOfTheMonth",
    getGameOfTheMonth,
    null as Awaited<ReturnType<typeof getGameOfTheMonth>>
  )
  const justLaunchedGames = await getHomeDataValue(
    "justLaunchedGames",
    getJustLaunchedGames,
    [] as Awaited<ReturnType<typeof getJustLaunchedGames>>
  )
  const needsFeedbackGames = await getHomeDataValue(
    "needsFeedbackGames",
    getNeedsFeedbackGames,
    [] as Awaited<ReturnType<typeof getNeedsFeedbackGames>>
  )
  const updatedThisWeekGames = await getHomeDataValue(
    "updatedThisWeekGames",
    getUpdatedThisWeekGames,
    [] as Awaited<ReturnType<typeof getUpdatedThisWeekGames>>
  )
  const builtWithToolsGames = await getHomeDataValue(
    "builtWithToolsGames",
    getBuiltWithToolsGames,
    [] as Awaited<ReturnType<typeof getBuiltWithToolsGames>>
  )

  return {
    stats,
    gameOfTheMonth,
    games: decorateGameCards(games),
    mobileGames: decorateGameCards(mobileGames),
    allMobileGames: allMobileGames,
    heroGames,
    editorGames: decorateGameCards(editorGames),
    justLaunchedGames: decorateGameCards(justLaunchedGames),
    needsFeedbackGames: decorateGameCards(needsFeedbackGames),
    updatedThisWeekGames: decorateGameCards(updatedThisWeekGames),
    builtWithToolsGames: decorateGameCards(builtWithToolsGames),
    categoryLinks: CATEGORIES.slice(0, 6).map((category) => ({
      ...category,
      href: `/games?category=${category.value.toLowerCase()}`,
    })),
  }
}

export type HomePageData = Awaited<ReturnType<typeof getHomePageData>>
