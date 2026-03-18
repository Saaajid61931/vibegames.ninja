import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import prisma from "@/lib/prisma"
import { createRateLimitResponse, enforceRateLimit, RATE_LIMIT_POLICIES } from "@/lib/rate-limit"
import { logServerError } from "@/lib/server-log"

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    const { id: creatorId } = await params

    const creator = await prisma.user.findUnique({
      where: { id: creatorId },
      select: { id: true, username: true },
    })

    if (!creator) {
      return NextResponse.json({ error: "CREATOR_NOT_FOUND" }, { status: 404 })
    }

    const [followers, following] = await Promise.all([
      prisma.creatorFollow.count({ where: { creatorId } }),
      session?.user?.id
        ? prisma.creatorFollow
            .findUnique({
              where: {
                followerId_creatorId: {
                  followerId: session.user.id,
                  creatorId,
                },
              },
              select: { id: true },
            })
            .then((follow: { id: string } | null) => Boolean(follow))
        : Promise.resolve(false),
    ])

    return NextResponse.json({
      followers,
      following,
    })
  } catch (error) {
    void request
    logServerError("Creator follow status error", error, {
      route: "/api/creators/[id]/follow",
      method: "GET",
    })
    return NextResponse.json({ error: "SYSTEM_ERROR" }, { status: 500 })
  }
}

export async function POST(
  request: Request,
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
      policy: RATE_LIMIT_POLICIES.follows,
      keyPrefix: "api-creator-follow",
    })

    if (!rateLimit.allowed) {
      return createRateLimitResponse(rateLimit, "You are following creators too quickly. Please wait before trying again.")
    }

    const { id: creatorId } = await params
    const followerId = session.user.id

    if (followerId === creatorId) {
      return NextResponse.json({ error: "CANNOT_FOLLOW_SELF" }, { status: 400 })
    }

    const creator = await prisma.user.findUnique({
      where: { id: creatorId },
      select: { id: true, username: true },
    })

    if (!creator) {
      return NextResponse.json({ error: "CREATOR_NOT_FOUND" }, { status: 404 })
    }

    const existing = await prisma.creatorFollow.findUnique({
      where: {
        followerId_creatorId: {
          followerId,
          creatorId,
        },
      },
      select: { id: true },
    })

    if (existing) {
      await prisma.creatorFollow.delete({ where: { id: existing.id } })
    } else {
      await prisma.creatorFollow.create({
        data: {
          followerId,
          creatorId,
        },
      })

      await prisma.notification.create({
        data: {
          userId: creatorId,
          title: "New follower",
          message: `${session.user.username || session.user.name || "A player"} started following you.`,
          type: "CREATOR_FOLLOW",
          link: creator.username ? `/creator/${creator.username}` : "/creator",
        },
      })
    }

    const followers = await prisma.creatorFollow.count({ where: { creatorId } })

    return NextResponse.json({
      following: !existing,
      followers,
    })
  } catch (error) {
    logServerError("Creator follow toggle error", error, {
      route: "/api/creators/[id]/follow",
      method: "POST",
    })
    return NextResponse.json({ error: "SYSTEM_ERROR" }, { status: 500 })
  }
}
