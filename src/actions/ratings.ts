"use server"

import { auth } from "@/lib/auth"
import prisma from "@/lib/prisma"
import { refreshGameRating, refreshLevelRating } from "@/lib/ratings"
import { ratingSchema } from "@/lib/validations"

type RatingResult = {
  success: true
  score: number
  avgRating: number
  ratingCount: number
} | {
  success: false
  error: string
}

export async function rateGame(gameId: string, score: number): Promise<RatingResult> {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, error: "You must be logged in to rate" }
    }

    const parsed = ratingSchema.safeParse({ score })
    if (!parsed.success) {
      return { success: false, error: "Rating must be between 1 and 5" }
    }

    const game = await prisma.game.findUnique({
      where: { id: gameId },
      select: { id: true, status: true },
    })

    if (!game || game.status !== "PUBLISHED") {
      return { success: false, error: "Game not found" }
    }

    await prisma.gameRating.upsert({
      where: {
        userId_gameId: {
          userId: session.user.id,
          gameId,
        },
      },
      update: { score: parsed.data.score },
      create: {
        userId: session.user.id,
        gameId,
        score: parsed.data.score,
      },
    })

    await refreshGameRating(gameId)

    const updated = await prisma.game.findUnique({
      where: { id: gameId },
      select: { avgRating: true, ratingCount: true },
    })

    return {
      success: true,
      score: parsed.data.score,
      avgRating: updated?.avgRating ?? 0,
      ratingCount: updated?.ratingCount ?? 0,
    }
  } catch (error) {
    console.error("Rate game action error:", error)
    return { success: false, error: "Something went wrong. Please try again." }
  }
}

export async function rateLevel(levelId: string, score: number): Promise<RatingResult> {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, error: "You must be logged in to rate" }
    }

    const parsed = ratingSchema.safeParse({ score })
    if (!parsed.success) {
      return { success: false, error: "Rating must be between 1 and 5" }
    }

    const level = await prisma.level.findUnique({
      where: { id: levelId },
      select: { id: true, status: true },
    })

    if (!level || level.status !== "PUBLISHED") {
      return { success: false, error: "Level not found" }
    }

    await prisma.levelRating.upsert({
      where: {
        userId_levelId: {
          userId: session.user.id,
          levelId,
        },
      },
      update: { score: parsed.data.score },
      create: {
        userId: session.user.id,
        levelId,
        score: parsed.data.score,
      },
    })

    await refreshLevelRating(levelId)

    const updated = await prisma.level.findUnique({
      where: { id: levelId },
      select: { avgRating: true, ratingCount: true },
    })

    return {
      success: true,
      score: parsed.data.score,
      avgRating: updated?.avgRating ?? 0,
      ratingCount: updated?.ratingCount ?? 0,
    }
  } catch (error) {
    console.error("Rate level action error:", error)
    return { success: false, error: "Something went wrong. Please try again." }
  }
}
