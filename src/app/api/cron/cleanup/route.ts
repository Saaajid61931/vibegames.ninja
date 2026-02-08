import { NextRequest, NextResponse } from "next/server"
import { expireOldGames, getExpiringGames } from "@/lib/retention"

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

    // Expire old games
    const expiredCount = await expireOldGames()
    
    // Get games expiring soon (for notifications)
    const expiringGames = await getExpiringGames()

    return NextResponse.json({
      success: true,
      expired: expiredCount,
      expiringSoon: expiringGames.length,
      message: `Expired ${expiredCount} games. ${expiringGames.length} games expiring within 24h.`,
    })
  } catch (error) {
    console.error("Cleanup error:", error)
    return NextResponse.json({ error: "SYSTEM_ERROR" }, { status: 500 })
  }
}

// Get retention stats
export async function GET() {
  try {
    const expiringGames = await getExpiringGames()
    
    return NextResponse.json({
      expiringSoon: expiringGames.map((game) => ({
        id: game.id,
        title: game.title,
        slug: game.slug,
        likes: game.likes,
        expiresAt: game.expiresAt,
        creatorEmail: game.creator.email,
      })),
    })
  } catch (error) {
    console.error("Get retention stats error:", error)
    return NextResponse.json({ error: "SYSTEM_ERROR" }, { status: 500 })
  }
}
