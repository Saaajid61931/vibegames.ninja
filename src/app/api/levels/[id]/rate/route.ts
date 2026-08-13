import { NextRequest, NextResponse } from "next/server"
import { Prisma } from "@prisma/client"
import { auth } from "@/lib/auth"
import prisma from "@/lib/prisma"
import { refreshLevelRating } from "@/lib/ratings"
import { createRateLimitResponse, enforceRateLimit, RATE_LIMIT_POLICIES } from "@/lib/rate-limit"
import { ratingSchema } from "@/lib/validations"
import { logServerError } from "@/lib/server-log"

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
    logServerError("Get level rating error", error, {
      route: "/api/levels/[id]/rate",
      method: "GET",
    })
    return NextResponse.json({ error: "Failed to fetch rating" }, { status: 500 })
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  let authenticatedUserId: string | null = null

  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    authenticatedUserId = session.user.id

    const rateLimit = enforceRateLimit({
      request,
      userId: session.user.id,
      policy: RATE_LIMIT_POLICIES.ratings,
      keyPrefix: "api-ratings",
    })

    if (!rateLimit.allowed) {
      return createRateLimitResponse(rateLimit, "You are rating too quickly. Please wait before trying again.")
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true },
    })

    if (!user) {
      return NextResponse.json(
        { error: "SESSION_EXPIRED", message: "Your session has expired. Please sign in again." },
        { status: 401 }
      )
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

    const body = await request.json().catch(() => null)
    const parsed = ratingSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: "Rating must be between 1 and 5" }, { status: 400 })
    }

    const existingRating = await prisma.levelRating.findUnique({
      where: {
        userId_levelId: {
          userId: session.user.id,
          levelId: id,
        },
      },
      select: { score: true },
    })

    let ratingChanged = false
    let ratingCreated = false

    if (existingRating) {
      if (existingRating.score !== parsed.data.score) {
        await prisma.levelRating.update({
          where: {
            userId_levelId: {
              userId: session.user.id,
              levelId: id,
            },
          },
          data: { score: parsed.data.score },
        })
        ratingChanged = true
      }
    } else {
      const created = await prisma.levelRating.createMany({
        data: {
          userId: session.user.id,
          levelId: id,
          score: parsed.data.score,
        },
        skipDuplicates: true,
      })

      ratingCreated = created.count === 1
      ratingChanged = ratingCreated

      if (!ratingCreated) {
        const concurrentRating = await prisma.levelRating.findUnique({
          where: {
            userId_levelId: {
              userId: session.user.id,
              levelId: id,
            },
          },
          select: { score: true },
        })

        if (!concurrentRating) {
          throw new Error("Rating was not created")
        }

        if (concurrentRating.score !== parsed.data.score) {
          await prisma.levelRating.update({
            where: {
              userId_levelId: {
                userId: session.user.id,
                levelId: id,
              },
            },
            data: { score: parsed.data.score },
          })
          ratingChanged = true
        }
      }
    }

    if (ratingChanged) {
      await refreshLevelRating(id)
    }

    if (ratingCreated && level.creatorId !== session.user.id) {
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
    logServerError("Rate level error", error, {
      route: "/api/levels/[id]/rate",
      method: "POST",
    })

    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2003") {
      const currentUser = await prisma.user.findUnique({
        where: { id: authenticatedUserId || "" },
        select: { id: true },
      })

      if (!currentUser) {
        return NextResponse.json(
          { error: "SESSION_EXPIRED", message: "Your session has expired. Please sign in again." },
          { status: 401 }
        )
      }
    }

    return NextResponse.json({ error: "Failed to rate level" }, { status: 500 })
  }
}
