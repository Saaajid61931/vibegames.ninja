import type { Metadata } from "next"
import { unstable_cache } from "next/cache"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import prisma from "@/lib/prisma"
import { DiscoverySort, getDiscoveryOrderBy } from "@/lib/discovery"
import { normalizeDiscoveryFilters, normalizeDiscoveryPage } from "@/lib/discovery-query"
import { pickPrimaryJam, toPrimaryJamBadge } from "@/lib/jams"
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
  const filters = normalizeDiscoveryFilters({
    category: params.category,
    sort: params.sort,
    search: params.q,
    mobile: params.mobile,
    editor: params.editor,
  })
  const resolvedCategory = CATEGORIES.find((category) => category.value.toLowerCase() === filters.category)
  const titleParts = [resolvedCategory?.label, filters.supportsMobile ? "Mobile" : null, filters.hasLevelEditor ? "Level Editor" : null, "AI Games"].filter(Boolean)
  const title = titleParts.join(" ")
  const description = filters.search
    ? `Search results for ${filters.search} on ${SITE_NAME}. Explore browser games, mobile-friendly picks, and creator-made experiments.`
    : resolvedCategory
      ? `Browse ${resolvedCategory.label.toLowerCase()} AI games on ${SITE_NAME}, including trending launches, mobile-ready picks, and remixable experiments.`
      : "Explore trending, popular, mobile-friendly, and level-editor AI-generated HTML5 games across every category."

  const canonicalParams = new URLSearchParams()
  if (filters.category !== "all") canonicalParams.set("category", filters.category)
  if (filters.sort !== "trending") canonicalParams.set("sort", filters.sort)
  if (filters.search) canonicalParams.set("q", filters.search)
  if (filters.supportsMobile) canonicalParams.set("mobile", "true")
  if (filters.hasLevelEditor) canonicalParams.set("editor", "true")
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
      images: [
        {
          url: "/opengraph-image",
          width: 1200,
          height: 630,
          alt: `${title} | ${SITE_NAME}`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: ["/opengraph-image"],
    },
  }
}

const GAMES_PAGE_SIZE = 24

async function queryGames(page: number, category: string, sort: DiscoverySort, q: string, mobile: boolean, editor: boolean) {
  const skip = (page - 1) * GAMES_PAGE_SIZE
  const where: Record<string, unknown> = {
    status: "PUBLISHED",
  }

  if (category !== "all") {
    where.category = category.toUpperCase()
  }

  if (q) {
    where.OR = [
      { title: { contains: q, mode: "insensitive" } },
      { description: { contains: q, mode: "insensitive" } },
      { tags: { contains: q, mode: "insensitive" } },
    ]
  }

  if (mobile) {
    where.supportsMobile = true
  }

  if (editor) {
    where.hasLevelEditor = true
  }

  const orderBy = getDiscoveryOrderBy(sort)

  const [games, total] = await Promise.all([
    prisma.game.findMany({
      where,
        select: {
          id: true,
          slug: true,
          title: true,
          description: true,
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
          select: { id: true, handle: true, displayName: true, image: true },
        },
        creator: {
          select: { id: true, name: true, username: true, image: true },
        },
      },
      orderBy,
      skip,
      take: GAMES_PAGE_SIZE,
    }),
    prisma.game.count({ where }),
  ])

  return {
    data: games,
    total,
    page,
    hasMore: skip + games.length < total,
  }
}

const getCachedGames = unstable_cache(queryGames, ["games-page-list"], {
  revalidate: 30,
  tags: ["games"],
})

export default async function GamesPage({ searchParams }: PageProps) {
  const params = await searchParams
  const filters = normalizeDiscoveryFilters({
    category: params.category,
    sort: params.sort,
    search: params.q,
    mobile: params.mobile,
    editor: params.editor,
  })
  const page = normalizeDiscoveryPage(params.page)
  const query = filters.search ? queryGames : getCachedGames
  const response = await query(
    page,
    filters.category,
    filters.sort,
    filters.search,
    filters.supportsMobile,
    filters.hasLevelEditor
  )
  const normalizedGames = response.data.map((game) => ({
    ...game,
    createdAt: new Date(game.createdAt),
    primaryJam: toPrimaryJamBadge(pickPrimaryJam(game.jamEntries)),
  }))

  const browseJsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Browse AI Games",
    url: `${SITE_URL}/games`,
    description: "Browse AI-made browser games by category, popularity, mobile support, and level-editor support.",
  }

  return (
    <div className="min-h-screen flex flex-col bg-canvas">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(browseJsonLd) }} />
      <Header />
      
      <main className="flex-1">
         <GamesBrowser 
            initialGames={normalizedGames} 
            initialTotal={response.total}
            initialHasMore={response.hasMore}
            initialPage={response.page}
            initialCategory={filters.category}
            initialSort={filters.sort}
            initialQuery={filters.search}
            initialSupportsMobile={filters.supportsMobile}
            initialEditorOnly={filters.hasLevelEditor}
         />
      </main>
      
      <Footer />
    </div>
  )
}
