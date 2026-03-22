import type { Metadata } from "next"
import { cache } from "react"
import { summarizeFeedback } from "@/lib/creator-magnet"
import { getDiscoveryOrderBy } from "@/lib/discovery"
import { isRenderableImageSrc } from "@/lib/image-src"
import { getJamAction, getLiveJamStatus, pickPrimaryJam } from "@/lib/jams"
import { getMobileOrientationLabel } from "@/lib/mobile-orientation"
import prisma from "@/lib/prisma"
import { logServerError } from "@/lib/server-log"
import { SITE_NAME, SITE_URL } from "@/lib/site"
import { CATEGORIES } from "@/lib/utils"

export function getJamPanelStyles(status: string) {
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

export function getJamPanelMessage(jam: { startDate: Date | string; endDate: Date | string; votingEndDate: Date | string }) {
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

export async function generatePlayPageMetadata(slug: string): Promise<Metadata> {
  try {
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
    const thumbnailSrc = typeof game.thumbnail === "string" ? game.thumbnail.trim() : ""
    const ogImage = !isRenderableImageSrc(thumbnailSrc)
      ? fallbackOgImage
      : thumbnailSrc.startsWith("/")
        ? new URL(thumbnailSrc, SITE_URL).toString()
        : thumbnailSrc

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
  } catch (error) {
    logServerError("Play page metadata failed", error, {
      route: "app/play/[slug]",
      slug,
    })

    return {
      title: "Play Game",
      description: "Open this game on VibeGames.Ninja.",
    }
  }
}

export async function getPlayPageData(
  slug: string,
  selectedLevelId?: string,
  userId?: string | null
) {
  const game = await getGame(slug)

  if (!game) {
    return null
  }

  const isStudioPublished = Boolean(game.studioProfile)

  const [
    relatedGamesResult,
    followersCountResult,
    creatorGamesCountResult,
    isFollowingResult,
    isLikedResult,
    userGameRatingResult,
    selectedLevelResult,
    userStructuredFeedbackResult,
  ] = await Promise.allSettled([
    getRelatedGames(game.category, game.id),
    isStudioPublished
      ? Promise.resolve(0)
      : prisma.creatorFollow.count({ where: { creatorId: game.creator.id } }),
    isStudioPublished
      ? prisma.game.count({ where: { studioProfileId: game.studioProfile!.id, status: "PUBLISHED" } })
      : prisma.game.count({ where: { creatorId: game.creator.id, status: "PUBLISHED" } }),
    isStudioPublished
      ? Promise.resolve(false)
      : userId
        ? prisma.creatorFollow
            .findUnique({
              where: {
                followerId_creatorId: {
                  followerId: userId,
                  creatorId: game.creator.id,
                },
              },
              select: { id: true },
            })
            .then((follow) => Boolean(follow))
        : Promise.resolve(false),
    userId
      ? prisma.favorite
          .findUnique({
            where: {
              userId_gameId: {
                userId,
                gameId: game.id,
              },
            },
            select: { id: true },
          })
          .then((favorite) => Boolean(favorite))
      : Promise.resolve(false),
    userId
      ? prisma.gameRating.findUnique({
          where: {
            userId_gameId: {
              userId,
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
            ratings: userId
              ? {
                  where: { userId },
                  select: { score: true },
                  take: 1,
                }
              : false,
          },
        })
      : Promise.resolve(null),
    userId
      ? prisma.gameFeedback.findUnique({
          where: {
            userId_gameId: {
              userId,
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

  const getSettledValue = <T,>(label: string, result: PromiseSettledResult<T>, fallback: T) => {
    if (result.status === "fulfilled") {
      return result.value
    }

    logServerError("Play page query failed", result.reason, {
      route: "app/play/[slug]",
      slug,
      gameId: game.id,
      query: label,
      userId: userId ?? null,
      level: selectedLevelId || null,
    })

    return fallback
  }

  const relatedGames = getSettledValue("relatedGames", relatedGamesResult, [] as Awaited<ReturnType<typeof getRelatedGames>>)
  const followersCount = getSettledValue("followersCount", followersCountResult, 0)
  const creatorGamesCount = getSettledValue("creatorGamesCount", creatorGamesCountResult, 0)
  const isFollowing = getSettledValue("isFollowing", isFollowingResult, false)
  const isLiked = getSettledValue("isLiked", isLikedResult, false)
  const userGameRating = getSettledValue("userGameRating", userGameRatingResult, null as { score: number } | null)
  const selectedLevel = getSettledValue(
    "selectedLevel",
    selectedLevelResult,
    null as Awaited<
      ReturnType<
        typeof prisma.level.findFirst<{
          select: {
            id: true
            name: true
            description: true
            data: true
            avgRating: true
            ratingCount: true
            creator: {
              select: { id: true, name: true, username: true }
            }
            ratings: {
              where: { userId: string }
              select: { score: true }
              take: 1
            }
          }
        }>
      >
    >
  )
  const userStructuredFeedback = getSettledValue(
    "userStructuredFeedback",
    userStructuredFeedbackResult,
    null as {
      fun: boolean
      confusing: boolean
      tooHard: boolean
      buggy: boolean
      comment: string | null
    } | null
  )

  const creatorProfileHref = game.studioProfile
    ? `/studio/${game.studioProfile.handle}`
    : (game.creator.username ? `/creator/${game.creator.username}` : "/creator")
  const category = CATEGORIES.find((item) => item.value === game.category)
  const mobileOrientationLabel = getMobileOrientationLabel(game.mobileOrientation)
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
    ? getJamAction(primaryJam, { surface: "play", isAuthenticated: Boolean(userId) })
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

  return {
    game,
    relatedGames,
    followersCount,
    creatorGamesCount,
    isFollowing,
    isLiked,
    userGameRating,
    selectedLevel,
    userStructuredFeedback,
    creatorProfileHref,
    category,
    mobileOrientationLabel,
    mobileTagLabel,
    mobileSupportText,
    tagList,
    shareUrl,
    feedbackSummary,
    primaryJam,
    primaryJamStatus,
    primaryJamAction,
    recentFeedbackComments,
    gameJsonLd,
    breadcrumbJsonLd,
    canAutoCaptureThumbnails: userId === game.creator.id,
  }
}

export type PlayPageData = NonNullable<Awaited<ReturnType<typeof getPlayPageData>>>
