import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import prisma from "@/lib/prisma"
import { getLiveJamStatus } from "@/lib/jams"
import { gameJamSchema } from "@/lib/validations"
import { uploadJamBannerToR2, validateR2Config } from "@/lib/storage"
import { logServerError } from "@/lib/server-log"

const MAX_BANNER_BYTES = 5 * 1024 * 1024

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80)
}

function parseMaxEntries(value: FormDataEntryValue | null) {
  const parsed = Number.parseInt(String(value || "1"), 10)
  return Number.isFinite(parsed) ? parsed : 1
}

export async function GET() {
  try {
    const session = await auth()

    const jams = await prisma.gameJam.findMany({
      orderBy: [{ startDate: "desc" }],
      include: {
        _count: { select: { entries: true } },
        createdBy: { select: { id: true, name: true, username: true } },
      },
    })

    const userEntryCounts = new Map<string, number>()

    if (session?.user?.id && jams.length > 0) {
      const counts = await prisma.gameJamEntry.groupBy({
        by: ["jamId"],
        where: {
          userId: session.user.id,
          jamId: {
            in: jams.map((jam) => jam.id),
          },
        },
        _count: {
          _all: true,
        },
      })

      for (const item of counts) {
        userEntryCounts.set(item.jamId, item._count._all)
      }
    }

    const enrichedJams = jams.map((jam) => {
      const userEntryCount = userEntryCounts.get(jam.id) || 0
      const currentStatus = getLiveJamStatus(jam)
      const remainingEntries = Math.max(jam.maxEntries - userEntryCount, 0)

      return {
        ...jam,
        status: currentStatus,
        userEntryCount,
        remainingEntries,
        isEligibleToSubmit: currentStatus === "ACTIVE" && remainingEntries > 0,
      }
    })

    const grouped = {
      active: enrichedJams.filter((j) => j.status === "ACTIVE"),
      upcoming: enrichedJams.filter((j) => j.status === "UPCOMING"),
      voting: enrichedJams.filter((j) => j.status === "VOTING"),
      completed: enrichedJams.filter((j) => j.status === "COMPLETED"),
    }

    return NextResponse.json(grouped)
  } catch (error) {
    logServerError("List jams error", error, {
      route: "/api/jams",
      method: "GET",
    })
    return NextResponse.json({ error: "Failed to fetch jams" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Admin only" }, { status: 403 })
    }

    const contentType = request.headers.get("content-type") || ""
    let parsedInput: unknown
    let bannerFile: File | null = null

    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData()
      const maybeBanner = formData.get("bannerFile")
      bannerFile = maybeBanner instanceof File && maybeBanner.size > 0 ? maybeBanner : null
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

    const parsed = gameJamSchema.safeParse(parsedInput)
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Invalid jam data" },
        { status: 400 }
      )
    }

    const { title, description, theme, rules, startDate, endDate, votingEndDate, maxEntries } = parsed.data

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

    const status = getLiveJamStatus({
      startDate: start,
      endDate: end,
      votingEndDate: votingEnd,
    })

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

    let jam = await prisma.gameJam.create({
      data: {
        title,
        slug,
        description,
        theme: theme || null,
        rules: rules || null,
        bannerImage: parsed.data.bannerImage || null,
        status,
        startDate: start,
        endDate: end,
        votingEndDate: votingEnd,
        maxEntries,
        createdById: session.user.id,
      },
    })

    if (bannerFile) {
      const bannerImage = await uploadJamBannerToR2(jam.id, bannerFile)
      jam = await prisma.gameJam.update({
        where: { id: jam.id },
        data: { bannerImage },
      })
    }

    return NextResponse.json({ jam }, { status: 201 })
  } catch (error) {
    logServerError("Create jam error", error, {
      route: "/api/jams",
      method: "POST",
    })
    return NextResponse.json({ error: "Failed to create jam" }, { status: 500 })
  }
}
