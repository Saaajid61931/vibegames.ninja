import { NextResponse } from "next/server"
import { z } from "zod"
import prisma from "@/lib/prisma"
import { requireCommunityUser, communityError, CommunityError } from "@/lib/community-api"
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireCommunityUser(request)
    const { id } = await params
    const data = z
      .object({
        name: z.string().trim().min(1).max(80).optional(),
        description: z.string().trim().max(500).optional(),
        isPublic: z.boolean().optional(),
        gameId: z.string().max(128).optional(),
        remove: z.boolean().optional(),
      })
      .parse(await request.json())
    if (!(await prisma.inspirationCollection.findFirst({ where: { id, userId: user.id } })))
      throw new CommunityError("Collection not found.", 404)
    await prisma.$transaction(async (tx) => {
      if (data.gameId) {
        if (!(await tx.game.findFirst({ where: { id: data.gameId, status: "PUBLISHED" } })))
          throw new CommunityError("Game unavailable.", 404)
        if (data.remove)
          await tx.collectionItem.deleteMany({ where: { collectionId: id, gameId: data.gameId } })
        else {
          if ((await tx.collectionItem.count({ where: { collectionId: id } })) >= 200)
            throw new CommunityError("A collection can contain up to 200 games.")
          await tx.collectionItem.upsert({
            where: { collectionId_gameId: { collectionId: id, gameId: data.gameId } },
            create: { collectionId: id, gameId: data.gameId },
            update: {},
          })
        }
      }
      await tx.inspirationCollection.update({
        where: { id },
        data: {
          name: data.name,
          description: data.description,
          isPublic: data.isPublic,
          updatedAt: new Date(),
        },
      })
    })
    return NextResponse.json({ ok: true })
  } catch (error) {
    return communityError(error)
  }
}
export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireCommunityUser(request)
    const { id } = await params
    await prisma.inspirationCollection.deleteMany({ where: { id, userId: user.id } })
    return NextResponse.json({ ok: true })
  } catch (error) {
    return communityError(error)
  }
}
