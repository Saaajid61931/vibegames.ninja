import type { Metadata } from "next"
import { notFound } from "next/navigation"
import Link from "next/link"
import { Play, Heart, MessageCircle, ChevronLeft, User, Gamepad2, ExternalLink, Smartphone, Cpu, Users, Clock, Sparkles, Trophy, ArrowRight } from "lucide-react"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { GameThumbnailSlideshow } from "@/components/games/game-thumbnail-slideshow"
import { PlayableGameSection } from "@/components/games/playable-game-section"
import { LikeButton } from "@/components/games/like-button"
import { ShareButton } from "@/components/games/share-button"
import { ReportGameButton } from "@/components/games/report-game-button"
import { CommentsSection } from "@/components/games/comments-section"
import { CommunityLevels } from "@/components/games/community-levels"
import { StructuredFeedbackPanel } from "@/components/games/structured-feedback-panel"
import { GameRating } from "@/components/games/game-rating"
import { LevelRating } from "@/components/games/level-rating"
import { PlayTracker } from "@/components/games/play-tracker"
import { FollowButton } from "@/components/creator/follow-button"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { auth } from "@/lib/auth"
import { summarizeFeedback } from "@/lib/creator-magnet"
import { getJamAction, getLiveJamStatus, pickPrimaryJam } from "@/lib/jams"
import { getMobileOrientationLabel } from "@/lib/mobile-orientation"
import prisma from "@/lib/prisma"
import { getDiscoveryOrderBy } from "@/lib/discovery"
import { formatNumber, timeAgo, getInitials, CATEGORIES } from "@/lib/utils"
import { SITE_NAME, SITE_URL } from "@/lib/site"
import { cache } from "react"

export const dynamic = "force-dynamic"

interface PageProps {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ level?: string }>
}

function getJamPanelStyles(status: string) {
  switch (status) {
    case "ACTIVE":
      return {
        border: "border-[#00ff40]/30",
        badge: "border-[#00ff40]/30 bg-[#00ff40]/10 text-[#00ff40]",
      }
    case "VOTING":
      return {
        border: "border-[#ffff00]/30",
        badge: "border-[#ffff00]/30 bg-[#ffff00]/10 text-[#ffff00]",
      }
    case "UPCOMING":
      return {
        border: "border-[#00d4ff]/30",
        badge: "border-[#00d4ff]/30 bg-[#00d4ff]/10 text-[#00d4ff]",
      }
    default:
      return {
        border: "border-[#b0b0d0]/30",
        badge: "border-[#b0b0d0]/30 bg-[#b0b0d0]/10 text-[#b0b0d0]",
      }
  }
}

function getJamPanelMessage(jam: { startDate: Date | string; endDate: Date | string; votingEndDate: Date | string }) {
  const liveStatus = getLiveJamStatus(jam)
  const formatter = { month: "short", day: "numeric" } as const
  const startDate = new Date(jam.startDate)
  const endDate = new Date(jam.endDate)
  const votingEndDate = new Date(jam.votingEndDate)

  switch (liveStatus) {
    case "ACTIVE":
      return `Submissions close ${endDate.toLocaleDateString("en-US", formatter)}`
    case "VOTING":
      return `Voting ends ${votingEndDate.toLocaleDateString("en-US", formatter)}`
    case "UPCOMING":
      return `Jam starts ${startDate.toLocaleDateString("en-US", formatter)}`
    default:
      return "This jam has finished and the results are live."
  }
}

