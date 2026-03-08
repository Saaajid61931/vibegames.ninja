import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import prisma from "@/lib/prisma"

export async function GET() {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ unreadCount: 0, notifications: [] })
    }

    const [unreadCount, notifications] = await Promise.all([
      prisma.notification.count({
        where: {
          userId: session.user.id,
          read: false,
        },
      }),
      prisma.notification.findMany({
        where: { userId: session.user.id },
        orderBy: { createdAt: "desc" },
        take: 5,
        select: {
          id: true,
          title: true,
          message: true,
          link: true,
          read: true,
          createdAt: true,
        },
      }),
    ])

    return NextResponse.json({ unreadCount, notifications })
  } catch (error) {
    console.error("Recent notifications error:", error)
    return NextResponse.json({ error: "SYSTEM_ERROR" }, { status: 500 })
  }
}
