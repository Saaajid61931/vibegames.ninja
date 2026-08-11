"use client"

import { useState } from "react"
import { Check, Copy, Ghost, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"

const GHOST_SHARING_QUICK_PROMPT = `You are adding VibeGames ghost sharing support to an existing HTML5 browser game.

Work in small steps and make the smallest possible patch.
Do not rewrite unrelated systems.

Before coding:
1. Inspect the current game and explain whether it can deterministically replay a completed run from structured data.
2. If it cannot, say so clearly and stop. Do not fake ghost support.
3. If it can, identify the smallest replay payload that can restore a race ghost.

Then implement:
- VG.notifyGhostReady() once replay hooks are bound
- VG.onLoadGhost(function (payload) { ... }) to load payload.ghost.replayData into the game replay/race system
- VG.saveGhostRun({ durationMs, replayData, replayVersion, checksum }) when a run finishes successfully
- a replay format version so incompatible future ghosts can be rejected safely

Rules:
- ghost sharing is separate from level editor
- do not add best-effort screen recording or approximate replays
- only enable this if the replay is deterministic
- keep replay data compact
- do not inject the VibeGames SDK manually; window.VG is already provided by the platform
- return only changed files or patch-style edits plus a short manual test plan`

const GHOST_SHARING_ADVANCED_PROMPT = `You are adding VibeGames ghost sharing support to an existing HTML5 browser game.

Goal:
Let players save a finished run as a deterministic ghost, load a selected ghost from the platform, and race against it through an in-game replay system.

Requirements:
1. Determine whether the game can support deterministic replay from structured data.
2. If yes, implement a compact replay payload and version it.
3. Bind VG.notifyGhostReady() after the replay hooks are active.
4. Bind VG.onLoadGhost(...) and load payload.ghost.replayData into the replay/race system.
5. Call VG.saveGhostRun({ durationMs, replayData, replayVersion, checksum }) on successful completion.

Common mistakes to avoid:
- using non-deterministic frame captures instead of replay data
- trying to support ghosts in games that cannot replay accurately
- mixing level-editor save data with ghost replay data
- forgetting replayVersion

Also include:
- one short explanation of why the replay is deterministic
- one example of the replay payload
- a short manual test plan`

const GHOST_SHARING_MANUAL_SNIPPET = `// VibeGames ghost sharing integration
// Implement: loadGhostReplay(replayData), buildReplayData(), checksumReplay?(replayData)

let vgGhostBound = false;

function bindVGGhostHooks() {
  if (vgGhostBound || !window.VG) return;
  vgGhostBound = true;

  window.VG.notifyGhostReady();

  window.VG.onLoadGhost(function (payload) {
    const ghost = payload.ghost;
    if (ghost && ghost.replayData) {
      loadGhostReplay(ghost.replayData);
    }
  });
}

function reportGhostRun(durationMs) {
  if (!window.VG) return;

  const replayData = buildReplayData();
  window.VG.saveGhostRun({
    durationMs,
    replayData,
    replayVersion: "v1",
    checksum: typeof checksumReplay === "function" ? checksumReplay(replayData) : undefined,
  });
}

if (window.VG) {
  bindVGGhostHooks();
} else {
  window.addEventListener("VG_SDK_READY", bindVGGhostHooks, { once: true });
}`

type CopyValue = "quick" | "advanced" | "manual"

async function copyText(text: string) {
  await navigator.clipboard.writeText(text)
}

export function GhostSharingSetupGuide() {
  const [copied, setCopied] = useState<CopyValue | null>(null)

  const copyMap: Record<CopyValue, string> = {
    quick: GHOST_SHARING_QUICK_PROMPT,
    advanced: GHOST_SHARING_ADVANCED_PROMPT,
    manual: GHOST_SHARING_MANUAL_SNIPPET,
  }

  const copy = async (value: CopyValue) => {
    await copyText(copyMap[value])
    setCopied(value)
    window.setTimeout(() => {
      setCopied((prev) => (prev === value ? null : prev))
    }, 1200)
  }

  return (
    <div className="space-y-4 rounded-md border border-border bg-surface p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-text">Ghost Sharing Setup</p>
          <p className="mt-1 text-xs text-text-secondary">
            Use this when the game can deterministically replay a completed run from structured data. This feature is separate from level editor.
          </p>
        </div>
        <Sparkles className="mt-0.5 h-4 w-4 text-primary-text" />
      </div>

      <div className="rounded-md border border-border bg-canvas p-3">
        <div className="flex items-center gap-2">
          <Ghost className="h-4 w-4 text-primary-text" />
          <p className="text-xs font-medium text-text">When to use it</p>
        </div>
        <p className="mt-2 text-xs text-text-secondary">
          Great for racing, speedrunning, precision platformers, time attacks, and any skill game where the exact same run can be replayed reliably.
        </p>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between gap-2">
          <div>
            <p className="text-xs font-medium text-text">Quick prompt for your coding AI</p>
            <p className="text-xs text-text-secondary">
              This forces the model to prove the replay is deterministic before wiring the ghost hooks.
            </p>
          </div>
          <Button type="button" size="sm" variant="outline" onClick={() => void copy("quick")}>
            {copied === "quick" ? <Check className="mr-1 h-4 w-4" /> : <Copy className="mr-1 h-4 w-4" />}
            {copied === "quick" ? "Copied" : "Copy prompt"}
          </Button>
        </div>
        <Textarea readOnly value={GHOST_SHARING_QUICK_PROMPT} className="min-h-[250px] text-xs" />
      </div>

      <details className="rounded-md border border-border bg-canvas p-3">
        <summary className="cursor-pointer text-xs font-medium text-text">
          Advanced prompt
        </summary>
        <div className="mt-3 space-y-2">
          <div className="flex items-center justify-end">
            <Button type="button" size="sm" variant="outline" onClick={() => void copy("advanced")}>
              {copied === "advanced" ? <Check className="mr-1 h-4 w-4" /> : <Copy className="mr-1 h-4 w-4" />}
              {copied === "advanced" ? "Copied" : "Copy advanced"}
            </Button>
          </div>
          <Textarea readOnly value={GHOST_SHARING_ADVANCED_PROMPT} className="min-h-[220px] text-xs" />
        </div>
      </details>

      <details className="rounded-md border border-border bg-canvas p-3">
        <summary className="cursor-pointer text-xs font-medium text-text">
          Manual hook snippet
        </summary>
        <div className="mt-3 space-y-2">
          <div className="flex items-center justify-end">
            <Button type="button" size="sm" variant="outline" onClick={() => void copy("manual")}>
              {copied === "manual" ? <Check className="mr-1 h-4 w-4" /> : <Copy className="mr-1 h-4 w-4" />}
              {copied === "manual" ? "Copied" : "Copy snippet"}
            </Button>
          </div>
          <Textarea readOnly value={GHOST_SHARING_MANUAL_SNIPPET} className="min-h-[220px] font-mono text-xs" />
        </div>
      </details>

      <p className="text-xs text-text-tertiary">
        VibeGames injects the SDK automatically when ghost sharing is enabled. Your game still needs to bind the replay hooks above so the play page can load and save ghosts.
      </p>
    </div>
  )
}
