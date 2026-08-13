import { NextRequest, NextResponse } from "next/server"
import { unstable_cache } from "next/cache"
import prisma from "@/lib/prisma"
import { DiscoverySort, getDiscoveryOrderBy } from "@/lib/discovery"
import {
  normalizeDiscoveryFilters,
  normalizeDiscoveryPage,
  normalizeDiscoveryPageSize,
} from "@/lib/discovery-query"
import { pickPrimaryJam, toPrimaryJamBadge } from "@/lib/jams"
import { logServerError } from "@/lib/server-log"

async function queryGames(
    page: number,
    limit: number,
    category: string | null,
    sort: DiscoverySort,
    search: string | null,
    supportsMobile: boolean | null,
    hasLevelEditor: boolean | null
  ) {
    const skip = (page - 1) * limit

    const where: Record<string, unknown> = {
      status: "PUBLISHED",
    }

    if (category && category !== "all") {
      where.category = category.toUpperCase()
    }

    if (supportsMobile) {
      where.supportsMobile = true
    }

    if (hasLevelEditor) {
      where.hasLevelEditor = true
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
        { tags: { contains: search, mode: "insensitive" } },
      ]
    }

    const orderBy = getDiscoveryOrderBy(sort)

    const [games, total] = await Promise.all([
      prisma.game.findMany({
        where,
        select: {
          id: true,
          slug: true,
          title: true,
          description: true,
          gameUrl: true,
          thumbnail: true,
          thumbnailSlides: true,
          category: true,
          plays: true,
          likes: true,
          createdAt: true,
          publishedAt: true,
          supportsMobile: true,
          mobileOrientation: true,
          hasLevelEditor: true,
          seekingFeedback: true,
          latestUpdateNote: true,
          aiTool: true,
          aiModel: true,
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
        },
        orderBy,
        skip,
        take: limit,
      }),
      prisma.game.count({ where }),
    ])

    return {
      data: games.map((game) => ({
        ...game,
        primaryJam: toPrimaryJamBadge(pickPrimaryJam(game.jamEntries)),
      })),
      total,
      page,
      limit,
      hasMore: skip + games.length < total,
    }
  }

const getCachedGames = unstable_cache(
  queryGames,
  ["api-games-list"],
  { revalidate: 30, tags: ["games"] }
)

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = normalizeDiscoveryPage(searchParams.get("page"))
    const limit = normalizeDiscoveryPageSize(searchParams.get("limit"))
    const filters = normalizeDiscoveryFilters({
      category: searchParams.get("category"),
      sort: searchParams.get("sort"),
      search: searchParams.get("q"),
      mobile: searchParams.get("mobile"),
      editor: searchParams.get("editor"),
    })
    const category = filters.category === "all" ? null : filters.category
    const search = filters.search || null
    const query = search ? queryGames : getCachedGames
    const response = await query(
      page,
      limit,
      category,
      filters.sort as DiscoverySort,
      search,
      filters.supportsMobile,
      filters.hasLevelEditor
    )

    return NextResponse.json(response, {
      headers: {
        "Cache-Control": search
          ? "no-store"
          : "public, s-maxage=30, stale-while-revalidate=120",
      },
    })
  } catch (error) {
    logServerError("Error fetching games", error, {
      route: "/api/games",
      method: "GET",
    })
    return NextResponse.json(
      { error: "Failed to fetch games" },
      { status: 500 }
    )
  }
}
