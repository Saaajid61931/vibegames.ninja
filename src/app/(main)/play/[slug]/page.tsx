import { notFound } from "next/navigation"
import Link from "next/link"
import { Play, Heart, Flag, MessageCircle, ChevronLeft, User, Gamepad2, ExternalLink, Smartphone, Cpu, Users, Clock } from "lucide-react"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { GamePlayer } from "@/components/games/game-player"
import { LikeButton } from "@/components/games/like-button"
import { ShareButton } from "@/components/games/share-button"
import { CommentsSection } from "@/components/games/comments-section"
import { FollowButton } from "@/components/creator/follow-button"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { auth } from "@/lib/auth"
import prisma from "@/lib/prisma"
import { getDiscoveryOrderBy } from "@/lib/discovery"
import { formatNumber, timeAgo, getInitials, CATEGORIES } from "@/lib/utils"

export const dynamic = "force-dynamic"

interface PageProps {
  params: Promise<{ slug: string }>
}

async function getGame(slug: string) {
  const game = await prisma.game.findUnique({
    where: { slug },
    include: {
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
        take: 20,
      },
      _count: {
        select: { favorites: true, comments: true },
      },
    },
  })

  if (!game || game.status !== "PUBLISHED") {
    return null
  }

  // Increment play count
  await prisma.game.update({
    where: { id: game.id },
    data: { plays: { increment: 1 } },
  })

  return game
}

async function getRelatedGames(category: string, excludeId: string) {
  return prisma.game.findMany({
    where: {
      status: "PUBLISHED",
      category,
      id: { not: excludeId },
    },
    include: {
      creator: {
        select: { id: true, name: true, username: true, image: true },
      },
    },
    orderBy: getDiscoveryOrderBy("trending"),
    take: 4,
  })
}

export default async function PlayPage({ params }: PageProps) {
  const session = await auth()
  const { slug } = await params
  const game = await getGame(slug)

  if (!game) {
    notFound()
  }

  const relatedGames = await getRelatedGames(game.category, game.id)
  const [followersCount, creatorGamesCount, isFollowing, isLiked] = await Promise.all([
    prisma.creatorFollow.count({ where: { creatorId: game.creator.id } }),
    prisma.game.count({ where: { creatorId: game.creator.id, status: "PUBLISHED" } }),
    session?.user?.id
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
  ])
  const creatorProfileHref = game.creator.username ? `/creator/${game.creator.username}` : "/creator"
  const category = CATEGORIES.find(c => c.value === game.category)

  return (
    <div className="min-h-screen flex flex-col bg-[#0d0d15]">
      <Header />
      
      <main className="flex-1">
        <div className="container mx-auto px-4 py-4 sm:py-6">
          {/* Back button */}
          <Link href="/games" className="inline-flex items-center gap-2 text-[#4a4a6a] hover:text-[#ffff00] mb-4 sm:mb-6 transition-colors font-arcade text-xs sm:text-sm">
            <ChevronLeft className="h-4 w-4" />
            $ cd ../games
          </Link>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
            {/* Main content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Game iframe */}
              <GamePlayer
                title={game.title}
                gameUrl={game.gameUrl}
                runtimeLabel={`${game.title.toLowerCase().replace(/\s+/g, "_")}.exe`}
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
                  <ShareButton title={game.title} />
                  <Button variant="ghost" size="sm" className="gap-2 text-[#4a4a6a] font-arcade flex-1 sm:flex-none min-w-[108px]">
                    <Flag className="h-4 w-4" />
                    [REPORT]
                  </Button>
                </div>
              </div>

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
                  [{game.supportsMobile ? "MOBILE_READY" : "DESKTOP_ONLY"}]
                </span>
                {game.tags.split(",").filter(t => t.trim()).map((tag) => (
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
                  <span>{game.supportsMobile ? "MOBILE SUPPORTED" : "DESKTOP EXPERIENCE"}</span>
                </div>
                {game.aiModel && (
                  <div className="flex items-center gap-2">
                    <Cpu className="h-4 w-4 text-[#ffff00]" />
                    <span>MODEL {game.aiModel.toUpperCase()}</span>
                  </div>
                )}
              </div>

              {/* Description */}
              <div className="border-2 border-[#4a4a6a] bg-[#1a1a2e]">
                <div className="border-b-2 border-[#4a4a6a] px-4 py-2">
                  <h3 className="font-arcade text-sm text-[#ffff00]">$ cat README.md</h3>
                </div>
                <div className="p-4">
                  <p className="text-[#e5e5e5] whitespace-pre-wrap font-arcade text-sm">{game.description}</p>
                  
                  {game.instructions && (
                    <div className="mt-6 pt-6 border-t border-[#222]">
                      <h4 className="font-bold text-white mb-2 font-arcade text-sm text-[#ffff00]">CONTROLS:</h4>
                      <p className="text-[#4a4a6a] whitespace-pre-wrap font-arcade text-sm">{game.instructions}</p>
                    </div>
                  )}
                </div>
              </div>

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
                  <span className="font-arcade text-xs text-[#4a4a6a]">CREATED_BY</span>
                </div>
                <div className="p-4 bg-[#0d0d15]">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-12 w-12 border-2 border-[#4a4a6a]">
                      <AvatarImage src={game.creator.image || undefined} />
                      <AvatarFallback className="bg-[#1a1a2e] text-[#4a4a6a]">
                        {getInitials(game.creator.name || game.creator.username || "U")}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <h4 className="font-bold text-white font-arcade">
                        {game.creator.name || game.creator.username}
                      </h4>
                      {game.creator.username && (
                        <p className="text-sm text-[#ffff00] font-arcade">@{game.creator.username}</p>
                      )}
                    </div>
                  </div>
                  {game.creator.bio && (
                    <p className="text-sm text-[#4a4a6a] mt-3 font-arcade">{game.creator.bio}</p>
                  )}
                  <div className="mt-3 flex flex-wrap gap-3 text-xs font-arcade text-[#4a4a6a]">
                    <span className="inline-flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      {formatNumber(followersCount)} FOLLOWERS
                    </span>
                    <span>{formatNumber(creatorGamesCount)} GAMES</span>
                  </div>
                  <div className="mt-4">
                    <FollowButton
                      creatorId={game.creator.id}
                      creatorUsername={game.creator.username || null}
                      initialFollowers={followersCount}
                      initialFollowing={isFollowing}
                    />
                  </div>
                  <Link href={creatorProfileHref} className="block mt-4">
                    <Button variant="outline" className="w-full gap-2 font-arcade">
                      <User className="h-4 w-4" />
                      [VIEW_PROFILE]
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
                    Add this game to your website:
                  </p>
                  <code className="block p-3 bg-[#1a1a2e] border border-[#4a4a6a] text-[11px] sm:text-xs text-[#ffff00] font-arcade break-all">
                    {`<iframe src="${process.env.NEXT_PUBLIC_APP_URL || "https://vibegames.ninja"}/embed/${game.slug}" width="800" height="600"></iframe>`}
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
                          <div className="w-12 h-8 bg-[#1a1a2e] border border-[#4a4a6a] flex items-center justify-center overflow-hidden">
                            {related.thumbnail ? (
                              <img src={related.thumbnail} alt="" className="w-full h-full object-cover grayscale hover:grayscale-0" />
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
