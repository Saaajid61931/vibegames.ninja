import Link from "next/link"
import {
  ArrowRight,
  ChevronLeft,
  Clock,
  Cpu,
  Heart,
  MessageCircle,
  Play,
  Smartphone,
} from "lucide-react"
import { CommentsSection } from "@/components/games/comments-section"
import { CompactFeedbackPanel } from "@/components/games/compact-feedback-panel"
import { CommunityLevels } from "@/components/games/community-levels"
import { GameRating } from "@/components/games/game-rating"
import { LevelRating } from "@/components/games/level-rating"
import { LikeButton } from "@/components/games/like-button"
import { PlayPageSidebar } from "@/components/games/play-page-sidebar"
import { PlayTracker } from "@/components/games/play-tracker"
import { PlayableGameSection } from "@/components/games/playable-game-section"
import { ReportGameButton } from "@/components/games/report-game-button"
import { ShareButton } from "@/components/games/share-button"
import { DownloadCodeButton } from "@/components/games/download-code-button"
import { DeleteGameButton } from "@/components/games/delete-game-button"
import { Footer } from "@/components/layout/footer"
import { Header } from "@/components/layout/header"
import { Button } from "@/components/ui/button"
import { getJamPanelMessage, getJamPanelStyles, type PlayPageData } from "@/lib/play-page-data"
import { formatNumber, timeAgo } from "@/lib/utils"

interface PlayPageViewProps {
  data: PlayPageData
  selectedLevelId?: string
  userId?: string | null
  userRole?: string | null
}