const getGame = cache(async (slug: string) => {
  const game = await prisma.game.findUnique({
    where: { slug },
    include: {
      studioProfile: {
        select: { id: true, handle: true, displayName: true, image: true },
      },
      creator: {
        select: { id: true, name: true, username: true, image: true, bio: true },
      },
      comments: {
        include: {
          user: {
            select: { id: true, name: true, username: true, image: true },
          },
        },
        orderBy: { createdAt: "desc" },
        take: 80,
      },
      feedback: {
        select: {
          fun: true,
          confusing: true,
          tooHard: true,
          buggy: true,
          comment: true,
          createdAt: true,
        },
        orderBy: { createdAt: "desc" },
        take: 100,
      },
      jamEntries: {
        orderBy: { submittedAt: "desc" },
        take: 4,
        select: {
          jam: {
            select: {
              slug: true,
              title: true,
              theme: true,
              status: true,
              startDate: true,
              endDate: true,
              votingEndDate: true,
            },
          },
        },
      },
      _count: {
        select: { favorites: true, comments: true },
      },
    },
  })

  if (!game || game.status !== "PUBLISHED") {
    return null
  }

  return game
})

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const game = await getGame(slug)

  if (!game) {
    return {
      title: "Game Not Found",
      robots: { index: false, follow: false },
    }
  }

  const description = `${game.description.slice(0, 140)}${game.description.length > 140 ? "..." : ""}`
  const gamePath = `/play/${game.slug}`
  const fallbackOgImage = `${SITE_URL}/icon.svg`
  const ogImage = game.thumbnail
    ? new URL(game.thumbnail, SITE_URL).toString()
    : fallbackOgImage

  return {
    title: `${game.title} - Free AI Game`,
    description,
    alternates: {
      canonical: gamePath,
    },
    openGraph: {
      title: `${game.title} - Play on VibeGames.Ninja`,
      description,
      url: `${SITE_URL}${gamePath}`,
      type: "website",
      siteName: SITE_NAME,
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: `${game.title} on ${SITE_NAME}`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: `${game.title} - Play on VibeGames.Ninja`,
      description,
      images: [ogImage],
    },
    keywords: game.tags
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean),
  }
}

async function getRelatedGames(category: string, excludeId: string) {
  return prisma.game.findMany({
    where: {
      status: "PUBLISHED",
      category,
      id: { not: excludeId },
    },
    include: {
      studioProfile: {
        select: { id: true, handle: true, displayName: true, image: true },
      },
      creator: {
        select: { id: true, name: true, username: true, image: true },
      },
    },
    orderBy: getDiscoveryOrderBy("trending"),
    take: 4,
  })
}

