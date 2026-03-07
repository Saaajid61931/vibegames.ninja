import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"

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

function startOfUtcDay(date: Date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()))
}

function nextUtcDay(date: Date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate() + 1))
}

function utcDayKey(date: Date) {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}-${String(date.getUTCDate()).padStart(2, "0")}`
}

function secondsUntilNextUtcDay(date: Date) {
  return Math.max(60, Math.ceil((nextUtcDay(date).getTime() - date.getTime()) / 1000))
}

async function updateDailyGameAnalytics(gameId: string, plays: number, uniquePlayers: number, date: Date) {
  if (plays === 0 && uniquePlayers === 0) {
    return
  }

  const dayStart = startOfUtcDay(date)
  const dayEnd = nextUtcDay(date)

  const existing = await prisma.gameAnalytics.findFirst({
    where: {
      gameId,
      date: {
        gte: dayStart,
        lt: dayEnd,
      },
    },
    select: {
      id: true,
    },
  })

  if (existing) {
    await prisma.gameAnalytics.update({
      where: { id: existing.id },
      data: {
        plays: { increment: plays },
        uniquePlayers: { increment: uniquePlayers },
      },
      select: { id: true },
    })
    return
  }

  await prisma.gameAnalytics.create({
    data: {
      gameId,
      date: dayStart,
      plays,
      uniquePlayers,
    },
    select: { id: true },
  })
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
        updateDailyGameAnalytics(
          gameId,
          shouldIncrementGame ? 1 : 0,
          shouldIncrementUniquePlayer ? 1 : 0,
          now
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
    console.error("Track game play error:", error)
    return NextResponse.json({ error: "Failed to track play" }, { status: 500 })
  }
}
