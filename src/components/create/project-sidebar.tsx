"use client"

import { BadgeCheck, CircleAlert, Loader2, PlugZap, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { DEFAULT_BUILDER_OPENROUTER_MODEL } from "@/lib/builder/types"
import { timeAgo } from "@/lib/utils"
import type { BuilderProjectSummary } from "@/lib/builder/types"

interface ProjectSidebarProps {
  projects: BuilderProjectSummary[]
  activeProjectId: string | undefined
  openRouterApiKey: string
  onApiKeyChange: (value: string) => void
  openRouterModel: string
  onOpenRouterModelChange: (value: string) => void
  openRouterTestState: {
    status: "idle" | "testing" | "success" | "error"
    message: string
    model: string
  }
  onTestOpenRouter: () => void
  onSelectProject: (id: string) => void
}

export function ProjectSidebar({
  projects,
  activeProjectId,
  openRouterApiKey,
  onApiKeyChange,
  openRouterModel,
  onOpenRouterModelChange,
  openRouterTestState,
  onTestOpenRouter,
  onSelectProject,
}: ProjectSidebarProps) {
  const resolvedModel = openRouterModel.trim() || DEFAULT_BUILDER_OPENROUTER_MODEL
  const keyConfigured = openRouterApiKey.trim().length > 0

  const statusTone =
    openRouterTestState.status === "success"
      ? "border-emerald-400/30 bg-emerald-500/10 text-emerald-100"
      : openRouterTestState.status === "error"
        ? "border-rose-400/30 bg-rose-500/10 text-rose-100"
        : "border-cyan-400/20 bg-cyan-400/10 text-cyan-50"

  const statusIcon =
    openRouterTestState.status === "success" ? (
      <BadgeCheck className="h-4 w-4 text-emerald-300" />
    ) : openRouterTestState.status === "error" ? (
      <CircleAlert className="h-4 w-4 text-rose-300" />
    ) : openRouterTestState.status === "testing" ? (
      <Loader2 className="h-4 w-4 animate-spin text-cyan-200" />
    ) : (
      <PlugZap className="h-4 w-4 text-cyan-200" />
    )

  const statusTitle =
    openRouterTestState.status === "success"
      ? "OpenRouter Ready"
      : openRouterTestState.status === "error"
        ? "OpenRouter Needs Attention"
        : openRouterTestState.status === "testing"
          ? "Testing OpenRouter"
          : keyConfigured
            ? "Key Added"
            : "Local Builder Mode"

  const statusMessage =
    openRouterTestState.message ||
    (keyConfigured
      ? "Run a quick test before generating so we know the selected model can answer the builder."
      : "Add your OpenRouter key if you want external AI generation. Without it, prompts stay on the local builder.")

  return (
    <>
      {/* OpenRouter settings */}
      <Card variant="arcade">
        <CardHeader variant="arcade">
          <div className="flex items-center gap-2 text-[10px] font-arcade text-[#8ec5ff]">
            <Sparkles className="h-4 w-4 text-[#00e5ff]" />
            AI CONTROL CENTER
          </div>
          <CardTitle className="font-arcade text-lg text-white">OpenRouter</CardTitle>
          <CardDescription>
            Saved only on this device. The key is sent only when you test or generate.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className={`rounded-2xl border px-4 py-3 ${statusTone}`} aria-live="polite">
            <div className="flex items-start gap-3">
              {statusIcon}
              <div className="space-y-1">
                <p className="text-sm font-semibold">{statusTitle}</p>
                <p className="text-xs leading-5 opacity-90">{statusMessage}</p>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="openrouter-key">API key</Label>
            <Input
              id="openrouter-key"
              variant="studio"
              type="password"
              autoComplete="off"
              spellCheck={false}
              value={openRouterApiKey}
              onChange={(e) => onApiKeyChange(e.target.value)}
              placeholder="sk-or-v1-..."
            />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-3">
              <Label htmlFor="openrouter-model">Model slug</Label>
              <button
                type="button"
                className="cursor-pointer text-xs text-[#8ec5ff] transition hover:text-white"
                onClick={() => onOpenRouterModelChange("")}
              >
                Use default
              </button>
            </div>
            <Input
              id="openrouter-model"
              variant="studio"
              autoComplete="off"
              spellCheck={false}
              value={openRouterModel}
              onChange={(e) => onOpenRouterModelChange(e.target.value)}
              placeholder={DEFAULT_BUILDER_OPENROUTER_MODEL}
            />
          </div>

          <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-3">
            <p className="text-[11px] uppercase tracking-[0.24em] text-[var(--color-text-tertiary)]">
              Selected model
            </p>
            <p className="mt-2 break-all text-sm text-[var(--color-text)]">{resolvedModel}</p>
            <p className="mt-2 text-xs text-[var(--color-text-secondary)]">
              Model slugs should look like <span className="font-mono">provider/model-name</span>.
            </p>
          </div>

          <div className="grid gap-2 sm:grid-cols-2">
            <Button
              variant="outline"
              disabled={openRouterTestState.status === "testing"}
              onClick={onTestOpenRouter}
            >
              {openRouterTestState.status === "testing" ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <PlugZap className="mr-2 h-4 w-4" />
              )}
              Test Connection
            </Button>
            <Button
              variant="ghost"
              disabled={!openRouterModel.trim()}
              onClick={() => onOpenRouterModelChange("")}
            >
              Reset Model
            </Button>
          </div>

          <p className="text-xs text-[var(--color-text-secondary)]">
            Leave the model blank to use {DEFAULT_BUILDER_OPENROUTER_MODEL}. If a generation falls
            back, the page will tell you why instead of silently hanging.
          </p>
        </CardContent>
      </Card>

      {/* Recent drafts */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Recent Drafts</CardTitle>
          <CardDescription>Jump back into earlier AI runs and starter ideas.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {projects.length === 0 ? (
            <p className="text-sm text-[var(--color-text-secondary)]">
              No builder projects yet.
            </p>
          ) : (
            projects.map((item) => (
              <button
                key={item.id}
                type="button"
                className={`w-full cursor-pointer rounded-xl border px-3 py-3 text-left transition disabled:cursor-not-allowed ${
                  activeProjectId === item.id
                    ? "border-[#00e5ff] bg-[#0f1c32]"
                    : "border-[var(--color-border)] bg-[var(--color-surface)] hover:border-[#00e5ff]/60"
                }`}
                onClick={() => onSelectProject(item.id)}
              >
                <p className="font-medium text-[var(--color-text)]">{item.title}</p>
                <p className="mt-1 text-xs text-[var(--color-text-secondary)]">
                  {item.currentRevision?.summary || "Fresh starter ready to tune."}
                </p>
                <p className="mt-2 text-[10px] uppercase tracking-wide text-[var(--color-text-tertiary)]">
                  {timeAgo(new Date(item.updatedAt))} &bull; {item.status}
                </p>
              </button>
            ))
          )}
        </CardContent>
      </Card>
    </>
  )
}
