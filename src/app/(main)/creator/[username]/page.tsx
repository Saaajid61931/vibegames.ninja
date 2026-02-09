import { notFound } from "next/navigation"
import Link from "next/link"
import { ChevronLeft, Gamepad2, Users } from "lucide-react"
import { auth } from "@/lib/auth"
import prisma from "@/lib/prisma"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { GameCard } from "@/components/games/game-card"
import { FollowButton } from "@/components/creator/follow-button"
import { Button } from "@/components/ui/button"
import { getDiscoveryOrderBy } from "@/lib/discovery"
import { formatNumber, getInitials } from "@/lib/utils"

interface PageProps {
  params: Promise<{ username: string }>
}

export default async function PublicCreatorPage({ params }: PageProps) {
  const session = await auth()
  const { username } = await params

  const creator = await prisma.user.findUnique({
    where: { username },
    select: {
      id: true,
      name: true,
      username: true,
      image: true,
      bio: true,
      createdAt: true,
    },
  })

  if (!creator) {
    notFound()
  }

  const [games, followers, isFollowing] = await Promise.all([
    prisma.game.findMany({
      where: {
        creatorId: creator.id,
        status: "PUBLISHED",
      },
      include: {
        creator: {
          select: { id: true, name: true, username: true, image: true },
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
  ])

  const normalizedGames = games.map((game) => ({
    ...game,
    createdAt: new Date(game.createdAt),
  }))

  return (
    <div className="min-h-screen flex flex-col bg-[#0d0d15]">
      <Header />

      <main className="flex-1 container mx-auto px-4 py-6 sm:py-8">
        <Link href="/games" className="inline-flex items-center gap-2 text-[#4a4a6a] hover:text-[#ffff00] mb-6 transition-colors font-arcade text-sm">
          <ChevronLeft className="h-4 w-4" />
          BACK TO GAMES
        </Link>

        <section className="mb-8 border-2 border-[#4a4a6a] bg-[#1a1a2e] p-5 sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16 border-2 border-[#4a4a6a]">
                <AvatarImage src={creator.image || undefined} />
                <AvatarFallback className="bg-[#0d0d15] text-[#4a4a6a]">
                  {getInitials(creator.name || creator.username || "C")}
                </AvatarFallback>
              </Avatar>
              <div>
                <h1 className="font-pixel text-sm text-white">{creator.name || creator.username}</h1>
                <p className="font-arcade text-sm text-[#ffff00]">@{creator.username}</p>
                <p className="mt-1 text-xs text-[#4a4a6a] inline-flex items-center gap-1">
                  <Users className="h-3 w-3" />
                  {formatNumber(followers)} followers
                </p>
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
            <p className="mt-4 text-sm text-[#4a4a6a] font-arcade">{creator.bio}</p>
          )}
        </section>

        <section>
          <div className="mb-5 flex items-center justify-between gap-3">
            <h2 className="font-pixel text-sm text-white">
              ALL GAMES [{normalizedGames.length}]
            </h2>
            <Link href="/upload">
              <Button variant="outline" size="sm" className="gap-2">
                <Gamepad2 className="h-4 w-4" />
                Upload your game
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
            <div className="text-center py-14 border-2 border-dashed border-[#4a4a6a]">
              <Gamepad2 className="h-12 w-12 text-[#4a4a6a] mx-auto mb-3" />
              <p className="font-arcade text-[#4a4a6a]">No published games yet.</p>
            </div>
          )}
        </section>
      </main>

      <Footer />
    </div>
  )
}
