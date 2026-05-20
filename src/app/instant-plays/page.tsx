import type { Metadata } from "next"
import Link from "next/link"
import { ArrowRight, ExternalLink, Gamepad2, Sparkles, Upload } from "lucide-react"
import { Footer } from "@/components/layout/footer"
import { Header } from "@/components/layout/header"
import { Button } from "@/components/ui/button"
import { instantPlayGames } from "@/lib/instant-play-games"
import { SITE_NAME, SITE_URL } from "@/lib/site"

export const revalidate = 3600

export const metadata: Metadata = {
  title: "Instant AI Browser Games",
  description:
    "Play standalone HTML5 games on VibeGames.Ninja, including puzzle, arcade, strategy, and action games that launch instantly in the browser.",
  alternates: {
    canonical: "/instant-plays",
  },
  openGraph: {
    title: `Instant AI Browser Games | ${SITE_NAME}`,
    description:
      "Play a hand-picked set of standalone HTML5 games that launch instantly in the browser.",
    url: `${SITE_URL}/instant-plays`,
    type: "website",
    siteName: SITE_NAME,
  },
  twitter: {
    card: "summary_large_image",
    title: `Instant AI Browser Games | ${SITE_NAME}`,
    description:
      "Play a hand-picked set of standalone HTML5 games that launch instantly in the browser.",
  },
}

