import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { verifyStripeSignature, stripeRequest, type StripeCheckout } from "@/lib/source-payments"
import { paymentMatchesOrder } from "@/lib/source-projects"
export async function POST(request: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET
  if (!secret) return NextResponse.json({ error: "Unavailable" }, { status: 503 })
  const body = await request.text()
  if (!verifyStripeSignature(body, request.headers.get("stripe-signature") || "", secret))
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 })
  try {
    const event = JSON.parse(body)
    const object = event.data?.object
    if (!object) return NextResponse.json({ received: true })
    if (
      event.type === "checkout.session.completed" ||
      event.type === "checkout.session.async_payment_succeeded"
    ) {
      const checkout = object as StripeCheckout
      const id = checkout.metadata?.orderId
      if (id) {
        const order = await prisma.sourceOrder.findUnique({ where: { id } })
        if (order && paymentMatchesOrder(order, checkout))
          await prisma.sourceOrder.updateMany({
            where: { id, status: "PENDING" },
            data: {
              status: "PAID",
              paidAt: new Date(),
              checkoutId: checkout.id,
              paymentIntentId: checkout.payment_intent,
            },
          })
      }
    }
    if (
      event.type === "checkout.session.expired" ||
      event.type === "checkout.session.async_payment_failed"
    ) {
      const id = object.metadata?.orderId
      if (id)
        await prisma.sourceOrder.updateMany({
          where: { id, status: "PENDING" },
          data: { status: "EXPIRED" },
        })
    }
    if (
      event.type === "charge.refunded" &&
      object.refunded === true &&
      typeof object.payment_intent === "string"
    ) {
      const payment = await stripeRequest<{ metadata?: { orderId?: string } }>(
        "payment_intents/" + object.payment_intent,
      )
      if (payment.metadata?.orderId)
        await prisma.sourceOrder.updateMany({
          where: { id: payment.metadata.orderId },
          data: { status: "REFUNDED", paymentIntentId: object.payment_intent },
        })
    }
    if (event.type === "charge.dispute.created" && typeof object.payment_intent === "string") {
      await prisma.sourceOrder.updateMany({
        where: { paymentIntentId: object.payment_intent, status: "PAID" },
        data: { status: "DISPUTED" },
      })
    }
    if (event.type === "charge.dispute.closed" && typeof object.payment_intent === "string") {
      await prisma.sourceOrder.updateMany({
        where: { paymentIntentId: object.payment_intent, status: "DISPUTED" },
        data: { status: object.status === "won" ? "PAID" : "REFUNDED" },
      })
    }
    return NextResponse.json({ received: true })
  } catch {
    return NextResponse.json({ error: "Please retry this event." }, { status: 500 })
  }
}
