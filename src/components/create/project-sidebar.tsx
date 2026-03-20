"use client"

import { useState } from "react"
import {
  BadgeCheck,
  ChevronDown,
  ChevronRight,
  CircleAlert,
  Cpu,
  Key,
  Loader2,
  PanelLeftClose,
  PanelLeftOpen,
  PlugZap,
  Plus,
} from "lucide-react"
import { Input } from "@/components/ui/input"
import { TemplateSelector } from "@/components/create/template-selector"
import { RevisionHistory } from "@/components/create/revision-history"
import {
  BUILDER_AI_PROVIDER_OPTIONS,
  builderAiSettingsAreConfigured,
} from "@/lib/builder/ai-providers"
import type {
  BuilderAiFieldKey,
  BuilderAiProviderOption,
} from "@/lib/builder/ai-providers"
import { timeAgo } from "@/lib/utils"
import type {
  BuilderAiProviderId,
  BuilderAiSettings,
  BuilderBusyState,
  BuilderClientTemplate,
  BuilderProjectSummary,
  BuilderProjectDetail,
} from "@/lib/builder/types"

interface ProjectSidebarProps {
  projects: BuilderProjectSummary[]
  activeProjectId: string | undefined
  activeProject: BuilderProjectDetail | null
  templates: BuilderClientTemplate[]
  busy: BuilderBusyState
  aiSettings: BuilderAiSettings
  activeAiProvider: BuilderAiProviderOption
  onAiProviderChange: (value: BuilderAiProviderId) => void
  onAiSettingChange: (field: BuilderAiFieldKey, value: string) => void
  aiTestState: {
    status: "idle" | "testing" | "success" | "error"
    message: string
    model: string
    providerId: BuilderAiProviderId
  }
  onTestAiProvider: () => void
  onSelectProject: (id: string) => void
  onCreateFromTemplate: (key: string) => void
  onNewProject: () => void
  onRestoreRevision: (revisionId: string) => void
  collapsed: boolean
  onToggleCollapse: () => void
}

type SectionId = "starters" | "drafts" | "revisions" | "ai"

