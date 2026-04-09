import Link from "next/link"
import { Gamepad2, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { HomePageData } from "@/lib/home-page-data"

type HomeHeroSectionProps = {
  stats: HomePageData["stats"]
}

export function HomeHeroSection({ stats }: HomeHeroSectionProps) {
  return (
    <section className="relative overflow-hidden border-b-2 sm:border-b-4 border-[#4a4a6a]">
      <div className="absolute inset-0 pixel-bg" />
      <div className="absolute inset-0 bg-gradient-to-b from-[#0080ff]/10 via-transparent to-[#ff0040]/10" />

      <div className="relative container mx-auto px-4 py-14 sm:py-20 md:py-32">
        <div className="max-w-5xl mx-auto text-center">
          <h1 className="mb-8">
            <span
              className="block text-[clamp(1.6rem,8.5vw,2.3rem)] sm:text-5xl md:text-6xl lg:text-7xl font-bold text-white mb-3 sm:mb-4 leading-[1.05]"
              style={{ fontFamily: "var(--font-pixel), monospace" }}
            >
              EXPLORE
            </span>
            <span
              className="block text-[clamp(1.6rem,8.5vw,2.3rem)] sm:text-5xl md:text-6xl lg:text-7xl font-bold text-[#ffff00] leading-[1.05] drop-shadow-[3px_3px_0_#ff0040] sm:drop-shadow-[4px_4px_0_#ff0040]"
              style={{ fontFamily: "var(--font-pixel), monospace" }}
            >
              CREATIVITY
            </span>
          </h1>

          <p className="mx-auto mb-8 max-w-2xl font-arcade text-base text-[#aab6d0] sm:mb-12 sm:text-xl md:text-2xl">
            Discover browser games, upload your own builds, and publish the ones that hit.
            VibeGames is built for creator-friendly sharing.
          </p>

          <div className="mx-auto flex max-w-md flex-col gap-4 sm:max-w-none sm:flex-row sm:justify-center">
            <Link href="/games" prefetch={false} className="block sm:inline-block">
              <Button variant="arcade" size="xl" className="w-full gap-3">
                <Gamepad2 className="h-5 w-5" />
                START EXPLORING
              </Button>
            </Link>
            <Link href="/upload" prefetch={false} className="block sm:inline-block">
              <Button variant="outline" size="xl" className="w-full gap-3">
                <Sparkles className="h-5 w-5" />
                START UPLOADING
              </Button>
            </Link>
          </div>

          <div className="mx-auto mt-12 grid max-w-3xl grid-cols-3 gap-2 border-t-2 border-[#4a4a6a] pt-6 sm:mt-16 sm:gap-4 sm:border-t-4 sm:pt-8">
            <div className="bg-[#1a1a2e] border-2 border-[#0080ff] p-2.5 text-center sm:p-4">
              <div className="mb-1 font-pixel text-[9px] text-[#0080ff] sm:text-[10px]">GAMES</div>
              <div className="font-pixel text-base font-bold text-white sm:text-2xl md:text-3xl">
                {stats.games.toString().padStart(6, "0")}
              </div>
            </div>
            <div className="bg-[#1a1a2e] border-2 border-[#ff0040] p-2.5 text-center sm:p-4">
              <div className="mb-1 font-pixel text-[9px] text-[#ff0040] sm:text-[10px]">CREATORS</div>
              <div className="font-pixel text-base font-bold text-white sm:text-2xl md:text-3xl">
                {stats.creators.toString().padStart(6, "0")}
              </div>
            </div>
            <div className="bg-[#1a1a2e] border-2 border-[#ffff00] p-2.5 text-center sm:p-4">
              <div className="mb-1 font-pixel text-[9px] text-[#ffff00] sm:text-[10px]">PLAYS</div>
              <div className="font-pixel text-base font-bold text-white sm:text-2xl md:text-3xl">
                {(stats.plays % 1000000).toString().padStart(6, "0")}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
