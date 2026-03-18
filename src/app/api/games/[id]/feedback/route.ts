import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { summarizeFeedback } from "@/lib/creator-magnet"
import { buildStructuredFeedbackNotificationMessage, shouldNotifyStructuredFeedback } from "@/lib/structured-feedback-notification"
import prisma from "@/lib/prisma"
import { createRateLimitResponse, enforceRateLimit, RATE_LIMIT_POLICIES } from "@/lib/rate-limit"
import { logServerError } from "@/lib/server-log"
import { structuredFeedbackSchema } from "@/lib/validations"

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    const { id: gameId } = await params

    const game = await prisma.game.findUnique({
      where: { id: gameId },
      select: { id: true, status: true },
    })

    if (!game || game.status !== "PUBLISHED") {
      return NextResponse.json({ error: "GAME_NOT_FOUND" }, { status: 404 })
    }

    const [feedbackItems, userFeedback] = await Promise.all([
      prisma.gameFeedback.findMany({
        where: { gameId },
        orderBy: { createdAt: "desc" },
        take: 100,
        select: {
          fun: true,
          confusing: true,
          tooHard: true,
          buggy: true,
          comment: true,
          createdAt: true,
        },
      }),
      session?.user?.id
        ? prisma.gameFeedback.findUnique({
            where: {
              userId_gameId: {
                userId: session.user.id,
                gameId,
              },
            },
            select: {
              fun: true,
              confusing: true,
              tooHard: true,
              buggy: true,
              comment: true,
            },
          })
        : Promise.resolve(null),
    ])

    const summary = summarizeFeedback(feedbackItems)
    const recentComments = feedbackItems
      .filter((item) => item.comment)
      .slice(0, 3)
      .map((item) => ({
        comment: item.comment,
        createdAt: item.createdAt,
      }))

    return NextResponse.json({
      summary,
      recentComments,
      userFeedback,
    })
  } catch (error) {
    logServerError("Get structured feedback error", error, {
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
      return NextResponse.json({ error: "AUTHENTICATION_REQUIRED" }, { status: 401 })
    }

    const rateLimit = enforceRateLimit({
      request,
      userId: session.user.id,
      policy: RATE_LIMIT_POLICIES.feedback,
      keyPrefix: "api-game-feedback",
    })

    if (!rateLimit.allowed) {
      return createRateLimitResponse(rateLimit, "You are sending feedback too quickly. Please wait a moment and try again.")
    }

    const { id: gameId } = await params
    const body = await request.json().catch(() => null)
    const parsed = structuredFeedbackSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message || "Invalid feedback" }, { status: 400 })
    }

    const game = await prisma.game.findUnique({
      where: { id: gameId },
      select: { id: true, status: true, title: true, slug: true, creatorId: true },
    })

    if (!game || game.status !== "PUBLISHED") {
      return NextResponse.json({ error: "GAME_NOT_FOUND" }, { status: 404 })
    }

    const existingFeedback = await prisma.gameFeedback.findUnique({
      where: {
        userId_gameId: {
          userId: session.user.id,
          gameId,
        },
      },
      select: { id: true },
    })

    const feedback = await prisma.gameFeedback.upsert({
      where: {
        userId_gameId: {
          userId: session.user.id,
          gameId,
        },
      },
      update: {
        ...parsed.data,
        comment: parsed.data.comment || null,
      },
      create: {
        userId: session.user.id,
        gameId,
        ...parsed.data,
        comment: parsed.data.comment || null,
      },
      select: {
        fun: true,
        confusing: true,
        tooHard: true,
        buggy: true,
        comment: true,
      },
    })

    if (
      shouldNotifyStructuredFeedback({
        existingFeedback: Boolean(existingFeedback),
        creatorId: game.creatorId,
        actorId: session.user.id,
      })
    ) {
      const actor = session.user.username || session.user.name || "A player"
      const message = buildStructuredFeedbackNotificationMessage({
        gameTitle: game.title,
        actorLabel: actor,
        feedback,
      })

      await prisma.notification.create({
        data: {
          userId: game.creatorId,
          title: "New structured feedback",
          message,
          type: "GAME_FEEDBACK",
          link: `/play/${game.slug}`,
        },
      })
    }

    const summary = summarizeFeedback(
      await prisma.gameFeedback.findMany({
        where: { gameId },
        take: 100,
        select: {
          fun: true,
          confusing: true,
          tooHard: true,
          buggy: true,
        },
      })
    )

    return NextResponse.json({
      feedback,
      summary,
    })
  } catch (error) {
    logServerError("Create structured feedback error", error, {
      route: "/api/games/[id]/feedback",
      method: "POST",
    })
    return NextResponse.json({ error: "SYSTEM_ERROR" }, { status: 500 })
  }
}
