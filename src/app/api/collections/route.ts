import { NextResponse } from "next/server"
import { z } from "zod"
import prisma from "@/lib/prisma"
import { requireCommunityUser, communityError, CommunityError } from "@/lib/community-api"
export async function GET() {
  try {
    const user = await requireCommunityUser()
    const collections = await prisma.inspirationCollection.findMany({
      where: { userId: user.id },
      include: {
        items: {
          include: { game: { select: { id: true, title: true, slug: true, status: true } } },
        },
      },
      orderBy: { updatedAt: "desc" },
      take: 100,
    })
    const saved = await prisma.favorite.findMany({
      where: { userId: user.id, game: { status: "PUBLISHED" } },
      include: { game: { select: { id: true, title: true, slug: true } } },
      orderBy: { createdAt: "desc" },
      take: 500,
    })
    return NextResponse.json(
      {
        collections: collections.map((c) => ({
          ...c,
          items: c.items.filter((i) => i.game.status === "PUBLISHED"),
        })),
        saved: saved.map((s) => s.game),
      },
      { headers: { "Cache-Control": "private, no-store" } },
    )
  } catch (error) {
    return communityError(error)
  }
}
export async function POST(request: Request) {
  try {
    const user = await requireCommunityUser(request)
    const data = z
      .object({
        name: z.string().trim().min(1).max(80),
        description: z.string().trim().max(500).default(""),
        isPublic: z.boolean().default(false),
      })
      .parse(await request.json())
    if ((await prisma.inspirationCollection.count({ where: { userId: user.id } })) >= 100)
      throw new CommunityError("You can keep up to 100 collections.")
    return NextResponse.json(
      await prisma.inspirationCollection.create({ data: { ...data, userId: user.id } }),
      { status: 201 },
    )
  } catch (error) {
    return communityError(error)
  }
}
