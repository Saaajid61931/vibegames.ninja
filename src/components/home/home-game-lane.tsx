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
  animateThumbnailSlides = true,
}: HomeGameLaneProps) {
  return (
    <section className={`py-6 sm:py-9 border-b border-border ${sectionClassName}`.trim()}>
      <div className="container mx-auto px-4">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <span className="text-xs font-medium uppercase tracking-wider text-primary-text">{eyebrow}</span>
            <h2 className="mt-1 text-xl sm:text-2xl font-semibold text-white">{title}</h2>
            {description ? (
              <p className="mt-2 hidden text-sm text-text-secondary sm:block">{description}</p>
            ) : null}
          </div>
          <Link href={actionHref} prefetch={false}>
            <Button variant="secondary" size="sm" className="gap-2">
              {actionLabel}
              <ChevronRight className="h-4 w-4" />
            </Button>
          </Link>
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
          <div className="text-center py-20 border-4 border-dashed border-border-strong">
            <Gamepad2 className="h-16 w-16 text-text-secondary mx-auto mb-4" />
            <h3 className="heading-pixel-lg mb-2 font-bold text-text-secondary">{emptyTitle}</h3>
            <p className="text-text-secondary mb-6 font-arcade text-lg">{emptyDescription}</p>
            <Link href="/upload" prefetch={false}>
              <Button variant="arcade">UPLOAD GAME</Button>
            </Link>
          </div>
        )}
      </div>
    </section>
  )
}