export function PlayPageView({ data, selectedLevelId, userId, userRole }: PlayPageViewProps) {
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
    userGameRating,
    gameJsonLd,
    breadcrumbJsonLd,
    canAutoCaptureThumbnails,
  } = data
  const isAuthenticated = Boolean(userId)

  const sidebar = (
    <PlayPageSidebar
      game={game}
      category={category}
      creatorProfileHref={creatorProfileHref}
      creatorGamesCount={creatorGamesCount}
      followersCount={followersCount}
      initialFollowing={isFollowing}
      relatedGames={relatedGames}
    />
  )

  return (
    <div className="min-h-screen flex flex-col bg-[#0d0d15]">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(gameJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      <Header />

      <main className="flex-1">
        <div className="container mx-auto px-4 py-4 sm:py-6">
          <Link
            href="/games"
            className="mb-4 inline-flex items-center gap-2 font-arcade text-xs text-[#8b93a6] transition-colors hover:text-[#ffff00] sm:mb-6 sm:text-sm"
          >
            <ChevronLeft className="h-4 w-4" />
            BACK TO ARCADE
          </Link>

          <div className="grid grid-cols-1 gap-6 sm:gap-8 lg:grid-cols-3">
            <div className="space-y-6 lg:col-span-2">
              <PlayTracker gameId={game.id} levelId={selectedLevel?.id ?? null} />

              <PlayableGameSection
                gameId={game.id}
                title={game.title}
                gameUrl={game.gameUrl}
                runtimeLabel={`${game.title.toLowerCase().replace(/\s+/g, "_")}.exe`}
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

              <div className="flex flex-wrap items-center gap-4">
                <h1 className="flex-1 font-arcade text-xl font-bold text-white sm:text-2xl md:text-3xl">
                  {game.title}
                </h1>
                <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
                  <LikeButton
                    gameId={game.id}
                    slug={game.slug}
                    initialLikes={game.likes}
                    initialLiked={isLiked}
                  />
                  <ShareButton gameId={game.id} title={game.title} />
                  <DownloadCodeButton game={game} variant="standard" />
                  {userRole === "ADMIN" && (
                    <DeleteGameButton gameId={game.id} gameTitle={game.title} />
                  )}
                  <ReportGameButton gameId={game.id} gameTitle={game.title} />
                </div>
              </div>

              {primaryJam ? (
                <div className={`border-2 bg-[#1a1a2e] p-4 ${getJamPanelStyles(primaryJamStatus || "COMPLETED").border}`}>
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <span
                        className={`inline-flex items-center rounded border px-2 py-1 font-arcade text-[10px] ${getJamPanelStyles(primaryJamStatus || "COMPLETED").badge}`}
                      >
                        {primaryJamStatus}
                      </span>
                      <h2 className="mt-3 font-arcade text-sm text-white">{primaryJam.title}</h2>
                      <p className="mt-1 font-arcade text-xs text-[#8b93a6]">
                        {primaryJam.theme ? `Theme: ${primaryJam.theme}. ` : ""}
                        {getJamPanelMessage(primaryJam)}
                      </p>
                    </div>
                    <Button asChild variant="arcade">
                      <Link href={primaryJamAction?.href || `/jams/${primaryJam.slug}`}>
                        {primaryJamAction?.label || "Visit Jam"}
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                </div>
              ) : null}

              <div className="flex flex-wrap gap-2 font-arcade text-xs">
                <span className="bg-[#ffff00] px-2 py-1 font-bold text-[#0d0d15]">
                  [{category?.label.toUpperCase() || "GAME"}]
                </span>
                {game.isAIGenerated ? (
                  <span className="border border-[#ffff00] px-2 py-1 text-[#ffff00]">
                    [AI_GENERATED]
                  </span>
                ) : null}
                {game.aiTool ? (
                  <span className="border border-[#5e6882] px-2 py-1 text-[#a5aec4]">
                    [TOOL:{game.aiTool.toUpperCase()}]
                  </span>
                ) : null}
                {game.aiModel ? (
                  <span className="border border-[#5e6882] px-2 py-1 text-[#a5aec4]">
                    [MODEL:{game.aiModel.toUpperCase()}]
                  </span>
                ) : null}
                <span
                  className={`border px-2 py-1 ${game.supportsMobile ? "border-[#22c55e] text-[#22c55e]" : "border-[#5e6882] text-[#a5aec4]"}`}
                >
                  [{mobileTagLabel}]
                </span>
                {game.hasLevelEditor ? (
                  <span className="border border-[#ffff00] px-2 py-1 text-[#ffff00]">
                    [LEVEL_EDITOR]
                  </span>
                ) : null}
                {game.hasGhostSharing ? (
                  <span className="border border-[#00d1ff] px-2 py-1 text-[#00d1ff]">
                    [GHOST_RACES]
                  </span>
                ) : null}
                {tagList.map((tag) => (
                  <span key={tag.trim()} className="border border-[#5e6882] px-2 py-1 text-[#a5aec4]">
                    #{tag.trim().toUpperCase()}
                  </span>
                ))}
              </div>

              <div className="flex flex-wrap gap-4 border-y-2 border-[#222] py-4 font-arcade text-xs text-[#8b93a6] sm:gap-6 sm:text-sm">
                <div className="flex items-center gap-2">
                  <Play className="h-4 w-4 text-[#ffff00]" />
                  <span>{formatNumber(game.plays)} PLAYS</span>
                </div>
                <div className="flex items-center gap-2">
                  <Heart className="h-4 w-4 text-[#ff0040]" />
                  <span>{formatNumber(game.likes)} LIKES</span>
                </div>
                <div className="flex items-center gap-2">
                  <MessageCircle className="h-4 w-4" />
                  <span>{game._count.comments} COMMENTS</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  <span>UPLOADED {timeAgo(new Date(game.createdAt)).toUpperCase()}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Smartphone className={`h-4 w-4 ${game.supportsMobile ? "text-[#22c55e]" : "text-[#8b93a6]"}`} />
                  <span>{mobileSupportText}</span>
                </div>
                {game.aiModel ? (
                  <div className="flex items-center gap-2">
                    <Cpu className="h-4 w-4 text-[#ffff00]" />
                    <span>MODEL {game.aiModel.toUpperCase()}</span>
                  </div>
                ) : null}
              </div>
            </div>

            <aside className="self-start lg:sticky lg:top-24">
              {sidebar}
            </aside>

            <div className="space-y-6 lg:col-span-2">
              <GameRating
                gameId={game.id}
                initialAverage={game.avgRating}
                initialCount={game.ratingCount}
                initialUserScore={userGameRating?.score ?? null}
                isAuthenticated={isAuthenticated}
              />

              <CompactFeedbackPanel
                gameId={game.id}
                slug={game.slug}
                isAuthenticated={isAuthenticated}
              />

              {selectedLevel ? (
                <div className="space-y-2 border-2 border-[#4a4a6a] bg-[#1a1a2e] p-4">
                  <p className="font-arcade text-xs text-[#ffff00]">CURRENT LEVEL</p>
                  <h3 className="font-arcade text-sm text-white">{selectedLevel.name}</h3>
                  {selectedLevel.description ? (
                    <p className="font-arcade text-xs text-[#a5aec4]">{selectedLevel.description}</p>
                  ) : null}
                  <p className="font-arcade text-[10px] text-[#8b93a6]">
                    by {selectedLevel.creator.username || selectedLevel.creator.name || "anonymous"}
                  </p>

                  {userId === selectedLevel.creator.id ? (
                    <Button asChild variant="arcade-outline" size="sm" className="mt-2">
                      <Link href={`/play/${game.slug}/editor?level=${selectedLevel.id}`}>EDIT THIS LEVEL</Link>
                    </Button>
                  ) : null}
                </div>
              ) : null}

              {selectedLevel ? (
                <LevelRating
                  levelId={selectedLevel.id}
                  initialAverage={selectedLevel.avgRating}
                  initialCount={selectedLevel.ratingCount}
                  initialUserScore={selectedLevel.ratings?.[0]?.score ?? null}
                  isAuthenticated={isAuthenticated}
                />
              ) : null}

              <div className="border-2 border-[#4a4a6a] bg-[#1a1a2e]">
                <div className="border-b-2 border-[#4a4a6a] px-4 py-2">
                  <h3 className="font-arcade text-sm text-[#ffff00]">$ cat README.md</h3>
                </div>
                <div className="p-4">
                  <p className="whitespace-pre-wrap font-arcade text-sm text-[#e5e5e5]">{game.description}</p>
                  {game.latestUpdateNote ? (
                    <div className="mt-4 border border-[#2e3446] bg-[#0d0d15] p-3">
                      <p className="font-arcade text-[11px] text-[#00d1ff]">RECENT UPDATE</p>
                      <p className="mt-2 font-arcade text-xs text-white">{game.latestUpdateNote}</p>
                    </div>
                  ) : null}

                  {game.instructions ? (
                    <div className="mt-6 border-t border-[#222] pt-6">
                      <h4 className="mb-2 font-arcade text-sm font-bold text-[#ffff00]">CONTROLS:</h4>
                      <p className="whitespace-pre-wrap font-arcade text-sm text-[#a5aec4]">{game.instructions}</p>
                    </div>
                  ) : null}
                </div>
              </div>

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
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
