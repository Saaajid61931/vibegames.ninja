"use client"

import Link from "next/link"
import {
  ArrowDown,
  ArrowUpRight,
  Gamepad2,
  Play,
  UsersRound,
} from "lucide-react"
import {
  HomeGameBackdrop,
  type HomeBackdropGame,
} from "@/components/home/home-game-backdrop"
import { NinjaConsole } from "@/components/icons/ninja-console"
import type { HomePageData } from "@/lib/home-page-data"

type MobileHomeIntroSlideProps = {
  backgroundGames: HomeBackdropGame[]
  stats: HomePageData["stats"]
  onStart: () => void
}

const metricFormatter = new Intl.NumberFormat("en-US", {
  notation: "compact",
  maximumFractionDigits: 1,
})

export function MobileHomeIntroSlide({
  backgroundGames,
  stats,
  onStart,
}: MobileHomeIntroSlideProps) {
  const communityMetrics = [
    {
      label: "GAMES",
      value: stats.games,
      icon: Gamepad2,
      color: "var(--color-arcade-yellow)",
    },
    {
      label: "CREATORS",
      value: stats.creators,
      icon: UsersRound,
      color: "var(--color-arcade-cyan)",
    },
    {
      label: "PLAYS",
      value: stats.plays,
      icon: Play,
      color: "var(--color-arcade-red)",
    },
  ] as const

  return (
    <section
      data-index="-1"
      data-slide
      aria-labelledby="mobile-home-intro-title"
      className="relative isolate h-full w-full shrink-0 snap-start snap-always overflow-hidden bg-canvas text-white"
      style={{ height: "100%" }}
    >
      <HomeGameBackdrop
        games={backgroundGames}
        variant="mobile"
      />

      <div
        className="pointer-events-none absolute bottom-[-6rem] left-1/2 z-30 h-48 w-[120%] -translate-x-1/2 rounded-[50%] bg-[radial-gradient(ellipse_at_center,_rgba(32,216,255,0.58)_0%,_rgba(99,102,241,0.42)_38%,_rgba(99,102,241,0)_75%)] blur-3xl"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 z-30 mx-auto h-0.5 w-[58%] bg-arcade-cyan shadow-[0_0_12px_var(--color-arcade-cyan),0_0_34px_var(--color-primary)]"
        aria-hidden="true"
      />

      <header className="absolute inset-x-0 top-0 z-50 flex items-center justify-between gap-3 pb-3 pl-[max(1.5rem,env(safe-area-inset-left))] pr-[max(1.5rem,env(safe-area-inset-right))] pt-[max(1.5rem,env(safe-area-inset-top))] [@media(max-height:650px)]:pt-4">
        <div className="flex min-w-0 items-center gap-2.5">
          <NinjaConsole
            className="h-10 w-10 shrink-0"
            animated
          />
          <div className="min-w-0">
            <p className="text-kicker truncate text-white">
              <span className="text-primary-hover-text">VIBE</span>GAMES
              <span className="text-text-secondary">.NINJA</span>
            </p>
            <p className="text-kicker mt-0.5 truncate text-arcade-cyan">
              COMMUNITY ARCADE
            </p>
          </div>
        </div>

        <Link
          href="/upload"
          prefetch={false}
          className="text-kicker flex h-9 shrink-0 items-center gap-1 border border-border-strong bg-canvas px-2.5 text-white transition-colors hover:border-arcade-yellow hover:text-arcade-yellow"
        >
          BUILD <span className="hidden min-[330px]:inline">A GAME</span>
          <ArrowUpRight className="h-3 w-3" aria-hidden="true" />
        </Link>
      </header>

      <main className="absolute inset-x-0 top-[clamp(13.5rem,34dvh,18rem)] z-40 px-[max(1.5rem,env(safe-area-inset-left))]">
        <div className="mx-auto w-full max-w-sm text-center">
          <div className="inline-flex items-center gap-2">
            <span className="h-px w-5 bg-arcade-cyan/75" aria-hidden="true" />
            <p className="text-kicker text-arcade-cyan">
              THE COMMUNITY FOR AI GAMES
            </p>
            <span className="h-px w-5 bg-arcade-cyan/75" aria-hidden="true" />
          </div>

          <h1
            id="mobile-home-intro-title"
            className="heading-pixel-xl mt-2.5 leading-none tracking-[0.02em] text-white"
          >
            <span className="block">PLAY</span>
            <span className="mt-1 block">BUILD</span>
            <span className="mt-1 block text-arcade-yellow drop-shadow-[4px_4px_0_var(--color-arcade-red)]">
              INSPIRE
            </span>
          </h1>

          <p className="mx-auto mt-2.5 max-w-xs text-xs leading-[1.45] text-text min-[360px]:text-xs [@media(max-height:650px)]:hidden">
            Play games made with AI, discover what others are building, and
            share something that inspires what comes next.
          </p>

          <div
            className="mx-auto mt-3.5 grid max-w-[21rem] grid-cols-3 border-l border-t border-border-strong/75 bg-canvas [@media(max-height:650px)]:mt-2"
            aria-label="VibeGames community totals"
          >
            {communityMetrics.map((metric) => {
              const Icon = metric.icon
              return (
                <div
                  key={metric.label}
                  className="relative flex min-h-[3.4rem] items-center justify-center gap-2 border-b border-r border-border-strong/75 px-2 py-1 [@media(max-height:650px)]:min-h-[3rem]"
                >
                  <span
                    className="absolute inset-x-0 top-0 h-0.5"
                    style={{ backgroundColor: metric.color }}
                    aria-hidden="true"
                  />
                  <Icon
                    className="h-3.5 w-3.5"
                    style={{ color: metric.color }}
                    aria-hidden="true"
                  />
                  <span className="text-left">
                    <span className="heading-pixel-sm block leading-none text-white">
                      {metricFormatter.format(metric.value)}
                    </span>
                    <span className="text-kicker mt-1 block leading-none text-text-secondary">
                      {metric.label}
                    </span>
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      </main>

      <button
        type="button"
        onClick={onStart}
        className="group absolute bottom-[max(1rem,env(safe-area-inset-bottom))] left-1/2 z-50 flex -translate-x-1/2 flex-col items-center gap-1.5 text-center [@media(max-height:650px)]:bottom-2 [@media(max-height:650px)]:gap-1"
      >
        <span className="text-kicker flex items-center gap-2 whitespace-nowrap text-arcade-yellow">
          <span className="h-px w-5 bg-arcade-cyan/75" aria-hidden="true" />
          ARCADE REELS
          <span className="h-px w-5 bg-arcade-cyan/75" aria-hidden="true" />
        </span>
        <span className="text-kicker text-text-secondary transition-colors group-hover:text-white">
          SCROLL TO PLAY
        </span>
        <span className="relative flex h-11 w-11 items-center justify-center rounded-full border-2 border-white bg-primary text-white [--shadow-color:var(--color-arcade-red)] shadow-hard-4 transition-transform group-hover:translate-y-1 group-active:translate-y-2">
          <ArrowDown
            className="h-5 w-5 animate-bounce motion-reduce:animate-none"
            aria-hidden="true"
          />
        </span>
      </button>
    </section>
  )
}
