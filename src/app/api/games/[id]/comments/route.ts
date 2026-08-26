import { NextRequest, NextResponse } from "next/server"
import { revalidateTag } from "next/cache"
import { auth } from "@/lib/auth"
import prisma from "@/lib/prisma"
import { createRateLimitResponse, enforceRateLimit, RATE_LIMIT_POLICIES } from "@/lib/rate-limit"
import { logServerError } from "@/lib/server-log"
import { commentSchema } from "@/lib/validations"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: gameId } = await params
    const skipParam = Number(request.nextUrl.searchParams.get("skip"))
    const takeParam = Number(request.nextUrl.searchParams.get("take"))
    const skip = Number.isFinite(skipParam) && skipParam > 0 ? Math.floor(skipParam) : 0
    const take =
      Number.isFinite(takeParam) && takeParam > 0
        ? Math.min(Math.floor(takeParam), 80)
        : 80

    const comments = await prisma.comment.findMany({
      where: { gameId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            username: true,
            image: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take,
    })

    return NextResponse.json({ comments })
  } catch (error) {
    logServerError("Fetch comments error", error, {
      route: "/api/games/[id]/comments",
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
      policy: RATE_LIMIT_POLICIES.comments,
      keyPrefix: "api-comments",
    })

    if (!rateLimit.allowed) {
      return createRateLimitResponse(rateLimit, "You are posting comments too quickly. Please wait a moment and try again.")
    }

    const { id: gameId } = await params
    const body = await request.json().catch(() => null)
    const parsed = commentSchema.safeParse({
      content: typeof body?.content === "string" ? body.content.trim() : "",
      gameId,
      parentId: typeof body?.parentId === "string" ? body.parentId : undefined,
    })

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message || "Invalid comment" }, { status: 400 })
    }

    const { content, parentId } = parsed.data

    const game = await prisma.game.findUnique({
      where: { id: gameId },
      select: { id: true, status: true, title: true, slug: true, creatorId: true },
    })

    if (!game || game.status !== "PUBLISHED") {
      return NextResponse.json({ error: "GAME_NOT_FOUND" }, { status: 404 })
    }

    let parentCommentUserId: string | null = null
    if (parentId) {
      const parentComment = await prisma.comment.findFirst({
        where: { id: parentId, gameId },
        select: { id: true, userId: true },
      })

      if (!parentComment) {
        return NextResponse.json({ error: "PARENT_COMMENT_NOT_FOUND" }, { status: 404 })
      }

      parentCommentUserId = parentComment.userId
    }

    const [comment, commentsCount] = await prisma.$transaction([
      prisma.comment.create({
        data: {
          content,
          gameId,
          userId: session.user.id,
          parentId: parentId || null,
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              username: true,
              image: true,
            },
          },
        },
      }),
      prisma.comment.count({ where: { gameId } }),
    ])

    const actor = comment.user.username || comment.user.name || "A player"
    const notificationPayloads: Array<{
      userId: string
      title: string
      message: string
      type: string
      link: string
    }> = []

    if (game.creatorId !== session.user.id) {
      notificationPayloads.push({
        userId: game.creatorId,
        title: parentId ? "New reply" : "New comment",
        message: parentId
          ? `${actor} replied in the comments on ${game.title}.`
          : `${actor} commented on ${game.title}.`,
        type: parentId ? "GAME_COMMENT_REPLY" : "GAME_COMMENT",
        link: `/play/${game.slug}`,
      })
    }

    if (
      parentCommentUserId &&
      parentCommentUserId !== session.user.id &&
      parentCommentUserId !== game.creatorId
    ) {
      notificationPayloads.push({
        userId: parentCommentUserId,
        title: "New reply",
        message: `${actor} replied to your comment on ${game.title}.`,
        type: "GAME_COMMENT_REPLY",
        link: `/play/${game.slug}`,
      })
    }

    if (notificationPayloads.length > 0) {
      await prisma.notification.createMany({
        data: notificationPayloads,
      })
    }

    revalidateTag("games", "max")

    return NextResponse.json({
      comment,
      commentsCount,
    })
  } catch (error) {
    logServerError("Create comment error", error, {
      route: "/api/games/[id]/comments",
      method: "POST",
    })
    return NextResponse.json({ error: "SYSTEM_ERROR" }, { status: 500 })
  }
}
