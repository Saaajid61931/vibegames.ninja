"use client"

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
  onSelectProject: (id: string) => void
}

export function ProjectSidebar({
  projects,
  activeProjectId,
  openRouterApiKey,
  onApiKeyChange,
  openRouterModel,
  onOpenRouterModelChange,
  onSelectProject,
}: ProjectSidebarProps) {
  return (
    <>
      {/* OpenRouter settings */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">OpenRouter</CardTitle>
          <CardDescription>
            Saved only on this device and used only when you apply a prompt.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
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
            <Label htmlFor="openrouter-model">Model slug</Label>
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
          <p className="text-xs text-[var(--color-text-secondary)]">
            {openRouterApiKey.trim()
              ? "OpenRouter is connected on this browser. Prompt edits will use your key."
              : "Leave this blank to keep using the local fallback builder."}
          </p>
          <p className="text-xs text-[var(--color-text-secondary)]">
            Leave the model blank to use {DEFAULT_BUILDER_OPENROUTER_MODEL}, or paste any valid
            OpenRouter model slug.
          </p>
        </CardContent>
      </Card>

      {/* Recent drafts */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Recent Drafts</CardTitle>
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
