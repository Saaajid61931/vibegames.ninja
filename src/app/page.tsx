import type { Metadata } from "next"
import Link from "next/link"
import { ArrowUpRight } from "lucide-react"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { HomeGameLane } from "@/components/home/home-game-lane"
import { RecentlyPlayedDeferred } from "@/components/games/recently-played-deferred"
import { getHomePageData } from "@/lib/home-page-data"
import { InspirationHero } from "@/components/home/inspiration-hero"
import { getMonthlyHeroShowcase } from "@/lib/monthly-hero-data"
import { InspirationCollections } from "@/components/community/inspiration-collections"

export const revalidate = 60
export const metadata: Metadata = {
  title: "Play something unexpected. Make something inspired.",
  description:
    "Discover and share games made with AI. Meet the creators, collect ideas, and share what you make.",
  alternates: { canonical: "/" },
}
export default async function HomePage() {
  const data = await getHomePageData()
  const monthlyShowcase = await getMonthlyHeroShowcase()
  return (
    <div className="min-h-screen overflow-x-clip bg-canvas">
      <Header prefetchLinks={false} />
      <main id="main-content">
        <InspirationHero
          rankedGames={monthlyShowcase.games}
          fallbackGames={data.games}
          monthLabel={monthlyShowcase.monthLabel}
        />
        <div id="discover-games" className="scroll-mt-24" />
        <HomeGameLane
          eyebrow="Discover"
          title="Worth a play"
          description="Community-made games to get your imagination going."
          actionHref="/games"
          actionLabel="Explore all"
          games={data.games.slice(0, 4)}
          animateThumbnailSlides={false}
          emptyTitle="Your next idea starts here"
          emptyDescription="Share a playable experiment and help this community grow."
        />
        <InspirationCollections />
        {data.justLaunchedGames.length > 0 && (
          <HomeGameLane
            eyebrow="New voices"
            title="Fresh experiments"
            description="Make someone's first play a good one. Try something new and leave a thoughtful response."
            actionHref="/games?sort=new"
            actionLabel="See new games"
            games={data.justLaunchedGames.slice(0, 4)}
            animateThumbnailSlides={false}
          />
        )}
        {data.needsFeedbackGames.length > 0 && (
          <HomeGameLane
            eyebrow="Lend a hand"
            title="Looking for feedback"
            description="These creators would love to hear what worked, where you got stuck, or an idea you would try."
            actionHref="/community"
            actionLabel="Meet the community"
            games={data.needsFeedbackGames.slice(0, 4)}
            animateThumbnailSlides={false}
          />
        )}
        <RecentlyPlayedDeferred
          games={[...data.games, ...data.mobileGames, ...data.editorGames]}
          animateThumbnailSlides={false}
        />
        <section className="container mx-auto px-4 py-10">
          <div className="community-invitation">
            <div>
              <p className="text-sm text-primary-text">Your experiment belongs here</p>
              <h2 className="mt-2 heading-pixel-md text-white">
                Someone is waiting to discover your idea.
              </h2>
              <p className="mt-3 max-w-2xl leading-7 text-text-secondary">
                Share a game made with your favorite tools. Tell us what you tried, ask for
                feedback, and inspire what comes next.
              </p>
            </div>
            <Link href="/upload" className="community-button primary">
              Share your game <ArrowUpRight className="h-4 w-4" />
            </Link>
          </div>
        </section>
      </main>
      <Footer prefetchLinks={false} />
    </div>
  )
}
