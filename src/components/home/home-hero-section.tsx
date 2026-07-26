import Link from "next/link"
import { ArrowUpRight, Gamepad2, Play, UsersRound } from "lucide-react"
import { HomeGameBackdrop } from "@/components/home/home-game-backdrop"
import { Button } from "@/components/ui/button"
import type { HomePageData } from "@/lib/home-page-data"

type HomeHeroSectionProps = {
  stats: HomePageData["stats"]
  heroGames: HomePageData["heroGames"]
}

const communityMetrics = [
  {
    key: "games",
    label: "GAMES",
    detail: "READY TO PLAY",
    icon: Gamepad2,
    color: "#facc15",
  },
  {
    key: "creators",
    label: "CREATORS",
    detail: "BUILDING IN PUBLIC",
    icon: UsersRound,
    color: "#00d1ff",
  },
  {
    key: "plays",
    label: "PLAYS",
    detail: "AND COUNTING",
    icon: Play,
    color: "#f43f5e",
  },
] as const

export function HomeHeroSection({ stats, heroGames }: HomeHeroSectionProps) {
  return (
    <section className="relative isolate min-h-[680px] overflow-hidden border-b-2 border-[#4a4a6a] bg-[#090b12] sm:border-b-4 lg:min-h-[720px]">
      <HomeGameBackdrop games={heroGames} variant="desktop" />

      <div className="relative z-40 container mx-auto flex min-h-[680px] items-center px-6 py-14 lg:min-h-[720px] lg:px-8 lg:py-16">
        <div className="w-full">
          <div className="max-w-[52rem]">
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
              <div className="inline-flex items-center gap-2 border border-[#657089]/70 bg-[#080a11]/58 px-3 py-2 backdrop-blur-md">
                <span
                  className="h-2 w-2 bg-[#00d1ff] shadow-[0_0_14px_#00d1ff]"
                  aria-hidden="true"
                />
                <span className="font-pixel text-[8px] text-[#dce4f5]">
                  LIVE COMMUNITY ARCADE
                </span>
              </div>
              <span className="font-pixel text-[7px] text-[#aeb7ca]">
                YESTERDAY&apos;S TOP 10 / ROTATING NOW
              </span>
            </div>

            <p className="mt-8 flex items-center gap-3 font-pixel text-[9px] text-[#00d1ff]">
              <span
                className="h-px w-8 bg-[#00d1ff]/75"
                aria-hidden="true"
              />
              THE COMMUNITY FOR AI GAMES
            </p>

            <h1 className="mt-5">
              <span
                className="block whitespace-nowrap text-[clamp(3.35rem,5.2vw,5.25rem)] font-bold leading-[0.96] tracking-[0.01em] text-white drop-shadow-[0_5px_24px_rgba(0,0,0,0.85)]"
                style={{ fontFamily: "var(--font-pixel), monospace" }}
              >
                PLAY. BUILD.
              </span>
              <span
                className="mt-3 block text-[clamp(3.35rem,5.2vw,5.25rem)] font-bold leading-[0.96] tracking-[0.01em] text-[#facc15] drop-shadow-[5px_5px_0_#f43f5e]"
                style={{ fontFamily: "var(--font-pixel), monospace" }}
              >
                INSPIRE.
              </span>
            </h1>

            <p className="mt-7 max-w-[42rem] font-arcade text-lg leading-relaxed text-[#d4d9e5] drop-shadow-[0_2px_12px_rgba(0,0,0,0.9)] lg:text-xl">
              Discover games made with AI, see what other creators are trying,
              and turn your own spark into something people can play.
            </p>

            <div className="mt-8 flex max-w-xl flex-col gap-3 sm:flex-row">
              <Link
                href="/games"
                prefetch={false}
                className="block sm:inline-block"
              >
                <Button
                  variant="arcade"
                  size="xl"
                  className="w-full gap-3 sm:min-w-48"
                >
                  <Gamepad2 className="h-5 w-5" />
                  PLAY GAMES
                </Button>
              </Link>
              <Link
                href="/upload"
                prefetch={false}
                className="block sm:inline-block"
              >
                <Button
                  variant="outline"
                  size="xl"
                  className="w-full gap-3 border-[#69738a] bg-[#080a11]/65 backdrop-blur-md sm:min-w-48"
                >
                  BUILD A GAME
                  <ArrowUpRight className="h-5 w-5" />
                </Button>
              </Link>
            </div>

            <p className="mt-5 font-arcade text-sm text-[#9fa8bb]">
              No installs. Just ideas becoming playable.
            </p>

            <div
              className="mt-9 grid max-w-[42rem] grid-cols-3 border-l border-t border-[#596176]/70 bg-[#080a11]/52 backdrop-blur-md"
              aria-label="VibeGames community totals"
            >
              {communityMetrics.map((metric) => {
                const Icon = metric.icon

                return (
                  <div
                    key={metric.key}
                    className="relative min-h-24 border-b border-r border-[#596176]/70 px-4 py-4 xl:px-5"
                  >
                    <span
                      className="absolute inset-x-0 top-0 h-0.5"
                      style={{ backgroundColor: metric.color }}
                      aria-hidden="true"
                    />
                    <div className="flex items-center gap-2">
                      <Icon
                        className="h-4 w-4"
                        style={{ color: metric.color }}
                        aria-hidden="true"
                      />
                      <span
                        className="font-pixel text-[7px]"
                        style={{ color: metric.color }}
                      >
                        {metric.label}
                      </span>
                    </div>
                    <p className="mt-3 font-pixel text-[clamp(1rem,1.8vw,1.45rem)] leading-none text-white">
                      {stats[metric.key].toLocaleString("en-US")}
                    </p>
                    <p className="mt-2 font-pixel text-[6px] text-[#8f99ad]">
                      {metric.detail}
                    </p>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
