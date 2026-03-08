"use client"

import { useEffect, useMemo, useState } from "react"

interface GameThumbnailSlideshowProps {
  title: string
  thumbnail?: string | null
  thumbnailSlides?: string[] | null
  sizes: string
  priority?: boolean
  imageClassName?: string
  showIndicators?: boolean
}

const SLIDESHOW_INTERVAL_MS = 2800
const RESPONSIVE_THUMBNAIL_MARKER = "rv=1"

function buildResponsiveThumbnailVariantUrl(src: string, width: number): string | null {
  try {
    const url = new URL(src)
    if (!url.searchParams.has("rv")) {
      return null
    }

    const match = url.pathname.match(/^(.*?)(\.[a-z0-9]+)$/i)
    if (!match) {
      return null
    }

    return `${url.origin}${match[1]}-w${width}${match[2]}`
  } catch {
    return null
  }
}

function buildResponsiveThumbnailSources(src: string): { src: string; srcSet?: string } {
  if (!src.includes(RESPONSIVE_THUMBNAIL_MARKER)) {
    return { src }
  }

  const variant320 = buildResponsiveThumbnailVariantUrl(src, 320)
  const variant640 = buildResponsiveThumbnailVariantUrl(src, 640)
  const candidates = [
    variant320 ? `${variant320} 320w` : null,
    variant640 ? `${variant640} 640w` : null,
    `${src.split("?")[0]} 960w`,
  ].filter((candidate): candidate is string => Boolean(candidate))

  return {
    src: src.split("?")[0],
    srcSet: candidates.length > 1 ? candidates.join(", ") : undefined,
  }
}

export function GameThumbnailSlideshow({
  title,
  thumbnail,
  thumbnailSlides,
  sizes,
  priority = false,
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
  const responsiveImage = buildResponsiveThumbnailSources(currentSrc)

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
      <img
        key={`${frameKey}-${visibleIndex}`}
        src={responsiveImage.src}
        alt={title}
        className={`absolute inset-0 h-full w-full ${imageClassName} transition-opacity duration-500 opacity-100`}
        sizes={sizes}
        srcSet={responsiveImage.srcSet}
        loading={priority && visibleIndex === 0 ? "eager" : "lazy"}
        decoding="async"
        fetchPriority={priority && visibleIndex === 0 ? "high" : "auto"}
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
