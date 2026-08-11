"use client"

import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { AlertCircle, Camera, CheckCircle2, Ghost, Loader2, TimerReset } from "lucide-react"
import { GamePlayer, type GamePlayerHandle } from "@/components/games/game-player"
import { Button } from "@/components/ui/button"
import {
  formatDurationMs,
  getGhostPlayerLabel,
  type GhostLeaderboardEntry,
} from "@/lib/ghosts"
import type { MobileOrientation } from "@/lib/mobile-orientation"

type CaptureState = "idle" | "capturing" | "saving" | "success" | "error"

type ResponsiveSlideUpload = {
  original: string
  variants: Array<{
    width: number
    image: string
  }>
}

type GhostPersonalBest = {
  id: string
  durationMs: number
  createdAt: string
  replayVersion: string | null
  checksum: string | null
} | null

type GhostBoardState = {
  scope: {
    type: "game" | "level"
    levelId: string | null
    levelName: string | null
  }
  leaderboard: GhostLeaderboardEntry[]
  personalBest: GhostPersonalBest
}

type LoadedGhost = {
  runId: string
  levelId?: string | null
  durationMs: number
  replayData: unknown
  replayVersion?: string | null
  checksum?: string | null
  playerName?: string | null
} | null

type GhostRuntimeStatus = {
  ready: boolean
  loadHookBound: boolean
  loadReceived: boolean
}

