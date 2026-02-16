import prisma from "@/lib/prisma"

export async function refreshLevelRating(levelId: string) {
  const stats = await prisma.levelRating.aggregate({
    where: { levelId },
    _avg: { score: true },
    _count: { score: true },
  })

  await prisma.level.update({
    where: { id: levelId },
    data: {
      avgRating: stats._avg.score ?? 0,
      ratingCount: stats._count.score,
    },
  })
}

export async function refreshGameRating(gameId: string) {
  const stats = await prisma.gameRating.aggregate({
    where: { gameId },
    _avg: { score: true },
    _count: { score: true },
  })

  await prisma.game.update({
    where: { id: gameId },
    data: {
      avgRating: stats._avg.score ?? 0,
      ratingCount: stats._count.score,
    },
  })
}
