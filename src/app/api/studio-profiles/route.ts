import { NextResponse } from "next/server"
import { z } from "zod"
import { auth } from "@/lib/auth"
import prisma from "@/lib/prisma"
import { slugify } from "@/lib/utils"

const createStudioProfileSchema = z.object({
  displayName: z.string().trim().min(1).max(60),
  handle: z.string().trim().min(1).max(32).optional(),
  image: z.string().trim().url().optional(),
})

function normalizeHandle(input: string) {
  const base = slugify(input)
  // slugify keeps underscores and turns spaces into dashes.
  // For handles, allow only [a-z0-9_-] and trim extra dashes.
  const cleaned = base
    .replace(/[^a-z0-9_-]/g, "")
    .replace(/^-+/, "")
    .replace(/-+$/, "")

  return cleaned
}

export async function GET() {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: "AUTHENTICATION_REQUIRED" }, { status: 401 })
    }

    if (session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 })
    }

    const profiles = await prisma.studioProfile.findMany({
      where: { ownerId: session.user.id },
      select: {
        id: true,
        handle: true,
        displayName: true,
        image: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json({ profiles })
  } catch (error) {
    console.error("Studio profiles list error:", error)
    return NextResponse.json({ error: "SYSTEM_ERROR" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: "AUTHENTICATION_REQUIRED" }, { status: 401 })
    }

    if (session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 })
    }

    const body = await request.json().catch(() => null)
    const parsed = createStudioProfileSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: "INVALID_INPUT" }, { status: 400 })
    }

    const displayName = parsed.data.displayName
    const handleInput = parsed.data.handle?.trim() || displayName
    const normalized = normalizeHandle(handleInput)

    if (!normalized || normalized.length < 3) {
      return NextResponse.json(
        { error: "INVALID_HANDLE", message: "Handle must be at least 3 characters" },
        { status: 400 }
      )
    }

    if (normalized.length > 24) {
      return NextResponse.json(
        { error: "INVALID_HANDLE", message: "Handle must be 24 characters or less" },
        { status: 400 }
      )
    }

    // Prevent confusion with real user accounts.
    const usernameCollision = await prisma.user.findUnique({
      where: { username: normalized },
      select: { id: true },
    })
    if (usernameCollision) {
      return NextResponse.json(
        { error: "HANDLE_RESERVED", message: "That handle is reserved" },
        { status: 409 }
      )
    }

    // Ensure uniqueness for the handle. If taken, append a short suffix.
    let handle = normalized
    for (let i = 0; i < 5; i++) {
      const existing = await prisma.studioProfile.findUnique({
        where: { handle },
        select: { id: true },
      })
      if (!existing) break
      handle = `${normalized}-${Math.random().toString(36).slice(2, 6)}`
      if (handle.length > 24) {
        handle = handle.slice(0, 24)
      }
    }

    const created = await prisma.studioProfile.create({
      data: {
        ownerId: session.user.id,
        handle,
        displayName,
        image: parsed.data.image,
      },
      select: {
        id: true,
        handle: true,
        displayName: true,
        image: true,
        createdAt: true,
      },
    })

    return NextResponse.json({ profile: created }, { status: 201 })
  } catch (error) {
    console.error("Studio profile create error:", error)
    return NextResponse.json({ error: "SYSTEM_ERROR" }, { status: 500 })
  }
}
