"use client"

import NextImage from "next/image"
import { useEffect, useMemo, useState } from "react"
import { GameThumbnailPlaceholder } from "@/components/games/game-thumbnail-placeholder"

export type HomeBackdropGame = {
  id: string
  title: string
  thumbnail: string | null
}

type HomeGameBackdropProps = {
  games: HomeBackdropGame[]
  variant: "desktop" | "mobile"
  onActiveThumbnailChange?: (thumbnail: string | null) => void
}

function useDesktopBackdropActive(variant: HomeGameBackdropProps["variant"]) {
  const [active, setActive] = useState(variant === "mobile")

  useEffect(() => {
    if (variant === "mobile") {
      return
    }

    const wideQuery = window.matchMedia("(min-width: 768px)")
    const shortLandscapeQuery = window.matchMedia(
      "(max-height: 500px) and (orientation: landscape)"
    )
    const update = () => {
      setActive(wideQuery.matches && !shortLandscapeQuery.matches)
    }

    update()
    wideQuery.addEventListener("change", update)
    shortLandscapeQuery.addEventListener("change", update)

    return () => {
      wideQuery.removeEventListener("change", update)
      shortLandscapeQuery.removeEventListener("change", update)
    }
  }, [variant])

  return active
}

export function HomeGameBackdrop({
  games,
  variant,
  onActiveThumbnailChange,
}: HomeGameBackdropProps) {
  const backdropGames = useMemo(
    () => games.filter((game): game is HomeBackdropGame & { thumbnail: string } => Boolean(game.thumbnail?.trim())),
    [games]
  )
  const [slide, setSlide] = useState<{ current: number; previous: number | null }>({
    current: 0,
    previous: null,
  })
  const [failedImages, setFailedImages] = useState<Set<string>>(() => new Set())
  const currentIndex =
    backdropGames.length > 0 ? slide.current % backdropGames.length : 0
  const imageSizes =
    variant === "mobile"
      ? "(max-width: 767px) 100vw, 1px"
      : "(max-width: 767px) 1px, 100vw"

  const backdropActive = useDesktopBackdropActive(variant)

  useEffect(() => {
    if (!backdropActive || backdropGames.length <= 1) return

    const nextIndex = (currentIndex + 1) % backdropGames.length
    const nextThumbnail = backdropGames[nextIndex]?.thumbnail
    if (nextThumbnail) {
      const preload = new Image()
      preload.src = nextThumbnail
    }
  }, [backdropActive, backdropGames, currentIndex])

  useEffect(() => {
    if (!backdropActive || backdropGames.length <= 1) return

    const interval = window.setInterval(() => {
      setSlide((currentSlide) => ({
        previous: currentSlide.current,
        current: (currentSlide.current + 1) % backdropGames.length,
      }))
    }, 6000)

    return () => window.clearInterval(interval)
  }, [backdropActive, backdropGames.length])

  const currentGame = backdropGames[currentIndex]
  const previousGame =
    slide.previous === null || backdropGames.length === 0
      ? null
      : backdropGames[slide.previous % backdropGames.length]

  const markImageFailed = (gameId: string) => {
    setFailedImages((current) => {
      if (current.has(gameId)) return current
      const next = new Set(current)
      next.add(gameId)
      return next
    })
  }

  useEffect(() => {
    onActiveThumbnailChange?.(currentGame?.thumbnail ?? null)
  }, [currentGame?.thumbnail, onActiveThumbnailChange])

  if (variant === "mobile") {
    return (
      <div
        className="pointer-events-none absolute inset-0 overflow-hidden"
        aria-hidden="true"
      >
        <div className="absolute inset-0 z-0 bg-canvas" />

        <div className="absolute inset-x-0 top-[calc(env(safe-area-inset-top)+5rem)] z-10 h-[100vw] overflow-hidden">
          {previousGame ? (
            failedImages.has(previousGame.id) ? (
              <GameThumbnailPlaceholder
                title={previousGame.title}
                className="scale-[1.04] opacity-100"
              />
            ) : (
              <NextImage
                key={`mobile-previous-${previousGame.id}`}
                src={previousGame.thumbnail}
                alt=""
                fill
                sizes={imageSizes}
                draggable={false}
                loading="eager"
                onError={() => markImageFailed(previousGame.id)}
                className="absolute inset-0 h-full w-full scale-[1.04] object-cover object-center opacity-100 saturate-[1.12] contrast-[1.06]"
              />
            )
          ) : null}

          {currentGame ? (
            failedImages.has(currentGame.id) ? (
              <GameThumbnailPlaceholder
                title={currentGame.title}
                className="home-game-backdrop-image"
              />
            ) : (
              <NextImage
                key={`mobile-current-${currentGame.id}`}
                src={currentGame.thumbnail}
                alt=""
                fill
                sizes={imageSizes}
                draggable={false}
                loading="eager"
                fetchPriority={slide.current === 0 ? "high" : "auto"}
                onError={() => markImageFailed(currentGame.id)}
                className="home-game-backdrop-image absolute inset-0 h-full w-full object-cover object-center saturate-[1.12] contrast-[1.06]"
              />
            )
          ) : null}
        </div>

        <div
          className="absolute left-[-1rem] right-[-1rem] z-20 h-[100vw] bg-black/55"
          style={{
            top: "calc(env(safe-area-inset-top) + 5rem)",
          }}
        />
        <div
          className="absolute left-[-4px] right-[-4px] z-30 h-[16rem] bg-gradient-to-b from-transparent via-canvas/80 to-canvas"
          style={{
            top: "calc(env(safe-area-inset-top) + 5rem + 100vw - 14.5rem)",
          }}
        />
      </div>
    )
  }

  return (
    <div
      className="pointer-events-none absolute inset-0 overflow-hidden"
      aria-hidden="true"
    >
      {previousGame ? (
        failedImages.has(previousGame.id) ? (
          <GameThumbnailPlaceholder
            title={previousGame.title}
            className="z-10 scale-[1.04] opacity-100"
          />
        ) : (
          <NextImage
            key={`previous-${previousGame.id}`}
            src={previousGame.thumbnail}
            alt=""
            fill
            sizes={imageSizes}
            draggable={false}
            onError={() => markImageFailed(previousGame.id)}
            className="absolute inset-0 z-10 h-full w-full scale-[1.04] object-cover object-center opacity-100 saturate-[1.12] contrast-[1.06]"
          />
        )
      ) : null}

      {currentGame ? (
        failedImages.has(currentGame.id) ? (
          <GameThumbnailPlaceholder
            title={currentGame.title}
            className="home-game-backdrop-image z-10"
          />
        ) : (
          <NextImage
            key={`current-${currentGame.id}`}
            src={currentGame.thumbnail}
            alt=""
            fill
            sizes={imageSizes}
            draggable={false}
            onError={() => markImageFailed(currentGame.id)}
            className="home-game-backdrop-image absolute inset-0 z-10 h-full w-full object-cover object-center saturate-[1.12] contrast-[1.06]"
          />
        )
      ) : (
        <div className="absolute inset-0 z-10 bg-canvas" />
      )}

      <div className="absolute inset-0 z-20 bg-black/55" />
    </div>
  )
}
