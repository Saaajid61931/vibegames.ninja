"use client"

import { useState } from "react"
import { Check, Copy, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"

const LEVEL_EDITOR_SINGLE_PROMPT = `You are helping me upgrade an existing HTML5 game for VibeGames community levels.

Task:
1) Add a visual level editor mode to this game.
2) Integrate VibeGames level save/load hooks.

Requirements:
- Keep existing gameplay and controls working.
- Add an editor mode with tools to place/remove tiles and entities (at least spawn and goal).
- Editor UI must be hidden during normal play.
- Editor UI must ONLY appear when editor mode is requested by the platform via VG.onEnterEditMode().
- Do NOT add any local editor toggle, debug key, URL parameter, or auto-enable path for editor mode.
- Add a test/play toggle so the user can playtest the edited level.
- Implement an export function that returns the full level state as a JSON-safe object/array (not a string).
- Implement an import function that can load that JSON back into the game/editor.

VibeGames SDK integration:
- The platform injects window.VG automatically, so do NOT import any SDK file.
- Guard all calls: only run if (window.VG) exists.
- Make integration resilient: if window.VG is not ready on first tick, listen for the VG_SDK_READY event and bind hooks then.
- Do NOT rely on a one-time if(window.VG){...} block without fallback.
- Assume play mode by default. Keep editor interactions disabled until editor mode is active.
- window.VG.mode is available as "play" or "editor". Use it for read-only checks if needed.
- On startup call: VG.notifyReady()
- Handle entering editor mode: VG.onEnterEditMode(() => { open editor mode })
- Handle loading a saved level: VG.onLoadLevel(({ level }) => { importLevel(level) })
- Handle platform save request: VG.onRequestSave(() => {
    const data = exportLevelData();
    VG.saveLevel({
      name: currentLevelName || "Custom Level",
      description: currentLevelDescription || "",
      data,
    });
  })

Important:
- Keep level JSON compact and deterministic.
- Preserve backwards compatibility with existing default level.
- If no editor UI exists yet, create a simple one and wire it to the above hooks.
- Keep editor controls disabled/hidden unless editor mode is active.
- Never render editor-only controls in normal play mode.
- Return the final updated code files with clear comments where hooks were added.`

const MANUAL_SNIPPET = `let editorMode = false;
let vgBound = false;

function setEditorMode(enabled) {
  editorMode = enabled;
  // show/hide editor toolbar and enable/disable editing interactions
}

function bindVGHooks() {
  if (vgBound || !window.VG) {
    return;
  }
  vgBound = true;

  if (window.VG.mode === "editor") {
    setEditorMode(true);
  }

  window.VG.notifyReady();

  window.VG.onEnterEditMode(() => {
    setEditorMode(true);
  });

  window.VG.onLoadLevel(({ level }) => {
    importLevel(level);
  });

  window.VG.onRequestSave(() => {
    const data = exportLevelData();
    window.VG.saveLevel({
      name: currentLevelName || "Custom Level",
      description: currentLevelDescription || "",
      data,
    });
  });
}

if (window.VG) {
  bindVGHooks();
} else {
  window.addEventListener("VG_SDK_READY", bindVGHooks, { once: true });
}`

async function copyText(text: string) {
  await navigator.clipboard.writeText(text)
}

export function LevelEditorSetupGuide() {
  const [copied, setCopied] = useState<"prompt" | "manual" | null>(null)

  const copy = async (value: "prompt" | "manual") => {
    const payload = value === "prompt" ? LEVEL_EDITOR_SINGLE_PROMPT : MANUAL_SNIPPET
    await copyText(payload)
    setCopied(value)
    window.setTimeout(() => {
      setCopied((prev) => (prev === value ? null : prev))
    }, 1200)
  }

  return (
    <div className="space-y-3 rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-[var(--color-text)]">Level Editor Setup</p>
          <p className="text-xs text-[var(--color-text-secondary)] mt-1">
            Fastest path: copy this prompt into your AI tool, apply changes, then upload.
          </p>
        </div>
        <Sparkles className="h-4 w-4 text-[var(--color-primary)] mt-0.5" />
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs font-medium text-[var(--color-text)]">Single AI prompt</p>
          <Button type="button" size="sm" variant="outline" onClick={() => void copy("prompt")}>
            {copied === "prompt" ? <Check className="h-4 w-4 mr-1" /> : <Copy className="h-4 w-4 mr-1" />}
            {copied === "prompt" ? "Copied" : "Copy prompt"}
          </Button>
        </div>
        <Textarea readOnly value={LEVEL_EDITOR_SINGLE_PROMPT} className="min-h-[240px] text-xs" />
      </div>

      <div className="rounded-md border border-[var(--color-border)] bg-[var(--color-base)] p-3">
        <p className="text-xs font-medium text-[var(--color-text)]">After your AI gives output (baby steps)</p>
        <ol className="mt-2 space-y-1 text-xs text-[var(--color-text-secondary)] list-decimal pl-4">
          <li>Copy the AI changes into your game project files.</li>
          <li>Confirm your game still runs and the editor can only be opened from the VibeGames Level Editor window (not normal play mode).</li>
          <li>Confirm these files exist in your final game package:</li>
        </ol>
        <pre className="mt-2 overflow-x-auto rounded border border-[var(--color-border)] bg-[var(--color-surface)] p-2 text-[11px] text-[var(--color-text-secondary)]">{`your-game/
  index.html            (required)
  game.js or main.js    (updated)
  editor.js             (optional, if AI creates one)
  assets/...            (optional)`}</pre>
        <ol className="mt-2 space-y-1 text-xs text-[var(--color-text-secondary)] list-decimal pl-4" start={4}>
          <li>If your game is one file, upload that single <code>index.html</code>.</li>
          <li>If your game has multiple files, zip the folder so <code>index.html</code> is at zip root.</li>
          <li>Re-upload the new file above (or in Edit Game, upload a new game file and save changes).</li>
          <li>After upload, open your game in VibeGames Level Editor and verify all editor features work (enter editor mode, place/remove items, test/play toggle, and save).</li>
          <li>If anything is broken or you see hook warnings, paste the exact issue back into your AI and ask it to fix only the level editor integration.</li>
        </ol>
      </div>

      <details className="rounded-md border border-[var(--color-border)] bg-[var(--color-base)] p-3">
        <summary className="cursor-pointer text-xs font-medium text-[var(--color-text)]">
          Manual integration snippet (optional)
        </summary>
        <div className="space-y-2 mt-3">
          <div className="flex items-center justify-end">
            <Button type="button" size="sm" variant="outline" onClick={() => void copy("manual")}>
              {copied === "manual" ? <Check className="h-4 w-4 mr-1" /> : <Copy className="h-4 w-4 mr-1" />}
              {copied === "manual" ? "Copied" : "Copy snippet"}
            </Button>
          </div>
          <Textarea readOnly value={MANUAL_SNIPPET} className="min-h-[180px] text-xs font-mono" />
        </div>
      </details>

      <p className="text-[11px] text-[var(--color-text-tertiary)]">
        VibeGames injects the SDK automatically when this checkbox is enabled, but your game still needs the hook calls above.
      </p>
    </div>
  )
}
