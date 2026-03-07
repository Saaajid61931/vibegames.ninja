import { NextRequest, NextResponse } from "next/server"
import { Prisma } from "@prisma/client"
import { revalidateTag } from "next/cache"
import { v4 as uuidv4 } from "uuid"
import { auth } from "@/lib/auth"
import prisma from "@/lib/prisma"
import { slugify } from "@/lib/utils"
import {
  deleteGameAssetsFromR2,
  uploadGameToR2,
  uploadThumbnailToR2,
  validateR2Config,
} from "@/lib/storage"
import type { LevelEditorIntegrationReport } from "@/lib/storage"

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
    `Level editor hooks missing: ${missing.join(", ")}. Open upload instructions and use the copy prompt to wire your game for community level saving.`,
  ]
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
    const hasLevelEditor = formData.get("hasLevelEditor") === "true"
    const isAIGenerated = formData.get("isAIGenerated") === "true"
    const studioProfileIdRaw = formData.get("studioProfileId")

    const aiModel = aiModelRaw?.trim() ? aiModelRaw.trim() : null
    const normalizedAiTool = aiTool?.trim() ? aiTool.trim() : null

    const studioProfileId = typeof studioProfileIdRaw === "string" && studioProfileIdRaw.trim()
      ? studioProfileIdRaw.trim()
      : null

    if (!gameFile || !title || !description) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      )
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
      injectLevelEditorSdk: hasLevelEditor,
      inspectLevelEditorIntegration: hasLevelEditor,
    })
    const gameUrl = uploadResult.gameUrl

    // Save thumbnail to R2
    let thumbnailUrl: string | null = null
    if (thumbnail) {
      thumbnailUrl = await uploadThumbnailToR2(gameId, thumbnail)
    }

    let game
    try {
      game = await prisma.game.create({
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
          hasLevelEditor,
          isAIGenerated,
          gameUrl,
          thumbnail: thumbnailUrl,
          creatorId: session.user.id,
          ...(studioProfileConnectId ? { studioProfileId: studioProfileConnectId } : {}),
          status: "PUBLISHED",
          publishedAt: new Date(),
        },
      })
    } catch (dbError) {
      await deleteGameAssetsFromR2(gameId)
      throw dbError
    }

    revalidateTag("games", "max")

    const warnings = hasLevelEditor
      ? buildLevelEditorWarnings(uploadResult.levelEditorIntegration)
      : []

    return NextResponse.json({
      message: "Game uploaded successfully",
      game: {
        id: game.id,
        slug: game.slug,
        title: game.title,
      },
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

    if (error instanceof Error && error.message.toLowerCase().includes("hasleveleditor")) {
      return NextResponse.json(
        { error: "Database schema is out of date. Run prisma db push and restart the server." },
        { status: 500 }
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
