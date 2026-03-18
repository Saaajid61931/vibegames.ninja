import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { getNotificationFeed } from "@/lib/notifications"
import prisma from "@/lib/prisma"
import { logServerError } from "@/lib/server-log"

export async function GET() {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ unreadCount: 0 })
    }

    const { unreadCount } = await getNotificationFeed(prisma, session.user.id, 1)

    return NextResponse.json({ unreadCount })
  } catch (error) {
    logServerError("Unread notifications error", error, {
      route: "/api/notifications/unread",
      method: "GET",
    })
    return NextResponse.json({ error: "SYSTEM_ERROR" }, { status: 500 })
  }
}
