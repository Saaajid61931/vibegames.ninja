"use client"

import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from "react"
import { Loader2, Play } from "lucide-react"
import { Button } from "@/components/ui/button"
import { getMobileOrientationLabel, getMobileOrientationPrompt, type MobileOrientation } from "@/lib/mobile-orientation"

const AUTO_THUMBNAIL_CAPTURE_TOTAL = 5
const AUTO_THUMBNAIL_CAPTURE_INTERVAL_MS = 5000
const AUTO_THUMBNAIL_MAX_WIDTH = 960
const AUTO_THUMBNAIL_EXPORT_QUALITY = 0.68

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
  onAutoThumbnailCaptureProgress?: (payload: { captured: number; total: number }) => void
  onAutoThumbnailCaptureComplete?: (images: string[]) => void
  onAutoThumbnailCaptureError?: (message: string) => void
}

export interface GamePlayerHandle {
  startAutoThumbnailCapture: () => Promise<void>
}

type LockableScreenOrientation = ScreenOrientation & {
  lock?: (orientation: "portrait" | "landscape") => Promise<void>
  unlock?: () => void
}

type PendingScreenshotRequest = {
  resolve: (imageDataUrl: string) => void
  reject: (error: Error) => void
  timeoutId: number
}

type DisplayMediaOptions = DisplayMediaStreamOptions & {
  preferCurrentTab?: boolean
  selfBrowserSurface?: "include" | "exclude"
  surfaceSwitching?: "include" | "exclude"
}

