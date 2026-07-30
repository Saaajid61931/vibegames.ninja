import Link from "next/link"
import {
  ArrowRight,
  ChevronLeft,
  Clock3,
  Cpu,
  Edit3,
  Heart,
  MessageCircle,
  Play,
  Smartphone,
} from "lucide-react"
import { CommentsSection } from "@/components/games/comments-section"
import { CompactFeedbackPanel } from "@/components/games/compact-feedback-panel"
import { CommunityLevels } from "@/components/games/community-levels"
import { LikeButton } from "@/components/games/like-button"
import { PlayPageSidebar } from "@/components/games/play-page-sidebar"
import { PlayTracker } from "@/components/games/play-tracker"
import { PlayableGameSection } from "@/components/games/playable-game-section"
import { ReportGameButton } from "@/components/games/report-game-button"
import { ShareButton } from "@/components/games/share-button"
import { DeleteGameButton } from "@/components/games/delete-game-button"
import { Footer } from "@/components/layout/footer"
import { Header } from "@/components/layout/header"
import { Button } from "@/components/ui/button"
import {
  getJamPanelMessage,
  type PlayPageData,
} from "@/lib/play-page-data"
import { formatNumber, timeAgo } from "@/lib/utils"

interface PlayPageViewProps {
  data: PlayPageData
  selectedLevelId?: string
  userId?: string | null
  userRole?: string | null
}

