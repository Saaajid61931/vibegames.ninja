import Link from "next/link"
import { Gamepad2, Upload } from "lucide-react"
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

          <p className="text-base sm:text-xl md:text-2xl text-[#4a4a6a] mb-8 sm:mb-12 max-w-2xl mx-auto font-arcade">
            Build, play, and remix games created with AI.
            Skills shouldn&apos;t be an issue to explore creativity.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/games">
              <Button variant="arcade" size="xl" className="gap-3">
                <Gamepad2 className="h-5 w-5" />
                START EXPLORING
              </Button>
            </Link>
            <Link href="/upload">
              <Button variant="outline" size="xl" className="gap-3">
                <Upload className="h-5 w-5" />
                CREATE A GAME
              </Button>
            </Link>
          </div>

          <div className="mt-12 sm:mt-16 pt-6 sm:pt-8 border-t-2 sm:border-t-4 border-[#4a4a6a] grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 max-w-3xl mx-auto">
            <div className="text-center p-3 sm:p-4 bg-[#1a1a2e] border-2 border-[#0080ff]">
              <div className="text-[10px] text-[#0080ff] mb-1 font-pixel">GAMES</div>
              <div className="text-xl sm:text-2xl md:text-3xl font-bold text-white font-pixel">
                {stats.games.toString().padStart(6, "0")}
              </div>
            </div>
            <div className="text-center p-3 sm:p-4 bg-[#1a1a2e] border-2 border-[#ff0040]">
              <div className="text-[10px] text-[#ff0040] mb-1 font-pixel">CREATORS</div>
              <div className="text-xl sm:text-2xl md:text-3xl font-bold text-white font-pixel">
                {stats.creators.toString().padStart(6, "0")}
              </div>
            </div>
            <div className="text-center p-3 sm:p-4 bg-[#1a1a2e] border-2 border-[#ffff00]">
              <div className="text-[10px] text-[#ffff00] mb-1 font-pixel">PLAYS</div>
              <div className="text-xl sm:text-2xl md:text-3xl font-bold text-white font-pixel">
                {(stats.plays % 1000000).toString().padStart(6, "0")}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
