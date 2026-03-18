import type { MobileOrientation } from "@/lib/mobile-orientation"
import { renderArenaGameScript } from "@/lib/builder/renderers/arena"
import { renderFlappyGameScript } from "@/lib/builder/renderers/flappy"
import { renderPuzzleGameScript } from "@/lib/builder/renderers/puzzle"
import { renderRunnerGameScript } from "@/lib/builder/renderers/runner"
import {
  BUILDER_QUICK_ACTIONS,
  type BuilderGameConfig,
  type BuilderPalette,
  type BuilderQuickActionKey,
  type BuilderTemplateKey,
  type BuilderTemplateSummary,
  type BuilderThemeKey,
} from "@/lib/builder/types"

const THEME_PRESETS: Record<BuilderThemeKey, BuilderPalette> = {
  neon: { bg: "#050816", panel: "#10172d", text: "#f6fbff", accent: "#00e5ff", accent2: "#ff4f9f" },
  sunset: { bg: "#1b1027", panel: "#2a1738", text: "#fff7ed", accent: "#ff8f3f", accent2: "#ffd447" },
  forest: { bg: "#07170e", panel: "#0f2419", text: "#f3fff5", accent: "#3edb7a", accent2: "#8de44f" },
  candy: { bg: "#26122a", panel: "#3a1c40", text: "#fff7ff", accent: "#ff6ad5", accent2: "#7ef3ff" },
  midnight: { bg: "#0a0f1b", panel: "#131d31", text: "#edf3ff", accent: "#7ab8ff", accent2: "#a58bff" },
  ember: { bg: "#160806", panel: "#29120d", text: "#fff3ef", accent: "#ff6b2c", accent2: "#ffcb45" },
  ocean: { bg: "#07131f", panel: "#102333", text: "#effcff", accent: "#43d4ff", accent2: "#65f0b7" },
}

const QUICK_ACTION_KEYS = BUILDER_QUICK_ACTIONS.map((action) => action.key) as BuilderQuickActionKey[]

const TEMPLATE_SUMMARIES: Record<BuilderTemplateKey, BuilderTemplateSummary> = {
  "endless-runner": {
    key: "endless-runner",
    label: "Endless Runner",
    eyebrow: "FAST STARTER",
    description: "A side-scrolling dodge-and-jump loop built for quick runs, streaky scores, and juicy near-misses.",
    category: "ARCADE",
    defaultTitle: "Neon Sprint",
    defaultDescription: "Dash through a glowing obstacle lane, string together clean jumps, and chase a hotter high score every run.",
    defaultTags: ["runner", "arcade", "score chase", "reflex"],
    supportsMobile: true,
    mobileOrientation: "LANDSCAPE",
    quickActions: QUICK_ACTION_KEYS,
  },
  "tap-survival": {
    key: "tap-survival",
    label: "Tap Survival",
    eyebrow: "PHONE FRIENDLY",
    description: "A vertical flap-and-dodge starter tuned for fast retries, one-thumb control, and streamable runs.",
    category: "CASUAL",
    defaultTitle: "Sky Hop",
    defaultDescription: "Keep a tiny flyer in the air, thread clean gaps, and turn every tap into just-one-more-run energy.",
    defaultTags: ["flappy", "mobile", "tap", "survival"],
    supportsMobile: true,
    mobileOrientation: "PORTRAIT",
    quickActions: QUICK_ACTION_KEYS,
  },
  "arena-shooter": {
    key: "arena-shooter",
    label: "Arena Shooter",
    eyebrow: "SURVIVE WAVES",
    description: "A top-down survival loop with auto-fire, readable chaos, and room for strong juice and combo tuning.",
    category: "ACTION",
    defaultTitle: "Core Siege",
    defaultDescription: "Circle the arena, survive incoming swarms, and keep your streak alive long enough to own the room.",
    defaultTags: ["arena", "shooter", "survival", "waves"],
    supportsMobile: true,
    mobileOrientation: "LANDSCAPE",
    quickActions: QUICK_ACTION_KEYS,
  },
  "tile-puzzle": {
    key: "tile-puzzle",
    label: "Tile Puzzle",
    eyebrow: "THINKY LOOP",
    description: "A tactile grid puzzler where every tap flips neighboring tiles and the board wants one more try.",
    category: "PUZZLE",
    defaultTitle: "Glow Grid",
    defaultDescription: "Flip the board into a single glowing state, solve fast, and chase smoother clears with every restart.",
    defaultTags: ["puzzle", "grid", "logic", "mobile"],
    supportsMobile: true,
    mobileOrientation: "PORTRAIT",
    quickActions: QUICK_ACTION_KEYS,
  },
}

