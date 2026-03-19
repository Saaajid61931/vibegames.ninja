"use client"

import { Maximize2, RotateCcw } from "lucide-react"
import { GamePlayer, type GamePlayerHandle } from "@/components/games/game-player"
import { Button } from "@/components/ui/button"
import type { MobileOrientation } from "@/lib/mobile-orientation"

interface ProjectPreviewProps {
  projectId: string
  revisionId: string | undefined
  previewNonce: number
  title: string
  gameUrl: string
  runtimeLabel: string
  supportsMobile: boolean
  mobileOrientation: MobileOrientation
  revisionSummary: string | undefined
  playerRef: React.RefObject<GamePlayerHandle | null>
  onRestart: () => void
  onFullscreen: () => void
  onCaptureProgress: (data: { captured: number; total: number }) => void
  onCaptureComplete: (images: string[]) => void
  onCaptureError: (message: string) => void
}

export function ProjectPreview({
  projectId,
  revisionId,
  previewNonce,
  title,
  gameUrl,
  runtimeLabel,
  supportsMobile,
  mobileOrientation,
  revisionSummary,
  playerRef,
  onRestart,
  onFullscreen,
  onCaptureProgress,
  onCaptureComplete,
  onCaptureError,
}: ProjectPreviewProps) {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-[var(--color-text-secondary)]">
            Playable Preview
          </p>
          {revisionSummary ? (
            <p className="text-sm text-[var(--color-text-secondary)]">{revisionSummary}</p>
          ) : null}
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={onRestart}>
            <RotateCcw className="mr-2 h-4 w-4" />
            Restart
          </Button>
          <Button variant="outline" onClick={onFullscreen}>
            <Maximize2 className="mr-2 h-4 w-4" />
            Fullscreen
          </Button>
        </div>
      </div>

      <GamePlayer
        key={`${projectId}-${revisionId}-${previewNonce}`}
        ref={playerRef}
        title={title}
        gameUrl={gameUrl}
        runtimeLabel={runtimeLabel}
        supportsMobile={supportsMobile}
        mobileOrientation={mobileOrientation}
        onAutoThumbnailCaptureProgress={onCaptureProgress}
        onAutoThumbnailCaptureComplete={onCaptureComplete}
        onAutoThumbnailCaptureError={onCaptureError}
      />
    </div>
  )
}
