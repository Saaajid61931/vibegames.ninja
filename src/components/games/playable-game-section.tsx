"use client"

import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { AlertCircle, Camera, CheckCircle2, Loader2 } from "lucide-react"
import { GamePlayer, type GamePlayerHandle } from "@/components/games/game-player"
import { Button } from "@/components/ui/button"
import type { MobileOrientation } from "@/lib/mobile-orientation"

type CaptureState = "idle" | "capturing" | "saving" | "success" | "error"
type ResponsiveSlideUpload = {
  original: string
  variants: Array<{
    width: number
    image: string
  }>
}

const RESPONSIVE_SLIDE_WIDTHS = [320, 640]

async function loadImageElement(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new window.Image()
    image.onload = () => resolve(image)
    image.onerror = () => reject(new Error("Could not prepare thumbnail image."))
    image.src = src
  })
}

async function buildResponsiveSlidePayload(imageDataUrl: string): Promise<ResponsiveSlideUpload> {
  const image = await loadImageElement(imageDataUrl)
  const variants: ResponsiveSlideUpload["variants"] = []

  for (const targetWidth of RESPONSIVE_SLIDE_WIDTHS) {
    if (!image.naturalWidth || image.naturalWidth <= targetWidth) {
      continue
    }

    const scale = targetWidth / image.naturalWidth
    const canvas = document.createElement("canvas")
    canvas.width = targetWidth
    canvas.height = Math.max(1, Math.round(image.naturalHeight * scale))

    const context = canvas.getContext("2d")
    if (!context) {
      continue
    }

    context.imageSmoothingEnabled = true
    context.imageSmoothingQuality = "high"
    context.drawImage(image, 0, 0, canvas.width, canvas.height)

    const webpDataUrl = canvas.toDataURL("image/webp", 0.64)
    variants.push({
      width: targetWidth,
      image: webpDataUrl.startsWith("data:image/webp")
        ? webpDataUrl
        : canvas.toDataURL("image/jpeg", 0.64),
    })
  }

  return {
    original: imageDataUrl,
    variants,
  }
}

interface PlayableGameSectionProps {
  gameId: string
  title: string
  gameUrl: string
  runtimeLabel: string
  supportsMobile?: boolean
  mobileOrientation?: MobileOrientation
  levelData?: unknown
  levelName?: string
  levelDescription?: string | null
  canAutoCaptureThumbnails?: boolean
}

export function PlayableGameSection({
  gameId,
  title,
  gameUrl,
  runtimeLabel,
  supportsMobile = false,
  mobileOrientation = "BOTH",
  levelData,
  levelName,
  levelDescription,
  canAutoCaptureThumbnails = false,
}: PlayableGameSectionProps) {
  const router = useRouter()
  const playerRef = useRef<GamePlayerHandle>(null)
  const [captureState, setCaptureState] = useState<CaptureState>("idle")
  const [capturedCount, setCapturedCount] = useState(0)
  const [isMobileLikeDevice, setIsMobileLikeDevice] = useState(false)
  const [captureMessage, setCaptureMessage] = useState(
    "Click auto thumbnails, allow the browser prompt, choose this tab, then play naturally while we capture 5 shots over 25 seconds."
  )

  useEffect(() => {
    const media = window.matchMedia("(pointer: coarse)")
    const update = () => {
      setIsMobileLikeDevice(media.matches || navigator.maxTouchPoints > 0)
    }

    update()
    media.addEventListener("change", update)

    return () => {
      media.removeEventListener("change", update)
    }
  }, [])

  const startAutoCapture = async () => {
    if (isMobileLikeDevice) {
      setCaptureState("error")
      setCaptureMessage("Auto thumbnails are not supported on mobile. Please open this page on desktop to capture thumbnail slides.")
      return
    }

    setCapturedCount(0)
    setCaptureState("capturing")
    setCaptureMessage("Your browser will ask for screen-share permission. Click Allow and pick this tab, then keep playing.")

    try {
      await playerRef.current?.startAutoThumbnailCapture()
    } catch (error) {
      setCaptureState("error")
      setCaptureMessage(error instanceof Error ? error.message : "Auto thumbnail capture failed")
    }
  }

  const saveCapturedSlides = async (images: string[]) => {
    setCaptureState("saving")
    setCaptureMessage("Uploading your captured slideshow...")

    try {
      const payloadImages = await Promise.all(images.map((image) => buildResponsiveSlidePayload(image)))

      const res = await fetch(`/api/games/${gameId}/thumbnail-slides`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ images: payloadImages }),
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || "Failed to save thumbnail slideshow")
      }

      setCaptureState("success")
      setCaptureMessage("Thumbnail slideshow updated. Your game cards now rotate through the captured screenshots.")
      router.refresh()
    } catch (error) {
      setCaptureState("error")
      setCaptureMessage(
        error instanceof Error ? error.message : "Failed to save thumbnail slideshow"
      )
    }
  }

  return (
    <div className="space-y-4">
      {canAutoCaptureThumbnails && (
        <div className="border-2 border-[#4a4a6a] bg-[#1a1a2e] p-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Camera className="h-4 w-4 text-[#ffff00]" />
                <span className="font-arcade text-xs text-[#ffff00]">AUTO THUMBNAIL CAPTURE</span>
              </div>
              <p className="font-arcade text-xs text-[#8b93a6]">
                {captureMessage}
              </p>
              {captureState === "capturing" && (
                <p className="font-arcade text-[11px] text-white">
                  Captured {capturedCount}/5 screenshots
                </p>
              )}
            </div>

            <Button
              type="button"
              variant={captureState === "success" ? "arcade-outline" : "arcade"}
              className="gap-2 sm:self-start"
              disabled={captureState === "capturing" || captureState === "saving"}
              onClick={() => {
                void startAutoCapture()
              }}
            >
              {captureState === "capturing" || captureState === "saving" ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : captureState === "success" ? (
                <CheckCircle2 className="h-4 w-4" />
              ) : captureState === "error" ? (
                <AlertCircle className="h-4 w-4" />
              ) : (
                <Camera className="h-4 w-4" />
              )}
              {captureState === "capturing"
                ? `CAPTURING ${capturedCount}/5`
                : captureState === "saving"
                  ? "SAVING SLIDES"
                  : captureState === "success"
                    ? "RECAPTURE SLIDES"
                    : "AUTO THUMBNAILS"}
            </Button>
          </div>
        </div>
      )}

      <GamePlayer
        ref={playerRef}
        title={title}
        gameUrl={gameUrl}
        runtimeLabel={runtimeLabel}
        supportsMobile={supportsMobile}
        mobileOrientation={mobileOrientation}
        levelData={levelData}
        levelName={levelName}
        levelDescription={levelDescription}
        onAutoThumbnailCaptureProgress={({ captured }) => {
          setCaptureState("capturing")
          setCapturedCount(captured)
        }}
        onAutoThumbnailCaptureComplete={(images) => {
          void saveCapturedSlides(images)
        }}
        onAutoThumbnailCaptureError={(message) => {
          setCaptureState("error")
          setCaptureMessage(message)
        }}
      />
    </div>
  )
}
