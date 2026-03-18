import { NextRequest, NextResponse } from "next/server"
import { unstable_cache, revalidateTag } from "next/cache"
import prisma from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { logServerError } from "@/lib/server-log"

// Game select shape — superset of GameCard props + description for hero
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
  status: true,
  createdAt: true,
  publishedAt: true,
  creator: {
    select: { id: true, name: true, username: true, image: true },
  },
  studioProfile: {
    select: { id: true, handle: true, displayName: true, image: true },
  },
}

/**
 * GET /api/featured
 * Returns today's Game of the Day.
 * If no manual pick exists for today, auto-fallback selects the best candidate.
 */
export async function GET() {
  const data = await getCachedFeatured()
  return NextResponse.json(data, {
    headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300" },
  })
}

const getCachedFeatured = unstable_cache(
  async () => {
    // Today in UTC (midnight)
    const today = new Date()
    today.setUTCHours(0, 0, 0, 0)

    // 1. Check for a manual pick
    const manualPick = await prisma.featuredGame.findUnique({
      where: { date: today },
      include: {
        game: { select: gameSelect },
        createdBy: { select: { name: true, username: true } },
      },
    })

    if (manualPick && manualPick.game.status === "PUBLISHED") {
      return {
        game: manualPick.game,
        note: manualPick.note,
        isFallback: false,
        date: today.toISOString(),
      }
    }

    // 2. Auto-fallback: pick the best published game not featured in the last 30 days
    const thirtyDaysAgo = new Date(today)
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    // Get gameIds featured in the last 30 days to exclude
    const recentlyFeatured = await prisma.featuredGame.findMany({
      where: { date: { gte: thirtyDaysAgo } },
      select: { gameId: true },
    })
    const excludeIds = recentlyFeatured.map((f) => f.gameId)

    const fallbackGame = await prisma.game.findFirst({
      where: {
        status: "PUBLISHED",
        plays: { gt: 0 },
        ...(excludeIds.length > 0 ? { id: { notIn: excludeIds } } : {}),
      },
      select: gameSelect,
      orderBy: [
        { avgRating: "desc" },
        { plays: "desc" },
        { publishedAt: "desc" },
      ],
    })

    // If all games have been recently featured, relax the exclusion
    if (!fallbackGame) {
      const anyGame = await prisma.game.findFirst({
        where: { status: "PUBLISHED", plays: { gt: 0 } },
        select: gameSelect,
        orderBy: [
          { avgRating: "desc" },
          { plays: "desc" },
          { publishedAt: "desc" },
        ],
      })

      if (!anyGame) {
        return { game: null, note: null, isFallback: true, date: today.toISOString() }
      }

      return {
        game: anyGame,
        note: null,
        isFallback: true,
        date: today.toISOString(),
      }
    }

    return {
      game: fallbackGame,
      note: null,
      isFallback: true,
      date: today.toISOString(),
    }
  },
  ["featured-game-of-the-day"],
  { revalidate: 60, tags: ["featured", "games"] }
)

/**
 * POST /api/featured
 * Admin sets/schedules a Game of the Day.
 * Body: { gameId: string, date: string (YYYY-MM-DD), note?: string }
 */
export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const body = await req.json()
    const { gameId, date, note } = body

    if (!gameId || !date) {
      return NextResponse.json({ error: "gameId and date are required" }, { status: 400 })
    }

    // Validate game exists and is published
    const game = await prisma.game.findUnique({
      where: { id: gameId },
      select: { id: true, status: true, title: true },
    })

    if (!game) {
      return NextResponse.json({ error: "Game not found" }, { status: 404 })
    }

    if (game.status !== "PUBLISHED") {
      return NextResponse.json({ error: "Only published games can be featured" }, { status: 400 })
    }

    // Parse date as UTC midnight
    const featuredDate = new Date(date + "T00:00:00.000Z")
    if (isNaN(featuredDate.getTime())) {
      return NextResponse.json({ error: "Invalid date format. Use YYYY-MM-DD" }, { status: 400 })
    }

    // Upsert — if a pick already exists for this date, replace it
    const featured = await prisma.featuredGame.upsert({
      where: { date: featuredDate },
      create: {
        date: featuredDate,
        gameId,
        note: note || null,
        createdById: session.user.id,
      },
      update: {
        gameId,
        note: note || null,
        createdById: session.user.id,
      },
      include: {
        game: { select: { id: true, title: true, slug: true, thumbnail: true } },
      },
    })

    revalidateTag("featured", "max")

    return NextResponse.json({ success: true, featured })
  } catch (error) {
    logServerError("Failed to set featured game", error, {
      route: "/api/featured",
      method: "POST",
      userId: session.user.id,
    })
    return NextResponse.json({ error: "Failed to set featured game" }, { status: 500 })
  }
}
