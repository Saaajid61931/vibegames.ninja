import { NextRequest, NextResponse } from "next/server"
import { revalidateTag } from "next/cache"
import { auth } from "@/lib/auth"
import prisma from "@/lib/prisma"
import { commentSchema } from "@/lib/validations"

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
    console.error("Create comment error:", error)
    return NextResponse.json({ error: "SYSTEM_ERROR" }, { status: 500 })
  }
}
