"use client"

import { useState } from "react"
import { Check, Copy, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"

const LEVEL_EDITOR_SINGLE_PROMPT = `You are adding VibeGames community level editor support to an existing HTML5 browser game.

=== WHAT YOU ARE BUILDING ===

Players will create custom levels in a visual editor inside the game. The VibeGames platform handles saving, loading, and sharing. Your game needs:
1. An EDITOR MODE with UI for building levels (place, remove, configure game objects).
2. A function called exportLevelData() that returns the full level state as a plain JavaScript object (NOT a JSON string).
3. A function called importLevel(data) that fully restores a level from that object.
4. SDK hook calls that connect these functions to the VibeGames platform.

=== RULES ===

- Keep ALL existing gameplay working exactly as before.
- Editor mode must be completely HIDDEN during normal play. No editor buttons, no debug keys, no URL params, no auto-enable.
- Editor mode is ONLY activated when the platform calls your VG.onEnterEditMode handler. Never auto-enable it.
- Add a TEST/PLAY button inside the editor so users can playtest their level, and a BACK TO EDITOR button to return to editing.
- The VibeGames SDK (window.VG) is auto-injected by the platform. Do NOT add any <script> tag for it. Do NOT import or load vibegames-sdk.js yourself.

=== EDITOR UI ===

Create editor tools appropriate for THIS specific game. Think about what objects exist in the game and let the user place/remove/configure them. Examples by genre:

- Platformer/runner: tile palette, enemy placement, spawn point, goal/finish line, obstacle types
- Puzzle game: cell/piece configuration, board size, solution setup, move limits
- Tower defense: path waypoints, wave editor, tower placement zones, enemy types per wave
- Racing game: track segments, checkpoints, walls/barriers, start/finish position
- Shooter/action: enemy spawn points, obstacle layout, power-up locations, boss triggers
- Physics game: object placement (shapes, ramps, springs), goal target area

At minimum the editor needs:
- A way to ADD game objects or elements
- A way to REMOVE or DELETE them
- A visible toolbar or panel that appears ONLY in editor mode
- A TEST LEVEL button to playtest the level in-game
- A BACK TO EDITOR button shown after testing to return to editing

=== DATA CONTRACT (CRITICAL) ===

exportLevelData() must return a plain JavaScript object or array. This object must contain ALL information needed to fully recreate the level from scratch.

IMPORTANT: Return the raw object. Do NOT call JSON.stringify(). The platform handles serialization.

Example return values:

  Platformer: { spawnX: 100, spawnY: 300, objects: [{x:200, y:340, type:"block"}, {x:400, y:340, type:"spike"}], goalX: 2800 }
  Puzzle:     { width: 8, height: 8, cells: [[1,0,2], [0,1,0]], maxMoves: 20 }
  Defense:    { path: [{x:0,y:5}, {x:10,y:5}], waves: [{type:"basic", count:5}] }

importLevel(data) receives the exact same object that exportLevelData() returned. It must fully restore the game/editor state: every object, position, and setting. The data parameter is always a parsed object, never a string.

=== SDK INTEGRATION (follow this pattern exactly) ===

Place this code at the END of your main game script:

  let editorMode = false;
  let vgBound = false;
  let currentLevelName = "";
  let currentLevelDescription = "";

  function bindVGHooks() {
    if (vgBound || !window.VG) return;
    vgBound = true;

    // 1. Tell the platform we are ready
    window.VG.notifyReady();

    // 2. If editor mode was already activated before we bound, enter now
    if (window.VG.mode === "editor") {
      enterEditorMode();
    }

    // 3. Platform requests editor mode
    window.VG.onEnterEditMode(function() {
      enterEditorMode();
    });

    // 4. Platform sends a saved level to load
    //    level = { data: <your object>, name: "...", description: "..." }
    window.VG.onLoadLevel(function(payload) {
      var level = payload.level;
      if (level && level.data) {
        importLevel(level.data);
        currentLevelName = level.name || "";
        currentLevelDescription = level.description || "";
      }
    });

    // 5. Platform asks game to save current level state
    window.VG.onRequestSave(function() {
      var data = exportLevelData(); // MUST return object, NOT string
      var thumbnail;
      try {
        var canvas = document.querySelector('canvas');
        if (canvas) thumbnail = canvas.toDataURL('image/jpeg', 0.6);
      } catch(e) {}
      window.VG.saveLevel({
        name: currentLevelName || "Custom Level",
        description: currentLevelDescription || "",
        data: data,
        thumbnail: thumbnail,
      });
    });
  }

  // Bind now if SDK ready, otherwise wait for event
  if (window.VG) {
    bindVGHooks();
  } else {
    window.addEventListener("VG_SDK_READY", bindVGHooks, { once: true });
  }

=== COMMON MISTAKES (avoid all of these) ===

1. Using JSON.stringify() in exportLevelData — return the raw object, not a string.
2. Adding a level editor button to the game menu — editor is ONLY triggered by the platform.
3. Forgetting VG.notifyReady() — the platform waits for this signal before sending commands.
4. Only checking if(window.VG){} without VG_SDK_READY fallback — the SDK may load after your code runs.
5. Showing editor toolbar in play mode — all editor UI must be hidden until onEnterEditMode fires.
6. Writing importLevel to only work in editor mode — it must also work in play mode (for loading community levels to play).
7. Using level.data.data instead of level.data in onLoadLevel — level.data IS your exported object directly.
8. Forgetting the thumbnail — always try to capture canvas.toDataURL in onRequestSave.

=== FINAL CHECKLIST ===

Before returning code, verify:
[ ] Game plays normally with zero editor UI visible
[ ] enterEditorMode() shows editor toolbar and enables editing controls
[ ] Editor has tools to add and remove level elements appropriate for this game
[ ] TEST LEVEL button lets user play the edited level
[ ] BACK TO EDITOR button returns to editing after testing
[ ] exportLevelData() returns a plain object with full level state
[ ] importLevel(data) fully recreates a level from that object in both editor and play mode
[ ] VG.notifyReady() is called on startup
[ ] VG.onEnterEditMode handler activates editor mode
[ ] VG.onLoadLevel handler uses level.data (not level directly) to import
[ ] VG.onRequestSave handler calls exportLevelData() then VG.saveLevel with data, name, description, thumbnail
[ ] VG_SDK_READY event fallback is implemented
[ ] No editor buttons, keys, or toggles exist outside of platform-triggered editor mode

Return the complete updated game code with clear comments marking where VibeGames integration was added.`

const MANUAL_SNIPPET = `// ── VibeGames Level Editor Integration ──
// Place this at the END of your main game script.
// You must implement: enterEditorMode(), exportLevelData(), importLevel(data)

var editorMode = false;
var vgBound = false;
var currentLevelName = "";
var currentLevelDescription = "";

function bindVGHooks() {
  if (vgBound || !window.VG) return;
  vgBound = true;

  // Tell the platform we are ready
  window.VG.notifyReady();

  // If editor mode was already set before binding, activate now
  if (window.VG.mode === "editor") {
    enterEditorMode();
  }

  // Platform requests editor mode
  window.VG.onEnterEditMode(function() {
    enterEditorMode();
  });

  // Platform sends a saved level to load
  // level = { data: <your object>, name: string, description: string }
  window.VG.onLoadLevel(function(payload) {
    var level = payload.level;
    if (level && level.data) {
      importLevel(level.data);
      currentLevelName = level.name || "";
      currentLevelDescription = level.description || "";
    }
  });

  // Platform asks game to save current level
  window.VG.onRequestSave(function() {
    var data = exportLevelData(); // MUST return object, NOT string
    var thumbnail;
    try {
      var canvas = document.querySelector('canvas');
      if (canvas) thumbnail = canvas.toDataURL('image/jpeg', 0.6);
    } catch(e) {}
    window.VG.saveLevel({
      name: currentLevelName || "Custom Level",
      description: currentLevelDescription || "",
      data: data,
      thumbnail: thumbnail,
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