export function PlayPageView({
  data,
  selectedLevelId,
  userId,
  userRole,
}: PlayPageViewProps) {
  const {
    game,
    category,
    creatorProfileHref,
    followersCount,
    creatorGamesCount,
    isFollowing,
    isLiked,
    primaryJam,
    primaryJamAction,
    primaryJamStatus,
    relatedGames,
    selectedLevel,
    tagList,
    mobileSupportText,
    mobileTagLabel,
    gameJsonLd,
    breadcrumbJsonLd,
    canAutoCaptureThumbnails,
  } = data
  const isAuthenticated = Boolean(userId)
  const isOwner = userId === game.creator.id

  return (
    <div className="vg-shell flex min-h-screen flex-col">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(gameJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <Header />

      <main id="main-content" className="flex-1">
        <div className="container mx-auto max-w-7xl px-4 py-5 sm:py-8">
          <Link
            href="/games"
            className="mb-5 inline-flex items-center gap-2 text-sm text-[var(--color-text-secondary)] transition-colors hover:text-white"
          >
            <ChevronLeft className="h-4 w-4" />
            Browse all games
          </Link>

          <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="min-w-0">
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <span className="vg-chip border-[#facc15]/35 text-[#facc15]">
                  {category?.label || "Game"}
                </span>
                {game.supportsMobile ? (
                  <span className="vg-chip border-[#22c55e]/35 text-[#6ee7a0]">
                    <Smartphone className="h-3.5 w-3.5" />
                    {mobileTagLabel.replaceAll("_", " ")}
                  </span>
                ) : null}
                {game.isAIGenerated ? (
                  <span className="vg-chip">Made with AI</span>
                ) : null}
                {tagList.slice(0, 3).map((tag) => (
                  <span key={tag.trim()} className="vg-chip">
                    #{tag.trim()}
                  </span>
                ))}
              </div>
              <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
                {game.title}
              </h1>
              <p className="mt-2 text-sm text-[var(--color-text-secondary)]">
                Created by{" "}
                <Link
                  href={creatorProfileHref}
                  className="font-medium text-white hover:text-[var(--color-arcade-cyan)]"
                >
                  {game.studioProfile?.displayName ||
                    game.creator.name ||
                    game.creator.username ||
                    "Anonymous creator"}
                </Link>
                <span aria-hidden="true"> · </span>
                {timeAgo(new Date(game.createdAt))}
              </p>
            </div>

            {isOwner ? (
              <Button asChild variant="outline" size="sm" className="gap-2 self-start">
                <Link href={`/creator/games/${game.id}/edit`}>
                  <Edit3 className="h-4 w-4" />
                  Edit game
                </Link>
              </Button>
            ) : null}
          </div>

          <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_19rem] xl:grid-cols-[minmax(0,1fr)_21rem]">
            <div className="min-w-0 space-y-6">
              <PlayTracker
                gameId={game.id}
                levelId={selectedLevel?.id ?? null}
              />

              <PlayableGameSection
                gameId={game.id}
                title={game.title}
                gameUrl={game.gameUrl}
                runtimeLabel={`${game.title
                  .toLowerCase()
                  .replace(/\s+/g, "_")}.exe`}
                supportsMobile={game.supportsMobile}
                mobileOrientation={game.mobileOrientation}
                levelData={selectedLevel?.data}
                levelName={selectedLevel?.name}
                levelDescription={selectedLevel?.description}
                selectedLevelId={selectedLevel?.id ?? null}
                hasGhostSharing={game.hasGhostSharing}
                isAuthenticated={isAuthenticated}
                canAutoCaptureThumbnails={canAutoCaptureThumbnails}
              />

              <section
                aria-label="Game actions and activity"
                className="vg-panel flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-[var(--color-text-secondary)]">
                  <span className="inline-flex items-center gap-2">
                    <Play className="h-4 w-4 text-[#facc15]" />
                    <strong className="font-semibold text-white">
                      {formatNumber(game.plays)}
                    </strong>{" "}
                    plays
                  </span>
                  <span className="inline-flex items-center gap-2">
                    <Heart className="h-4 w-4 text-[#ff3d6e]" />
                    <strong className="font-semibold text-white">
                      {formatNumber(game.likes)}
                    </strong>{" "}
                    likes
                  </span>
                  <span className="inline-flex items-center gap-2">
                    <MessageCircle className="h-4 w-4 text-[#20d8ff]" />
                    <strong className="font-semibold text-white">
                      {game._count.comments}
                    </strong>{" "}
                    comments
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <LikeButton
                    gameId={game.id}
                    slug={game.slug}
                    initialLikes={game.likes}
                    initialLiked={isLiked}
                  />
                  <ShareButton gameId={game.id} title={game.title} />
                </div>
              </section>

              {primaryJam ? (
                <section className="vg-panel border-[#facc15]/30 p-5">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <span className="vg-kicker text-[#facc15]">
                        {primaryJamStatus === "ACTIVE"
                          ? "Live game jam"
                          : "Game jam entry"}
                      </span>
                      <h2 className="mt-3 text-lg font-semibold text-white">
                        {primaryJam.title}
                      </h2>
                      <p className="mt-1 text-sm leading-6 text-[var(--color-text-secondary)]">
                        {primaryJam.theme
                          ? `Theme: ${primaryJam.theme}. `
                          : ""}
                        {getJamPanelMessage(primaryJam)}
                      </p>
                    </div>
                    <Button asChild variant="outline" className="gap-2">
                      <Link
                        href={
                          primaryJamAction?.href ||
                          `/jams/${primaryJam.slug}`
                        }
                      >
                        {primaryJamAction?.label || "View jam"}
                        <ArrowRight className="h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                </section>
              ) : null}

              <section className="vg-panel p-5 sm:p-6" aria-labelledby="about-game">
                <span className="vg-kicker">About this game</span>
                <h2 id="about-game" className="mt-3 text-xl font-semibold text-white">
                  What to expect
                </h2>
                <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-[var(--color-text-secondary)] sm:text-base">
                  {game.description}
                </p>

                {game.instructions ? (
                  <div className="mt-6 rounded-xl border border-[var(--color-border)] bg-black/15 p-4">
                    <h3 className="text-sm font-semibold text-white">
                      How to play
                    </h3>
                    <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-[var(--color-text-secondary)]">
                      {game.instructions}
                    </p>
                  </div>
                ) : null}

                {game.latestUpdateNote ? (
                  <div className="mt-4 rounded-xl border border-[#20d8ff]/25 bg-[#20d8ff]/5 p-4">
                    <p className="text-xs font-semibold uppercase tracking-wider text-[#7ee7ff]">
                      Latest update
                    </p>
                    <p className="mt-2 text-sm text-[var(--color-text-secondary)]">
                      {game.latestUpdateNote}
                    </p>
                  </div>
                ) : null}

                <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2 border-t border-[var(--color-border)] pt-4 text-xs text-[var(--color-text-tertiary)]">
                  <span className="inline-flex items-center gap-2">
                    <Clock3 className="h-3.5 w-3.5" />
                    Uploaded {timeAgo(new Date(game.createdAt))}
                  </span>
                  <span className="inline-flex items-center gap-2">
                    <Smartphone className="h-3.5 w-3.5" />
                    {mobileSupportText}
                  </span>
                  {game.aiModel ? (
                    <span className="inline-flex items-center gap-2">
                      <Cpu className="h-3.5 w-3.5" />
                      Built with {game.aiModel}
                    </span>
                  ) : null}
                </div>

                <div className="mt-4 flex flex-wrap items-center gap-2">
                  <ReportGameButton
                    gameId={game.id}
                    gameTitle={game.title}
                  />
                  {userRole === "ADMIN" ? (
                    <DeleteGameButton
                      gameId={game.id}
                      gameTitle={game.title}
                    />
                  ) : null}
                </div>
              </section>

              <CompactFeedbackPanel
                gameId={game.id}
                slug={game.slug}
                isAuthenticated={isAuthenticated}
              />

              {selectedLevel ? (
                <section className="vg-panel p-5">
                  <span className="vg-kicker text-[#facc15]">
                    Current community level
                  </span>
                  <h2 className="mt-3 text-lg font-semibold text-white">
                    {selectedLevel.name}
                  </h2>
                  {selectedLevel.description ? (
                    <p className="mt-2 text-sm text-[var(--color-text-secondary)]">
                      {selectedLevel.description}
                    </p>
                  ) : null}
                  <p className="mt-2 text-xs text-[var(--color-text-tertiary)]">
                    Made by{" "}
                    {selectedLevel.creator.username ||
                      selectedLevel.creator.name ||
                      "anonymous"}
                  </p>
                  {userId === selectedLevel.creator.id ? (
                    <Button
                      asChild
                      variant="outline"
                      size="sm"
                      className="mt-4"
                    >
                      <Link
                        href={`/play/${game.slug}/editor?level=${selectedLevel.id}`}
                      >
                        Edit this level
                      </Link>
                    </Button>
                  ) : null}
                </section>
              ) : null}

              {game.hasLevelEditor ? (
                <CommunityLevels
                  gameId={game.id}
                  slug={game.slug}
                  selectedLevelId={selectedLevelId}
                  currentUserId={userId ?? null}
                />
              ) : null}

              <CommentsSection
                gameId={game.id}
                slug={game.slug}
                initialComments={game.comments}
                initialCommentsCount={game._count.comments}
              />
            </div>

            <aside className="self-start lg:sticky lg:top-24">
              <PlayPageSidebar
                game={game}
                category={category}
                creatorProfileHref={creatorProfileHref}
                creatorGamesCount={creatorGamesCount}
                followersCount={followersCount}
                initialFollowing={isFollowing}
                relatedGames={relatedGames}
              />
            </aside>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
