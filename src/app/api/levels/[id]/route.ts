import { NextRequest, NextResponse } from "next/server"
import { Prisma } from "@prisma/client"
import { auth } from "@/lib/auth"
import prisma from "@/lib/prisma"
import { levelInputSchema } from "@/lib/validations"
import { logServerError } from "@/lib/server-log"

const MAX_LEVEL_DATA_BYTES = 5 * 1024 * 1024

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const level = await prisma.level.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        description: true,
        data: true,
        thumbnail: true,
        plays: true,
        avgRating: true,
        ratingCount: true,
        createdAt: true,
        updatedAt: true,
        gameId: true,
        status: true,
        game: {
          select: { id: true, slug: true, title: true, status: true, hasLevelEditor: true },
        },
        creator: {
          select: { id: true, name: true, username: true, image: true },
        },
      },
    })

    if (!level || level.status !== "PUBLISHED" || level.game.status !== "PUBLISHED") {
      return NextResponse.json({ error: "Level not found" }, { status: 404 })
    }

    await prisma.level.update({
      where: { id },
      data: { plays: { increment: 1 } },
    })

    return NextResponse.json(level)
  } catch (error) {
    logServerError("Get level error", error, {
      route: "/api/levels/[id]",
      method: "GET",
    })
    return NextResponse.json({ error: "Failed to fetch level" }, { status: 500 })
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
    const level = await prisma.level.findUnique({
      where: { id },
      select: { id: true, creatorId: true, status: true },
    })

    if (!level || level.status !== "PUBLISHED") {
      return NextResponse.json({ error: "Level not found" }, { status: 404 })
    }

    if (level.creatorId !== session.user.id) {
      return NextResponse.json({ error: "Not authorized to edit this level" }, { status: 403 })
    }

    const body = await request.json()
    const parsed = levelInputSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message || "Invalid level payload" }, { status: 400 })
    }

    const dataSize = new TextEncoder().encode(JSON.stringify(parsed.data.data)).length
    if (dataSize > MAX_LEVEL_DATA_BYTES) {
      return NextResponse.json({ error: "Level data exceeds 5MB limit" }, { status: 400 })
    }

    const updated = await prisma.level.update({
      where: { id },
      data: {
        name: parsed.data.name,
        description: parsed.data.description?.trim() || null,
        data: parsed.data.data as Prisma.InputJsonValue,
        thumbnail: parsed.data.thumbnail || null,
      },
      select: {
        id: true,
        name: true,
        description: true,
        thumbnail: true,
        updatedAt: true,
      },
    })

    return NextResponse.json({ level: updated })
  } catch (error) {
    logServerError("Update level error", error, {
      route: "/api/levels/[id]",
      method: "PATCH",
    })
    return NextResponse.json({ error: "Failed to update level" }, { status: 500 })
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
    const level = await prisma.level.findUnique({
      where: { id },
      select: { id: true, creatorId: true },
    })

    if (!level) {
      return NextResponse.json({ error: "Level not found" }, { status: 404 })
    }

    if (level.creatorId !== session.user.id) {
      return NextResponse.json({ error: "Not authorized to delete this level" }, { status: 403 })
    }

    await prisma.level.delete({ where: { id } })

    return NextResponse.json({ message: "Level deleted" })
  } catch (error) {
    logServerError("Delete level error", error, {
      route: "/api/levels/[id]",
      method: "DELETE",
    })
    return NextResponse.json({ error: "Failed to delete level" }, { status: 500 })
  }
}
