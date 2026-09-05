import { NextResponse } from "next/server"
import { z } from "zod"
import prisma from "@/lib/prisma"
import { CommunityError, communityError, requireCommunityUser } from "@/lib/community-api"
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireCommunityUser(request)
    const { id } = await params
    const data = z
      .object({
        status: z.enum(["APPROVED", "REJECTED", "WITHDRAWN", "BLOCKED"]),
        note: z.string().trim().min(5).max(2000),
      })
      .parse(await request.json())
    const source = await prisma.sourcePackage.findUnique({
      where: { id },
      include: { game: { select: { creatorId: true } } },
    })
    if (!source) throw new CommunityError("Project unavailable.", 404)
    if (
      user.role !== "ADMIN" &&
      !(
        data.status === "WITHDRAWN" &&
        source.game.creatorId === user.id &&
        ["PENDING", "APPROVED"].includes(source.status)
      )
    )
      throw new CommunityError("You cannot review this project.", 403)
    const result = await prisma.sourcePackage.updateMany({
      where: { id, status: source.status },
      data: { status: data.status, reviewNote: data.note, reviewedAt: new Date() },
    })
    if (!result.count)
      throw new CommunityError("This project changed during review. Refresh and try again.", 409)
    return NextResponse.json({ ok: true })
  } catch (e) {
    return communityError(e)
  }
}
