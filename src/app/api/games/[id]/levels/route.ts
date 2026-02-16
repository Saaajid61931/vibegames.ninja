import { NextRequest, NextResponse } from "next/server"
import { Prisma } from "@prisma/client"
import { auth } from "@/lib/auth"
import prisma from "@/lib/prisma"
import { levelInputSchema } from "@/lib/validations"

const MAX_LEVEL_DATA_BYTES = 5 * 1024 * 1024

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { searchParams } = new URL(request.url)
    const rawPage = Number.parseInt(searchParams.get("page") || "1", 10)
    const rawLimit = Number.parseInt(searchParams.get("limit") || "20", 10)
    const page = Number.isFinite(rawPage) && rawPage > 0 ? rawPage : 1
    const limit = Number.isFinite(rawLimit) && rawLimit > 0 ? Math.min(rawLimit, 50) : 20
    const sort = searchParams.get("sort") || "new"
    const skip = (page - 1) * limit

    const game = await prisma.game.findUnique({
      where: { id },
      select: { id: true, status: true, hasLevelEditor: true },
    })

    if (!game || game.status !== "PUBLISHED") {
      return NextResponse.json({ error: "Game not found" }, { status: 404 })
    }

    if (!game.hasLevelEditor) {
      return NextResponse.json({ data: [], total: 0, page, limit, hasMore: false })
    }

    const orderBy =
      sort === "top"
        ? [{ avgRating: "desc" as const }, { ratingCount: "desc" as const }, { createdAt: "desc" as const }]
        : sort === "plays"
          ? [{ plays: "desc" as const }, { createdAt: "desc" as const }]
          : [{ createdAt: "desc" as const }]

    const [levels, total] = await Promise.all([
      prisma.level.findMany({
        where: {
          gameId: id,
          status: "PUBLISHED",
        },
        select: {
          id: true,
          name: true,
          description: true,
          thumbnail: true,
          plays: true,
          avgRating: true,
          ratingCount: true,
          createdAt: true,
          updatedAt: true,
          creator: {
            select: { id: true, name: true, username: true, image: true },
          },
        },
        orderBy,
        skip,
        take: limit,
      }),
      prisma.level.count({ where: { gameId: id, status: "PUBLISHED" } }),
    ])

    return NextResponse.json({
      data: levels,
      total,
      page,
      limit,
      hasMore: skip + levels.length < total,
    })
  } catch (error) {
    console.error("List levels error:", error)
    return NextResponse.json({ error: "Failed to fetch levels" }, { status: 500 })
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params
    const game = await prisma.game.findUnique({
      where: { id },
      select: { id: true, status: true, hasLevelEditor: true },
    })

    if (!game || game.status !== "PUBLISHED") {
      return NextResponse.json({ error: "Game not found" }, { status: 404 })
    }

    if (!game.hasLevelEditor) {
      return NextResponse.json({ error: "This game does not support community levels" }, { status: 400 })
    }

    const body = await request.json()
    const parsed = levelInputSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message || "Invalid level payload" }, { status: 400 })
    }

    const levelData = parsed.data.data as Prisma.InputJsonValue
    const dataSize = new TextEncoder().encode(JSON.stringify(levelData)).length
    if (dataSize > MAX_LEVEL_DATA_BYTES) {
      return NextResponse.json({ error: "Level data exceeds 5MB limit" }, { status: 400 })
    }

    const level = await prisma.level.create({
      data: {
        name: parsed.data.name,
        description: parsed.data.description?.trim() || null,
        data: levelData,
        thumbnail: parsed.data.thumbnail || null,
        gameId: id,
        creatorId: session.user.id,
        status: "PUBLISHED",
      },
      select: {
        id: true,
        name: true,
        description: true,
        thumbnail: true,
        createdAt: true,
      },
    })

    return NextResponse.json({ level }, { status: 201 })
  } catch (error) {
    console.error("Create level error:", error)
    return NextResponse.json({ error: "Failed to create level" }, { status: 500 })
  }
}
