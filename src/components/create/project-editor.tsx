"use client"

import Image from "next/image"
import { Bot, ImagePlus, Loader2, Rocket, Sparkles, Wand2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
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
  projectTitle,
  templateLabel,
  quickActions,
  prompt,
  onPromptChange,
  busy,
  openRouterConfigured,
  openRouterTestState,
  captureStatus,
  capturedThumbnail,
  onApplyPrompt,
  onCapture,
  onPublish,
}: ProjectEditorProps) {
  const isBusy = busy !== null
  const isPrompting = busy?.type === "prompting"
  const isPublishing = busy?.type === "publishing"
  const providerLabel = openRouterConfigured ? "OpenRouter" : "Local Builder"
  const providerHint =
    openRouterTestState.status === "success"
      ? openRouterTestState.message
      : openRouterTestState.status === "error"
        ? openRouterTestState.message
        : openRouterConfigured
          ? "Your key is added. Testing the model first is a good way to catch provider issues before generating."
          : "Add an OpenRouter key in the sidebar if you want external AI generation instead of the local fallback."

  return (
    <Card variant="arcade">
      <CardHeader variant="arcade" className="space-y-4">
        <div className="flex flex-wrap items-center gap-2 text-[10px] font-arcade text-[#8ec5ff]">
          <Sparkles className="h-4 w-4 text-[#00e5ff]" />
          AI GENERATION CONSOLE
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full border border-[#00e5ff]/30 bg-[#00e5ff]/10 px-3 py-1 text-[11px] font-medium text-[#d9fbff]">
            {templateLabel}
          </span>
          <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-medium text-[#d7e2ff]">
            {providerLabel}
          </span>
          <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-medium text-[#d7e2ff]">
            {projectTitle}
          </span>
        </div>
        <div>
          <CardTitle className="font-arcade text-xl text-white">
            Describe the game change you want next
          </CardTitle>
          <CardDescription className="mt-2 text-[#b8c4e3]">
            Ask for a new theme, change the feel, make it more readable on mobile, or tune the
            whole loop in one shot.
          </CardDescription>
        </div>
        <div className="rounded-2xl border border-white/10 bg-[#0f1728] px-4 py-3 text-sm text-[#c7d6f6]">
          <div className="flex items-start gap-3">
            <Bot className="mt-0.5 h-4 w-4 shrink-0 text-[#00e5ff]" />
            <p className="leading-6">{providerHint}</p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-5">
        <div className="grid gap-3 md:grid-cols-2">
          {quickActions.map((action) => (
            <button
              key={action.key}
              type="button"
              className="flex cursor-pointer items-start gap-3 rounded-2xl border border-white/10 bg-[#0f1728] px-4 py-4 text-left transition hover:border-[#00e5ff]/60 hover:bg-[#13203a] disabled:cursor-not-allowed disabled:opacity-50"
              disabled={isBusy}
              onClick={() => onApplyPrompt(action.key)}
            >
              <Wand2 className="mt-0.5 h-4 w-4 shrink-0 text-[#00e5ff]" />
              <div>
                <p className="text-sm font-semibold text-white">{action.label}</p>
                <p className="mt-1 text-xs leading-5 text-[#9eb0d6]">{action.description}</p>
              </div>
            </button>
          ))}
        </div>

        <div className="rounded-[24px] border border-[#25304a] bg-[#0b1120] p-3 sm:p-4">
          <Textarea
            value={prompt}
            onChange={(e) => onPromptChange(e.target.value)}
            onKeyDown={(e) => {
              if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
                e.preventDefault()
                onApplyPrompt()
              }
            }}
            className="min-h-[190px] border-none bg-transparent px-1 text-base leading-7 text-white focus:ring-0"
            placeholder="Example: turn this into a neon cyber runner with slower early pacing, stronger combo feedback, one-thumb portrait controls, and a juicier game-over screen."
          />
          <div className="mt-3 flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-3">
            <p className="text-xs text-[#8fa5d1]">
              Strong prompts mention the theme, difficulty, controls, and what should feel
              different after the update.
            </p>
            <span className="text-xs text-[#8fa5d1]">Ctrl+Enter to generate</span>
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          <Button
            className="min-w-[220px]"
            size="lg"
            disabled={isBusy || prompt.trim().length < 2}
            onClick={() => onApplyPrompt()}
          >
            {isPrompting ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Rocket className="mr-2 h-4 w-4" />
            )}
            {openRouterConfigured ? "Generate With OpenRouter" : "Generate Draft Update"}
          </Button>
          <Button variant="outline" disabled={isBusy} onClick={onCapture}>
            <ImagePlus className="mr-2 h-4 w-4" />
            Capture Thumbnail
          </Button>
          <Button disabled={isBusy || isPublishing} onClick={onPublish}>
            {isPublishing ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Rocket className="mr-2 h-4 w-4" />
            )}
            Publish Current Revision
          </Button>
        </div>

        {capturedThumbnail ? (
          <div className="rounded-[24px] border border-[var(--color-border)] bg-[var(--color-surface)] p-3">
            <div className="mb-3 flex items-center gap-2 text-sm font-medium text-[var(--color-text)]">
              <ImagePlus className="h-4 w-4 text-[var(--color-primary)]" />
              Latest captured thumbnail
            </div>
            <Image
              src={capturedThumbnail}
              alt="Captured builder thumbnail"
              width={1200}
              height={675}
              className="rounded-xl border border-[var(--color-border)]"
            />
          </div>
        ) : null}

        {captureStatus ? (
          <p className="text-xs text-[var(--color-text-secondary)]">{captureStatus}</p>
        ) : null}
      </CardContent>
    </Card>
  )
}
