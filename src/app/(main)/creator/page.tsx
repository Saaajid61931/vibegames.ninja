import { redirect } from "next/navigation"
import Link from "next/link"
import {
  Bug,
  Edit,
  ExternalLink,
  Gamepad2,
  Lightbulb,
  Plus,
  Settings,
  Terminal,
  Trophy,
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
import { timeAgo } from "@/lib/utils"

export const dynamic = "force-dynamic"

export const metadata = {
  title: "Creator Dashboard",
  description: "Manage your games and act on useful player feedback.",
}

async function getCreatorData(userId: string) {
  const [games, feedback] = await Promise.all([
    prisma.game.findMany({
      where: { creatorId: userId },
      select: {
        id: true,
        slug: true,
        title: true,
        thumbnail: true,
        thumbnailSlides: true,
        status: true,
        updatedAt: true,
      },
      orderBy: { updatedAt: "desc" },
    }),
    prisma.report.findMany({
      where: {
        reason: { in: ["BUG", "IDEA"] },
        game: {
          creatorId: userId,
        },
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
          select: {
            id: true,
            slug: true,
            title: true,
          },
        },
      },
    }),
  ])

  const countsByGame = new Map<
    string,
    { bugs: number; ideas: number }
  >()

  for (const item of feedback) {
    if (!["PENDING", "REVIEWING"].includes(item.status)) continue

    const counts = countsByGame.get(item.game.id) || { bugs: 0, ideas: 0 }
    if (item.reason === "BUG") counts.bugs += 1
    if (item.reason === "IDEA") counts.ideas += 1
    countsByGame.set(item.game.id, counts)
  }

  return {
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

  const { games, feedback } = await getCreatorData(session.user.id)
  const creatorName = (
    session.user.name ||
    session.user.username ||
    "CREATOR"
  ).toUpperCase()

  return (
    <div className="flex min-h-screen flex-col bg-[#0d0d15]">
      <Header />

      <main className="container mx-auto flex-1 px-4 py-6 sm:py-8">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4 border-b-2 border-[#4a4a6a] pb-6">
          <div>
            <div className="flex items-center gap-2">
              <Terminal className="h-5 w-5 text-[#ffff00]" />
              <span className="font-arcade text-sm text-[#ffff00]">
                CREATOR.DASHBOARD
              </span>
            </div>
            <h1 className="mt-2 font-arcade text-xl font-bold text-white sm:text-2xl">
              {creatorName}
            </h1>
            <p className="mt-2 font-arcade text-xs text-[#8b93a6]">
              Build games and act on useful player feedback.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button asChild className="gap-2 font-arcade">
              <Link href="/upload">
                <Plus className="h-4 w-4" />
                UPLOAD GAME
              </Link>
            </Button>
            <Button
              asChild
              variant="arcade-outline"
              className="gap-2 font-arcade"
            >
              <Link href="/jams">
                <Trophy className="h-4 w-4" />
                JAMS
              </Link>
            </Button>
            <Button
              asChild
              variant="arcade-outline"
              className="gap-2 font-arcade"
            >
              <Link href="/settings">
                <Settings className="h-4 w-4" />
                SETTINGS
              </Link>
            </Button>
          </div>
        </div>

        <CreatorFeedbackInbox initialItems={feedback} />

        <section className="border-2 border-[#4a4a6a]">
          <div className="flex items-center gap-2 border-b-2 border-[#4a4a6a] bg-[#1a1a2e] px-4 py-3">
            <Gamepad2 className="h-4 w-4 text-[#ffff00]" />
            <h2 className="font-arcade text-sm text-white">
              YOUR GAMES [{games.length}]
            </h2>
          </div>

          {games.length > 0 ? (
            <div className="divide-y divide-[#222] bg-[#0d0d15]">
              {games.map((game) => (
                <article
                  key={game.id}
                  className="flex flex-col gap-4 p-4 transition-colors hover:bg-[#1a1a2e] sm:flex-row sm:items-center"
                >
                  <div className="relative h-32 w-full shrink-0 overflow-hidden border border-[#4a4a6a] bg-[#1a1a2e] sm:h-14 sm:w-24">
                    {game.thumbnail ? (
                      <GameThumbnailSlideshow
                        title={game.title}
                        thumbnail={game.thumbnail}
                        thumbnailSlides={game.thumbnailSlides}
                        sizes="96px"
                        imageClassName="object-cover"
                        showIndicators={false}
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center">
                        <Gamepad2 className="h-5 w-5 text-[#4a4a6a]" />
                      </div>
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="truncate font-arcade text-sm text-white">
                        {game.title}
                      </h3>
                      <span
                        className={`px-2 py-0.5 font-arcade text-[9px] ${
                          game.status === "PUBLISHED"
                            ? "bg-[#ffff00]/15 text-[#ffff00]"
                            : "bg-[#4a4a6a]/20 text-[#8b93a6]"
                        }`}
                      >
                        {game.status}
                      </span>
                    </div>

                    <div className="mt-2 flex flex-wrap items-center gap-4 font-arcade text-[10px] text-[#596176]">
                      <span className="flex items-center gap-1 text-[#f43f5e]">
                        <Bug className="h-3.5 w-3.5" />
                        {game.feedbackCounts.bugs} OPEN BUGS
                      </span>
                      <span className="flex items-center gap-1 text-[#00d1ff]">
                        <Lightbulb className="h-3.5 w-3.5" />
                        {game.feedbackCounts.ideas} NEW IDEAS
                      </span>
                      <span>
                        UPDATED {timeAgo(game.updatedAt).toUpperCase()}
                      </span>
                    </div>
                  </div>

                  <div className="flex shrink-0 justify-end gap-2">
                    {game.status === "PUBLISHED" ? (
                      <Button
                        asChild
                        variant="ghost"
                        size="icon"
                        aria-label={`Open ${game.title}`}
                      >
                        <Link href={`/play/${game.slug}`} target="_blank">
                          <ExternalLink className="h-4 w-4" />
                        </Link>
                      </Button>
                    ) : null}
                    <Button
                      asChild
                      variant="ghost"
                      size="icon"
                      aria-label={`Edit ${game.title}`}
                    >
                      <Link href={`/creator/games/${game.id}/edit`}>
                        <Edit className="h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="bg-[#0d0d15] px-4 py-16 text-center">
              <Gamepad2 className="mx-auto h-10 w-10 text-[#4a4a6a]" />
              <h3 className="mt-4 font-arcade text-sm text-white">
                NO GAMES YET
              </h3>
              <p className="mt-2 font-arcade text-xs text-[#8b93a6]">
                Upload your first playable game.
              </p>
              <Button asChild className="mt-5 gap-2 font-arcade">
                <Link href="/upload">
                  <Plus className="h-4 w-4" />
                  UPLOAD GAME
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
