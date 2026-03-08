import { NextRequest, NextResponse } from "next/server"
import { revalidateTag } from "next/cache"
import { Prisma } from "@prisma/client"
import { auth } from "@/lib/auth"
import { normalizeMobileOrientation } from "@/lib/mobile-orientation"
import prisma from "@/lib/prisma"
import { slugify } from "@/lib/utils"
import {
  deleteStaleGameAssetsFromR2,
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
    `Community level editor hooks missing: ${missing.join(", ")}.`,
    "Open the setup guide, paste the quick prompt into your coding AI, and apply the smallest possible patch before inviting players to build levels.",
  ]
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const game = await prisma.game.findUnique({
      where: { id },
      include: {
        studioProfile: {
          select: { id: true, handle: true, displayName: true, image: true },
        },
        creator: {
          select: { id: true, name: true, username: true, image: true },
        },
      },
    })

    if (!game) {
      return NextResponse.json({ error: "Game not found" }, { status: 404 })
    }

    return NextResponse.json(game)
  } catch (error) {
    console.error("Get game error:", error)
    return NextResponse.json({ error: "Failed to fetch game" }, { status: 500 })
  }
}

async function updateGame(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params

    const game = await prisma.game.findUnique({
      where: { id },
      select: { id: true, creatorId: true, slug: true, title: true, hasLevelEditor: true },
    })

    if (!game) {
      return NextResponse.json({ error: "Game not found" }, { status: 404 })
    }

    if (game.creatorId !== session.user.id) {
      return NextResponse.json({ error: "Not authorized to edit this game" }, { status: 403 })
    }

    const contentType = request.headers.get("content-type") || ""

    let title = ""
    let description = ""
    let instructions: string | null = null
    let category = "OTHER"
    let tags = ""
    let aiTool: string | null = null
    let aiModel: string | null = null
    let supportsMobile = false
    let mobileOrientation: "BOTH" | "PORTRAIT" | "LANDSCAPE" = "BOTH"
    let hasLevelEditor = false
    let gameFile: File | null = null
    let thumbnailFile: File | null = null

    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData()
      title = String(formData.get("title") || "")
      description = String(formData.get("description") || "")
      const instructionsRaw = formData.get("instructions")
      instructions = instructionsRaw ? String(instructionsRaw) : null
      category = String(formData.get("category") || "OTHER")
      tags = String(formData.get("tags") || "")
      const aiToolRaw = String(formData.get("aiTool") || "").trim()
      aiTool = aiToolRaw || null
      const aiModelRaw = String(formData.get("aiModel") || "").trim()
      aiModel = aiModelRaw || null
      supportsMobile = String(formData.get("supportsMobile") || "false") === "true"
      mobileOrientation = normalizeMobileOrientation(
        supportsMobile,
        String(formData.get("mobileOrientation") || "BOTH")
      )
      hasLevelEditor = String(formData.get("hasLevelEditor") || "false") === "true"

      const maybeGameFile = formData.get("gameFile")
      gameFile = maybeGameFile instanceof File ? maybeGameFile : null

      const maybeThumbnailFile = formData.get("thumbnail")
      thumbnailFile = maybeThumbnailFile instanceof File ? maybeThumbnailFile : null
    } else {
      const body = await request.json()
      title = body.title
      description = body.description
      instructions = body.instructions || null
      category = body.category || "OTHER"
      tags = body.tags || ""
      aiTool = body.aiTool || null
      aiModel = body.aiModel || null
      supportsMobile = Boolean(body.supportsMobile)
      mobileOrientation = normalizeMobileOrientation(supportsMobile, body.mobileOrientation)
      hasLevelEditor = Boolean(body.hasLevelEditor)
    }

    if (!title || !description) {
      return NextResponse.json({ error: "Title and description are required" }, { status: 400 })
    }

    let nextGameUrl: string | undefined
    let uploadWarnings: string[] = []
    if (gameFile) {
      const validExtensions = [".html", ".zip"]
      const isValidGameFile = validExtensions.some((ext) => gameFile!.name.toLowerCase().endsWith(ext))
      if (!isValidGameFile) {
        return NextResponse.json({ error: "Game file must be .html or .zip" }, { status: 400 })
      }

      const maxUploadSizeMb = Number(process.env.MAX_UPLOAD_SIZE_MB || "50")
      const maxUploadBytes = maxUploadSizeMb * 1024 * 1024
      if (gameFile.size > maxUploadBytes) {
        return NextResponse.json(
          { error: `Game file exceeds ${maxUploadSizeMb}MB limit` },
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

      const uploadResult = await uploadGameToR2(id, gameFile, {
        injectLevelEditorSdk: hasLevelEditor,
        inspectLevelEditorIntegration: hasLevelEditor,
      })
      await deleteStaleGameAssetsFromR2(id, uploadResult.uploadedKeys)
      nextGameUrl = uploadResult.gameUrl
      uploadWarnings = hasLevelEditor
        ? buildLevelEditorWarnings(uploadResult.levelEditorIntegration)
        : []
    }

    if (hasLevelEditor && !gameFile && !game.hasLevelEditor) {
      uploadWarnings.push(
        "Level editor was enabled without uploading a new game file. Re-upload the game file once so VibeGames can auto-inject editor SDK support."
      )
    }

    let nextThumbnailUrl: string | undefined
    if (thumbnailFile) {
      const validImageTypes = ["image/png", "image/jpeg", "image/jpg", "image/gif", "image/webp"]
      if (!validImageTypes.includes(thumbnailFile.type)) {
        return NextResponse.json({ error: "Thumbnail must be PNG, JPG, GIF, or WebP" }, { status: 400 })
      }

      const maxThumbnailSizeMb = 5
      const maxThumbnailBytes = maxThumbnailSizeMb * 1024 * 1024
      if (thumbnailFile.size > maxThumbnailBytes) {
        return NextResponse.json(
          { error: `Thumbnail exceeds ${maxThumbnailSizeMb}MB limit` },
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

      nextThumbnailUrl = await uploadThumbnailToR2(id, thumbnailFile)
    }

    let newSlug = game.slug
    if (title !== game.title) {
      newSlug = slugify(title)
      const existingSlug = await prisma.game.findFirst({
        where: { slug: newSlug, id: { not: id } },
      })
      if (existingSlug) {
        newSlug = `${newSlug}-${id.slice(0, 8)}`
      }
    }

    const updated = await prisma.game.update({
      where: { id },
      data: {
        title,
        slug: newSlug,
        description,
        instructions: instructions || null,
        category: category.toUpperCase() || "OTHER",
        tags,
        aiTool: aiTool || null,
        aiModel: aiModel || null,
        supportsMobile,
        mobileOrientation,
        hasLevelEditor,
        ...(nextGameUrl ? { gameUrl: nextGameUrl } : {}),
        ...(nextThumbnailUrl ? { thumbnail: nextThumbnailUrl, thumbnailSlides: [nextThumbnailUrl] } : {}),
      },
    })

    revalidateTag("games", "max")

    return NextResponse.json({
      message: "Game updated successfully",
      game: {
        id: updated.id,
        slug: updated.slug,
        title: updated.title,
      },
      warnings: uploadWarnings,
    })
  } catch (error) {
    console.error("Update game error:", error)

    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      (error.code === "P2021" || error.code === "P2022")
    ) {
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
      return NextResponse.json({ error: error.message || "Failed to update game" }, { status: 500 })
    }

    return NextResponse.json({ error: "Failed to update game" }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  return updateGame(request, context)
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  return updateGame(request, context)
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params

    const game = await prisma.game.findUnique({
      where: { id },
      select: { id: true, creatorId: true },
    })

    if (!game) {
      return NextResponse.json({ error: "Game not found" }, { status: 404 })
    }

    if (game.creatorId !== session.user.id) {
      return NextResponse.json({ error: "Not authorized to delete this game" }, { status: 403 })
    }

    await prisma.game.delete({ where: { id } })

    revalidateTag("games", "max")

    return NextResponse.json({ message: "Game deleted successfully" })
  } catch (error) {
    console.error("Delete game error:", error)
    return NextResponse.json({ error: "Failed to delete game" }, { status: 500 })
  }
}
