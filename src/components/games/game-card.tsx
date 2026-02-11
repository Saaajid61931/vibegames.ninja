import Link from "next/link"
import { Play, Heart, User, Smartphone } from "lucide-react"
import { formatNumber, timeAgo, CATEGORIES } from "@/lib/utils"

interface GameCardProps {
  game: {
    id: string
    slug: string
    title: string
    thumbnail?: string | null
    category: string
    plays: number
    likes: number
    aiModel?: string | null
    supportsMobile?: boolean
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
      className="group block card-arcade"
    >
      {/* Thumbnail */}
      <div className="relative aspect-video overflow-hidden bg-[var(--color-base)]">
        {game.thumbnail ? (
          <img
            src={game.thumbnail}
            alt={game.title}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <Play className="h-10 w-10 text-[var(--color-text-tertiary)] group-hover:text-[var(--color-primary)] transition-colors" />
          </div>
        )}
        
        {/* Play overlay on hover */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-center justify-center">
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
          {game.supportsMobile && (
            <span className="inline-flex items-center gap-1 rounded border border-[var(--color-success)] px-1.5 py-0.5 text-[10px] text-[var(--color-success)]">
              <Smartphone className="h-2.5 w-2.5" />
              Mobile
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
          <span className="truncate">
            {game.studioProfile?.displayName || game.creator.username || game.creator.name || "Anonymous"}
          </span>
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
