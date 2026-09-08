import Link from "next/link"
import { ChevronRight, Gamepad2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { GameCard } from "@/components/games/game-card"
import type { HomePageData } from "@/lib/home-page-data"

type HomeGameLaneProps = {
  eyebrow: string
  title: string
  description?: string
  actionHref: string
  actionLabel: string
  games: HomePageData["games"]
  sectionClassName?: string
  emptyTitle?: string
  emptyDescription?: string
  animateThumbnailSlides?: boolean
}

export function HomeGameLane({
  eyebrow,
  title,
  description,
  actionHref,
  actionLabel,
  games,
  sectionClassName = "",
  emptyTitle = "NO GAMES FOUND",
  emptyDescription = "Be the first to deploy!",
  animateThumbnailSlides = false,
}: HomeGameLaneProps) {
  return (
    <section className={`home-game-lane border-b border-border py-8 sm:py-12 ${sectionClassName}`.trim()}>
      <div className="container mx-auto px-4">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <span className="text-kicker text-arcade-cyan">{eyebrow}</span>
            <h2 className="mt-3 heading-pixel-md text-white">{title}</h2>
            {description ? (
              <p className="mt-3 max-w-2xl text-sm leading-6 text-text-secondary">{description}</p>
            ) : null}
          </div>
          <Button asChild variant="arcade-outline" size="sm" className="shrink-0 gap-2">
            <Link href={actionHref} prefetch={false}>
              {actionLabel}
              <ChevronRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>

        {games.length > 0 ? (
          <div className="responsive-lane">
            {games.map((game) => (
              <GameCard
                key={game.id}
                game={game}
                animateThumbnailSlides={animateThumbnailSlides}
              />
            ))}
          </div>
        ) : (
          <div className="border border-dashed border-border-strong bg-surface px-6 py-12 text-center">
            <Gamepad2 className="h-16 w-16 text-text-secondary mx-auto mb-4" />
            <h3 className="heading-pixel-lg mb-2 font-bold text-text-secondary">{emptyTitle}</h3>
            <p className="text-text-secondary mb-6 font-arcade text-lg">{emptyDescription}</p>
            <Button asChild variant="arcade"><Link href="/upload" prefetch={false}>SHARE A GAME</Link></Button>
          </div>
        )}
      </div>
    </section>
  )
}
