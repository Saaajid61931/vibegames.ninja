"use client"

import { useEffect, useMemo, useState } from "react"
import Image from "next/image"
import { isRenderableImageSrc } from "@/lib/image-src"
import { GameThumbnailPlaceholder } from "@/components/games/game-thumbnail-placeholder"

interface GameThumbnailSlideshowProps {
  title: string
  thumbnail?: string | null
  thumbnailSlides?: string[] | null
  sizes: string
  priority?: boolean
  imageClassName?: string
  showIndicators?: boolean
  animateSlides?: boolean
}

const SLIDESHOW_INTERVAL_MS = 2800

function useCanAutoAnimateSlides() {
  const [canAutoAnimate, setCanAutoAnimate] = useState(false)

  useEffect(() => {
    const query = window.matchMedia("(min-width: 768px)")
    const update = () => setCanAutoAnimate(query.matches)

    update()
    query.addEventListener("change", update)

    return () => {
      query.removeEventListener("change", update)
    }
  }, [])

  return canAutoAnimate
}

export function GameThumbnailSlideshow({
  title,
  thumbnail,
  thumbnailSlides,
  sizes,
  priority = false,
  imageClassName = "object-cover",
  showIndicators = true,
  animateSlides = true,
}: GameThumbnailSlideshowProps) {
  const frames = useMemo(() => {
    const seen = new Set<string>()
    const ordered = [thumbnail, ...(thumbnailSlides || [])]

    return ordered.filter((url): url is string => {
      const currentUrl = typeof url === "string" ? url.trim() : ""

      if (!isRenderableImageSrc(currentUrl)) {
        return false
      }

      if (seen.has(currentUrl)) {
        return false
      }

      seen.add(currentUrl)
      return true
    })
  }, [thumbnail, thumbnailSlides])

  const [activeIndex, setActiveIndex] = useState(0)
  const [failedFrames, setFailedFrames] = useState<Set<string>>(() => new Set())
  const canAutoAnimate = useCanAutoAnimateSlides()
  const shouldAnimateSlides = animateSlides && canAutoAnimate
  const frameKey = frames.join("|")
  const usableFrames = frames.filter((frame) => !failedFrames.has(frame))
  const visibleIndex =
    usableFrames.length === 0
      ? 0
      : shouldAnimateSlides
        ? activeIndex % usableFrames.length
        : 0
  const currentSrc = usableFrames[visibleIndex]

  useEffect(() => {
    if (!shouldAnimateSlides || usableFrames.length < 2) {
      return
    }

    const intervalId = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % usableFrames.length)
    }, SLIDESHOW_INTERVAL_MS)

    return () => {
      window.clearInterval(intervalId)
    }
  }, [shouldAnimateSlides, usableFrames.length])

  if (usableFrames.length === 0) {
    return <GameThumbnailPlaceholder title={title} />
  }

  return (
    <>
      <Image
        key={`${frameKey}-${visibleIndex}`}
        src={currentSrc}
        alt={title}
        fill
        sizes={sizes}
        priority={priority}
        onError={() => {
          setFailedFrames((current) => {
            const next = new Set(current)
            next.add(currentSrc)
            return next
          })
        }}
        className={`absolute inset-0 h-full w-full ${imageClassName} transition-opacity duration-500 opacity-100`}
      />

      {showIndicators && usableFrames.length > 1 && (
        <div className="absolute bottom-2 right-2 z-20 flex items-center gap-1 rounded-full bg-black/55 px-2 py-1">
          {usableFrames.map((frame, index) => (
            <span
              key={`${frame}-${index}`}
              className={`h-1.5 w-1.5 rounded-full transition-all ${index === visibleIndex ? "bg-white" : "bg-white/35"}`}
            />
          ))}
        </div>
      )}
    </>
  )
}
