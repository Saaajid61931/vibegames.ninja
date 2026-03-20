import { z } from "zod"
import {
  coerceBuilderConfig,
  createBuilderDefaultConfig,
  getBuilderTemplate,
  getBuilderTemplates,
} from "@/lib/builder/templates"
import type {
  BuilderGameConfig,
  BuilderOpenRouterConnectionResponse,
  BuilderProviderResult,
  BuilderQuickActionKey,
  BuilderScratchResult,
  BuilderTemplateKey,
} from "@/lib/builder/types"
import { BUILDER_TEMPLATE_KEYS, DEFAULT_BUILDER_OPENROUTER_MODEL } from "@/lib/builder/types"

const OPENROUTER_CHAT_COMPLETIONS_URL = "https://openrouter.ai/api/v1/chat/completions"
const OPENROUTER_TITLE = "VibeGames Builder"
const JSON_MODE_RETRYABLE_STATUSES = new Set([400, 404, 415, 422, 502, 503])

const openRouterBuilderResultSchema = z.object({
  ok: z.boolean(),
  summary: z.string().min(1).max(400),
  response: z.string().min(1).max(800),
  nextConfig: z.unknown().optional(),
  snapshot: z.record(z.string(), z.unknown()).optional(),
  rejectedReason: z.string().min(1).max(400).optional(),
})

const openRouterConnectionResultSchema = z.object({
  ok: z.literal(true),
  message: z.string().min(1).max(200),
})

const openRouterScratchResultSchema = z.object({
  ok: z.boolean(),
  templateKey: z.enum(BUILDER_TEMPLATE_KEYS),
  summary: z.string().min(1).max(400),
  response: z.string().min(1).max(800),
  nextConfig: z.unknown().optional(),
  snapshot: z.record(z.string(), z.unknown()).optional(),
  rejectedReason: z.string().min(1).max(400).optional(),
})

type OpenRouterChatMessage = {
  role: "system" | "user"
  content: string
}

export class OpenRouterBuilderError extends Error {
  status: number

  constructor(message: string, status = 502) {
    super(message)
    this.name = "OpenRouterBuilderError"
    this.status = status
  }
}

