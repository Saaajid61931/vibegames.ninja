import {
  type BuilderGameConfig,
  type BuilderProviderResult,
  type BuilderQuickActionKey,
  type BuilderTemplateKey,
  type BuilderThemeKey,
} from "@/lib/builder/types"
import { coerceBuilderConfig, retuneBuilderConfig } from "@/lib/builder/templates"

const NON_GAME_PATTERNS = [
  /\bspreadsheet\b/,
  /\bcalendar\b/,
  /\btodo\b/,
  /\bchatbot\b/,
  /\bsocial network\b/,
  /\bblog\b/,
  /\bportfolio\b/,
  /\bsaas\b/,
  /\be-?commerce\b/,
  /\bcrm\b/,
  /\bdatabase\b/,
  /\b3d open world\b/,
] as const

const THEME_KEYWORDS: Array<{ theme: BuilderThemeKey; keywords: string[] }> = [
  { theme: "neon", keywords: ["neon", "cyber", "laser", "retro future"] },
  { theme: "sunset", keywords: ["sunset", "golden", "warm", "desert", "tropical"] },
  { theme: "forest", keywords: ["forest", "nature", "jungle", "green", "garden"] },
  { theme: "candy", keywords: ["candy", "cute", "pink", "sweet", "toy"] },
  { theme: "midnight", keywords: ["midnight", "space", "moon", "night", "deep blue"] },
  { theme: "ember", keywords: ["ember", "lava", "fire", "volcanic", "molten"] },
  { theme: "ocean", keywords: ["ocean", "underwater", "sea", "aqua", "water"] },
] as const

const QUICK_ACTION_RESPONSES: Record<BuilderQuickActionKey, string> = {
  "make-easier": "I softened the curve and made the loop more forgiving.",
  "make-harder": "I turned up the pressure so the run asks for cleaner play.",
  "make-juicier": "I pushed the feedback harder so the moment-to-moment feels more alive.",
  "optimize-mobile": "I tuned the project toward touch-first play and cleaner phone framing.",
  "add-score-combo": "I added combo scoring so strong streaks feel worth chasing.",
  "add-restart-polish": "I polished the fail and retry loop so restarting feels immediate.",
}

function extractTitle(prompt: string) {
  const match = prompt.match(/(?:call it|name it|title it)\s+["']?([^"'\n]+)["']?/i)
  return match?.[1]?.trim()
}

function addTag(config: BuilderGameConfig, tag: string) {
  if (!config.tags.includes(tag)) {
    config.tags = [...config.tags, tag].slice(0, 8)
  }
}

function applyQuickAction(config: BuilderGameConfig, actionKey: BuilderQuickActionKey, changes: string[]) {
  switch (actionKey) {
    case "make-easier":
      config.difficulty = Math.max(1, config.difficulty - 2)
      changes.push("lowered difficulty")
      break
    case "make-harder":
      config.difficulty = Math.min(10, config.difficulty + 2)
      changes.push("raised difficulty")
      break
    case "make-juicier":
      config.juicy = true
      changes.push("enabled heavier juice")
      break
    case "optimize-mobile":
      config.supportsMobile = true
      config.mobileOrientation = config.templateKey === "tap-survival" || config.templateKey === "tile-puzzle" ? "PORTRAIT" : "LANDSCAPE"
      changes.push("optimized mobile defaults")
      break
    case "add-score-combo":
      config.scoreCombo = true
      changes.push("enabled score combos")
      break
    case "add-restart-polish":
      config.restartPolish = true
      changes.push("polished restart flow")
      break
  }
}

