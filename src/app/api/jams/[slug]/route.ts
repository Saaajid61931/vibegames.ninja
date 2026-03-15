import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import prisma from "@/lib/prisma"
import { gameJamSchema } from "@/lib/validations"
import { deleteJamBannerAssetsFromR2, uploadJamBannerToR2, validateR2Config } from "@/lib/storage"

const MAX_BANNER_BYTES = 5 * 1024 * 1024

function getJamStatus(start: Date, end: Date, votingEnd: Date) {
  const now = new Date()
  if (now >= start && now < end) return "ACTIVE"
  if (now >= end && now < votingEnd) return "VOTING"
  if (now >= votingEnd) return "COMPLETED"
  return "UPCOMING"
}

function parseMaxEntries(value: FormDataEntryValue | null) {
  const parsed = Number.parseInt(String(value || "1"), 10)
  return Number.isFinite(parsed) ? parsed : 1
}

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

    const contentType = request.headers.get("content-type") || ""
    let parsedInput: unknown
    let bannerFile: File | null = null
    let removeBanner = false

    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData()
      const maybeBanner = formData.get("bannerFile")
      bannerFile = maybeBanner instanceof File && maybeBanner.size > 0 ? maybeBanner : null
      removeBanner = String(formData.get("removeBanner") || "") === "true"
      parsedInput = {
        title: String(formData.get("title") || ""),
        description: String(formData.get("description") || ""),
        theme: String(formData.get("theme") || "") || undefined,
        rules: String(formData.get("rules") || "") || undefined,
        bannerImage: String(formData.get("bannerImage") || "") || undefined,
        startDate: String(formData.get("startDate") || ""),
        endDate: String(formData.get("endDate") || ""),
        votingEndDate: String(formData.get("votingEndDate") || ""),
        maxEntries: parseMaxEntries(formData.get("maxEntries")),
      }
    } else {
      parsedInput = await request.json()
    }

    const parsed = gameJamSchema.partial().safeParse(parsedInput)
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Invalid jam data" },
        { status: 400 }
      )
    }

    if (bannerFile) {
      const r2Config = validateR2Config()
      if (!r2Config.valid) {
        return NextResponse.json(
          { error: `R2 storage is not configured. Missing: ${r2Config.missing.join(", ")}` },
          { status: 500 }
        )
      }
      if (bannerFile.size > MAX_BANNER_BYTES) {
        return NextResponse.json({ error: "Banner image exceeds 5MB limit" }, { status: 400 })
      }
    }

    const resolvedStart = parsed.data.startDate ? new Date(parsed.data.startDate) : jam.startDate
    const resolvedEnd = parsed.data.endDate ? new Date(parsed.data.endDate) : jam.endDate
    const resolvedVotingEnd = parsed.data.votingEndDate ? new Date(parsed.data.votingEndDate) : jam.votingEndDate

    if (resolvedEnd <= resolvedStart) {
      return NextResponse.json({ error: "End date must be after start date" }, { status: 400 })
    }
    if (resolvedVotingEnd <= resolvedEnd) {
      return NextResponse.json({ error: "Voting end date must be after end date" }, { status: 400 })
    }

    const updateData: Record<string, unknown> = {
      status: getJamStatus(resolvedStart, resolvedEnd, resolvedVotingEnd),
    }
    if (parsed.data.title !== undefined) updateData.title = parsed.data.title
    if (parsed.data.description !== undefined) updateData.description = parsed.data.description
    if (parsed.data.theme !== undefined) updateData.theme = parsed.data.theme || null
    if (parsed.data.rules !== undefined) updateData.rules = parsed.data.rules || null
    if (parsed.data.bannerImage !== undefined) updateData.bannerImage = parsed.data.bannerImage || null
    if (parsed.data.startDate !== undefined) updateData.startDate = resolvedStart
    if (parsed.data.endDate !== undefined) updateData.endDate = resolvedEnd
    if (parsed.data.votingEndDate !== undefined) updateData.votingEndDate = resolvedVotingEnd
    if (parsed.data.maxEntries !== undefined) updateData.maxEntries = parsed.data.maxEntries

    let updated = await prisma.gameJam.update({
      where: { slug },
      data: updateData,
    })

    const shouldClearBanner = removeBanner

    if (shouldClearBanner && validateR2Config().valid) {
      await deleteJamBannerAssetsFromR2(jam.id)
      updated = await prisma.gameJam.update({
        where: { id: jam.id },
        data: { bannerImage: null },
      })
    }

    if (
      !bannerFile &&
      parsed.data.bannerImage &&
      parsed.data.bannerImage !== jam.bannerImage &&
      validateR2Config().valid
    ) {
      await deleteJamBannerAssetsFromR2(jam.id)
    }

    if (bannerFile) {
      const bannerImage = await uploadJamBannerToR2(jam.id, bannerFile)
      updated = await prisma.gameJam.update({
        where: { id: jam.id },
        data: { bannerImage },
      })
    }

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

    if (validateR2Config().valid) {
      await deleteJamBannerAssetsFromR2(jam.id)
    }

    await prisma.gameJam.delete({ where: { slug } })

    return NextResponse.json({ message: "Jam deleted" })
  } catch (error) {
    console.error("Delete jam error:", error)
    return NextResponse.json({ error: "Failed to delete jam" }, { status: 500 })
  }
}
