import { unstable_cache } from "next/cache"
import prisma, { isPrismaDatasourceConfigured } from "@/lib/prisma"
import { logServerError } from "@/lib/server-log"

const getRankedGames = unstable_cache(
  async (monthStart: string, monthEnd: string) => {
    const ranked = await prisma.gameAnalytics.groupBy({
      by: ["gameId"],
      where: {
        date: { gte: new Date(monthStart), lt: new Date(monthEnd) },
        plays: { gt: 0 },
        game: { status: "PUBLISHED" },
      },
      _sum: { plays: true },
      orderBy: [{ _sum: { plays: "desc" } }, { gameId: "asc" }],
      take: 3,
    })
    if (!ranked.length) return []
    const games = await prisma.game.findMany({
      where: { id: { in: ranked.map((entry) => entry.gameId) }, status: "PUBLISHED" },
      select: {
        id: true,
        slug: true,
        title: true,
        thumbnail: true,
        creator: { select: { name: true, username: true } },
      },
    })
    return ranked.flatMap((entry) => {
      const game = games.find((item) => item.id === entry.gameId)
      return game ? [{ ...game, monthlyPlays: entry._sum.plays ?? 0 }] : []
    })
  },
  ["hero-monthly-plays-v1"],
  { revalidate: 300, tags: ["games"] },
)

export async function getMonthlyHeroShowcase() {
  const now = new Date()
  const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1))
  const monthEnd = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1))
  const monthLabel = new Intl.DateTimeFormat("en", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(monthStart)
  try {
    const games = isPrismaDatasourceConfigured()
      ? await getRankedGames(monthStart.toISOString(), monthEnd.toISOString())
      : []
    return { games, monthLabel }
  } catch (error) {
    logServerError("Monthly hero ranking unavailable", error, {
      route: "app/home",
      query: "monthlyPlays",
    })
    return { games: [], monthLabel }
  }
}
