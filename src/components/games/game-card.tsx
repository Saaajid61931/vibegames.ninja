import Link from "next/link"
import { ArrowUpRight, Play, Heart, User, Smartphone, SquarePen, Trophy } from "lucide-react"
import { GameThumbnailSlideshow } from "@/components/games/game-thumbnail-slideshow"
import { formatNumber, timeAgo, CATEGORIES } from "@/lib/utils"
import { CreatorLink } from "@/components/games/creator-link"
import { SaveGameButton } from "@/components/community/save-game-button"
import { GameThumbnailPlaceholder } from "@/components/games/game-thumbnail-placeholder"

interface GameCardProps {
  game: {
    id: string
    slug: string
    title: string
    description?: string
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
  animateThumbnailSlides = false,
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
    <article className="group flex h-full min-w-0 flex-col border border-border-strong bg-surface shadow-[3px_3px_0_#05070d] transition-[border-color,box-shadow] duration-150 hover:border-arcade-cyan/70 hover:shadow-[4px_4px_0_#12343e] focus-within:border-arcade-cyan">
      {/* Thumbnail */}
      <Link href={`/play/${game.slug}`} prefetch={false} aria-label={`Play ${game.title}`} className="block focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-arcade-cyan">
        <div className="relative aspect-video overflow-hidden border-b border-border-strong bg-canvas">
          {game.thumbnail ? (
            <GameThumbnailSlideshow
              title={game.title}
              thumbnail={game.thumbnail}
              thumbnailSlides={game.thumbnailSlides}
              sizes="(max-width: 639px) calc(100vw - 32px), (max-width: 1023px) 50vw, (max-width: 1279px) 33vw, 25vw"
              imageClassName="object-cover"
              animateSlides={animateThumbnailSlides}
              showIndicators={animateThumbnailSlides}
            />
          ) : (
            <GameThumbnailPlaceholder title={game.title} />
          )}

          <span className="absolute left-3 top-3 z-10 border border-white/20 bg-canvas/95 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-arcade-cyan">
            {game.category === "OTHER" ? "Experiment" : category?.label || "Game"}
          </span>
          <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center bg-black/0 transition-colors group-hover:bg-black/30 group-focus-within:bg-black/30">
            <span className="flex h-12 w-12 items-center justify-center border border-arcade-yellow bg-arcade-yellow text-canvas opacity-0 shadow-[3px_3px_0_#05070d] transition-opacity group-hover:opacity-100 group-focus-within:opacity-100">
              <Play className="h-5 w-5 fill-current" aria-hidden="true" />
            </span>
          </div>
        </div>
      </Link>

      {/* Content */}
      <div className="flex flex-1 flex-col px-4 pb-3 pt-4">
        <h3 className="line-clamp-2 text-base font-bold leading-snug text-text transition-colors group-hover:text-arcade-cyan">
          <Link href={`/play/${game.slug}`} prefetch={false} className="focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-arcade-cyan">
            {game.title}
          </Link>
        </h3>

        {game.description && <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-text-secondary">{game.description}</p>}

        <div className="mt-2 flex min-w-0 items-center gap-1.5 text-xs text-text-secondary">
          <User className="h-3 w-3 shrink-0" aria-hidden="true" />
          {game.studioProfile ? (
            <CreatorLink href={`/studio/${game.studioProfile.handle}`} className="truncate hover:text-arcade-cyan">
              {game.studioProfile.displayName}
            </CreatorLink>
          ) : game.creator.username ? (
            <CreatorLink href={`/creator/${game.creator.username}`} className="truncate hover:text-arcade-cyan">
              {game.creator.username}
            </CreatorLink>
          ) : (
            <span className="flex min-h-11 items-center truncate">{game.creator.name || "Anonymous"}</span>
          )}
        </div>

        {/* Capabilities remain visible on touch devices, without hovering. */}
        {(game.supportsMobile || game.hasLevelEditor || game.seekingFeedback || game.primaryJam) && <div className="mb-3 flex flex-wrap items-center gap-1.5">
          {game.supportsMobile && (
            <span className="inline-flex items-center gap-1 border border-arcade-green/25 bg-arcade-green/5 px-1.5 py-1 text-[10px] text-arcade-green">
              <Smartphone className="h-3 w-3" aria-hidden="true" />
              Mobile
            </span>
          )}
          {game.hasLevelEditor && (
            <span className="inline-flex items-center gap-1 border border-arcade-cyan/25 bg-arcade-cyan/5 px-1.5 py-1 text-[10px] text-arcade-cyan">
              <SquarePen className="h-3 w-3" aria-hidden="true" />
              Editor
            </span>
          )}
          {game.seekingFeedback && (
            <span className="border border-arcade-orange/25 bg-arcade-orange/5 px-1.5 py-1 text-[10px] text-arcade-orange">Feedback welcome</span>
          )}
          {game.primaryJam && (
            <span
              className={`inline-flex max-w-full items-center gap-1 border px-1.5 py-1 text-[10px] ${jamTone}`}
              title={game.primaryJam.title}
            >
              <Trophy className="h-3 w-3 shrink-0" aria-hidden="true" />
              <span className="truncate">{game.primaryJam.title}</span>
            </span>
          )}
        </div>}
        
        {/* Stats */}
        <div className="mt-auto border-t border-border pt-3">
          <div className="flex items-center gap-4 text-xs tabular-nums">
            <span className="flex items-center gap-1.5 text-text-secondary" aria-label={`${game.plays} plays`}>
              <Play className="h-3 w-3" aria-hidden="true" />
              {formatNumber(game.plays)} <span className="text-text-tertiary">plays</span>
            </span>
            <span aria-label={`${game.likes} likes`} className={`flex items-center gap-1.5 ${
              game.likes > 0 ? "text-arcade-red" : "text-text-secondary"
            }`}>
              <Heart className="h-3 w-3" aria-hidden="true" />
              {formatNumber(game.likes)}
            </span>
          </div>
        </div>
      </div>
      
      {/* Footer */}
      <div className="flex items-center justify-between gap-2 border-t border-border bg-canvas/40 px-4 py-1.5 text-xs text-text-secondary">
        <Link href={`/play/${game.slug}`} prefetch={false} className="inline-flex min-h-11 items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-arcade-yellow transition-colors hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-arcade-cyan">Play game <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" /></Link>
        <SaveGameButton gameId={game.id} slug={game.slug} compact />
        <span className="sr-only">{timeAgo(new Date(game.createdAt))}</span>
      </div>
    </article>
  )
}