export function applyBuilderPrompt(options: {
  templateKey: BuilderTemplateKey
  currentConfig: unknown
  prompt: string
  actionKey?: BuilderQuickActionKey
}): BuilderProviderResult {
  const baseConfig = coerceBuilderConfig(options.templateKey, options.currentConfig)
  const config = structuredClone(baseConfig)
  const prompt = options.prompt.trim()
  const normalized = prompt.toLowerCase()
  const changes: string[] = []

  if (NON_GAME_PATTERNS.some((pattern) => pattern.test(normalized))) {
    return {
      ok: false,
      summary: "Rejected request that breaks the game-first starter contract",
      response: "Builder v1 stays inside game templates. Ask for a different vibe, mechanic, difficulty, theme, or mobile tune instead of turning this into a non-game tool.",
      rejectedReason: "This prompt would push the starter outside the game-focused builder contract.",
    }
  }

  if (options.actionKey) {
    applyQuickAction(config, options.actionKey, changes)
  }

  if (/\beasier\b|\bmore forgiving\b|\brelax(?:ed|ing)?\b/.test(normalized)) {
    config.difficulty = Math.max(1, config.difficulty - 1)
    changes.push("made the game easier")
  }

  if (/\bharder\b|\bmore difficult\b|\bintense\b|\bchaotic\b|\bbrutal\b/.test(normalized)) {
    config.difficulty = Math.min(10, config.difficulty + 1)
    changes.push("made the game harder")
  }

  if (/\bjuic(?:y|ier)\b|\bpunchier\b|\bparticles\b|\bscreenshake\b|\bmore feedback\b/.test(normalized)) {
    config.juicy = true
    changes.push("added more juice")
  }

  if (/\bcombo\b|\bstreak\b|\bchain\b/.test(normalized)) {
    config.scoreCombo = true
    changes.push("turned on combo scoring")
  }

  if (/\brestart\b|\bgame over\b|\bretry\b|\binstant retry\b/.test(normalized)) {
    config.restartPolish = true
    changes.push("polished the retry loop")
  }

  if (/\bmobile\b|\bphone\b|\btouch\b/.test(normalized)) {
    config.supportsMobile = true
    changes.push("tuned it for mobile")
  }

  if (/\bportrait\b|\bvertical\b/.test(normalized)) {
    config.mobileOrientation = "PORTRAIT"
    changes.push("shifted to portrait framing")
  } else if (/\blandscape\b|\bhorizontal\b|\bwide\b/.test(normalized)) {
    config.mobileOrientation = "LANDSCAPE"
    changes.push("shifted to landscape framing")
  }

  if (/\bfaster\b|\bspeed up\b/.test(normalized)) {
    config.difficulty = Math.min(10, config.difficulty + 1)
    changes.push("sped up the loop")
  }

  if (/\bslower\b|\bslow down\b/.test(normalized)) {
    config.difficulty = Math.max(1, config.difficulty - 1)
    changes.push("slowed the pace")
  }

  for (const themeOption of THEME_KEYWORDS) {
    if (themeOption.keywords.some((keyword) => normalized.includes(keyword))) {
      config.theme = themeOption.theme
      addTag(config, themeOption.theme)
      changes.push(`applied a ${themeOption.theme} art pass`)
      break
    }
  }

  const extractedTitle = extractTitle(prompt)
  if (extractedTitle) {
    config.title = extractedTitle.slice(0, 80)
    changes.push("renamed the project")
  }

  if (/\barena\b|\bsurvival\b/.test(normalized) && config.templateKey === "arena-shooter") {
    addTag(config, "survival")
  }

  if (/\bcozy\b|\bcalm\b/.test(normalized)) {
    config.difficulty = Math.max(1, config.difficulty - 1)
    if (config.theme === "ember") {
      config.theme = "sunset"
    }
    changes.push("leaned into a calmer vibe")
  }

  if (/\bscore attack\b|\bleaderboard\b/.test(normalized)) {
    config.scoreCombo = true
    addTag(config, "score attack")
    changes.push("pushed the score-chasing loop")
  }

  const nextConfig = retuneBuilderConfig(config)
  const dedupedChanges = [...new Set(changes)]
  const summary =
    dedupedChanges.length > 0
      ? `Updated the build: ${dedupedChanges.join(", ")}.`
      : "Refreshed the starter with a small balance and polish pass."
  const response =
    options.actionKey && QUICK_ACTION_RESPONSES[options.actionKey]
      ? QUICK_ACTION_RESPONSES[options.actionKey]
      : dedupedChanges.length > 0
        ? `Applied the request and kept it inside the ${options.templateKey} starter contract.`
        : "I kept the starter stable and gave it a light tune without breaking the core loop."

  return {
    ok: true,
    summary,
    response,
    nextConfig,
    snapshot: {
      changedFields: dedupedChanges,
      difficulty: nextConfig.difficulty,
      theme: nextConfig.theme,
      supportsMobile: nextConfig.supportsMobile,
      mobileOrientation: nextConfig.mobileOrientation,
      quickAction: options.actionKey || null,
    },
  }
}
