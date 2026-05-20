import type { Metadata } from "next"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { GameOfTheDay } from "@/components/games/game-of-the-day"
import { RecentlyPlayedDeferred } from "@/components/games/recently-played-deferred"
import { ActiveJamBanner } from "@/components/jams/active-jam-banner"
import { HomeGameLane } from "@/components/home/home-game-lane"
import { HomeHeroSection } from "@/components/home/home-hero-section"
import {
  HomeCategoryBar,
  HomeCommunityCta,
  HomeDiscoveryShortcuts,
  HomeFeatureGrid,
  HomeInstantPlaysSection,
} from "@/components/home/home-static-sections"
import { getHomePageData } from "@/lib/home-page-data"
import { SITE_DESCRIPTION, SITE_NAME, SITE_URL } from "@/lib/site"

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
    stats,
    gameOfTheMonth,
    games,
    mobileGames,
    editorGames,
    justLaunchedGames,
    needsFeedbackGames,
    updatedThisWeekGames,
    builtWithToolsGames,
    categoryLinks,
  } = await getHomePageData()

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
    <div className="min-h-screen flex flex-col bg-[#0d0d15]">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }} />
      <Header prefetchLinks={false} />

      <main className="flex-1">
        <HomeHeroSection stats={stats} />
        <HomeCategoryBar />
        <ActiveJamBanner />
        <RecentlyPlayedDeferred
          games={[...games, ...mobileGames, ...editorGames]}
          animateThumbnailSlides={false}
        />

        {gameOfTheMonth?.game ? (
          <GameOfTheDay
            game={gameOfTheMonth.game}
            monthlyStars={gameOfTheMonth.monthlyStars}
            monthlyRatings={gameOfTheMonth.monthlyRatings}
          />
        ) : null}

        <HomeGameLane
          eyebrow="TOP GAMES"
          title="FEATURED ARCADE"
          actionHref="/games"
          actionLabel="VIEW ALL"
          games={games}
          animateThumbnailSlides={false}
        />

        <HomeFeatureGrid />
        <HomeInstantPlaysSection />
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
