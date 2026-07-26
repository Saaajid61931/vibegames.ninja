import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import prisma from "@/lib/prisma"
import {
  createRateLimitResponse,
  enforceRateLimit,
  RATE_LIMIT_POLICIES,
} from "@/lib/rate-limit"
import { logServerError } from "@/lib/server-log"
import { structuredFeedbackSchema } from "@/lib/validations"

const CREATOR_FEEDBACK_REASONS = ["BUG", "IDEA"] as const
const CONTEXT_SEPARATOR = "\n\n---\n"

function buildDescription(
  comment: string,
  context?: { userAgent?: string; viewport?: string }
) {
  const details = [
    context?.viewport ? `Screen: ${context.viewport}` : null,
    context?.userAgent ? `Browser: ${context.userAgent}` : null,
  ].filter(Boolean)

  return details.length > 0
    ? `${comment}${CONTEXT_SEPARATOR}${details.join("\n")}`
    : comment
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    const { id: gameId } = await params

    const latestFeedback = session?.user?.id
      ? await prisma.report.findFirst({
          where: {
            gameId,
            reporterId: session.user.id,
            reason: { in: [...CREATOR_FEEDBACK_REASONS] },
          },
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            reason: true,
            description: true,
            status: true,
            createdAt: true,
          },
        })
      : null

    return NextResponse.json({ latestFeedback })
  } catch (error) {
    logServerError("Get player feedback error", error, {
      route: "/api/games/[id]/feedback",
      method: "GET",
    })
    return NextResponse.json({ error: "SYSTEM_ERROR" }, { status: 500 })
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "AUTHENTICATION_REQUIRED" },
        { status: 401 }
      )
    }

    const rateLimit = enforceRateLimit({
      request,
      userId: session.user.id,
      policy: RATE_LIMIT_POLICIES.feedback,
      keyPrefix: "api-game-feedback",
    })

    if (!rateLimit.allowed) {
      return createRateLimitResponse(
        rateLimit,
        "You are sending feedback too quickly. Please wait a moment."
      )
    }

    const { id: gameId } = await params
    const parsed = structuredFeedbackSchema.safeParse(
      await request.json().catch(() => null)
    )

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Invalid feedback" },
        { status: 400 }
      )
    }

    const game = await prisma.game.findUnique({
      where: { id: gameId },
      select: {
        id: true,
        status: true,
        title: true,
        slug: true,
        creatorId: true,
      },
    })

    if (!game || game.status !== "PUBLISHED") {
      return NextResponse.json({ error: "GAME_NOT_FOUND" }, { status: 404 })
    }

    const feedback = await prisma.report.create({
      data: {
        gameId,
        reporterId: session.user.id,
        reason: parsed.data.kind,
        description: buildDescription(
          parsed.data.comment,
          parsed.data.context
        ),
      },
      select: {
        id: true,
        reason: true,
        status: true,
        createdAt: true,
      },
    })

    if (game.creatorId !== session.user.id) {
      const actor = session.user.username || session.user.name || "A player"
      const feedbackLabel =
        parsed.data.kind === "BUG" ? "bug report" : "game idea"

      await prisma.notification.create({
        data: {
          userId: game.creatorId,
          title:
            parsed.data.kind === "BUG"
              ? "New bug report"
              : "New game idea",
          message: `${actor} sent a ${feedbackLabel} for ${game.title}.`,
          type: "GAME_FEEDBACK",
          link: "/creator#feedback-inbox",
        },
      })
    }

    return NextResponse.json({
      feedback,
      message:
        parsed.data.kind === "BUG"
          ? "Bug report sent to the creator."
          : "Idea sent to the creator.",
    })
  } catch (error) {
    logServerError("Create player feedback error", error, {
      route: "/api/games/[id]/feedback",
      method: "POST",
    })
    return NextResponse.json({ error: "SYSTEM_ERROR" }, { status: 500 })
  }
}
