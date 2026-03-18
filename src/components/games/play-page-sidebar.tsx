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
        <div className="border-b-2 border-[#4a4a6a] bg-[#1a1a2e] px-4 py-2">
          <span className="font-arcade text-xs text-[#8b93a6]">PUBLISHED_BY</span>
        </div>
        <div className="bg-[#0d0d15] p-4">
          <div className="flex items-center gap-3">
            <Avatar className="h-12 w-12 border-2 border-[#4a4a6a]">
              <AvatarImage src={game.studioProfile?.image || game.creator.image || undefined} />
              <AvatarFallback className="bg-[#1a1a2e] text-[#8b93a6]">
                {getInitials(
                  game.studioProfile?.displayName || game.creator.name || game.creator.username || "U"
                )}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1">
              <h4 className="font-arcade font-bold text-white">
                {game.studioProfile?.displayName || game.creator.name || game.creator.username}
              </h4>
              {game.studioProfile ? (
                <p className="font-arcade text-sm text-[#ffff00]">@{game.studioProfile.handle}</p>
              ) : game.creator.username ? (
                <p className="font-arcade text-sm text-[#ffff00]">@{game.creator.username}</p>
              ) : null}
            </div>
          </div>

          {!game.studioProfile && game.creator.bio ? (
            <p className="mt-3 font-arcade text-sm text-[#a5aec4]">{game.creator.bio}</p>
          ) : null}

          <div className="mt-3 flex flex-wrap gap-3 font-arcade text-xs text-[#8b93a6]">
            {!game.studioProfile ? (
              <span className="inline-flex items-center gap-1">
                <Users className="h-3 w-3" />
                {formatNumber(followersCount)} FOLLOWERS
              </span>
            ) : null}
            <span>{formatNumber(creatorGamesCount)} GAMES</span>
          </div>

          {!game.studioProfile ? (
            <div className="mt-4">
              <FollowButton
                creatorId={game.creator.id}
                creatorUsername={game.creator.username || null}
                initialFollowers={followersCount}
                initialFollowing={initialFollowing}
              />
            </div>
          ) : null}

          <Link href={creatorProfileHref} className="mt-4 block">
            <Button variant="outline" className="w-full gap-2 font-arcade">
              <User className="h-4 w-4" />
              {game.studioProfile ? "[VIEW_STUDIO]" : "[VIEW_PROFILE]"}
            </Button>
          </Link>
        </div>
      </div>

      {relatedGames.length > 0 ? (
        <div className="border-2 border-[#4a4a6a]">
          <div className="flex items-center gap-2 border-b-2 border-[#4a4a6a] bg-[#1a1a2e] px-4 py-2">
            <Gamepad2 className="h-4 w-4 text-[#ffff00]" />
            <span className="font-arcade text-xs text-[#8b93a6]">
              MORE [{category?.label.toUpperCase() || "GAMES"}]
            </span>
          </div>
          <div className="bg-[#0d0d15] p-2">
            <div className="space-y-1">
              {relatedGames.map((related) => (
                <Link
                  key={related.id}
                  href={`/play/${related.slug}`}
                  className="flex items-center gap-3 border border-transparent p-2 transition-colors hover:border-[#4a4a6a] hover:bg-[#1a1a2e]"
                >
                  <div className="relative flex h-8 w-12 items-center justify-center overflow-hidden border border-[#4a4a6a] bg-[#1a1a2e]">
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
                      <Play className="h-3 w-3 text-[#8b93a6]" />
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <h5 className="truncate font-arcade text-sm text-white">{related.title}</h5>
                    <p className="font-arcade text-xs text-[#8b93a6]">{formatNumber(related.plays)} PLAYS</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      ) : null}

      <div className="border-2 border-[#4a4a6a]">
        <div className="flex items-center gap-2 border-b-2 border-[#4a4a6a] bg-[#1a1a2e] px-4 py-2">
          <ExternalLink className="h-4 w-4 text-[#ffff00]" />
          <span className="font-arcade text-xs text-[#8b93a6]">EMBED_CODE</span>
        </div>
        <div className="bg-[#0d0d15] p-4">
          <p className="mb-3 font-arcade text-xs text-[#a5aec4]">
            Add this game to your website or newsletter to drive more plays back to your page:
          </p>
          <code className="block break-all border border-[#4a4a6a] bg-[#1a1a2e] p-3 font-arcade text-[11px] text-[#ffff00] sm:text-xs">
            {`<iframe src="${process.env.NEXT_PUBLIC_APP_URL || "https://vibegames.ninja"}/embed/${game.slug}" width="800" height="600" allow="fullscreen" allowfullscreen></iframe>`}
          </code>
        </div>
      </div>
    </div>
  )
}
