"use client"

import { useEffect, useMemo, useState } from "react"

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
  const currentIndex =
    backdropGames.length > 0 ? slide.current % backdropGames.length : 0

  useEffect(() => {
    if (backdropGames.length <= 1) return

    const nextIndex = (currentIndex + 1) % backdropGames.length
    const nextThumbnail = backdropGames[nextIndex]?.thumbnail
    if (nextThumbnail) {
      const preload = new Image()
      preload.src = nextThumbnail
    }
  }, [backdropGames, currentIndex])

  useEffect(() => {
    if (backdropGames.length <= 1) return

    const interval = window.setInterval(() => {
      setSlide((currentSlide) => ({
        previous: currentSlide.current,
        current: (currentSlide.current + 1) % backdropGames.length,
      }))
    }, 6000)

    return () => window.clearInterval(interval)
  }, [backdropGames.length])

  const currentGame = backdropGames[currentIndex]
  const previousGame =
    slide.previous === null || backdropGames.length === 0
      ? null
      : backdropGames[slide.previous % backdropGames.length]

  useEffect(() => {
    onActiveThumbnailChange?.(currentGame?.thumbnail ?? null)
  }, [currentGame?.thumbnail, onActiveThumbnailChange])

  if (variant === "mobile") {
    return (
      <div
        className="pointer-events-none absolute inset-0 overflow-hidden"
        aria-hidden="true"
      >
        <div className="absolute inset-0 z-0 bg-[#090b12]" />

        <div className="absolute inset-x-0 top-[calc(env(safe-area-inset-top)+5rem)] z-10 h-[100vw] overflow-hidden">
          {previousGame ? (
            <img
              key={`mobile-previous-${previousGame.id}`}
              src={previousGame.thumbnail}
              alt=""
              draggable={false}
              className="absolute inset-0 h-full w-full scale-[1.04] object-cover object-center opacity-100 saturate-[1.12] contrast-[1.06]"
            />
          ) : null}

          {currentGame ? (
            <img
              key={`mobile-current-${currentGame.id}`}
              src={currentGame.thumbnail}
              alt=""
              draggable={false}
              loading={slide.current === 0 ? "eager" : "lazy"}
              fetchPriority={slide.current === 0 ? "high" : "auto"}
              className="home-game-backdrop-image absolute inset-0 h-full w-full object-cover object-center saturate-[1.12] contrast-[1.06]"
            />
          ) : null}
        </div>

        <div
          className="absolute left-[-1rem] right-[-1rem] z-20 h-[100vw] bg-black/55"
          style={{
            top: "calc(env(safe-area-inset-top) + 5rem)",
          }}
        />
        <div
          className="absolute left-[-4px] right-[-4px] z-30 h-[16rem] bg-gradient-to-b from-transparent via-[#090b12]/80 to-[#090b12]"
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
        <img
          key={`previous-${previousGame.id}`}
          src={previousGame.thumbnail}
          alt=""
          draggable={false}
          className="absolute inset-0 z-10 h-full w-full scale-[1.04] object-cover object-center opacity-100 saturate-[1.12] contrast-[1.06]"
        />
      ) : null}

      {currentGame ? (
        <img
          key={`current-${currentGame.id}`}
          src={currentGame.thumbnail}
          alt=""
          draggable={false}
          loading={slide.current === 0 ? "eager" : "lazy"}
          fetchPriority={slide.current === 0 ? "high" : "auto"}
          className="home-game-backdrop-image absolute inset-0 z-10 h-full w-full object-cover object-center saturate-[1.12] contrast-[1.06]"
        />
      ) : (
        <div className="absolute inset-0 z-10 bg-[#090b12]" />
      )}

      <div className="absolute inset-0 z-20 bg-black/55" />
    </div>
  )
}
