import prisma from "@/lib/prisma"

export async function refreshLevelRating(levelId: string) {
  await prisma.$executeRaw`
    UPDATE "Level"
    SET
      "avgRating" = COALESCE(
        (SELECT AVG("score")::double precision FROM "LevelRating" WHERE "levelId" = ${levelId}),
        0
      ),
      "ratingCount" = (SELECT COUNT(*)::integer FROM "LevelRating" WHERE "levelId" = ${levelId})
    WHERE "id" = ${levelId}
  `
}

export async function refreshGameRating(gameId: string) {
  await prisma.$executeRaw`
    UPDATE "Game"
    SET
      "avgRating" = COALESCE(
        (SELECT AVG("score")::double precision FROM "GameRating" WHERE "gameId" = ${gameId}),
        0
      ),
      "ratingCount" = (SELECT COUNT(*)::integer FROM "GameRating" WHERE "gameId" = ${gameId})
    WHERE "id" = ${gameId}
  `
}
