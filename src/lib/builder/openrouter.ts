import { z } from "zod"
import { coerceBuilderConfig, getBuilderTemplate } from "@/lib/builder/templates"
import type {
  BuilderGameConfig,
  BuilderProviderResult,
  BuilderQuickActionKey,
  BuilderTemplateKey,
} from "@/lib/builder/types"

const DEFAULT_OPENROUTER_MODEL = "openai/gpt-5.2-chat"
const OPENROUTER_CHAT_COMPLETIONS_URL = "https://openrouter.ai/api/v1/chat/completions"
const OPENROUTER_TITLE = "VibeGames Builder"

const openRouterBuilderResultSchema = z.object({
  ok: z.boolean(),
  summary: z.string().min(1).max(400),
  response: z.string().min(1).max(800),
  nextConfig: z.unknown().optional(),
  snapshot: z.record(z.string(), z.unknown()).optional(),
  rejectedReason: z.string().min(1).max(400).optional(),
})

type OpenRouterBuilderResult = z.infer<typeof openRouterBuilderResultSchema>

export class OpenRouterBuilderError extends Error {
  status: number

  constructor(message: string, status = 502) {
    super(message)
    this.name = "OpenRouterBuilderError"
    this.status = status
  }
}

function buildPrompt(templateKey: BuilderTemplateKey, currentConfig: BuilderGameConfig, prompt: string, actionKey?: BuilderQuickActionKey) {
  const template = getBuilderTemplate(templateKey)

  return [
    "You are the VibeGames builder assistant.",
    "You only create or refine game starter configs.",
    "Return valid JSON only.",
    "Do not include markdown, code fences, or extra commentary.",
    "Stay inside the current game template contract.",
    "Keep templateKey unchanged.",
    "If the request would stop being a game, return ok=false and explain why briefly.",
    "If you make a change, fill nextConfig with a complete config object shaped like the input baseline.",
    "",
    `Template: ${template.label} (${templateKey})`,
    `Template description: ${template.description}`,
    `Current config JSON: ${JSON.stringify(currentConfig)}`,
    `User prompt: ${prompt}`,
    `Quick action: ${actionKey || "none"}`,
    "",
    "Output JSON shape:",
    "{",
    '  "ok": boolean,',
    '  "summary": string,',
    '  "response": string,',
    '  "nextConfig": object,',
    '  "snapshot": { "changedFields": string[], "difficulty": number, "theme": string, "supportsMobile": boolean, "mobileOrientation": "BOTH" | "PORTRAIT" | "LANDSCAPE", "quickAction": string | null },',
    '  "rejectedReason": string | null',
    "}",
  ].join("\n")
}

function extractMessageText(content: unknown) {
  if (typeof content === "string") {
    return content
  }

  if (Array.isArray(content)) {
    return content
      .map((part) => {
        if (typeof part === "string") {
          return part
        }

        if (part && typeof part === "object") {
          const maybePart = part as { text?: unknown }
          if (typeof maybePart.text === "string") {
            return maybePart.text
          }
        }

        return ""
      })
      .join("")
  }

  return ""
}

function parseJsonResponse(content: string): OpenRouterBuilderResult {
  const trimmed = content.trim().replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/```$/i, "")

  let parsed: unknown
  try {
    parsed = JSON.parse(trimmed)
  } catch {
    throw new OpenRouterBuilderError("OpenRouter returned a malformed JSON response.", 502)
  }

  const validated = openRouterBuilderResultSchema.safeParse(parsed)
  if (!validated.success) {
    throw new OpenRouterBuilderError("OpenRouter returned an unexpected builder payload.", 502)
  }

  return validated.data
}

export async function generateBuilderResultWithOpenRouter(options: {
  templateKey: BuilderTemplateKey
  currentConfig: unknown
  prompt: string
  apiKey: string
  origin?: string | null
  actionKey?: BuilderQuickActionKey
}): Promise<BuilderProviderResult> {
  const currentConfig = coerceBuilderConfig(options.templateKey, options.currentConfig)
  const body = {
    model: DEFAULT_OPENROUTER_MODEL,
    temperature: 0.7,
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content: "You are a strict JSON builder assistant for browser games. Follow the user's instruction and return only JSON.",
      },
      {
        role: "user",
        content: buildPrompt(options.templateKey, currentConfig, options.prompt, options.actionKey),
      },
    ],
  }

  const response = await fetch(OPENROUTER_CHAT_COMPLETIONS_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${options.apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": options.origin || "https://www.vibegames.ninja",
      "X-Title": OPENROUTER_TITLE,
    },
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    const errorText = await response.text().catch(() => "")
    const message = errorText.trim()
      ? `OpenRouter request failed (${response.status}): ${errorText.slice(0, 200)}`
      : `OpenRouter request failed (${response.status}).`
    throw new OpenRouterBuilderError(message, response.status)
  }

  const payload = await response.json().catch(() => null)
  const content = extractMessageText(payload?.choices?.[0]?.message?.content)
  if (!content) {
    throw new OpenRouterBuilderError("OpenRouter returned an empty builder response.", 502)
  }

  const parsed = parseJsonResponse(content)

  if (!parsed.ok) {
    return {
      ok: false,
      summary: parsed.summary,
      response: parsed.response,
      rejectedReason: parsed.rejectedReason || "OpenRouter rejected the request.",
    }
  }

  if (!parsed.nextConfig || typeof parsed.nextConfig !== "object") {
    throw new OpenRouterBuilderError("OpenRouter did not return a valid nextConfig object.", 502)
  }

  const nextConfig = coerceBuilderConfig(options.templateKey, parsed.nextConfig)
  return {
    ok: true,
    summary: parsed.summary,
    response: parsed.response,
    nextConfig,
    snapshot: parsed.snapshot,
  }
}
