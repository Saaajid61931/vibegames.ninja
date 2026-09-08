import Image from "next/image"
import Link from "next/link"
import { ArrowDown, ArrowUpRight, Gamepad2, Play, Plus, Sparkles, Trophy, Zap } from "lucide-react"
import { GameThumbnailPlaceholder } from "@/components/games/game-thumbnail-placeholder"
import { formatNumber } from "@/lib/utils"
import "./inspiration-hero.css"

type ShowcaseGame = {
  id: string
  slug: string
  title: string
  thumbnail: string | null
  creator: { name: string | null; username: string | null }
  monthlyPlays?: number
}
type Props = { rankedGames: ShowcaseGame[]; fallbackGames: ShowcaseGame[]; monthLabel: string; stats: { games: number; creators: number; plays: number } }

function Thumbnail({ game, featured = false }: { game: ShowcaseGame; featured?: boolean }) {
  return game.thumbnail ? (
    <Image
      src={game.thumbnail}
      alt={`${game.title} gameplay`}
      fill
      sizes={
        featured
          ? "(max-width: 767px) 92vw, (max-width: 1023px) 85vw, 620px"
          : "(max-width: 767px) 40vw, 270px"
      }
      priority={featured}
      className="showcase-thumbnail"
    />
  ) : (
    <GameThumbnailPlaceholder title={game.title} compact={!featured} />
  )
}

