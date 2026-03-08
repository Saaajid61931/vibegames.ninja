"use client"

import Image from "next/image"
import { useEffect, useMemo, useState } from "react"

interface GameThumbnailSlideshowProps {
  title: string
  thumbnail?: string | null
  thumbnailSlides?: string[] | null
  sizes: string
  priority?: boolean
  quality?: number
  imageClassName?: string
  showIndicators?: boolean
}

const SLIDESHOW_INTERVAL_MS = 2800

export function GameThumbnailSlideshow({
  title,
  thumbnail,
  thumbnailSlides,
  sizes,
  priority = false,
  quality = 60,
  imageClassName = "object-cover",
  showIndicators = true,
}: GameThumbnailSlideshowProps) {
  const frames = useMemo(() => {
    const seen = new Set<string>()
    const ordered = [thumbnail, ...(thumbnailSlides || [])]

    return ordered.filter((url): url is string => {
      if (!url || seen.has(url)) {
        return false
      }

      seen.add(url)
      return true
    })
  }, [thumbnail, thumbnailSlides])

  const [activeIndex, setActiveIndex] = useState(0)
  const frameKey = frames.join("|")
  const visibleIndex = frames.length === 0 ? 0 : activeIndex % frames.length
  const currentSrc = frames[visibleIndex]

  useEffect(() => {
    if (frames.length < 2) {
      return
    }

    const intervalId = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % frames.length)
    }, SLIDESHOW_INTERVAL_MS)

    return () => {
      window.clearInterval(intervalId)
    }
  }, [frames.length])

  if (frames.length === 0) {
    return null
  }

  return (
    <>
      <Image
        key={`${frameKey}-${visibleIndex}`}
        src={currentSrc}
        alt={title}
        fill
        unoptimized
        className={`${imageClassName} transition-opacity duration-500 opacity-100`}
        sizes={sizes}
        priority={priority && visibleIndex === 0}
        quality={quality}
      />

      {showIndicators && frames.length > 1 && (
        <div className="absolute bottom-2 right-2 z-20 flex items-center gap-1 rounded-full bg-black/55 px-2 py-1">
          {frames.map((_, index) => (
            <span
              key={`${frameKey}-${index}`}
              className={`h-1.5 w-1.5 rounded-full transition-all ${index === visibleIndex ? "bg-white" : "bg-white/35"}`}
            />
          ))}
        </div>
      )}
    </>
  )
}
