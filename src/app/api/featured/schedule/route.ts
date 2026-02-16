import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { auth } from "@/lib/auth"

/**
 * GET /api/featured/schedule
 * Admin-only: returns all scheduled featured games (today and future).
 */
export async function GET() {
  const session = await auth()
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const today = new Date()
  today.setUTCHours(0, 0, 0, 0)

  const schedule = await prisma.featuredGame.findMany({
    where: { date: { gte: today } },
    include: {
      game: {
        select: {
          id: true,
          title: true,
          slug: true,
          thumbnail: true,
          category: true,
          plays: true,
          creator: { select: { name: true, username: true } },
          studioProfile: { select: { handle: true, displayName: true } },
        },
      },
      createdBy: { select: { name: true, username: true } },
    },
    orderBy: { date: "asc" },
  })

  // Also get recent past picks (last 7 days) for context
  const sevenDaysAgo = new Date(today)
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

  const recentPicks = await prisma.featuredGame.findMany({
    where: {
      date: { gte: sevenDaysAgo, lt: today },
    },
    include: {
      game: {
        select: {
          id: true,
          title: true,
          slug: true,
          thumbnail: true,
          category: true,
          plays: true,
          creator: { select: { name: true, username: true } },
          studioProfile: { select: { handle: true, displayName: true } },
        },
      },
      createdBy: { select: { name: true, username: true } },
    },
    orderBy: { date: "desc" },
  })

  return NextResponse.json({ schedule, recentPicks })
}
