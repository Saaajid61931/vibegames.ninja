import { NextRequest, NextResponse } from "next/server"
import { revalidateTag } from "next/cache"
import { auth } from "@/lib/auth"
import prisma from "@/lib/prisma"
import { checkAndUpdatePermanentStatus, LIKES_FOR_PERMANENT } from "@/lib/retention"

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

    // Check if game exists
    const game = await prisma.game.findUnique({
      where: { id: gameId },
      select: { id: true, likes: true, isPermanent: true, creatorId: true },
    })

    if (!game) {
      return NextResponse.json(
        { error: "GAME_NOT_FOUND" },
        { status: 404 }
      )
    }

    // Check if user already liked this game
    const existingFavorite = await prisma.favorite.findUnique({
      where: {
        userId_gameId: {
          userId: session.user.id,
          gameId,
        },
      },
    })

    let liked: boolean
    let newLikes: number

    if (existingFavorite) {
      // Unlike
      await prisma.favorite.delete({
        where: { id: existingFavorite.id },
      })
      
      const updated = await prisma.game.update({
        where: { id: gameId },
        data: { likes: { decrement: 1 } },
        select: { likes: true },
      })
      
      liked = false
      newLikes = updated.likes
    } else {
      // Like
      await prisma.favorite.create({
        data: {
          userId: session.user.id,
          gameId,
        },
      })
      
      const updated = await prisma.game.update({
        where: { id: gameId },
        data: { likes: { increment: 1 } },
        select: { likes: true },
      })
      
      liked = true
      newLikes = updated.likes

      // Check if game should become permanent
      if (!game.isPermanent && newLikes >= LIKES_FOR_PERMANENT) {
        await checkAndUpdatePermanentStatus(gameId, newLikes)
        
        // Notify creator that their game is now permanent
        await prisma.notification.create({
          data: {
            userId: game.creatorId,
            title: "GAME_PERMANENT",
            message: `Your game has reached ${LIKES_FOR_PERMANENT} likes and is now permanently hosted!`,
            type: "success",
            link: `/play/${gameId}`,
          },
        })
      }
    }

    revalidateTag("games", "max")

    return NextResponse.json({
      liked,
      likes: newLikes,
      isPermanent: newLikes >= LIKES_FOR_PERMANENT,
      likesNeeded: Math.max(0, LIKES_FOR_PERMANENT - newLikes),
    })
  } catch (error) {
    console.error("Like error:", error)
    return NextResponse.json(
      { error: "SYSTEM_ERROR" },
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
      select: { likes: true, isPermanent: true, expiresAt: true },
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
      isPermanent: game.isPermanent,
      expiresAt: game.expiresAt,
      likesNeeded: Math.max(0, LIKES_FOR_PERMANENT - game.likes),
    })
  } catch (error) {
    console.error("Get like status error:", error)
    return NextResponse.json({ error: "SYSTEM_ERROR" }, { status: 500 })
  }
}