function buildPrompt(
  templateKey: BuilderTemplateKey,
  currentConfig: BuilderGameConfig,
  prompt: string,
  actionKey?: BuilderQuickActionKey,
) {
  const template = getBuilderTemplate(templateKey)

  return [
    "You are the VibeGames builder assistant.",
    "You only create or refine game starter configs.",
    "Return valid JSON only.",
    "Do not include markdown, code fences, or extra commentary.",
    "Stay inside the current game template contract.",
    "Keep templateKey unchanged.",
    "Preserve fields the user did not ask to change.",
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

function buildScratchPrompt(prompt: string, templateKey?: BuilderTemplateKey) {
  const templateList = getBuilderTemplates()
    .map((template) => `- ${template.key}: ${template.label} - ${template.description}`)
    .join("\n")

  const baselineConfigs = Object.fromEntries(
    BUILDER_TEMPLATE_KEYS.map((key) => [key, createBuilderDefaultConfig(key)]),
  )

  return [
    "You are the VibeGames concept-to-game generator.",
    "You choose the best browser-game starter template, then return a complete config for the first playable draft.",
    "Return valid JSON only.",
    "Do not include markdown, code fences, or extra commentary.",
    templateKey
      ? `Use the ${templateKey} starter template and keep templateKey unchanged.`
      : "Choose the best starter template for the user's concept.",
    "If the request is not meaningfully a game, return ok=false and explain why briefly.",
    "",
    "Available starter templates:",
    templateList,
    "",
    `Baseline configs JSON: ${JSON.stringify(baselineConfigs)}`,
    `User concept: ${prompt}`,
    "",
    "Output JSON shape:",
    "{",
    '  "ok": boolean,',
    '  "templateKey": "endless-runner" | "tap-survival" | "arena-shooter" | "tile-puzzle",',
    '  "summary": string,',
    '  "response": string,',
    '  "nextConfig": object,',
    '  "snapshot": { "selectedTemplate": string, "difficulty": number, "theme": string, "supportsMobile": boolean, "mobileOrientation": "BOTH" | "PORTRAIT" | "LANDSCAPE" },',
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

function trimCodeFences(content: string) {
  return content
    .trim()
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim()
}

function extractFirstJsonObject(content: string) {
  const source = trimCodeFences(content)
  const start = source.indexOf("{")

  if (start < 0) {
    return null
  }

  let depth = 0
  let inString = false
  let escaped = false

  for (let index = start; index < source.length; index += 1) {
    const char = source[index]

    if (escaped) {
      escaped = false
      continue
    }

    if (char === "\\") {
      escaped = true
      continue
    }

    if (char === "\"") {
      inString = !inString
      continue
    }

    if (inString) {
      continue
    }

    if (char === "{") {
      depth += 1
    } else if (char === "}") {
      depth -= 1
      if (depth === 0) {
        return source.slice(start, index + 1)
      }
    }
  }

  return null
}

function parseStructuredJsonResponse<T>(
  content: string,
  schema: z.ZodSchema<T>,
  malformedMessage: string,
  unexpectedMessage: string,
) {
  const candidates = [trimCodeFences(content), extractFirstJsonObject(content)].filter(
    (value): value is string => Boolean(value),
  )

  for (const candidate of candidates) {
    try {
      const parsed = JSON.parse(candidate)
      const validated = schema.safeParse(parsed)
      if (validated.success) {
        return validated.data
      }
    } catch {
      continue
    }
  }

  try {
    JSON.parse(trimCodeFences(content))
  } catch {
    throw new OpenRouterBuilderError(malformedMessage, 502)
  }

  throw new OpenRouterBuilderError(unexpectedMessage, 502)
}

function shouldRetryWithoutJsonMode(error: OpenRouterBuilderError) {
  const lowerMessage = error.message.toLowerCase()

  return (
    JSON_MODE_RETRYABLE_STATUSES.has(error.status) ||
    lowerMessage.includes("response_format") ||
    lowerMessage.includes("json_object") ||
    lowerMessage.includes("json schema") ||
    lowerMessage.includes("malformed json") ||
    lowerMessage.includes("unexpected payload") ||
    lowerMessage.includes("unexpected builder payload") ||
    lowerMessage.includes("empty builder response")
  )
}

async function requestOpenRouterMessage(options: {
  apiKey: string
  model: string
  origin?: string | null
  messages: OpenRouterChatMessage[]
  useJsonMode: boolean
}) {
  const body = {
    model: options.model,
    temperature: 0.4,
    ...(options.useJsonMode ? { response_format: { type: "json_object" as const } } : {}),
    messages: options.messages,
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

  return content
}

async function requestOpenRouterStructuredPayload<T>(options: {
  apiKey: string
  model: string
  origin?: string | null
  messages: OpenRouterChatMessage[]
  schema: z.ZodSchema<T>
  malformedMessage: string
  unexpectedMessage: string
}) {
  let lastError: OpenRouterBuilderError | null = null

  for (const useJsonMode of [true, false]) {
    try {
      const content = await requestOpenRouterMessage({
        apiKey: options.apiKey,
        model: options.model,
        origin: options.origin,
        messages: options.messages,
        useJsonMode,
      })

      return {
        parsed: parseStructuredJsonResponse(
          content,
          options.schema,
          options.malformedMessage,
          options.unexpectedMessage,
        ),
        usedJsonMode: useJsonMode,
      }
    } catch (error) {
      const normalized =
        error instanceof OpenRouterBuilderError
          ? error
          : new OpenRouterBuilderError("OpenRouter request failed.", 502)

      if (useJsonMode && shouldRetryWithoutJsonMode(normalized)) {
        lastError = normalized
        continue
      }

      throw normalized
    }
  }

  throw lastError ?? new OpenRouterBuilderError("OpenRouter request failed.", 502)
}

export async function generateBuilderResultWithOpenRouter(options: {
  templateKey: BuilderTemplateKey
  currentConfig: unknown
  prompt: string
  apiKey: string
  model?: string
  origin?: string | null
  actionKey?: BuilderQuickActionKey
}): Promise<BuilderProviderResult> {
  const currentConfig = coerceBuilderConfig(options.templateKey, options.currentConfig)
  const model = options.model?.trim() || DEFAULT_BUILDER_OPENROUTER_MODEL
  const messages: OpenRouterChatMessage[] = [
    {
      role: "system",
      content:
        "You are a strict JSON builder assistant for browser games. Follow the user's instruction and return only JSON.",
    },
    {
      role: "user",
      content: buildPrompt(options.templateKey, currentConfig, options.prompt, options.actionKey),
    },
  ]

  const { parsed } = await requestOpenRouterStructuredPayload({
    apiKey: options.apiKey,
    model,
    origin: options.origin,
    messages,
    schema: openRouterBuilderResultSchema,
    malformedMessage: "OpenRouter returned a malformed JSON response.",
    unexpectedMessage: "OpenRouter returned an unexpected builder payload.",
  })

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

export async function generateBuilderProjectFromScratchWithOpenRouter(options: {
  prompt: string
  apiKey: string
  model?: string
  origin?: string | null
  templateKey?: BuilderTemplateKey
}): Promise<BuilderScratchResult> {
  const model = options.model?.trim() || DEFAULT_BUILDER_OPENROUTER_MODEL
  const messages: OpenRouterChatMessage[] = [
    {
      role: "system",
      content:
        "You are a strict JSON assistant for browser games. Pick the best starter template and return only JSON.",
    },
    {
      role: "user",
      content: buildScratchPrompt(options.prompt, options.templateKey),
    },
  ]

  const { parsed } = await requestOpenRouterStructuredPayload({
    apiKey: options.apiKey,
    model,
    origin: options.origin,
    messages,
    schema: openRouterScratchResultSchema,
    malformedMessage: "OpenRouter returned malformed JSON while generating the first draft.",
    unexpectedMessage: "OpenRouter returned an unexpected first-draft payload.",
  })

  const resolvedTemplateKey = options.templateKey ?? parsed.templateKey

  if (!parsed.ok) {
    return {
      ok: false,
      templateKey: resolvedTemplateKey,
      summary: parsed.summary,
      response: parsed.response,
      rejectedReason: parsed.rejectedReason || "OpenRouter rejected the concept prompt.",
    }
  }

  if (!parsed.nextConfig || typeof parsed.nextConfig !== "object") {
    throw new OpenRouterBuilderError("OpenRouter did not return a valid first-draft config.", 502)
  }

  const nextConfig = coerceBuilderConfig(resolvedTemplateKey, parsed.nextConfig)
  return {
    ok: true,
    templateKey: resolvedTemplateKey,
    summary: parsed.summary,
    response: parsed.response,
    nextConfig,
    snapshot: {
      ...(parsed.snapshot || {}),
      selectedTemplate: resolvedTemplateKey,
    },
  }
}

export async function testOpenRouterConnection(options: {
  apiKey: string
  model?: string
  origin?: string | null
}): Promise<BuilderOpenRouterConnectionResponse> {
  const model = options.model?.trim() || DEFAULT_BUILDER_OPENROUTER_MODEL
  const messages: OpenRouterChatMessage[] = [
    {
      role: "system",
      content: "Return only JSON with the exact shape requested by the user.",
    },
    {
      role: "user",
      content: [
        "Return this exact JSON shape and nothing else:",
        '{ "ok": true, "message": "OpenRouter connection verified." }',
      ].join("\n"),
    },
  ]

  const { parsed, usedJsonMode } = await requestOpenRouterStructuredPayload({
    apiKey: options.apiKey,
    model,
    origin: options.origin,
    messages,
    schema: openRouterConnectionResultSchema,
    malformedMessage: "OpenRouter returned malformed JSON during the connection test.",
    unexpectedMessage: "OpenRouter returned an unexpected payload during the connection test.",
  })

  return {
    ok: parsed.ok,
    providerId: "openrouter",
    providerLabel: "OpenRouter",
    model,
    message: usedJsonMode
      ? `${parsed.message} JSON mode is available for this model.`
      : `${parsed.message} Compatibility mode is available for this model.`,
  }
}
