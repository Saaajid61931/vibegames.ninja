import { NextRequest, NextResponse } from "next/server"
import { revalidateTag } from "next/cache"
import { auth } from "@/lib/auth"
import prisma from "@/lib/prisma"

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
    const body = await request.json()
    const content = typeof body?.content === "string" ? body.content.trim() : ""

    if (!content) {
      return NextResponse.json({ error: "Comment cannot be empty" }, { status: 400 })
    }

    if (content.length > 1000) {
      return NextResponse.json({ error: "Comment must be less than 1000 characters" }, { status: 400 })
    }

    const game = await prisma.game.findUnique({
      where: { id: gameId },
      select: { id: true, status: true },
    })

    if (!game || game.status !== "PUBLISHED") {
      return NextResponse.json({ error: "GAME_NOT_FOUND" }, { status: 404 })
    }

    const [comment, commentsCount] = await prisma.$transaction([
      prisma.comment.create({
        data: {
          content,
          gameId,
          userId: session.user.id,
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
