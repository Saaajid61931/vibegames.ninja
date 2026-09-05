import Link from "next/link"
import { auth } from "@/lib/auth"
import prisma, { isPrismaDatasourceConfigured } from "@/lib/prisma"
import { CommunityShell } from "@/components/community/community-shell"
import { GameCard } from "@/components/games/game-card"
import type { Prisma } from "@prisma/client"
export const dynamic = "force-dynamic"
export const metadata = { title: "Community — meet the people behind the games" }
export default async function CommunityPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string }>
}) {
  const { view } = await searchParams
  const user = (await auth())?.user
  const where: Prisma.GameWhereInput = {
    status: "PUBLISHED",
    ...(view === "feedback" ? { seekingFeedback: true } : {}),
    ...(view === "following"
      ? { creator: { followers: { some: { followerId: user?.id || "signed-out" } } } }
      : {}),
  }
  const games = isPrismaDatasourceConfigured()
    ? await prisma.game
        .findMany({
          where,
          include: {
            creator: {
              select: {
                name: true,
                username: true,
                image: true,
                bio: true,
                currentlyBuilding: true,
              },
            },
            studioProfile: true,
          },
          orderBy: { publishedAt: "desc" },
          take: 24,
        })
        .catch(() => [])
    : []
  const spotlight = games.find((g) => g.creator.bio || g.creator.currentlyBuilding)
  return (
    <CommunityShell
      title="Good games start conversations."
      description="Meet the people experimenting, share a useful thought, and discover what they make next."
    >
      <nav className="mb-7 flex flex-wrap gap-3" aria-label="Community feed">
        <Link className="community-button" href="/community">
          Fresh releases
        </Link>
        <Link className="community-button" href="/community?view=following">
          Following
        </Link>
        <Link className="community-button" href="/community?view=feedback">
          Looking for feedback
        </Link>
      </nav>
      {spotlight && (
        <aside className="inspiration-tile mb-8">
          <p className="text-sm text-primary-text">Meet a creator</p>
          <h2 className="mt-2 text-xl font-semibold">
            {spotlight.creator.name || spotlight.creator.username}
          </h2>
          <p className="mt-2 text-sm leading-7 text-text-secondary">
            {spotlight.creator.currentlyBuilding || spotlight.creator.bio}
          </p>
          {spotlight.creator.username && (
            <Link className="community-button mt-4" href={"/creator/" + spotlight.creator.username}>
              Visit creator profile
            </Link>
          )}
        </aside>
      )}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {games.map((game) => (
          <GameCard key={game.id} game={game} animateThumbnailSlides={false} />
        ))}
      </div>
      {games.length === 0 && (
        <div className="inspiration-tile">
          <h2 className="text-xl font-semibold">
            {view === "following"
              ? "Your next favorite creator is out there."
              : "Every experiment starts somewhere."}
          </h2>
          <p className="mt-3 text-text-secondary">
            {view === "following"
              ? "Follow creators from their game pages to find their releases here."
              : "Share an experiment or explore the games already in the arcade."}
          </p>
          <Link
            href={
              view === "following" && !user
                ? "/login?callbackUrl=%2Fcommunity%3Fview%3Dfollowing"
                : "/games"
            }
            className="community-button mt-4"
          >
            {view === "following" && !user ? "Sign in to see your feed" : "Explore games"}
          </Link>
        </div>
      )}
      <section className="inspiration-tile mt-8">
        <h2 className="text-xl font-semibold">A little feedback goes a long way.</h2>
        <p className="mt-3 text-sm leading-7 text-text-secondary">
          Tell someone what you enjoyed, describe where you got stuck, or suggest one idea they
          could try. Be specific, kind, and respectful of the experiment they want to make.
        </p>
        <Link href="/jams" className="community-button mt-4">
          Explore community challenges
        </Link>
      </section>
    </CommunityShell>
  )
}
