import { redirect } from "next/navigation"
import Link from "next/link"
import {
  BarChart3,
  Bug,
  Edit3,
  ExternalLink,
  Eye,
  Gamepad2,
  Heart,
  Lightbulb,
  Play,
  Plus,
  Settings,
} from "lucide-react"
import { auth } from "@/lib/auth"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { GameThumbnailSlideshow } from "@/components/games/game-thumbnail-slideshow"
import {
  CreatorFeedbackInbox,
  type CreatorFeedbackItem,
} from "@/components/creator/creator-feedback-inbox"
import { Button } from "@/components/ui/button"
import prisma from "@/lib/prisma"
import { formatNumber, timeAgo } from "@/lib/utils"

export const dynamic = "force-dynamic"

export const metadata = {
  title: "Creator Studio",
  description: "Publish games, understand player activity, and act on useful feedback.",
}

async function getCreatorData(userId: string) {
  // Vercel's database pool is configured for one connection, so creator data
  // must be loaded sequentially instead of competing for that connection.
  const games = await prisma.game.findMany({
      where: { creatorId: userId },
      select: {
        id: true,
        slug: true,
        title: true,
        thumbnail: true,
        thumbnailSlides: true,
        status: true,
        impressions: true,
        plays: true,
        likes: true,
        updatedAt: true,
      },
      orderBy: { updatedAt: "desc" },
    })
  const feedback = await prisma.report.findMany({
      where: {
        reason: { in: ["BUG", "IDEA"] },
        game: { creatorId: userId },
      },
      orderBy: { createdAt: "desc" },
      take: 100,
      select: {
        id: true,
        reason: true,
        description: true,
        status: true,
        createdAt: true,
        resolvedAt: true,
        game: {
          select: { id: true, slug: true, title: true },
        },
      },
    })
  const totals = await prisma.game.aggregate({
    where: { creatorId: userId },
    _sum: { impressions: true, plays: true, likes: true },
  })

  const countsByGame = new Map<string, { bugs: number; ideas: number }>()

  for (const item of feedback) {
    if (!["PENDING", "REVIEWING"].includes(item.status)) continue
    const counts = countsByGame.get(item.game.id) || { bugs: 0, ideas: 0 }
    if (item.reason === "BUG") counts.bugs += 1
    if (item.reason === "IDEA") counts.ideas += 1
    countsByGame.set(item.game.id, counts)
  }

  return {
    totals: {
      impressions: totals._sum.impressions || 0,
      plays: totals._sum.plays || 0,
      likes: totals._sum.likes || 0,
    },
    games: games.map((game) => ({
      ...game,
      feedbackCounts: countsByGame.get(game.id) || { bugs: 0, ideas: 0 },
    })),
    feedback: feedback
      .filter(
        (
          item
        ): item is typeof item & {
          reason: "BUG" | "IDEA"
          status: "PENDING" | "REVIEWING" | "RESOLVED" | "DISMISSED"
        } =>
          (item.reason === "BUG" || item.reason === "IDEA") &&
          ["PENDING", "REVIEWING", "RESOLVED", "DISMISSED"].includes(
            item.status
          )
      )
      .map(
        (item): CreatorFeedbackItem => ({
          id: item.id,
          reason: item.reason,
          description: item.description,
          status: item.status,
          createdAt: item.createdAt.toISOString(),
          resolvedAt: item.resolvedAt?.toISOString() || null,
          game: {
            slug: item.game.slug,
            title: item.game.title,
          },
        })
      ),
  }
}