export default function InstantPlaysPage() {
  const collectionJsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Instant AI Browser Games",
    url: `${SITE_URL}/instant-plays`,
    description:
      "A collection of standalone HTML5 games that can be played instantly on VibeGames.Ninja.",
    hasPart: instantPlayGames.map((game) => ({
      "@type": "VideoGame",
      name: game.title,
      genre: game.category,
      gamePlatform: "Web Browser",
      url: `${SITE_URL}${game.href}`,
      description: game.description,
    })),
  }

  return (
    <div className="min-h-screen bg-[#0d0d15] text-white">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionJsonLd) }} />
      <Header prefetchLinks={false} />

      <main>
        <section className="border-b-4 border-[#4a4a6a] bg-[#11111d]">
          <div className="container mx-auto grid gap-8 px-4 py-12 lg:grid-cols-[1.1fr_0.9fr] lg:items-center lg:py-16">
            <div>
              <div className="mb-5 inline-flex items-center gap-2 border-2 border-[#00d1ff] bg-[#0d0d15] px-3 py-2">
                <Sparkles className="h-4 w-4 text-[#00d1ff]" />
                <span className="font-pixel text-[10px] text-[#00d1ff]">INSTANT PLAYS</span>
              </div>
              <h1 className="max-w-3xl font-pixel text-2xl leading-tight text-white sm:text-4xl">
                PLAY AI-MADE HTML5 GAMES RIGHT NOW
              </h1>
              <p className="mt-5 max-w-2xl font-arcade text-base leading-7 text-[#c9d1ff]">
                These standalone games load directly in the browser and give new visitors something
                to try before signing in. Share this page when you want the quickest path from
                social post to playable game.
              </p>
              <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                <Link href={instantPlayGames[0].href} prefetch={false}>
                  <Button variant="arcade" size="lg" className="gap-2">
                    <Gamepad2 className="h-5 w-5" />
                    PLAY FIRST PICK
                  </Button>
                </Link>
                <Link href="/upload" prefetch={false}>
                  <Button variant="outline" size="lg" className="gap-2">
                    <Upload className="h-5 w-5" />
                    UPLOAD YOUR GAME
                  </Button>
                </Link>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {instantPlayGames.slice(0, 4).map((game) => (
                <Link
                  key={game.slug}
                  href={game.href}
                  prefetch={false}
                  className="group border-2 border-[#4a4a6a] bg-[#1a1a2e] p-4 transition-all hover:-translate-y-1"
                  style={{ borderColor: `${game.accent}66` }}
                >
                  <div className="mb-4 aspect-video border-2 border-[#4a4a6a] bg-[#0d0d15] p-3">
                    <div
                      className="h-full w-full border-2"
                      style={{
                        borderColor: game.accent,
                        background: `linear-gradient(135deg, ${game.accent}33, #0d0d15 58%)`,
                      }}
                    />
                  </div>
                  <p className="font-pixel text-[9px]" style={{ color: game.accent }}>
                    {game.category.toUpperCase()}
                  </p>
                  <h2 className="mt-2 font-pixel text-xs text-white">{game.title}</h2>
                </Link>
              ))}
            </div>
          </div>
        </section>

        <section className="border-b-4 border-[#4a4a6a] py-12 sm:py-16">
          <div className="container mx-auto px-4">
            <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="font-pixel text-[10px] text-[#ffff00]">BROWSER ARCADE</p>
                <h2 className="mt-2 font-pixel text-xl text-white sm:text-2xl">
                  STANDALONE GAMES TO SHARE
                </h2>
              </div>
              <Link href="/games" prefetch={false}>
                <Button variant="outline" className="gap-2">
                  FULL ARCADE
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {instantPlayGames.map((game) => (
                <Link
                  key={game.slug}
                  href={game.href}
                  prefetch={false}
                  className="group flex min-h-[260px] flex-col border-2 border-[#4a4a6a] bg-[#1a1a2e] p-4 transition-all hover:-translate-y-1"
                >
                  <div className="mb-4 flex items-center justify-between gap-3">
                    <span className="font-pixel text-[9px]" style={{ color: game.accent }}>
                      {game.category.toUpperCase()}
                    </span>
                    <ExternalLink className="h-4 w-4 text-[#8b93a6] transition-colors group-hover:text-white" />
                  </div>
                  <div className="mb-4 aspect-video border-2 border-[#4a4a6a] bg-[#0d0d15] p-3">
                    <div
                      className="h-full w-full border-2"
                      style={{
                        borderColor: game.accent,
                        background: `linear-gradient(135deg, ${game.accent}40, #0d0d15 62%)`,
                      }}
                    />
                  </div>
                  <h3 className="font-pixel text-sm text-white">{game.title}</h3>
                  <p className="mt-3 flex-1 font-arcade text-sm leading-6 text-[#aab6d0]">
                    {game.description}
                  </p>
                  <div className="mt-4 border-t border-[#4a4a6a] pt-3">
                    <p className="font-arcade text-xs text-[#8b93a6]">{game.format}</p>
                    <p className="mt-2 font-arcade text-xs text-[#d5d8e6]">{game.hook}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-[#11111d] py-12">
          <div className="container mx-auto px-4">
            <div className="grid gap-4 md:grid-cols-3">
              <div className="border-2 border-[#4a4a6a] bg-[#1a1a2e] p-5">
                <p className="font-pixel text-[10px] text-[#22c55e]">FOR PLAYERS</p>
                <p className="mt-3 font-arcade text-sm leading-6 text-[#c9d1ff]">
                  No install, no account, no waiting. Open a game, play a round, and share the one
                  that feels best.
                </p>
              </div>
              <div className="border-2 border-[#4a4a6a] bg-[#1a1a2e] p-5">
                <p className="font-pixel text-[10px] text-[#00d1ff]">FOR CREATORS</p>
                <p className="mt-3 font-arcade text-sm leading-6 text-[#c9d1ff]">
                  Use these games as examples when pitching VibeGames to AI builders who want a
                  cleaner place to publish.
                </p>
              </div>
              <div className="border-2 border-[#4a4a6a] bg-[#1a1a2e] p-5">
                <p className="font-pixel text-[10px] text-[#ffff00]">FOR LAUNCH</p>
                <p className="mt-3 font-arcade text-sm leading-6 text-[#c9d1ff]">
                  This page is the safest link for community posts because every click can lead to
                  a playable result.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer prefetchLinks={false} />
    </div>
  )
}
