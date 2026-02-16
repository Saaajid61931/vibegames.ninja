import { redirect } from "next/navigation"
import Link from "next/link"
import {
  Terminal,
  BarChart3,
  Play,
  Heart,
  Star,
  Layers,
  Gamepad2,
  TrendingUp,
  ArrowLeft,
  Eye,
  ExternalLink,
} from "lucide-react"
import { auth } from "@/lib/auth"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import prisma from "@/lib/prisma"
import { formatNumber, timeAgo } from "@/lib/utils"

export const dynamic = "force-dynamic"

export const metadata = {
  title: "Analytics | VibeGames",
  description: "Overview analytics across all your games and community levels.",
}

async function getAnalyticsData(userId: string) {
  const [
    gameStats,
    games,
    communityLevelsOnMyGames,
    myLevels,
    topLevelsOnMyGames,
    recentActivity,
  ] = await Promise.all([
    // Aggregate stats across all games
    prisma.game.aggregate({
      where: { creatorId: userId },
      _sum: { plays: true, likes: true, shares: true },
      _avg: { avgRating: true },
      _count: true,
    }),

    // Top games by plays
    prisma.game.findMany({
      where: { creatorId: userId, status: "PUBLISHED" },
      select: {
        id: true,
        slug: true,
        title: true,
        thumbnail: true,
        plays: true,
        likes: true,
        avgRating: true,
        ratingCount: true,
        hasLevelEditor: true,
        _count: { select: { levels: true } },
      },
      orderBy: { plays: "desc" },
      take: 10,
    }),

    // Total community levels on the creator's games
    prisma.level.count({
      where: {
        game: { creatorId: userId },
      },
    }),

    // My own levels stats
    prisma.level.aggregate({
      where: { creatorId: userId },
      _sum: { plays: true },
      _avg: { avgRating: true },
      _count: true,
    }),

    // Top community levels on creator's games
    prisma.level.findMany({
      where: {
        game: { creatorId: userId },
        status: "PUBLISHED",
      },
      select: {
        id: true,
        name: true,
        plays: true,
        avgRating: true,
        ratingCount: true,
        createdAt: true,
        creator: {
          select: { id: true, name: true, username: true },
        },
        game: {
          select: { slug: true, title: true },
        },
      },
      orderBy: { plays: "desc" },
      take: 5,
    }),

    // Recent daily analytics across all games (last 14 days)
    prisma.gameAnalytics.findMany({
      where: {
        game: { creatorId: userId },
      },
      orderBy: { date: "desc" },
      take: 14,
      select: {
        date: true,
        plays: true,
        uniquePlayers: true,
        game: { select: { title: true } },
      },
    }),
  ])

  return {
    summary: {
      totalGames: gameStats._count,
      totalPlays: gameStats._sum.plays || 0,
      totalLikes: gameStats._sum.likes || 0,
      totalShares: gameStats._sum.shares || 0,
      avgRating: gameStats._avg.avgRating || 0,
      communityLevelsOnMyGames,
      myLevelCount: myLevels._count,
      myLevelPlays: myLevels._sum.plays || 0,
      myLevelAvgRating: myLevels._avg.avgRating || 0,
    },
    games,
    topLevelsOnMyGames,
    recentActivity,
  }
}

