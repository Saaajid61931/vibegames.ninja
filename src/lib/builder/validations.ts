import { z } from "zod"
import { BUILDER_AI_PROVIDER_IDS, BUILDER_TEMPLATE_KEYS } from "@/lib/builder/types"

const QUICK_ACTION_KEYS = [
  "make-easier",
  "make-harder",
  "make-juicier",
  "optimize-mobile",
  "add-score-combo",
  "add-restart-polish",
] as const

export const builderModelSchema = z
  .string()
  .trim()
  .min(1, "Pick a valid model.")
  .max(160, "Keep the model id under 160 characters.")
  .regex(/^[a-zA-Z0-9./:_+-]+$/, "Use a valid model slug.")

export const builderBaseUrlSchema = z
  .string()
  .trim()
  .url("Use a valid HTTP(S) base URL.")
  .max(240, "Keep the base URL under 240 characters.")

export const builderResourceNameSchema = z
  .string()
  .trim()
  .min(2, "Enter a valid Azure resource name.")
  .max(120, "Keep the Azure resource name under 120 characters.")
  .regex(/^[a-zA-Z0-9-]+$/, "Use letters, numbers, and dashes for the resource name.")

export const builderApiKeySchema = z
  .string()
  .trim()
  .min(3, "Enter a valid API key.")
  .max(240, "Keep the API key under 240 characters.")

export const builderAiSettingsSchema = z
  .object({
    providerId: z.enum(BUILDER_AI_PROVIDER_IDS).default("local"),
    model: builderModelSchema.optional(),
    apiKey: builderApiKeySchema.optional(),
    baseUrl: builderBaseUrlSchema.optional(),
    resourceName: builderResourceNameSchema.optional(),
  })
  .superRefine((data, ctx) => {
    if (data.providerId === "local") {
      return
    }

    if ((data.providerId === "openrouter" || data.providerId === "openai") && !data.apiKey) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Add an API key for this provider.",
        path: ["apiKey"],
      })
    }

    if (
      (data.providerId === "azure-openai" || data.providerId === "azure-cognitive-services") &&
      !data.resourceName
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Add your Azure resource name.",
        path: ["resourceName"],
      })
    }

    if (
      (data.providerId === "azure-openai" ||
        data.providerId === "azure-cognitive-services" ||
        data.providerId === "openai-compatible") &&
      !data.model
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Pick a model for this provider.",
        path: ["model"],
      })
    }

    if (
      (data.providerId === "azure-openai" || data.providerId === "azure-cognitive-services") &&
      !data.apiKey
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Add an API key for this provider.",
        path: ["apiKey"],
      })
    }

    if (data.providerId === "openai-compatible" && !data.baseUrl) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Add a base URL for the OpenAI-compatible endpoint.",
        path: ["baseUrl"],
      })
    }
  })

function isUuidOrCuid(value: string) {
  return z.string().uuid().safeParse(value).success || z.string().cuid().safeParse(value).success
}

export const builderProjectCreateSchema = z.object({
  templateKey: z.enum(BUILDER_TEMPLATE_KEYS).optional(),
  prompt: z
    .string()
    .trim()
    .min(8, "Describe the game idea in a bit more detail.")
    .max(400, "Keep the game idea under 400 characters.")
    .optional(),
  aiSettings: builderAiSettingsSchema.optional(),
}).superRefine((data, ctx) => {
  if (!data.templateKey && !data.prompt) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Pick a starter or describe a game idea.",
      path: ["templateKey"],
    })
  }
})

export const builderMessageSchema = z.object({
  prompt: z
    .string()
    .trim()
    .min(2, "Write at least a short instruction for the builder.")
    .max(400, "Keep prompts under 400 characters."),
  actionKey: z.enum(QUICK_ACTION_KEYS).optional(),
  aiSettings: builderAiSettingsSchema.optional(),
})

export const builderRestoreSchema = z.object({
  revisionId: z
    .string()
    .trim()
    .refine(isUuidOrCuid, "Pick a valid revision to restore."),
})

export const builderAiTestSchema = z.object({
  aiSettings: builderAiSettingsSchema,
})

export const builderPublishSchema = z.object({
  thumbnail: z
    .string()
    .max(512_000, "Thumbnail must stay under 500KB.")
    .refine(
      (value) => value.startsWith("data:image/") || value.startsWith("https://") || value.startsWith("http://"),
      "Thumbnail must be a data URL or HTTP(S) URL."
    )
    .optional(),
})
