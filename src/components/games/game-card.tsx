import Link from "next/link"
import { Play, Heart, User, Smartphone, SquarePen } from "lucide-react"
import { GameThumbnailSlideshow } from "@/components/games/game-thumbnail-slideshow"
import { formatNumber, timeAgo, CATEGORIES } from "@/lib/utils"
import { CreatorLink } from "@/components/games/creator-link"

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
}

export function GameCard({ game }: GameCardProps) {
  const category = CATEGORIES.find(c => c.value === game.category)

  return (
    <Link
      href={`/play/${game.slug}`}
      prefetch={false}
      className="group block card-arcade"
    >
      {/* Thumbnail */}
      <div className="relative aspect-video overflow-hidden bg-[var(--color-base)]">
        {game.thumbnail ? (
          <GameThumbnailSlideshow
            title={game.title}
            thumbnail={game.thumbnail}
            thumbnailSlides={game.thumbnailSlides}
            sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
            imageClassName="object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <Play className="h-10 w-10 text-[var(--color-text-tertiary)] group-hover:text-[var(--color-primary)] transition-colors" />
          </div>
        )}
        
        {/* Play overlay on hover */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-center justify-center z-10">
          <div className="opacity-0 group-hover:opacity-100 transition-opacity">
            <span className="px-4 py-2 bg-[var(--color-arcade-yellow)] text-[var(--color-base)] font-bold font-pixel text-xs rounded">
              PLAY NOW
            </span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-3 sm:p-4">
        {/* Category Tag */}
        <div className="flex items-center gap-2 mb-2">
          <span className="text-[10px] text-[var(--color-primary)] font-pixel uppercase">
            {category?.label || "Game"}
          </span>
          {game.seekingFeedback && (
            <span className="inline-flex items-center gap-1 rounded border border-[#ff7a00] px-1.5 py-0.5 text-[10px] text-[#ff7a00]">
              Needs feedback
            </span>
          )}
          {game.supportsMobile && (
            <span className="inline-flex items-center gap-1 rounded border border-[var(--color-success)] px-1.5 py-0.5 text-[10px] text-[var(--color-success)]">
              <Smartphone className="h-2.5 w-2.5" />
              Mobile
            </span>
          )}
          {game.hasLevelEditor && (
            <span className="inline-flex items-center gap-1 rounded border border-[var(--color-primary)] px-1.5 py-0.5 text-[10px] text-[var(--color-primary)]">
              <SquarePen className="h-2.5 w-2.5" />
              Editor
            </span>
          )}
        </div>

        {/* Title */}
        <h3 className="font-semibold text-[var(--color-text)] group-hover:text-[var(--color-primary)] transition-colors mb-2 line-clamp-1">
          {game.title}
        </h3>

        {game.aiModel && (
          <p className="mb-2 line-clamp-1 text-xs text-[var(--color-text-tertiary)]">
            Model: {game.aiModel}
          </p>
        )}
        
        {/* Creator */}
        <div className="flex items-center gap-2 mb-3 text-sm text-[var(--color-text-secondary)]">
          <User className="h-3 w-3" />
          {game.studioProfile ? (
            <CreatorLink
              href={`/studio/${game.studioProfile.handle}`}
              className="truncate hover:text-[var(--color-primary)] cursor-pointer"
            >
              {game.studioProfile.displayName}
            </CreatorLink>
          ) : game.creator.username ? (
            <CreatorLink
              href={`/creator/${game.creator.username}`}
              className="truncate hover:text-[var(--color-primary)] cursor-pointer"
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
        <div className="space-y-3 pt-3 border-t border-[var(--color-border)]">
          <div className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-1 text-[var(--color-text-secondary)]">
              <Play className="h-3 w-3" />
              {formatNumber(game.plays)}
            </span>
            <span className={`flex items-center gap-1 ${
              game.likes > 0 ? "text-[var(--color-arcade-red)]" : "text-[var(--color-text-secondary)]"
            }`}>
              <Heart className="h-3 w-3" />
              {formatNumber(game.likes)}
            </span>
          </div>
        </div>
      </div>
      
      {/* Footer */}
      <div className="px-4 py-2 bg-[var(--color-surface-2)] border-t border-[var(--color-border)] text-xs text-[var(--color-text-tertiary)]">
        {timeAgo(new Date(game.createdAt))}
      </div>
    </Link>
  )
}