function clampDifficulty(value: number) {
  return Math.max(1, Math.min(10, Math.round(value)))
}

function sanitizeTags(tags: unknown, fallback: string[]) {
  if (!Array.isArray(tags)) {
    return fallback
  }

  const seen = new Set<string>()
  const normalized = tags
    .map((tag) => (typeof tag === "string" ? tag.trim().toLowerCase() : ""))
    .filter(Boolean)
    .filter((tag) => {
      if (seen.has(tag)) {
        return false
      }

      seen.add(tag)
      return true
    })

  return normalized.length > 0 ? normalized.slice(0, 8) : fallback
}

function sanitizeOrientation(value: unknown, fallback: MobileOrientation): MobileOrientation {
  if (value === "PORTRAIT" || value === "LANDSCAPE" || value === "BOTH") {
    return value
  }

  return fallback
}

function getBaseConfig(templateKey: BuilderTemplateKey): BuilderGameConfig {
  const summary = TEMPLATE_SUMMARIES[templateKey]
  const defaultTheme: BuilderThemeKey =
    templateKey === "tap-survival" ? "sunset" : templateKey === "arena-shooter" ? "ember" : templateKey === "tile-puzzle" ? "ocean" : "neon"

  return retuneBuilderConfig({
    templateKey,
    title: summary.defaultTitle,
    description: summary.defaultDescription,
    category: summary.category,
    tags: summary.defaultTags,
    theme: defaultTheme,
    supportsMobile: summary.supportsMobile,
    mobileOrientation: summary.mobileOrientation,
    juicy: templateKey !== "tile-puzzle",
    scoreCombo: templateKey !== "tile-puzzle",
    restartPolish: true,
    difficulty: templateKey === "arena-shooter" ? 6 : 5,
    controlsHint:
      templateKey === "arena-shooter"
        ? "WASD or arrow keys to move. Drag on touch. Auto-fire handles the rest."
        : templateKey === "tap-survival"
          ? "Tap, click, or press Space to flap and squeeze through the gaps."
          : templateKey === "tile-puzzle"
            ? "Tap any tile to flip it and its neighbors. Clear the board in as few moves as possible."
            : "Tap, click, or press Space to jump over incoming obstacles.",
    palette: THEME_PRESETS[defaultTheme],
    gameplay: {
      speed: 6,
      obstacleRate: 1400,
      jumpPower: 15,
      gravity: 0.9,
      gapSize: 185,
      playerSpeed: 4.8,
      enemySpeed: 1.25,
      enemySpawnMs: 1200,
      fireRateMs: 340,
      maxHealth: 6,
      gridSize: 5,
      shuffleMoves: 18,
    },
  })
}

export function getBuilderTemplates() {
  return Object.values(TEMPLATE_SUMMARIES)
}

export function getBuilderTemplate(templateKey: BuilderTemplateKey) {
  return TEMPLATE_SUMMARIES[templateKey]
}

export function createBuilderDefaultConfig(templateKey: BuilderTemplateKey) {
  return getBaseConfig(templateKey)
}

