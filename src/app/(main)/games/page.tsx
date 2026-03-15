import type { Metadata } from "next"
import { unstable_cache } from "next/cache"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import prisma from "@/lib/prisma"
import { DiscoverySort, getDiscoveryOrderBy } from "@/lib/discovery"
import { GamesBrowser } from "@/components/games/games-browser"
import { CATEGORIES } from "@/lib/utils"
import { SITE_NAME, SITE_URL } from "@/lib/site"

type GamesSearchParams = {
  category?: string
  sort?: string
  q?: string
  mobile?: string
  editor?: string
  page?: string
}

interface PageProps {
  searchParams: Promise<GamesSearchParams>
}

export async function generateMetadata({ searchParams }: PageProps): Promise<Metadata> {
  const params = await searchParams
  const resolvedCategory = CATEGORIES.find((category) => category.value.toLowerCase() === params.category)
  const titleParts = [resolvedCategory?.label, params.mobile === "true" ? "Mobile" : null, params.editor === "true" ? "Level Editor" : null, "AI Games"].filter(Boolean)
  const title = titleParts.join(" ")
  const description = params.q
    ? `Search results for ${params.q} on ${SITE_NAME}. Explore browser games, mobile-friendly picks, and creator-made experiments.`
    : resolvedCategory
      ? `Browse ${resolvedCategory.label.toLowerCase()} AI games on ${SITE_NAME}, including trending launches, mobile-ready picks, and remixable experiments.`
      : "Explore trending, popular, mobile-friendly, and level-editor AI-generated HTML5 games across every category."

  const canonicalParams = new URLSearchParams()
  if (params.category) canonicalParams.set("category", params.category)
  if (params.sort && params.sort !== "trending") canonicalParams.set("sort", params.sort)
  if (params.q) canonicalParams.set("q", params.q)
  if (params.mobile === "true") canonicalParams.set("mobile", "true")
  if (params.editor === "true") canonicalParams.set("editor", "true")
  const canonical = canonicalParams.size > 0 ? `/games?${canonicalParams.toString()}` : "/games"

  return {
    title,
    description,
    alternates: {
      canonical,
    },
    openGraph: {
      title,
      description,
      url: `${SITE_URL}${canonical}`,
      type: "website",
      siteName: SITE_NAME,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  }
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
        seekingFeedback: true,
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

  const browseJsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Browse AI Games",
    url: `${SITE_URL}/games`,
    description: "Browse AI-made browser games by category, popularity, mobile support, and level-editor support.",
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#0d0d15]">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(browseJsonLd) }} />
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
