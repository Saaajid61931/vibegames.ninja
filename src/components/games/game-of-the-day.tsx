import Link from "next/link"
import { Gamepad2, Play, Star, Eye, Crown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { CreatorLink } from "@/components/games/creator-link"
import { GameThumbnailSlideshow } from "@/components/games/game-thumbnail-slideshow"

interface GameOfTheDayProps {
  game: {
    id: string
    slug: string
    title: string
    description: string
    thumbnail?: string | null
    thumbnailSlides?: string[]
    category: string
    plays: number
    likes: number
    avgRating: number
    ratingCount: number
    aiModel?: string | null
    supportsMobile?: boolean
    hasLevelEditor?: boolean
    createdAt: string | Date
    creator: {
      id: string
      name?: string | null
      username?: string | null
      image?: string | null
    }
    studioProfile?: {
      id: string
      handle: string
      displayName: string
      image?: string | null
    } | null
  }
  monthlyStars: number
  monthlyRatings: number
}

const MONTH_NAMES = [
  "JANUARY", "FEBRUARY", "MARCH", "APRIL", "MAY", "JUNE",
  "JULY", "AUGUST", "SEPTEMBER", "OCTOBER", "NOVEMBER", "DECEMBER",
]

export function GameOfTheDay({ game, monthlyStars, monthlyRatings }: GameOfTheDayProps) {
  const creatorName = game.studioProfile?.displayName
    || game.creator.username
    || game.creator.name
    || "Anonymous"

  const creatorHref = game.studioProfile
    ? `/studio/${game.studioProfile.handle}`
    : game.creator.username
      ? `/creator/${game.creator.username}`
      : null

  // Truncate description for display
  const shortDesc = game.description.length > 180
    ? game.description.slice(0, 177) + "..."
    : game.description

  const currentMonth = MONTH_NAMES[new Date().getUTCMonth()]

  return (
    <section className="py-10 sm:py-14 border-b-2 sm:border-b-4 border-[#4a4a6a]">
      <div className="container mx-auto px-4">
        {/* Section header */}
        <div className="flex items-center gap-3 mb-6 sm:mb-8">
          <div className="flex items-center gap-2">
            <Crown className="h-5 w-5 text-[#ffff00]" />
            <span className="text-[10px] text-[#ffff00] font-pixel">
              {currentMonth}
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-white font-pixel">
            GAME OF THE MONTH
          </h2>
        </div>

        {/* Hero card */}
        <div className="bg-[#1a1a2e] border-2 sm:border-4 border-[#ffff00] relative overflow-hidden group hover:shadow-[6px_6px_0_#ffff00] transition-all duration-200">
          {/* Corner decorations */}
          <div className="absolute top-0 left-0 w-4 h-4 bg-[#ffff00] z-10" />
          <div className="absolute top-0 right-0 w-4 h-4 bg-[#ffff00] z-10" />
          <div className="absolute bottom-0 left-0 w-4 h-4 bg-[#ffff00] z-10" />
          <div className="absolute bottom-0 right-0 w-4 h-4 bg-[#ffff00] z-10" />

          <div className="flex flex-col lg:flex-row">
            {/* Thumbnail */}
            <Link
              href={`/play/${game.slug}`}
              prefetch={false}
              className="relative w-full lg:w-[55%] aspect-video lg:aspect-auto lg:min-h-[320px] overflow-hidden bg-[#0d0d15] flex-shrink-0"
            >
              {game.thumbnail ? (
                <GameThumbnailSlideshow
                  title={game.title}
                  thumbnail={game.thumbnail}
                  thumbnailSlides={game.thumbnailSlides}
                  sizes="(max-width: 1024px) 100vw, 55vw"
                  priority
                  imageClassName="object-cover group-hover:scale-105 transition-transform duration-500"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center min-h-[200px]">
                  <Gamepad2 className="h-20 w-20 text-[#4a4a6a]" />
                </div>
              )}
              {/* Play overlay on hover */}
              <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <div className="w-20 h-20 rounded-full bg-[#ffff00] flex items-center justify-center">
                  <Play className="h-10 w-10 text-[#0d0d15] ml-1" />
                </div>
              </div>
              {/* Category badge */}
              <div className="absolute top-4 left-4 z-10">
                <span className="px-3 py-1 bg-[#0d0d15]/80 border border-[#ffff00] text-[#ffff00] text-[10px] font-pixel backdrop-blur-sm">
                  {game.category}
                </span>
              </div>
            </Link>

            {/* Info panel */}
            <div className="flex-1 p-6 sm:p-8 flex flex-col justify-between">
              <div>
                {/* Title */}
                <Link href={`/play/${game.slug}`} prefetch={false}>
                  <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-white font-pixel mb-3 hover:text-[#ffff00] transition-colors leading-tight">
                    {game.title}
                  </h3>
                </Link>

                {/* Creator */}
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-xs text-[#4a4a6a] font-arcade">by</span>
                  {creatorHref ? (
                    <CreatorLink href={creatorHref} className="text-sm text-[#0080ff] font-arcade hover:underline cursor-pointer">
                      {creatorName}
                    </CreatorLink>
                  ) : (
                    <span className="text-sm text-[#0080ff] font-arcade">{creatorName}</span>
                  )}
                </div>

                {/* Description */}
                <p className="text-sm sm:text-base text-[#8a8aaa] font-arcade mb-6 leading-relaxed">
                  {shortDesc}
                </p>

                {/* Monthly stars note */}
                {monthlyRatings > 0 && (
                  <div className="mb-6 px-3 py-2 bg-[#0d0d15] border border-[#ffff00]/30 text-xs text-[#ffff00]/80 font-arcade flex items-center gap-2">
                    <Star className="h-3.5 w-3.5 text-[#ffff00] fill-[#ffff00]" />
                    {monthlyStars} stars from {monthlyRatings} {monthlyRatings === 1 ? "rating" : "ratings"} this month
                  </div>
                )}

                {/* Stats row */}
                <div className="flex flex-wrap items-center gap-4 sm:gap-6 mb-6">
                  <div className="flex items-center gap-1.5">
                    <Eye className="h-4 w-4 text-[#0080ff]" />
                    <span className="text-sm text-white font-pixel">{game.plays.toLocaleString()}</span>
                    <span className="text-xs text-[#4a4a6a] font-arcade">plays</span>
                  </div>
                  {game.ratingCount > 0 && (
                    <div className="flex items-center gap-1.5">
                      <Star className="h-4 w-4 text-[#ffff00] fill-[#ffff00]" />
                      <span className="text-sm text-white font-pixel">{game.avgRating.toFixed(1)}</span>
                      <span className="text-xs text-[#4a4a6a] font-arcade">({game.ratingCount})</span>
                    </div>
                  )}
                  {game.aiModel && (
                    <span className="text-xs text-[#4a4a6a] font-arcade">
                      Built with {game.aiModel}
                    </span>
                  )}
                </div>
              </div>

              {/* CTA */}
              <div className="flex flex-col sm:flex-row gap-3">
                <Link href={`/play/${game.slug}`} prefetch={false} className="flex-1 sm:flex-none">
                  <Button variant="arcade" size="lg" className="w-full sm:w-auto gap-3">
                    <Play className="h-5 w-5" />
                    PLAY NOW
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