export function retuneBuilderConfig(config: BuilderGameConfig): BuilderGameConfig {
  const tuned = structuredClone(config)
  tuned.difficulty = clampDifficulty(tuned.difficulty)
  tuned.palette = THEME_PRESETS[tuned.theme]

  switch (tuned.templateKey) {
    case "endless-runner":
      tuned.gameplay.speed = 5 + tuned.difficulty * 0.8
      tuned.gameplay.obstacleRate = Math.max(700, 1700 - tuned.difficulty * 95)
      tuned.gameplay.jumpPower = 14.8 + Math.max(0, 6 - tuned.difficulty) * 0.12
      tuned.gameplay.gravity = 0.82 + tuned.difficulty * 0.05
      tuned.controlsHint = tuned.supportsMobile
        ? "Tap, click, or press Space to jump. Stay low and keep the streak alive."
        : tuned.controlsHint
      break
    case "tap-survival":
      tuned.gameplay.speed = 3 + tuned.difficulty * 0.32
      tuned.gameplay.gapSize = Math.max(120, 240 - tuned.difficulty * 11)
      tuned.gameplay.jumpPower = 11.5 + Math.max(0, 6 - tuned.difficulty) * 0.15
      tuned.gameplay.gravity = 0.42 + tuned.difficulty * 0.03
      tuned.controlsHint = "Tap, click, or press Space to flap. Thread the cleanest line you can."
      break
    case "arena-shooter":
      tuned.gameplay.playerSpeed = 4.2 + Math.max(0, 6 - tuned.difficulty) * 0.15
      tuned.gameplay.enemySpeed = 0.7 + tuned.difficulty * 0.16
      tuned.gameplay.enemySpawnMs = Math.max(420, 1650 - tuned.difficulty * 120)
      tuned.gameplay.fireRateMs = Math.max(160, 420 - tuned.difficulty * 12 - (tuned.scoreCombo ? 18 : 0))
      tuned.gameplay.maxHealth = Math.max(2, 8 - Math.floor((tuned.difficulty - 1) / 2))
      tuned.controlsHint = tuned.supportsMobile
        ? "Drag to steer on touch, or use WASD / arrow keys on desktop. Auto-fire tracks targets."
        : "Use WASD or arrow keys to move. Auto-fire keeps the pressure on."
      break
    case "tile-puzzle":
      tuned.gameplay.gridSize = tuned.difficulty >= 8 ? 6 : tuned.difficulty >= 4 ? 5 : 4
      tuned.gameplay.shuffleMoves = 10 + tuned.difficulty * 4
      tuned.controlsHint = "Tap or click tiles to flip them and their neighbors until the whole board glows."
      break
  }

  return tuned
}

export function coerceBuilderConfig(templateKey: BuilderTemplateKey, value: unknown): BuilderGameConfig {
  const fallback = getBaseConfig(templateKey)
  if (!value || typeof value !== "object") {
    return fallback
  }

  const candidate = value as Partial<BuilderGameConfig>
  const next: BuilderGameConfig = {
    ...fallback,
    ...candidate,
    templateKey,
    title: typeof candidate.title === "string" && candidate.title.trim() ? candidate.title.trim().slice(0, 80) : fallback.title,
    description:
      typeof candidate.description === "string" && candidate.description.trim()
        ? candidate.description.trim().slice(0, 240)
        : fallback.description,
    category: typeof candidate.category === "string" && candidate.category.trim() ? candidate.category.trim().toUpperCase() : fallback.category,
    tags: sanitizeTags(candidate.tags, fallback.tags),
    theme: candidate.theme && candidate.theme in THEME_PRESETS ? (candidate.theme as BuilderThemeKey) : fallback.theme,
    supportsMobile: typeof candidate.supportsMobile === "boolean" ? candidate.supportsMobile : fallback.supportsMobile,
    mobileOrientation: sanitizeOrientation(candidate.mobileOrientation, fallback.mobileOrientation),
    juicy: typeof candidate.juicy === "boolean" ? candidate.juicy : fallback.juicy,
    scoreCombo: typeof candidate.scoreCombo === "boolean" ? candidate.scoreCombo : fallback.scoreCombo,
    restartPolish: typeof candidate.restartPolish === "boolean" ? candidate.restartPolish : fallback.restartPolish,
    difficulty: clampDifficulty(typeof candidate.difficulty === "number" ? candidate.difficulty : fallback.difficulty),
    controlsHint:
      typeof candidate.controlsHint === "string" && candidate.controlsHint.trim()
        ? candidate.controlsHint.trim().slice(0, 180)
        : fallback.controlsHint,
    palette: candidate.palette && typeof candidate.palette === "object" ? { ...fallback.palette, ...candidate.palette } : fallback.palette,
    gameplay: candidate.gameplay && typeof candidate.gameplay === "object" ? { ...fallback.gameplay, ...candidate.gameplay } : fallback.gameplay,
  }

  return retuneBuilderConfig(next)
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
}

