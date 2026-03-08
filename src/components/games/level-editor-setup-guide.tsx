"use client"

import { useState } from "react"
import { Check, Code2, Copy, Sparkles, Wand2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"

const LEVEL_EDITOR_QUICK_PROMPT = `You are adding VibeGames community level editor support to an existing HTML5 browser game.

Work in small steps and make the smallest possible patch to the current codebase.
Do not rewrite unrelated systems. Preserve the current gameplay loop, rendering, controls, and asset loading.

Before coding:
1. Inspect the current game and explain what counts as a "level" in this specific game.
2. If the game is a poor fit for a full level editor, say so and propose the lightest custom-stage editor that still makes sense.

Then implement:
- A hidden editorMode that is activated ONLY by window.VG.onEnterEditMode(...)
- Editor-only UI for adding, removing, and configuring the level elements that matter for this game
- A TEST LEVEL control and a BACK TO EDITOR control
- exportLevelData() that returns a plain object or array with the full level state (never JSON.stringify)
- importLevel(data) that fully restores a level in both play mode and editor mode
- VG.notifyReady(), VG.onEnterEditMode(), VG.onLoadLevel(), VG.onRequestSave(), and VG.saveLevel(...)
- A thumbnail capture in VG.saveLevel when possible using the main canvas

Rules:
- Keep editor UI completely hidden during normal play
- Do not add a visible editor button to the main menu
- Do not auto-enable editor mode
- Do not import or inject the VibeGames SDK manually; window.VG is provided by the platform
- Return only the changed files or patch-style edits, plus a short test plan

Use this integration pattern at the end of the main game script:

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

const PLATFORMER_ACTION_ADDON = `Genre add-on for platformers / action games:
- Let players place platforms, hazards, enemies, pickups, spawn point, and finish goal
- Support drag or click placement plus delete/remove
- Export all object positions, types, and game-critical settings
- Keep combat and movement exactly as they already work`

const PUZZLE_GRID_ADDON = `Genre add-on for puzzle / grid games:
- Let players edit board size, tiles/cells/pieces, blockers, start state, and win condition data
- If the game has move limits or rule modifiers, make them editable too
- Export the full board state and puzzle rules in a plain object`

const RACING_PATH_ADDON = `Genre add-on for racing / path / track games:
- Let players place track segments, checkpoints, walls, hazards, start, and finish
- Make sure lap/checkpoint logic still works after importing a saved level
- Export the full ordered path/track layout and any checkpoint metadata`

const LEVEL_EDITOR_ADVANCED_PROMPT = `You are adding VibeGames community level editor support to an existing HTML5 browser game.

Goal:
Turn this game into a remixable community game where players can build, save, load, test, and share custom levels without breaking the normal gameplay experience.

Important working style:
- Make the smallest possible patch to the existing codebase
- Reuse existing game state and rendering systems whenever possible
- Do not rewrite unrelated files or systems
- Return changed files or patch-style edits only

What the game must support:
1. Hidden editor mode
   - No editor UI in normal play
   - Editor mode starts only from VG.onEnterEditMode(...)

2. Actual level-building tools for this genre
   - Add objects/elements
   - Remove objects/elements
   - Edit the important properties for those objects
   - TEST LEVEL and BACK TO EDITOR controls

3. Data contract
   - exportLevelData() returns a plain object or array
   - Never JSON.stringify the payload
   - The returned data must be enough to recreate the entire level from scratch
   - importLevel(data) must work in both play mode and editor mode

4. VibeGames SDK hooks
   - VG.notifyReady()
   - VG.onEnterEditMode(...)
   - VG.onLoadLevel(...)
   - VG.onRequestSave(...)
   - VG.saveLevel({ name, description, data, thumbnail })

Required integration pattern:
- Bind immediately if window.VG exists
- Also bind on VG_SDK_READY in case the SDK loads later
- If window.VG.mode === "editor" when hooks bind, enter editor mode immediately
- In onLoadLevel, use payload.level.data
- In onRequestSave, call exportLevelData() and pass the raw object to VG.saveLevel

Common mistakes to avoid:
- Showing editor buttons in normal play mode
- Adding your own SDK script tag
- Returning JSON strings instead of objects
- Forgetting VG.notifyReady()
- Making importLevel only work in editor mode
- Rewriting the whole game when only a focused patch is needed

Before finishing, verify this checklist:
- Normal play still works with no editor UI visible
- enterEditorMode() reveals the editor tools
- The game can place and delete the right kind of level objects
- TEST LEVEL works
- BACK TO EDITOR works
- exportLevelData() returns full structured level data
- importLevel(data) fully restores a saved level
- VG.notifyReady() is called
- VG.onEnterEditMode(), VG.onLoadLevel(), and VG.onRequestSave() are all wired
- VG.saveLevel(...) sends name, description, data, and thumbnail when possible

Also include:
- A one-paragraph explanation of what counts as a level in this game
- One example of the exported level object for this game
- A short manual test plan`

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
          <p className="text-sm font-semibold text-[var(--color-text)]">Community Level Editor Setup</p>
          <p className="mt-1 text-xs text-[var(--color-text-secondary)]">
            Best for platformers, puzzle games, track builders, tower defense, and any game where a custom stage changes the play experience.
          </p>
        </div>
        <Sparkles className="mt-0.5 h-4 w-4 text-[var(--color-primary)]" />
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <div className="rounded-md border border-[var(--color-border)] bg-[var(--color-base)] p-3">
          <p className="text-[11px] font-semibold text-[var(--color-primary)]">Great fit</p>
          <p className="mt-2 text-xs text-[var(--color-text-secondary)]">
            Platformers, puzzle games, racing tracks, tower defense, shooters with spawn layouts, and physics sandbox stages.
          </p>
        </div>
        <div className="rounded-md border border-[var(--color-border)] bg-[var(--color-base)] p-3">
          <p className="text-[11px] font-semibold text-[var(--color-text)]">Possible fit</p>
          <p className="mt-2 text-xs text-[var(--color-text-secondary)]">
            Score chasers or arcade loops if players can still design layouts, waves, or obstacle sets that feel like custom stages.
          </p>
        </div>
        <div className="rounded-md border border-[var(--color-border)] bg-[var(--color-base)] p-3">
          <p className="text-[11px] font-semibold text-[var(--color-text)]">Usually weak fit</p>
          <p className="mt-2 text-xs text-[var(--color-text-secondary)]">
            Pure narrative, trivia, or one-button toy experiences with no real stage structure. Start with a smaller custom scenario editor instead.
          </p>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between gap-2">
          <div>
            <p className="text-xs font-medium text-[var(--color-text)]">Quick prompt for your coding AI</p>
            <p className="text-[11px] text-[var(--color-text-secondary)]">
              This version pushes the AI to inspect the existing game first and make a focused patch instead of rewriting everything.
            </p>
          </div>
          <Button type="button" size="sm" variant="outline" onClick={() => void copy("quick")}>
            {copied === "quick" ? <Check className="mr-1 h-4 w-4" /> : <Copy className="mr-1 h-4 w-4" />}
            {copied === "quick" ? "Copied" : "Copy prompt"}
          </Button>
        </div>
        <Textarea readOnly value={LEVEL_EDITOR_QUICK_PROMPT} className="min-h-[250px] text-xs" />
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

      <div className="rounded-md border border-[var(--color-border)] bg-[var(--color-base)] p-3">
        <p className="text-xs font-medium text-[var(--color-text)]">Recommended workflow</p>
        <ol className="mt-2 list-decimal space-y-1 pl-4 text-xs text-[var(--color-text-secondary)]">
          <li>Paste the quick prompt into your coding AI.</li>
          <li>Add one genre booster if your game matches it.</li>
          <li>Apply the patch to your local game project, not just a copy-pasted demo.</li>
          <li>Verify normal play still works with zero editor UI visible.</li>
          <li>Upload the updated build, open the VibeGames editor, and test enter editor, load, test/play, back to editor, and save.</li>
          <li>If the shell reports missing hooks, paste the exact error back into your AI and ask for a minimal follow-up fix.</li>
        </ol>
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
          <Textarea readOnly value={MANUAL_SNIPPET} className="min-h-[220px] font-mono text-xs" />
        </div>
      </details>

      <p className="text-[11px] text-[var(--color-text-tertiary)]">
        VibeGames injects the SDK automatically when this option is enabled. Your game still needs to call the hooks above so the editor shell can load and save community levels.
      </p>
    </div>
  )
}
