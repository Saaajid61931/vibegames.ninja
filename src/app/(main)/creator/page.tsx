import { redirect } from "next/navigation"
import Link from "next/link"
import { 
  Terminal, 
  Gamepad2, 
  TrendingUp, 
  DollarSign, 
  Plus,
  Play,
  Heart,
  Eye,
  Edit,
  ExternalLink
} from "lucide-react"
import { auth } from "@/lib/auth"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { Button } from "@/components/ui/button"
import prisma from "@/lib/prisma"
import { formatNumber, formatCurrency, timeAgo, CATEGORIES } from "@/lib/utils"

export const dynamic = "force-dynamic"

async function getCreatorData(userId: string) {
  const [games, totalStats] = await Promise.all([
    prisma.game.findMany({
      where: { creatorId: userId },
      orderBy: { createdAt: "desc" },
    }),
    prisma.game.aggregate({
      where: { creatorId: userId },
      _sum: {
        plays: true,
        likes: true,
      },
    }),
  ])

  const totalEarnings = await prisma.earnings.aggregate({
    where: { userId, status: "COMPLETED" },
    _sum: { amount: true },
  })

  const pendingEarnings = await prisma.earnings.aggregate({
    where: { userId, status: "PENDING" },
    _sum: { amount: true },
  })

  return {
    games,
    stats: {
      totalGames: games.length,
      totalPlays: totalStats._sum.plays || 0,
      totalLikes: totalStats._sum.likes || 0,
      totalEarnings: totalEarnings._sum.amount || 0,
      pendingEarnings: pendingEarnings._sum.amount || 0,
    },
  }
}

