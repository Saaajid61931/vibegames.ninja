import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import prisma from "@/lib/prisma"
import { getLiveJamStatus } from "@/lib/jams"
import { createRateLimitResponse, enforceRateLimit, RATE_LIMIT_POLICIES } from "@/lib/rate-limit"
import { logServerError } from "@/lib/server-log"
import { ratingSchema } from "@/lib/validations"

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string; entryId: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const rateLimit = enforceRateLimit({
      request,
      userId: session.user.id,
      policy: RATE_LIMIT_POLICIES.jamVote,
      keyPrefix: "api-jam-vote",
    })

    if (!rateLimit.allowed) {
      return createRateLimitResponse(rateLimit, "You are voting too quickly. Please wait before rating another entry.")
    }

    const { slug, entryId } = await params

    const jam = await prisma.gameJam.findUnique({ where: { slug } })
    if (!jam) {
      return NextResponse.json({ error: "Jam not found" }, { status: 404 })
    }

    const currentStatus = getLiveJamStatus(jam)

    if (currentStatus !== "VOTING") {
      return NextResponse.json({ error: "Voting is not open for this jam" }, { status: 400 })
    }

    const entry = await prisma.gameJamEntry.findUnique({
      where: { id: entryId },
      select: { id: true, jamId: true, userId: true },
    })

    if (!entry || entry.jamId !== jam.id) {
      return NextResponse.json({ error: "Entry not found in this jam" }, { status: 404 })
    }

    // Can't vote on own entry
    if (entry.userId === session.user.id) {
      return NextResponse.json({ error: "You cannot vote on your own entry" }, { status: 400 })
    }

    const body = await request.json()
    const parsed = ratingSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Invalid vote" },
        { status: 400 }
      )
    }

    const vote = await prisma.gameJamVote.upsert({
      where: {
        entryId_userId: { entryId, userId: session.user.id },
      },
      update: { score: parsed.data.score },
      create: {
        entryId,
        userId: session.user.id,
        score: parsed.data.score,
      },
    })

    return NextResponse.json({ vote })
  } catch (error) {
    logServerError("Vote error", error, {
      route: "/api/jams/[slug]/entries/[entryId]/vote",
      method: "POST",
    })
    return NextResponse.json({ error: "Failed to vote" }, { status: 500 })
  }
}