export default async function CreatorAnalyticsPage() {
  const session = await auth()

  if (!session?.user) {
    redirect("/login")
  }

  const { summary, games, topLevelsOnMyGames, recentActivity } = await getAnalyticsData(session.user.id)

  return (
    <div className="min-h-screen flex flex-col bg-[#0d0d15]">
      <Header />

      <main className="flex-1 container mx-auto px-4 py-6 sm:py-8">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-8 pb-8 border-b-2 border-[#4a4a6a]">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <BarChart3 className="h-5 w-5 text-[#ffff00]" />
              <span className="text-[#ffff00] font-arcade text-sm">ANALYTICS.OVERVIEW</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white font-arcade">
              PERFORMANCE DASHBOARD
            </h1>
          </div>
          <Link href="/creator">
            <Button variant="arcade-outline" size="sm" className="gap-2 font-arcade">
              <ArrowLeft className="h-4 w-4" />
              DASHBOARD
            </Button>
          </Link>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-8">
          <div className="border-2 border-[#4a4a6a] p-4">
            <div className="flex items-center gap-2 mb-2">
              <Gamepad2 className="h-4 w-4 text-[#ffff00]" />
              <span className="text-xs text-[#4a4a6a] font-arcade">TOTAL_GAMES</span>
            </div>
            <p className="text-2xl sm:text-3xl font-bold text-white font-arcade">{summary.totalGames}</p>
          </div>

          <div className="border-2 border-[#4a4a6a] p-4">
            <div className="flex items-center gap-2 mb-2">
              <Play className="h-4 w-4 text-[#ffff00]" />
              <span className="text-xs text-[#4a4a6a] font-arcade">TOTAL_PLAYS</span>
            </div>
            <p className="text-2xl sm:text-3xl font-bold text-white font-arcade">{formatNumber(summary.totalPlays)}</p>
          </div>

          <div className="border-2 border-[#4a4a6a] p-4">
            <div className="flex items-center gap-2 mb-2">
              <Heart className="h-4 w-4 text-[#ff0040]" />
              <span className="text-xs text-[#4a4a6a] font-arcade">TOTAL_LIKES</span>
            </div>
            <p className="text-2xl sm:text-3xl font-bold text-white font-arcade">{formatNumber(summary.totalLikes)}</p>
          </div>

          <div className="border-2 border-[#4a4a6a] p-4">
            <div className="flex items-center gap-2 mb-2">
              <Star className="h-4 w-4 text-[#ffff00]" />
              <span className="text-xs text-[#4a4a6a] font-arcade">AVG_RATING</span>
            </div>
            <p className="text-2xl sm:text-3xl font-bold text-[#ffff00] font-arcade">
              {summary.avgRating > 0 ? summary.avgRating.toFixed(1) : "N/A"}
            </p>
          </div>
        </div>

        {/* Community Levels Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 mb-8">
          <div className="border-2 border-[#4a4a6a] p-4">
            <div className="flex items-center gap-2 mb-2">
              <Layers className="h-4 w-4 text-[#00ff40]" />
              <span className="text-xs text-[#4a4a6a] font-arcade">COMMUNITY_LEVELS</span>
            </div>
            <p className="text-2xl sm:text-3xl font-bold text-white font-arcade">
              {summary.communityLevelsOnMyGames}
            </p>
            <p className="text-[10px] text-[#4a4a6a] font-arcade mt-1">on your games</p>
          </div>

          <div className="border-2 border-[#4a4a6a] p-4">
            <div className="flex items-center gap-2 mb-2">
              <Layers className="h-4 w-4 text-[#0080ff]" />
              <span className="text-xs text-[#4a4a6a] font-arcade">MY_LEVELS</span>
            </div>
            <p className="text-2xl sm:text-3xl font-bold text-white font-arcade">{summary.myLevelCount}</p>
            <p className="text-[10px] text-[#4a4a6a] font-arcade mt-1">
              {formatNumber(summary.myLevelPlays)} plays
            </p>
          </div>

          <div className="border-2 border-[#4a4a6a] p-4 col-span-2 lg:col-span-1">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="h-4 w-4 text-[#ffff00]" />
              <span className="text-xs text-[#4a4a6a] font-arcade">TOTAL_SHARES</span>
            </div>
            <p className="text-2xl sm:text-3xl font-bold text-white font-arcade">{formatNumber(summary.totalShares)}</p>
          </div>
        </div>

        {/* Two-column layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Top Games */}
          <Card className="border-2 border-[#4a4a6a] bg-[#1a1a2e]">
            <CardHeader>
              <CardTitle className="font-arcade text-sm text-[#ffff00] flex items-center gap-2">
                <Gamepad2 className="h-4 w-4" />
                TOP GAMES BY PLAYS
              </CardTitle>
            </CardHeader>
            <CardContent>
              {games.length > 0 ? (
                <div className="space-y-3">
                  {games.map((game, index) => (
                    <div key={game.id} className="flex items-center gap-3">
                      <span className="text-[#4a4a6a] font-arcade text-xs w-6">{index + 1}.</span>
                      <div className="flex-1 min-w-0">
                        <Link
                          href={`/play/${game.slug}`}
                          className="font-arcade text-xs text-white hover:text-[#ffff00] truncate block"
                        >
                          {game.title}
                        </Link>
                        <div className="flex items-center gap-2 text-[10px] text-[#4a4a6a] font-arcade mt-0.5">
                          <span className="flex items-center gap-1">
                            <Play className="h-2.5 w-2.5" />
                            {formatNumber(game.plays)}
                          </span>
                          <span className="flex items-center gap-1 text-[#ff0040]">
                            <Heart className="h-2.5 w-2.5" />
                            {formatNumber(game.likes)}
                          </span>
                          {game.avgRating > 0 && (
                            <span className="flex items-center gap-1 text-[#ffff00]">
                              <Star className="h-2.5 w-2.5 fill-[#ffff00]" />
                              {game.avgRating.toFixed(1)}
                            </span>
                          )}
                          {game.hasLevelEditor && (
                            <span className="flex items-center gap-1 text-[#00ff40]">
                              <Layers className="h-2.5 w-2.5" />
                              {game._count.levels}
                            </span>
                          )}
                        </div>
                      </div>
                      <Link href={`/creator/games/${game.id}/analytics`}>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-[#4a4a6a] hover:text-[#ffff00]">
                          <BarChart3 className="h-3.5 w-3.5" />
                        </Button>
                      </Link>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-[#4a4a6a] font-arcade text-xs">No games published yet</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Top Community Levels */}
          <Card className="border-2 border-[#4a4a6a] bg-[#1a1a2e]">
            <CardHeader>
              <CardTitle className="font-arcade text-sm text-[#ffff00] flex items-center gap-2">
                <Layers className="h-4 w-4" />
                TOP COMMUNITY LEVELS
              </CardTitle>
            </CardHeader>
            <CardContent>
              {topLevelsOnMyGames.length > 0 ? (
                <div className="space-y-3">
                  {topLevelsOnMyGames.map((level, index) => (
                    <div key={level.id} className="flex items-center gap-3">
                      <span className="text-[#4a4a6a] font-arcade text-xs w-6">{index + 1}.</span>
                      <div className="flex-1 min-w-0">
                        <Link
                          href={`/play/${level.game.slug}?level=${level.id}`}
                          className="font-arcade text-xs text-white hover:text-[#ffff00] truncate block"
                        >
                          {level.name}
                        </Link>
                        <div className="flex items-center gap-2 text-[10px] text-[#4a4a6a] font-arcade mt-0.5">
                          <span>[{level.game.title.toUpperCase()}]</span>
                          <span>
                            by{" "}
                            {level.creator.username ? (
                              <Link
                                href={`/creator/${level.creator.username}`}
                                className="hover:text-[#ffff00] transition-colors"
                              >
                                {level.creator.username}
                              </Link>
                            ) : (
                              level.creator.name || "anonymous"
                            )}
                          </span>
                          <span className="flex items-center gap-1">
                            <Play className="h-2.5 w-2.5" />
                            {level.plays}
                          </span>
                          {level.avgRating > 0 && (
                            <span className="flex items-center gap-1 text-[#ffff00]">
                              <Star className="h-2.5 w-2.5 fill-[#ffff00]" />
                              {level.avgRating.toFixed(1)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-[#4a4a6a] font-arcade text-xs">
                    No community levels yet on your games
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Recent Daily Activity */}
        <Card className="border-2 border-[#4a4a6a] bg-[#1a1a2e]">
          <CardHeader>
            <CardTitle className="font-arcade text-sm text-[#ffff00] flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              RECENT DAILY ACTIVITY
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recentActivity.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm font-arcade">
                  <thead>
                    <tr className="text-[#4a4a6a] border-b border-[#4a4a6a]">
                      <th className="text-left py-2 px-2">Date</th>
                      <th className="text-left py-2 px-2">Game</th>
                      <th className="text-right py-2 px-2">Plays</th>
                      <th className="text-right py-2 px-2">Unique</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentActivity.map((a, i) => (
                      <tr key={i} className="border-b border-[#222] text-white">
                        <td className="py-2 px-2 text-xs">
                          {new Date(a.date).toLocaleDateString()}
                        </td>
                        <td className="py-2 px-2 text-xs truncate max-w-[120px]">{a.game.title}</td>
                        <td className="text-right py-2 px-2 text-xs">{a.plays}</td>
                        <td className="text-right py-2 px-2 text-xs">{a.uniquePlayers}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-12">
                <Gamepad2 className="h-12 w-12 text-[#4a4a6a] mx-auto mb-4" />
                <p className="text-[#4a4a6a] font-arcade text-xs">No analytics data yet</p>
                <p className="text-[#4a4a6a] font-arcade text-[10px] mt-2">
                  Data will appear as players interact with your games
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </main>

      <Footer />
    </div>
  )
}