export default async function CreatorDashboard() {
  const session = await auth()
  
  if (!session?.user) {
    redirect("/login")
  }

  const { games, stats } = await getCreatorData(session.user.id)

  return (
    <div className="min-h-screen flex flex-col bg-[#0d0d15]">
      <Header />
      
      <main className="flex-1 container mx-auto px-4 py-6 sm:py-8">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-8 pb-8 border-b-2 border-[#4a4a6a]">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Terminal className="h-5 w-5 text-[#ffff00]" />
              <span className="text-[#ffff00] font-arcade text-sm">CREATOR.DASHBOARD</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white font-arcade">
              WELCOME_BACK, {(session.user.name || session.user.username || "CREATOR").toUpperCase()}
            </h1>
          </div>
          <Link href="/upload">
            <Button className="gap-2 font-arcade">
              <Plus className="h-4 w-4" />
              [UPLOAD_GAME]
            </Button>
          </Link>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-8">
          <div className="border-2 border-[#4a4a6a] p-4">
            <div className="flex items-center gap-2 mb-2">
              <Gamepad2 className="h-4 w-4 text-[#ffff00]" />
              <span className="text-xs text-[#4a4a6a] font-arcade">TOTAL_GAMES</span>
            </div>
            <p className="text-2xl sm:text-3xl font-bold text-white font-arcade">{stats.totalGames}</p>
          </div>
          
          <div className="border-2 border-[#4a4a6a] p-4">
            <div className="flex items-center gap-2 mb-2">
              <Play className="h-4 w-4 text-[#ffff00]" />
              <span className="text-xs text-[#4a4a6a] font-arcade">TOTAL_PLAYS</span>
            </div>
            <p className="text-2xl sm:text-3xl font-bold text-white font-arcade">{formatNumber(stats.totalPlays)}</p>
          </div>
          
          <div className="border-2 border-[#4a4a6a] p-4">
            <div className="flex items-center gap-2 mb-2">
              <Heart className="h-4 w-4 text-[#ff0040]" />
              <span className="text-xs text-[#4a4a6a] font-arcade">TOTAL_LIKES</span>
            </div>
            <p className="text-2xl sm:text-3xl font-bold text-white font-arcade">{formatNumber(stats.totalLikes)}</p>
          </div>
          
          <div className="border-2 border-[#4a4a6a] p-4">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="h-4 w-4 text-[#ffff00]" />
              <span className="text-xs text-[#4a4a6a] font-arcade">EARNINGS</span>
            </div>
            <p className="text-2xl sm:text-3xl font-bold text-[#ffff00] font-arcade">{formatCurrency(stats.totalEarnings)}</p>
          </div>
        </div>

        {/* Pending Earnings Alert */}
        {stats.pendingEarnings > 0 && (
          <div className="mb-6 border-2 border-[#ffa500] bg-[#ffa500]/10 p-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="flex items-center gap-3">
                <DollarSign className="h-5 w-5 text-[#ffa500]" />
                <p className="text-[#ffa500] font-arcade">
                  PENDING_PAYOUT: <strong>{formatCurrency(stats.pendingEarnings)}</strong>
                </p>
              </div>
              <Button variant="outline" size="sm" className="font-arcade text-[#ffa500] border-[#ffa500] hover:bg-[#ffa500]/10 w-full sm:w-auto">
                [REQUEST_PAYOUT]
              </Button>
            </div>
          </div>
        )}

        {/* Games List */}
        <div className="border-2 border-[#4a4a6a]">
          <div className="border-b-2 border-[#4a4a6a] px-4 py-3 bg-[#1a1a2e] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Gamepad2 className="h-4 w-4 text-[#ffff00]" />
              <span className="font-arcade text-sm">YOUR_GAMES [{games.length}]</span>
            </div>
          </div>
          
          <div className="bg-[#0d0d15]">
            {games.length > 0 ? (
                <div className="divide-y divide-[#222]">
                {games.map((game) => {
                  const category = CATEGORIES.find(c => c.value === game.category)
                  
                  return (
                    <div
                      key={game.id}
                      className="flex flex-col sm:flex-row sm:items-center gap-4 p-4 hover:bg-[#1a1a2e] transition-colors"
                    >
                      {/* Thumbnail */}
                      <div className="w-full sm:w-20 h-32 sm:h-12 bg-[#1a1a2e] border border-[#4a4a6a] overflow-hidden flex-shrink-0">
                        {game.thumbnail ? (
                          <img 
                            src={game.thumbnail} 
                            alt={game.title}
                            className="w-full h-full object-cover grayscale"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Gamepad2 className="h-5 w-5 text-[#4a4a6a]" />
                          </div>
                        )}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <h3 className="font-arcade text-white truncate">{game.title}</h3>
                          
                          {/* Status Badge */}
                          <span className={`px-2 py-0.5 text-xs font-arcade ${
                            game.status === "PUBLISHED" ? "bg-[#ffff00]/20 text-[#ffff00]" :
                            game.status === "PENDING" ? "bg-[#ffa500]/20 text-[#ffa500]" :
                            game.status === "REJECTED" ? "bg-[#ff0040]/20 text-[#ff0040]" :
                            game.status === "EXPIRED" ? "bg-[#4a4a6a]/20 text-[#4a4a6a]" :
                            "bg-[#4a4a6a] text-[#4a4a6a]"
                          }`}>
                            {game.status}
                          </span>
                        </div>
                        
                        <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-xs text-[#4a4a6a] font-arcade">
                          <span>[{category?.label.toUpperCase() || "GAME"}]</span>
                          <span className="flex items-center gap-1">
                            <Eye className="h-3 w-3" />
                            {formatNumber(game.plays)}
                          </span>
                          <span className="flex items-center gap-1 text-[#ff0040]">
                            <Heart className="h-3 w-3" />
                            {formatNumber(game.likes)}
                          </span>
                          <span>{timeAgo(new Date(game.createdAt))}</span>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex w-full sm:w-auto items-center justify-end gap-1">
                        {game.status === "PUBLISHED" && (
                          <Link href={`/play/${game.slug}`} target="_blank">
                            <Button variant="ghost" size="icon" className="text-[#4a4a6a] hover:text-[#ffff00]">
                              <ExternalLink className="h-4 w-4" />
                            </Button>
                          </Link>
                        )}
                        <Link href={`/creator/games/${game.id}/edit`}>
                          <Button variant="ghost" size="icon" className="text-[#4a4a6a] hover:text-white">
                            <Edit className="h-4 w-4" />
                          </Button>
                        </Link>
                        <Link href={`/creator/games/${game.id}/analytics`}>
                          <Button variant="ghost" size="icon" className="text-[#4a4a6a] hover:text-[#ffff00]">
                            <TrendingUp className="h-4 w-4" />
                          </Button>
                        </Link>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="text-center py-16">
                <Gamepad2 className="h-12 w-12 text-[#4a4a6a] mx-auto mb-4" />
                <h3 className="text-lg font-arcade text-white mb-2">NO_GAMES_FOUND</h3>
                <p className="text-[#4a4a6a] mb-6 font-arcade text-sm">Upload your first AI-made game and start earning!</p>
                <Link href="/upload">
                  <Button className="gap-2 font-arcade">
                    <Plus className="h-4 w-4" />
                    [UPLOAD_FIRST_GAME]
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  )
}
