import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import prisma from "@/lib/prisma"

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    const { id: creatorId } = await params

    const creator = await prisma.user.findUnique({
      where: { id: creatorId },
      select: { id: true },
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
    console.error("Creator follow status error:", error)
    return NextResponse.json({ error: "SYSTEM_ERROR" }, { status: 500 })
  }
}

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: "AUTHENTICATION_REQUIRED" }, { status: 401 })
    }

    const { id: creatorId } = await params
    const followerId = session.user.id

    if (followerId === creatorId) {
      return NextResponse.json({ error: "CANNOT_FOLLOW_SELF" }, { status: 400 })
    }

    const creator = await prisma.user.findUnique({
      where: { id: creatorId },
      select: { id: true },
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
    }

    const followers = await prisma.creatorFollow.count({ where: { creatorId } })

    return NextResponse.json({
      following: !existing,
      followers,
    })
  } catch (error) {
    console.error("Creator follow toggle error:", error)
    return NextResponse.json({ error: "SYSTEM_ERROR" }, { status: 500 })
  }
}
