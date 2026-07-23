import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import prisma from "@/lib/prisma"
import { runAgenticPlaytest } from "@/lib/playtest-agent"
import { logServerError } from "@/lib/server-log"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const gameId = searchParams.get("gameId")
    const capsuleId = searchParams.get("capsuleId")

    if (!gameId && !capsuleId) {
      return NextResponse.json({ error: "Missing gameId or capsuleId" }, { status: 400 })
    }

    let report = null

    if (capsuleId) {
      report = await prisma.playtestReport.findUnique({
        where: { capsuleId },
        include: { capsule: { select: { version: true, slug: true } } },
      })
    } else if (gameId) {
      const latestCapsule = await prisma.gameCapsule.findFirst({
        where: { gameId },
        orderBy: { createdAt: "desc" },
        include: { playtestReport: true },
      })
      report = latestCapsule?.playtestReport ?? null
    }

    if (!report && gameId) {
      // Run automatic initial playtest on demand
      report = await runAgenticPlaytest(gameId, capsuleId || undefined)
    }

    return NextResponse.json({ report })
  } catch (error) {
    logServerError("Playtest API GET failed", error, { route: "/api/playtest" })
    return NextResponse.json({ error: "Failed to fetch playtest report" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }

    const body = await request.json()
    const { gameId, capsuleId } = body

    if (!gameId) {
      return NextResponse.json({ error: "gameId is required" }, { status: 400 })
    }

    const report = await runAgenticPlaytest(gameId, capsuleId)
    return NextResponse.json({ report, success: true })
  } catch (error) {
    logServerError("Playtest API POST failed", error, { route: "/api/playtest" })
    return NextResponse.json({ error: "Failed to run agentic playtest" }, { status: 500 })
  }
}
