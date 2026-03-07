"use client"

import { useEffect, useRef, useState } from "react"
import { Loader2, Play } from "lucide-react"
import { Button } from "@/components/ui/button"
import { getMobileOrientationLabel, getMobileOrientationPrompt, type MobileOrientation } from "@/lib/mobile-orientation"

interface GamePlayerProps {
  title: string
  gameUrl: string
  runtimeLabel: string
  supportsMobile?: boolean
  mobileOrientation?: MobileOrientation
  mode?: "play" | "editor"
  levelData?: unknown
  levelName?: string
  levelDescription?: string | null
  onSaveLevel?: (payload: { name?: string; description?: string; data?: unknown; thumbnail?: string }) => void
  onReady?: (ready: boolean) => void
  requestSaveNonce?: number
}

type LockableScreenOrientation = ScreenOrientation & {
  lock?: (orientation: "portrait" | "landscape") => Promise<void>
  unlock?: () => void
}

export function GamePlayer({
  title,
  gameUrl,
  runtimeLabel,
  supportsMobile = false,
  mobileOrientation = "BOTH",
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
  const [isMobileLikeDevice, setIsMobileLikeDevice] = useState(false)
  const [viewportOrientation, setViewportOrientation] = useState<"portrait" | "landscape">("landscape")
  const [isLoading, setIsLoading] = useState(true)
  const [gameReady, setGameReady] = useState(false)
  const [fullscreenError, setFullscreenError] = useState("")

  const requiredOrientation = supportsMobile && mobileOrientation !== "BOTH"
    ? mobileOrientation
    : null
  const orientationMismatch = Boolean(
    isFullscreen &&
      isMobileLikeDevice &&
      requiredOrientation &&
      viewportOrientation !== requiredOrientation.toLowerCase()
  )

  useEffect(() => {
    const media = window.matchMedia("(pointer: coarse)")
    const orientation = screen.orientation as LockableScreenOrientation | undefined
    const update = () => {
      setIsMobileLikeDevice(media.matches || navigator.maxTouchPoints > 0)
      setViewportOrientation(window.innerWidth >= window.innerHeight ? "landscape" : "portrait")
    }

    update()
    media.addEventListener("change", update)
    window.addEventListener("resize", update)
    orientation?.addEventListener?.("change", update)

    return () => {
      media.removeEventListener("change", update)
      window.removeEventListener("resize", update)
      orientation?.removeEventListener?.("change", update)
    }
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

      if (!active) {
        try {
          ;(screen.orientation as LockableScreenOrientation | undefined)?.unlock?.()
        } catch {
          // Ignore unsupported orientation unlock APIs.
        }
      }
    }

    document.addEventListener("fullscreenchange", handleFullscreenChange)
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange)
  }, [])

  useEffect(() => {
    return () => {
      try {
        ;(screen.orientation as LockableScreenOrientation | undefined)?.unlock?.()
      } catch {
        // Ignore unsupported orientation unlock APIs.
      }
    }
  }, [])

  const launchFullscreen = async () => {
    if (!wrapperRef.current) {
      return
    }

    setFullscreenError("")

    try {
      await wrapperRef.current.requestFullscreen()

      if (requiredOrientation) {
        try {
          await (screen.orientation as LockableScreenOrientation | undefined)?.lock?.(
            requiredOrientation === "LANDSCAPE" ? "landscape" : "portrait"
          )
        } catch {
          // Some browsers require manual rotation even in fullscreen.
        }
      }
    } catch {
      setFullscreenError("Fullscreen is required to play. If it did not open, check browser permissions and try again.")
    }
  }

  return (
    <div ref={wrapperRef} className={`relative overflow-hidden ${isFullscreen ? "bg-black" : "border-2 border-[#4a4a6a] bg-[#1a1a2e]"}`}>
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
          <span className="font-arcade text-[10px] text-[#8b93a6] shrink-0">
            {mode === "play" ? "FULLSCREEN ONLY" : "EDITOR MODE"}
          </span>
        </div>
      )}

      {!isFullscreen && mode === "play" && (
        <div className="px-3 py-2 text-[11px] text-[#8b93a6] border-b border-[#2e3446] bg-[#0d0d15]">
          {requiredOrientation
            ? `Mobile mode: ${getMobileOrientationLabel(requiredOrientation)}.`
            : "Launch in fullscreen to play."}
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

        {!isFullscreen && mode === "play" && (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/75 p-4">
            <div className="max-w-md text-center space-y-4">
              <div className="space-y-2">
                <p className="font-arcade text-[10px] text-[#8b93a6]">PRESS START</p>
                <h3 className="font-arcade text-sm sm:text-base text-white">Play {title} in fullscreen</h3>
                <p className="font-arcade text-[11px] sm:text-xs text-[#8b93a6]">
                  {requiredOrientation
                    ? `This mobile experience is ${getMobileOrientationLabel(requiredOrientation).toLowerCase()}.`
                    : "Games on VibeGames launch only in fullscreen."}
                </p>
              </div>

              <Button type="button" variant="arcade" size="lg" className="gap-2" onClick={launchFullscreen}>
                <Play className="h-4 w-4" />
                PLAY IN FULLSCREEN
              </Button>

              {fullscreenError && (
                <p className="font-arcade text-[11px] text-[#ff8b8b]">{fullscreenError}</p>
              )}
            </div>
          </div>
        )}

        {orientationMismatch && requiredOrientation && (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/80 p-4">
            <div className="max-w-sm text-center space-y-3">
              <p className="font-arcade text-[10px] text-[#8b93a6]">ROTATE DEVICE</p>
              <h3 className="font-arcade text-sm sm:text-base text-white">
                {getMobileOrientationPrompt(requiredOrientation)}
              </h3>
              <p className="font-arcade text-[11px] sm:text-xs text-[#8b93a6]">
                This game only supports {getMobileOrientationLabel(requiredOrientation).toLowerCase()} on mobile.
              </p>
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
