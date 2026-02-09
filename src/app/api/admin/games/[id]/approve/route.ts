import { NextRequest, NextResponse } from "next/server"
import { revalidateTag } from "next/cache"
import { auth } from "@/lib/auth"
import prisma from "@/lib/prisma"

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const session = await auth()

  if (!session?.user?.id || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id } = await context.params
  const game = await prisma.game.findUnique({ where: { id } })

  if (!game) {
    return NextResponse.json({ error: "Game not found" }, { status: 404 })
  }

  await prisma.game.update({
    where: { id },
    data: {
      status: "PUBLISHED",
      publishedAt: game.publishedAt ?? new Date(),
    },
  })

  revalidateTag("games", "max")

  const referer = request.headers.get("referer") || "/admin"
  return NextResponse.redirect(new URL(referer, request.url))
}
