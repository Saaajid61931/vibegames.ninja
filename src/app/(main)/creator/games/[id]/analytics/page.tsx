import { redirect, notFound } from "next/navigation"
import Link from "next/link"
import { ChevronLeft, Play, Heart, Eye, TrendingUp, Calendar, Gamepad2, BarChart3 } from "lucide-react"
import { auth } from "@/lib/auth"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import prisma from "@/lib/prisma"
import { formatNumber, timeAgo } from "@/lib/utils"

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function GameAnalyticsPage({ params }: PageProps) {
  const session = await auth()

  if (!session?.user?.id) {
    redirect("/login")
  }

  const { id } = await params

  const game = await prisma.game.findUnique({
    where: { id },
    select: {
      id: true,
      title: true,
      slug: true,
      thumbnail: true,
      plays: true,
      likes: true,
      shares: true,
      avgRating: true,
      ratingCount: true,
      createdAt: true,
      publishedAt: true,
      creatorId: true,
    },
  })

  if (!game) {
    notFound()
  }

  if (game.creatorId !== session.user.id) {
    redirect("/creator")
  }

  const analytics = await prisma.gameAnalytics.findMany({
    where: { gameId: id },
    orderBy: { date: "desc" },
    take: 30,
  })

  const totalRevenue = analytics.reduce((sum, a) => sum + a.revenue, 0)
  const totalAdImpressions = analytics.reduce((sum, a) => sum + a.adImpressions, 0)
  const totalAdClicks = analytics.reduce((sum, a) => sum + a.adClicks, 0)
  const avgSessionTime = analytics.length
    ? analytics.reduce((sum, a) => sum + a.avgSessionTime, 0) / analytics.length
    : 0

  return (
    <div className="min-h-screen flex flex-col bg-[#0d0d15]">
      <Header />

      <main className="flex-1 container mx-auto px-4 py-6 sm:py-8">
        <Link
          href="/creator"
          className="inline-flex items-center gap-2 text-[#4a4a6a] hover:text-[#ffff00] mb-6 transition-colors font-arcade text-sm"
        >
          <ChevronLeft className="h-4 w-4" />
          BACK TO DASHBOARD
        </Link>

        <div className="mb-8">
          <div className="flex items-start gap-4">
            {game.thumbnail && (
              <img
                src={game.thumbnail}
                alt={game.title}
                className="w-20 h-12 object-cover border border-[#4a4a6a] hidden sm:block"
              />
            )}
            <div>
              <h1 className="text-xl sm:text-2xl font-semibold text-white flex items-center gap-3 font-arcade">
                <BarChart3 className="h-6 w-6 text-[#ffff00]" />
                {game.title}
              </h1>
              <p className="text-[#4a4a6a] mt-1 font-arcade text-sm">
                Analytics & Performance
              </p>
            </div>
          </div>
        </div>

        {/* Main Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-8">
          <Card className="border-2 border-[#4a4a6a] bg-[#1a1a2e]">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Play className="h-4 w-4 text-[#0080ff]" />
                <span className="text-xs text-[#4a4a6a] font-arcade">TOTAL PLAYS</span>
              </div>
              <p className="text-2xl sm:text-3xl font-bold text-white font-arcade">
                {formatNumber(game.plays)}
              </p>
            </CardContent>
          </Card>

          <Card className="border-2 border-[#4a4a6a] bg-[#1a1a2e]">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Heart className="h-4 w-4 text-[#ff0040]" />
                <span className="text-xs text-[#4a4a6a] font-arcade">TOTAL LIKES</span>
              </div>
              <p className="text-2xl sm:text-3xl font-bold text-white font-arcade">
                {formatNumber(game.likes)}
              </p>
            </CardContent>
          </Card>

          <Card className="border-2 border-[#4a4a6a] bg-[#1a1a2e]">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="h-4 w-4 text-[#00ff40]" />
                <span className="text-xs text-[#4a4a6a] font-arcade">REVENUE</span>
              </div>
              <p className="text-2xl sm:text-3xl font-bold text-[#00ff40] font-arcade">
                ${totalRevenue.toFixed(2)}
              </p>
            </CardContent>
          </Card>

          <Card className="border-2 border-[#4a4a6a] bg-[#1a1a2e]">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Eye className="h-4 w-4 text-[#ffff00]" />
                <span className="text-xs text-[#4a4a6a] font-arcade">AVG SESSION</span>
              </div>
              <p className="text-2xl sm:text-3xl font-bold text-white font-arcade">
                {avgSessionTime.toFixed(1)}m
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Additional Stats */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <Card className="border-2 border-[#4a4a6a] bg-[#1a1a2e]">
            <CardHeader>
              <CardTitle className="font-arcade text-sm text-[#ffff00]">AD PERFORMANCE</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-[#4a4a6a] font-arcade text-sm">Ad Impressions</span>
                <span className="text-white font-arcade">{formatNumber(totalAdImpressions)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[#4a4a6a] font-arcade text-sm">Ad Clicks</span>
                <span className="text-white font-arcade">{formatNumber(totalAdClicks)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[#4a4a6a] font-arcade text-sm">CTR</span>
                <span className="text-white font-arcade">
                  {totalAdImpressions > 0
                    ? ((totalAdClicks / totalAdImpressions) * 100).toFixed(2)
                    : 0}
                  %
                </span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 border-[#4a4a6a] bg-[#1a1a2e]">
            <CardHeader>
              <CardTitle className="font-arcade text-sm text-[#ffff00]">GAME INFO</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-[#4a4a6a] font-arcade text-sm">Created</span>
                <span className="text-white font-arcade text-sm">
                  {timeAgo(new Date(game.createdAt))}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[#4a4a6a] font-arcade text-sm">Published</span>
                <span className="text-white font-arcade text-sm">
                  {game.publishedAt ? timeAgo(new Date(game.publishedAt)) : "Not published"}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[#4a4a6a] font-arcade text-sm">Rating</span>
                <span className="text-white font-arcade">
                  {game.avgRating.toFixed(1)} ({game.ratingCount} reviews)
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[#4a4a6a] font-arcade text-sm">Shares</span>
                <span className="text-white font-arcade">{formatNumber(game.shares)}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Analytics */}
        <Card className="border-2 border-[#4a4a6a] bg-[#1a1a2e]">
          <CardHeader>
            <CardTitle className="font-arcade text-sm text-[#ffff00] flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              RECENT ACTIVITY (LAST 30 DAYS)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {analytics.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm font-arcade">
                  <thead>
                    <tr className="text-[#4a4a6a] border-b border-[#4a4a6a]">
                      <th className="text-left py-2 px-2">Date</th>
                      <th className="text-right py-2 px-2">Plays</th>
                      <th className="text-right py-2 px-2">Unique</th>
                      <th className="text-right py-2 px-2">Avg Time</th>
                      <th className="text-right py-2 px-2">Revenue</th>
                    </tr>
                  </thead>
                  <tbody>
                    {analytics.map((a) => (
                      <tr key={a.id} className="border-b border-[#222] text-white">
                        <td className="py-2 px-2">
                          {new Date(a.date).toLocaleDateString()}
                        </td>
                        <td className="text-right py-2 px-2">{a.plays}</td>
                        <td className="text-right py-2 px-2">{a.uniquePlayers}</td>
                        <td className="text-right py-2 px-2">{a.avgSessionTime.toFixed(1)}m</td>
                        <td className="text-right py-2 px-2 text-[#00ff40]">
                          ${a.revenue.toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-12">
                <Gamepad2 className="h-12 w-12 text-[#4a4a6a] mx-auto mb-4" />
                <p className="text-[#4a4a6a] font-arcade">No analytics data yet</p>
                <p className="text-[#4a4a6a] font-arcade text-xs mt-2">
                  Data will appear as players interact with your game
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
