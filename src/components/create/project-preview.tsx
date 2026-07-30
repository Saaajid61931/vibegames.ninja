"use client"

import { Maximize2, RotateCcw, Monitor } from "lucide-react"
import { GamePlayer, type GamePlayerHandle } from "@/components/games/game-player"
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
    <div className="flex h-full flex-col border-l-2 border-[#4a4a6a]">
      {/* Top controls bar */}
      <div className="flex items-center justify-between border-b-2 border-[#4a4a6a] bg-[#0b1120] px-4 py-2">
        <div className="flex items-center gap-2">
          <Monitor className="h-4 w-4 text-[#ffff00]" />
          <span className="font-pixel text-[10px] text-[#ffff00] drop-shadow-[1px_1px_0_#ff0040]">LIVE PREVIEW</span>
          {revisionSummary && (
            <span className="ml-2 max-w-[200px] truncate font-pixel text-[8px] text-[#6b7fa3]">
              {revisionSummary.toUpperCase()}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onRestart}
            className="flex cursor-pointer items-center gap-2 border-2 border-[#4a4a6a] bg-[#1a1a2e] px-2.5 py-1.5 font-pixel text-[9px] text-[#8fa5d1] transition-all hover:border-[#0080ff] hover:text-white"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            RESTART
          </button>
          <button
            type="button"
            onClick={onFullscreen}
            className="flex cursor-pointer items-center gap-2 border-2 border-[#4a4a6a] bg-[#1a1a2e] px-2.5 py-1.5 font-pixel text-[9px] text-[#8fa5d1] transition-all hover:border-[#ffff00] hover:text-white"
          >
            <Maximize2 className="h-3.5 w-3.5" />
            FULL
          </button>
        </div>
      </div>

      {/* Game preview */}
      <div className="relative flex-1 bg-black overflow-hidden">
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

    </div>
  )
}
