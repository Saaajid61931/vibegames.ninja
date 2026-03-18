import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { secondsUntilNextUtcDay, utcDayKey, upsertDailyGameAnalytics } from "@/lib/game-analytics"
import { logServerError } from "@/lib/server-log"

const PLAY_COOLDOWN_SECONDS = 30 * 60

function gamePlayCookieName(gameId: string) {
  return `vg_play_game_${gameId}`
}

function dailyGamePlayerCookieName(gameId: string, dayKey: string) {
  return `vg_daily_game_${gameId}_${dayKey}`
}

function levelPlayCookieName(levelId: string) {
  return `vg_play_level_${levelId}`
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: gameId } = await params
    const { searchParams } = new URL(request.url)
    const levelId = searchParams.get("levelId")
    const now = new Date()
    const dayKey = utcDayKey(now)

    const game = await prisma.game.findUnique({
      where: { id: gameId },
      select: { id: true, status: true },
    })

    if (!game || game.status !== "PUBLISHED") {
      return NextResponse.json({ error: "Game not found" }, { status: 404 })
    }

    const shouldIncrementGame = !request.cookies.get(gamePlayCookieName(gameId))
    const shouldIncrementUniquePlayer = !request.cookies.get(dailyGamePlayerCookieName(gameId, dayKey))

    let validLevelId: string | null = null
    let shouldIncrementLevel = false

    if (levelId) {
      const level = await prisma.level.findFirst({
        where: {
          id: levelId,
          gameId,
          status: "PUBLISHED",
        },
        select: { id: true },
      })

      if (!level) {
        return NextResponse.json({ error: "Level not found" }, { status: 404 })
      }

      validLevelId = level.id
      shouldIncrementLevel = !request.cookies.get(levelPlayCookieName(level.id))
    }

    const updates: Promise<unknown>[] = []

    if (shouldIncrementGame) {
      updates.push(
        prisma.game.update({
          where: { id: gameId },
          data: { plays: { increment: 1 } },
          select: { id: true },
        })
      )
    }

    if (shouldIncrementGame || shouldIncrementUniquePlayer) {
      updates.push(
        upsertDailyGameAnalytics(
          prisma,
          gameId,
          now,
          {
            plays: shouldIncrementGame ? 1 : 0,
            uniquePlayers: shouldIncrementUniquePlayer ? 1 : 0,
          },
          {
            plays: { increment: shouldIncrementGame ? 1 : 0 },
            uniquePlayers: { increment: shouldIncrementUniquePlayer ? 1 : 0 },
          }
        )
      )
    }

    if (validLevelId && shouldIncrementLevel) {
      updates.push(
        prisma.level.update({
          where: { id: validLevelId },
          data: { plays: { increment: 1 } },
          select: { id: true },
        })
      )
    }

    if (updates.length > 0) {
      await Promise.all(updates)
    }

    const response = NextResponse.json({
      tracked: true,
      gameIncremented: shouldIncrementGame,
      uniquePlayerIncremented: shouldIncrementUniquePlayer,
      levelIncremented: Boolean(validLevelId && shouldIncrementLevel),
      cooldownSeconds: PLAY_COOLDOWN_SECONDS,
    })

    if (shouldIncrementGame) {
      response.cookies.set({
        name: gamePlayCookieName(gameId),
        value: "1",
        maxAge: PLAY_COOLDOWN_SECONDS,
        path: "/",
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
      })
    }

    if (validLevelId && shouldIncrementLevel) {
      response.cookies.set({
        name: levelPlayCookieName(validLevelId),
        value: "1",
        maxAge: PLAY_COOLDOWN_SECONDS,
        path: "/",
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
      })
    }

    if (shouldIncrementUniquePlayer) {
      response.cookies.set({
        name: dailyGamePlayerCookieName(gameId, dayKey),
        value: "1",
        maxAge: secondsUntilNextUtcDay(now),
        path: "/",
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
      })
    }

    return response
  } catch (error) {
    logServerError("Track game play error", error, {
      route: "/api/games/[id]/play",
      method: "POST",
    })
    return NextResponse.json({ error: "Failed to track play" }, { status: 500 })
  }
}
