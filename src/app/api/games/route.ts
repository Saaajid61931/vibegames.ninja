import { NextRequest, NextResponse } from "next/server"
import { unstable_cache } from "next/cache"
import prisma from "@/lib/prisma"
import { DiscoverySort, getDiscoveryOrderBy } from "@/lib/discovery"

const getCachedGames = unstable_cache(
  async (page: number, limit: number, category: string | null, sort: DiscoverySort, search: string | null) => {
    const skip = (page - 1) * limit

    const where: Record<string, unknown> = {
      status: "PUBLISHED",
    }

    if (category && category !== "all") {
      where.category = category.toUpperCase()
    }

    if (search) {
      where.OR = [
        { title: { contains: search } },
        { description: { contains: search } },
        { tags: { contains: search } },
      ]
    }

    const orderBy = getDiscoveryOrderBy(sort)

    const [games, total] = await Promise.all([
      prisma.game.findMany({
        where,
        include: {
          creator: {
            select: { id: true, name: true, username: true, image: true },
          },
        },
        orderBy,
        skip,
        take: limit,
      }),
      prisma.game.count({ where }),
    ])

    return {
      data: games,
      total,
      page,
      limit,
      hasMore: skip + games.length < total,
    }
  },
  ["api-games-list"],
  { revalidate: 30, tags: ["games"] }
)

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const rawPage = Number.parseInt(searchParams.get("page") || "1", 10)
    const rawLimit = Number.parseInt(searchParams.get("limit") || "20", 10)
    const page = Number.isFinite(rawPage) && rawPage > 0 ? rawPage : 1
    const limit = Number.isFinite(rawLimit) && rawLimit > 0 ? Math.min(rawLimit, 50) : 20
    const category = searchParams.get("category")
    const sortParam = searchParams.get("sort") || "trending"
    const sort: DiscoverySort = ["trending", "new", "popular", "top"].includes(sortParam)
      ? (sortParam as DiscoverySort)
      : "trending"
    const search = searchParams.get("q")

    const response = await getCachedGames(page, limit, category, sort, search)

    return NextResponse.json(response, {
      headers: {
        "Cache-Control": "public, s-maxage=30, stale-while-revalidate=120",
      },
    })
  } catch (error) {
    console.error("Error fetching games:", error)
    return NextResponse.json(
      { error: "Failed to fetch games" },
      { status: 500 }
    )
  }
}