export default async function PlayPage({ params, searchParams }: PageProps) {
  const session = await auth()
  const { slug } = await params
  const { level: selectedLevelId } = await searchParams
  const game = await getGame(slug)

  if (!game) {
    notFound()
  }

  const isStudioPublished = Boolean(game.studioProfile)
  
  const [
    relatedGames,
    followersCount,
    creatorGamesCount,
    isFollowing,
    isLiked,
    userGameRating,
    selectedLevel,
    userStructuredFeedback,
  ] = await Promise.all([
    getRelatedGames(game.category, game.id),
    isStudioPublished
      ? Promise.resolve(0)
      : prisma.creatorFollow.count({ where: { creatorId: game.creator.id } }),
    isStudioPublished
      ? prisma.game.count({ where: { studioProfileId: game.studioProfile!.id, status: "PUBLISHED" } })
      : prisma.game.count({ where: { creatorId: game.creator.id, status: "PUBLISHED" } }),
    isStudioPublished
      ? Promise.resolve(false)
      : session?.user?.id
        ? prisma.creatorFollow
            .findUnique({
              where: {
                followerId_creatorId: {
                  followerId: session.user.id,
                  creatorId: game.creator.id,
                },
              },
              select: { id: true },
            })
            .then((follow: { id: string } | null) => Boolean(follow))
        : Promise.resolve(false),
    session?.user?.id
      ? prisma.favorite
          .findUnique({
            where: {
              userId_gameId: {
                userId: session.user.id,
                gameId: game.id,
              },
            },
            select: { id: true },
          })
          .then((favorite: { id: string } | null) => Boolean(favorite))
      : Promise.resolve(false),
    session?.user?.id
      ? prisma.gameRating.findUnique({
          where: {
            userId_gameId: {
              userId: session.user.id,
              gameId: game.id,
            },
          },
          select: { score: true },
        })
      : Promise.resolve(null),
    selectedLevelId
      ? prisma.level.findFirst({
          where: {
            id: selectedLevelId,
            gameId: game.id,
            status: "PUBLISHED",
          },
          select: {
            id: true,
            name: true,
            description: true,
            data: true,
            avgRating: true,
            ratingCount: true,
            creator: {
              select: { id: true, name: true, username: true },
            },
            ratings: session?.user?.id
              ? {
                  where: { userId: session.user.id },
                  select: { score: true },
                  take: 1,
                }
              : false,
          },
        })
      : Promise.resolve(null),
    session?.user?.id
      ? prisma.gameFeedback.findUnique({
          where: {
            userId_gameId: {
              userId: session.user.id,
              gameId: game.id,
            },
          },
          select: {
            fun: true,
            confusing: true,
            tooHard: true,
            buggy: true,
            comment: true,
          },
        })
      : Promise.resolve(null),
  ])

  const creatorProfileHref = game.studioProfile
    ? `/studio/${game.studioProfile.handle}`
    : (game.creator.username ? `/creator/${game.creator.username}` : "/creator")
  const category = CATEGORIES.find(c => c.value === game.category)
  const mobileOrientationLabel = getMobileOrientationLabel(game.mobileOrientation)
  const canAutoCaptureThumbnails = session?.user?.id === game.creator.id
  const mobileTagLabel = !game.supportsMobile
    ? "DESKTOP_ONLY"
    : game.mobileOrientation === "BOTH"
      ? "MOBILE_READY"
      : mobileOrientationLabel.replace(/\s+/g, "_")
  const mobileSupportText = !game.supportsMobile
    ? "DESKTOP EXPERIENCE"
    : game.mobileOrientation === "BOTH"
      ? "MOBILE SUPPORTED"
      : `MOBILE: ${mobileOrientationLabel}`
  const tagList = game.tags
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean)
  const shareUrl = `${SITE_URL}/play/${game.slug}`
  const feedbackSummary = summarizeFeedback(game.feedback)
  const primaryJam = pickPrimaryJam(game.jamEntries)
  const primaryJamStatus = primaryJam ? getLiveJamStatus(primaryJam) : null
  const primaryJamAction = primaryJam
    ? getJamAction(primaryJam, { surface: "play", isAuthenticated: Boolean(session?.user?.id) })
    : null
  const recentFeedbackComments = game.feedback
    .filter((item) => item.comment)
    .slice(0, 3)
    .map((item) => ({
      comment: item.comment,
      createdAt: item.createdAt,
    }))
  const gameJsonLd = {
    "@context": "https://schema.org",
    "@type": "VideoGame",
    name: game.title,
    description: game.description,
    url: `${SITE_URL}/play/${game.slug}`,
    image: game.thumbnail || `${SITE_URL}/icon.svg`,
    genre: category?.label || game.category,
    playMode: game.supportsMobile ? ["SinglePlayer", "CoOp"] : "SinglePlayer",
    gamePlatform: game.supportsMobile ? ["Web Browser", "Mobile Web Browser"] : "Web Browser",
    publisher: {
      "@type": game.studioProfile ? "Organization" : "Person",
      name: game.studioProfile?.displayName || game.creator.name || game.creator.username || "VibeGames Creator",
    },
    author: {
      "@type": game.studioProfile ? "Organization" : "Person",
      name: game.studioProfile?.displayName || game.creator.name || game.creator.username || "VibeGames Creator",
    },
    datePublished: new Date(game.createdAt).toISOString(),
    dateModified: new Date(game.updatedAt).toISOString(),
    interactionStatistic: {
      "@type": "InteractionCounter",
      interactionType: "https://schema.org/PlayAction",
      userInteractionCount: game.plays,
    },
    aggregateRating: game.ratingCount > 0 ? {
      "@type": "AggregateRating",
      ratingValue: game.avgRating,
      ratingCount: game.ratingCount,
      bestRating: 5,
      worstRating: 1,
    } : undefined,
  }
  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Games",
        item: `${SITE_URL}/games`,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: category?.label || "Game",
        item: `${SITE_URL}/games?category=${game.category.toLowerCase()}`,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: game.title,
        item: shareUrl,
      },
    ],
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#0d0d15]">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(gameJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      <Header />
      
      <main className="flex-1">
        <div className="container mx-auto px-4 py-4 sm:py-6">
          {/* Back button */}
          <Link href="/games" className="inline-flex items-center gap-2 text-[#4a4a6a] hover:text-[#ffff00] mb-4 sm:mb-6 transition-colors font-arcade text-xs sm:text-sm">
            <ChevronLeft className="h-4 w-4" />
            BACK TO ARCADE
          </Link>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
            {/* Main content */}
            <div className="lg:col-span-2 space-y-6">
              <PlayTracker gameId={game.id} levelId={selectedLevel?.id ?? null} />

              {/* Game iframe */}
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
                isAuthenticated={Boolean(session?.user?.id)}
                canAutoCaptureThumbnails={canAutoCaptureThumbnails}
              />

              {/* Game info */}
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
                        <span className={`inline-flex items-center rounded border px-2 py-1 font-arcade text-[10px] ${getJamPanelStyles(primaryJamStatus || "COMPLETED").badge}`}>
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

              {/* Tags */}
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
                <span className={`px-2 py-1 border ${game.supportsMobile ? "border-[#22c55e] text-[#22c55e]" : "border-[#4a4a6a] text-[#4a4a6a]"}`}>
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

              {/* Stats */}
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
                isAuthenticated={Boolean(session?.user?.id)}
              />

              <StructuredFeedbackPanel
                gameId={game.id}
                slug={game.slug}
                initialSummary={feedbackSummary}
                initialUserFeedback={userStructuredFeedback}
                recentComments={recentFeedbackComments}
                isAuthenticated={Boolean(session?.user?.id)}
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

                  {session?.user?.id === selectedLevel.creator.id && (
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
                  isAuthenticated={Boolean(session?.user?.id)}
                />
              )}

              {/* Description */}
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
                  currentUserId={session?.user?.id ?? null}
                />
              )}

              {/* Comments */}
              <CommentsSection
                gameId={game.id}
                slug={game.slug}
                initialComments={game.comments}
                initialCommentsCount={game._count.comments}
              />
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Creator card */}
              <div className="border-2 border-[#4a4a6a]">
                <div className="border-b-2 border-[#4a4a6a] px-4 py-2 bg-[#1a1a2e]">
                  <span className="font-arcade text-xs text-[#4a4a6a]">PUBLISHED_BY</span>
                </div>
                <div className="p-4 bg-[#0d0d15]">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-12 w-12 border-2 border-[#4a4a6a]">
                      <AvatarImage src={game.studioProfile?.image || game.creator.image || undefined} />
                      <AvatarFallback className="bg-[#1a1a2e] text-[#4a4a6a]">
                        {getInitials(
                          game.studioProfile?.displayName || game.creator.name || game.creator.username || "U"
                        )}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <h4 className="font-bold text-white font-arcade">
                        {game.studioProfile?.displayName || game.creator.name || game.creator.username}
                      </h4>
                      {game.studioProfile ? (
                        <p className="text-sm text-[#ffff00] font-arcade">@{game.studioProfile.handle}</p>
                      ) : game.creator.username ? (
                        <p className="text-sm text-[#ffff00] font-arcade">@{game.creator.username}</p>
                      ) : null}
                    </div>
                  </div>
                  {!game.studioProfile && game.creator.bio && (
                    <p className="text-sm text-[#4a4a6a] mt-3 font-arcade">{game.creator.bio}</p>
                  )}
                  <div className="mt-3 flex flex-wrap gap-3 text-xs font-arcade text-[#4a4a6a]">
                    {!game.studioProfile && (
                      <span className="inline-flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        {formatNumber(followersCount)} FOLLOWERS
                      </span>
                    )}
                    <span>{formatNumber(creatorGamesCount)} GAMES</span>
                  </div>
                  {!game.studioProfile && (
                    <div className="mt-4">
                      <FollowButton
                        creatorId={game.creator.id}
                        creatorUsername={game.creator.username || null}
                        initialFollowers={followersCount}
                        initialFollowing={isFollowing}
                      />
                    </div>
                  )}
                  <Link href={creatorProfileHref} className="block mt-4">
                    <Button variant="outline" className="w-full gap-2 font-arcade">
                      <User className="h-4 w-4" />
                      {game.studioProfile ? "[VIEW_STUDIO]" : "[VIEW_PROFILE]"}
                    </Button>
                  </Link>
                </div>
              </div>

              {/* Embed card */}
              <div className="border-2 border-[#4a4a6a]">
                <div className="border-b-2 border-[#4a4a6a] px-4 py-2 bg-[#1a1a2e] flex items-center gap-2">
                  <ExternalLink className="h-4 w-4 text-[#ffff00]" />
                  <span className="font-arcade text-xs text-[#4a4a6a]">EMBED_CODE</span>
                </div>
                <div className="p-4 bg-[#0d0d15]">
                  <p className="text-xs text-[#4a4a6a] mb-3 font-arcade">
                    Add this game to your website or newsletter to drive more plays back to your page:
                  </p>
                  <code className="block p-3 bg-[#1a1a2e] border border-[#4a4a6a] text-[11px] sm:text-xs text-[#ffff00] font-arcade break-all">
                    {`<iframe src="${process.env.NEXT_PUBLIC_APP_URL || "https://vibegames.ninja"}/embed/${game.slug}" width="800" height="600" allow="fullscreen" allowfullscreen></iframe>`}
                  </code>
                </div>
              </div>

              {/* Related games */}
              {relatedGames.length > 0 && (
                <div className="border-2 border-[#4a4a6a]">
                  <div className="border-b-2 border-[#4a4a6a] px-4 py-2 bg-[#1a1a2e] flex items-center gap-2">
                    <Gamepad2 className="h-4 w-4 text-[#ffff00]" />
                    <span className="font-arcade text-xs text-[#4a4a6a]">
                      MORE [{category?.label.toUpperCase()}]
                    </span>
                  </div>
                  <div className="p-2 bg-[#0d0d15]">
                    <div className="space-y-1">
                      {relatedGames.map((related) => (
                        <Link
                          key={related.id}
                          href={`/play/${related.slug}`}
                          className="flex items-center gap-3 p-2 hover:bg-[#1a1a2e] transition-colors border border-transparent hover:border-[#4a4a6a]"
                        >
                          <div className="relative w-12 h-8 bg-[#1a1a2e] border border-[#4a4a6a] flex items-center justify-center overflow-hidden">
                            {related.thumbnail ? (
                              <GameThumbnailSlideshow
                                title={related.title}
                                thumbnail={related.thumbnail}
                                thumbnailSlides={related.thumbnailSlides}
                                sizes="48px"
                                imageClassName="object-cover grayscale hover:grayscale-0"
                                showIndicators={false}
                              />
                            ) : (
                              <Play className="h-3 w-3 text-[#4a4a6a]" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h5 className="font-arcade text-sm text-white truncate">{related.title}</h5>
                            <p className="text-xs text-[#4a4a6a] font-arcade">{formatNumber(related.plays)} PLAYS</p>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  )
}
