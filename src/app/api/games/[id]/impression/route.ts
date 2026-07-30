import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { upsertDailyGameAnalytics } from "@/lib/game-analytics"
import { logServerError } from "@/lib/server-log"

const IMPRESSION_COOLDOWN_SECONDS = 30 * 60

function impressionCookieName(gameId: string) {
  return `vg_impression_game_${gameId}`
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: gameId } = await params
    const game = await prisma.game.findUnique({
      where: { id: gameId },
      select: { id: true, status: true },
    })

    if (!game || game.status !== "PUBLISHED") {
      return NextResponse.json({ error: "Game not found" }, { status: 404 })
    }

    const shouldIncrement = !request.cookies.get(impressionCookieName(gameId))
    let analyticsTracked = true

    if (shouldIncrement) {
      await prisma.game.update({
        where: { id: gameId },
        data: { impressions: { increment: 1 } },
        select: { id: true },
      })

      try {
        await upsertDailyGameAnalytics(
          prisma,
          gameId,
          new Date(),
          { impressions: 1 },
          { impressions: { increment: 1 } }
        )
      } catch (analyticsError) {
        analyticsTracked = false
        logServerError("Track game impression analytics error", analyticsError, {
          route: "/api/games/[id]/impression",
          method: "POST",
          gameId,
        })
      }
    }

    const response = NextResponse.json({
      tracked: true,
      incremented: shouldIncrement,
      analyticsTracked,
      cooldownSeconds: IMPRESSION_COOLDOWN_SECONDS,
    })

    if (shouldIncrement) {
      response.cookies.set({
        name: impressionCookieName(gameId),
        value: "1",
        maxAge: IMPRESSION_COOLDOWN_SECONDS,
        path: "/",
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
      })
    }

    return response
  } catch (error) {
    logServerError("Track game impression error", error, {
      route: "/api/games/[id]/impression",
      method: "POST",
    })
    return NextResponse.json(
      { error: "Failed to track impression" },
      { status: 500 }
    )
  }
}
