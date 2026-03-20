import { z } from "zod"
import {
  coerceBuilderConfig,
  createBuilderDefaultConfig,
  getBuilderTemplate,
  getBuilderTemplates,
} from "@/lib/builder/templates"
import {
  getBuilderAiProviderOption,
  getBuilderDefaultModel,
  normalizeBuilderAiSettings,
} from "@/lib/builder/ai-providers"
import type {
  BuilderAiConnectionResponse,
  BuilderAiSettings,
  BuilderGameConfig,
  BuilderProviderResult,
  BuilderQuickActionKey,
  BuilderScratchResult,
  BuilderTemplateKey,
} from "@/lib/builder/types"
import { BUILDER_TEMPLATE_KEYS } from "@/lib/builder/types"

const JSON_MODE_RETRYABLE_STATUSES = new Set([400, 404, 415, 422, 502, 503])
const BUILDER_TITLE = "VibeGames Builder"
const OPENAI_CHAT_COMPLETIONS_URL = "https://api.openai.com/v1/chat/completions"
const OPENROUTER_CHAT_COMPLETIONS_URL = "https://openrouter.ai/api/v1/chat/completions"
const AZURE_API_VERSION = "2024-10-21"

const builderResultSchema = z.object({
  ok: z.boolean(),
  summary: z.string().min(1).max(400),
  response: z.string().min(1).max(800),
  nextConfig: z.unknown().optional(),
  snapshot: z.record(z.string(), z.unknown()).optional(),
  rejectedReason: z.string().min(1).max(400).optional(),
})

const connectionResultSchema = z.object({
  ok: z.literal(true),
  message: z.string().min(1).max(200),
})

const scratchResultSchema = z.object({
  ok: z.boolean(),
  templateKey: z.enum(BUILDER_TEMPLATE_KEYS),
  summary: z.string().min(1).max(400),
  response: z.string().min(1).max(800),
  nextConfig: z.unknown().optional(),
  snapshot: z.record(z.string(), z.unknown()).optional(),
  rejectedReason: z.string().min(1).max(400).optional(),
})

type BuilderChatMessage = {
  role: "system" | "user"
  content: string
}

type ResolvedProviderRequest = {
  providerId: BuilderAiSettings["providerId"]
  providerLabel: string
  model: string
  url: string
  headers: Record<string, string>
  includeModelInBody: boolean
}

export class BuilderAiProviderError extends Error {
  status: number
  providerId: BuilderAiSettings["providerId"]

  constructor(providerId: BuilderAiSettings["providerId"], message: string, status = 502) {
    super(message)
    this.name = "BuilderAiProviderError"
    this.providerId = providerId
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
  providerId: BuilderAiSettings["providerId"],
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
    throw new BuilderAiProviderError(providerId, malformedMessage, 502)
  }

  throw new BuilderAiProviderError(providerId, unexpectedMessage, 502)
}

