import { z } from "zod"
import { BUILDER_TEMPLATE_KEYS } from "@/lib/builder/types"

const QUICK_ACTION_KEYS = [
  "make-easier",
  "make-harder",
  "make-juicier",
  "optimize-mobile",
  "add-score-combo",
  "add-restart-polish",
] as const

export const builderProjectCreateSchema = z.object({
  templateKey: z.enum(BUILDER_TEMPLATE_KEYS),
})

export const builderMessageSchema = z.object({
  prompt: z
    .string()
    .trim()
    .min(2, "Write at least a short instruction for the builder.")
    .max(400, "Keep prompts under 400 characters."),
  actionKey: z.enum(QUICK_ACTION_KEYS).optional(),
})

export const builderRestoreSchema = z.object({
  revisionId: z.string().cuid("Pick a valid revision to restore."),
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
