import { NextRequest, NextResponse } from "next/server"
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
    const isAIGenerated = formData.get("isAIGenerated") === "true"

    const aiModel = aiModelRaw?.trim() ? aiModelRaw.trim() : null
    const normalizedAiTool = aiTool?.trim() ? aiTool.trim() : null

    if (!gameFile || !title || !description) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      )
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

    const { gameUrl } = await uploadGameToR2(gameId, gameFile)

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
          isAIGenerated,
          gameUrl,
          thumbnail: thumbnailUrl,
          creatorId: session.user.id,
          status: "PUBLISHED",
          publishedAt: new Date(),
        },
      })
    } catch (dbError) {
      await deleteGameAssetsFromR2(gameId)
      throw dbError
    }

    revalidateTag("games", "max")

    return NextResponse.json({
      message: "Game uploaded successfully",
      game: {
        id: game.id,
        slug: game.slug,
        title: game.title,
      },
    })
  } catch (error) {
    console.error("Upload error:", error)
    return NextResponse.json(
      { error: "Failed to upload game" },
      { status: 500 }
    )
  }
}
