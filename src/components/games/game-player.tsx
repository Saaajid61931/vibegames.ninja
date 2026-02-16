"use client"

import { useEffect, useRef, useState } from "react"
import { Maximize2, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"

interface GamePlayerProps {
  title: string
  gameUrl: string
  runtimeLabel: string
  mode?: "play" | "editor"
  levelData?: unknown
  levelName?: string
  levelDescription?: string | null
  onSaveLevel?: (payload: { name?: string; description?: string; data?: unknown; thumbnail?: string }) => void
  onReady?: (ready: boolean) => void
  requestSaveNonce?: number
}

export function GamePlayer({
  title,
  gameUrl,
  runtimeLabel,
  mode = "play",
  levelData,
  levelName,
  levelDescription,
  onSaveLevel,
  onReady,
  requestSaveNonce,
}: GamePlayerProps) {
  const wrapperRef = useRef<HTMLDivElement>(null)
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [isMobileViewport, setIsMobileViewport] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [gameReady, setGameReady] = useState(false)

  useEffect(() => {
    const media = window.matchMedia("(max-width: 768px)")
    const update = () => setIsMobileViewport(media.matches)
    update()
    media.addEventListener("change", update)
    return () => media.removeEventListener("change", update)
  }, [])

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.source !== iframeRef.current?.contentWindow) {
        return
      }

      const message = event.data
      if (!message || message.source !== "vibegames-sdk") {
        return
      }

      if (message.type === "VG_READY") {
        setGameReady(true)
        onReady?.(true)
      }

      if (message.type === "VG_SAVE_LEVEL") {
        onSaveLevel?.(message.payload || {})
      }
    }

    window.addEventListener("message", handleMessage)
    return () => window.removeEventListener("message", handleMessage)
  }, [onReady, onSaveLevel])

  useEffect(() => {
    const targetWindow = iframeRef.current?.contentWindow
    if (!targetWindow || isLoading) {
      return
    }

    targetWindow.postMessage(
      {
        source: "vibegames-platform",
        type: "VG_INIT",
        payload: { mode },
      },
      "*"
    )

    if (mode === "editor") {
      targetWindow.postMessage(
        {
          source: "vibegames-platform",
          type: "VG_ENTER_EDIT_MODE",
          payload: {},
        },
        "*"
      )
    }

    if (typeof levelData !== "undefined") {
      targetWindow.postMessage(
        {
          source: "vibegames-platform",
          type: "VG_LOAD_LEVEL",
          payload: {
            level: {
              data: levelData,
              name: levelName || "",
              description: levelDescription || "",
            },
          },
        },
        "*"
      )
    }
  }, [mode, levelData, levelName, levelDescription, gameReady, isLoading])

  useEffect(() => {
    const targetWindow = iframeRef.current?.contentWindow
    if (!targetWindow || isLoading || !requestSaveNonce) {
      return
    }

    targetWindow.postMessage(
      {
        source: "vibegames-platform",
        type: "VG_REQUEST_SAVE",
        payload: {},
      },
      "*"
    )
  }, [requestSaveNonce, isLoading])

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
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black z-10">
            <div className="text-center">
              <Loader2 className="h-8 w-8 text-[#ffff00] animate-spin mx-auto mb-2" />
              <p className="font-arcade text-xs text-[#ffff00]">LOADING CARTRIDGE...</p>
            </div>
          </div>
        )}
        <iframe
          ref={iframeRef}
          src={gameUrl}
          title={title}
          sandbox="allow-scripts allow-same-origin allow-pointer-lock allow-forms"
          allow="fullscreen; gamepad; accelerometer; gyroscope"
          allowFullScreen
          className="absolute inset-0 h-full w-full border-0"
          onLoad={() => setIsLoading(false)}
        />
      </div>
    </div>
  )
}
