import { NextResponse } from "next/server"
import { createHash, randomUUID } from "node:crypto"
import prisma from "@/lib/prisma"
import { CommunityError, communityError, requireCommunityUser } from "@/lib/community-api"
import {
  paymentsReady,
  platformFee,
  stripeRequest,
  type StripeAccount,
  type StripeCheckout,
} from "@/lib/source-payments"
import { SITE_URL } from "@/lib/site"
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireCommunityUser(request)
    const { id } = await params
    const source = await prisma.sourcePackage.findFirst({
      where: { id, status: "APPROVED", game: { status: "PUBLISHED" } },
      include: {
        game: {
          select: {
            title: true,
            slug: true,
            creatorId: true,
            creator: { select: { payoutAccount: true } },
          },
        },
      },
    })
    if (!source) throw new CommunityError("This source project is not available.", 404)
    if (source.game.creatorId === user.id)
      return NextResponse.json({ url: "/api/source/" + id + "/download" })
    const paid = await prisma.sourceOrder.findFirst({
      where: { buyerId: user.id, packageId: id, status: "PAID" },
    })
    if (paid) return NextResponse.json({ url: "/library" })
    if (source.priceCents > 0 && !paymentsReady())
      throw new CommunityError("Paid source projects are not available yet.", 503)
    const key = request.headers.get("Idempotency-Key") || randomUUID()
    if (!/^[a-zA-Z0-9-]{8,100}$/.test(key)) throw new CommunityError("Invalid checkout request.")
    const orderId =
      "order_" +
      createHash("sha256")
        .update(user.id + ":" + id + ":" + key)
        .digest("hex")
    const order = await prisma.sourceOrder.upsert({
      where: { id: orderId },
      create: {
        id: orderId,
        buyerId: user.id,
        packageId: id,
        amountCents: source.priceCents,
        currency: source.currency,
        platformFeeCents: source.priceCents ? platformFee(source.priceCents) : 0,
        status: source.priceCents ? "PENDING" : "PAID",
        paidAt: source.priceCents ? null : new Date(),
      },
      update: {},
    })
    if (order.status === "PAID") return NextResponse.json({ url: "/library" })
    if (order.status !== "PENDING")
      throw new CommunityError("This checkout has ended. Refresh the page to try again.")
    if (order.checkoutId) {
      const checkout = await stripeRequest<StripeCheckout>("checkout/sessions/" + order.checkoutId)
      if (checkout.url) return NextResponse.json({ url: checkout.url })
      throw new CommunityError(
        "This checkout has ended. Check your library or refresh to try again.",
      )
    }
    const destination = source.game.creator.payoutAccount?.stripeAccountId
    if (!destination)
      throw new CommunityError(
        "The creator needs to complete payout setup before this project can be purchased.",
        409,
      )
    const account = await stripeRequest<StripeAccount>("accounts/" + destination)
    if (!account.charges_enabled || !account.payouts_enabled)
      throw new CommunityError(
        "The creator's payouts are not ready yet. Please try again later.",
        409,
      )
    const checkout = await stripeRequest<StripeCheckout>(
      "checkout/sessions",
      {
        mode: "payment",
        "payment_method_types[0]": "card",
        client_reference_id: order.id,
        "metadata[orderId]": order.id,
        "payment_intent_data[metadata][orderId]": order.id,
        "line_items[0][quantity]": "1",
        "line_items[0][price_data][currency]": source.currency,
        "line_items[0][price_data][unit_amount]": String(order.amountCents),
        "line_items[0][price_data][product_data][name]":
          source.game.title + " — source " + source.version,
        "payment_intent_data[transfer_data][destination]": destination,
        "payment_intent_data[application_fee_amount]": String(order.platformFeeCents),
        success_url: SITE_URL + "/library?checkout=returned",
        cancel_url: SITE_URL + "/play/" + source.game.slug + "#source-project",
        ...(user.email ? { customer_email: user.email } : {}),
      },
      order.id,
    )
    await prisma.sourceOrder.update({ where: { id: order.id }, data: { checkoutId: checkout.id } })
    if (!checkout.url) throw new CommunityError("Checkout could not be opened.", 502)
    return NextResponse.json({ url: checkout.url })
  } catch (e) {
    return communityError(e)
  }
}
