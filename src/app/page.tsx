import type { Metadata } from "next"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { RecentlyPlayedDeferred } from "@/components/games/recently-played-deferred"
import { ActiveJamBanner } from "@/components/jams/active-jam-banner"
import { HomeGameLane } from "@/components/home/home-game-lane"
import { HomeHeroSection } from "@/components/home/home-hero-section"
import {
  HomeCategoryBar,
  HomeCommunityCta,
  HomeDiscoveryShortcuts,
  HomeFeatureGrid,
} from "@/components/home/home-static-sections"
import { getHomePageData } from "@/lib/home-page-data"
import { SITE_DESCRIPTION, SITE_NAME, SITE_URL } from "@/lib/site"
import { MobileReelsFeed } from "@/components/home/mobile-reels-feed"

export const revalidate = 60

export const metadata: Metadata = {
  title: "AI Arcade - Build, Play & Get Inspired",
  description: "A community for AI-made games. Build with AI, play amazing creations, and get inspired by other creators.",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: `${SITE_NAME} - AI Arcade`,
    description: SITE_DESCRIPTION,
    url: SITE_URL,
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE_NAME} - AI Arcade`,
    description: SITE_DESCRIPTION,
  },
}

export default async function HomePage() {
  const {
    gameOfTheMonth,
    games,
    mobileGames,
    editorGames,
    justLaunchedGames,
    needsFeedbackGames,
    updatedThisWeekGames,
    builtWithToolsGames,
    categoryLinks,
    allMobileGames,
  } = await getHomePageData()

  const heroGame = gameOfTheMonth?.game ?? games[0] ?? null

  const websiteJsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE_NAME,
    url: SITE_URL,
    description: SITE_DESCRIPTION,
    potentialAction: {
      "@type": "SearchAction",
      target: `${SITE_URL}/games?q={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  }

  const organizationJsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: SITE_NAME,
    url: SITE_URL,
    logo: `${SITE_URL}/icon.svg`,
  }

  return (
    <div className="flex flex-col min-h-screen bg-[#0d0d15]">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }} />
      <Header prefetchLinks={false} />

      <main className="flex-1">
        <HomeHeroSection
          featuredGame={heroGame ? {
            slug: heroGame.slug,
            title: heroGame.title,
            description: heroGame.description,
            thumbnail: heroGame.thumbnail,
            thumbnailSlides: heroGame.thumbnailSlides,
            category: String(heroGame.category),
            plays: heroGame.plays,
            likes: heroGame.likes,
            aiModel: heroGame.aiModel,
          } : null}
        />
        <HomeCategoryBar />
        <ActiveJamBanner />
        <RecentlyPlayedDeferred
          games={[...games, ...mobileGames, ...editorGames]}
          animateThumbnailSlides={false}
        />

        <HomeGameLane
          eyebrow="TOP GAMES"
          title="FEATURED ARCADE"
          actionHref="/games"
          actionLabel="VIEW ALL"
          games={games}
          animateThumbnailSlides={false}
        />

        <HomeFeatureGrid />
        <HomeCommunityCta />

        {justLaunchedGames.length > 0 ? (
          <HomeGameLane
            eyebrow="AUTOMATIC DISCOVERY"
            title="JUST LAUNCHED"
            actionHref="/games?sort=new"
            actionLabel="SEE NEW GAMES"
            games={justLaunchedGames}
            sectionClassName="bg-[#11111d]"
            animateThumbnailSlides={false}
          />
        ) : null}

        {needsFeedbackGames.length > 0 ? (
          <HomeGameLane
            eyebrow="CREATOR SUPPORT"
            title="NEEDS FEEDBACK"
            actionHref="/upload"
            actionLabel="UPLOAD YOUR BUILD"
            games={needsFeedbackGames}
            animateThumbnailSlides={false}
          />
        ) : null}

        {updatedThisWeekGames.length > 0 ? (
          <HomeGameLane
            eyebrow="ACTIVE CREATORS"
            title="UPDATED THIS WEEK"
            actionHref="/creator"
            actionLabel="OPEN DASHBOARD"
            games={updatedThisWeekGames}
            sectionClassName="bg-[#11111d]"
            animateThumbnailSlides={false}
          />
        ) : null}

        {builtWithToolsGames.length > 0 ? (
          <HomeGameLane
            eyebrow="AI HOBBYIST ENERGY"
            title="BUILT WITH GPT, CLAUDE, OR CURSOR"
            actionHref="/games"
            actionLabel="BROWSE MORE"
            games={builtWithToolsGames}
            animateThumbnailSlides={false}
          />
        ) : null}

        <HomeDiscoveryShortcuts categoryLinks={categoryLinks} />

        {mobileGames.length > 0 ? (
          <HomeGameLane
            eyebrow="MOBILE COLLECTION"
            title="QUICK PLAYS FOR PHONE SCREENS"
            actionHref="/games?mobile=true"
            actionLabel="SEE MOBILE GAMES"
            games={mobileGames}
            animateThumbnailSlides={false}
          />
        ) : null}

        {editorGames.length > 0 ? (
          <HomeGameLane
            eyebrow="REMIX-FRIENDLY"
            title="GAMES WITH LEVEL EDITORS"
            actionHref="/games?editor=true"
            actionLabel="BROWSE EDITOR GAMES"
            games={editorGames}
            sectionClassName="bg-[#11111d]"
            animateThumbnailSlides={false}
          />
        ) : null}
      </main>

      <Footer prefetchLinks={false} />
    </div>
  )
}
