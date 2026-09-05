"use client"

import type { ReactNode } from "react"
import { useSyncExternalStore } from "react"
import dynamic from "next/dynamic"
import type { HomePageData } from "@/lib/home-page-data"
import "./mobile-home.css"

const MOBILE_HOME_QUERY = "(max-width: 767px), (max-height: 500px) and (orientation: landscape) and (pointer: coarse)"

function subscribeToViewport(onChange: () => void) {
  const query = window.matchMedia(MOBILE_HOME_QUERY)
  query.addEventListener("change", onChange)
  return () => query.removeEventListener("change", onChange)
}

function LoadingArcade() {
  return (
    <div className="mobile-arcade-loading" role="status">
      <span className="text-kicker text-arcade-cyan">VIBEGAMES.NINJA</span>
      <p>Your next game is loading…</p>
    </div>
  )
}

const QuickPlay = dynamic(
  () => import("@/components/home/mobile-reels-feed").then(module => module.MobileReelsFeed),
  { ssr: false, loading: LoadingArcade },
)

export function HomeExperience({ children, games, backgroundGames, stats }: {
  children: ReactNode
  games: HomePageData["allMobileGames"]
  backgroundGames: HomePageData["heroGames"]
  stats: HomePageData["stats"]
}) {
  const mobile = useSyncExternalStore(
    subscribeToViewport,
    () => window.matchMedia(MOBILE_HOME_QUERY).matches,
    () => false,
  )

  return (
    <>
      <div className="home-desktop-experience">{!mobile && children}</div>
      <div className="home-mobile-experience">
        {mobile ? (
          <main id="main-content" className="mobile-home-stage">
            <QuickPlay games={games} backgroundGames={backgroundGames} stats={stats} />
          </main>
        ) : (
          <LoadingArcade />
        )}
      </div>
    </>
  )
}
