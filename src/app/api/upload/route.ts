import { NextRequest, NextResponse } from "next/server"
import { Prisma } from "@prisma/client"
import { revalidateTag } from "next/cache"
import { v4 as uuidv4 } from "uuid"
import { auth } from "@/lib/auth"
import { normalizeMobileOrientation } from "@/lib/mobile-orientation"
import prisma from "@/lib/prisma"
import { slugify } from "@/lib/utils"
import {
  deleteGameAssetsFromR2,
  uploadGameToR2,
  uploadThumbnailToR2,
  validateR2Config,
} from "@/lib/storage"
import type { GhostIntegrationReport, LevelEditorIntegrationReport } from "@/lib/storage"

const JAM_UPLOAD_ERROR_PREFIX = "JAM_UPLOAD:"

function buildLevelEditorWarnings(report: LevelEditorIntegrationReport | undefined): string[] {
  if (!report) {
    return []
  }

  const missing: string[] = []
  if (!report.notifyReady) missing.push("VG.notifyReady")
  if (!report.onEnterEditMode) missing.push("VG.onEnterEditMode")
  if (!report.onLoadLevel) missing.push("VG.onLoadLevel")
  if (!report.onRequestSave) missing.push("VG.onRequestSave")
  if (!report.saveLevel) missing.push("VG.saveLevel")

  if (missing.length === 0) {
    return []
  }

  return [
    `Community level editor hooks missing: ${missing.join(", ")}.`,
    "Open the setup guide, paste the quick prompt into your coding AI, and apply the smallest possible patch before inviting players to build levels.",
  ]
}

function buildGhostWarnings(report: GhostIntegrationReport | undefined): string[] {
  if (!report) {
    return []
  }

  const missing: string[] = []
  if (!report.notifyGhostReady) missing.push("VG.notifyGhostReady")
  if (!report.onLoadGhost) missing.push("VG.onLoadGhost")
  if (!report.saveGhostRun) missing.push("VG.saveGhostRun")

  if (missing.length === 0) {
    return []
  }

  return [
    `Ghost sharing hooks missing: ${missing.join(", ")}.`,
    "Use the Ghost Sharing setup guide and add the missing replay hooks before turning on ghost races for players.",
  ]
}

