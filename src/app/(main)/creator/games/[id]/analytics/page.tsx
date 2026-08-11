import { notFound, redirect } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { ArrowLeft, Edit3, Eye, Heart, Play } from "lucide-react"
import { auth } from "@/lib/auth"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { Button } from "@/components/ui/button"
import prisma from "@/lib/prisma"
import { formatNumber } from "@/lib/utils"

export const metadata = {
  title: "Game Analytics",
  description: "See impressions, plays, and likes for one game.",
}

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
      impressions: true,
      plays: true,
      likes: true,
      creatorId: true,
    },
  })

  if (!game) {
    notFound()
  }

  if (game.creatorId !== session.user.id) {
    redirect("/creator")
  }

  const hasComparableImpressionData =
    game.impressions > 0 && game.impressions >= game.plays
  const playRate = hasComparableImpressionData
    ? (game.plays / game.impressions) * 100
    : null
  const likeRate =
    game.plays > 0 ? Math.min(100, (game.likes / game.plays) * 100) : 0

  const metrics = [
    {
      label: "Impressions",
      value: game.impressions,
      description: "People who opened this game page",
      icon: Eye,
      color: "var(--color-arcade-cyan)",
    },
    {
      label: "Plays",
      value: game.plays,
      description: "People who actually pressed Play",
      icon: Play,
      color: "var(--color-arcade-yellow)",
    },
    {
      label: "Likes",
      value: game.likes,
      description: "Players who liked this game",
      icon: Heart,
      color: "var(--color-arcade-red)",
    },
  ] as const

  return (
    <div className="vg-shell flex min-h-screen flex-col">
      <Header />

      <main id="main-content" className="container mx-auto max-w-5xl flex-1 px-4 py-6 sm:py-10">
        <Link
          href="/creator/analytics"
          className="mb-5 inline-flex items-center gap-2 text-sm text-text-secondary transition-colors hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to all analytics
        </Link>

        <section className="vg-panel overflow-hidden">
          <div className="flex flex-col gap-5 p-6 sm:flex-row sm:items-center sm:p-8">
            {game.thumbnail ? (
              <Image
                src={game.thumbnail}
                alt={"Thumbnail for " + game.title}
                width={224}
                height={126}
                className="aspect-video w-full border-2 border-border-strong object-cover sm:w-56"
              />
            ) : null}
            <div className="min-w-0 flex-1">
              <span className="vg-kicker">Game analytics</span>
              <h1 className="mt-4 truncate text-3xl font-bold tracking-tight text-white">
                {game.title}
              </h1>
              <p className="mt-2 text-sm text-text-secondary">
                A simple view of discovery, plays, and player appreciation.
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <Button asChild variant="outline" size="sm">
                  <Link href={"/play/" + game.slug}>View game</Link>
                </Button>
                <Button asChild variant="ghost" size="sm" className="gap-2">
                  <Link href={"/creator/games/" + game.id + "/edit"}>
                    <Edit3 className="h-4 w-4" />
                    Edit game
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-6 grid gap-4 md:grid-cols-3" aria-label="Game totals">
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
                    <p className="text-sm font-medium text-text-secondary">
                      {metric.label}
                    </p>
                    <p className="mt-3 text-3xl font-bold text-white">
                      {formatNumber(metric.value)}
                    </p>
                    <p className="mt-2 text-xs leading-5 text-text-tertiary">
                      {metric.description}
                    </p>
                  </div>
                  <span
                    className="grid h-10 w-10 shrink-0 place-items-center border-2 bg-canvas"
                    style={{ borderColor: metric.color, color: metric.color }}
                  >
                    <Icon className="h-5 w-5" />
                  </span>
                </div>
              </div>
            )
          })}
        </section>

        <section className="vg-panel mt-6 p-6 sm:p-8" aria-labelledby="game-funnel-title">
          <span className="vg-kicker text-arcade-yellow">At a glance</span>
          <h2 id="game-funnel-title" className="mt-3 text-2xl font-semibold text-white">
            From discovery to appreciation
          </h2>
          <p className="mt-2 text-sm leading-6 text-text-secondary">
            Use this simple path to decide what needs attention. More impressions means discovery is working. More plays means the game page earns the click. More likes means the experience connected.
          </p>

          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <div className="border border-border-strong bg-canvas p-4">
              <p className="text-sm text-text-secondary">Impressions that became plays</p>
              <p className="mt-2 text-3xl font-bold text-white">
                {playRate === null ? "New" : `${playRate.toFixed(0)}%`}
              </p>
            </div>
            <div className="border border-border-strong bg-canvas p-4">
              <p className="text-sm text-text-secondary">Players who left a like</p>
              <p className="mt-2 text-3xl font-bold text-white">{likeRate.toFixed(0)}%</p>
            </div>
          </div>

          <div className="mt-5 border-l-4 border-arcade-cyan bg-surface-2 p-4 text-sm leading-6 text-text-secondary">
            {!hasComparableImpressionData
              ? "Impression tracking started recently, so older plays are not included in the comparison yet. Use the three totals while new data builds up."
              : playRate !== null && playRate < 20
                ? "Try a clearer thumbnail, title, or description so more visitors choose to play."
                : likeRate < 5
                  ? "Players are starting the game. Focus next on the opening experience and controls."
                  : "The game is converting attention into plays and likes. Keep building on what works."}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
