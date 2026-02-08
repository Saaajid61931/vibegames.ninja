import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import prisma from "@/lib/prisma"

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const session = await auth()

  if (!session?.user?.id || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id } = await context.params

  const updated = await prisma.game.updateMany({
    where: { id },
    data: { status: "REJECTED" },
  })

  if (updated.count === 0) {
    return NextResponse.json({ error: "Game not found" }, { status: 404 })
  }

  const referer = request.headers.get("referer") || "/admin"
  return NextResponse.redirect(new URL(referer, request.url))
}
