import { z } from "zod"
export const sourceMetadataSchema = z.object({
  version: z
    .string()
    .trim()
    .regex(/^[a-zA-Z0-9][a-zA-Z0-9._-]{0,39}$/, "Use a short version such as 1.0.0."),
  description: z.string().trim().min(20).max(2000),
  readme: z.string().trim().min(40).max(20000),
  license: z.string().trim().min(40).max(12000),
  format: z.string().trim().min(2).max(80),
  requirements: z.string().trim().max(3000).default(""),
  exclusions: z.string().trim().max(3000).default(""),
  priceCents: z
    .number()
    .int()
    .min(0)
    .max(100000)
    .refine((n) => n === 0 || n >= 100, "Paid projects start at $1."),
  rightsConfirmed: z.literal(true, {
    error: "Confirm you have permission to share every included file.",
  }),
})
export const storySchema = z.object({
  idea: z.string().trim().max(3000),
  lessons: z.string().trim().max(3000),
  nextIdea: z.string().trim().max(2000),
  builtFromPackageId: z.string().max(100).default(""),
  inspiredBySlug: z.string().trim().max(160).default(""),
})
export function safeSourcePath(name: string) {
  const path = name.replaceAll("\\", "/")
  return (
    !path.startsWith("/") &&
    !/^[a-z]:/i.test(path) &&
    !path.split("/").some((p) => p === ".." || p === ".git" || p === "node_modules") &&
    !/(^|\/)\.env($|\.(?!example$|sample$))/i.test(path) &&
    !/[\x00-\x1f]/.test(path) &&
    !/[<>:"|?*]/.test(path) &&
    !/[. ]($|\/)/.test(path) &&
    !/\.(exe|dll|com|bat|cmd|ps1|pfx|pem|key)$/i.test(path)
  )
}
export function paymentMatchesOrder(
  order: { amountCents: number; currency: string; checkoutId: string | null },
  checkout: {
    id: string
    amount_total: number | null
    currency: string | null
    payment_status: string
  },
) {
  return (
    checkout.payment_status === "paid" &&
    checkout.amount_total === order.amountCents &&
    checkout.currency === order.currency &&
    (!order.checkoutId || order.checkoutId === checkout.id)
  )
}
