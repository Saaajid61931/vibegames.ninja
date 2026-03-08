import type { Metadata } from "next"
import { unstable_cache } from "next/cache"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import prisma from "@/lib/prisma"
import { DiscoverySort, getDiscoveryOrderBy } from "@/lib/discovery"
import { GamesBrowser } from "@/components/games/games-browser"

export const metadata: Metadata = {
  title: "Browse AI Games",
  description: "Explore trending, popular, and new AI-generated HTML5 games across action, puzzle, racing, and more categories.",
  alternates: {
    canonical: "/games",
  },
}

type GamesSearchParams = {
  category?: string
  sort?: string
  q?: string
  mobile?: string
  editor?: string
}

interface PageProps {
  searchParams: Promise<GamesSearchParams>
}

const getGames = unstable_cache(async (category?: string, sort?: string, q?: string, mobile?: string, editor?: string) => {
  const where: Record<string, unknown> = {
    status: "PUBLISHED",
  }

  if (category && category !== "all") {
    where.category = category.toUpperCase()
  }

  if (q) {
    where.OR = [
      { title: { contains: q, mode: "insensitive" } },
      { description: { contains: q, mode: "insensitive" } },
      { tags: { contains: q, mode: "insensitive" } },
    ]
  }

  if (mobile === "true") {
    where.supportsMobile = true
  }

  if (editor === "true") {
    where.hasLevelEditor = true
  }

  const parsedSort: DiscoverySort = ["trending", "new", "popular", "top"].includes(sort || "")
    ? (sort as DiscoverySort)
    : "trending"
  const orderBy = getDiscoveryOrderBy(parsedSort)

  const [games, total] = await Promise.all([
    prisma.game.findMany({
      where,
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
        hasLevelEditor: true,
        aiTool: true,
        aiModel: true,
        studioProfile: {
          select: { id: true, handle: true, displayName: true, image: true },
        },
        creator: {
          select: { id: true, name: true, username: true, image: true },
        },
      },
      orderBy,
      take: 24,
    }),
    prisma.game.count({ where }),
  ])

  return {
    data: games,
    total,
    hasMore: games.length < total,
  }
}, ["games-page-list"], { revalidate: 30, tags: ["games"] })

export default async function GamesPage({ searchParams }: PageProps) {
  const params = await searchParams
  const response = await getGames(params.category, params.sort, params.q, params.mobile, params.editor)
  const normalizedGames = response.data.map((game) => ({
    ...game,
    createdAt: new Date(game.createdAt),
  }))

  return (
    <div className="min-h-screen flex flex-col bg-[#0d0d15]">
      <Header />
      
      <main className="flex-1">
         <GamesBrowser 
            initialGames={normalizedGames} 
            initialTotal={response.total}
            initialHasMore={response.hasMore}
            initialCategory={params.category} 
            initialSort={params.sort} 
            initialQuery={params.q} 
            initialSupportsMobile={params.mobile === "true"}
            initialEditorOnly={params.editor === "true"}
         />
      </main>
      
      <Footer />
    </div>
  )
}
