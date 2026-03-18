import { NextRequest, NextResponse } from "next/server"
import { Prisma } from "@prisma/client"
import { auth } from "@/lib/auth"
import {
  buildGhostLeaderboard,
  DEFAULT_GHOST_LEADERBOARD_LIMIT,
  MAX_GHOST_LEADERBOARD_FETCH,
  MAX_GHOST_LEADERBOARD_LIMIT,
} from "@/lib/ghosts"
import prisma from "@/lib/prisma"
import { createRateLimitResponse, enforceRateLimit, RATE_LIMIT_POLICIES } from "@/lib/rate-limit"
import { logServerError } from "@/lib/server-log"
import { ghostRunSchema } from "@/lib/validations"

async function getPublishedLevelForGame(gameId: string, levelId: string) {
  return prisma.level.findFirst({
    where: {
      id: levelId,
      gameId,
      status: "PUBLISHED",
    },
    select: {
      id: true,
      name: true,
    },
  })
}

async function getGhostLeaderboardData(params: {
  gameId: string
  levelId?: string
  limit: number
  userId?: string
}) {
  const scopeWhere = params.levelId
    ? { gameId: params.gameId, levelId: params.levelId }
    : { gameId: params.gameId, levelId: null }

  const [runs, personalBest] = await Promise.all([
    prisma.ghostRun.findMany({
      where: scopeWhere,
      orderBy: [{ durationMs: "asc" }, { createdAt: "asc" }],
      take: MAX_GHOST_LEADERBOARD_FETCH,
      select: {
        id: true,
        levelId: true,
        userId: true,
        durationMs: true,
        replayVersion: true,
        checksum: true,
        createdAt: true,
        user: {
          select: {
            id: true,
            name: true,
            username: true,
            image: true,
          },
        },
      },
    }),
    params.userId
      ? prisma.ghostRun.findFirst({
          where: {
            ...scopeWhere,
            userId: params.userId,
          },
          orderBy: [{ durationMs: "asc" }, { createdAt: "asc" }],
          select: {
            id: true,
            durationMs: true,
            createdAt: true,
            replayVersion: true,
            checksum: true,
          },
        })
      : Promise.resolve(null),
  ])

  return {
    leaderboard: buildGhostLeaderboard(runs, params.limit),
    personalBest,
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    const { id } = await params
    const { searchParams } = new URL(request.url)
    const levelId = searchParams.get("levelId")?.trim() || undefined
    const rawLimit = Number.parseInt(searchParams.get("limit") || `${DEFAULT_GHOST_LEADERBOARD_LIMIT}`, 10)
    const limit = Number.isFinite(rawLimit) && rawLimit > 0
      ? Math.min(rawLimit, MAX_GHOST_LEADERBOARD_LIMIT)
      : DEFAULT_GHOST_LEADERBOARD_LIMIT

    const game = await prisma.game.findUnique({
      where: { id },
      select: {
        id: true,
        status: true,
        hasGhostSharing: true,
      },
    })

    if (!game || game.status !== "PUBLISHED") {
      return NextResponse.json({ error: "Game not found" }, { status: 404 })
    }

    if (!game.hasGhostSharing) {
      return NextResponse.json({
        scope: { type: levelId ? "level" : "game", levelId: levelId || null },
        leaderboard: [],
        personalBest: null,
      })
    }

    const level = levelId ? await getPublishedLevelForGame(id, levelId) : null
    if (levelId && !level) {
      return NextResponse.json({ error: "Level not found for this game" }, { status: 404 })
    }

    const data = await getGhostLeaderboardData({
      gameId: id,
      levelId,
      limit,
      userId: session?.user?.id,
    })

    return NextResponse.json({
      scope: {
        type: levelId ? "level" : "game",
        levelId: levelId || null,
        levelName: level?.name || null,
      },
      leaderboard: data.leaderboard,
      personalBest: data.personalBest,
    })
  } catch (error) {
    logServerError("Get ghosts error", error, {
      route: "/api/games/[id]/ghosts",
      method: "GET",
    })
    return NextResponse.json({ error: "Failed to fetch ghost leaderboard" }, { status: 500 })
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

    const rateLimit = enforceRateLimit({
      request,
      userId: session.user.id,
      policy: RATE_LIMIT_POLICIES.ghostUpload,
      keyPrefix: "api-ghost-upload",
    })

    if (!rateLimit.allowed) {
      return createRateLimitResponse(rateLimit, "You are saving ghost runs too quickly. Please wait before uploading another replay.")
    }

    const { id } = await params
    const game = await prisma.game.findUnique({
      where: { id },
      select: {
        id: true,
        status: true,
        hasGhostSharing: true,
      },
    })

    if (!game || game.status !== "PUBLISHED") {
      return NextResponse.json({ error: "Game not found" }, { status: 404 })
    }

    if (!game.hasGhostSharing) {
      return NextResponse.json({ error: "This game does not support ghost sharing" }, { status: 400 })
    }

    const body = await request.json()
    const parsed = ghostRunSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message || "Invalid ghost run payload" }, { status: 400 })
    }

    const level = parsed.data.levelId
      ? await getPublishedLevelForGame(id, parsed.data.levelId)
      : null

    if (parsed.data.levelId && !level) {
      return NextResponse.json({ error: "Level not found for this game" }, { status: 404 })
    }

    const createdRun = await prisma.ghostRun.create({
      data: {
        gameId: id,
        levelId: parsed.data.levelId || null,
        userId: session.user.id,
        durationMs: parsed.data.durationMs,
        replayData: parsed.data.replayData as Prisma.InputJsonValue,
        replayVersion: parsed.data.replayVersion?.trim() || null,
        checksum: parsed.data.checksum?.trim() || null,
      },
      select: {
        id: true,
        durationMs: true,
        createdAt: true,
      },
    })

    const data = await getGhostLeaderboardData({
      gameId: id,
      levelId: parsed.data.levelId,
      limit: DEFAULT_GHOST_LEADERBOARD_LIMIT,
      userId: session.user.id,
    })

    return NextResponse.json({
      run: createdRun,
      scope: {
        type: parsed.data.levelId ? "level" : "game",
        levelId: parsed.data.levelId || null,
        levelName: level?.name || null,
      },
      leaderboard: data.leaderboard,
      personalBest: data.personalBest,
    }, { status: 201 })
  } catch (error) {
    logServerError("Create ghost run error", error, {
      route: "/api/games/[id]/ghosts",
      method: "POST",
    })
    return NextResponse.json({ error: "Failed to save ghost run" }, { status: 500 })
  }
}
