import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import prisma from "@/lib/prisma"
import { gameJamSchema } from "@/lib/validations"

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80)
}

// Auto-transition jam statuses based on current date
async function autoTransitionJamStatuses() {
  const now = new Date()

  // UPCOMING -> ACTIVE (startDate has passed)
  await prisma.gameJam.updateMany({
    where: { status: "UPCOMING", startDate: { lte: now } },
    data: { status: "ACTIVE" },
  })

  // ACTIVE -> VOTING (endDate has passed)
  await prisma.gameJam.updateMany({
    where: { status: "ACTIVE", endDate: { lte: now } },
    data: { status: "VOTING" },
  })

  // VOTING -> COMPLETED (votingEndDate has passed)
  await prisma.gameJam.updateMany({
    where: { status: "VOTING", votingEndDate: { lte: now } },
    data: { status: "COMPLETED" },
  })
}

export async function GET() {
  try {
    await autoTransitionJamStatuses()

    const jams = await prisma.gameJam.findMany({
      orderBy: [{ startDate: "desc" }],
      include: {
        _count: { select: { entries: true } },
        createdBy: { select: { id: true, name: true, username: true } },
      },
    })

    const grouped = {
      active: jams.filter((j) => j.status === "ACTIVE"),
      upcoming: jams.filter((j) => j.status === "UPCOMING"),
      voting: jams.filter((j) => j.status === "VOTING"),
      completed: jams.filter((j) => j.status === "COMPLETED"),
    }

    return NextResponse.json(grouped)
  } catch (error) {
    console.error("List jams error:", error)
    return NextResponse.json({ error: "Failed to fetch jams" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Admin only" }, { status: 403 })
    }

    const body = await request.json()
    const parsed = gameJamSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Invalid jam data" },
        { status: 400 }
      )
    }

    const { title, description, theme, rules, bannerImage, startDate, endDate, votingEndDate, maxEntries } = parsed.data

    const start = new Date(startDate)
    const end = new Date(endDate)
    const votingEnd = new Date(votingEndDate)

    if (end <= start) {
      return NextResponse.json({ error: "End date must be after start date" }, { status: 400 })
    }
    if (votingEnd <= end) {
      return NextResponse.json({ error: "Voting end date must be after end date" }, { status: 400 })
    }

    let slug = slugify(title)
    const existing = await prisma.gameJam.findUnique({ where: { slug } })
    if (existing) {
      slug = `${slug}-${Date.now().toString(36)}`
    }

    const now = new Date()
    let status = "UPCOMING"
    if (now >= start && now < end) status = "ACTIVE"
    else if (now >= end && now < votingEnd) status = "VOTING"
    else if (now >= votingEnd) status = "COMPLETED"

    const jam = await prisma.gameJam.create({
      data: {
        title,
        slug,
        description,
        theme: theme || null,
        rules: rules || null,
        bannerImage: bannerImage || null,
        status,
        startDate: start,
        endDate: end,
        votingEndDate: votingEnd,
        maxEntries,
        createdById: session.user.id,
      },
    })

    return NextResponse.json({ jam }, { status: 201 })
  } catch (error) {
    console.error("Create jam error:", error)
    return NextResponse.json({ error: "Failed to create jam" }, { status: 500 })
  }
}
