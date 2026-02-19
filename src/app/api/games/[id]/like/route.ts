import { NextRequest, NextResponse } from "next/server"
import { revalidateTag } from "next/cache"
import { Prisma } from "@prisma/client"
import { auth } from "@/lib/auth"
import prisma from "@/lib/prisma"

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "AUTHENTICATION_REQUIRED" },
        { status: 401 }
      )
    }

    const { id: gameId } = await params

    const currentUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true },
    })

    if (!currentUser) {
      return NextResponse.json({ error: "AUTHENTICATION_REQUIRED" }, { status: 401 })
    }

    // Check if game exists
    const game = await prisma.game.findUnique({
      where: { id: gameId },
      select: { id: true, slug: true },
    })

    if (!game) {
      return NextResponse.json(
        { error: "GAME_NOT_FOUND" },
        { status: 404 }
      )
    }

    const { liked, likes } = await prisma.$transaction(async (tx) => {
      const existingFavorite = await tx.favorite.findUnique({
        where: {
          userId_gameId: {
            userId: session.user.id,
            gameId,
          },
        },
        select: { id: true },
      })

      if (existingFavorite) {
        await tx.favorite.deleteMany({
          where: {
            userId: session.user.id,
            gameId,
          },
        })
      } else {
        await tx.favorite.createMany({
          data: {
            userId: session.user.id,
            gameId,
          },
          skipDuplicates: true,
        })
      }

      const [currentFavorite, favoriteCount] = await Promise.all([
        tx.favorite.findUnique({
          where: {
            userId_gameId: {
              userId: session.user.id,
              gameId,
            },
          },
          select: { id: true },
        }),
        tx.favorite.count({ where: { gameId } }),
      ])

      const updated = await tx.game.update({
        where: { id: gameId },
        data: { likes: favoriteCount },
        select: { likes: true },
      })

      return {
        liked: Boolean(currentFavorite),
        likes: updated.likes,
      }
    })

    revalidateTag("games", "max")

    return NextResponse.json({
      liked,
      likes,
    })
  } catch (error) {
    console.error("Like error:", error)
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2025") {
        return NextResponse.json({ error: "GAME_NOT_FOUND" }, { status: 404 })
      }
      if (error.code === "P2003") {
        return NextResponse.json({ error: "AUTHENTICATION_REQUIRED" }, { status: 401 })
      }
    }

    const detail = error instanceof Error ? error.message : "Unknown error"
    return NextResponse.json(
      {
        error: "SYSTEM_ERROR",
        ...(process.env.NODE_ENV === "development" ? { detail } : {}),
      },
      { status: 500 }
    )
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    const { id: gameId } = await params

    const game = await prisma.game.findUnique({
      where: { id: gameId },
      select: { likes: true },
    })

    if (!game) {
      return NextResponse.json({ error: "GAME_NOT_FOUND" }, { status: 404 })
    }

    let liked = false
    if (session?.user?.id) {
      const favorite = await prisma.favorite.findUnique({
        where: {
          userId_gameId: {
            userId: session.user.id,
            gameId,
          },
        },
      })
      liked = !!favorite
    }

    return NextResponse.json({
      liked,
      likes: game.likes,
    })
  } catch (error) {
    console.error("Get like status error:", error)
    return NextResponse.json({ error: "SYSTEM_ERROR" }, { status: 500 })
  }
}
