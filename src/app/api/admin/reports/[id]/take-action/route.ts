import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import prisma from "@/lib/prisma"

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const session = await auth()

  if (!session?.user?.id || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id } = await context.params

  const report = await prisma.report.findUnique({
    where: { id },
    select: { id: true, gameId: true },
  })

  if (!report) {
    return NextResponse.json({ error: "Report not found" }, { status: 404 })
  }

  await prisma.$transaction([
    prisma.game.update({
      where: { id: report.gameId },
      data: { status: "SUSPENDED" },
    }),
    prisma.report.update({
      where: { id: report.id },
      data: {
        status: "RESOLVED",
        resolvedAt: new Date(),
        resolvedBy: session.user.id,
      },
    }),
  ])

  const referer = request.headers.get("referer") || "/admin"
  return NextResponse.redirect(new URL(referer, request.url))
}
