import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import {
  findDailyGameAnalytics,
  upsertDailyGameAnalytics,
} from "@/lib/game-analytics"
import { logServerError } from "@/lib/server-log"

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: gameId } = await params
    const body = await request.json().catch(() => null)
    const sessionMinutes = Number(body?.sessionMinutes)

    if (!Number.isFinite(sessionMinutes) || sessionMinutes <= 0 || sessionMinutes > 180) {
      return NextResponse.json({ error: "Invalid session length" }, { status: 400 })
    }

    const game = await prisma.game.findUnique({
      where: { id: gameId },
      select: { id: true, status: true },
    })

    if (!game || game.status !== "PUBLISHED") {
      return NextResponse.json({ error: "Game not found" }, { status: 404 })
    }

    const now = new Date()
    const bounceValue = sessionMinutes <= 0.25 ? 100 : 0
    const existing = await findDailyGameAnalytics(prisma, gameId, now)

    if (existing) {
      const sampleCount = Math.max(existing.plays, 1)
      const nextAvgSessionTime =
        (existing.avgSessionTime * Math.max(sampleCount - 1, 0) + sessionMinutes) / sampleCount
      const nextBounceRate =
        (existing.bounceRate * Math.max(sampleCount - 1, 0) + bounceValue) / sampleCount

      await upsertDailyGameAnalytics(
        prisma,
        gameId,
        now,
        {
          plays: 0,
          uniquePlayers: 0,
          avgSessionTime: sessionMinutes,
          bounceRate: bounceValue,
        },
        {
          avgSessionTime: nextAvgSessionTime,
          bounceRate: nextBounceRate,
        }
      )
    } else {
      await upsertDailyGameAnalytics(
        prisma,
        gameId,
        now,
        {
          plays: 0,
          uniquePlayers: 0,
          avgSessionTime: sessionMinutes,
          bounceRate: bounceValue,
        },
        {
          avgSessionTime: sessionMinutes,
          bounceRate: bounceValue,
        }
      )
    }

    return NextResponse.json({ tracked: true })
  } catch (error) {
    logServerError("Track game session error", error, {
      route: "/api/games/[id]/session",
      method: "POST",
    })
    return NextResponse.json({ error: "Failed to track session" }, { status: 500 })
  }
}