export function ProjectSidebar({
  projects,
  activeProjectId,
  activeProject,
  templates,
  busy,
  aiSettings,
  activeAiProvider,
  onAiProviderChange,
  onAiSettingChange,
  aiTestState,
  onTestAiProvider,
  onSelectProject,
  onCreateFromTemplate,
  onNewProject,
  onRestoreRevision,
  collapsed,
  onToggleCollapse,
}: ProjectSidebarProps) {
  const [expandedSections, setExpandedSections] = useState<Set<SectionId>>(
    new Set(["starters", "drafts"]),
  )

  const providerConfigured = builderAiSettingsAreConfigured(aiSettings)
  const usingLocalProvider = aiSettings.providerId === "local"

  const toggleSection = (id: SectionId) => {
    setExpandedSections((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  if (collapsed) {
    return (
      <div className="flex w-12 flex-col items-center border-r-2 border-[#4a4a6a] bg-[#0d1420] py-4">
        <button
          type="button"
          onClick={onToggleCollapse}
          className="p-2 text-[#6b7fa3] transition-colors hover:text-white cursor-pointer"
          title="Expand sidebar"
        >
          <PanelLeftOpen className="h-5 w-5" />
        </button>
      </div>
    )
  }

  return (
    <div className="flex w-64 flex-col border-r-2 border-[#4a4a6a] bg-[#0d1420]">
      {/* Sidebar header */}
      <div className="flex items-center justify-between border-b-2 border-[#4a4a6a] px-3 py-3 bg-[#0b1120]">
        <button
          type="button"
          className="btn-arcade flex cursor-pointer items-center gap-2 border-2 px-3 py-1.5 text-[9px]"
          onClick={onNewProject}
        >
          <Plus className="h-3.5 w-3.5" />
          NEW GAME
        </button>
        <button
          type="button"
          onClick={onToggleCollapse}
          className="p-1.5 text-[#6b7fa3] transition-colors hover:text-white cursor-pointer"
          title="Collapse sidebar"
        >
          <PanelLeftClose className="h-4 w-4" />
        </button>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto">
        <div className="space-y-1 p-3">
          {/* Starters section */}
          <SectionHeader
            label="Starters"
            isOpen={expandedSections.has("starters")}
            onToggle={() => toggleSection("starters")}
          />
          {expandedSections.has("starters") && (
            <div className="mt-2">
              <TemplateSelector
                templates={templates}
                busy={busy}
                onSelect={onCreateFromTemplate}
              />
            </div>
          )}

          {/* Drafts section */}
          <SectionHeader
            label="Your Drafts"
            count={projects.length}
            isOpen={expandedSections.has("drafts")}
            onToggle={() => toggleSection("drafts")}
          />
          {expandedSections.has("drafts") && (
            <div className="space-y-2 mt-2">
              {projects.length === 0 ? (
                <p className="px-2 py-3 font-pixel text-[9px] text-[#6b7fa3]">NO DRAFTS YET</p>
              ) : (
                projects.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    className={`flex w-full cursor-pointer flex-col border-2 p-2.5 text-left transition-all ${
                      activeProjectId === item.id
                        ? "bg-[#1a1a2e] border-[#0080ff] shadow-[3px_3px_0_#0080ff]/20"
                        : "border-[#4a4a6a] hover:border-[#6b7fa3] bg-transparent"
                    }`}
                    onClick={() => onSelectProject(item.id)}
                  >
                    <p className={`truncate font-pixel text-[10px] ${activeProjectId === item.id ? "text-white" : "text-[#8fa5d1]"}`}>
                      {item.title.toUpperCase()}
                    </p>
                    <p className="mt-1 truncate font-pixel text-[8px] text-[#6b7fa3]">
                      {timeAgo(new Date(item.updatedAt)).toUpperCase()}
                      {item.publishedGame && " \u00b7 LIVE"}
                    </p>
                  </button>
                ))
              )}
            </div>
          )}

          {/* Revisions section (only when a project is active) */}
          {activeProject && (
            <>
              <SectionHeader
                label="Revisions"
                count={activeProject.revisions.length}
                isOpen={expandedSections.has("revisions")}
                onToggle={() => toggleSection("revisions")}
              />
              {expandedSections.has("revisions") && (
                <div className="mt-2">
                  <RevisionHistory
                    revisions={activeProject.revisions}
                    currentRevisionId={activeProject.currentRevision?.id}
                    busy={busy}
                    onRestore={onRestoreRevision}
                  />
                </div>
              )}
            </>
          )}

          {/* AI Settings section */}
          <SectionHeader
            label="AI Settings"
            isOpen={expandedSections.has("ai")}
            onToggle={() => toggleSection("ai")}
          />
          {expandedSections.has("ai") && (
            <div className="space-y-4 px-1 py-3">
              {/* Status indicator */}
              <div
                className={`border-2 px-3 py-2 ${
                  aiTestState.status === "success"
                    ? "border-emerald-500 bg-emerald-500/5"
                    : aiTestState.status === "error"
                      ? "border-rose-500 bg-rose-500/5"
                      : "border-[#4a4a6a] bg-[#1a1a2e]"
                }`}
              >
                <div className="flex items-center gap-2">
                  {aiTestState.status === "success" ? (
                    <BadgeCheck className="h-3.5 w-3.5 text-emerald-400" />
                  ) : aiTestState.status === "error" ? (
                    <CircleAlert className="h-3.5 w-3.5 text-rose-400" />
                  ) : aiTestState.status === "testing" ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin text-[#0080ff]" />
                  ) : usingLocalProvider ? (
                    <Cpu className="h-3.5 w-3.5 text-[#ffff00]" />
                  ) : (
                    <PlugZap className="h-3.5 w-3.5 text-[#6b7fa3]" />
                  )}
                  <span
                    className={`font-pixel text-[9px] font-bold ${
                      aiTestState.status === "success"
                        ? "text-emerald-300"
                        : aiTestState.status === "error"
                          ? "text-rose-300"
                          : "text-[#8fa5d1]"
                    }`}
                  >
                    {aiTestState.status === "success"
                      ? "CONNECTED"
                      : aiTestState.status === "error"
                        ? "ERROR"
                        : usingLocalProvider
                          ? "LOCAL MODE"
                          : providerConfigured
                            ? "READY"
                            : "SETUP NEEDED"}
                  </span>
                </div>
                {aiTestState.message && (
                  <p className="mt-1.5 font-pixel text-[8px] leading-3 text-[#6b7fa3]">
                    {aiTestState.message.toUpperCase()}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <label className="font-pixel text-[9px] text-[#8fa5d1]">PROVIDER</label>
                <select
                  value={aiSettings.providerId}
                  onChange={(event) => onAiProviderChange(event.target.value as BuilderAiProviderId)}
                  className="h-9 w-full border-2 border-[#4a4a6a] bg-[#1a1a2e] px-3 font-pixel text-[10px] text-white focus:border-[#0080ff] focus:outline-none"
                >
                  {BUILDER_AI_PROVIDER_OPTIONS.map((provider) => (
                    <option key={provider.id} value={provider.id}>
                      {provider.label.toUpperCase()}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <p className="font-pixel text-[8px] leading-4 text-[#6b7fa3]">
                  {activeAiProvider.description.toUpperCase()}
                </p>
                <p className="font-pixel text-[8px] leading-4 text-[#4a5c7e]">
                  AUTH: {activeAiProvider.authLabel.toUpperCase()}
                </p>
              </div>

              {activeAiProvider.fieldOrder.includes("resourceName") && (
                <div className="space-y-2">
                  <label className="font-pixel text-[9px] text-[#8fa5d1]">RESOURCE NAME</label>
                  <Input
                    variant="studio"
                    autoComplete="off"
                    spellCheck={false}
                    value={aiSettings.resourceName || ""}
                    onChange={(event) => onAiSettingChange("resourceName", event.target.value)}
                    placeholder="my-azure-resource"
                    className="h-9 border-2 border-[#4a4a6a] bg-[#1a1a2e] text-xs font-pixel text-white focus:border-[#0080ff]"
                  />
                </div>
              )}

              {activeAiProvider.fieldOrder.includes("baseUrl") && (
                <div className="space-y-2">
                  <label className="font-pixel text-[9px] text-[#8fa5d1]">BASE URL</label>
                  <Input
                    variant="studio"
                    autoComplete="off"
                    spellCheck={false}
                    value={aiSettings.baseUrl || ""}
                    onChange={(event) => onAiSettingChange("baseUrl", event.target.value)}
                    placeholder="http://127.0.0.1:11434/v1"
                    className="h-9 border-2 border-[#4a4a6a] bg-[#1a1a2e] font-mono text-[10px] text-[#8fa5d1] focus:border-[#0080ff]"
                  />
                </div>
              )}

              {activeAiProvider.fieldOrder.includes("apiKey") && (
                <div className="space-y-2">
                  <label className="flex items-center gap-1.5 font-pixel text-[9px] text-[#8fa5d1]">
                    <Key className="h-3 w-3" />
                    API KEY
                  </label>
                  <Input
                    variant="studio"
                    type="password"
                    autoComplete="off"
                    spellCheck={false}
                    value={aiSettings.apiKey || ""}
                    onChange={(event) => onAiSettingChange("apiKey", event.target.value)}
                    placeholder={activeAiProvider.id === "openrouter" ? "sk-or-v1-..." : "Enter your API key"}
                    className="h-9 border-2 border-[#4a4a6a] bg-[#1a1a2e] text-xs font-pixel text-white focus:border-[#0080ff]"
                  />
                </div>
              )}

              {activeAiProvider.fieldOrder.includes("model") && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="font-pixel text-[9px] text-[#8fa5d1]">MODEL</label>
                    {aiSettings.model?.trim() && (
                      <button
                        type="button"
                        className="cursor-pointer font-pixel text-[8px] text-[#6b7fa3] hover:text-white"
                        onClick={() => onAiSettingChange("model", "")}
                      >
                        RESET
                      </button>
                    )}
                  </div>
                  <Input
                    variant="studio"
                    autoComplete="off"
                    spellCheck={false}
                    list="builder-ai-models"
                    value={aiSettings.model || ""}
                    onChange={(event) => onAiSettingChange("model", event.target.value)}
                    placeholder={activeAiProvider.modelPlaceholder || "Enter a model id"}
                    className="h-9 border-2 border-[#4a4a6a] bg-[#1a1a2e] font-mono text-[10px] text-[#ffff00] focus:border-[#0080ff]"
                  />
                  {activeAiProvider.suggestedModels.length > 0 && (
                    <>
                      <datalist id="builder-ai-models">
                        {activeAiProvider.suggestedModels.map((model) => (
                          <option key={model} value={model} />
                        ))}
                      </datalist>
                      <p className="font-pixel text-[8px] leading-4 text-[#4a5c7e]">
                        SUGGESTED: {activeAiProvider.suggestedModels.slice(0, 3).join(" · ").toUpperCase()}
                      </p>
                    </>
                  )}
                </div>
              )}

              {/* Test button */}
              <button
                type="button"
                className="flex w-full cursor-pointer items-center justify-center gap-2 border-2 border-[#4a4a6a] bg-[#1a1a2e] px-3 py-2.5 font-pixel text-[9px] text-[#8fa5d1] transition-all hover:border-[#0080ff] hover:text-white disabled:opacity-40"
                disabled={aiTestState.status === "testing"}
                onClick={onTestAiProvider}
              >
                {aiTestState.status === "testing" ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <PlugZap className="h-3.5 w-3.5" />
                )}
                {usingLocalProvider ? "CHECK LOCAL BUILDER" : "TEST PROVIDER"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

/* ---- Collapsible section header ---- */

function SectionHeader({
  label,
  count,
  isOpen,
  onToggle,
}: {
  label: string
  count?: number
  isOpen: boolean
  onToggle: () => void
}) {
  return (
    <button
      type="button"
      className="flex w-full cursor-pointer items-center gap-1.5 rounded-md px-2 py-1.5 text-[11px] font-semibold uppercase tracking-[0.15em] text-[#6b7fa3] transition-colors hover:bg-[#1a2540]/30 hover:text-[#8fa5d1]"
      onClick={onToggle}
    >
      {isOpen ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
      {label}
      {count !== undefined && count > 0 && (
        <span className="ml-auto rounded-full bg-[#1a2540] px-1.5 py-0.5 text-[10px] text-[#8fa5d1]">
          {count}
        </span>
      )}
    </button>
  )
}