function shouldRetryWithoutJsonMode(error: BuilderAiProviderError) {
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

function trimTrailingSlashes(value: string) {
  return value.replace(/\/+$/, "")
}

function resolveOpenAiCompatibleUrl(baseUrl: string) {
  const normalized = trimTrailingSlashes(baseUrl.trim())
  if (normalized.endsWith("/chat/completions")) {
    return normalized
  }
  return `${normalized}/chat/completions`
}

function resolveProviderRequest(
  settingsInput: BuilderAiSettings,
  origin?: string | null,
): ResolvedProviderRequest {
  const settings = normalizeBuilderAiSettings(settingsInput)
  const provider = getBuilderAiProviderOption(settings.providerId)
  const model = settings.model?.trim() || getBuilderDefaultModel(settings.providerId)

  switch (settings.providerId) {
    case "openrouter":
      return {
        providerId: settings.providerId,
        providerLabel: provider.label,
        model,
        url: OPENROUTER_CHAT_COMPLETIONS_URL,
        headers: {
          Authorization: `Bearer ${settings.apiKey}`,
          "Content-Type": "application/json",
          "HTTP-Referer": origin || "https://www.vibegames.ninja",
          "X-Title": BUILDER_TITLE,
        },
        includeModelInBody: true,
      }
    case "openai":
      return {
        providerId: settings.providerId,
        providerLabel: provider.label,
        model,
        url: OPENAI_CHAT_COMPLETIONS_URL,
        headers: {
          Authorization: `Bearer ${settings.apiKey}`,
          "Content-Type": "application/json",
        },
        includeModelInBody: true,
      }
    case "azure-openai":
      return {
        providerId: settings.providerId,
        providerLabel: provider.label,
        model,
        url: `https://${settings.resourceName}.openai.azure.com/openai/deployments/${encodeURIComponent(
          model,
        )}/chat/completions?api-version=${AZURE_API_VERSION}`,
        headers: {
          "api-key": settings.apiKey || "",
          "Content-Type": "application/json",
        },
        includeModelInBody: false,
      }
    case "azure-cognitive-services":
      return {
        providerId: settings.providerId,
        providerLabel: provider.label,
        model,
        url: `https://${settings.resourceName}.cognitiveservices.azure.com/openai/deployments/${encodeURIComponent(
          model,
        )}/chat/completions?api-version=${AZURE_API_VERSION}`,
        headers: {
          "api-key": settings.apiKey || "",
          "Content-Type": "application/json",
        },
        includeModelInBody: false,
      }
    case "openai-compatible":
      return {
        providerId: settings.providerId,
        providerLabel: provider.label,
        model,
        url: resolveOpenAiCompatibleUrl(settings.baseUrl || ""),
        headers: {
          ...(settings.apiKey ? { Authorization: `Bearer ${settings.apiKey}` } : {}),
          "Content-Type": "application/json",
        },
        includeModelInBody: true,
      }
    case "local":
    default:
      throw new BuilderAiProviderError("local", "The local builder does not use an external AI provider.", 400)
  }
}

async function requestProviderMessage(options: {
  settings: BuilderAiSettings
  origin?: string | null
  messages: BuilderChatMessage[]
  useJsonMode: boolean
}) {
  const request = resolveProviderRequest(options.settings, options.origin)
  const body = {
    ...(request.includeModelInBody ? { model: request.model } : {}),
    temperature: 0.4,
    ...(options.useJsonMode ? { response_format: { type: "json_object" as const } } : {}),
    messages: options.messages,
  }

  const response = await fetch(request.url, {
    method: "POST",
    headers: request.headers,
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    const errorText = await response.text().catch(() => "")
    const message = errorText.trim()
      ? `${request.providerLabel} request failed (${response.status}): ${errorText.slice(0, 200)}`
      : `${request.providerLabel} request failed (${response.status}).`
    throw new BuilderAiProviderError(request.providerId, message, response.status)
  }

  const payload = await response.json().catch(() => null)
  const content = extractMessageText(payload?.choices?.[0]?.message?.content)
  if (!content) {
    throw new BuilderAiProviderError(
      request.providerId,
      `${request.providerLabel} returned an empty builder response.`,
      502,
    )
  }

  return {
    providerId: request.providerId,
    providerLabel: request.providerLabel,
    model: request.model,
    content,
  }
}

async function requestProviderStructuredPayload<T>(options: {
  settings: BuilderAiSettings
  origin?: string | null
  messages: BuilderChatMessage[]
  schema: z.ZodSchema<T>
  malformedMessage: string
  unexpectedMessage: string
}) {
  let lastError: BuilderAiProviderError | null = null

  for (const useJsonMode of [true, false]) {
    try {
      const response = await requestProviderMessage({
        settings: options.settings,
        origin: options.origin,
        messages: options.messages,
        useJsonMode,
      })

      return {
        providerId: response.providerId,
        providerLabel: response.providerLabel,
        model: response.model,
        parsed: parseStructuredJsonResponse(
          response.content,
          options.schema,
          options.malformedMessage,
          options.unexpectedMessage,
          response.providerId,
        ),
        usedJsonMode: useJsonMode,
      }
    } catch (error) {
      const normalized =
        error instanceof BuilderAiProviderError
          ? error
          : new BuilderAiProviderError(options.settings.providerId, "Provider request failed.", 502)

      if (useJsonMode && shouldRetryWithoutJsonMode(normalized)) {
        lastError = normalized
        continue
      }

      throw normalized
    }
  }

  throw lastError ?? new BuilderAiProviderError(options.settings.providerId, "Provider request failed.", 502)
}

export async function generateBuilderResultWithAiProvider(options: {
  templateKey: BuilderTemplateKey
  currentConfig: unknown
  prompt: string
  settings: BuilderAiSettings
  origin?: string | null
  actionKey?: BuilderQuickActionKey
}): Promise<BuilderProviderResult & { providerId: BuilderAiSettings["providerId"]; model: string; label: string }> {
  const currentConfig = coerceBuilderConfig(options.templateKey, options.currentConfig)
  const messages: BuilderChatMessage[] = [
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

  const response = await requestProviderStructuredPayload({
    settings: options.settings,
    origin: options.origin,
    messages,
    schema: builderResultSchema,
    malformedMessage: "The provider returned a malformed JSON response.",
    unexpectedMessage: "The provider returned an unexpected builder payload.",
  })

  if (!response.parsed.ok) {
    return {
      ok: false,
      providerId: response.providerId,
      label: response.providerLabel,
      model: response.model,
      summary: response.parsed.summary,
      response: response.parsed.response,
      rejectedReason: response.parsed.rejectedReason || `${response.providerLabel} rejected the request.`,
    }
  }

  if (!response.parsed.nextConfig || typeof response.parsed.nextConfig !== "object") {
    throw new BuilderAiProviderError(
      response.providerId,
      `${response.providerLabel} did not return a valid nextConfig object.`,
      502,
    )
  }

  return {
    ok: true,
    providerId: response.providerId,
    label: response.providerLabel,
    model: response.model,
    summary: response.parsed.summary,
    response: response.parsed.response,
    nextConfig: coerceBuilderConfig(options.templateKey, response.parsed.nextConfig),
    snapshot: response.parsed.snapshot,
  }
}

export async function generateBuilderProjectFromScratchWithAiProvider(options: {
  prompt: string
  settings: BuilderAiSettings
  origin?: string | null
  templateKey?: BuilderTemplateKey
}): Promise<BuilderScratchResult & { providerId: BuilderAiSettings["providerId"]; model: string; label: string }> {
  const messages: BuilderChatMessage[] = [
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

  const response = await requestProviderStructuredPayload({
    settings: options.settings,
    origin: options.origin,
    messages,
    schema: scratchResultSchema,
    malformedMessage: "The provider returned malformed JSON while generating the first draft.",
    unexpectedMessage: "The provider returned an unexpected first-draft payload.",
  })

  const resolvedTemplateKey = options.templateKey ?? response.parsed.templateKey

  if (!response.parsed.ok) {
    return {
      ok: false,
      providerId: response.providerId,
      label: response.providerLabel,
      model: response.model,
      templateKey: resolvedTemplateKey,
      summary: response.parsed.summary,
      response: response.parsed.response,
      rejectedReason:
        response.parsed.rejectedReason || `${response.providerLabel} rejected the concept prompt.`,
    }
  }

  if (!response.parsed.nextConfig || typeof response.parsed.nextConfig !== "object") {
    throw new BuilderAiProviderError(
      response.providerId,
      `${response.providerLabel} did not return a valid first-draft config.`,
      502,
    )
  }

  return {
    ok: true,
    providerId: response.providerId,
    label: response.providerLabel,
    model: response.model,
    templateKey: resolvedTemplateKey,
    summary: response.parsed.summary,
    response: response.parsed.response,
    nextConfig: coerceBuilderConfig(resolvedTemplateKey, response.parsed.nextConfig),
    snapshot: {
      ...(response.parsed.snapshot || {}),
      selectedTemplate: resolvedTemplateKey,
    },
  }
}

export async function testBuilderAiConnection(options: {
  settings: BuilderAiSettings
  origin?: string | null
}): Promise<BuilderAiConnectionResponse> {
  const response = await requestProviderStructuredPayload({
    settings: options.settings,
    origin: options.origin,
    messages: [
      {
        role: "system",
        content: "Return only JSON with the exact shape requested by the user.",
      },
      {
        role: "user",
        content:
          'Return this exact JSON shape and nothing else:\n{ "ok": true, "message": "Connection verified." }',
      },
    ],
    schema: connectionResultSchema,
    malformedMessage: "The provider returned malformed JSON during the connection test.",
    unexpectedMessage: "The provider returned an unexpected payload during the connection test.",
  })

  return {
    ok: response.parsed.ok,
    providerId: response.providerId,
    providerLabel: response.providerLabel,
    model: response.model,
    message: response.usedJsonMode
      ? `${response.parsed.message} JSON mode is available for this model.`
      : `${response.parsed.message} Compatibility mode is available for this model.`,
  }
}
