"use client"

import { Loader2 } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import type { BuilderBusyState, BuilderClientTemplate } from "@/lib/builder/types"

interface TemplateSelectorProps {
  templates: BuilderClientTemplate[]
  busy: BuilderBusyState
  onSelect: (templateKey: string) => void
}

export function TemplateSelector({ templates, busy, onSelect }: TemplateSelectorProps) {
  const isCreating = busy?.type === "creating" || busy?.type === "creating-from-scratch"

  return (
    <Card variant="arcade">
      <CardHeader variant="arcade">
        <CardTitle className="font-arcade text-sm text-white">Start Fresh</CardTitle>
        <CardDescription>Pick a starter that already behaves like a game.</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-3">
        {templates.map((template) => {
          const loading = busy?.type === "creating" && busy.templateKey === template.key
          return (
            <button
              key={template.key}
              type="button"
              className="cursor-pointer rounded-xl border border-[#2b3753] bg-[#121a2d] p-4 text-left transition hover:border-[#00e5ff] hover:bg-[#17233c] disabled:cursor-not-allowed disabled:opacity-50"
              onClick={() => onSelect(template.key)}
              disabled={isCreating}
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin text-[#00e5ff]" />
              ) : (
                <p className="text-[10px] font-arcade text-[#00e5ff]">{template.eyebrow}</p>
              )}
              <p className="mt-2 font-arcade text-sm text-white">{template.label}</p>
              <p className="mt-2 text-xs text-[#9eb0d6]">{template.description}</p>
            </button>
          )
        })}
      </CardContent>
    </Card>
  )
}
