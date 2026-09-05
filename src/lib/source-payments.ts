import { createHmac, timingSafeEqual } from "node:crypto"
import { CommunityError } from "@/lib/community-api"
import { sourceStorageReady } from "@/lib/source-storage"
export function paymentsReady() {
  return (
    process.env.SOURCE_SALES_ENABLED === "true" &&
    Boolean(
      process.env.STRIPE_SECRET_KEY &&
      process.env.STRIPE_WEBHOOK_SECRET &&
      process.env.SOURCE_PLATFORM_FEE_BPS,
    ) &&
    Number.isInteger(Number(process.env.SOURCE_PLATFORM_FEE_BPS)) &&
    Number(process.env.SOURCE_PLATFORM_FEE_BPS) >= 0 &&
    Number(process.env.SOURCE_PLATFORM_FEE_BPS) <= 3000 &&
    sourceStorageReady()
  )
}
export function platformFee(amount: number) {
  const rate = Number(process.env.SOURCE_PLATFORM_FEE_BPS || "0")
  if (!Number.isInteger(rate) || rate < 0 || rate > 3000)
    throw new CommunityError("Payments are temporarily unavailable.", 503)
  return Math.floor((amount * rate) / 10000)
}
export async function stripeRequest<T>(
  path: string,
  fields?: Record<string, string>,
  idempotencyKey?: string,
): Promise<T> {
  const secret = process.env.STRIPE_SECRET_KEY
  if (!secret) throw new CommunityError("Payments are not available yet.", 503)
  const response = await fetch("https://api.stripe.com/v1/" + path, {
    method: fields ? "POST" : "GET",
    headers: {
      Authorization: "Bearer " + secret,
      ...(fields ? { "Content-Type": "application/x-www-form-urlencoded" } : {}),
      ...(idempotencyKey ? { "Idempotency-Key": idempotencyKey } : {}),
    },
    body: fields ? new URLSearchParams(fields).toString() : undefined,
    cache: "no-store",
    signal: AbortSignal.timeout(15000),
  })
  if (!response.ok)
    throw new CommunityError(
      "The payment provider could not complete this request. Please try again.",
      502,
    )
  return response.json()
}
export function verifyStripeSignature(
  body: string,
  header: string,
  secret: string,
  now = Math.floor(Date.now() / 1000),
) {
  const fields = header.split(",").map((part) => part.split("="))
  const timestamp = fields.find(([key]) => key === "t")?.[1]
  if (!timestamp || !/^\d+$/.test(timestamp) || Math.abs(now - Number(timestamp)) > 300)
    return false
  const expected = createHmac("sha256", secret)
    .update(timestamp + "." + body)
    .digest()
  return fields
    .filter(([key]) => key === "v1")
    .some(([, signature]) => {
      if (!/^[a-f0-9]{64}$/i.test(signature || "")) return false
      const actual = Buffer.from(signature, "hex")
      return actual.length === expected.length && timingSafeEqual(actual, expected)
    })
}
export type StripeAccount = {
  id: string
  charges_enabled: boolean
  payouts_enabled: boolean
  details_submitted: boolean
}
export type StripeCheckout = {
  id: string
  url: string | null
  payment_status: string
  amount_total: number | null
  currency: string | null
  payment_intent: string | null
  metadata?: { orderId?: string }
}
