import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { logServerError } from "@/lib/server-log"

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ runId: string }> }
) {
  try {
    const { runId } = await params
    const run = await prisma.ghostRun.findUnique({
      where: { id: runId },
      select: {
        id: true,
        durationMs: true,
        replayData: true,
        replayVersion: true,
        checksum: true,
        createdAt: true,
        game: {
          select: {
            id: true,
            slug: true,
            title: true,
            status: true,
            hasGhostSharing: true,
          },
        },
        level: {
          select: {
            id: true,
            name: true,
            status: true,
          },
        },
        user: {
          select: {
            id: true,
            name: true,
            username: true,
            image: true,
          },
        },
      },
    })

    if (!run || run.game.status !== "PUBLISHED" || !run.game.hasGhostSharing) {
      return NextResponse.json({ error: "Ghost run not found" }, { status: 404 })
    }

    if (run.level && run.level.status !== "PUBLISHED") {
      return NextResponse.json({ error: "Ghost run level is no longer available" }, { status: 404 })
    }

    return NextResponse.json({
      ghost: {
        id: run.id,
        durationMs: run.durationMs,
        replayData: run.replayData,
        replayVersion: run.replayVersion,
        checksum: run.checksum,
        createdAt: run.createdAt,
        game: run.game,
        level: run.level,
        player: run.user,
      },
    })
  } catch (error) {
    logServerError("Get ghost run error", error, {
      route: "/api/ghosts/[runId]",
      method: "GET",
    })
    return NextResponse.json({ error: "Failed to load ghost run" }, { status: 500 })
  }
}
