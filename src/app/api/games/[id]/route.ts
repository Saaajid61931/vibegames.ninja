import { NextRequest, NextResponse } from "next/server"
import { revalidateTag } from "next/cache"
import { auth } from "@/lib/auth"
import prisma from "@/lib/prisma"
import { slugify } from "@/lib/utils"
import { deleteStaleGameAssetsFromR2, uploadGameToR2, validateR2Config } from "@/lib/storage"

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const game = await prisma.game.findUnique({
      where: { id },
      include: {
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

export async function PATCH(
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
      select: { id: true, creatorId: true, slug: true, title: true },
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
    let gameFile: File | null = null

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

      const maybeGameFile = formData.get("gameFile")
      gameFile = maybeGameFile instanceof File ? maybeGameFile : null
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
    }

    if (!title || !description) {
      return NextResponse.json({ error: "Title and description are required" }, { status: 400 })
    }

    let nextGameUrl: string | undefined
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

      const uploadResult = await uploadGameToR2(id, gameFile)
      await deleteStaleGameAssetsFromR2(id, uploadResult.uploadedKeys)
      nextGameUrl = uploadResult.gameUrl
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
        ...(nextGameUrl ? { gameUrl: nextGameUrl } : {}),
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
    })
  } catch (error) {
    console.error("Update game error:", error)
    return NextResponse.json({ error: "Failed to update game" }, { status: 500 })
  }
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
