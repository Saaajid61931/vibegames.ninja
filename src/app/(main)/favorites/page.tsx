import Link from "next/link"
import { redirect } from "next/navigation"
import { Heart, ArrowLeft } from "lucide-react"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { GameCard } from "@/components/games/game-card"
import { Button } from "@/components/ui/button"
import { auth } from "@/lib/auth"
import prisma from "@/lib/prisma"

export const dynamic = "force-dynamic"

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
          category: true,
          plays: true,
          likes: true,
          aiModel: true,
          supportsMobile: true,
          createdAt: true,
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
            <h1 className="text-2xl font-semibold text-[var(--color-text)] flex items-center gap-3">
              <Heart className="h-6 w-6 text-[var(--color-arcade-red)]" />
              My Favorites
            </h1>
            <p className="mt-2 text-sm text-[var(--color-text-secondary)]">
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
          <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-8 text-center">
            <p className="text-[var(--color-text-secondary)]">No favorites yet.</p>
            <p className="text-sm text-[var(--color-text-tertiary)] mt-2">
              Open a game and use Save Favorite to keep it here.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {favorites.map((entry) => (
              <GameCard key={entry.id} game={entry.game} />
            ))}
          </div>
        )}
      </main>

      <Footer />
    </div>
  )
}
