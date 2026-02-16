import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import prisma from "@/lib/prisma"
import { refreshGameRating } from "@/lib/ratings"
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
    const rating = await prisma.gameRating.findUnique({
      where: {
        userId_gameId: {
          userId: session.user.id,
          gameId: id,
        },
      },
      select: { score: true },
    })

    return NextResponse.json({ score: rating?.score ?? null })
  } catch (error) {
    console.error("Get game rating error:", error)
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
    const game = await prisma.game.findUnique({
      where: { id },
      select: { id: true, status: true },
    })

    if (!game || game.status !== "PUBLISHED") {
      return NextResponse.json({ error: "Game not found" }, { status: 404 })
    }

    const body = await request.json()
    const parsed = ratingSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: "Rating must be between 1 and 5" }, { status: 400 })
    }

    await prisma.gameRating.upsert({
      where: {
        userId_gameId: {
          userId: session.user.id,
          gameId: id,
        },
      },
      update: {
        score: parsed.data.score,
      },
      create: {
        userId: session.user.id,
        gameId: id,
        score: parsed.data.score,
      },
    })

    await refreshGameRating(id)

    const updated = await prisma.game.findUnique({
      where: { id },
      select: { avgRating: true, ratingCount: true },
    })

    return NextResponse.json({
      score: parsed.data.score,
      avgRating: updated?.avgRating ?? 0,
      ratingCount: updated?.ratingCount ?? 0,
    })
  } catch (error) {
    console.error("Rate game error:", error)
    return NextResponse.json({ error: "Failed to rate game" }, { status: 500 })
  }
}
