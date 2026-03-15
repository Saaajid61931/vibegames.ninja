"use client"

import { useState } from "react"
import { Check, Code2, Copy, Sparkles, Wand2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"

const LEVEL_EDITOR_QUICK_PROMPT = `You are upgrading an existing HTML5 browser game for VibeGames Level Editor 2.0.

Work like a strong current-generation coding model:
- inspect first
- explain the real level structure in this exact game
- make the smallest possible patch
- do not rewrite unrelated systems

Before coding:
1. Explain what counts as a "level" in this game.
2. If full level editing is a poor fit, say so and propose the lightest custom-stage/scenario editor that still makes sense.
3. Reuse the existing render, collision, spawn, and win-condition systems whenever possible.

Then implement:
- hidden editor mode activated only from window.VG.onEnterEditMode(...)
- editor-only controls for placing, deleting, moving, and configuring the important level elements
- TEST LEVEL and BACK TO EDITOR controls
- exportLevelData() returning a plain object or array
- importLevel(data) restoring the level in both play mode and editor mode
- VG.notifyReady(), VG.onEnterEditMode(), VG.onLoadLevel(), VG.onRequestSave(), and VG.saveLevel(...)
- thumbnail capture in VG.saveLevel when possible using the main canvas

Rules:
- keep editor UI hidden during normal play
- do not add a visible editor button to the main menu
- do not auto-enable editor mode
- do not inject the VibeGames SDK manually; window.VG is already provided by the platform
- return only changed files or patch-style edits plus a short manual test plan`

const PLATFORMER_ACTION_ADDON = `Genre add-on for platformers / action games:
- Let players place platforms, hazards, enemies, pickups, spawn point, and finish goal
- Support drag or click placement plus delete/remove
- Export all object positions, types, and game-critical settings
- Keep combat and movement exactly as they already work`

const PUZZLE_GRID_ADDON = `Genre add-on for puzzle / grid games:
- Let players edit board size, tiles/cells/pieces, blockers, start state, and win-condition data
- If the game has move limits or rule modifiers, make them editable too
- Export the full board state and puzzle rules in a plain object`

const RACING_PATH_ADDON = `Genre add-on for racing / path / track games:
- Let players place track segments, checkpoints, walls, hazards, start, and finish
- Make sure lap/checkpoint logic still works after importing a saved level
- Export the full ordered path/track layout and checkpoint metadata`

const LEVEL_EDITOR_ADVANCED_PROMPT = `You are upgrading an existing HTML5 browser game for VibeGames Level Editor 2.0.

Goal:
Turn this game into a remixable community game where players can build, save, load, test, and share custom levels without breaking normal play.

Working style:
- inspect the real game first
- explain what counts as a level in this specific game
- reuse existing systems whenever possible
- prefer additive hooks and adapters over rewrites
- return changed files or patch-style edits only

What the game must support:
1. Hidden editor mode
2. Real level-building tools for this genre
3. exportLevelData() returning structured level data
4. importLevel(data) restoring that level in both play and editor modes
5. VG.notifyReady(), VG.onEnterEditMode(...), VG.onLoadLevel(...), VG.onRequestSave(...), and VG.saveLevel(...)

Checklist before finishing:
- normal play still works with no editor UI visible
- editor mode reveals the correct tools
- exportLevelData() returns full structured level data
- importLevel(data) fully restores a saved level
- VG.notifyReady() is called
- VG.onEnterEditMode(), VG.onLoadLevel(), and VG.onRequestSave() are wired
- VG.saveLevel(...) sends name, description, data, and thumbnail when possible

Also include:
- one short paragraph explaining what counts as a level in this game
- one example of the exported level object
- a short manual test plan`

const MANUAL_SNIPPET = `// VibeGames community level editor integration
// Place this near the end of your main game script.
// Implement: enterEditorMode(), exportLevelData(), importLevel(data)

let editorMode = false;
let vgBound = false;
let currentLevelName = "";
let currentLevelDescription = "";

function bindVGHooks() {
  if (vgBound || !window.VG) return;
  vgBound = true;

  window.VG.notifyReady();

  if (window.VG.mode === "editor") {
    enterEditorMode();
  }

  window.VG.onEnterEditMode(function () {
    enterEditorMode();
  });

  window.VG.onLoadLevel(function (payload) {
    const level = payload.level;
    if (level && level.data) {
      importLevel(level.data);
      currentLevelName = level.name || "";
      currentLevelDescription = level.description || "";
    }
  });

  window.VG.onRequestSave(function () {
    const data = exportLevelData();
    let thumbnail;
    try {
      const canvas = document.querySelector("canvas");
      if (canvas) thumbnail = canvas.toDataURL("image/jpeg", 0.6);
    } catch (error) {}

    window.VG.saveLevel({
      name: currentLevelName || "Custom Level",
      description: currentLevelDescription || "",
      data,
      thumbnail,
    });
  });
}

if (window.VG) {
  bindVGHooks();
} else {
  window.addEventListener("VG_SDK_READY", bindVGHooks, { once: true });
}`

type CopyValue = "quick" | "platformer" | "puzzle" | "racing" | "advanced" | "manual"

async function copyText(text: string) {
  await navigator.clipboard.writeText(text)
}

export function LevelEditorSetupGuide() {
  const [copied, setCopied] = useState<CopyValue | null>(null)

  const copyMap: Record<CopyValue, string> = {
    quick: LEVEL_EDITOR_QUICK_PROMPT,
    platformer: PLATFORMER_ACTION_ADDON,
    puzzle: PUZZLE_GRID_ADDON,
    racing: RACING_PATH_ADDON,
    advanced: LEVEL_EDITOR_ADVANCED_PROMPT,
    manual: MANUAL_SNIPPET,
  }

  const copy = async (value: CopyValue) => {
    await copyText(copyMap[value])
    setCopied(value)
    window.setTimeout(() => {
      setCopied((prev) => (prev === value ? null : prev))
    }, 1200)
  }

  return (
    <div className="space-y-4 rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-[var(--color-text)]">Level Editor 2.0 Setup</p>
          <p className="mt-1 text-xs text-[var(--color-text-secondary)]">
            Use this when you want players to build, save, test, and share custom stages inside the game.
          </p>
        </div>
        <Sparkles className="mt-0.5 h-4 w-4 text-[var(--color-primary)]" />
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <div className="rounded-md border border-[var(--color-border)] bg-[var(--color-base)] p-3">
          <p className="text-[11px] font-semibold text-[var(--color-primary)]">Great fit</p>
          <p className="mt-2 text-xs text-[var(--color-text-secondary)]">
            Platformers, puzzle games, racing tracks, tower defense, wave-based shooters, and games with obvious stage data.
          </p>
        </div>
        <div className="rounded-md border border-[var(--color-border)] bg-[var(--color-base)] p-3">
          <p className="text-[11px] font-semibold text-[var(--color-text)]">Possible fit</p>
          <p className="mt-2 text-xs text-[var(--color-text-secondary)]">
            Score chasers or arcade loops if players can still edit layouts, waves, checkpoints, or obstacle sets.
          </p>
        </div>
        <div className="rounded-md border border-[var(--color-border)] bg-[var(--color-base)] p-3">
          <p className="text-[11px] font-semibold text-[var(--color-text)]">Usually weak fit</p>
          <p className="mt-2 text-xs text-[var(--color-text-secondary)]">
            Pure narrative, trivia, or toy experiences with no real stage structure.
          </p>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between gap-2">
          <div>
            <p className="text-xs font-medium text-[var(--color-text)]">Quick prompt for your coding AI</p>
            <p className="text-[11px] text-[var(--color-text-secondary)]">
              This pushes the model to inspect the real game first, identify the actual level shape, and patch carefully.
            </p>
          </div>
          <Button type="button" size="sm" variant="outline" onClick={() => void copy("quick")}>
            {copied === "quick" ? <Check className="mr-1 h-4 w-4" /> : <Copy className="mr-1 h-4 w-4" />}
            {copied === "quick" ? "Copied" : "Copy prompt"}
          </Button>
        </div>
        <Textarea readOnly value={LEVEL_EDITOR_QUICK_PROMPT} className="min-h-[260px] text-xs" />
      </div>

      <div className="rounded-md border border-[var(--color-border)] bg-[var(--color-base)] p-3">
        <div className="mb-3 flex items-center gap-2">
          <Wand2 className="h-4 w-4 text-[var(--color-primary)]" />
          <p className="text-xs font-medium text-[var(--color-text)]">Optional genre boosters</p>
        </div>
        <div className="grid gap-3 md:grid-cols-3">
          {[
            { key: "platformer" as const, title: "Platformer / action", value: PLATFORMER_ACTION_ADDON },
            { key: "puzzle" as const, title: "Puzzle / grid", value: PUZZLE_GRID_ADDON },
            { key: "racing" as const, title: "Racing / path", value: RACING_PATH_ADDON },
          ].map((item) => (
            <div key={item.key} className="rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] p-3">
              <div className="flex items-center justify-between gap-2">
                <p className="text-[11px] font-medium text-[var(--color-text)]">{item.title}</p>
                <Button type="button" size="sm" variant="outline" onClick={() => void copy(item.key)}>
                  {copied === item.key ? <Check className="mr-1 h-4 w-4" /> : <Copy className="mr-1 h-4 w-4" />}
                  {copied === item.key ? "Copied" : "Copy"}
                </Button>
              </div>
              <Textarea readOnly value={item.value} className="mt-2 min-h-[132px] text-xs" />
            </div>
          ))}
        </div>
      </div>

      <details className="rounded-md border border-[var(--color-border)] bg-[var(--color-base)] p-3">
        <summary className="cursor-pointer text-xs font-medium text-[var(--color-text)]">
          Advanced prompt for tricky games
        </summary>
        <div className="mt-3 space-y-2">
          <div className="flex items-center justify-end">
            <Button type="button" size="sm" variant="outline" onClick={() => void copy("advanced")}>
              {copied === "advanced" ? <Check className="mr-1 h-4 w-4" /> : <Copy className="mr-1 h-4 w-4" />}
              {copied === "advanced" ? "Copied" : "Copy advanced"}
            </Button>
          </div>
          <Textarea readOnly value={LEVEL_EDITOR_ADVANCED_PROMPT} className="min-h-[260px] text-xs" />
        </div>
      </details>

      <details className="rounded-md border border-[var(--color-border)] bg-[var(--color-base)] p-3">
        <summary className="cursor-pointer text-xs font-medium text-[var(--color-text)]">
          Manual hook snippet
        </summary>
        <div className="mt-3 space-y-2">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-[11px] text-[var(--color-text-secondary)]">
              <Code2 className="h-4 w-4" />
              Paste this near the end of the main game script.
            </div>
            <Button type="button" size="sm" variant="outline" onClick={() => void copy("manual")}>
              {copied === "manual" ? <Check className="mr-1 h-4 w-4" /> : <Copy className="mr-1 h-4 w-4" />}
              {copied === "manual" ? "Copied" : "Copy snippet"}
            </Button>
          </div>
          <Textarea readOnly value={MANUAL_SNIPPET} className="min-h-[240px] font-mono text-xs" />
        </div>
      </details>

      <p className="text-[11px] text-[var(--color-text-tertiary)]">
        VibeGames injects the SDK automatically when level editor is enabled. Your game still needs to call the hooks above so the editor shell can load and save community levels.
      </p>
    </div>
  )
}
