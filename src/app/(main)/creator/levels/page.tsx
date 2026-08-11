import { redirect } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import {
  Terminal,
  Layers,
  Star,
  Play,
  Eye,
  Edit,
  Gamepad2,
  ArrowLeft,
} from "lucide-react"
import { auth } from "@/lib/auth"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { Button } from "@/components/ui/button"
import prisma from "@/lib/prisma"
import { formatNumber, timeAgo } from "@/lib/utils"

export const dynamic = "force-dynamic"

export const metadata = {
  title: "My Levels | VibeGames",
  description: "Manage all community levels you've created across games.",
}

async function getMyLevels(userId: string) {
  const [levels, totalStats] = await Promise.all([
    prisma.level.findMany({
      where: { creatorId: userId },
      select: {
        id: true,
        name: true,
        description: true,
        status: true,
        plays: true,
        avgRating: true,
        ratingCount: true,
        createdAt: true,
        game: {
          select: {
            id: true,
            slug: true,
            title: true,
            thumbnail: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.level.aggregate({
      where: { creatorId: userId },
      _sum: { plays: true },
      _count: true,
    }),
  ])

  return {
    levels,
    stats: {
      totalLevels: totalStats._count,
      totalPlays: totalStats._sum.plays || 0,
    },
  }
}

export default async function MyLevelsPage() {
  const session = await auth()

  if (!session?.user) {
    redirect("/login")
  }

  const { levels, stats } = await getMyLevels(session.user.id)

  return (
    <div className="min-h-screen flex flex-col bg-canvas">
      <Header />

      <main className="flex-1 container mx-auto px-4 py-6 sm:py-8">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-8 pb-8 border-b-2 border-border-strong">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Terminal className="h-5 w-5 text-arcade-yellow" />
              <span className="text-arcade-yellow font-arcade text-sm">MY_LEVELS</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white font-arcade">
              COMMUNITY LEVELS
            </h1>
          </div>
          <Link href="/creator">
            <Button variant="arcade-outline" size="sm" className="gap-2 font-arcade">
              <ArrowLeft className="h-4 w-4" />
              DASHBOARD
            </Button>
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3 sm:gap-4 mb-8">
          <div className="border-2 border-border-strong p-4">
            <div className="flex items-center gap-2 mb-2">
              <Layers className="h-4 w-4 text-arcade-yellow" />
              <span className="text-xs text-text-secondary font-arcade">TOTAL_LEVELS</span>
            </div>
            <p className="text-2xl sm:text-3xl font-bold text-white font-arcade">{stats.totalLevels}</p>
          </div>
          <div className="border-2 border-border-strong p-4">
            <div className="flex items-center gap-2 mb-2">
              <Play className="h-4 w-4 text-arcade-yellow" />
              <span className="text-xs text-text-secondary font-arcade">TOTAL_PLAYS</span>
            </div>
            <p className="text-2xl sm:text-3xl font-bold text-white font-arcade">{formatNumber(stats.totalPlays)}</p>
          </div>
        </div>

        {/* Levels List */}
        <div className="border-2 border-border-strong">
          <div className="border-b-2 border-border-strong px-4 py-3 bg-surface-2 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Layers className="h-4 w-4 text-arcade-yellow" />
              <span className="font-arcade text-sm">YOUR_LEVELS [{levels.length}]</span>
            </div>
          </div>

          <div className="bg-canvas">
            {levels.length > 0 ? (
              <div className="divide-y divide-[#222]">
                {levels.map((level) => (
                  <div
                    key={level.id}
                    className="flex flex-col sm:flex-row sm:items-center gap-4 p-4 hover:bg-surface-2 transition-colors"
                  >
                    {/* Game thumbnail */}
                    <div className="w-full sm:w-20 h-32 sm:h-12 bg-surface-2 border border-border-strong overflow-hidden flex-shrink-0">
                      {level.game.thumbnail ? (
                        <Image
                          src={level.game.thumbnail}
                          alt={`Thumbnail for ${level.game.title}`}
                          width={80}
                          height={48}
                          sizes="(max-width: 640px) 100vw, 80px"
                          className="w-full h-full object-cover grayscale"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Gamepad2 className="h-5 w-5 text-text-secondary" />
                        </div>
                      )}
                    </div>

                    {/* Level info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <h3 className="font-arcade text-white truncate">{level.name}</h3>
                        <span
                          className={`px-2 py-0.5 text-xs font-arcade ${
                            level.status === "PUBLISHED"
                              ? "bg-arcade-yellow/20 text-arcade-yellow"
                              : level.status === "HIDDEN"
                                ? "bg-arcade-orange/20 text-arcade-orange"
                                : "bg-arcade-red/20 text-arcade-red"
                          }`}
                        >
                          {level.status}
                        </span>
                      </div>

                      {level.description && (
                        <p className="font-arcade text-xs text-text-secondary line-clamp-1 mb-1">
                          {level.description}
                        </p>
                      )}

                      <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-xs text-text-secondary font-arcade">
                        <Link
                          href={`/play/${level.game.slug}`}
                          className="hover:text-arcade-yellow transition-colors"
                        >
                          [{level.game.title.toUpperCase()}]
                        </Link>
                        <span className="flex items-center gap-1">
                          <Eye className="h-3 w-3" />
                          {formatNumber(level.plays)}
                        </span>
                        <span className="flex items-center gap-1 text-arcade-yellow">
                          <Star className="h-3 w-3 fill-arcade-yellow" />
                          {level.avgRating.toFixed(1)}
                          <span className="text-text-secondary">({level.ratingCount})</span>
                        </span>
                        <span>{timeAgo(new Date(level.createdAt))}</span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex w-full sm:w-auto items-center justify-end gap-1">
                      {level.status === "PUBLISHED" && (
                        <Link href={`/play/${level.game.slug}?level=${level.id}`} target="_blank">
                          <Button variant="ghost" size="icon" className="text-text-secondary hover:text-arcade-yellow" aria-label={`Play ${level.name}`}>
                            <Play className="h-4 w-4" />
                          </Button>
                        </Link>
                      )}
                      <Link href={`/play/${level.game.slug}/editor?level=${level.id}`}>
                        <Button variant="ghost" size="icon" className="text-text-secondary hover:text-white" aria-label={`Edit ${level.name}`}>
                          <Edit className="h-4 w-4" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-16">
                <Layers className="h-12 w-12 text-text-secondary mx-auto mb-4" />
                <h3 className="text-lg font-arcade text-white mb-2">NO_LEVELS_FOUND</h3>
                <p className="text-text-secondary mb-6 font-arcade text-sm">
                  You haven&apos;t created any community levels yet. Find a game with level editor support and start building!
                </p>
                <Link href="/games?editor=true">
                  <Button className="gap-2 font-arcade">
                    <Gamepad2 className="h-4 w-4" />
                    [BROWSE_EDITOR_GAMES]
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
