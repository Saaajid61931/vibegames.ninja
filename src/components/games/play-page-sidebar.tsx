import Link from "next/link"
import { ExternalLink, Gamepad2, Play, User, Users } from "lucide-react"
import { FollowButton } from "@/components/creator/follow-button"
import { GameThumbnailSlideshow } from "@/components/games/game-thumbnail-slideshow"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import type { PlayPageData } from "@/lib/play-page-data"
import { formatNumber, getInitials } from "@/lib/utils"

interface PlayPageSidebarProps {
  game: PlayPageData["game"]
  category: PlayPageData["category"]
  creatorProfileHref: PlayPageData["creatorProfileHref"]
  creatorGamesCount: PlayPageData["creatorGamesCount"]
  followersCount: PlayPageData["followersCount"]
  initialFollowing: PlayPageData["isFollowing"]
  relatedGames: PlayPageData["relatedGames"]
}

export function PlayPageSidebar({
  game,
  category,
  creatorProfileHref,
  creatorGamesCount,
  followersCount,
  initialFollowing,
  relatedGames,
}: PlayPageSidebarProps) {
  return (
    <div className="space-y-6">
      <div className="border-2 border-[#4a4a6a]">
        <div className="border-b-2 border-[#4a4a6a] px-4 py-2 bg-[#1a1a2e]">
          <span className="font-arcade text-xs text-[#4a4a6a]">PUBLISHED_BY</span>
        </div>
        <div className="p-4 bg-[#0d0d15]">
          <div className="flex items-center gap-3">
            <Avatar className="h-12 w-12 border-2 border-[#4a4a6a]">
              <AvatarImage src={game.studioProfile?.image || game.creator.image || undefined} />
              <AvatarFallback className="bg-[#1a1a2e] text-[#4a4a6a]">
                {getInitials(
                  game.studioProfile?.displayName || game.creator.name || game.creator.username || "U"
                )}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h4 className="font-bold text-white font-arcade">
                {game.studioProfile?.displayName || game.creator.name || game.creator.username}
              </h4>
              {game.studioProfile ? (
                <p className="text-sm text-[#ffff00] font-arcade">@{game.studioProfile.handle}</p>
              ) : game.creator.username ? (
                <p className="text-sm text-[#ffff00] font-arcade">@{game.creator.username}</p>
              ) : null}
            </div>
          </div>
          {!game.studioProfile && game.creator.bio && (
            <p className="text-sm text-[#4a4a6a] mt-3 font-arcade">{game.creator.bio}</p>
          )}
          <div className="mt-3 flex flex-wrap gap-3 text-xs font-arcade text-[#4a4a6a]">
            {!game.studioProfile && (
              <span className="inline-flex items-center gap-1">
                <Users className="h-3 w-3" />
                {formatNumber(followersCount)} FOLLOWERS
              </span>
            )}
            <span>{formatNumber(creatorGamesCount)} GAMES</span>
          </div>
          {!game.studioProfile && (
            <div className="mt-4">
              <FollowButton
                creatorId={game.creator.id}
                creatorUsername={game.creator.username || null}
                initialFollowers={followersCount}
                initialFollowing={initialFollowing}
              />
            </div>
          )}
          <Link href={creatorProfileHref} className="block mt-4">
            <Button variant="outline" className="w-full gap-2 font-arcade">
              <User className="h-4 w-4" />
              {game.studioProfile ? "[VIEW_STUDIO]" : "[VIEW_PROFILE]"}
            </Button>
          </Link>
        </div>
      </div>

      <div className="border-2 border-[#4a4a6a]">
        <div className="border-b-2 border-[#4a4a6a] px-4 py-2 bg-[#1a1a2e] flex items-center gap-2">
          <ExternalLink className="h-4 w-4 text-[#ffff00]" />
          <span className="font-arcade text-xs text-[#4a4a6a]">EMBED_CODE</span>
        </div>
        <div className="p-4 bg-[#0d0d15]">
          <p className="text-xs text-[#4a4a6a] mb-3 font-arcade">
            Add this game to your website or newsletter to drive more plays back to your page:
          </p>
          <code className="block p-3 bg-[#1a1a2e] border border-[#4a4a6a] text-[11px] sm:text-xs text-[#ffff00] font-arcade break-all">
            {`<iframe src="${process.env.NEXT_PUBLIC_APP_URL || "https://vibegames.ninja"}/embed/${game.slug}" width="800" height="600" allow="fullscreen" allowfullscreen></iframe>`}
          </code>
        </div>
      </div>

      {relatedGames.length > 0 && (
        <div className="border-2 border-[#4a4a6a]">
          <div className="border-b-2 border-[#4a4a6a] px-4 py-2 bg-[#1a1a2e] flex items-center gap-2">
            <Gamepad2 className="h-4 w-4 text-[#ffff00]" />
            <span className="font-arcade text-xs text-[#4a4a6a]">
              MORE [{category?.label.toUpperCase() || "GAMES"}]
            </span>
          </div>
          <div className="p-2 bg-[#0d0d15]">
            <div className="space-y-1">
              {relatedGames.map((related) => (
                <Link
                  key={related.id}
                  href={`/play/${related.slug}`}
                  className="flex items-center gap-3 p-2 hover:bg-[#1a1a2e] transition-colors border border-transparent hover:border-[#4a4a6a]"
                >
                  <div className="relative w-12 h-8 bg-[#1a1a2e] border border-[#4a4a6a] flex items-center justify-center overflow-hidden">
                    {related.thumbnail ? (
                      <GameThumbnailSlideshow
                        title={related.title}
                        thumbnail={related.thumbnail}
                        thumbnailSlides={related.thumbnailSlides}
                        sizes="48px"
                        imageClassName="object-cover grayscale hover:grayscale-0"
                        showIndicators={false}
                      />
                    ) : (
                      <Play className="h-3 w-3 text-[#4a4a6a]" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h5 className="font-arcade text-sm text-white truncate">{related.title}</h5>
                    <p className="text-xs text-[#4a4a6a] font-arcade">{formatNumber(related.plays)} PLAYS</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
