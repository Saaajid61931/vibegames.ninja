import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "20")
    const category = searchParams.get("category")
    const sort = searchParams.get("sort") || "trending"
    const search = searchParams.get("q")

    const skip = (page - 1) * limit

    // Build where clause
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

    // Build order by
    let orderBy: Record<string, string> = {}
    switch (sort) {
      case "trending":
        orderBy = { plays: "desc" }
        break
      case "new":
        orderBy = { createdAt: "desc" }
        break
      case "popular":
        orderBy = { likes: "desc" }
        break
      case "top":
        orderBy = { avgRating: "desc" }
        break
      default:
        orderBy = { plays: "desc" }
    }

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

    return NextResponse.json({
      data: games,
      total,
      page,
      limit,
      hasMore: skip + games.length < total,
    })
  } catch (error) {
    console.error("Error fetching games:", error)
    return NextResponse.json(
      { error: "Failed to fetch games" },
      { status: 500 }
    )
  }
}
