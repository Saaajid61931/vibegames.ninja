import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import prisma from "@/lib/prisma"
import { refreshLevelRating } from "@/lib/ratings"
import { ratingSchema } from "@/lib/validations"

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ score: null })
    }

    const { id } = await params
    const rating = await prisma.levelRating.findUnique({
      where: {
        userId_levelId: {
          userId: session.user.id,
          levelId: id,
        },
      },
      select: { score: true },
    })

    return NextResponse.json({ score: rating?.score ?? null })
  } catch (error) {
    console.error("Get level rating error:", error)
    return NextResponse.json({ error: "Failed to fetch rating" }, { status: 500 })
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params
    const level = await prisma.level.findUnique({
      where: { id },
      select: {
        id: true,
        status: true,
        name: true,
        creatorId: true,
        game: {
          select: { slug: true },
        },
      },
    })

    if (!level || level.status !== "PUBLISHED") {
      return NextResponse.json({ error: "Level not found" }, { status: 404 })
    }

    const body = await request.json()
    const parsed = ratingSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: "Rating must be between 1 and 5" }, { status: 400 })
    }

    await prisma.levelRating.upsert({
      where: {
        userId_levelId: {
          userId: session.user.id,
          levelId: id,
        },
      },
      update: {
        score: parsed.data.score,
      },
      create: {
        userId: session.user.id,
        levelId: id,
        score: parsed.data.score,
      },
    })

    await refreshLevelRating(id)

    if (level.creatorId !== session.user.id) {
      await prisma.notification.create({
        data: {
          userId: level.creatorId,
          title: "Level rated",
          message: `${session.user.username || session.user.name || "A player"} rated your level ${parsed.data.score}/5.`,
          type: "LEVEL_RATING",
          link: `/play/${level.game.slug}?level=${level.id}`,
        },
      })
    }

    const updated = await prisma.level.findUnique({
      where: { id },
      select: { avgRating: true, ratingCount: true },
    })

    return NextResponse.json({
      score: parsed.data.score,
      avgRating: updated?.avgRating ?? 0,
      ratingCount: updated?.ratingCount ?? 0,
    })
  } catch (error) {
    console.error("Rate level error:", error)
    return NextResponse.json({ error: "Failed to rate level" }, { status: 500 })
  }
}
