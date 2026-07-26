import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { auth } from "@/lib/auth"
import prisma from "@/lib/prisma"
import { logServerError } from "@/lib/server-log"

const feedbackStatusSchema = z.object({
  status: z.enum(["PENDING", "REVIEWING", "RESOLVED", "DISMISSED"]),
})

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 })
    }

    const { id } = await params
    const parsed = feedbackStatusSchema.safeParse(
      await request.json().catch(() => null)
    )

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid feedback status" },
        { status: 400 }
      )
    }

    const existing = await prisma.report.findFirst({
      where: {
        id,
        reason: { in: ["BUG", "IDEA"] },
        game: {
          creatorId: session.user.id,
        },
      },
      select: {
        id: true,
        status: true,
        reason: true,
        reporterId: true,
        game: {
          select: {
            slug: true,
            title: true,
          },
        },
      },
    })

    if (!existing) {
      return NextResponse.json(
        { error: "FEEDBACK_NOT_FOUND" },
        { status: 404 }
      )
    }

    const isClosed = ["RESOLVED", "DISMISSED"].includes(parsed.data.status)
    const feedback = await prisma.report.update({
      where: { id },
      data: {
        status: parsed.data.status,
        resolvedAt: isClosed ? new Date() : null,
        resolvedBy: isClosed ? session.user.id : null,
      },
      select: {
        id: true,
        status: true,
        resolvedAt: true,
      },
    })

    if (
      parsed.data.status === "RESOLVED" &&
      existing.status !== "RESOLVED" &&
      existing.reporterId &&
      existing.reporterId !== session.user.id
    ) {
      await prisma.notification.create({
        data: {
          userId: existing.reporterId,
          title: "Bug marked fixed",
          message: `The creator marked your report for ${existing.game.title} as fixed.`,
          type: "GAME_FEEDBACK_UPDATE",
          link: `/play/${existing.game.slug}`,
        },
      })
    }

    return NextResponse.json({
      feedback: {
        ...feedback,
        resolvedAt: feedback.resolvedAt?.toISOString() || null,
      },
    })
  } catch (error) {
    logServerError("Update creator feedback error", error, {
      route: "/api/creator/feedback/[id]",
      method: "PATCH",
    })
    return NextResponse.json({ error: "SYSTEM_ERROR" }, { status: 500 })
  }
}
