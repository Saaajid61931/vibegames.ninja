"use client"

import { useEffect, useRef, useState } from "react"
import { Maximize2 } from "lucide-react"
import { Button } from "@/components/ui/button"

interface GamePlayerProps {
  title: string
  gameUrl: string
  runtimeLabel: string
}

export function GamePlayer({ title, gameUrl, runtimeLabel }: GamePlayerProps) {
  const wrapperRef = useRef<HTMLDivElement>(null)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [isMobileViewport, setIsMobileViewport] = useState(false)

  useEffect(() => {
    const media = window.matchMedia("(max-width: 768px)")
    const update = () => setIsMobileViewport(media.matches)
    update()
    media.addEventListener("change", update)
    return () => media.removeEventListener("change", update)
  }, [])

  useEffect(() => {
    const handleFullscreenChange = () => {
      const active = document.fullscreenElement === wrapperRef.current
      setIsFullscreen(active)
    }

    document.addEventListener("fullscreenchange", handleFullscreenChange)
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange)
  }, [])

  const toggleFullscreen = async () => {
    if (!wrapperRef.current) {
      return
    }

    if (document.fullscreenElement === wrapperRef.current) {
      await document.exitFullscreen()
      return
    }

    await wrapperRef.current.requestFullscreen()
  }

  return (
    <div ref={wrapperRef} className={`relative ${isFullscreen ? "bg-black" : "border-2 border-[#4a4a6a] bg-[#1a1a2e]"}`}>
      {!isFullscreen && (
        <div className="border-b-2 border-[#4a4a6a] bg-[#0d0d15] px-3 sm:px-4 py-2 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <div className="flex gap-1.5">
              <div className="h-3 w-3 bg-[#ff0040]" />
              <div className="h-3 w-3 bg-[#ffa500]" />
              <div className="h-3 w-3 bg-[#ffff00]" />
            </div>
            <span className="font-arcade text-xs text-[#4a4a6a] ml-2 truncate">RUNTIME: {runtimeLabel}</span>
          </div>
          <Button type="button" variant="outline" size="sm" className="gap-1 sm:gap-2 shrink-0" onClick={toggleFullscreen}>
            <Maximize2 className="h-4 w-4" />
            {isMobileViewport ? "Full" : "Fullscreen"}
          </Button>
        </div>
      )}

      {isMobileViewport && !isFullscreen && (
        <div className="px-3 py-2 text-[11px] text-[#8b93a6] border-b border-[#2e3446] bg-[#0d0d15]">
          Tip: use fullscreen for the best mobile controls.
        </div>
      )}

      <div className={isFullscreen ? "relative h-[100dvh] w-full bg-black" : "relative w-full bg-black aspect-[4/3] sm:aspect-video"}>
        <iframe
          src={gameUrl}
          title={title}
          sandbox="allow-scripts allow-same-origin allow-pointer-lock allow-forms"
          allow="fullscreen; gamepad; accelerometer; gyroscope"
          allowFullScreen
          className="absolute inset-0 h-full w-full border-0"
        />
      </div>
    </div>
  )
}
