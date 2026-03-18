import type prisma from "./prisma"

type NotificationClient = Pick<typeof prisma, "notification">

export type NotificationSummary = {
  id: string
  title: string
  message: string
  link: string | null
  read: boolean
  createdAt: Date
}

export async function getNotificationFeed(
  db: NotificationClient,
  userId: string,
  take = 5
) {
  const [unreadCount, notifications] = await Promise.all([
    db.notification.count({
      where: {
        userId,
        read: false,
      },
    }),
    db.notification.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take,
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

  return {
    unreadCount,
    notifications,
  }
}

export async function markNotificationsRead(
  db: NotificationClient,
  userId: string,
  notificationIds?: string[]
) {
  const where = notificationIds && notificationIds.length > 0
    ? {
        userId,
        id: { in: notificationIds },
        read: false,
      }
    : {
        userId,
        read: false,
      }

  const updated = await db.notification.updateMany({
    where,
    data: { read: true },
  })

  return {
    updatedCount: updated.count,
    unreadCount: 0,
  }
}
