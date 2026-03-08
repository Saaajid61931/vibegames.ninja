import { redirect } from "next/navigation"
import Link from "next/link"
import { 
  Terminal, 
  Gamepad2, 
  TrendingUp, 
  Plus,
  Play,
  Heart,
  Eye,
  Edit,
  ExternalLink,
  Layers,
  Settings,
} from "lucide-react"
import { auth } from "@/lib/auth"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { GameThumbnailSlideshow } from "@/components/games/game-thumbnail-slideshow"
import { Button } from "@/components/ui/button"
import prisma from "@/lib/prisma"
import { formatNumber, timeAgo, CATEGORIES } from "@/lib/utils"

export const dynamic = "force-dynamic"

export const metadata = {
  title: "Creator Dashboard",
  description: "Manage your games, view stats, and upload new games to VibeGames.",
}

async function getCreatorData(userId: string) {
  const [games, totalStats, levelCount] = await Promise.all([
    prisma.game.findMany({
      where: { creatorId: userId },
      select: {
        id: true,
        slug: true,
        title: true,
        thumbnail: true,
        thumbnailSlides: true,
        category: true,
        plays: true,
        likes: true,
        status: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.game.aggregate({
      where: { creatorId: userId },
      _sum: {
        plays: true,
        likes: true,
      },
    }),
    prisma.level.count({
      where: { creatorId: userId },
    }),
  ])

  return {
    games,
    stats: {
      totalGames: games.length,
      totalPlays: totalStats._sum.plays || 0,
      totalLikes: totalStats._sum.likes || 0,
      levelCount,
    },
  }
}

export default async function CreatorDashboard() {
  const session = await auth()
  
  if (!session?.user) {
    redirect("/login")
  }

  const { games, stats } = await getCreatorData(session.user.id)
  const publishedGames = games.filter((game) => game.status === "PUBLISHED")
  const draftGames = games.filter((game) => game.status !== "PUBLISHED")
  const topGame = [...publishedGames].sort((a, b) => (b.plays + b.likes * 3) - (a.plays + a.likes * 3))[0]

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
          <div className="flex flex-wrap gap-2">
            <Link href="/upload">
              <Button className="gap-2 font-arcade">
                <Plus className="h-4 w-4" />
                [UPLOAD_GAME]
              </Button>
            </Link>
            <Link href="/creator/analytics">
              <Button variant="arcade-outline" className="gap-2 font-arcade">
                <TrendingUp className="h-4 w-4" />
                [ANALYTICS]
              </Button>
            </Link>
            <Link href="/settings">
              <Button variant="arcade-outline" className="gap-2 font-arcade">
                <Settings className="h-4 w-4" />
                [SETTINGS]
              </Button>
            </Link>
          </div>
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
        </div>

        {/* Quick Links */}
        <div className="mb-8 grid gap-4 lg:grid-cols-3">
          <div className="border-2 border-[#4a4a6a] bg-[#1a1a2e] p-4">
            <p className="font-arcade text-[11px] text-[#ffff00]">NEXT BEST STEP</p>
            <h2 className="mt-2 font-arcade text-sm text-white">
              {publishedGames.length === 0 ? "Publish your first game" : "Give players another reason to return"}
            </h2>
            <p className="mt-2 font-arcade text-xs text-[#8b93a6]">
              {publishedGames.length === 0
                ? "Upload one polished game, add a strong thumbnail, and share the play page the moment it is live."
                : "Post updates, add thumbnail slides, and keep your top game easy to share from outside the platform."}
            </p>
          </div>
          <div className="border-2 border-[#4a4a6a] bg-[#1a1a2e] p-4">
            <p className="font-arcade text-[11px] text-[#00d1ff]">PUBLISH HEALTH</p>
            <h2 className="mt-2 font-arcade text-sm text-white">{publishedGames.length} live / {draftGames.length} in review</h2>
            <p className="mt-2 font-arcade text-xs text-[#8b93a6]">
              Keep at least one fresh game, one mobile-friendly game, and one shareable flagship on your public profile.
            </p>
          </div>
          <div className="border-2 border-[#4a4a6a] bg-[#1a1a2e] p-4">
            <p className="font-arcade text-[11px] text-[#ff0040]">FLAGSHIP GAME</p>
            <h2 className="mt-2 font-arcade text-sm text-white">{topGame?.title || "No published flagship yet"}</h2>
            <p className="mt-2 font-arcade text-xs text-[#8b93a6]">
              {topGame
                ? `${formatNumber(topGame.plays)} plays and ${formatNumber(topGame.likes)} likes. Keep sharing this page and refresh its thumbnails often.`
                : "Your first published hit will become the best asset for traffic and profile growth."}
            </p>
          </div>
        </div>

        {stats.levelCount > 0 && (
          <div className="mb-6">
            <Link href="/creator/levels">
              <div className="border-2 border-[#4a4a6a] p-4 hover:bg-[#1a1a2e] transition-colors flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Layers className="h-5 w-5 text-[#ffff00]" />
                  <div>
                    <span className="font-arcade text-sm text-white">MY_LEVELS</span>
                    <p className="font-arcade text-xs text-[#4a4a6a] mt-0.5">
                      {stats.levelCount} community level{stats.levelCount !== 1 ? "s" : ""} created
                    </p>
                  </div>
                </div>
                <ExternalLink className="h-4 w-4 text-[#4a4a6a]" />
              </div>
            </Link>
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
                      <div className="relative w-full sm:w-20 h-32 sm:h-12 bg-[#1a1a2e] border border-[#4a4a6a] overflow-hidden flex-shrink-0">
                        {game.thumbnail ? (
                          <GameThumbnailSlideshow
                            title={game.title}
                            thumbnail={game.thumbnail}
                            thumbnailSlides={game.thumbnailSlides}
                            sizes="80px"
                            imageClassName="object-cover grayscale"
                            showIndicators={false}
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
                <p className="text-[#4a4a6a] mb-6 font-arcade text-sm">Upload your first AI-made game and share it with the community!</p>
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