export function InspirationHero({ rankedGames, fallbackGames, monthLabel, stats }: Props) {
  const monthly = rankedGames.length > 0
  const games = (monthly ? rankedGames : fallbackGames).slice(0, 3)
  const [featured, ...runnersUp] = games
  return (
    <section className="inspiration-hero" aria-labelledby="inspiration-hero-title">
      <div className="hero-grid-floor" aria-hidden="true" />
      <div className="hero-orbit hero-orbit-one" aria-hidden="true" />
      <div className="hero-orbit hero-orbit-two" aria-hidden="true" />
      <span className="hero-pixel hero-pixel-one" aria-hidden="true" />
      <span className="hero-pixel hero-pixel-two" aria-hidden="true" />
      <div className="container relative z-10 mx-auto px-4">
        <div className="inspiration-hero-layout">
          <div className="inspiration-hero-copy">
            <div className="hero-eyebrow">
              <span className="hero-status-light" /> YOUR NEXT FAVORITE IS IN HERE
            </div>
            <h1 id="inspiration-hero-title" className="inspiration-hero-heading">
              <span>PRESS START.</span>
              <span className="hero-word-play">
                PLAY
                <span className="hero-heading-star" aria-hidden="true">
                  <Sparkles className="h-full w-full" strokeWidth={1.5} />
                </span>
              </span>
              <span className="hero-heading-finish">
                SOMETHING
                <br />
                UNEXPECTED.
              </span>
            </h1>
            <p className="hero-description">
              Big ideas. Small games. Zero installs. Step into an arcade built by
              people experimenting with AI — and discover what you could make next.
            </p>
            <div className="hero-actions">
              <Link href="/games" prefetch={false} className="hero-play-button">
                <Play className="h-4 w-4" fill="currentColor" /> FIND YOUR NEXT GAME{" "}
                <ArrowUpRight className="h-4 w-4" />
              </Link>
              <Link href="/upload" prefetch={false} className="hero-share-button">
                <Plus className="h-4 w-4" /> Share a game
              </Link>
            </div>
            <p className="hero-free-note">
              <Gamepad2 className="h-4 w-4" /> Always free to play. No account needed.
            </p>
            <div className="hero-scoreboard" aria-label="Arcade community stats">
              {([{ key: "games", label: "GAMES TO DISCOVER" }, { key: "creators", label: "CREATIVE MINDS" }, { key: "plays", label: "TIMES PLAYED" }] as const).map(({ key, label }) => (
                <div key={key}><strong>{formatNumber(stats[key])}</strong><span>{label}</span></div>
              ))}
            </div>
          </div>

          <div className="hero-showcase">
            <div className="hero-showcase-heading">
              <span>
                <Trophy className="h-4 w-4" />{" "}
                {monthly ? "MOST PLAYED THIS MONTH" : "COMMUNITY SPOTLIGHT"}
              </span>
              <span className="hero-month-label">{monthLabel}</span>
            </div>
            {featured ? (
              <>
                <Link
                  prefetch={false}
                  href={`/play/${featured.slug}`}
                  className="showcase-featured"
                  aria-label={`Play ${featured.title}${monthly ? ", most played this month" : ""}`}
                >
                  <div className="showcase-cabinet-bar" aria-hidden="true"><span><i /><i /><i /></span><span>PLAYER 01 · READY</span><Gamepad2 className="h-4 w-4" /></div>
                  <div className="showcase-featured-screen">
                    <Thumbnail game={featured} featured />
                    <div className="showcase-image-shade" />
                    <span className="showcase-rank">
                      {monthly ? "01" : <Sparkles className="h-6 w-6" />}
                    </span>
                    <span className="showcase-live-tag">
                      {monthly ? "THE COMMUNITY'S TOP PICK" : "YOUR NEXT DISCOVERY"}
                    </span>
                    <span className="showcase-play-icon">
                      <Play fill="currentColor" className="h-6 w-6" />
                    </span>
                    <div className="showcase-featured-caption">
                      <span className="showcase-creator">
                        BY{" "}
                        {featured.creator.name ||
                          featured.creator.username ||
                          "A COMMUNITY CREATOR"}
                      </span>
                      <h2>{featured.title}</h2>
                    </div>
                  </div>
                  <div className="showcase-featured-footer">
                    <span>
                      {monthly ? (
                        <>
                          <span className="showcase-play-count">
                            {formatNumber(featured.monthlyPlays ?? 0)}
                          </span>{" "}
                          plays this month
                        </>
                      ) : (
                        "A small game. A fresh perspective."
                      )}
                    </span>
                    <span>
                      JUMP IN <ArrowUpRight className="h-4 w-4" />
                    </span>
                  </div>
                </Link>
                {runnersUp.length > 0 && (
                  <div className="showcase-runners-up">
                    {runnersUp.map((game, index) => (
                      <Link
                        key={game.id}
                        prefetch={false}
                        href={`/play/${game.slug}`}
                        className="showcase-mini"
                        aria-label={`Play ${game.title}`}
                      >
                        <div className="showcase-mini-image" style={{ position: "relative", overflow: "hidden" }}>
                          <Thumbnail game={game} />
                          <span className="showcase-mini-rank">
                            {monthly ? `0${index + 2}` : <Sparkles className="h-3 w-3" />}
                          </span>
                          <span className="showcase-mini-play">
                            <Play className="h-4 w-4" fill="currentColor" />
                          </span>
                        </div>
                        <div className="showcase-mini-caption">
                          <h3>{game.title}</h3>
                          <span>
                            {monthly
                              ? `${formatNumber(game.monthlyPlays ?? 0)} plays this month`
                              : `by ${game.creator.name || game.creator.username || "the community"}`}
                          </span>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
                <p className="hero-ranking-note">
                  {monthly
                    ? "The games you keep coming back to. Monthly plays · UTC."
                    : "Explore these community picks while this month's chart takes shape."}
                </p>
              </>
            ) : (
              <div className="showcase-empty">
                <Gamepad2 className="h-16 w-16" />
                <h2>
                  The next great idea
                  <br />
                  could be yours.
                </h2>
                <Link href="/upload" prefetch={false} className="hero-share-button">
                  Share the first spark <ArrowUpRight className="h-4 w-4" />
                </Link>
              </div>
            )}
          </div>
        </div>
        <div className="hero-bottom-strip">
          <span>
            <Zap className="h-4 w-4" /> NO DOWNLOADS. NO WAITING. JUST ONE MORE GO.
          </span>
          <Link href="#discover-games">
            EXPLORE THE ARCADE <ArrowDown className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </section>
  )
}
