import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"

// This endpoint should be called by a cron job (e.g., every hour)
// In production, protect this with a secret key
export async function POST(request: NextRequest) {
  try {
    // Optional: verify cron secret
    const authHeader = request.headers.get("authorization")
    const cronSecret = process.env.CRON_SECRET
    
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 })
    }

    return NextResponse.json({
      success: true,
      message: "Cleanup retention is disabled.",
    })
  } catch (error) {
    console.error("Cleanup error:", error)
    return NextResponse.json({ error: "SYSTEM_ERROR" }, { status: 500 })
  }
}

// Return lightweight publishing stats
export async function GET() {
  try {
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
    console.error("Get cleanup stats error:", error)
    return NextResponse.json({ error: "SYSTEM_ERROR" }, { status: 500 })
  }
}
