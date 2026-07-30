import Link from "next/link"
import { Gamepad2, Play, User, Users } from "lucide-react"
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
  const creatorName =
    game.studioProfile?.displayName ||
    game.creator.name ||
    game.creator.username ||
    "Anonymous creator"

  return (
    <div className="space-y-4">
      <section className="vg-panel p-5" aria-labelledby="game-creator">
        <span className="vg-kicker">Created by</span>
        <div className="mt-4 flex items-center gap-3">
          <Avatar className="h-12 w-12 border border-[var(--color-border-strong)]">
            <AvatarImage
              src={
                game.studioProfile?.image ||
                game.creator.image ||
                undefined
              }
            />
            <AvatarFallback className="bg-[var(--color-surface-2)] text-[var(--color-text-secondary)]">
              {getInitials(creatorName)}
            </AvatarFallback>
          </Avatar>

          <div className="min-w-0 flex-1">
            <h2 id="game-creator" className="truncate font-semibold text-white">
              {creatorName}
            </h2>
            {game.studioProfile ? (
              <p className="truncate text-sm text-[#facc15]">
                @{game.studioProfile.handle}
              </p>
            ) : game.creator.username ? (
              <p className="truncate text-sm text-[#facc15]">
                @{game.creator.username}
              </p>
            ) : null}
          </div>
        </div>

        {!game.studioProfile && game.creator.bio ? (
          <p className="mt-4 text-sm leading-6 text-[var(--color-text-secondary)]">
            {game.creator.bio}
          </p>
        ) : null}

        <div className="mt-4 flex flex-wrap gap-3 text-xs text-[var(--color-text-tertiary)]">
          {!game.studioProfile ? (
            <span className="inline-flex items-center gap-1.5">
              <Users className="h-3.5 w-3.5" />
              {formatNumber(followersCount)} followers
            </span>
          ) : null}
          <span className="inline-flex items-center gap-1.5">
            <Gamepad2 className="h-3.5 w-3.5" />
            {formatNumber(creatorGamesCount)} games
          </span>
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

        <Button asChild variant="outline" className="mt-3 w-full gap-2">
          <Link href={creatorProfileHref}>
            <User className="h-4 w-4" />
            View creator profile
          </Link>
        </Button>
      </section>

      {relatedGames.length > 0 ? (
        <section className="vg-panel p-4" aria-labelledby="related-games">
          <div className="flex items-center justify-between gap-3 px-1">
            <div>
              <span className="vg-kicker text-[#facc15]">Keep playing</span>
              <h2 id="related-games" className="mt-2 font-semibold text-white">
                More {category?.label.toLowerCase() || "games"}
              </h2>
            </div>
          </div>

          <div className="mt-3 space-y-1">
            {relatedGames.map((related) => (
              <Link
                key={related.id}
                href={`/play/${related.slug}`}
                className="group flex items-center gap-3 rounded-xl p-2 transition-colors hover:bg-white/[0.04]"
              >
                <div className="relative flex h-12 w-20 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-2)]">
                  {related.thumbnail ? (
                    <GameThumbnailSlideshow
                      title={related.title}
                      thumbnail={related.thumbnail}
                      thumbnailSlides={related.thumbnailSlides}
                      sizes="80px"
                      imageClassName="object-cover transition-transform group-hover:scale-105"
                      showIndicators={false}
                    />
                  ) : (
                    <Play className="h-4 w-4 text-[var(--color-text-tertiary)]" />
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <h3 className="truncate text-sm font-medium text-white group-hover:text-[var(--color-arcade-cyan)]">
                    {related.title}
                  </h3>
                  <p className="mt-1 text-xs text-[var(--color-text-tertiary)]">
                    {formatNumber(related.plays)} plays
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  )
}
