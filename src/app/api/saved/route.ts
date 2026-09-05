import { NextResponse } from "next/server"
import { z } from "zod"
import prisma from "@/lib/prisma"
import { requireCommunityUser, communityError, CommunityError } from "@/lib/community-api"
export async function GET() {
  try {
    const user = await requireCommunityUser()
    const saved = await prisma.favorite.findMany({
      where: { userId: user.id, game: { status: "PUBLISHED" } },
      select: { gameId: true },
      take: 5000,
    })
    return NextResponse.json(
      { gameIds: saved.map((item) => item.gameId) },
      { headers: { "Cache-Control": "private, no-store" } },
    )
  } catch (error) {
    return communityError(error)
  }
}
export async function PUT(request: Request) {
  try {
    const user = await requireCommunityUser(request)
    const { gameId, saved } = z
      .object({ gameId: z.string().min(1).max(128), saved: z.boolean() })
      .parse(await request.json())
    if (
      !(await prisma.game.findFirst({
        where: { id: gameId, status: "PUBLISHED" },
        select: { id: true },
      }))
    )
      throw new CommunityError("Game unavailable.", 404)
    if (saved)
      await prisma.favorite.upsert({
        where: { userId_gameId: { userId: user.id, gameId } },
        create: { userId: user.id, gameId },
        update: {},
      })
    else await prisma.favorite.deleteMany({ where: { userId: user.id, gameId } })
    return NextResponse.json({ saved })
  } catch (error) {
    return communityError(error)
  }
}
