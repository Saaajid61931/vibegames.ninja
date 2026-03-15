import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { FEEDBACK_SIGNAL_KEYS, FEEDBACK_SIGNAL_LABELS, summarizeFeedback } from "@/lib/creator-magnet"
import prisma from "@/lib/prisma"
import { structuredFeedbackSchema } from "@/lib/validations"

function buildSignalSummary(input: Record<string, boolean>) {
  return FEEDBACK_SIGNAL_KEYS.filter((key) => input[key]).map((key) => FEEDBACK_SIGNAL_LABELS[key])
}

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
    console.error("Get structured feedback error:", error)
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

    if (game.creatorId !== session.user.id) {
      const signalSummary = buildSignalSummary({
        fun: feedback.fun,
        confusing: feedback.confusing,
        tooHard: feedback.tooHard,
        buggy: feedback.buggy,
      })
      const actor = session.user.username || session.user.name || "A player"
      const message = feedback.comment
        ? `${actor} left quick feedback on ${game.title}: ${feedback.comment}`
        : `${actor} marked ${game.title} as ${signalSummary.join(", ").toLowerCase() || "worth revisiting"}.`

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
    console.error("Create structured feedback error:", error)
    return NextResponse.json({ error: "SYSTEM_ERROR" }, { status: 500 })
  }
}
