import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import prisma from "@/lib/prisma"
import { logServerError } from "@/lib/server-log"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const code = searchParams.get("code")

    if (!code) {
      return NextResponse.json({ error: "Challenge code is required" }, { status: 400 })
    }

    const challenge = await prisma.gameChallenge.findUnique({
      where: { code: code.toUpperCase() },
      include: {
        game: {
          select: {
            id: true,
            slug: true,
            title: true,
            description: true,
            thumbnail: true,
            category: true,
          },
        },
        creatorUser: {
          select: {
            id: true,
            name: true,
            username: true,
            image: true,
          },
        },
      },
    })

    if (!challenge) {
      return NextResponse.json({ error: "Challenge not found" }, { status: 404 })
    }

    return NextResponse.json({ challenge })
  } catch (error) {
    logServerError("Challenge API GET failed", error, { route: "/api/challenges" })
    return NextResponse.json({ error: "Failed to fetch challenge" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Authentication required to create a challenge" }, { status: 401 })
    }

    const body = await request.json()
    const { gameId, targetScore } = body

    if (!gameId || typeof targetScore !== "number" || targetScore <= 0) {
      return NextResponse.json({ error: "Valid gameId and positive targetScore are required" }, { status: 400 })
    }

    const game = await prisma.game.findUnique({ where: { id: gameId } })
    if (!game) {
      return NextResponse.json({ error: "Game not found" }, { status: 404 })
    }

    // Generate unique challenge code e.g. "BEAT-4280-7F2A"
    const randomSuffix = Math.random().toString(36).substring(2, 6).toUpperCase()
    const code = `BEAT-${targetScore}-${randomSuffix}`

    const challenge = await prisma.gameChallenge.create({
      data: {
        code,
        gameId,
        creatorId: session.user.id,
        targetScore,
      },
      include: {
        game: { select: { slug: true, title: true } },
      },
    })

    const challengeUrl = `${process.env.NEXT_PUBLIC_APP_URL || "https://vibegames.ninja"}/play/${game.slug}?challenge=${challenge.code}`

    return NextResponse.json({
      success: true,
      challenge,
      challengeUrl,
    })
  } catch (error) {
    logServerError("Challenge API POST failed", error, { route: "/api/challenges" })
    return NextResponse.json({ error: "Failed to create challenge" }, { status: 500 })
  }
}
