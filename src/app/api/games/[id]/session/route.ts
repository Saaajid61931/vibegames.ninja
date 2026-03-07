import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"

function startOfUtcDay(date: Date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()))
}

function nextUtcDay(date: Date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate() + 1))
}

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
    const dayStart = startOfUtcDay(now)
    const dayEnd = nextUtcDay(now)
    const bounceValue = sessionMinutes <= 0.25 ? 100 : 0

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
        plays: true,
        avgSessionTime: true,
        bounceRate: true,
      },
    })

    if (existing) {
      const sampleCount = Math.max(existing.plays, 1)
      const nextAvgSessionTime =
        (existing.avgSessionTime * Math.max(sampleCount - 1, 0) + sessionMinutes) / sampleCount
      const nextBounceRate =
        (existing.bounceRate * Math.max(sampleCount - 1, 0) + bounceValue) / sampleCount

      await prisma.gameAnalytics.update({
        where: { id: existing.id },
        data: {
          avgSessionTime: nextAvgSessionTime,
          bounceRate: nextBounceRate,
        },
        select: { id: true },
      })
    } else {
      await prisma.gameAnalytics.create({
        data: {
          gameId,
          date: dayStart,
          plays: 0,
          uniquePlayers: 0,
          avgSessionTime: sessionMinutes,
          bounceRate: bounceValue,
        },
        select: { id: true },
      })
    }

    return NextResponse.json({ tracked: true })
  } catch (error) {
    console.error("Track game session error:", error)
    return NextResponse.json({ error: "Failed to track session" }, { status: 500 })
  }
}