function escapeSvgColor(value: string) {
  return value.replace(/#/g, "%23")
}

export function createBuilderPlaceholderThumbnail(templateKey: BuilderTemplateKey, input: unknown) {
  const config = coerceBuilderConfig(templateKey, input)
  const template = getBuilderTemplate(templateKey)
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="675" viewBox="0 0 1200 675"><defs><linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="${escapeSvgColor(config.palette.bg)}"/><stop offset="100%" stop-color="${escapeSvgColor(config.palette.panel)}"/></linearGradient></defs><rect width="1200" height="675" fill="url(%23bg)"/><rect x="60" y="60" width="1080" height="555" rx="28" fill="${escapeSvgColor(config.palette.panel)}" opacity="0.92"/><rect x="80" y="86" width="220" height="42" rx="21" fill="${escapeSvgColor(config.palette.accent)}"/><text x="110" y="113" fill="${escapeSvgColor(config.palette.bg)}" font-family="Arial, sans-serif" font-size="22" font-weight="700">${escapeHtml(template.eyebrow)}</text><text x="96" y="252" fill="${escapeSvgColor(config.palette.text)}" font-family="Arial, sans-serif" font-size="68" font-weight="800">${escapeHtml(config.title)}</text><text x="96" y="320" fill="${escapeSvgColor(config.palette.accent2)}" font-family="Arial, sans-serif" font-size="28">${escapeHtml(template.label)}</text><text x="96" y="390" fill="${escapeSvgColor(config.palette.text)}" font-family="Arial, sans-serif" font-size="24" opacity="0.88">${escapeHtml(config.description.slice(0, 95))}</text><circle cx="960" cy="220" r="92" fill="${escapeSvgColor(config.palette.accent)}" opacity="0.16"/><circle cx="1010" cy="320" r="64" fill="${escapeSvgColor(config.palette.accent2)}" opacity="0.22"/><circle cx="888" cy="370" r="42" fill="${escapeSvgColor(config.palette.accent)}" opacity="0.2"/></svg>`
  return `data:image/svg+xml;charset=UTF-8,${svg}`
}

function scriptSafeJson(value: unknown) {
  return JSON.stringify(value).replace(/</g, "\\u003c")
}

function getTemplateScript(templateKey: BuilderTemplateKey) {
  switch (templateKey) {
    case "tap-survival":
      return renderFlappyGameScript()
    case "arena-shooter":
      return renderArenaGameScript()
    case "tile-puzzle":
      return renderPuzzleGameScript()
    default:
      return renderRunnerGameScript()
  }
}

export function renderBuilderGameHtml(templateKey: BuilderTemplateKey, input: unknown) {
  const config = coerceBuilderConfig(templateKey, input)
  const summary = getBuilderTemplate(templateKey)
  const isPortrait = config.mobileOrientation === "PORTRAIT"
  const logicalWidth = isPortrait ? 540 : 960
  const logicalHeight = isPortrait ? 960 : 540
  const safeConfig = scriptSafeJson(config)
  const title = escapeHtml(config.title)
  const description = escapeHtml(config.description)
  const gameScript = getTemplateScript(templateKey)

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover" />
    <title>${title}</title>
    <style>
      :root { --bg: ${config.palette.bg}; --panel: ${config.palette.panel}; --text: ${config.palette.text}; --accent: ${config.palette.accent}; --accent2: ${config.palette.accent2}; }
      * { box-sizing: border-box; }
      html, body { margin: 0; min-height: 100%; background: radial-gradient(circle at top, rgba(255,255,255,0.08), transparent 42%), linear-gradient(180deg, var(--panel), var(--bg)); color: var(--text); font-family: Inter, Arial, sans-serif; overflow: hidden; touch-action: none; }
      body { display: grid; place-items: center; }
      #shell { position: relative; width: 100%; height: 100%; display: grid; place-items: center; padding: 18px; }
      #frame { position: relative; width: min(100vw - 24px, ${isPortrait ? "min(60vh, 420px)" : "100vw - 24px"}); height: min(100vh - 24px, ${isPortrait ? "100vh - 24px" : "min(56.25vw, 100vh - 24px)"}); max-width: 100%; max-height: 100%; display: grid; place-items: center; }
      canvas { width: 100%; height: 100%; background: linear-gradient(180deg, color-mix(in srgb, var(--panel) 88%, black), var(--bg)); border: 2px solid color-mix(in srgb, var(--accent2) 40%, white); border-radius: 24px; box-shadow: 0 18px 60px rgba(0,0,0,0.45), inset 0 0 0 1px rgba(255,255,255,0.08); }
      #hud { position: absolute; inset: 16px; pointer-events: none; display: flex; flex-direction: column; justify-content: space-between; }
      .topbar { display: flex; justify-content: space-between; gap: 12px; }
      .pill, .panel { backdrop-filter: blur(10px); background: color-mix(in srgb, var(--panel) 80%, black); border: 1px solid rgba(255,255,255,0.08); color: var(--text); }
      .pill { display: inline-flex; align-items: center; gap: 8px; padding: 10px 14px; border-radius: 999px; font-size: 12px; letter-spacing: 0.08em; text-transform: uppercase; }
      .panel { max-width: 72%; padding: 14px 16px; border-radius: 18px; }
      .panel h1 { margin: 0 0 6px; font-size: 14px; letter-spacing: 0.12em; text-transform: uppercase; }
      .panel p { margin: 0; font-size: 12px; line-height: 1.45; opacity: 0.88; }
      .center-overlay { position: absolute; inset: 0; display: grid; place-items: center; pointer-events: none; }
      .message { max-width: min(88%, 460px); padding: 18px 20px; border-radius: 22px; background: color-mix(in srgb, var(--panel) 76%, black); border: 1px solid rgba(255,255,255,0.12); text-align: center; box-shadow: 0 18px 40px rgba(0,0,0,0.35); }
      .message h2 { margin: 0 0 8px; font-size: 20px; }
      .message p { margin: 0; font-size: 13px; line-height: 1.5; opacity: 0.88; }
    </style>
  </head>
  <body>
    <div id="shell">
      <div id="frame">
        <canvas id="game" width="${logicalWidth}" height="${logicalHeight}"></canvas>
        <div id="hud">
          <div class="topbar">
            <div class="pill" id="score-pill">Score 0</div>
            <div class="pill" id="best-pill">Best 0</div>
          </div>
          <div class="panel">
            <h1>${escapeHtml(summary.label)}</h1>
            <p>${description}</p>
          </div>
        </div>
        <div class="center-overlay">
          <div class="message" id="message-card">
            <h2>${title}</h2>
            <p>${escapeHtml(config.controlsHint)}</p>
          </div>
        </div>
      </div>
    </div>
    <script>
      const CONFIG = ${safeConfig};
      const canvas = document.getElementById("game");
      const ctx = canvas.getContext("2d");
      const scorePill = document.getElementById("score-pill");
      const bestPill = document.getElementById("best-pill");
      const messageCard = document.getElementById("message-card");
      const logicalWidth = canvas.width;
      const logicalHeight = canvas.height;
      const storageKey = "vg-builder-best:" + CONFIG.templateKey;
      const bestScore = Number(window.localStorage.getItem(storageKey) || "0");
      const input = { left: false, right: false, up: false, down: false, pressed: false, pointerActive: false, pointerX: logicalWidth * 0.5, pointerY: logicalHeight * 0.5 };
      const state = { started: false, gameOver: false, score: 0, best: Number.isFinite(bestScore) ? bestScore : 0, combo: 1, comboTimer: 0, flash: 0, shake: 0, particles: [] };
      function rand(min, max) { return Math.random() * (max - min) + min; }
      function clamp(value, min, max) { return Math.max(min, Math.min(max, value)); }
      function postSdkMessage(type, payload) { if (window.parent) window.parent.postMessage({ source: "vibegames-sdk", type, payload: payload || {} }, "*"); }
      function updateBest() { if (state.score > state.best) { state.best = Math.floor(state.score); window.localStorage.setItem(storageKey, String(state.best)); } }
      function setMessage(titleValue, bodyValue) { messageCard.innerHTML = "<h2>" + titleValue + "</h2><p>" + bodyValue + "</p>"; }
      function triggerJuice(x, y, color, amount) { if (!CONFIG.juicy) return; state.flash = 0.2; state.shake = Math.max(state.shake, 8); for (let index = 0; index < amount; index += 1) state.particles.push({ x, y, dx: rand(-2.5, 2.5), dy: rand(-2.5, 2.5), size: rand(3, 8), life: rand(0.3, 0.8), color }); }
      function updateParticles(dt) { state.flash = Math.max(0, state.flash - dt * 1.4); state.shake = Math.max(0, state.shake - dt * 22); state.particles = state.particles.filter((particle) => { particle.x += particle.dx * 60 * dt; particle.y += particle.dy * 60 * dt; particle.life -= dt; particle.size *= 0.986; return particle.life > 0.02; }); }
      function drawParticles() { for (const particle of state.particles) { ctx.globalAlpha = Math.max(0, particle.life); ctx.fillStyle = particle.color; ctx.beginPath(); ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2); ctx.fill(); } ctx.globalAlpha = 1; }
      function resetCombo() { state.combo = 1; state.comboTimer = 0; }
      function addComboStep() { if (!CONFIG.scoreCombo) return 1; state.combo = clamp(state.combo + 0.25, 1, 6); state.comboTimer = 2.4; return state.combo; }
      function updateHud() { const comboLabel = CONFIG.scoreCombo && state.combo > 1.1 ? " x" + state.combo.toFixed(1) : ""; scorePill.textContent = "Score " + Math.floor(state.score) + comboLabel; bestPill.textContent = "Best " + state.best; }
      ${gameScript}
      const game = createGame();
      function updatePointerPosition(event) { const rect = canvas.getBoundingClientRect(); input.pointerX = ((event.clientX - rect.left) / rect.width) * logicalWidth; input.pointerY = ((event.clientY - rect.top) / rect.height) * logicalHeight; }
      document.addEventListener("keydown", (event) => { if (event.key === "ArrowLeft" || event.key.toLowerCase() === "a") input.left = true; if (event.key === "ArrowRight" || event.key.toLowerCase() === "d") input.right = true; if (event.key === "ArrowUp" || event.key.toLowerCase() === "w") input.up = true; if (event.key === "ArrowDown" || event.key.toLowerCase() === "s") input.down = true; if (event.key === " " || event.key === "Spacebar") { event.preventDefault(); input.pressed = true; } });
      document.addEventListener("keyup", (event) => { if (event.key === "ArrowLeft" || event.key.toLowerCase() === "a") input.left = false; if (event.key === "ArrowRight" || event.key.toLowerCase() === "d") input.right = false; if (event.key === "ArrowUp" || event.key.toLowerCase() === "w") input.up = false; if (event.key === "ArrowDown" || event.key.toLowerCase() === "s") input.down = false; });
      canvas.addEventListener("pointerdown", (event) => { updatePointerPosition(event); input.pointerActive = true; input.pressed = true; });
      canvas.addEventListener("pointermove", (event) => updatePointerPosition(event));
      window.addEventListener("pointerup", () => { input.pointerActive = false; });
      window.addEventListener("message", (event) => { const message = event.data; if (!message || message.source !== "vibegames-platform") return; if (message.type === "VG_REQUEST_SCREENSHOT") postSdkMessage("VG_SCREENSHOT_CAPTURED", { captureId: message.payload && message.payload.captureId ? message.payload.captureId : "", imageDataUrl: canvas.toDataURL("image/jpeg", 0.82) }); });
      let previous = performance.now();
      function loop(now) { const dt = Math.min(0.05, (now - previous) / 1000); previous = now; game.update(dt); updateParticles(dt); updateHud(); ctx.save(); const shakeX = state.shake > 0 ? rand(-state.shake, state.shake) : 0; const shakeY = state.shake > 0 ? rand(-state.shake, state.shake) : 0; ctx.translate(shakeX, shakeY); game.draw(); drawParticles(); ctx.restore(); if (state.flash > 0) { ctx.fillStyle = "rgba(255,255,255," + (state.flash * 0.18) + ")"; ctx.fillRect(0, 0, logicalWidth, logicalHeight); } requestAnimationFrame(loop); }
      game.reset();
      updateHud();
      postSdkMessage("VG_READY", {});
      requestAnimationFrame(loop);
    </script>
  </body>
</html>`
}
