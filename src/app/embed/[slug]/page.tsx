import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { ExternalLink } from "lucide-react"
import prisma from "@/lib/prisma"
import { SITE_URL } from "@/lib/site"
import { GamePlayer } from "@/components/games/game-player"
import { PlayTracker } from "@/components/games/play-tracker"
import { Button } from "@/components/ui/button"

interface PageProps {
  params: Promise<{ slug: string }>
}

async function getGame(slug: string) {
  return prisma.game.findUnique({
    where: { slug },
    select: {
      id: true,
      slug: true,
      title: true,
      description: true,
      gameUrl: true,
      supportsMobile: true,
      mobileOrientation: true,
      status: true,
    },
  })
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const game = await getGame(slug)

  if (!game || game.status !== "PUBLISHED") {
    return {
      title: "Embed Not Found",
      robots: { index: false, follow: false },
    }
  }

  return {
    title: `${game.title} Embed`,
    description: game.description,
    alternates: {
      canonical: `${SITE_URL}/play/${game.slug}`,
    },
    robots: { index: false, follow: false },
  }
}

export default async function EmbedPage({ params }: PageProps) {
  const { slug } = await params
  const game = await getGame(slug)

  if (!game || game.status !== "PUBLISHED") {
    notFound()
  }

  return (
    <main className="min-h-screen bg-[#0d0d15] p-3 sm:p-4">
      <div className="mx-auto max-w-6xl space-y-3">
        <PlayTracker gameId={game.id} />
        <GamePlayer
          title={game.title}
          gameUrl={game.gameUrl}
          runtimeLabel={`${game.title.toLowerCase().replace(/\s+/g, "_")}.exe`}
          supportsMobile={game.supportsMobile}
          mobileOrientation={game.mobileOrientation}
        />
        <div className="flex flex-wrap items-center justify-between gap-3 border border-[#2e3446] bg-[#111626] px-3 py-2">
          <div>
            <p className="font-arcade text-sm text-white">{game.title}</p>
            <p className="font-arcade text-[11px] text-[#8b93a6]">Powered by VibeGames.Ninja</p>
          </div>
          <Button asChild variant="outline" size="sm" className="gap-2">
            <Link href={`/play/${game.slug}`} target="_blank" rel="noreferrer">
              <ExternalLink className="h-4 w-4" />
              Open Full Page
            </Link>
          </Button>
        </div>
      </div>
    </main>
  )
}
