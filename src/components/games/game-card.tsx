import Link from "next/link"
import { Play, Heart, User, Smartphone, SquarePen, Trophy } from "lucide-react"
import { GameThumbnailSlideshow } from "@/components/games/game-thumbnail-slideshow"
import { formatNumber, timeAgo, CATEGORIES } from "@/lib/utils"
import { SaveGameButton } from "@/components/community/save-game-button"
import { CreatorLink } from "@/components/games/creator-link"
import { GameThumbnailPlaceholder } from "@/components/games/game-thumbnail-placeholder"

interface GameCardProps {
  game: {
    id: string
    slug: string
    title: string
    thumbnail?: string | null
    thumbnailSlides?: string[]
    category: string
    plays: number
    likes: number
    aiModel?: string | null
    supportsMobile?: boolean
    hasLevelEditor?: boolean
    seekingFeedback?: boolean
    primaryJam?: {
      slug: string
      title: string
      theme?: string | null
      status: string
    } | null
    createdAt: Date
    creator: {
      name?: string | null
      username?: string | null
      image?: string | null
    }

    studioProfile?: {
      handle: string
      displayName: string
      image?: string | null
    } | null
  }
  animateThumbnailSlides?: boolean
}

export function GameCard({
  game,
  animateThumbnailSlides = true,
}: GameCardProps) {
  const category = CATEGORIES.find(c => c.value === game.category)
  const jamTone =
    game.primaryJam?.status === "ACTIVE"
      ? "border-arcade-green text-arcade-green"
      : game.primaryJam?.status === "VOTING"
        ? "border-arcade-yellow text-arcade-yellow"
        : game.primaryJam?.status === "UPCOMING"
          ? "border-arcade-cyan text-arcade-cyan"
          : "border-text-secondary text-text-secondary"

  return (
    <article className="group card-arcade flex h-full flex-col">
      {/* Thumbnail */}
      <Link href={`/play/${game.slug}`} prefetch={false} aria-label={`Play ${game.title}`}>
        <div className="relative aspect-video overflow-hidden bg-canvas">
          {game.thumbnail ? (
            <GameThumbnailSlideshow
              title={game.title}
              thumbnail={game.thumbnail}
              thumbnailSlides={game.thumbnailSlides}
              sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
              imageClassName="object-cover transition-transform duration-300 group-hover:scale-105"
              animateSlides={animateThumbnailSlides}
            />
          ) : (
            <GameThumbnailPlaceholder title={game.title} />
          )}

          <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center bg-black/0 transition-all group-hover:bg-black/40">
            <div className="opacity-0 transition-opacity group-hover:opacity-100">
              <span className="heading-pixel-sm bg-arcade-yellow px-4 py-2 text-canvas">
                Play now
              </span>
            </div>
          </div>
        </div>
      </Link>

      {/* Content */}
      <div className="flex flex-1 flex-col p-3 sm:p-4">
        {/* Category Tag */}
        <div className="mb-2 flex flex-wrap items-center gap-2">
          <span className="text-kicker text-primary-text">
            {category?.label || "Game"}
          </span>
          {game.seekingFeedback && (
            <span className="inline-flex items-center gap-1 rounded border border-arcade-orange px-1.5 py-0.5 text-xs text-arcade-orange">
              Needs feedback
            </span>
          )}
          {game.supportsMobile && (
            <span className="inline-flex items-center gap-1 rounded border border-success px-1.5 py-0.5 text-xs text-success">
              <Smartphone className="h-2.5 w-2.5" />
              Mobile
            </span>
          )}
          {game.hasLevelEditor && (
            <span className="inline-flex items-center gap-1 rounded border border-primary px-1.5 py-0.5 text-xs text-primary-text">
              <SquarePen className="h-2.5 w-2.5" />
              Editor
            </span>
          )}
          {game.primaryJam && (
            <span
              className={`inline-flex max-w-full items-center gap-1 rounded px-1.5 py-0.5 text-xs ${jamTone}`}
              title={game.primaryJam.title}
            >
              <Trophy className="h-2.5 w-2.5 flex-shrink-0" />
              <span className="truncate">{game.primaryJam.title}</span>
            </span>
          )}
        </div>

        {/* Title */}
        <h3 className="mb-2 line-clamp-1 font-semibold text-text transition-colors group-hover:text-primary-text">
          <Link href={`/play/${game.slug}`} prefetch={false}>
            {game.title}
          </Link>
        </h3>

        {game.aiModel && (
          <p className="mb-2 line-clamp-1 text-xs text-text-tertiary">
            Model: {game.aiModel}
          </p>
        )}
        
        {/* Creator */}
        <div className="flex items-center gap-2 mb-3 text-sm text-text-secondary">
          <User className="h-3 w-3" />
          {game.studioProfile ? (
            <CreatorLink
              href={`/studio/${game.studioProfile.handle}`}
              className="truncate hover:text-primary-text cursor-pointer"
            >
              {game.studioProfile.displayName}
            </CreatorLink>
          ) : game.creator.username ? (
            <CreatorLink
              href={`/creator/${game.creator.username}`}
              className="truncate hover:text-primary-text cursor-pointer"
            >
              {game.creator.username}
            </CreatorLink>
          ) : (
            <span className="truncate">
              {game.creator.name || "Anonymous"}
            </span>
          )}
        </div>
        
        {/* Stats */}
        <div className="mt-auto space-y-3 border-t border-border pt-3">
          <div className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-1 text-text-secondary">
              <Play className="h-3 w-3" />
              {formatNumber(game.plays)}
            </span>
            <span className={`flex items-center gap-1 ${
              game.likes > 0 ? "text-arcade-red" : "text-text-secondary"
            }`}>
              <Heart className="h-3 w-3" />
              {formatNumber(game.likes)}
            </span>
          </div>
        </div>
      </div>
      
      {/* Footer */}
      <div className="flex items-center justify-between gap-2 border-t border-border bg-surface-2 px-4 py-2 text-xs text-text-secondary">
        <span>{timeAgo(new Date(game.createdAt))}</span>
        <SaveGameButton gameId={game.id} slug={game.slug} compact />
      </div>
    </article>
  )
}
