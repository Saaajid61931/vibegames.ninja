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
      color: "#facc15",
    },
    {
      label: "CREATORS",
      value: stats.creators,
      icon: UsersRound,
      color: "#00d1ff",
    },
    {
      label: "PLAYS",
      value: stats.plays,
      icon: Play,
      color: "#f43f5e",
    },
  ] as const

  return (
    <section
      data-index="-1"
      data-slide
      aria-labelledby="mobile-home-intro-title"
      className="relative isolate h-full w-full shrink-0 snap-start snap-always overflow-hidden bg-[#090b12] text-white"
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
        className="pointer-events-none absolute inset-x-0 bottom-0 z-30 mx-auto h-0.5 w-[58%] bg-[#20d8ff] shadow-[0_0_12px_#20d8ff,0_0_34px_#6366f1]"
        aria-hidden="true"
      />

      <header className="absolute inset-x-0 top-0 z-50 flex items-center justify-between gap-3 pb-3 pl-[max(1.5rem,env(safe-area-inset-left))] pr-[max(1.5rem,env(safe-area-inset-right))] pt-[max(1.5rem,env(safe-area-inset-top))] [@media(max-height:650px)]:pt-4">
        <div className="flex min-w-0 items-center gap-2.5">
          <NinjaConsole
            className="h-10 w-10 shrink-0"
            animated
          />
          <div className="min-w-0">
            <p
              className="truncate font-pixel text-white"
              style={{ fontSize: "8px" }}
            >
              <span className="text-[#818cf8]">VIBE</span>GAMES
              <span className="text-[#aab2c4]">.NINJA</span>
            </p>
            <p
              className="mt-0.5 truncate font-pixel text-[#00d1ff]"
              style={{ fontSize: "6px" }}
            >
              COMMUNITY ARCADE
            </p>
          </div>
        </div>

        <Link
          href="/upload"
          prefetch={false}
          className="flex h-9 shrink-0 items-center gap-1 border border-[#596176] bg-[#090b12] px-2.5 font-pixel text-white transition-colors hover:border-[#facc15] hover:text-[#facc15]"
          style={{ fontSize: "7px" }}
        >
          BUILD <span className="hidden min-[330px]:inline">A GAME</span>
          <ArrowUpRight className="h-3 w-3" aria-hidden="true" />
        </Link>
      </header>

      <main className="absolute inset-x-0 top-[clamp(15.5rem,39dvh,20.5rem)] z-40 px-[max(1.5rem,env(safe-area-inset-left))]">
        <div className="mx-auto w-full max-w-sm text-center">
          <div className="inline-flex items-center gap-2">
            <span className="h-px w-5 bg-[#00d1ff]/75" aria-hidden="true" />
            <p
              className="font-pixel text-[#00d1ff]"
              style={{ fontSize: "7px" }}
            >
              THE COMMUNITY FOR AI GAMES
            </p>
            <span className="h-px w-5 bg-[#00d1ff]/75" aria-hidden="true" />
          </div>

          <h1
            id="mobile-home-intro-title"
            className="mt-2.5 font-pixel leading-none tracking-[0.02em] text-white"
            style={{ fontSize: "clamp(1.55rem, min(8.6vw, 4.9vh), 2.5rem)" }}
          >
            <span className="block">PLAY</span>
            <span className="mt-1 block">BUILD</span>
            <span className="mt-1 block text-[#facc15] drop-shadow-[3px_3px_0_#f43f5e]">
              INSPIRE
            </span>
          </h1>

          <p className="mx-auto mt-2.5 max-w-xs text-[10px] leading-[1.45] text-[#e0e4ee] min-[360px]:text-[11px] [@media(max-height:650px)]:hidden">
            Play games made with AI, discover what others are building, and
            share something that inspires what comes next.
          </p>

          <div
            className="mx-auto mt-3.5 grid max-w-[21rem] grid-cols-3 border-l border-t border-[#596176]/75 bg-[#080a11] [@media(max-height:650px)]:mt-2"
            aria-label="VibeGames community totals"
          >
            {communityMetrics.map((metric) => {
              const Icon = metric.icon
              return (
                <div
                  key={metric.label}
                  className="relative flex min-h-[3.4rem] items-center justify-center gap-2 border-b border-r border-[#596176]/75 px-2 py-1 [@media(max-height:650px)]:min-h-[3rem]"
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
                    <span
                      className="block font-pixel leading-none text-white"
                      style={{ fontSize: "10px" }}
                    >
                      {metricFormatter.format(metric.value)}
                    </span>
                    <span
                      className="mt-1 block font-pixel leading-none text-[#aeb7ca]"
                      style={{ fontSize: "5.5px" }}
                    >
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
        className="group absolute bottom-[max(1rem,env(safe-area-inset-bottom))] left-1/2 z-50 flex -translate-x-1/2 flex-col items-center gap-2 text-center [@media(max-height:650px)]:bottom-2 [@media(max-height:650px)]:gap-1"
        aria-label="Scroll to the first game"
      >
        <span
          className="font-pixel text-[#c8cedd] transition-colors group-hover:text-white"
          style={{ fontSize: "7px" }}
        >
          SCROLL TO PLAY
        </span>
        <span className="relative flex h-11 w-11 items-center justify-center rounded-full border-2 border-white bg-[#6366f1] text-white shadow-[0_4px_0_#f43f5e] transition-transform group-hover:translate-y-1 group-active:translate-y-2">
          <ArrowDown
            className="h-5 w-5 animate-bounce motion-reduce:animate-none"
            aria-hidden="true"
          />
        </span>
      </button>
    </section>
  )
}
