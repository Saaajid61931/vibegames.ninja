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
  mode?: "play" | "editor" | "preview"
  levelData?: unknown
  levelName?: string
  levelDescription?: string | null
  onSaveLevel?: (payload: { name?: string; description?: string; data?: unknown; thumbnail?: string }) => void
  ghostToLoad?: {
    runId: string
    levelId?: string | null
    durationMs: number
    replayData: unknown
    replayVersion?: string | null
    checksum?: string | null
    playerName?: string | null
  } | null
  onSaveGhostRun?: (payload: {
    durationMs?: number
    replayData?: unknown
    replayVersion?: string | null
    checksum?: string | null
  }) => void
  onReady?: (ready: boolean) => void
  onEditorDiagnostic?: (event: { type: string; payload?: Record<string, unknown> }) => void
  onGhostDiagnostic?: (event: { type: string; payload?: Record<string, unknown> }) => void
  requestSaveNonce?: number
  onAutoThumbnailCaptureProgress?: (payload: { captured: number; total: number }) => void
  onAutoThumbnailCaptureComplete?: (images: string[]) => void
  onAutoThumbnailCaptureError?: (message: string) => void
}

export interface GamePlayerHandle {
  startAutoThumbnailCapture: () => Promise<void>
  enterFullscreen: () => Promise<void>
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
  ghostToLoad,
  onSaveGhostRun,
  onReady,
  onEditorDiagnostic,
  onGhostDiagnostic,
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
  const effectiveMode = mode === "preview" ? "play" : mode

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

      if (message.type === "VG_SAVE_GHOST_RUN") {
        onSaveGhostRun?.(message.payload || {})
      }

      if (
        message.type === "VG_EDITOR_HOOK_BOUND" ||
        message.type === "VG_EDIT_MODE_ENTERED" ||
        message.type === "VG_LEVEL_LOAD_RECEIVED" ||
        message.type === "VG_REQUEST_SAVE_RECEIVED"
      ) {
        onEditorDiagnostic?.({
          type: message.type,
          payload:
            typeof message.payload === "object" && message.payload
              ? (message.payload as Record<string, unknown>)
              : {},
        })
      }

