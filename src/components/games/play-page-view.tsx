import Link from "next/link"
import { SaveGameButton } from "@/components/community/save-game-button"
import { GameCommunityPanel } from "@/components/community/game-community-panel"
import {
  ArrowRight,
  ChevronLeft,
  Clock3,
  Cpu,
  Edit3,
  Gamepad2,
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
    <div className="vg-shell flex min-h-screen flex-col bg-canvas">
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
        <div className="container mx-auto max-w-[1440px] px-4 py-4 sm:px-6 sm:py-6">
          <nav aria-label="Breadcrumb" className="mb-5 flex min-w-0 items-center gap-3 text-xs text-text-secondary">
            <Link href="/games" className="inline-flex min-h-10 shrink-0 items-center gap-1.5 transition-colors hover:text-arcade-yellow">
              <ChevronLeft className="h-3.5 w-3.5" />Back to the arcade
            </Link>
            <span aria-hidden="true" className="text-border-strong">/</span>
            <span className="truncate" aria-current="page">{game.title}</span>
          </nav>

          <div className="vg-play-hero mb-6 flex flex-col gap-5 px-4 py-5 sm:px-6 sm:py-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="min-w-0">
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <span className="vg-chip border-arcade-yellow/35 text-arcade-yellow">
                  <Gamepad2 className="h-3.5 w-3.5" />
                  {category?.label || "Game"}
                </span>
                {game.supportsMobile ? (
                  <span className="vg-chip border-success/35 text-success-text">
                    <Smartphone className="h-3.5 w-3.5" />
                    {mobileTagLabel.replaceAll("_", " ")}
                  </span>
                ) : null}
                {game.isAIGenerated ? (
                  <span className="vg-chip">Made with AI</span>
                ) : null}
              </div>
              <h1 className="heading-pixel-lg max-w-4xl break-words font-bold text-white">
                {game.title}
              </h1>
              <p className="mt-3 text-sm text-text-secondary">
                Created by{" "}
                <Link
                  href={creatorProfileHref}
                  className="font-medium text-white hover:text-arcade-cyan"
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

            <div className="flex shrink-0 flex-wrap items-center gap-2">
              <a href="#game-details" className="inline-flex h-10 items-center border border-border-strong bg-canvas/50 px-3 text-xs font-medium text-text-secondary transition-colors hover:border-arcade-cyan hover:text-white">Game details</a>
              {game.instructions ? <a href="#how-to-play" className="inline-flex h-10 items-center gap-2 border border-border-strong bg-canvas/50 px-3 text-xs font-medium text-text-secondary transition-colors hover:border-arcade-cyan hover:text-white"><Gamepad2 className="h-3.5 w-3.5" />How to play</a> : null}
              {isOwner ? (
                <Button asChild variant="outline" size="sm" className="gap-2">
                  <Link href={`/creator/games/${game.id}/edit`}><Edit3 className="h-4 w-4" />Edit game</Link>
                </Button>
              ) : null}
            </div>
          </div>

          <div className="grid grid-cols-[minmax(0,1fr)] items-start gap-6 lg:grid-cols-[minmax(0,1fr)_19rem] xl:grid-cols-[minmax(0,1fr)_21rem]">
            <div className="min-w-0 space-y-5 sm:space-y-6">
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
                className="vg-play-panel flex flex-col gap-4 p-4 xl:flex-row xl:items-center xl:justify-between"
              >
                <div className="grid grid-cols-3 divide-x divide-border text-text-secondary xl:min-w-72">
                  <div className="pr-4">
                    <span className="flex items-center gap-2"><Play className="h-3.5 w-3.5 text-arcade-yellow" /><strong className="text-lg font-semibold tabular-nums text-white">{formatNumber(game.plays)}</strong></span>
                    <span className="mt-1 block text-[10px] uppercase tracking-wider">Plays</span>
                  </div>
                  <div className="px-4">
                    <span className="flex items-center gap-2"><Heart className="h-3.5 w-3.5 text-arcade-red" /><strong className="text-lg font-semibold tabular-nums text-white">{formatNumber(game.likes)}</strong></span>
                    <span className="mt-1 block text-[10px] uppercase tracking-wider">Likes</span>
                  </div>
                  <a href="#game-discussion" className="pl-4 transition-colors hover:text-white">
                    <span className="flex items-center gap-2"><MessageCircle className="h-3.5 w-3.5 text-arcade-cyan" /><strong className="text-lg font-semibold tabular-nums text-white">{formatNumber(game._count.comments)}</strong></span>
                    <span className="mt-1 block text-[10px] uppercase tracking-wider">Comments</span>
                  </a>
                </div>

                <div className="flex flex-wrap items-center gap-2 border-t border-border pt-4 xl:border-0 xl:pt-0 [&_button]:min-h-11 [&_button]:rounded-none">
                  <LikeButton
                    gameId={game.id}
                    slug={game.slug}
                    initialLikes={game.likes}
                    initialLiked={isLiked}
                  />
                  <ShareButton gameId={game.id} title={game.title} />
                  <SaveGameButton gameId={game.id} slug={game.slug} />
                </div>
              </section>

              {primaryJam ? (
                <section className="vg-play-panel border-arcade-yellow/50 p-4 sm:p-5">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <span className="vg-kicker text-arcade-yellow">
                        {primaryJamStatus === "ACTIVE"
                          ? "Live game jam"
                          : "Game jam entry"}
                      </span>
                      <h2 className="mt-3 text-lg font-semibold text-white">
                        {primaryJam.title}
                      </h2>
                      <p className="mt-1 text-sm leading-6 text-text-secondary">
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

              <section id="game-details" className="vg-play-panel scroll-mt-[calc(var(--vg-header-height,6rem)+1rem)] p-4 sm:p-6" aria-labelledby="about-game">
                <div className="flex items-center gap-3">
                  <span className="grid h-9 w-9 place-items-center border border-arcade-cyan/30 bg-arcade-cyan/5 text-arcade-cyan"><Gamepad2 className="h-4 w-4" /></span>
                  <h2 id="about-game" className="heading-pixel-sm text-white">Inside the game</h2>
                </div>
                <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-text-secondary sm:text-base">
                  {game.description}
                </p>

                {tagList.length > 0 ? (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {tagList.map((tag) => <span key={tag.trim()} className="vg-chip">#{tag.trim()}</span>)}
                  </div>
                ) : null}

                {game.instructions ? (
                  <div id="how-to-play" className="mt-6 scroll-mt-[calc(var(--vg-header-height,6rem)+1rem)] border-l-2 border-arcade-yellow bg-canvas p-4 sm:p-5">
                    <h3 className="text-kicker text-arcade-yellow">How to play</h3>
                    <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-text-secondary">
                      {game.instructions}
                    </p>
                  </div>
                ) : null}

                {game.latestUpdateNote ? (
                  <div className="mt-4 border border-arcade-cyan/25 bg-arcade-cyan/5 p-4">
                    <p className="text-xs font-semibold uppercase tracking-wider text-info-text">
                      Latest update
                    </p>
                    <p className="mt-2 text-sm text-text-secondary">
                      {game.latestUpdateNote}
                    </p>
                  </div>
                ) : null}

                <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2 border-t border-border pt-4 text-xs text-text-tertiary">
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

              <GameCommunityPanel gameId={game.id} />

              <CompactFeedbackPanel
                gameId={game.id}
                slug={game.slug}
                isAuthenticated={isAuthenticated}
              />

              {selectedLevel ? (
                <section className="vg-play-panel p-4 sm:p-5">
                  <span className="vg-kicker text-arcade-yellow">
                    Current community level
                  </span>
                  <h2 className="mt-3 text-lg font-semibold text-white">
                    {selectedLevel.name}
                  </h2>
                  {selectedLevel.description ? (
                    <p className="mt-2 text-sm text-text-secondary">
                      {selectedLevel.description}
                    </p>
                  ) : null}
                  <p className="mt-2 text-xs text-text-tertiary">
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

              <div id="game-discussion" className="scroll-mt-[calc(var(--vg-header-height,6rem)+1rem)]">
                <CommentsSection
                  gameId={game.id}
                  slug={game.slug}
                  initialComments={game.comments}
                  initialCommentsCount={game._count.comments}
                />
              </div>
            </div>

            <aside className="min-w-0 self-start lg:sticky lg:top-[calc(var(--vg-header-height,6rem)+1.5rem)]">
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
