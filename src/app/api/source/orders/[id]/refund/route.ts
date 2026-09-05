import { NextResponse } from "next/server"
import { z } from "zod"
import prisma from "@/lib/prisma"
import { CommunityError, communityError, requireCommunityUser } from "@/lib/community-api"
import { paymentsReady, stripeRequest } from "@/lib/source-payments"
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireCommunityUser(request)
    const { id } = await params
    const { reason } = z
      .object({ reason: z.string().trim().min(10).max(2000) })
      .parse(await request.json())
    const order = await prisma.sourceOrder.findFirst({
      where: { id, buyerId: user.id, status: "PAID", amountCents: { gt: 0 } },
    })
    if (!order) throw new CommunityError("Paid purchase not found.", 404)
    if (order.refundRequestedAt)
      throw new CommunityError(
        "Your request is already recorded. You can see updates in your library.",
        409,
      )
    await prisma.sourceOrder.update({
      where: { id },
      data: { refundRequestedAt: new Date(), refundReason: reason },
    })
    return NextResponse.json({ ok: true })
  } catch (e) {
    return communityError(e)
  }
}
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireCommunityUser(request)
    if (user.role !== "ADMIN") throw new CommunityError("Not allowed.", 403)
    const { id } = await params
    const { action, note } = z
      .object({ action: z.enum(["refund", "reply"]), note: z.string().trim().min(5).max(2000) })
      .parse(await request.json())
    const order = await prisma.sourceOrder.findUnique({ where: { id } })
    if (!order || !order.refundRequestedAt) throw new CommunityError("Request not found.", 404)
    if (action === "reply") {
      await prisma.sourceOrder.update({ where: { id }, data: { supportReply: note } })
      return NextResponse.json({ ok: true })
    }
    if (order.status === "REFUNDED") return NextResponse.json({ ok: true })
    if (order.status !== "PAID" || !order.paymentIntentId || !paymentsReady())
      throw new CommunityError("This purchase cannot be refunded automatically right now.", 409)
    const refund = await stripeRequest<{ id: string; status: string }>(
      "refunds",
      {
        payment_intent: order.paymentIntentId,
        reverse_transfer: "true",
        refund_application_fee: "true",
      },
      "source-refund-" + order.id,
    )
    if (refund.status === "failed" || refund.status === "canceled")
      throw new CommunityError(
        "The provider could not issue this refund. Check the payment dashboard.",
        502,
      )
    await prisma.sourceOrder.update({
      where: { id },
      data: {
        supportReply: note,
        ...(refund.status === "succeeded" ? { status: "REFUNDED" } : {}),
      },
    })
    return NextResponse.json({ ok: true, pending: refund.status !== "succeeded" })
  } catch (e) {
    return communityError(e)
  }
}
