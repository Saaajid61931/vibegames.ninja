import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { markNotificationsRead } from "@/lib/notifications"
import prisma from "@/lib/prisma"
import { logServerError } from "@/lib/server-log"

export async function POST(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: "AUTHENTICATION_REQUIRED" }, { status: 401 })
    }

    const body = await request.json().catch(() => null)
    const notificationIds = Array.isArray(body?.notificationIds)
      ? body.notificationIds.filter((value: unknown): value is string => typeof value === "string")
      : undefined

    const result = await markNotificationsRead(prisma, session.user.id, notificationIds)

    return NextResponse.json({
      success: true,
      updatedCount: result.updatedCount,
      unreadCount: result.unreadCount,
    })
  } catch (error) {
    logServerError("Mark notifications read failed", error, {
      route: "/api/notifications/read",
      method: "POST",
    })
    return NextResponse.json({ error: "SYSTEM_ERROR" }, { status: 500 })
  }
}
