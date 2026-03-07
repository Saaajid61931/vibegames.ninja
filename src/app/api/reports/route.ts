import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import prisma from "@/lib/prisma"
import { reportSchema } from "@/lib/validations"

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    const body = await request.json().catch(() => null)
    const parsed = reportSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Invalid report payload" },
        { status: 400 }
      )
    }

    const { gameId, reason, description } = parsed.data

    const game = await prisma.game.findUnique({
      where: { id: gameId },
      select: { id: true, status: true, title: true },
    })

    if (!game || game.status !== "PUBLISHED") {
      return NextResponse.json({ error: "GAME_NOT_FOUND" }, { status: 404 })
    }

    if (session?.user?.id) {
      const existing = await prisma.report.findFirst({
        where: {
          gameId,
          reporterId: session.user.id,
          reason,
          status: { in: ["PENDING", "REVIEWING"] },
        },
        select: { id: true },
      })

      if (existing) {
        return NextResponse.json({ error: "You already submitted this report" }, { status: 409 })
      }
    }

    const report = await prisma.report.create({
      data: {
        gameId,
        reporterId: session?.user?.id ?? null,
        reason,
        description: description?.trim() || null,
      },
      select: { id: true },
    })

    return NextResponse.json({
      message: `Thanks for reporting ${game.title}. We'll review it shortly.`,
      reportId: report.id,
    })
  } catch (error) {
    console.error("Create report error:", error)
    return NextResponse.json({ error: "Failed to submit report" }, { status: 500 })
  }
}
