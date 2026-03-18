import type { MobileOrientation } from "@/lib/mobile-orientation"

export const BUILDER_TEMPLATE_KEYS = [
  "endless-runner",
  "tap-survival",
  "arena-shooter",
  "tile-puzzle",
] as const

export type BuilderTemplateKey = (typeof BUILDER_TEMPLATE_KEYS)[number]

export const BUILDER_QUICK_ACTIONS = [
  { key: "make-easier", label: "Make it easier", description: "Reduce pressure and make the loop more forgiving." },
  { key: "make-harder", label: "Make it harder", description: "Turn up the pace and demand more precision." },
  { key: "make-juicier", label: "Make it feel juicier", description: "Add more feedback, flash, and satisfying motion." },
  { key: "optimize-mobile", label: "Optimize for mobile", description: "Tune the game for touch play and phone-friendly framing." },
  { key: "add-score-combo", label: "Add score combo", description: "Reward streaks and keep the run feeling hotter." },
  { key: "add-restart-polish", label: "Add restart + game over polish", description: "Improve the end-of-run loop and restart clarity." },
] as const

export type BuilderQuickActionKey = (typeof BUILDER_QUICK_ACTIONS)[number]["key"]

export type BuilderThemeKey =
  | "neon"
  | "sunset"
  | "forest"
  | "candy"
  | "midnight"
  | "ember"
  | "ocean"

export interface BuilderPalette {
  bg: string
  panel: string
  text: string
  accent: string
  accent2: string
}

export interface BuilderGameplayConfig {
  speed: number
  obstacleRate: number
  jumpPower: number
  gravity: number
  gapSize: number
  playerSpeed: number
  enemySpeed: number
  enemySpawnMs: number
  fireRateMs: number
  maxHealth: number
  gridSize: number
  shuffleMoves: number
}

export interface BuilderGameConfig {
  templateKey: BuilderTemplateKey
  title: string
  description: string
  category: string
  tags: string[]
  theme: BuilderThemeKey
  supportsMobile: boolean
  mobileOrientation: MobileOrientation
  juicy: boolean
  scoreCombo: boolean
  restartPolish: boolean
  difficulty: number
  controlsHint: string
  palette: BuilderPalette
  gameplay: BuilderGameplayConfig
}

export interface BuilderTemplateSummary {
  key: BuilderTemplateKey
  label: string
  eyebrow: string
  description: string
  category: string
  defaultTitle: string
  defaultDescription: string
  defaultTags: string[]
  supportsMobile: boolean
  mobileOrientation: MobileOrientation
  quickActions: BuilderQuickActionKey[]
}

export interface BuilderProviderResult {
  ok: boolean
  summary: string
  response: string
  nextConfig?: BuilderGameConfig
  snapshot?: Record<string, unknown>
  rejectedReason?: string
}
