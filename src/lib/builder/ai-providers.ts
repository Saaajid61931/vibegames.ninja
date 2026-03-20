import type {
  BuilderAiProviderId,
  BuilderAiSettings,
  BuilderExternalAiProviderId,
} from "@/lib/builder/types"

export type BuilderAiFieldKey = "apiKey" | "model" | "resourceName" | "baseUrl"

export type BuilderAiAuthMethod =
  | "none"
  | "api-key"
  | "api-key-and-resource"
  | "optional-api-key"
  | "base-url"

export interface BuilderAiProviderOption {
  id: BuilderAiProviderId
  label: string
  shortLabel: string
  description: string
  authLabel: string
  authMethod: BuilderAiAuthMethod
  docsUrl?: string
  defaultModel?: string
  modelPlaceholder?: string
  suggestedModels: string[]
  fieldOrder: BuilderAiFieldKey[]
}

export const DEFAULT_BUILDER_MODEL_BY_PROVIDER: Partial<
  Record<BuilderExternalAiProviderId, string>
> = {
  openrouter: "openai/gpt-5.2-chat",
  openai: "gpt-5.2",
  "azure-openai": "gpt-5.2",
  "azure-cognitive-services": "gpt-5.2",
}

export const BUILDER_AI_PROVIDER_OPTIONS: BuilderAiProviderOption[] = [
  {
    id: "local",
    label: "Local Builder",
    shortLabel: "Local",
    description: "Use the built-in game builder with no external credentials.",
    authLabel: "No authentication needed",
    authMethod: "none",
    suggestedModels: [],
    fieldOrder: [],
  },
  {
    id: "openrouter",
    label: "OpenRouter",
    shortLabel: "OpenRouter",
    description: "OpenCode-style provider/model ids through the OpenRouter catalog.",
    authLabel: "API key",
    authMethod: "api-key",
    docsUrl: "https://opencode.ai/docs/providers/",
    defaultModel: DEFAULT_BUILDER_MODEL_BY_PROVIDER.openrouter,
    modelPlaceholder: DEFAULT_BUILDER_MODEL_BY_PROVIDER.openrouter,
    suggestedModels: [
      "openai/gpt-5.2-chat",
      "openai/gpt-5.1",
      "anthropic/claude-sonnet-4.5",
      "google/gemini-2.5-pro",
      "moonshotai/kimi-k2",
    ],
    fieldOrder: ["apiKey", "model"],
  },
  {
    id: "openai",
    label: "OpenAI",
    shortLabel: "OpenAI",
    description: "Direct OpenAI API access with current coding-friendly models.",
    authLabel: "API key",
    authMethod: "api-key",
    docsUrl: "https://opencode.ai/docs/providers/",
    defaultModel: DEFAULT_BUILDER_MODEL_BY_PROVIDER.openai,
    modelPlaceholder: DEFAULT_BUILDER_MODEL_BY_PROVIDER.openai,
    suggestedModels: ["gpt-5.2", "gpt-5.1-codex", "gpt-5.1", "gpt-4.1"],
    fieldOrder: ["apiKey", "model"],
  },
  {
    id: "azure-openai",
    label: "Azure OpenAI",
    shortLabel: "Azure",
    description: "Azure-hosted OpenAI deployments using a resource name plus API key.",
    authLabel: "API key + resource name",
    authMethod: "api-key-and-resource",
    docsUrl: "https://opencode.ai/docs/providers/",
    defaultModel: DEFAULT_BUILDER_MODEL_BY_PROVIDER["azure-openai"],
    modelPlaceholder: "Enter your Azure deployment name",
    suggestedModels: ["gpt-5.2", "gpt-5.1", "gpt-4.1"],
    fieldOrder: ["resourceName", "apiKey", "model"],
  },
  {
    id: "azure-cognitive-services",
    label: "Azure Cognitive Services",
    shortLabel: "Azure CS",
    description: "Azure Cognitive Services OpenAI endpoint using a resource name plus API key.",
    authLabel: "API key + resource name",
    authMethod: "api-key-and-resource",
    docsUrl: "https://opencode.ai/docs/providers/",
    defaultModel: DEFAULT_BUILDER_MODEL_BY_PROVIDER["azure-cognitive-services"],
    modelPlaceholder: "Enter your Azure deployment name",
    suggestedModels: ["gpt-5.2", "gpt-5.1", "gpt-4.1"],
    fieldOrder: ["resourceName", "apiKey", "model"],
  },
  {
    id: "openai-compatible",
    label: "Custom / Local OpenAI-Compatible",
    shortLabel: "Custom",
    description:
      "Use any OpenAI-compatible base URL, including Ollama, LM Studio, llama.cpp, Groq, Fireworks, or Together.",
    authLabel: "Base URL + model, API key optional",
    authMethod: "optional-api-key",
    docsUrl: "https://opencode.ai/docs/providers/",
    modelPlaceholder: "Enter the provider model id",
    suggestedModels: [
      "qwen2.5-coder:latest",
      "qwen3-coder",
      "deepseek-chat",
      "kimi-k2-instruct",
    ],
    fieldOrder: ["baseUrl", "apiKey", "model"],
  },
]

export function getBuilderAiProviderOption(providerId: BuilderAiProviderId) {
  return (
    BUILDER_AI_PROVIDER_OPTIONS.find((provider) => provider.id === providerId) ??
    BUILDER_AI_PROVIDER_OPTIONS[0]
  )
}

export function getBuilderProviderLabel(providerId: BuilderAiProviderId) {
  return getBuilderAiProviderOption(providerId).label
}

export function getBuilderDefaultModel(providerId: BuilderAiProviderId) {
  return providerId === "local" ? "" : DEFAULT_BUILDER_MODEL_BY_PROVIDER[providerId] || ""
}

export function normalizeBuilderAiSettings(
  settings: Partial<BuilderAiSettings> | null | undefined,
): BuilderAiSettings {
  const providerId = settings?.providerId || "local"
  const model =
    providerId === "local"
      ? ""
      : settings?.model?.trim() || getBuilderDefaultModel(providerId)

  return {
    providerId,
    model: model || null,
    apiKey: settings?.apiKey?.trim() || null,
    baseUrl: settings?.baseUrl?.trim() || null,
    resourceName: settings?.resourceName?.trim() || null,
  }
}

export function builderAiSettingsAreConfigured(settings: BuilderAiSettings) {
  switch (settings.providerId) {
    case "local":
      return true
    case "openrouter":
    case "openai":
      return Boolean(settings.apiKey?.trim())
    case "azure-openai":
    case "azure-cognitive-services":
      return Boolean(settings.apiKey?.trim() && settings.resourceName?.trim() && settings.model?.trim())
    case "openai-compatible":
      return Boolean(settings.baseUrl?.trim() && settings.model?.trim())
    default:
      return false
  }
}

export function getBuilderProviderStatusLabel(settings: BuilderAiSettings) {
  if (settings.providerId === "local") {
    return "LOCAL MODE"
  }

  return builderAiSettingsAreConfigured(settings) ? "READY" : "SETUP NEEDED"
}
