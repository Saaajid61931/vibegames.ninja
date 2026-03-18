import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { createRateLimitResponse, enforceRateLimit, RATE_LIMIT_POLICIES } from "@/lib/rate-limit"
import { logServerError } from "@/lib/server-log"

const SHARE_COOLDOWN_SECONDS = 10 * 60

function shareCookieName(gameId: string) {
  return `vg_share_game_${gameId}`
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: gameId } = await params
    const rateLimit = enforceRateLimit({
      request,
      policy: RATE_LIMIT_POLICIES.shares,
      keyPrefix: "api-game-share",
    })

    if (!rateLimit.allowed) {
      return createRateLimitResponse(rateLimit, "You are sharing too quickly. Please wait before sending another share signal.")
    }

    const game = await prisma.game.findUnique({
      where: { id: gameId },
      select: { id: true, status: true },
    })

    if (!game || game.status !== "PUBLISHED") {
      return NextResponse.json({ error: "Game not found" }, { status: 404 })
    }

    const shouldIncrement = !request.cookies.get(shareCookieName(gameId))

    if (shouldIncrement) {
      await prisma.game.update({
        where: { id: gameId },
        data: { shares: { increment: 1 } },
        select: { id: true },
      })
    }

    const response = NextResponse.json({ tracked: shouldIncrement })

    if (shouldIncrement) {
      response.cookies.set({
        name: shareCookieName(gameId),
        value: "1",
        maxAge: SHARE_COOLDOWN_SECONDS,
        path: "/",
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
      })
    }

    return response
  } catch (error) {
    logServerError("Track game share error", error, {
      route: "/api/games/[id]/share",
      method: "POST",
    })
    return NextResponse.json({ error: "Failed to track share" }, { status: 500 })
  }
}
