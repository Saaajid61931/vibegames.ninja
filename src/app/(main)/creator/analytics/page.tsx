import { redirect } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Eye, Gamepad2, Heart, Play } from "lucide-react"
import { auth } from "@/lib/auth"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { Button } from "@/components/ui/button"
import prisma from "@/lib/prisma"
import { formatNumber } from "@/lib/utils"

export const dynamic = "force-dynamic"

export const metadata = {
  title: "Simple Analytics",
  description: "See how many people discover, play, and like your games.",
}

async function getAnalyticsData(userId: string) {
  const [totals, games] = await Promise.all([
    prisma.game.aggregate({
      where: { creatorId: userId },
      _sum: { impressions: true, plays: true, likes: true },
      _count: true,
    }),
    prisma.game.findMany({
      where: { creatorId: userId },
      select: {
        id: true,
        slug: true,
        title: true,
        status: true,
        impressions: true,
        plays: true,
        likes: true,
      },
      orderBy: [{ impressions: "desc" }, { plays: "desc" }],
    }),
  ])

  return {
    summary: {
      games: totals._count,
      impressions: totals._sum.impressions || 0,
      plays: totals._sum.plays || 0,
      likes: totals._sum.likes || 0,
    },
    games,
  }
}

export default async function CreatorAnalyticsPage() {
  const session = await auth()

  if (!session?.user?.id) {
    redirect("/login")
  }

  const { summary, games } = await getAnalyticsData(session.user.id)
  const hasComparableImpressionData =
    summary.impressions > 0 && summary.impressions >= summary.plays
  const playRate = hasComparableImpressionData
    ? (summary.plays / summary.impressions) * 100
    : null

  const metrics = [
    {
      label: "Impressions",
      value: summary.impressions,
      description: "Game pages opened",
      icon: Eye,
      color: "#20d8ff",
    },
    {
      label: "Plays",
      value: summary.plays,
      description: "Players who pressed Play",
      icon: Play,
      color: "#facc15",
    },
    {
      label: "Likes",
      value: summary.likes,
      description: "Players who liked a game",
      icon: Heart,
      color: "#ff3d6e",
    },
  ] as const

  return (
    <div className="vg-shell flex min-h-screen flex-col">
      <Header />

      <main id="main-content" className="container mx-auto max-w-6xl flex-1 px-4 py-6 sm:py-10">
        <Link
          href="/creator"
          className="mb-5 inline-flex items-center gap-2 text-sm text-[var(--color-text-secondary)] transition-colors hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to creator studio
        </Link>

        <section className="vg-panel vg-soft-grid p-6 sm:p-8">
          <span className="vg-kicker">Simple analytics</span>
          <h1 className="mt-4 text-3xl font-bold tracking-tight text-white sm:text-4xl">
            See what players are doing
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--color-text-secondary)] sm:text-base">
            Three numbers tell the story: how many people found your games, how many chose to play, and how many liked what they played.
          </p>
          <div className="mt-5 flex flex-wrap gap-2 text-xs text-[var(--color-text-tertiary)]">
            <span className="vg-chip">{summary.games} {summary.games === 1 ? "game" : "games"}</span>
            <span className="vg-chip">
              {playRate === null
                ? "Impression tracking started recently"
                : `${playRate.toFixed(0)}% of impressions became plays`}
            </span>
          </div>
        </section>

        <section className="mt-6 grid gap-4 md:grid-cols-3" aria-label="Analytics totals">
          {metrics.map((metric) => {
            const Icon = metric.icon
            return (
              <div
                key={metric.label}
                className="vg-metric p-5"
                style={{ "--metric-color": metric.color } as React.CSSProperties}
              >
                <div className="relative z-10 flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-medium text-[var(--color-text-secondary)]">{metric.label}</p>
                    <p className="mt-3 text-3xl font-bold text-white sm:text-4xl">{formatNumber(metric.value)}</p>
                    <p className="mt-2 text-xs text-[var(--color-text-tertiary)]">{metric.description}</p>
                  </div>
                  <span
                    className="grid h-10 w-10 place-items-center border-2 bg-[var(--color-base)]"
                    style={{ borderColor: metric.color, color: metric.color }}
                  >
                    <Icon className="h-5 w-5" />
                  </span>
                </div>
              </div>
            )
          })}
        </section>

        <section className="mt-8" aria-labelledby="game-breakdown-title">
          <div className="mb-4">
            <span className="vg-kicker text-[#facc15]">Game breakdown</span>
            <h2 id="game-breakdown-title" className="mt-3 text-2xl font-semibold text-white">
              Performance by game
            </h2>
            <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
              Compare only the numbers that help you decide what to improve next.
            </p>
          </div>

          {games.length > 0 ? (
            <div className="vg-panel overflow-x-auto">
              <table className="w-full min-w-[680px] text-left">
                <thead className="border-b border-[var(--color-border)] bg-white/[0.025] text-xs text-[var(--color-text-tertiary)]">
                  <tr>
                    <th className="px-5 py-4 font-medium">Game</th>
                    <th className="px-4 py-4 text-right font-medium">Impressions</th>
                    <th className="px-4 py-4 text-right font-medium">Plays</th>
                    <th className="px-4 py-4 text-right font-medium">Likes</th>
                    <th className="px-5 py-4 text-right font-medium">Play rate</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--color-border)]">
                  {games.map((game) => {
                    const gamePlayRate =
                      game.impressions > 0 && game.impressions >= game.plays
                        ? (game.plays / game.impressions) * 100
                        : null

                    return (
                      <tr key={game.id} className="transition-colors hover:bg-white/[0.025]">
                        <td className="px-5 py-4">
                          <Link
                            href={`/creator/games/${game.id}/analytics`}
                            className="font-medium text-white hover:text-[var(--color-primary-hover)]"
                          >
                            {game.title}
                          </Link>
                          <p className="mt-1 text-xs capitalize text-[var(--color-text-tertiary)]">{game.status.toLowerCase()}</p>
                        </td>
                        <td className="px-4 py-4 text-right font-semibold text-white">{formatNumber(game.impressions)}</td>
                        <td className="px-4 py-4 text-right font-semibold text-white">{formatNumber(game.plays)}</td>
                        <td className="px-4 py-4 text-right font-semibold text-white">{formatNumber(game.likes)}</td>
                        <td className="px-5 py-4 text-right text-sm text-[var(--color-text-secondary)]">
                          {gamePlayRate === null ? "New" : `${gamePlayRate.toFixed(0)}%`}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="vg-panel px-5 py-14 text-center">
              <Gamepad2 className="mx-auto h-12 w-12 text-[var(--color-text-tertiary)]" />
              <h3 className="mt-4 text-lg font-semibold text-white">No games to measure yet</h3>
              <p className="mt-2 text-sm text-[var(--color-text-secondary)]">Publish a game and its activity will appear here.</p>
              <Button asChild className="mt-5">
                <Link href="/upload">Publish a game</Link>
              </Button>
            </div>
          )}
        </section>
      </main>

      <Footer />
    </div>
  )
}
