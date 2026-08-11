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
    color: "var(--color-arcade-yellow)",
  },
  {
    key: "creators",
    label: "CREATORS",
    detail: "BUILDING IN PUBLIC",
    icon: UsersRound,
    color: "var(--color-arcade-cyan)",
  },
  {
    key: "plays",
    label: "PLAYS",
    detail: "AND COUNTING",
    icon: Play,
    color: "var(--color-arcade-red)",
  },
] as const

export function HomeHeroSection({ stats, heroGames }: HomeHeroSectionProps) {
  return (
    <section className="relative isolate min-h-[680px] overflow-hidden border-b-2 border-border-strong bg-canvas sm:border-b-4 lg:min-h-[720px]">
      <HomeGameBackdrop games={heroGames} variant="desktop" />

      <div className="relative z-40 container mx-auto flex min-h-[680px] items-center justify-center px-6 py-14 lg:min-h-[720px] lg:px-8 lg:py-16">
        <div className="w-full max-w-[68rem] text-center">
          <div className="mx-auto">
            <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2">
              <div className="inline-flex items-center gap-2 border border-border-strong bg-canvas px-3 py-2">
                <span
                  className="h-2 w-2 bg-arcade-cyan"
                  aria-hidden="true"
                />
                <span className="text-kicker text-text">
                  LIVE COMMUNITY ARCADE
                </span>
              </div>
              <span className="text-kicker text-text-secondary">
                YESTERDAY&apos;S TOP 10 / ROTATING NOW
              </span>
            </div>

            <p className="text-kicker mt-8 flex items-center justify-center gap-3 text-arcade-cyan">
              <span
                className="h-2 w-2 bg-arcade-cyan"
                aria-hidden="true"
              />
              THE COMMUNITY FOR AI GAMES
            </p>

            <h1 className="mt-5">
              <span
                className="block whitespace-nowrap text-[clamp(3.35rem,5.2vw,5.25rem)] font-bold leading-[0.96] tracking-[0.01em] text-white"
                style={{ fontFamily: "var(--font-pixel), monospace" }}
              >
                PLAY. BUILD.
              </span>
              <span
                className="mt-3 block text-[clamp(3.35rem,5.2vw,5.25rem)] font-bold leading-[0.96] tracking-[0.01em] text-arcade-yellow"
                style={{ fontFamily: "var(--font-pixel), monospace" }}
              >
                INSPIRE.
              </span>
            </h1>

            <p className="mx-auto mt-7 max-w-[42rem] font-arcade text-lg leading-relaxed text-text lg:text-xl">
              Discover games made with AI, see what other creators are trying,
              and turn your own spark into something people can play.
            </p>

            <div className="mx-auto mt-8 flex max-w-xl flex-col justify-center gap-3 sm:flex-row">
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
                  className="w-full gap-3 border-border-strong bg-canvas sm:min-w-48"
                >
                  BUILD A GAME
                  <ArrowUpRight className="h-5 w-5" />
                </Button>
              </Link>
            </div>

            <p className="mt-5 font-arcade text-sm text-text-secondary">
              No installs. Just ideas becoming playable.
            </p>

            <div
              className="mx-auto mt-9 grid max-w-[42rem] grid-cols-3 border-l border-t border-border-strong/70 bg-canvas"
              aria-label="VibeGames community totals"
            >
              {communityMetrics.map((metric) => {
                const Icon = metric.icon

                return (
                  <div
                    key={metric.key}
                    className="relative min-h-24 border-b border-r border-border-strong/70 px-4 py-4 xl:px-5"
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
                        className="text-kicker"
                        style={{ color: metric.color }}
                      >
                        {metric.label}
                      </span>
                    </div>
                    <p className="mt-3 text-[clamp(1rem,1.8vw,1.45rem)] font-bold leading-none tabular-nums text-white">
                      {stats[metric.key].toLocaleString("en-US")}
                    </p>
                    <p className="text-kicker mt-2 text-text-secondary">
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
