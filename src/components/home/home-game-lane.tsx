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
    <section className={`py-14 sm:py-20 border-b-2 sm:border-b-4 border-[#4a4a6a] ${sectionClassName}`.trim()}>
      <div className="container mx-auto px-4">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <span className="font-pixel text-[10px] text-[#ffff00]">{eyebrow}</span>
            <h2 className="mt-2 font-pixel text-xl text-white sm:text-2xl md:text-3xl">{title}</h2>
            {description ? (
              <p className="mt-2 font-arcade text-sm text-[#8b93a6]">{description}</p>
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
          <div className="text-center py-20 border-4 border-dashed border-[#4a4a6a]">
            <Gamepad2 className="h-16 w-16 text-[#4a4a6a] mx-auto mb-4" />
            <h3 className="text-xl font-bold text-[#4a4a6a] mb-2 font-pixel">{emptyTitle}</h3>
            <p className="text-[#4a4a6a] mb-6 font-arcade text-lg">{emptyDescription}</p>
            <Link href="/upload" prefetch={false}>
              <Button variant="arcade">UPLOAD GAME</Button>
            </Link>
          </div>
        )}
      </div>
    </section>
  )
}
