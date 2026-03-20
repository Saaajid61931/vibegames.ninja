"use client"

import { Dice5, Loader2, Sparkles, Wand2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import type { BuilderBusyState } from "@/lib/builder/types"

const IDEA_EXAMPLES = [
  "Make a cozy one-thumb cafe defense game where sleepy cats guard pastry shelves from sneaky pigeons.",
  "Generate a neon parkour runner with wall jumps, combo pickups, and a streamer-friendly score chase.",
  "Build a portrait puzzle game about growing glowing vines across a ruined temple grid.",
]

interface ScratchGeneratorProps {
  prompt: string
  onPromptChange: (value: string) => void
  busy: BuilderBusyState
  openRouterConfigured: boolean
  onGenerate: () => void
}

export function ScratchGenerator({
  prompt,
  onPromptChange,
  busy,
  openRouterConfigured,
  onGenerate,
}: ScratchGeneratorProps) {
  const isGenerating = busy?.type === "creating-from-scratch"
  const isBusy = busy !== null

  return (
    <Card variant="arcade">
      <CardHeader variant="arcade">
        <div className="flex items-center gap-2 text-[10px] font-arcade text-[#8ec5ff]">
          <Sparkles className="h-4 w-4 text-[#00e5ff]" />
          START FROM SCRATCH
        </div>
        <CardTitle className="font-arcade text-lg text-white">Describe the game idea</CardTitle>
        <CardDescription>
          The generator will pick the best starter under the hood, shape the first playable draft,
          and drop you straight into iteration.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Textarea
          value={prompt}
          onChange={(event) => onPromptChange(event.target.value)}
          onKeyDown={(event) => {
            if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
              event.preventDefault()
              onGenerate()
            }
          }}
          className="min-h-[150px]"
          placeholder="Example: a spooky portrait survivor game where you protect a lantern, kite ghosts in tight circles, and build combo heat with risky close calls."
        />

        <div className="space-y-2">
          <p className="text-[11px] uppercase tracking-[0.24em] text-[var(--color-text-tertiary)]">
            Try one
          </p>
          <div className="grid gap-2">
            {IDEA_EXAMPLES.map((example, index) => (
              <button
                key={index}
                type="button"
                className="cursor-pointer rounded-2xl border border-white/10 bg-[#10192d] px-4 py-3 text-left text-xs leading-5 text-[#c7d6f6] transition hover:border-[#00e5ff]/60 hover:bg-[#13203a] disabled:cursor-not-allowed disabled:opacity-50"
                disabled={isBusy}
                onClick={() => onPromptChange(example)}
              >
                {example}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          <Button disabled={isBusy || prompt.trim().length < 8} onClick={onGenerate}>
            {isGenerating ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Wand2 className="mr-2 h-4 w-4" />
            )}
            {openRouterConfigured ? "Generate First Draft" : "Generate With Local AI"}
          </Button>
          <Button
            variant="outline"
            disabled={isBusy}
            onClick={() =>
              onPromptChange(
                IDEA_EXAMPLES[Math.floor(Math.random() * IDEA_EXAMPLES.length)] || IDEA_EXAMPLES[0],
              )
            }
          >
            <Dice5 className="mr-2 h-4 w-4" />
            Surprise Me
          </Button>
        </div>

        <p className="text-xs text-[var(--color-text-secondary)]">
          Include the fantasy, control style, difficulty, and mood you want. The more specific the
          fantasy, the better the first draft lands. Press `Ctrl+Enter` to generate.
        </p>
      </CardContent>
    </Card>
  )
}
