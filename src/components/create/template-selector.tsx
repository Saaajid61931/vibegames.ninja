"use client"

import { Loader2 } from "lucide-react"
import type { BuilderBusyState, BuilderClientTemplate } from "@/lib/builder/types"

interface TemplateSelectorProps {
  templates: BuilderClientTemplate[]
  busy: BuilderBusyState
  onSelect: (templateKey: string) => void
}

const TEMPLATE_ICONS: Record<string, string> = {
  runner: ">>>",
  flappy: "^v^",
  arena: "(+)",
  puzzle: "[#]",
}

export function TemplateSelector({ templates, busy, onSelect }: TemplateSelectorProps) {
  const isCreating = busy?.type === "creating" || busy?.type === "creating-from-scratch"

  return (
    <div className="space-y-2">
      {templates.map((template) => {
        const loading = busy?.type === "creating" && busy.templateKey === template.key
        return (
          <button
            key={template.key}
            type="button"
            className="group flex w-full cursor-pointer items-center gap-3 border-2 border-[#4a4a6a] bg-[#1a1a2e] px-3 py-2.5 text-left transition-all hover:border-[#ffff00] hover:shadow-[3px_3px_0_#000] disabled:cursor-not-allowed disabled:opacity-40"
            onClick={() => onSelect(template.key)}
            disabled={isCreating}
          >
            {loading ? (
              <Loader2 className="h-5 w-5 shrink-0 animate-spin text-[#0080ff]" />
            ) : (
              <span className="shrink-0 font-pixel text-xs text-[#ffff00] drop-shadow-[1px_1px_0_#ff0040]">
                {TEMPLATE_ICONS[template.key] || "[ ]"}
              </span>
            )}
            <div className="min-w-0 flex-1">
              <p className="truncate font-pixel text-[10px] text-white group-hover:text-[#ffff00]">
                {template.label.toUpperCase()}
              </p>
              <p className="truncate font-pixel text-[8px] text-[#6b7fa3]">{template.eyebrow.toUpperCase()}</p>
            </div>
          </button>
        )
      })}
    </div>
  )
}

