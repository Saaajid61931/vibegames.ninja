import type { Metadata } from "next"
import { notFound, redirect } from "next/navigation"
import Link from "next/link"
import { ChevronLeft, Gamepad2, Users, Sparkles, Trophy, Smartphone } from "lucide-react"
import { auth } from "@/lib/auth"
import prisma from "@/lib/prisma"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { GameCard } from "@/components/games/game-card"
import { FollowButton } from "@/components/creator/follow-button"
import { Button } from "@/components/ui/button"
import { getDiscoveryOrderBy } from "@/lib/discovery"
import { getLiveJamStatus, pickPrimaryJam, toPrimaryJamBadge } from "@/lib/jams"
import { formatNumber, getInitials } from "@/lib/utils"
import { SITE_NAME, SITE_URL } from "@/lib/site"
import type { GameCardData } from "@/types"
import { cache } from "react"

interface PageProps {
  params: Promise<{ username: string }>
}

function getJamBadgeClasses(status: string) {
  switch (status) {
    case "ACTIVE":
      return "border-arcade-green/30 bg-arcade-green/10 text-arcade-green"
    case "VOTING":
      return "border-arcade-yellow/30 bg-arcade-yellow/10 text-arcade-yellow"
    case "UPCOMING":
      return "border-arcade-cyan/30 bg-arcade-cyan/10 text-arcade-cyan"
    default:
      return "border-text-secondary/30 bg-surface-2/10 text-text-secondary"
  }
}

const getCreator = cache(async (username: string) => {
  return prisma.user.findUnique({
    where: { username },
    select: {
      id: true,
      name: true,
      username: true,
      bio: true,
      currentlyBuilding: true,
      image: true,
      createdAt: true,
    },
  })
})

const getRedirectedUsername = cache(async (username: string) => {
  const redirectEntry = await prisma.usernameRedirect.findUnique({
    where: { oldUsername: username },
    select: {
      user: {
        select: {
          username: true,
        },
      },
    },
  })

  return redirectEntry?.user.username || null
})

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { username } = await params
  let creator = await getCreator(username)

  if (!creator?.username) {
    const redirectedUsername = await getRedirectedUsername(username)
    if (redirectedUsername && redirectedUsername !== username) {
      creator = await getCreator(redirectedUsername)
    }
  }

  if (!creator || !creator.username) {
    return {
      title: "Creator Not Found",
      robots: { index: false, follow: false },
    }
  }

  const displayName = creator.name || creator.username
  const description = creator.bio || `Play games by @${creator.username} on VibeGames.Ninja.`
  const profilePath = `/creator/${creator.username}`
  const ogImage = creator.image ? new URL(creator.image, SITE_URL).toString() : `${SITE_URL}/icon.svg`

  return {
    title: `${displayName} (@${creator.username})`,
    description,
    alternates: {
      canonical: profilePath,
    },
    openGraph: {
      title: `${displayName} (@${creator.username})`,
      description,
      url: `${SITE_URL}${profilePath}`,
      type: "website",
      siteName: SITE_NAME,
      images: [ogImage],
    },
    twitter: {
      card: "summary_large_image",
      title: `${displayName} (@${creator.username})`,
      description,
      images: [ogImage],
    },
  }
}

