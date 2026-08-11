import Link from "next/link"
import { redirect } from "next/navigation"
import { Heart, ArrowLeft } from "lucide-react"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { GameCard } from "@/components/games/game-card"
import { Button } from "@/components/ui/button"
import { auth } from "@/lib/auth"
import { pickPrimaryJam, toPrimaryJamBadge } from "@/lib/jams"
import prisma from "@/lib/prisma"

export const dynamic = "force-dynamic"

export const metadata = {
  title: "My Favorites",
  description: "Your saved favorite games on VibeGames.",
}

export default async function FavoritesPage() {
  const session = await auth()

  if (!session?.user?.id) {
    redirect(`/login?callbackUrl=${encodeURIComponent("/favorites")}`)
  }

  const favorites = await prisma.favorite.findMany({
    where: {
      userId: session.user.id,
      game: {
        status: "PUBLISHED",
      },
    },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      game: {
        select: {
          id: true,
          slug: true,
          title: true,
          thumbnail: true,
          thumbnailSlides: true,
          category: true,
          plays: true,
          likes: true,
          aiModel: true,
          supportsMobile: true,
          createdAt: true,
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
          studioProfile: {
            select: {
              handle: true,
              displayName: true,
              image: true,
            },
          },
          creator: {
            select: {
              name: true,
              username: true,
              image: true,
            },
          },
        },
      },
    },
  })

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 container mx-auto px-4 py-6 sm:py-8">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold text-text flex items-center gap-3">
              <Heart className="h-6 w-6 text-arcade-red" />
              My Favorites
            </h1>
            <p className="mt-2 text-sm text-text-secondary">
              Saved games stay here so you can return anytime.
            </p>
          </div>
          <Link href="/games">
            <Button variant="outline" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Browse Games
            </Button>
          </Link>
        </div>

        {favorites.length === 0 ? (
          <div className="border-3 border-dashed border-border-strong bg-surface p-10 text-center shadow-hard-4">
            <Heart className="mx-auto h-12 w-12 text-arcade-red" />
            <h2 className="heading-pixel-md mt-5 text-text">Your cabinet is empty</h2>
            <p className="mx-auto mt-3 max-w-md text-sm text-text-secondary">
              Open a game and use Save Favorite to keep it here.
            </p>
            <Button asChild variant="arcade" className="mt-6">
              <Link href="/games">Find a new favorite</Link>
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {favorites.map((entry) => (
              <GameCard
                key={entry.id}
                game={{
                  ...entry.game,
                  primaryJam: toPrimaryJamBadge(pickPrimaryJam(entry.game.jamEntries)),
                }}
              />
            ))}
          </div>
        )}
      </main>

      <Footer />
    </div>
  )
}
