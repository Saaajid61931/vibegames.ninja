"use client"

import Image from "next/image"
import Link from "next/link"
import { ArrowDown, ArrowUpRight, Bookmark, ChevronDown, Gamepad2, Play, Plus, Sparkles } from "lucide-react"
import { NinjaConsole } from "@/components/icons/ninja-console"
import { GameThumbnailPlaceholder } from "@/components/games/game-thumbnail-placeholder"
import type { HomeBackdropGame } from "@/components/home/home-game-backdrop"
import type { HomePageData } from "@/lib/home-page-data"
import "./mobile-home.css"

type Props = {
  backgroundGames: HomeBackdropGame[]
  stats: HomePageData["stats"]
  onStart: () => void
}

export function MobileHomeIntroSlide({ backgroundGames, stats, onStart }: Props) {
  const previews = backgroundGames.filter((game, index, items) => items.findIndex(item => item.id === game.id) === index).slice(0, 3)

  return (
    <section data-index="-1" data-slide aria-labelledby="mobile-home-intro-title" className="portrait-arcade-intro">
      <div className="portrait-intro-grid" aria-hidden="true" />
      <span className="portrait-intro-orbit" aria-hidden="true" />
      <header className="portrait-intro-header">
        <Link href="/games" prefetch={false} className="portrait-intro-brand" aria-label="VibeGames — explore games"><NinjaConsole className="h-8 w-8" /><span>VIBE<span>GAMES</span><small>YOUR POCKET ARCADE</small></span></Link>
        <Link href="/games" prefetch={false} className="portrait-intro-explore">All games <ArrowUpRight className="h-3.5 w-3.5" /></Link>
      </header>

      <div className="portrait-intro-content">
        <div className="portrait-game-art" data-count={previews.length} aria-hidden="true">
          <div className="portrait-art-glow" />
          {previews.map((game, index) => <div key={game.id} className={`portrait-game-photo portrait-game-photo-${index}`}>
            <div className="portrait-photo-screen" style={{ position: "relative", overflow: "hidden", aspectRatio: "1.4" }}>{game.thumbnail ? <Image src={game.thumbnail} alt="" fill sizes="170px" className="object-cover" /> : <GameThumbnailPlaceholder title={game.title} compact />}</div>
            <span>{game.title}</span>
          </div>)}
          {previews.length === 0 && <div className="portrait-empty-art"><NinjaConsole className="h-24 w-24" /></div>}
          <div className="portrait-art-badge"><Gamepad2 className="h-5 w-5" /> PLAYER 01 · READY</div>
          <Sparkles className="portrait-art-spark" strokeWidth={1.5} />
        </div>

        <div className="portrait-intro-message">
          <p className="portrait-intro-eyebrow"><span /> NO DOWNLOADS. JUST PLAY.</p>
          <h1 id="mobile-home-intro-title"><span>PRESS START.</span><strong>FIND YOUR</strong><strong>NEXT FAVORITE.</strong></h1>
          <p className="portrait-intro-description">Small games. Big imagination.<br />An entire arcade, one swipe away.</p>
          {stats.games > 0 && <p className="portrait-intro-count"><span>{new Intl.NumberFormat("en", { notation: "compact" }).format(stats.games)}</span> games. Countless ways to get inspired.</p>}
        </div>
      </div>

      <footer className="portrait-intro-footer">
        <button type="button" onClick={onStart} className="portrait-start-button"><Play className="h-4 w-4" fill="currentColor" /> START PLAYING <ArrowDown className="h-4 w-4" /></button>
        <button type="button" onClick={onStart} className="portrait-swipe-hint"><ChevronDown className="h-4 w-4" /> Or swipe up to discover your first game</button>
        <nav aria-label="Community shortcuts" className="portrait-intro-links">
          <Link href="/collections" prefetch={false}><Bookmark className="h-3.5 w-3.5" /> Collect ideas</Link><span aria-hidden="true" />
          <Link href="/upload" prefetch={false}><Plus className="h-3.5 w-3.5" /> Share a game</Link>
        </nav>
      </footer>
    </section>
  )
}
