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
  let step = "init"
  try {
    step = "auth"
    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, error: "You must be logged in to rate" }
    }

    step = "validate"
    const parsed = ratingSchema.safeParse({ score })
    if (!parsed.success) {
      return { success: false, error: "Rating must be between 1 and 5" }
    }

    step = "find-game"
    const game = await prisma.game.findUnique({
      where: { id: gameId },
      select: { id: true, status: true },
    })

    if (!game || game.status !== "PUBLISHED") {
      return { success: false, error: "Game not found" }
    }

    step = "upsert-rating"
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

    step = "refresh-aggregate"
    await refreshGameRating(gameId)

    step = "fetch-updated"
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
    const msg = error instanceof Error ? error.message : String(error)
    console.error(`Rate game error at step [${step}]:`, error)
    return { success: false, error: `Rating failed at step: ${step} (${msg})` }
  }
}

export async function rateLevel(levelId: string, score: number): Promise<RatingResult> {
  let step = "init"
  try {
    step = "auth"
    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, error: "You must be logged in to rate" }
    }

    step = "validate"
    const parsed = ratingSchema.safeParse({ score })
    if (!parsed.success) {
      return { success: false, error: "Rating must be between 1 and 5" }
    }

    step = "find-level"
    const level = await prisma.level.findUnique({
      where: { id: levelId },
      select: { id: true, status: true },
    })

    if (!level || level.status !== "PUBLISHED") {
      return { success: false, error: "Level not found" }
    }

    step = "upsert-rating"
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

    step = "refresh-aggregate"
    await refreshLevelRating(levelId)

    step = "fetch-updated"
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
    const msg = error instanceof Error ? error.message : String(error)
    console.error(`Rate level error at step [${step}]:`, error)
    return { success: false, error: `Rating failed at step: ${step} (${msg})` }
  }
}