export const GamePlayer = forwardRef<GamePlayerHandle, GamePlayerProps>(function GamePlayer({
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
  onAutoThumbnailCaptureProgress,
  onAutoThumbnailCaptureComplete,
  onAutoThumbnailCaptureError,
}: GamePlayerProps, ref) {
  const wrapperRef = useRef<HTMLDivElement>(null)
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const isLoadingRef = useRef(true)
  const pendingScreenshotRequestsRef = useRef<Map<string, PendingScreenshotRequest>>(new Map())
  const autoThumbnailRunIdRef = useRef(0)
  const captureStreamRef = useRef<MediaStream | null>(null)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [isMobileLikeDevice, setIsMobileLikeDevice] = useState(false)
  const [viewportOrientation, setViewportOrientation] = useState<"portrait" | "landscape">("landscape")
  const [isLoading, setIsLoading] = useState(true)
  const [gameReady, setGameReady] = useState(false)
  const [fullscreenError, setFullscreenError] = useState("")
  const [isAutoCapturing, setIsAutoCapturing] = useState(false)

  const requiredOrientation = supportsMobile && mobileOrientation !== "BOTH"
    ? mobileOrientation
    : null
  const orientationMismatch = Boolean(
    isFullscreen &&
      isMobileLikeDevice &&
      requiredOrientation &&
      viewportOrientation !== requiredOrientation.toLowerCase()
  )
  const showPlayOverlay = !isFullscreen && !isAutoCapturing && mode === "play"

  useEffect(() => {
    isLoadingRef.current = isLoading
  }, [isLoading])

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

      if (message.type === "VG_SCREENSHOT_CAPTURED") {
        const payload = message.payload || {}
        const captureId = typeof payload.captureId === "string" ? payload.captureId : ""
        if (!captureId) {
          return
        }

        const pending = pendingScreenshotRequestsRef.current.get(captureId)
        if (!pending) {
          return
        }

        window.clearTimeout(pending.timeoutId)
        pendingScreenshotRequestsRef.current.delete(captureId)

        if (typeof payload.imageDataUrl === "string" && payload.imageDataUrl.startsWith("data:image/")) {
          pending.resolve(payload.imageDataUrl)
          return
        }

        pending.reject(
          new Error(
            typeof payload.error === "string"
              ? payload.error
              : "Screenshot capture failed. Make sure the game renders to a canvas."
          )
        )
      }
    }

    window.addEventListener("message", handleMessage)
    return () => window.removeEventListener("message", handleMessage)
  }, [onReady, onSaveLevel])

  useEffect(() => {
    const pendingScreenshotRequests = pendingScreenshotRequestsRef.current

    return () => {
      pendingScreenshotRequests.forEach((pending) => {
        window.clearTimeout(pending.timeoutId)
        pending.reject(new Error("Screenshot capture cancelled."))
      })
      pendingScreenshotRequests.clear()
    }
  }, [])

  const stopCaptureStream = useCallback(() => {
    captureStreamRef.current?.getTracks().forEach((track) => track.stop())
    captureStreamRef.current = null
  }, [])

  useEffect(() => {
    return () => {
      stopCaptureStream()
    }
  }, [stopCaptureStream])

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

  const launchFullscreen = useCallback(async () => {
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
      const message = "Fullscreen is required to play. If it did not open, check browser permissions and try again."
      setFullscreenError(message)
      throw new Error(message)
    }
  }, [requiredOrientation])

  const wait = useCallback((ms: number) => {
    return new Promise<void>((resolve) => {
      window.setTimeout(resolve, ms)
    })
  }, [])

  const waitForGameToLoad = useCallback(async () => {
    const startedAt = Date.now()

    while (isLoadingRef.current) {
      if (Date.now() - startedAt > 15000) {
        throw new Error("Game is still loading. Wait a moment and try auto thumbnails again.")
      }

      await wait(200)
    }
  }, [wait])

  const requestScreenshot = useCallback(() => {
    const targetWindow = iframeRef.current?.contentWindow
    if (!targetWindow) {
      return Promise.reject(new Error("Game window is not available yet."))
    }

    const captureId = `${Date.now()}-${Math.random().toString(36).slice(2)}`

    return new Promise<string>((resolve, reject) => {
      const timeoutId = window.setTimeout(() => {
        pendingScreenshotRequestsRef.current.delete(captureId)
        reject(new Error("Screenshot capture timed out. Make sure the game has a canvas or uses VG.onRequestScreenshot()."))
      }, 4000)

      pendingScreenshotRequestsRef.current.set(captureId, {
        resolve,
        reject,
        timeoutId,
      })

      targetWindow.postMessage(
        {
          source: "vibegames-platform",
          type: "VG_REQUEST_SCREENSHOT",
          payload: { captureId },
        },
        "*"
      )
    })
  }, [])

  const getCaptureRect = useCallback(() => {
    return iframeRef.current?.getBoundingClientRect() || wrapperRef.current?.getBoundingClientRect() || null
  }, [])

  const prepareCaptureVideo = useCallback(async (stream: MediaStream) => {
    const video = document.createElement("video")
    video.playsInline = true
    video.muted = true
    video.srcObject = stream

    await new Promise<void>((resolve, reject) => {
      const handleLoadedMetadata = () => {
        video.removeEventListener("loadedmetadata", handleLoadedMetadata)
        resolve()
      }

      const handleError = () => {
        video.removeEventListener("error", handleError)
        reject(new Error("Unable to read the shared tab video stream."))
      }

      video.addEventListener("loadedmetadata", handleLoadedMetadata)
      video.addEventListener("error", handleError, { once: true })
    })

    await video.play().catch(() => undefined)
    return video
  }, [])

  const captureScreenshotFromVideo = useCallback((video: HTMLVideoElement) => {
    const rect = getCaptureRect()
    if (!rect) {
      throw new Error("Game area is not available for capture.")
    }

    const viewportWidth = window.innerWidth || document.documentElement.clientWidth || rect.width
    const viewportHeight = window.innerHeight || document.documentElement.clientHeight || rect.height
    const scaleX = video.videoWidth / viewportWidth
    const scaleY = video.videoHeight / viewportHeight
    const sourceX = Math.max(0, Math.round(rect.left * scaleX))
    const sourceY = Math.max(0, Math.round(rect.top * scaleY))
    const sourceWidth = Math.max(1, Math.round(rect.width * scaleX))
    const sourceHeight = Math.max(1, Math.round(rect.height * scaleY))
    const scale = Math.min(1, AUTO_THUMBNAIL_MAX_WIDTH / sourceWidth)
    const canvas = document.createElement("canvas")

    canvas.width = Math.max(1, Math.round(sourceWidth * scale))
    canvas.height = Math.max(1, Math.round(sourceHeight * scale))

    const context = canvas.getContext("2d")
    if (!context) {
      throw new Error("Canvas capture is not available in this browser.")
    }

    context.imageSmoothingEnabled = true
    context.imageSmoothingQuality = "high"

    context.drawImage(
      video,
      sourceX,
      sourceY,
      sourceWidth,
      sourceHeight,
      0,
      0,
      canvas.width,
      canvas.height
    )

    const webpDataUrl = canvas.toDataURL("image/webp", AUTO_THUMBNAIL_EXPORT_QUALITY)
    if (webpDataUrl.startsWith("data:image/webp")) {
      return webpDataUrl
    }

    return canvas.toDataURL("image/jpeg", AUTO_THUMBNAIL_EXPORT_QUALITY)
  }, [getCaptureRect])

  const startDisplayCapture = useCallback(() => {
    if (!navigator.mediaDevices?.getDisplayMedia) {
      throw new Error("This browser does not support screen capture prompts. Try Chrome, Edge, or another Chromium browser.")
    }

    const options: DisplayMediaOptions = {
      video: {
        frameRate: { ideal: 30, max: 30 },
      },
      audio: false,
      preferCurrentTab: true,
      selfBrowserSurface: "include",
      surfaceSwitching: "exclude",
    }

    return navigator.mediaDevices.getDisplayMedia(options)
  }, [])

  const captureScreenshotsWithDisplayMedia = useCallback(async (runId: number) => {
    const displayStreamPromise = Promise.resolve().then(() => startDisplayCapture())
    const fullscreenPromise = Promise.resolve().then(() => launchFullscreen()).catch(() => undefined)

    const stream = await displayStreamPromise.catch((error: unknown) => {
      const name = typeof error === "object" && error && "name" in error ? String(error.name) : ""

      if (name === "NotAllowedError" || name === "PermissionDeniedError") {
        throw new Error("Screen capture permission was denied. Click Allow and share this browser tab to generate thumbnails.")
      }

      if (name === "AbortError" || name === "NotFoundError") {
        throw new Error("Screen capture was cancelled. Choose this browser tab in the prompt and try again.")
      }

      throw error instanceof Error ? error : new Error("Unable to start screen capture.")
    })

    captureStreamRef.current = stream

    const track = stream.getVideoTracks()[0]
    if (!track) {
      throw new Error("No video track was provided by the browser capture prompt.")
    }

    await fullscreenPromise
    await waitForGameToLoad()
    await wait(800)

    const video = await prepareCaptureVideo(stream)
    const screenshots: string[] = []

    for (let index = 0; index < AUTO_THUMBNAIL_CAPTURE_TOTAL; index += 1) {
      await wait(AUTO_THUMBNAIL_CAPTURE_INTERVAL_MS)

      if (autoThumbnailRunIdRef.current !== runId) {
        return []
      }

      if (track.readyState === "ended") {
        throw new Error("Screen capture ended early. Keep the shared tab active until all 5 screenshots finish.")
      }

      screenshots.push(captureScreenshotFromVideo(video))
      onAutoThumbnailCaptureProgress?.({
        captured: screenshots.length,
        total: AUTO_THUMBNAIL_CAPTURE_TOTAL,
      })
    }

    video.srcObject = null
    return screenshots
  }, [captureScreenshotFromVideo, launchFullscreen, onAutoThumbnailCaptureProgress, prepareCaptureVideo, startDisplayCapture, wait, waitForGameToLoad])

  const runAutoThumbnailCapture = useCallback(async () => {
    const runId = autoThumbnailRunIdRef.current + 1
    autoThumbnailRunIdRef.current = runId

    try {
      setIsAutoCapturing(true)
      onAutoThumbnailCaptureProgress?.({ captured: 0, total: AUTO_THUMBNAIL_CAPTURE_TOTAL })
      let screenshots: string[] = []

      try {
        screenshots = await captureScreenshotsWithDisplayMedia(runId)
      } catch (displayMediaError) {
        if (!navigator.mediaDevices?.getDisplayMedia) {
          await waitForGameToLoad()
          await launchFullscreen()

          for (let index = 0; index < AUTO_THUMBNAIL_CAPTURE_TOTAL; index += 1) {
            await wait(AUTO_THUMBNAIL_CAPTURE_INTERVAL_MS)

            if (autoThumbnailRunIdRef.current !== runId) {
              return
            }

            const screenshot = await requestScreenshot()
            screenshots.push(screenshot)
            onAutoThumbnailCaptureProgress?.({
              captured: screenshots.length,
              total: AUTO_THUMBNAIL_CAPTURE_TOTAL,
            })
          }
        } else {
          throw displayMediaError
        }
      }

      if (autoThumbnailRunIdRef.current === runId) {
        onAutoThumbnailCaptureComplete?.(screenshots)
      }
    } catch (error) {
      if (autoThumbnailRunIdRef.current === runId) {
        onAutoThumbnailCaptureError?.(
          error instanceof Error ? error.message : "Auto thumbnail capture failed."
        )
      }
    } finally {
      stopCaptureStream()
      setIsAutoCapturing(false)
    }
  }, [
    captureScreenshotsWithDisplayMedia,
    launchFullscreen,
    onAutoThumbnailCaptureComplete,
    onAutoThumbnailCaptureError,
    onAutoThumbnailCaptureProgress,
    requestScreenshot,
    stopCaptureStream,
    wait,
    waitForGameToLoad,
  ])

  useImperativeHandle(ref, () => ({
    startAutoThumbnailCapture: async () => {
      await runAutoThumbnailCapture()
    },
  }), [runAutoThumbnailCapture])

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
          {isAutoCapturing
            ? "Share this browser tab when prompted and keep playing while screenshots are captured."
            : requiredOrientation
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

        {showPlayOverlay && (
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

              <Button
                type="button"
                variant="arcade"
                size="lg"
                className="gap-2"
                onClick={() => {
                  void launchFullscreen()
                }}
              >
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
})
