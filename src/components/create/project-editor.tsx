"use client"

import Image from "next/image"
import { ImagePlus, Loader2, Rocket, Send, Wand2 } from "lucide-react"
import type { BuilderBusyState, BuilderClientQuickAction } from "@/lib/builder/types"

interface ProjectEditorProps {
  projectTitle: string
  templateLabel: string
  quickActions: BuilderClientQuickAction[]
  prompt: string
  onPromptChange: (value: string) => void
  busy: BuilderBusyState
  openRouterConfigured: boolean
  openRouterTestState: {
    status: "idle" | "testing" | "success" | "error"
    message: string
    model: string
  }
  captureStatus: string
  capturedThumbnail: string | null
  onApplyPrompt: (actionKey?: string) => void
  onCapture: () => void
  onPublish: () => void
}

export function ProjectEditor({
  quickActions,
  prompt,
  onPromptChange,
  busy,
  openRouterConfigured,
  captureStatus,
  capturedThumbnail,
  onApplyPrompt,
  onCapture,
  onPublish,
}: ProjectEditorProps) {
  const isBusy = busy !== null
  const isPrompting = busy?.type === "prompting"
  const isPublishing = busy?.type === "publishing"

  return (
    <div className="border-t-2 border-[#4a4a6a] bg-[#0d1420]">
      {/* Quick actions row */}
      <div className="flex items-center gap-2 overflow-x-auto border-b-2 border-[#4a4a6a] px-4 py-2 bg-[#0b1120]">
        {quickActions.map((action) => {
          const isActionBusy = busy?.type === "prompting-action" && busy.actionKey === action.key
          return (
            <button
              key={action.key}
              type="button"
              className="flex shrink-0 cursor-pointer items-center gap-2 border-2 border-[#4a4a6a] bg-[#1a1a2e] px-3 py-1.5 font-pixel text-[9px] text-[#8fa5d1] transition-all hover:border-[#0080ff] hover:text-white disabled:opacity-40 shadow-[2px_2px_0_#000]"
              disabled={isBusy}
              onClick={() => onApplyPrompt(action.key)}
              title={action.description}
            >
              {isActionBusy ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <Wand2 className="h-3 w-3 text-[#ffff00]" />
              )}
              {action.label.toUpperCase()}
            </button>
          )
        })}

        <div className="ml-auto flex shrink-0 items-center gap-2">
          <button
            type="button"
            className="flex cursor-pointer items-center gap-2 border-2 border-[#4a4a6a] bg-[#1a1a2e] px-3 py-1.5 font-pixel text-[9px] text-[#8fa5d1] transition-all hover:border-[#ffff00] hover:text-white disabled:opacity-40"
            disabled={isBusy}
            onClick={onCapture}
          >
            <ImagePlus className="h-3 w-3" />
            CAPTURE
          </button>
          <button
            type="button"
            className="btn-arcade flex cursor-pointer items-center gap-2 px-3 py-1.5 text-[9px] disabled:opacity-40 border-2"
            disabled={isBusy || isPublishing}
            onClick={onPublish}
          >
            {isPublishing ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <Rocket className="h-3 w-3" />
            )}
            PUBLISH
          </button>
        </div>
      </div>

      {/* Captured thumbnail */}
      {capturedThumbnail && (
        <div className="border-b-2 border-[#4a4a6a] px-4 py-2 bg-[#1a1a2e]/50">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <ImagePlus className="h-3 w-3 text-[#ffff00]" />
              <span className="font-pixel text-[9px] text-[#8fa5d1]">IMAGE CAPTURED</span>
            </div>
            <Image
              src={capturedThumbnail}
              alt="Captured thumbnail"
              width={80}
              height={45}
              className="border-2 border-[#4a4a6a] shadow-[2px_2px_0_#000]"
            />
          </div>
        </div>
      )}

      {captureStatus && !capturedThumbnail && (
        <div className="border-b-2 border-[#4a4a6a] px-4 py-1.5 bg-[#1a1a2e]/30">
          <p className="font-pixel text-[9px] text-[#6b7fa3] uppercase tracking-wider">{captureStatus}</p>
        </div>
      )}

      {/* Text input */}
      <div className="relative flex items-end gap-3 p-4">
        <textarea
          value={prompt}
          onChange={(e) => onPromptChange(e.target.value)}
          onKeyDown={(e) => {
            if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
              e.preventDefault()
              onApplyPrompt()
            }
          }}
          rows={2}
          className="flex-1 resize-none border-2 border-[#4a4a6a] bg-[#1a1a2e] px-4 py-3 text-sm text-white placeholder:text-[#4a5c7e] focus:border-[#0080ff] focus:outline-none shadow-[inset_2px_2px_4px_rgba(0,0,0,0.5)]"
          placeholder="DESCRIBE REVISIONS..."
        />
        <button
          type="button"
          className="btn-arcade flex h-[52px] w-[52px] shrink-0 cursor-pointer items-center justify-center border-2 disabled:opacity-40"
          disabled={isBusy || prompt.trim().length < 2}
          onClick={() => onApplyPrompt()}
          title={openRouterConfigured ? "SEND TO ARCADE CPU" : "PROCESS LOCALLY"}
        >
          {isPrompting ? <Loader2 className="h-6 w-6 animate-spin" /> : <Send className="h-6 w-6" />}
        </button>
      </div>
    </div>

  )
}
