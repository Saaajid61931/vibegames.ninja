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
        {previousGame ? (
          <img
            key={`mobile-ambient-previous-${previousGame.id}`}
            src={previousGame.thumbnail}
            alt=""
            draggable={false}
            className="absolute inset-0 z-0 h-full w-full scale-125 object-cover opacity-40 blur-[44px] saturate-[1.45]"
          />
        ) : null}

        {currentGame ? (
          <img
            key={`mobile-ambient-current-${currentGame.id}`}
            src={currentGame.thumbnail}
            alt=""
            draggable={false}
            className="home-game-backdrop-ambient-image absolute inset-0 z-0 h-full w-full scale-125 object-cover blur-[44px] saturate-[1.45]"
          />
        ) : (
          <div className="absolute inset-0 z-0 bg-[radial-gradient(circle_at_20%_20%,rgba(0,209,255,0.2),transparent_34%),radial-gradient(circle_at_80%_68%,rgba(244,63,94,0.2),transparent_38%),#090b12]" />
        )}

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

        <div className="absolute inset-0 z-20 bg-black/55" />
        <div className="absolute inset-0 z-[25] bg-[linear-gradient(180deg,rgba(9,11,18,0.5)_0%,rgba(9,11,18,0.16)_14%,transparent_27%)]" />
        <div
          className="absolute inset-x-0 bottom-0 z-[26]"
          style={{
            top: "calc(env(safe-area-inset-top) + 5rem + 100vw - 13rem)",
            background:
              "linear-gradient(to bottom, transparent 0, rgba(9,11,18,0.08) 2rem, rgba(9,11,18,0.42) 6rem, rgba(9,11,18,0.82) 10rem, #090b12 13rem, #090b12 100%)",
          }}
        />
        <div
          className="absolute inset-0 z-30 opacity-15"
          style={{
            backgroundImage:
              "linear-gradient(rgba(129,140,248,0.13) 1px, transparent 1px), linear-gradient(90deg, rgba(129,140,248,0.13) 1px, transparent 1px)",
            backgroundSize: "24px 24px",
            maskImage:
              "linear-gradient(to bottom, transparent 5%, rgba(0,0,0,0.62) 28%, rgba(0,0,0,0.5) 76%, transparent 100%)",
          }}
        />
        <div className="absolute inset-x-0 top-0 z-40 h-1 bg-[linear-gradient(90deg,#00d1ff_0_25%,#6366f1_25%_50%,#facc15_50%_75%,#f43f5e_75%)]" />
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
        <div className="absolute inset-0 z-10 bg-[radial-gradient(circle_at_18%_18%,rgba(0,209,255,0.2),transparent_34%),radial-gradient(circle_at_82%_74%,rgba(244,63,94,0.18),transparent_36%),#090b12]" />
      )}

      <div className="absolute inset-0 z-20 bg-black/55" />
      <div className="pixel-bg absolute inset-0 z-30 opacity-15" />
      <div className="absolute inset-x-0 top-0 z-30 h-1 bg-[linear-gradient(90deg,#00d1ff_0_25%,#6366f1_25%_50%,#facc15_50%_75%,#f43f5e_75%)]" />
    </div>
  )
}
