import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import prisma from "@/lib/prisma"
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

    const { slug, entryId } = await params

    const jam = await prisma.gameJam.findUnique({ where: { slug } })
    if (!jam) {
      return NextResponse.json({ error: "Jam not found" }, { status: 404 })
    }

    // Auto-transition
    const now = new Date()
    let currentStatus = jam.status
    if (currentStatus === "ACTIVE" && now >= jam.endDate) currentStatus = "VOTING"
    if (currentStatus === "VOTING" && now >= jam.votingEndDate) currentStatus = "COMPLETED"
    if (currentStatus !== jam.status) {
      await prisma.gameJam.update({ where: { id: jam.id }, data: { status: currentStatus } })
    }

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
    console.error("Vote error:", error)
    return NextResponse.json({ error: "Failed to vote" }, { status: 500 })
  }
}