export default async function PublicCreatorPage({ params }: PageProps) {
  const session = await auth()
  const { username } = await params
  const creator = await getCreator(username)

  if (!creator) {
    const redirectedUsername = await getRedirectedUsername(username)
    if (redirectedUsername && redirectedUsername !== username) {
      redirect(`/creator/${redirectedUsername}`)
    }

    notFound()
  }

  const [games, followers, isFollowing, featuredPicks, jamEntries, recentJams] = await Promise.all([
    prisma.game.findMany({
      where: {
        creatorId: creator.id,
        status: "PUBLISHED",
      },
      select: {
        id: true,
        slug: true,
        title: true,
        thumbnail: true,
        thumbnailSlides: true,
        category: true,
        plays: true,
        likes: true,
        createdAt: true,
        publishedAt: true,
        supportsMobile: true,
        aiTool: true,
        aiModel: true,
        seekingFeedback: true,
        updatedAt: true,
        latestUpdateNote: true,
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
        creator: {
          select: { id: true, name: true, username: true, image: true },
        },
        studioProfile: {
          select: { id: true, handle: true, displayName: true, image: true },
        },
      },
      orderBy: getDiscoveryOrderBy("trending"),
    }),
    prisma.creatorFollow.count({ where: { creatorId: creator.id } }),
    session?.user?.id
      ? prisma.creatorFollow
          .findUnique({
            where: {
              followerId_creatorId: {
                followerId: session.user.id,
                creatorId: creator.id,
              },
            },
            select: { id: true },
          })
          .then((follow: { id: string } | null) => Boolean(follow))
      : Promise.resolve(false),
    prisma.featuredGame.count({
      where: {
        game: {
          creatorId: creator.id,
        },
      },
    }),
    prisma.gameJamEntry.count({
      where: {
        game: {
          creatorId: creator.id,
        },
      },
    }),
    prisma.gameJam.findMany({
      where: {
        entries: {
          some: {
            game: {
              creatorId: creator.id,
            },
          },
        },
      },
      orderBy: { startDate: "desc" },
      take: 4,
      select: {
        slug: true,
        title: true,
        theme: true,
        status: true,
        startDate: true,
        endDate: true,
        votingEndDate: true,
      },
    }),
  ])

  const normalizedGames: GameCardData[] = games.map((game) => ({
    ...game,
    createdAt: new Date(game.createdAt),
    primaryJam: toPrimaryJamBadge(pickPrimaryJam(game.jamEntries)),
  }))
  const mobileReadyGames = normalizedGames.filter((game) => game.supportsMobile).length
  const topGame = [...normalizedGames].sort((a, b) => (b.plays + b.likes * 3) - (a.plays + a.likes * 3))[0]
  const lastUpdatedGame = [...normalizedGames].sort(
    (a, b) => new Date((b as typeof b & { updatedAt?: Date }).updatedAt || b.createdAt).getTime() - new Date((a as typeof a & { updatedAt?: Date }).updatedAt || a.createdAt).getTime()
  )[0] as (GameCardData & { updatedAt?: Date; latestUpdateNote?: string | null }) | undefined
  const toolsUsed = [...new Set(games.map((game) => game.aiTool).filter(Boolean))].slice(0, 3)

  const creatorJsonLd = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: creator.name || creator.username,
    alternateName: creator.username ? `@${creator.username}` : undefined,
    description: creator.bio || `Play games by @${creator.username} on VibeGames.Ninja.`,
    url: `${SITE_URL}/creator/${creator.username}`,
    image: creator.image || undefined,
  }

  return (
    <div className="min-h-screen flex flex-col bg-canvas">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(creatorJsonLd) }} />
      <Header />

      <main className="flex-1 container mx-auto px-4 py-6 sm:py-8">
        <Link href="/games" className="inline-flex items-center gap-2 text-text-secondary hover:text-arcade-yellow mb-6 transition-colors font-arcade text-sm">
          <ChevronLeft className="h-4 w-4" />
          BACK TO GAMES
        </Link>

        <section className="inspiration-tile mb-7">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16 border-2 border-border-strong">
                <AvatarImage src={creator.image || undefined} />
                <AvatarFallback className="bg-canvas text-text-secondary">
                  {getInitials(creator.name || creator.username || "C")}
                </AvatarFallback>
              </Avatar>
              <div>
                <h1 className="text-2xl font-semibold text-white">{creator.name || creator.username}</h1>
                <p className="font-arcade text-sm text-arcade-yellow">@{creator.username}</p>
                <p className="mt-1 text-xs text-text-secondary inline-flex items-center gap-1">
                  <Users className="h-3 w-3" />
                  {formatNumber(followers)} followers
                </p>
                {creator.currentlyBuilding && (
                  <p className="mt-2 font-arcade text-xs text-text-secondary">Currently building: {creator.currentlyBuilding}</p>
                )}
              </div>
            </div>
            <FollowButton
              creatorId={creator.id}
              creatorUsername={creator.username}
              initialFollowers={followers}
              initialFollowing={isFollowing}
            />
          </div>

          {creator.bio && (
            <p className="mt-4 text-sm text-text-secondary font-arcade">{creator.bio}</p>
          )}

          <div className="hidden">
            <div className="border border-border-strong bg-canvas p-3">
              <div className="flex items-center gap-2">
                <Trophy className="h-4 w-4 text-arcade-yellow" />
                <span className="font-arcade text-xs text-arcade-yellow">TOP GAME</span>
              </div>
              <p className="mt-2 font-arcade text-sm text-white">{topGame?.title || "Coming soon"}</p>
            </div>
            <div className="border border-border-strong bg-canvas p-3">
              <div className="flex items-center gap-2">
                <Smartphone className="h-4 w-4 text-success" />
                <span className="font-arcade text-xs text-success">MOBILE READY</span>
              </div>
              <p className="mt-2 font-arcade text-sm text-white">{formatNumber(mobileReadyGames)} games</p>
            </div>
            <div className="border border-border-strong bg-canvas p-3">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-arcade-cyan" />
                <span className="font-arcade text-xs text-arcade-cyan">FOLLOW FOR DROPS</span>
              </div>
              <p className="mt-2 font-arcade text-sm text-white">Get new releases in your notifications.</p>
            </div>
          </div>

          <div className="sr-only">
            <div className="border border-border-strong bg-canvas p-3">
              <p className="font-arcade text-xs text-text-secondary">TOTAL LAUNCHES</p>
              <p className="mt-2 font-arcade text-sm text-white">{normalizedGames.length}</p>
            </div>
            <div className="border border-border-strong bg-canvas p-3">
              <p className="font-arcade text-xs text-text-secondary">FEATURED PICKS</p>
              <p className="mt-2 font-arcade text-sm text-white">{featuredPicks}</p>
            </div>
            <div className="border border-border-strong bg-canvas p-3">
              <p className="font-arcade text-xs text-text-secondary">JAM ENTRIES</p>
              <p className="mt-2 font-arcade text-sm text-white">{jamEntries}</p>
            </div>
            <div className="border border-border-strong bg-canvas p-3">
              <p className="font-arcade text-xs text-text-secondary">LAST UPDATED</p>
              <p className="mt-2 font-arcade text-sm text-white">{lastUpdatedGame ? lastUpdatedGame.title : "No updates yet"}</p>
            </div>
          </div>

          {recentJams.length > 0 && (
            <div className="mt-3 border border-border-strong bg-canvas p-3">
              <p className="font-arcade text-xs text-arcade-orange">RECENT JAMS</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {recentJams.map((jam) => {
                  const liveStatus = getLiveJamStatus(jam)
                  return (
                    <Link
                      key={jam.slug}
                      href={`/jams/${jam.slug}`}
                      className={`inline-flex items-center rounded border px-2 py-1 font-arcade text-xs transition-colors hover:text-white ${getJamBadgeClasses(liveStatus)}`}
                    >
                      {jam.title}
                    </Link>
                  )
                })}
              </div>
            </div>
          )}

          {toolsUsed.length > 0 && (
            <div className="mt-3 border border-border-strong bg-canvas p-3">
              <p className="font-arcade text-xs text-arcade-cyan">COMMON TOOLS</p>
              <p className="mt-2 font-arcade text-sm text-white">{toolsUsed.join(" • ")}</p>
              {lastUpdatedGame?.latestUpdateNote && (
                <p className="mt-2 font-arcade text-xs text-text-secondary">Latest note: {lastUpdatedGame.latestUpdateNote}</p>
              )}
            </div>
          )}
        </section>

        <section>
          <div className="mb-5 flex items-center justify-between gap-3">
            <h2 className="heading-pixel-sm text-white">
              ALL GAMES [{normalizedGames.length}]
            </h2>
            <Link href="/upload">
              <Button variant="outline" size="sm" className="gap-2">
                <Gamepad2 className="h-4 w-4" />
                Share your game
              </Button>
            </Link>
          </div>

          {normalizedGames.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
               {normalizedGames.map((game) => (
                 <GameCard key={game.id} game={game} />
               ))}
            </div>
          ) : (
            <div className="text-center py-14 border-2 border-dashed border-border-strong">
              <Gamepad2 className="h-12 w-12 text-text-secondary mx-auto mb-3" />
              <p className="font-arcade text-text-secondary">No published games yet.</p>
            </div>
          )}
        </section>
      </main>

      <Footer />
    </div>
  )
}
