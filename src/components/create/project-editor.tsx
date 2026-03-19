"use client"

import Image from "next/image"
import { ImagePlus, Loader2, Rocket, Wand2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import type { BuilderBusyState, BuilderClientQuickAction } from "@/lib/builder/types"

interface ProjectEditorProps {
  quickActions: BuilderClientQuickAction[]
  prompt: string
  onPromptChange: (value: string) => void
  busy: BuilderBusyState
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
    <div className="space-y-4">
      {/* Quick actions */}
      <div className="grid gap-2">
        {quickActions.map((action) => (
          <Button
            key={action.key}
            variant="outline"
            className="justify-start h-auto whitespace-normal py-3"
            disabled={isBusy}
            onClick={() => onApplyPrompt(action.key)}
          >
            <Wand2 className="mr-2 h-4 w-4 shrink-0" />
            {action.label}
          </Button>
        ))}
      </div>

      {/* Prompt textarea (fix #2: Ctrl+Enter to submit) */}
      <Textarea
        value={prompt}
        onChange={(e) => onPromptChange(e.target.value)}
        onKeyDown={(e) => {
          if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
            e.preventDefault()
            onApplyPrompt()
          }
        }}
        className="min-h-[150px]"
        placeholder="Example: make this feel cozy and easier, add a candy theme, and optimize it for portrait mobile."
      />

      <Button
        className="w-full"
        disabled={isBusy || prompt.trim().length < 2}
        onClick={() => onApplyPrompt()}
      >
        {isPrompting ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <Rocket className="mr-2 h-4 w-4" />
        )}
        Apply Prompt
        <span className="ml-auto text-xs opacity-60 hidden sm:inline">Ctrl+Enter</span>
      </Button>

      {/* Captured thumbnail */}
      {capturedThumbnail ? (
        <Image
          src={capturedThumbnail}
          alt="Captured builder thumbnail"
          width={1200}
          height={675}
          className="rounded-xl border border-[var(--color-border)]"
        />
      ) : null}

      {captureStatus ? (
        <p className="text-xs text-[var(--color-text-secondary)]">{captureStatus}</p>
      ) : null}

      {/* Capture + Publish */}
      <div className="grid gap-2 sm:grid-cols-2">
        <Button variant="outline" disabled={isBusy} onClick={onCapture}>
          <ImagePlus className="mr-2 h-4 w-4" />
          Capture
        </Button>
        <Button disabled={isBusy || isPublishing} onClick={onPublish}>
          {isPublishing ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Rocket className="mr-2 h-4 w-4" />
          )}
          Publish
        </Button>
      </div>
    </div>
  )
}
