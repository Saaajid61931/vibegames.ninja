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
  HomeFeatureGrid,
} from "@/components/home/home-static-sections"
import { getHomePageData } from "@/lib/home-page-data"
import { SITE_NAME, SITE_URL } from "@/lib/site"
import { MobileReelsFeed } from "@/components/home/mobile-reels-feed"

export const revalidate = 60

const homepageDescription = "Discover and play games made with AI, get inspired by creators, and build something of your own with the VibeGames Ninja community."

export const metadata: Metadata = {
  title: "Play AI Games, Get Inspired & Build",
  description: homepageDescription,
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: `${SITE_NAME} - Play AI Games Made by the Community`,
    description: homepageDescription,
    url: SITE_URL,
    type: "website",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: `${SITE_NAME} - Play AI Games Made by the Community`,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE_NAME} - Play AI Games Made by the Community`,
    description: homepageDescription,
    images: ["/opengraph-image"],
  },
}

export default async function HomePage() {
  const {
    stats,
    gameOfTheMonth,
    games,
    mobileGames,
    editorGames,
    allMobileGames,
    heroGames,
  } = await getHomePageData()

  const websiteJsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE_NAME,
    url: SITE_URL,
    description: homepageDescription,
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
    <>
      {/* Desktop Homepage View */}
      <div className="hidden md:flex flex-col min-h-screen bg-[#0d0d15] hidden-mobile-landscape">
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }} />
        <Header prefetchLinks={false} />

        <main className="flex-1">
          <HomeHeroSection stats={stats} heroGames={heroGames} />
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
            description="Start with games the community is playing and sharing right now."
            actionHref="/games"
            actionLabel="VIEW ALL"
            games={games}
            animateThumbnailSlides={false}
          />

          <HomeFeatureGrid />
          <HomeCommunityCta />
        </main>

        <Footer prefetchLinks={false} />
      </div>

      {/* Mobile Reels snap scrolling feed */}
      <div className="block md:hidden h-[100dvh] w-full bg-[#0d0d15] overflow-hidden block-mobile-landscape">
        <MobileReelsFeed
          games={allMobileGames}
          backgroundGames={heroGames}
          stats={stats}
        />
      </div>
    </>
  )
}
