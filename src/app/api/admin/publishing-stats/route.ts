import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import prisma from "@/lib/prisma"
import { logServerError } from "@/lib/server-log"

export async function GET() {
  try {
    const session = await auth()

    if (!session?.user?.id || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 })
    }

    const [publishedGames, totalPlays, totalLikes] = await Promise.all([
      prisma.game.count({ where: { status: "PUBLISHED" } }),
      prisma.game.aggregate({ _sum: { plays: true } }),
      prisma.game.aggregate({ _sum: { likes: true } }),
    ])

    return NextResponse.json({
      publishedGames,
      totalPlays: totalPlays._sum.plays ?? 0,
      totalLikes: totalLikes._sum.likes ?? 0,
    })
  } catch (error) {
    logServerError("Load admin publishing stats failed", error, {
      route: "/api/admin/publishing-stats",
      method: "GET",
    })
    return NextResponse.json({ error: "SYSTEM_ERROR" }, { status: 500 })
  }
}
