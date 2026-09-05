import type { Metadata } from "next"
import Link from "next/link"
import { ArrowUpRight, Sparkles, Play, Upload } from "lucide-react"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { HomeGameLane } from "@/components/home/home-game-lane"
import { RecentlyPlayedDeferred } from "@/components/games/recently-played-deferred"
import { getHomePageData } from "@/lib/home-page-data"
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
  return (
    <div className="min-h-screen overflow-x-clip bg-canvas">
      <Header prefetchLinks={false} />
      <main id="main-content">
        <section className="community-welcome container mx-auto px-4">
          <div>
            <p className="mb-3 flex items-center gap-2 text-sm font-medium text-primary-text">
              <Sparkles className="h-4 w-4" /> Small games. Big ideas.
            </p>
            <h1 className="text-balance text-2xl font-bold leading-tight tracking-tight text-white sm:text-5xl">
              Play something unexpected.
              <br />
              <span className="text-primary-text">Make something inspired.</span>
            </h1>
            <p className="mt-4 max-w-xl text-sm leading-6 text-text-secondary sm:text-base">
              Discover and share games made with AI. Meet the creators, collect ideas, and share
              what you make.
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <Link className="community-button primary" href="/games">
                <Play className="h-4 w-4" /> Explore games
              </Link>
              <Link className="community-button" href="/upload">
                <Upload className="h-4 w-4" /> Share your game
              </Link>
            </div>
          </div>
          <Link href="/quick-play" className="community-quick-link">
            <span className="text-xs uppercase tracking-widest text-primary-text">
              Feeling curious?
            </span>
            <span className="mt-2 flex items-center gap-4 text-xl font-semibold">
              Find your next surprise <ArrowUpRight className="h-5 w-5" />
            </span>
            <span className="mt-2 text-sm text-text-secondary">
              Try mobile-friendly games in Quick play.
            </span>
          </Link>
        </section>
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
              <h2 className="mt-2 text-2xl font-semibold text-white">
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
