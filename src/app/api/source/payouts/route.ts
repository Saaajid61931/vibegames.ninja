import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { CommunityError, communityError, requireCommunityUser } from "@/lib/community-api"
import { paymentsReady, stripeRequest, type StripeAccount } from "@/lib/source-payments"
import { SITE_URL } from "@/lib/site"
export async function GET() {
  try {
    const user = await requireCommunityUser()
    if (!paymentsReady()) return NextResponse.json({ available: false, ready: false })
    const saved = await prisma.creatorPayoutAccount.findUnique({ where: { userId: user.id } })
    if (!saved) return NextResponse.json({ available: true, ready: false })
    const account = await stripeRequest<StripeAccount>("accounts/" + saved.stripeAccountId)
    return NextResponse.json({
      available: true,
      ready: account.charges_enabled && account.payouts_enabled,
    })
  } catch (e) {
    return communityError(e)
  }
}
export async function POST(request: Request) {
  try {
    const user = await requireCommunityUser(request)
    if (!paymentsReady()) throw new CommunityError("Payout setup is not available yet.", 503)
    const country = process.env.SOURCE_SELLER_COUNTRY
    if (!country || !/^([A-Z]{2})$/.test(country))
      throw new CommunityError("Payout onboarding is not configured for this launch yet.", 503)
    let saved = await prisma.creatorPayoutAccount.findUnique({ where: { userId: user.id } })
    if (!saved) {
      const account = await stripeRequest<StripeAccount>(
        "accounts",
        {
          type: "express",
          country,
          "capabilities[card_payments][requested]": "true",
          "capabilities[transfers][requested]": "true",
          ...(user.email ? { email: user.email } : {}),
        },
        "creator-account-" + user.id + "-" + country,
      )
      saved = await prisma.creatorPayoutAccount.upsert({
        where: { userId: user.id },
        create: { userId: user.id, stripeAccountId: account.id },
        update: {},
      })
    }
    const link = await stripeRequest<{ url: string }>("account_links", {
      account: saved.stripeAccountId,
      type: "account_onboarding",
      refresh_url: SITE_URL + "/creator/projects",
      return_url: SITE_URL + "/creator/projects",
    })
    return NextResponse.json({ url: link.url })
  } catch (e) {
    return communityError(e)
  }
}