function getCurrentJamStatus(jam: {
  startDate: Date
  endDate: Date
  votingEndDate: Date
}) {
  const now = new Date()

  if (now >= jam.startDate && now < jam.endDate) {
    return "ACTIVE"
  }

  if (now >= jam.endDate && now < jam.votingEndDate) {
    return "VOTING"
  }

  if (now >= jam.votingEndDate) {
    return "COMPLETED"
  }

  return "UPCOMING"
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const formData = await request.formData()
    
    const gameFile = formData.get("gameFile") as File | null
    const thumbnail = formData.get("thumbnail") as File | null
    const title = formData.get("title") as string
    const description = formData.get("description") as string
    const instructions = formData.get("instructions") as string | null
    const category = formData.get("category") as string
    const tags = formData.get("tags") as string
    const aiTool = formData.get("aiTool") as string | null
    const aiModelRaw = formData.get("aiModel") as string | null
    const supportsMobile = formData.get("supportsMobile") === "true"
    const mobileOrientationRaw = formData.get("mobileOrientation") as string | null
    const hasLevelEditor = formData.get("hasLevelEditor") === "true"
    const hasGhostSharing = formData.get("hasGhostSharing") === "true"
    const seekingFeedback = formData.get("seekingFeedback") === "true"
    const isAIGenerated = formData.get("isAIGenerated") === "true"
    const latestUpdateNoteRaw = formData.get("latestUpdateNote") as string | null
    const jamSlugRaw = formData.get("jamSlug")
    const studioProfileIdRaw = formData.get("studioProfileId")

    const aiModel = aiModelRaw?.trim() ? aiModelRaw.trim() : null
    const normalizedAiTool = aiTool?.trim() ? aiTool.trim() : null
    const mobileOrientation = normalizeMobileOrientation(supportsMobile, mobileOrientationRaw)
    const latestUpdateNote = latestUpdateNoteRaw?.trim() ? latestUpdateNoteRaw.trim() : null
    const jamSlug = typeof jamSlugRaw === "string" && jamSlugRaw.trim() ? jamSlugRaw.trim() : null

    const studioProfileId = typeof studioProfileIdRaw === "string" && studioProfileIdRaw.trim()
      ? studioProfileIdRaw.trim()
      : null

    if (!gameFile || !title || !description) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      )
    }

    let jamSubmission:
      | {
          id: string
          slug: string
          title: string
          status: string
          startDate: Date
          endDate: Date
          votingEndDate: Date
          maxEntries: number
        }
      | null = null

    if (jamSlug) {
      const jam = await prisma.gameJam.findUnique({
        where: { slug: jamSlug },
        select: {
          id: true,
          slug: true,
          title: true,
          status: true,
          startDate: true,
          endDate: true,
          votingEndDate: true,
          maxEntries: true,
        },
      })

      if (!jam) {
        return NextResponse.json(
          { error: "Selected game jam was not found" },
          { status: 400 }
        )
      }

      const currentJamStatus = getCurrentJamStatus(jam)
      if (currentJamStatus !== jam.status) {
        await prisma.gameJam.update({
          where: { id: jam.id },
          data: { status: currentJamStatus },
        })
      }

      if (currentJamStatus !== "ACTIVE") {
        return NextResponse.json(
          { error: "Selected game jam is not currently accepting submissions" },
          { status: 400 }
        )
      }

      const existingEntryCount = await prisma.gameJamEntry.count({
        where: {
          jamId: jam.id,
          userId: session.user.id,
        },
      })

      if (existingEntryCount >= jam.maxEntries) {
        return NextResponse.json(
          { error: `You can only submit ${jam.maxEntries} game(s) to this jam` },
          { status: 400 }
        )
      }

      jamSubmission = {
        ...jam,
        status: currentJamStatus,
      }
    }

    let studioProfileConnectId: string | null = null
    if (studioProfileId) {
      const studioProfile = await prisma.studioProfile.findFirst({
        where: {
          id: studioProfileId,
          ownerId: session.user.id,
        },
        select: { id: true },
      })

      if (!studioProfile) {
        return NextResponse.json(
          { error: "STUDIO_PROFILE_NOT_FOUND" },
          { status: 400 }
        )
      }

      studioProfileConnectId = studioProfile.id
    }

    const validExtensions = [".html", ".zip"]
    const isValidGameFile = validExtensions.some((ext) => gameFile.name.toLowerCase().endsWith(ext))
    if (!isValidGameFile) {
      return NextResponse.json(
        { error: "Game file must be .html or .zip" },
        { status: 400 }
      )
    }

    const maxUploadSizeMb = Number(process.env.MAX_UPLOAD_SIZE_MB || "50")
    const maxUploadBytes = maxUploadSizeMb * 1024 * 1024
    if (gameFile.size > maxUploadBytes) {
      return NextResponse.json(
        { error: `Game file exceeds ${maxUploadSizeMb}MB limit` },
        { status: 400 }
      )
    }

    if (thumbnail && thumbnail.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: "Thumbnail exceeds 10MB limit" },
        { status: 400 }
      )
    }

    const r2Config = validateR2Config()
    if (!r2Config.valid) {
      return NextResponse.json(
        { error: `R2 storage is not configured. Missing: ${r2Config.missing.join(", ")}` },
        { status: 500 }
      )
    }

    // Generate unique ID and slug
    const gameId = uuidv4()
    let slug = slugify(title)
    
    // Check if slug exists and make unique
    const existingSlug = await prisma.game.findUnique({ where: { slug } })
    if (existingSlug) {
      slug = `${slug}-${gameId.slice(0, 8)}`
    }

    const uploadResult = await uploadGameToR2(gameId, gameFile, {
      injectPlatformSdk: hasLevelEditor || hasGhostSharing,
      inspectLevelEditorIntegration: hasLevelEditor,
      inspectGhostIntegration: hasGhostSharing,
    })
    const gameUrl = uploadResult.gameUrl

    // Save thumbnail to R2
    let thumbnailUrl: string | null = null
    if (thumbnail) {
      thumbnailUrl = await uploadThumbnailToR2(gameId, thumbnail)
    }

    let game
    try {
      game = await prisma.$transaction(async (tx) => {
        const createdGame = await tx.game.create({
          data: {
            id: gameId,
            slug,
            title,
            description,
            instructions,
            category: category.toUpperCase(),
            tags,
            aiTool: normalizedAiTool,
            aiModel,
            supportsMobile,
            mobileOrientation,
            hasLevelEditor,
            hasGhostSharing,
            seekingFeedback,
            latestUpdateNote,
            isAIGenerated,
            gameUrl,
            thumbnail: thumbnailUrl,
            thumbnailSlides: thumbnailUrl ? [thumbnailUrl] : [],
            creatorId: session.user.id,
            ...(studioProfileConnectId ? { studioProfileId: studioProfileConnectId } : {}),
            status: "PUBLISHED",
            publishedAt: new Date(),
          },
        })

        if (seekingFeedback) {
          await tx.game.updateMany({
            where: {
              creatorId: session.user.id,
              id: { not: gameId },
            },
            data: {
              seekingFeedback: false,
            },
          })
        }

        if (jamSubmission) {
          const liveJamStatus = getCurrentJamStatus(jamSubmission)

          if (liveJamStatus !== jamSubmission.status) {
            await tx.gameJam.update({
              where: { id: jamSubmission.id },
              data: { status: liveJamStatus },
            })
          }

          if (liveJamStatus !== "ACTIVE") {
            throw new Error(`${JAM_UPLOAD_ERROR_PREFIX}Selected game jam is no longer accepting submissions`)
          }

          const liveEntryCount = await tx.gameJamEntry.count({
            where: {
              jamId: jamSubmission.id,
              userId: session.user.id,
            },
          })

          if (liveEntryCount >= jamSubmission.maxEntries) {
            throw new Error(`${JAM_UPLOAD_ERROR_PREFIX}You can only submit ${jamSubmission.maxEntries} game(s) to this jam`)
          }

          await tx.gameJamEntry.create({
            data: {
              jamId: jamSubmission.id,
              gameId: createdGame.id,
              userId: session.user.id,
            },
          })
        }

        return createdGame
      })
    } catch (dbError) {
      await deleteGameAssetsFromR2(gameId)
      throw dbError
    }

    revalidateTag("games", "max")

    const warnings = [
      ...(hasLevelEditor ? buildLevelEditorWarnings(uploadResult.levelEditorIntegration) : []),
      ...(hasGhostSharing ? buildGhostWarnings(uploadResult.ghostIntegration) : []),
    ]

    return NextResponse.json({
      message: "Game uploaded successfully",
      game: {
        id: game.id,
        slug: game.slug,
        title: game.title,
      },
      jamSubmission: jamSubmission
        ? {
            slug: jamSubmission.slug,
            title: jamSubmission.title,
          }
        : null,
      warnings,
    })
  } catch (error) {
    console.error("Upload error:", error)

    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      (error.code === "P2021" || error.code === "P2022")
    ) {
      return NextResponse.json(
        { error: "Database schema is out of date. Run prisma db push and restart the server." },
        { status: 500 }
      )
    }

    if (error instanceof Error && error.message.startsWith(JAM_UPLOAD_ERROR_PREFIX)) {
      return NextResponse.json(
        { error: error.message.slice(JAM_UPLOAD_ERROR_PREFIX.length) },
        { status: 400 }
      )
    }

    if (error instanceof Error && error.message.toLowerCase().includes("hasleveleditor")) {
      return NextResponse.json(
        { error: "Database schema is out of date. Run prisma db push and restart the server." },
        { status: 500 }
      )
    }

    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002" &&
      Array.isArray(error.meta?.target) &&
      error.meta.target.includes("jamId") &&
      error.meta.target.includes("userId")
    ) {
      return NextResponse.json(
        { error: "This jam only allows one submitted game per creator with the current database schema. Run prisma db push after the latest schema update." },
        { status: 400 }
      )
    }

    if (
      error &&
      typeof error === "object" &&
      "name" in error &&
      typeof (error as { name?: string }).name === "string" &&
      (error as { name: string }).name.includes("S3")
    ) {
      return NextResponse.json(
        { error: "R2 upload failed. Verify R2 credentials and bucket permissions." },
        { status: 500 }
      )
    }

    if (process.env.NODE_ENV !== "production" && error instanceof Error) {
      return NextResponse.json(
        { error: error.message || "Failed to upload game" },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { error: "Failed to upload game" },
      { status: 500 }
    )
  }
}
