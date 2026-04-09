"use client"

import { useEffect, useMemo, useState } from "react"
import Image from "next/image"
import { isRenderableImageSrc } from "@/lib/image-src"

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
  const frameKey = frames.join("|")
  const visibleIndex =
    frames.length === 0
      ? 0
      : animateSlides
        ? activeIndex % frames.length
        : 0
  const currentSrc = frames[visibleIndex]

  useEffect(() => {
    if (!animateSlides || frames.length < 2) {
      return
    }

    const intervalId = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % frames.length)
    }, SLIDESHOW_INTERVAL_MS)

    return () => {
      window.clearInterval(intervalId)
    }
  }, [animateSlides, frames.length])

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
        sizes={sizes}
        priority={priority && visibleIndex === 0}
        className={`absolute inset-0 h-full w-full ${imageClassName} transition-opacity duration-500 opacity-100`}
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
