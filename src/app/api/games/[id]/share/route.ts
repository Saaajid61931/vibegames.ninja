import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"

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
    console.error("Track game share error:", error)
    return NextResponse.json({ error: "Failed to track share" }, { status: 500 })
  }
}
