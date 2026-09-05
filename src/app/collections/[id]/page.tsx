import { notFound } from "next/navigation"
import { auth } from "@/lib/auth"
import prisma from "@/lib/prisma"
import { CommunityShell } from "@/components/community/community-shell"
import { GameCard } from "@/components/games/game-card"
export const dynamic = "force-dynamic"
export const metadata = { title: "Game collection", robots: { index: false, follow: true } }
export default async function CollectionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await auth()
  const collection = await prisma.inspirationCollection.findUnique({
    where: { id },
    include: {
      user: { select: { name: true, username: true } },
      items: {
        where: { game: { status: "PUBLISHED" } },
        include: {
          game: {
            include: {
              creator: { select: { name: true, username: true, image: true } },
              studioProfile: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      },
    },
  })
  if (!collection || (!collection.isPublic && collection.userId !== session?.user?.id)) notFound()
  return (
    <CommunityShell
      title={collection.name}
      description={
        collection.description ||
        "Collected by " + (collection.user.name || collection.user.username || "a community member")
      }
    >
      <p className="mb-5 text-sm text-text-secondary">
        {collection.isPublic
          ? "Public collection — share this page with a friend."
          : "Private collection — only you can see this page."}
      </p>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {collection.items.map((i) => (
          <GameCard key={i.gameId} game={i.game} animateThumbnailSlides={false} />
        ))}
      </div>
      {collection.items.length === 0 && (
        <p>No games yet. Add a saved game from your collections page.</p>
      )}
    </CommunityShell>
  )
}
