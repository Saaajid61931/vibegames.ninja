import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import prisma from "@/lib/prisma"
import { logServerError } from "@/lib/server-log"

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const rawPage = Number.parseInt(searchParams.get("page") || "1", 10)
    const rawLimit = Number.parseInt(searchParams.get("limit") || "20", 10)
    const page = Number.isFinite(rawPage) && rawPage > 0 ? rawPage : 1
    const limit = Number.isFinite(rawLimit) && rawLimit > 0 ? Math.min(rawLimit, 50) : 20
    const sort = searchParams.get("sort") || "new"
    const skip = (page - 1) * limit

    const orderBy =
      sort === "top"
        ? [{ avgRating: "desc" as const }, { ratingCount: "desc" as const }, { createdAt: "desc" as const }]
        : sort === "plays"
          ? [{ plays: "desc" as const }, { createdAt: "desc" as const }]
          : [{ createdAt: "desc" as const }]

    const [levels, total] = await Promise.all([
      prisma.level.findMany({
        where: {
          creatorId: session.user.id,
        },
        select: {
          id: true,
          name: true,
          description: true,
          thumbnail: true,
          status: true,
          plays: true,
          avgRating: true,
          ratingCount: true,
          createdAt: true,
          updatedAt: true,
          game: {
            select: {
              id: true,
              slug: true,
              title: true,
              thumbnail: true,
            },
          },
        },
        orderBy,
        skip,
        take: limit,
      }),
      prisma.level.count({ where: { creatorId: session.user.id } }),
    ])

    return NextResponse.json({
      data: levels,
      total,
      page,
      limit,
      hasMore: skip + levels.length < total,
    })
  } catch (error) {
    logServerError("List user levels error", error, {
      route: "/api/user/levels",
      method: "GET",
    })
    return NextResponse.json({ error: "Failed to fetch levels" }, { status: 500 })
  }
}