const INITIAL_GHOST_RUNTIME_STATUS: GhostRuntimeStatus = {
  ready: false,
  loadHookBound: false,
  loadReceived: false,
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

async function fetchGhostBoard(gameId: string, levelId?: string | null): Promise<GhostBoardState> {
  const params = new URLSearchParams()
  if (levelId) {
    params.set("levelId", levelId)
  }

  const res = await fetch(`/api/games/${gameId}/ghosts?${params.toString()}`, {
    cache: "no-store",
  })
  const data = await res.json()

  if (!res.ok) {
    throw new Error(data.error || "Failed to load ghost leaderboard")
  }

  return data as GhostBoardState
}

function GhostBoard({
  title,
  subtitle,
  board,
  loading,
  activeRunId,
  allowRace,
  onRace,
}: {
  title: string
  subtitle: string
  board: GhostBoardState | null
  loading: boolean
  activeRunId: string | null
  allowRace: boolean
  onRace: (runId: string) => void
}) {
  return (
    <div className="rounded border border-border-strong bg-canvas p-3">
      <div className="mb-3">
        <p className="font-arcade text-xs text-arcade-yellow">{title}</p>
        <p className="mt-1 font-arcade text-xs text-text-secondary">{subtitle}</p>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 font-arcade text-xs text-text-secondary">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading leaderboard...
        </div>
      ) : board && board.leaderboard.length > 0 ? (
        <div className="space-y-2">
          {board.leaderboard.map((entry) => (
            <div
              key={entry.runId}
              className="flex flex-col gap-2 rounded border border-border bg-surface p-3 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0">
                <p className="font-arcade text-xs text-white">
                  #{entry.rank} {getGhostPlayerLabel(entry.player)}
                </p>
                <p className="mt-1 font-arcade text-xs text-arcade-cyan">
                  {formatDurationMs(entry.durationMs)}
                </p>
                <p className="mt-1 font-arcade text-xs text-text-secondary">
                  {new Date(entry.createdAt).toLocaleDateString()}
                </p>
              </div>

              {allowRace ? (
                <Button
                  type="button"
                  variant="arcade-outline"
                  size="sm"
                  className="gap-2 self-start sm:self-center"
                  disabled={activeRunId === entry.runId}
                  onClick={() => onRace(entry.runId)}
                >
                  {activeRunId === entry.runId ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Ghost className="h-4 w-4" />
                  )}
                  {activeRunId === entry.runId ? "LOADING" : "RACE GHOST"}
                </Button>
              ) : (
                <p className="font-arcade text-xs text-text-secondary">
                  Open the base game to race this ghost.
                </p>
              )}
            </div>
          ))}
        </div>
      ) : (
        <p className="font-arcade text-xs text-text-secondary">
          No ghosts yet. Set the first time and give the next player someone to chase.
        </p>
      )}
    </div>
  )
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
  selectedLevelId?: string | null
  hasGhostSharing?: boolean
  isAuthenticated?: boolean
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
  selectedLevelId = null,
  hasGhostSharing = false,
  isAuthenticated = false,
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
  const [ghostRuntimeStatus, setGhostRuntimeStatus] = useState<GhostRuntimeStatus>(INITIAL_GHOST_RUNTIME_STATUS)
  const [ghostError, setGhostError] = useState("")
  const [ghostMessage, setGhostMessage] = useState("")
  const [ghostLoading, setGhostLoading] = useState(false)
  const [ghostSaving, setGhostSaving] = useState(false)
  const [loadingRunId, setLoadingRunId] = useState<string | null>(null)
  const [gameGhostBoard, setGameGhostBoard] = useState<GhostBoardState | null>(null)
  const [levelGhostBoard, setLevelGhostBoard] = useState<GhostBoardState | null>(null)
  const [selectedGhost, setSelectedGhost] = useState<LoadedGhost>(null)

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

  useEffect(() => {
    if (!hasGhostSharing) {
      setGameGhostBoard(null)
      setLevelGhostBoard(null)
      setSelectedGhost(null)
      setGhostRuntimeStatus(INITIAL_GHOST_RUNTIME_STATUS)
      return
    }

    let cancelled = false

    const loadGhostBoards = async () => {
      setGhostLoading(true)
      setGhostError("")

      try {
        const [gameBoard, levelBoard] = await Promise.all([
          fetchGhostBoard(gameId),
          selectedLevelId ? fetchGhostBoard(gameId, selectedLevelId) : Promise.resolve(null),
        ])

        if (cancelled) {
          return
        }

        setGameGhostBoard(gameBoard)
        setLevelGhostBoard(levelBoard)
      } catch (error) {
        if (!cancelled) {
          setGhostError(error instanceof Error ? error.message : "Failed to load ghost leaderboard")
        }
      } finally {
        if (!cancelled) {
          setGhostLoading(false)
        }
      }
    }

    void loadGhostBoards()

    return () => {
      cancelled = true
    }
  }, [gameId, hasGhostSharing, selectedLevelId])

  useEffect(() => {
    setSelectedGhost(null)
    setGhostRuntimeStatus((current) => ({
      ...current,
      loadReceived: false,
    }))
  }, [selectedLevelId])

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

  const loadGhostRun = async (runId: string) => {
    setLoadingRunId(runId)
    setGhostError("")
    setGhostMessage("")

    try {
      const res = await fetch(`/api/ghosts/${runId}`, { cache: "no-store" })
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || "Failed to load ghost run")
      }

      setSelectedGhost({
        runId: data.ghost.id,
        levelId: data.ghost.level?.id || null,
        durationMs: data.ghost.durationMs,
        replayData: data.ghost.replayData,
        replayVersion: data.ghost.replayVersion,
        checksum: data.ghost.checksum,
        playerName: data.ghost.player?.username || data.ghost.player?.name || "anonymous",
      })
      setGhostMessage(`Loaded ${data.ghost.player?.username || data.ghost.player?.name || "anonymous"}'s ghost.`)
      setGhostRuntimeStatus((current) => ({
        ...current,
        loadReceived: false,
      }))
    } catch (error) {
      setGhostError(error instanceof Error ? error.message : "Failed to load ghost run")
    } finally {
      setLoadingRunId(null)
    }
  }

  const saveGhostRun = async (payload: {
    durationMs?: number
    replayData?: unknown
    replayVersion?: string | null
    checksum?: string | null
  }) => {
    if (!hasGhostSharing) {
      return
    }

    if (typeof payload.durationMs !== "number" || payload.durationMs <= 0) {
      setGhostError("Ghost run ignored because the game did not send a valid finish time.")
      return
    }

    if (typeof payload.replayData === "undefined") {
      setGhostError("Ghost run ignored because the game did not send replay data.")
      return
    }

    setGhostSaving(true)
    setGhostError("")
    setGhostMessage("")

    try {
      const res = await fetch(`/api/games/${gameId}/ghosts`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          levelId: selectedLevelId || undefined,
          durationMs: payload.durationMs,
          replayData: payload.replayData,
          replayVersion: payload.replayVersion || undefined,
          checksum: payload.checksum || undefined,
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || (res.status === 401 ? "Sign in to save ghost runs." : "Failed to save ghost run"))
      }

      if (selectedLevelId) {
        setLevelGhostBoard({
          scope: data.scope,
          leaderboard: data.leaderboard,
          personalBest: data.personalBest,
        })
      } else {
        setGameGhostBoard({
          scope: data.scope,
          leaderboard: data.leaderboard,
          personalBest: data.personalBest,
        })
      }

      setGhostMessage(`Ghost saved: ${formatDurationMs(payload.durationMs)} is now on the board.`)
    } catch (error) {
      setGhostError(error instanceof Error ? error.message : "Failed to save ghost run")
    } finally {
      setGhostSaving(false)
    }
  }

  const renderPersonalBest = (label: string, personalBest: GhostPersonalBest) => {
    return (
      <div className="rounded border border-border bg-surface p-3">
        <p className="font-arcade text-xs text-text-secondary">{label}</p>
        <p className="mt-2 font-arcade text-sm text-white">
          {personalBest ? formatDurationMs(personalBest.durationMs) : "--"}
        </p>
        <p className="mt-1 font-arcade text-xs text-text-secondary">
          {personalBest ? `Set ${new Date(personalBest.createdAt).toLocaleDateString()}` : "Finish a run to lock one in."}
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      {canAutoCaptureThumbnails && (
        <div className="order-2 border-2 border-border-strong bg-surface-2 p-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Camera className="h-4 w-4 text-arcade-yellow" />
                <span className="font-arcade text-xs text-arcade-yellow">AUTO THUMBNAIL CAPTURE</span>
              </div>
              <p className="font-arcade text-xs text-text-secondary">
                {captureMessage}
              </p>
              {captureState === "capturing" && (
                <p className="font-arcade text-xs text-white">
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

      {hasGhostSharing && (
        <div className="order-3 border-2 border-border-strong bg-surface p-4 sm:p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Ghost className="h-4 w-4 text-arcade-cyan" />
                <span className="font-arcade text-xs text-arcade-cyan">GHOST RACES + LEADERBOARDS</span>
              </div>
              <p className="font-arcade text-xs text-text-secondary">
                {selectedLevelId
                  ? `You are on ${levelName || "a community level"}. Race the best runs for this level or switch back to the whole-game board.`
                  : "Finish a run and the game can submit a replay ghost. Pick any ghost below to race it live inside the game."}
              </p>
              {!isAuthenticated && (
                <p className="font-arcade text-xs text-warning-text">
                  Sign in to save your own ghost runs. Public ghosts can still be loaded and raced.
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
              <div className={`rounded border px-3 py-2 font-arcade text-xs ${ghostRuntimeStatus.ready ? "border-success bg-success/10 text-success" : "border-border-strong bg-canvas text-text-secondary"}`}>
                SDK ready
              </div>
              <div className={`rounded border px-3 py-2 font-arcade text-xs ${ghostRuntimeStatus.loadHookBound ? "border-success bg-success/10 text-success" : "border-border-strong bg-canvas text-text-secondary"}`}>
                Load hook
              </div>
              <div className={`rounded border px-3 py-2 font-arcade text-xs ${ghostRuntimeStatus.loadReceived ? "border-success bg-success/10 text-success" : "border-border-strong bg-canvas text-text-secondary"}`}>
                Ghost injected
              </div>
            </div>
          </div>

          {(ghostError || ghostMessage || ghostSaving || selectedGhost) && (
            <div className="mt-4 space-y-3">
              {ghostError && (
                <div className="rounded border border-arcade-red bg-arcade-red/10 p-3 font-arcade text-xs text-danger-text">
                  {ghostError}
                </div>
              )}

              {ghostMessage && (
                <div className="rounded border border-arcade-cyan bg-arcade-cyan/10 p-3 font-arcade text-xs text-info-text">
                  {ghostMessage}
                </div>
              )}

              {ghostSaving && (
                <div className="flex items-center gap-2 rounded border border-border-strong bg-canvas p-3 font-arcade text-xs text-text-secondary">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Saving your latest run to the leaderboard...
                </div>
              )}

              {selectedGhost && (
                <div className="flex flex-col gap-3 rounded border border-border bg-canvas p-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="font-arcade text-xs text-arcade-yellow">ACTIVE GHOST</p>
                    <p className="mt-1 font-arcade text-xs text-white">
                      {selectedGhost.playerName || "anonymous"} • {formatDurationMs(selectedGhost.durationMs)}
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="gap-2 font-arcade"
                    onClick={() => setSelectedGhost(null)}
                  >
                    <TimerReset className="h-4 w-4" />
                    CLEAR GHOST
                  </Button>
                </div>
              )}
            </div>
          )}

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {renderPersonalBest("Your best whole-game run", gameGhostBoard?.personalBest || null)}
            {selectedLevelId
              ? renderPersonalBest(`Your best on ${levelName || "this level"}`, levelGhostBoard?.personalBest || null)
              : (
                <div className="rounded border border-border bg-surface p-3">
                  <p className="font-arcade text-xs text-text-secondary">Current race scope</p>
                  <p className="mt-2 font-arcade text-sm text-white">Whole game board</p>
                  <p className="mt-1 font-arcade text-xs text-text-secondary">Ghosts saved here apply when no community level is active.</p>
                </div>
              )}
          </div>

          <div className={`mt-4 grid gap-3 ${selectedLevelId ? "lg:grid-cols-2" : "grid-cols-1"}`}>
            {selectedLevelId && (
              <GhostBoard
                title="LEVEL BOARD"
                subtitle={`Fastest verified ghosts for ${levelName || "this level"}.`}
                board={levelGhostBoard}
                loading={ghostLoading}
                activeRunId={loadingRunId}
                allowRace={true}
                onRace={(runId) => {
                  void loadGhostRun(runId)
                }}
              />
            )}

            <GhostBoard
              title={selectedLevelId ? "WHOLE GAME BOARD" : "LEADERBOARD"}
              subtitle={selectedLevelId ? "Base-game ghosts for the main route." : "Fastest verified runs for the core game."}
              board={gameGhostBoard}
              loading={ghostLoading}
              activeRunId={loadingRunId}
              allowRace={!selectedLevelId}
              onRace={(runId) => {
                void loadGhostRun(runId)
              }}
            />
          </div>
        </div>
      )}

      <div className="order-1">
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
          ghostToLoad={selectedGhost}
          onSaveGhostRun={(payload) => {
            void saveGhostRun(payload)
          }}
          onGhostDiagnostic={(event) => {
            if (event.type === "VG_GHOST_READY") {
              setGhostRuntimeStatus((current) => ({ ...current, ready: true }))
              return
            }

            if (event.type === "VG_GHOST_HOOK_BOUND" && event.payload?.hook === "onLoadGhost") {
              setGhostRuntimeStatus((current) => ({ ...current, loadHookBound: true }))
              return
            }

            if (event.type === "VG_GHOST_LOAD_RECEIVED") {
              const handlerCount = typeof event.payload?.handlerCount === "number" ? event.payload.handlerCount : 0
              setGhostRuntimeStatus((current) => ({
                ...current,
                loadHookBound: current.loadHookBound || handlerCount > 0,
                loadReceived: true,
              }))
            }
          }}
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
    </div>
  )
}
