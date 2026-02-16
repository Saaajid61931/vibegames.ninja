import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import prisma from "@/lib/prisma"
import { gameJamEntrySchema } from "@/lib/validations"

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { slug } = await params
    const jam = await prisma.gameJam.findUnique({ where: { slug } })

    if (!jam) {
      return NextResponse.json({ error: "Jam not found" }, { status: 404 })
    }

    // Auto-transition status
    const now = new Date()
    let currentStatus = jam.status
    if (currentStatus === "UPCOMING" && now >= jam.startDate) currentStatus = "ACTIVE"
    if (currentStatus === "ACTIVE" && now >= jam.endDate) currentStatus = "VOTING"
    if (currentStatus === "VOTING" && now >= jam.votingEndDate) currentStatus = "COMPLETED"

    if (currentStatus !== jam.status) {
      await prisma.gameJam.update({ where: { id: jam.id }, data: { status: currentStatus } })
    }

    if (currentStatus !== "ACTIVE") {
      return NextResponse.json(
        { error: "This jam is not currently accepting submissions" },
        { status: 400 }
      )
    }

    const body = await request.json()
    const parsed = gameJamEntrySchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Invalid entry data" },
        { status: 400 }
      )
    }

    // Verify game exists and belongs to user
    const game = await prisma.game.findUnique({
      where: { id: parsed.data.gameId },
      select: { id: true, creatorId: true, status: true },
    })

    if (!game || game.status !== "PUBLISHED") {
      return NextResponse.json({ error: "Game not found or not published" }, { status: 404 })
    }

    if (game.creatorId !== session.user.id) {
      return NextResponse.json({ error: "You can only submit your own games" }, { status: 403 })
    }

    // Check if game already submitted to this jam
    const existingGameEntry = await prisma.gameJamEntry.findUnique({
      where: { jamId_gameId: { jamId: jam.id, gameId: game.id } },
    })
    if (existingGameEntry) {
      return NextResponse.json({ error: "This game is already submitted to this jam" }, { status: 400 })
    }

    // Check if user already reached max entries
    const userEntryCount = await prisma.gameJamEntry.count({
      where: { jamId: jam.id, userId: session.user.id },
    })
    if (userEntryCount >= jam.maxEntries) {
      return NextResponse.json(
        { error: `You can only submit ${jam.maxEntries} game(s) per jam` },
        { status: 400 }
      )
    }

    const entry = await prisma.gameJamEntry.create({
      data: {
        jamId: jam.id,
        gameId: game.id,
        userId: session.user.id,
      },
      include: {
        game: {
          select: { id: true, slug: true, title: true, thumbnail: true },
        },
      },
    })

    return NextResponse.json({ entry }, { status: 201 })
  } catch (error) {
    console.error("Submit jam entry error:", error)
    return NextResponse.json({ error: "Failed to submit entry" }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { slug } = await params
    const jam = await prisma.gameJam.findUnique({ where: { slug } })
    if (!jam) {
      return NextResponse.json({ error: "Jam not found" }, { status: 404 })
    }

    const { gameId } = await request.json()
    if (!gameId) {
      return NextResponse.json({ error: "Game ID required" }, { status: 400 })
    }

    const entry = await prisma.gameJamEntry.findUnique({
      where: { jamId_gameId: { jamId: jam.id, gameId } },
    })

    if (!entry) {
      return NextResponse.json({ error: "Entry not found" }, { status: 404 })
    }

    // Only the submitter or admin can withdraw
    if (entry.userId !== session.user.id && session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 })
    }

    // Can only withdraw during ACTIVE phase
    if (jam.status !== "ACTIVE" && session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Can only withdraw entries while jam is active" }, { status: 400 })
    }

    await prisma.gameJamEntry.delete({ where: { id: entry.id } })

    return NextResponse.json({ message: "Entry withdrawn" })
  } catch (error) {
    console.error("Withdraw jam entry error:", error)
    return NextResponse.json({ error: "Failed to withdraw entry" }, { status: 500 })
  }
}
