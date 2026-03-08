import type { Metadata } from "next"
import { notFound } from "next/navigation"
import Link from "next/link"
import { ChevronLeft, Gamepad2, Building2, Trophy, Smartphone, Sparkles } from "lucide-react"
import prisma from "@/lib/prisma"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { GameCard } from "@/components/games/game-card"
import { Button } from "@/components/ui/button"
import { getDiscoveryOrderBy } from "@/lib/discovery"
import { getInitials } from "@/lib/utils"
import { SITE_NAME, SITE_URL } from "@/lib/site"
import type { GameCardData } from "@/types"
import { cache } from "react"

interface PageProps {
  params: Promise<{ handle: string }>
}

const getStudio = cache(async (handle: string) => {
  return prisma.studioProfile.findUnique({
    where: { handle },
    select: {
      id: true,
      handle: true,
      displayName: true,
      image: true,
      createdAt: true,
    },
  })
})

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { handle } = await params
  const studio = await getStudio(handle)

  if (!studio) {
    return {
      title: "Studio Not Found",
      robots: { index: false, follow: false },
    }
  }

  const profilePath = `/studio/${studio.handle}`
  const description = `Play games published by ${studio.displayName} on VibeGames.Ninja.`
  const ogImage = studio.image ? new URL(studio.image, SITE_URL).toString() : `${SITE_URL}/opengraph-image`

  return {
    title: `${studio.displayName} (@${studio.handle})`,
    description,
    alternates: {
      canonical: profilePath,
    },
    openGraph: {
      title: `${studio.displayName} (@${studio.handle})`,
      description,
      url: `${SITE_URL}${profilePath}`,
      type: "website",
      siteName: SITE_NAME,
      images: [ogImage],
    },
    twitter: {
      card: "summary_large_image",
      title: `${studio.displayName} (@${studio.handle})`,
      description,
      images: [ogImage],
    },
  }
}

export default async function StudioPage({ params }: PageProps) {
  const { handle } = await params
  const studio = await getStudio(handle)

  if (!studio) {
    notFound()
  }

  const games = await prisma.game.findMany({
    where: {
      status: "PUBLISHED",
      studioProfileId: studio.id,
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
      studioProfile: {
        select: { id: true, handle: true, displayName: true, image: true },
      },
      creator: {
        select: { id: true, name: true, username: true, image: true },
      },
    },
    orderBy: getDiscoveryOrderBy("trending"),
  })

  const normalizedGames: GameCardData[] = games.map((game) => ({
    ...game,
    createdAt: new Date(game.createdAt),
  }))
  const mobileReadyGames = normalizedGames.filter((game) => game.supportsMobile).length
  const topGame = [...normalizedGames].sort((a, b) => (b.plays + b.likes * 3) - (a.plays + a.likes * 3))[0]

  const studioJsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: studio.displayName,
    alternateName: `@${studio.handle}`,
    url: `${SITE_URL}/studio/${studio.handle}`,
    image: studio.image || undefined,
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#0d0d15]">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(studioJsonLd) }} />
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
                <AvatarImage src={studio.image || undefined} />
                <AvatarFallback className="bg-[#0d0d15] text-[#4a4a6a]">
                  {getInitials(studio.displayName || "S")}
                </AvatarFallback>
              </Avatar>
              <div>
                <div className="inline-flex items-center gap-2 mb-1">
                  <Building2 className="h-4 w-4 text-[#ffff00]" />
                  <span className="font-pixel text-[10px] text-[#ffff00]">STUDIO PROFILE</span>
                </div>
                <h1 className="font-pixel text-sm text-white">{studio.displayName}</h1>
                <p className="font-arcade text-sm text-[#ffff00]">@{studio.handle}</p>
              </div>
            </div>

            <Link href="/upload">
              <Button variant="outline" size="sm" className="gap-2">
                <Gamepad2 className="h-4 w-4" />
                Upload a game
              </Button>
            </Link>
          </div>

          <div className="mt-5 grid gap-3 md:grid-cols-3">
            <div className="border border-[#4a4a6a] bg-[#0d0d15] p-3">
              <div className="flex items-center gap-2">
                <Trophy className="h-4 w-4 text-[#ffff00]" />
                <span className="font-arcade text-[11px] text-[#ffff00]">FEATURED TITLE</span>
              </div>
              <p className="mt-2 font-arcade text-sm text-white">{topGame?.title || "Launching soon"}</p>
            </div>
            <div className="border border-[#4a4a6a] bg-[#0d0d15] p-3">
              <div className="flex items-center gap-2">
                <Smartphone className="h-4 w-4 text-[#22c55e]" />
                <span className="font-arcade text-[11px] text-[#22c55e]">MOBILE READY</span>
              </div>
              <p className="mt-2 font-arcade text-sm text-white">{mobileReadyGames} live games</p>
            </div>
            <div className="border border-[#4a4a6a] bg-[#0d0d15] p-3">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-[#00d1ff]" />
                <span className="font-arcade text-[11px] text-[#00d1ff]">SHARE THIS STUDIO</span>
              </div>
              <p className="mt-2 font-arcade text-sm text-white">Use this page as the hub for your best launches.</p>
            </div>
          </div>
        </section>

        <section>
          <div className="mb-5 flex items-center justify-between gap-3">
            <h2 className="font-pixel text-sm text-white">ALL GAMES [{normalizedGames.length}]</h2>
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
