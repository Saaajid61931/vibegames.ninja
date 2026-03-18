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
  Sparkles,
  Trophy,
  User,
} from "lucide-react"
import { CommunityLevels } from "@/components/games/community-levels"
import { CommentsSection } from "@/components/games/comments-section"
import { GameRating } from "@/components/games/game-rating"
import { LevelRating } from "@/components/games/level-rating"
import { LikeButton } from "@/components/games/like-button"
import { PlayTracker } from "@/components/games/play-tracker"
import { PlayableGameSection } from "@/components/games/playable-game-section"
import { ReportGameButton } from "@/components/games/report-game-button"
import { ShareButton } from "@/components/games/share-button"
import { StructuredFeedbackPanel } from "@/components/games/structured-feedback-panel"
import { Footer } from "@/components/layout/footer"
import { Header } from "@/components/layout/header"
import { Button } from "@/components/ui/button"
import { getJamPanelMessage, getJamPanelStyles, type PlayPageData } from "@/lib/play-page-data"
import { formatNumber, timeAgo } from "@/lib/utils"
import { PlayPageSidebar } from "@/components/games/play-page-sidebar"

interface PlayPageViewProps {
  data: PlayPageData
  selectedLevelId?: string
  userId?: string | null
}

export function PlayPageView({ data, selectedLevelId, userId }: PlayPageViewProps) {
  const {
    game,
    category,
    creatorProfileHref,
    feedbackSummary,
    followersCount,
    creatorGamesCount,
    isFollowing,
    isLiked,
    primaryJam,
    primaryJamAction,
    primaryJamStatus,
    recentFeedbackComments,
    relatedGames,
    selectedLevel,
    tagList,
    mobileSupportText,
    mobileTagLabel,
    userGameRating,
    userStructuredFeedback,
    gameJsonLd,
    breadcrumbJsonLd,
    canAutoCaptureThumbnails,
  } = data
  const isAuthenticated = Boolean(userId)

  return (
    <div className="min-h-screen flex flex-col bg-[#0d0d15]">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(gameJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      <Header />

      <main className="flex-1">
        <div className="container mx-auto px-4 py-4 sm:py-6">
          <Link
            href="/games"
            className="inline-flex items-center gap-2 text-[#4a4a6a] hover:text-[#ffff00] mb-4 sm:mb-6 transition-colors font-arcade text-xs sm:text-sm"
          >
            <ChevronLeft className="h-4 w-4" />
            BACK TO ARCADE
          </Link>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
            <div className="lg:col-span-2 space-y-6">
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
                <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-white flex-1 font-arcade">
                  {game.title}
                </h1>
                <div className="flex w-full sm:w-auto flex-wrap items-center gap-2">
                  <LikeButton
                    gameId={game.id}
                    slug={game.slug}
                    initialLikes={game.likes}
                    initialLiked={isLiked}
                  />
                  <ShareButton gameId={game.id} title={game.title} />
                  <ReportGameButton gameId={game.id} gameTitle={game.title} />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                {primaryJam && (
                  <div className={`border-2 bg-[#1a1a2e] p-4 md:col-span-3 ${getJamPanelStyles(primaryJamStatus || "COMPLETED").border}`}>
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
                )}
                <div className="border-2 border-[#4a4a6a] bg-[#1a1a2e] p-4">
                  <div className="mb-2 flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-[#ffff00]" />
                    <span className="font-arcade text-[11px] text-[#ffff00]">KEEP THIS GAME CLOSE</span>
                  </div>
                  <p className="font-arcade text-xs text-[#8b93a6]">
                    Favorite it for quick access and follow the creator so new releases land in your notifications.
                  </p>
                </div>
                {game.hasLevelEditor ? (
                  <div className="border-2 border-[#4a4a6a] bg-[#1a1a2e] p-4">
                    <div className="mb-2 flex items-center gap-2">
                      <Trophy className="h-4 w-4 text-[#00d1ff]" />
                      <span className="font-arcade text-[11px] text-[#00d1ff]">COMMUNITY LEVELS</span>
                    </div>
                    <p className="font-arcade text-xs text-[#8b93a6]">
                      Finish a run, then try player-made levels or remix one of your own to keep the game alive.
                    </p>
                  </div>
                ) : (
                  <div className="border-2 border-[#4a4a6a] bg-[#1a1a2e] p-4">
                    <div className="mb-2 flex items-center gap-2">
                      <Trophy className="h-4 w-4 text-[#00d1ff]" />
                      <span className="font-arcade text-[11px] text-[#00d1ff]">PLAY NEXT</span>
                    </div>
                    <p className="font-arcade text-xs text-[#8b93a6]">
                      When you are done here, jump into related games below to keep your session going.
                    </p>
                  </div>
                )}
                <div className="border-2 border-[#4a4a6a] bg-[#1a1a2e] p-4">
                  <div className="mb-2 flex items-center gap-2">
                    <ArrowRight className={`h-4 w-4 ${game.hasGhostSharing ? "text-[#00d1ff]" : "text-[#ff0040]"}`} />
                    <span className={`font-arcade text-[11px] ${game.hasGhostSharing ? "text-[#00d1ff]" : "text-[#ff0040]"}`}>
                      {game.hasGhostSharing ? "GHOST RACES" : "SHARE THE RUN"}
                    </span>
                  </div>
                  <p className="font-arcade text-xs text-[#8b93a6]">
                    {game.hasGhostSharing
                      ? "Chase leaderboard ghosts, load a replay, and try to steal the fastest time."
                      : "Copy the link or post straight to social to help this game reach more players."}
                  </p>
                </div>
              </div>

              {game.seekingFeedback && (
                <div className="border-2 border-[#ff7a00] bg-[#ff7a00]/10 p-4">
                  <p className="font-arcade text-[11px] text-[#ff7a00]">CREATOR REQUEST</p>
                  <h3 className="mt-2 font-arcade text-sm text-white">This creator is actively looking for feedback</h3>
                  <p className="mt-2 font-arcade text-xs text-[#ffd2a6]">
                    Play for a minute, then leave a quick signal below so they know what to keep, fix, or remix next.
                  </p>
                </div>
              )}

              <div className="flex flex-wrap gap-2 font-arcade text-xs">
                <span className="px-2 py-1 bg-[#ffff00] text-[#0d0d15] font-bold">
                  [{category?.label.toUpperCase() || "GAME"}]
                </span>
                {game.isAIGenerated && (
                  <span className="px-2 py-1 border border-[#ffff00] text-[#ffff00]">
                    [AI_GENERATED]
                  </span>
                )}
                {game.aiTool && (
                  <span className="px-2 py-1 border border-[#4a4a6a] text-[#4a4a6a]">
                    [TOOL:{game.aiTool.toUpperCase()}]
                  </span>
                )}
                {game.aiModel && (
                  <span className="px-2 py-1 border border-[#4a4a6a] text-[#4a4a6a]">
                    [MODEL:{game.aiModel.toUpperCase()}]
                  </span>
                )}
                <span
                  className={`px-2 py-1 border ${game.supportsMobile ? "border-[#22c55e] text-[#22c55e]" : "border-[#4a4a6a] text-[#4a4a6a]"}`}
                >
                  [{mobileTagLabel}]
                </span>
                {game.hasLevelEditor && (
                  <span className="px-2 py-1 border border-[#ffff00] text-[#ffff00]">
                    [LEVEL_EDITOR]
                  </span>
                )}
                {game.hasGhostSharing && (
                  <span className="px-2 py-1 border border-[#00d1ff] text-[#00d1ff]">
                    [GHOST_RACES]
                  </span>
                )}
                {tagList.map((tag) => (
                  <span key={tag.trim()} className="px-2 py-1 border border-[#4a4a6a] text-[#4a4a6a]">
                    #{tag.trim().toUpperCase()}
                  </span>
                ))}
              </div>

              <div className="flex flex-wrap gap-4 sm:gap-6 text-[#4a4a6a] font-arcade text-xs sm:text-sm border-y-2 border-[#222] py-4">
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
                  <Smartphone className={`h-4 w-4 ${game.supportsMobile ? "text-[#22c55e]" : "text-[#4a4a6a]"}`} />
                  <span>{mobileSupportText}</span>
                </div>
                {game.aiModel && (
                  <div className="flex items-center gap-2">
                    <Cpu className="h-4 w-4 text-[#ffff00]" />
                    <span>MODEL {game.aiModel.toUpperCase()}</span>
                  </div>
                )}
              </div>

              <GameRating
                gameId={game.id}
                initialAverage={game.avgRating}
                initialCount={game.ratingCount}
                initialUserScore={userGameRating?.score ?? null}
                isAuthenticated={isAuthenticated}
              />

              <StructuredFeedbackPanel
                gameId={game.id}
                slug={game.slug}
                initialSummary={feedbackSummary}
                initialUserFeedback={userStructuredFeedback}
                recentComments={recentFeedbackComments}
                isAuthenticated={isAuthenticated}
              />

              <div className="border-2 border-[#4a4a6a] bg-[#11111d] p-4 sm:p-5">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="font-arcade text-[11px] text-[#ffff00]">AFTER YOU PLAY</p>
                    <h3 className="mt-1 font-arcade text-sm text-white">Help this game grow</h3>
                    <p className="mt-2 font-arcade text-xs text-[#8b93a6]">
                      Leave a rating, favorite the game, follow {game.studioProfile ? game.studioProfile.displayName : game.creator.username || game.creator.name || "the creator"}, and share the link with friends.
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Link href={creatorProfileHref}>
                      <Button variant="arcade-outline" size="sm" className="gap-2">
                        <User className="h-4 w-4" />
                        VIEW CREATOR
                      </Button>
                    </Link>
                    <Link href="/jams">
                      <Button variant="outline" size="sm" className="gap-2">
                        <Trophy className="h-4 w-4" />
                        JOIN A JAM
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>

              {selectedLevel && (
                <div className="border-2 border-[#4a4a6a] bg-[#1a1a2e] p-4 space-y-2">
                  <p className="font-arcade text-xs text-[#ffff00]">CURRENT LEVEL</p>
                  <h3 className="font-arcade text-sm text-white">{selectedLevel.name}</h3>
                  {selectedLevel.description && (
                    <p className="font-arcade text-xs text-[#4a4a6a]">{selectedLevel.description}</p>
                  )}
                  <p className="font-arcade text-[10px] text-[#4a4a6a]">
                    by {selectedLevel.creator.username || selectedLevel.creator.name || "anonymous"}
                  </p>

                  {userId === selectedLevel.creator.id && (
                    <Button asChild variant="arcade-outline" size="sm" className="mt-2">
                      <Link href={`/play/${game.slug}/editor?level=${selectedLevel.id}`}>EDIT THIS LEVEL</Link>
                    </Button>
                  )}
                </div>
              )}

              {selectedLevel && (
                <LevelRating
                  levelId={selectedLevel.id}
                  initialAverage={selectedLevel.avgRating}
                  initialCount={selectedLevel.ratingCount}
                  initialUserScore={selectedLevel.ratings?.[0]?.score ?? null}
                  isAuthenticated={isAuthenticated}
                />
              )}

              <div className="border-2 border-[#4a4a6a] bg-[#1a1a2e]">
                <div className="border-b-2 border-[#4a4a6a] px-4 py-2">
                  <h3 className="font-arcade text-sm text-[#ffff00]">$ cat README.md</h3>
                </div>
                <div className="p-4">
                  <p className="text-[#e5e5e5] whitespace-pre-wrap font-arcade text-sm">{game.description}</p>
                  {game.latestUpdateNote && (
                    <div className="mt-4 border border-[#2e3446] bg-[#0d0d15] p-3">
                      <p className="font-arcade text-[11px] text-[#00d1ff]">RECENT UPDATE</p>
                      <p className="mt-2 font-arcade text-xs text-white">{game.latestUpdateNote}</p>
                    </div>
                  )}

                  {game.instructions && (
                    <div className="mt-6 pt-6 border-t border-[#222]">
                      <h4 className="font-bold text-white mb-2 font-arcade text-sm text-[#ffff00]">CONTROLS:</h4>
                      <p className="text-[#4a4a6a] whitespace-pre-wrap font-arcade text-sm">{game.instructions}</p>
                    </div>
                  )}
                </div>
              </div>

              {game.hasLevelEditor && (
                <CommunityLevels
                  gameId={game.id}
                  slug={game.slug}
                  selectedLevelId={selectedLevelId}
                  currentUserId={userId ?? null}
                />
              )}

              <CommentsSection
                gameId={game.id}
                slug={game.slug}
                initialComments={game.comments}
                initialCommentsCount={game._count.comments}
              />
            </div>

            <PlayPageSidebar
              game={game}
              category={category}
              creatorProfileHref={creatorProfileHref}
              creatorGamesCount={creatorGamesCount}
              followersCount={followersCount}
              initialFollowing={isFollowing}
              relatedGames={relatedGames}
            />
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
