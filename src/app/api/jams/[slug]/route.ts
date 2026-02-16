import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import prisma from "@/lib/prisma"
import { gameJamSchema } from "@/lib/validations"

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params

    // Auto-transition statuses
    const now = new Date()
    await prisma.gameJam.updateMany({
      where: { status: "UPCOMING", startDate: { lte: now } },
      data: { status: "ACTIVE" },
    })
    await prisma.gameJam.updateMany({
      where: { status: "ACTIVE", endDate: { lte: now } },
      data: { status: "VOTING" },
    })
    await prisma.gameJam.updateMany({
      where: { status: "VOTING", votingEndDate: { lte: now } },
      data: { status: "COMPLETED" },
    })

    const jam = await prisma.gameJam.findUnique({
      where: { slug },
      include: {
        createdBy: { select: { id: true, name: true, username: true } },
        entries: {
          include: {
            game: {
              select: {
                id: true,
                slug: true,
                title: true,
                thumbnail: true,
                plays: true,
                category: true,
                createdAt: true,
              },
            },
            user: {
              select: { id: true, name: true, username: true, image: true },
            },
            votes: {
              select: { score: true, userId: true },
            },
          },
          orderBy: { submittedAt: "asc" },
        },
      },
    })

    if (!jam) {
      return NextResponse.json({ error: "Jam not found" }, { status: 404 })
    }

    // Calculate average scores for entries
    const entriesWithScores = jam.entries.map((entry) => {
      const totalScore = entry.votes.reduce((sum, v) => sum + v.score, 0)
      const voteCount = entry.votes.length
      return {
        ...entry,
        avgScore: voteCount > 0 ? totalScore / voteCount : 0,
        voteCount,
      }
    })

    // Sort by avg score descending for results view
    if (jam.status === "COMPLETED" || jam.status === "VOTING") {
      entriesWithScores.sort((a, b) => b.avgScore - a.avgScore)
    }

    return NextResponse.json({
      ...jam,
      entries: entriesWithScores,
    })
  } catch (error) {
    console.error("Get jam error:", error)
    return NextResponse.json({ error: "Failed to fetch jam" }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Admin only" }, { status: 403 })
    }

    const { slug } = await params
    const jam = await prisma.gameJam.findUnique({ where: { slug } })
    if (!jam) {
      return NextResponse.json({ error: "Jam not found" }, { status: 404 })
    }

    const body = await request.json()
    const parsed = gameJamSchema.partial().safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Invalid jam data" },
        { status: 400 }
      )
    }

    const updateData: Record<string, unknown> = {}
    if (parsed.data.title !== undefined) updateData.title = parsed.data.title
    if (parsed.data.description !== undefined) updateData.description = parsed.data.description
    if (parsed.data.theme !== undefined) updateData.theme = parsed.data.theme || null
    if (parsed.data.rules !== undefined) updateData.rules = parsed.data.rules || null
    if (parsed.data.bannerImage !== undefined) updateData.bannerImage = parsed.data.bannerImage || null
    if (parsed.data.startDate !== undefined) updateData.startDate = new Date(parsed.data.startDate)
    if (parsed.data.endDate !== undefined) updateData.endDate = new Date(parsed.data.endDate)
    if (parsed.data.votingEndDate !== undefined) updateData.votingEndDate = new Date(parsed.data.votingEndDate)
    if (parsed.data.maxEntries !== undefined) updateData.maxEntries = parsed.data.maxEntries

    const updated = await prisma.gameJam.update({
      where: { slug },
      data: updateData,
    })

    return NextResponse.json({ jam: updated })
  } catch (error) {
    console.error("Update jam error:", error)
    return NextResponse.json({ error: "Failed to update jam" }, { status: 500 })
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Admin only" }, { status: 403 })
    }

    const { slug } = await params
    const jam = await prisma.gameJam.findUnique({ where: { slug } })
    if (!jam) {
      return NextResponse.json({ error: "Jam not found" }, { status: 404 })
    }

    await prisma.gameJam.delete({ where: { slug } })

    return NextResponse.json({ message: "Jam deleted" })
  } catch (error) {
    console.error("Delete jam error:", error)
    return NextResponse.json({ error: "Failed to delete jam" }, { status: 500 })
  }
}
