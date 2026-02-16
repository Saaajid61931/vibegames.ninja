import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"

const PLAY_COOLDOWN_SECONDS = 30 * 60

function gamePlayCookieName(gameId: string) {
  return `vg_play_game_${gameId}`
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

    const game = await prisma.game.findUnique({
      where: { id: gameId },
      select: { id: true, status: true },
    })

    if (!game || game.status !== "PUBLISHED") {
      return NextResponse.json({ error: "Game not found" }, { status: 404 })
    }

    const shouldIncrementGame = !request.cookies.get(gamePlayCookieName(gameId))

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

    return response
  } catch (error) {
    console.error("Track game play error:", error)
    return NextResponse.json({ error: "Failed to track play" }, { status: 500 })
  }
}
