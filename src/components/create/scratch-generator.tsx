"use client"

import { Dice5, Loader2, Sparkles, Wand2 } from "lucide-react"
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
  externalAiConfigured: boolean
  onGenerate: () => void
}

export function ScratchGenerator({
  prompt,
  onPromptChange,
  busy,
  externalAiConfigured,
  onGenerate,
}: ScratchGeneratorProps) {
  const isGenerating = busy?.type === "creating-from-scratch"
  const isBusy = busy !== null

  return (
    <div className="relative flex flex-1 flex-col items-center justify-center p-6 overflow-hidden">
      <div className="absolute inset-0 pixel-bg opacity-10" />
      <div className="absolute inset-0 bg-gradient-to-b from-[#0080ff]/5 via-transparent to-[#ff0040]/5" />

      <div className="relative w-full max-w-2xl space-y-10">
        {/* Hero */}
        <div className="text-center">
          <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center border-4 border-[#0080ff] bg-[#1a1a2e] shadow-[6px_6px_0_#ff0040]">
            <Sparkles className="h-10 w-10 text-[#ffff00]" />
          </div>
          <h1 className="mb-2">
            <span
              className="block font-pixel text-4xl font-bold text-white leading-none tracking-tight"
              style={{ fontFamily: "var(--font-pixel), monospace" }}
            >
              ARCADE
            </span>
            <span
              className="block font-pixel text-4xl font-bold text-[#ffff00] leading-none tracking-tight drop-shadow-[3px_3px_0_#ff0040]"
              style={{ fontFamily: "var(--font-pixel), monospace" }}
            >
              BUILDER
            </span>
          </h1>
          <p className="mx-auto mt-6 max-w-lg font-pixel text-[11px] leading-relaxed tracking-widest text-[#8fa5d1]">
            Describe the game you want to build, or pick a starter from the sidebar.
            VibeGames is built for browser-native vibecoding.
          </p>
        </div>

        {/* Prompt input */}
        <div className="relative border-4 border-[#4a4a6a] bg-[#1a1a2e] shadow-[8px_8px_0_#000] transition-all focus-within:border-[#0080ff] focus-within:shadow-[8px_8px_0_#0080ff]/20">
          <textarea
            value={prompt}
            onChange={(event) => onPromptChange(event.target.value)}
            onKeyDown={(event) => {
              if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
                event.preventDefault()
                onGenerate()
              }
            }}
            className="min-h-[140px] w-full resize-none bg-transparent px-5 pt-5 pb-16 text-base text-white placeholder:text-[#4a5c7e] focus:outline-none"
            placeholder="Describe your game idea... e.g. a spooky survivor game where you protect a lantern from ghosts"
          />
          <div className="absolute right-4 bottom-4 flex items-center gap-3">
            <button
              type="button"
              className="flex h-10 w-10 items-center justify-center border-2 border-[#4a4a6a] bg-[#0d1420] text-[#6b7fa3] transition-colors hover:border-[#0080ff] hover:text-[#0080ff] cursor-pointer disabled:opacity-40"
              disabled={isBusy}
              onClick={() =>
                onPromptChange(
                  IDEA_EXAMPLES[Math.floor(Math.random() * IDEA_EXAMPLES.length)] || IDEA_EXAMPLES[0],
                )
              }
              title="Random idea"
            >
              <Dice5 className="h-5 w-5" />
            </button>
            <button
              type="button"
              className="btn-arcade flex h-10 items-center gap-2 border-2 px-6 text-[10px] disabled:opacity-40"
              disabled={isBusy || prompt.trim().length < 8}
              onClick={onGenerate}
              style={{ padding: '0 20px' }}
            >
              {isGenerating ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Wand2 className="h-4 w-4" />
              )}
              {externalAiConfigured ? "GENERATE" : "GENERATE (LOCAL)"}
            </button>
          </div>
        </div>

        {/* Example ideas */}
        <div className="space-y-4">
          <p className="text-center font-pixel text-[9px] tracking-[0.2em] text-[#4a5c7e]">
            SELECT STARTING QUEST
          </p>
          <div className="grid gap-3 sm:grid-cols-3">
            {IDEA_EXAMPLES.map((example, index) => (
              <button
                key={index}
                type="button"
                className="group relative cursor-pointer border-2 border-[#4a4a6a] bg-[#0d1420] px-4 py-4 text-left transition-all hover:border-[#ffff00] hover:bg-[#1a1a2e] disabled:opacity-40"
                disabled={isBusy}
                onClick={() => onPromptChange(example)}
              >
                <div className="absolute -top-2 -left-2 hidden h-4 w-4 border-l-2 border-t-2 border-[#ffff00] group-hover:block" />
                <div className="absolute -bottom-2 -right-2 hidden h-4 w-4 border-r-2 border-b-2 border-[#ffff00] group-hover:block" />
                <p className="text-xs leading-relaxed text-[#8fa5d1] transition-colors group-hover:text-white">
                  {example}
                </p>
              </button>
            ))}
          </div>
        </div>

        <p className="text-center font-pixel text-[9px] tracking-widest text-[#4a5c7e]">
          HOLD CTRL + ENTER TO INITIATE BUILD
        </p>
      </div>
    </div>
  )
}