      if (
        message.type === "VG_GHOST_READY" ||
        message.type === "VG_GHOST_HOOK_BOUND" ||
        message.type === "VG_GHOST_LOAD_RECEIVED"
      ) {
        onGhostDiagnostic?.({
          type: message.type,
          payload:
            typeof message.payload === "object" && message.payload
              ? (message.payload as Record<string, unknown>)
              : {},
        })
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
  }, [onEditorDiagnostic, onGhostDiagnostic, onReady, onSaveGhostRun, onSaveLevel])

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
        payload: { mode: effectiveMode },
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
  }, [mode, effectiveMode, levelData, levelName, levelDescription, gameReady, isLoading])

  useEffect(() => {
    const targetWindow = iframeRef.current?.contentWindow
    if (!targetWindow || isLoading || !gameReady || !ghostToLoad) {
      return
    }

    targetWindow.postMessage(
      {
        source: "vibegames-platform",
        type: "VG_LOAD_GHOST",
        payload: {
          ghost: {
            id: ghostToLoad.runId,
            levelId: ghostToLoad.levelId || null,
            durationMs: ghostToLoad.durationMs,
            replayData: ghostToLoad.replayData,
            replayVersion: ghostToLoad.replayVersion || null,
            checksum: ghostToLoad.checksum || null,
            playerName: ghostToLoad.playerName || "",
          },
        },
      },
      "*"
    )
  }, [gameReady, ghostToLoad, isLoading])

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
      if (mode === "play") {
        window.dispatchEvent(new Event("vg-game-play-start"))
      }

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
  }, [mode, requiredOrientation])

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
    let stream: MediaStream

    try {
      stream = await startDisplayCapture()
    } catch (error: unknown) {
      const name = typeof error === "object" && error && "name" in error ? String(error.name) : ""

      if (name === "NotAllowedError" || name === "PermissionDeniedError") {
        throw new Error("Screen capture permission was denied. Click Allow and share this browser tab to generate thumbnails.")
      }

      if (name === "AbortError" || name === "NotFoundError") {
        throw new Error("Screen capture was cancelled. Choose this browser tab in the prompt and try again.")
      }

      throw error instanceof Error ? error : new Error("Unable to start screen capture.")
    }

    captureStreamRef.current = stream

    const track = stream.getVideoTracks()[0]
    if (!track) {
      throw new Error("No video track was provided by the browser capture prompt.")
    }

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
  }, [captureScreenshotFromVideo, onAutoThumbnailCaptureProgress, prepareCaptureVideo, startDisplayCapture, wait, waitForGameToLoad])

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
    enterFullscreen: async () => {
      await launchFullscreen()
    },
  }), [launchFullscreen, runAutoThumbnailCapture])

  return (
    <div ref={wrapperRef} className={`relative overflow-hidden ${isFullscreen ? "bg-black" : "border-2 border-border-strong bg-surface shadow-hard-4"}`}>
      {!isFullscreen && (
        <div className="flex items-center justify-between gap-3 border-b-2 border-border-strong bg-surface-2 px-3 py-3 sm:px-4">
          <div className="flex items-center gap-2 min-w-0">
            <span className="h-2 w-2 shrink-0 bg-success" />
            <span className="truncate text-kicker  text-text">{runtimeLabel}</span>
          </div>
          <span className="shrink-0 text-kicker  text-text-secondary">
            {isAutoCapturing
              ? "Capturing screenshots"
              : mode === "preview"
                ? "Preview"
                : mode === "play"
                  ? "Ready to play"
                  : "Editor"}
          </span>
        </div>
      )}

      {!isFullscreen && mode === "play" && (
        <div className="border-b border-border-strong bg-surface px-3 py-2.5 text-xs leading-5 text-text-secondary sm:px-4">
          {isAutoCapturing
            ? "Share this browser tab when prompted and keep playing while screenshots are captured."
            : requiredOrientation
              ? `Mobile mode: ${getMobileOrientationLabel(requiredOrientation)}.`
              : "The game opens in fullscreen so controls and sound work as intended."}
        </div>
      )}

      <div className={isFullscreen ? "relative h-[100dvh] w-full bg-black" : "relative w-full bg-black aspect-[4/3] sm:aspect-video"}>
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black z-10">
            <div className="text-center">
              <Loader2 className="mx-auto mb-3 h-8 w-8 animate-spin text-primary-hover-text" />
              <p className="text-sm text-white">Loading game...</p>
            </div>
          </div>
        )}

        {showPlayOverlay && (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-canvas/90 p-4">
            <div className="w-full max-w-md space-y-5 border-2 border-border-strong bg-surface p-5 text-center shadow-hard-4 sm:p-6">
              <div className="space-y-2">
                <span className="text-kicker  text-arcade-yellow">Ready when you are</span>
                <h3 className="heading-pixel-md font-semibold text-white">Play {title}</h3>
                <p className="text-sm leading-6 text-text-secondary">
                  {requiredOrientation
                    ? `This game is designed for ${getMobileOrientationLabel(requiredOrientation).toLowerCase()}.`
                    : "Open the game in fullscreen for the best experience."}
                </p>
              </div>

              <Button
                type="button"
                size="lg"
                className="w-full gap-2 px-8 sm:w-auto"
                onClick={() => {
                  void launchFullscreen()
                }}
              >
                <Play className="h-4 w-4" />
                Play game
              </Button>

              {fullscreenError && (
                <p className="text-sm text-danger-text">{fullscreenError}</p>
              )}
            </div>
          </div>
        )}

        {orientationMismatch && requiredOrientation && (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/80 p-4">
            <div className="max-w-sm text-center space-y-3">
              <p className="font-arcade text-xs text-text-secondary">ROTATE DEVICE</p>
              <h3 className="font-arcade text-sm sm:text-base text-white">
                {getMobileOrientationPrompt(requiredOrientation)}
              </h3>
              <p className="font-arcade text-xs sm:text-xs text-text-secondary">
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
