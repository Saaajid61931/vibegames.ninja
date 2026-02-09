import { NextRequest, NextResponse } from "next/server"
import { revalidateTag } from "next/cache"
import { auth } from "@/lib/auth"
import prisma from "@/lib/prisma"
import { slugify } from "@/lib/utils"

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

    const body = await request.json()

    const {
      title,
      description,
      instructions,
      category,
      tags,
      aiTool,
      aiModel,
      supportsMobile,
    } = body

    if (!title || !description) {
      return NextResponse.json({ error: "Title and description are required" }, { status: 400 })
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
        category: category || "OTHER",
        tags: tags || "",
        aiTool: aiTool || null,
        aiModel: aiModel || null,
        supportsMobile: Boolean(supportsMobile),
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