export default async function CreatorDashboard() {
  const session = await auth()

  if (!session?.user?.id) {
    redirect("/login")
  }

  const { games, feedback, totals } = await getCreatorData(session.user.id)
  const creatorName =
    session.user.name || session.user.username || "Creator"

  const metrics = [
    {
      label: "Impressions",
      description: "People who opened your game pages",
      value: totals.impressions,
      icon: Eye,
      color: "var(--color-arcade-cyan)",
    },
    {
      label: "Plays",
      description: "People who actually pressed Play",
      value: totals.plays,
      icon: Play,
      color: "var(--color-arcade-yellow)",
    },
    {
      label: "Likes",
      description: "Players who saved a game as a favorite",
      value: totals.likes,
      icon: Heart,
      color: "var(--color-arcade-red)",
    },
  ] as const

  return (
    <div className="vg-shell flex min-h-screen flex-col">
      <Header />

      <main id="main-content" className="container mx-auto max-w-7xl flex-1 px-4 py-6 sm:py-8">
        <section className="overflow-hidden border border-border-strong bg-surface">
          <div className="grid lg:grid-cols-[minmax(0,1fr)_22rem]">
            <div className="p-6 sm:p-8 lg:border-r lg:border-border-strong">
              <span className="vg-kicker">Creator studio</span>
              <h1 className="mt-4 text-3xl font-bold tracking-tight text-white sm:text-4xl">
                Welcome back, {creatorName}
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-text-secondary sm:text-base">
                Publish your next game, see what players are opening and playing, and turn useful feedback into better updates.
              </p>
            </div>

            <aside className="border-t border-border-strong bg-canvas p-5 lg:border-t-0 sm:p-6">
              <p className="text-kicker text-text-tertiary">Quick actions</p>
              <div className="mt-4 grid gap-2">
                <Button asChild size="lg" className="justify-start gap-2 rounded-sm">
                  <Link href="/upload">
                    <Plus className="h-5 w-5" />
                    Publish a game
                  </Link>
                </Button>
                <Button asChild variant="outline" size="lg" className="justify-start gap-2 rounded-sm">
                  <Link href="/creator/analytics">
                    <BarChart3 className="h-5 w-5" />
                    View analytics
                  </Link>
                </Button>
                <Button asChild variant="ghost" size="lg" className="justify-start gap-2 rounded-sm">
                  <Link href="/settings">
                    <Settings className="h-5 w-5" />
                    Settings
                  </Link>
                </Button>
              </div>
            </aside>
          </div>
        </section>

        <section
          className="mt-5 grid overflow-hidden border border-border-strong bg-surface md:grid-cols-3"
          aria-label="Creator totals"
        >
          {metrics.map((metric, index) => {
            const Icon = metric.icon
            return (
              <div
                key={metric.label}
                className={`relative p-5 sm:p-6 ${
                  index < metrics.length - 1
                    ? "border-b border-border-strong md:border-b-0 md:border-r"
                    : ""
                }`}
              >
                <span
                  className="absolute inset-y-0 left-0 w-1"
                  style={{ backgroundColor: metric.color }}
                  aria-hidden="true"
                />
                <div className="flex items-start justify-between gap-4 pl-2">
                  <div>
                    <p className="text-kicker text-text-secondary">
                      {metric.label}
                    </p>
                    <p className="mt-2 text-3xl font-bold tabular-nums text-white sm:text-4xl">
                      {formatNumber(metric.value)}
                    </p>
                    <p className="mt-2 text-xs leading-5 text-text-tertiary">
                      {metric.description}
                    </p>
                  </div>
                  <span
                    className="grid h-10 w-10 shrink-0 place-items-center border-2"
                    style={{
                      borderColor: metric.color,
                      backgroundColor: metric.color,
                      color: "var(--color-canvas)",
                    }}
                  >
                    <Icon className="h-5 w-5" />
                  </span>
                </div>
              </div>
            )
          })}
        </section>

        <div className="mt-6">
          <CreatorFeedbackInbox initialItems={feedback} />
        </div>

        <section className="mt-7" aria-labelledby="creator-games-title">
          <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
            <div>
              <span className="vg-kicker text-arcade-yellow">Your library</span>
              <h2 id="creator-games-title" className="mt-3 text-2xl font-semibold text-white">
                Your games
              </h2>
              <p className="mt-1 text-sm text-text-secondary">
                {games.length} {games.length === 1 ? "game" : "games"} in your studio
              </p>
            </div>
            <Button asChild variant="outline" className="gap-2 rounded-sm">
              <Link href="/upload">
                <Plus className="h-4 w-4" />
                Add another game
              </Link>
            </Button>
          </div>

          {games.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {games.map((game) => (
                <article
                  key={game.id}
                  className="flex flex-col overflow-hidden border-2 border-border-strong bg-surface transition-colors hover:border-primary"
                >
                  <div className="relative aspect-video overflow-hidden bg-black/30">
                    {game.thumbnail ? (
                      <GameThumbnailSlideshow
                        title={game.title}
                        thumbnail={game.thumbnail}
                        thumbnailSlides={game.thumbnailSlides}
                        sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw"
                        imageClassName="object-cover"
                        showIndicators={false}
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center">
                        <Gamepad2 className="h-10 w-10 text-text-tertiary" />
                      </div>
                    )}
                    <span
                      className={`absolute right-3 top-3 border px-2.5 py-1 text-kicker  ${
                        game.status === "PUBLISHED"
                          ? "border-success bg-canvas text-success-text"
                          : "border-border-strong bg-canvas text-text-secondary"
                      }`}
                    >
                      {game.status.toLowerCase()}
                    </span>
                  </div>

                  <div className="flex flex-1 flex-col p-5">
                    <h3 className="truncate text-lg font-semibold text-white">{game.title}</h3>
                    <p className="mt-1 text-xs text-text-tertiary">
                      Updated {timeAgo(game.updatedAt)}
                    </p>

                    <div className="mt-4 grid grid-cols-3 border border-border-strong bg-canvas text-center">
                      <div className="p-3">
                        <p className="text-base font-semibold text-white">{formatNumber(game.impressions)}</p>
                        <p className="mt-1 text-xs text-text-tertiary">Impressions</p>
                      </div>
                      <div className="border-x border-border-strong p-3">
                        <p className="text-base font-semibold text-white">{formatNumber(game.plays)}</p>
                        <p className="mt-1 text-xs text-text-tertiary">Plays</p>
                      </div>
                      <div className="p-3">
                        <p className="text-base font-semibold text-white">{formatNumber(game.likes)}</p>
                        <p className="mt-1 text-xs text-text-tertiary">Likes</p>
                      </div>
                    </div>

                    {(game.feedbackCounts.bugs > 0 || game.feedbackCounts.ideas > 0) ? (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {game.feedbackCounts.bugs > 0 ? (
                          <span className="vg-chip border-arcade-red text-danger-text">
                            <Bug className="h-3.5 w-3.5" />
                            {game.feedbackCounts.bugs} open
                          </span>
                        ) : null}
                        {game.feedbackCounts.ideas > 0 ? (
                          <span className="vg-chip border-arcade-cyan text-info-text">
                            <Lightbulb className="h-3.5 w-3.5" />
                            {game.feedbackCounts.ideas} ideas
                          </span>
                        ) : null}
                      </div>
                    ) : null}

                    <div className="mt-auto flex flex-wrap gap-2 pt-5">
                      {game.status === "PUBLISHED" ? (
                        <Button asChild variant="outline" size="sm" className="gap-2 rounded-sm">
                          <Link href={`/play/${game.slug}`}>
                            <ExternalLink className="h-4 w-4" />
                            View
                          </Link>
                        </Button>
                      ) : null}
                      <Button asChild variant="outline" size="sm" className="gap-2 rounded-sm">
                        <Link href={`/creator/games/${game.id}/edit`}>
                          <Edit3 className="h-4 w-4" />
                          Edit
                        </Link>
                      </Button>
                      <Button asChild variant="ghost" size="sm" className="gap-2 rounded-sm">
                        <Link href={`/creator/games/${game.id}/analytics`}>
                          <BarChart3 className="h-4 w-4" />
                          Analytics
                        </Link>
                      </Button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="border-3 border-dashed border-border-strong bg-surface px-5 py-16 text-center shadow-hard-4">
              <Gamepad2 className="mx-auto h-12 w-12 text-arcade-cyan" />
              <h3 className="heading-pixel-md mt-4 text-white">Publish your first game</h3>
              <p className="mx-auto mt-2 max-w-md text-sm text-text-secondary">
                Upload a ZIP or HTML file, add a few details, and your game can be playable in minutes.
              </p>
              <Button asChild variant="arcade" className="mt-5 gap-2">
                <Link href="/upload">
                  <Plus className="h-4 w-4" />
                  Publish a game
                </Link>
              </Button>
            </div>
          )}
        </section>
      </main>

      <Footer />
    </div>
  )
}
