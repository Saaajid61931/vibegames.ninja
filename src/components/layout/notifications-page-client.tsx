"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { timeAgo } from "@/lib/utils"
import type { NotificationFeedItem } from "@/hooks/use-notification-feed"

type NotificationsPageClientProps = {
  initialNotifications: NotificationFeedItem[]
}

export function NotificationsPageClient({ initialNotifications }: NotificationsPageClientProps) {
  const [notifications, setNotifications] = useState(initialNotifications)

  const unreadIds = useMemo(
    () => notifications.filter((notification) => !notification.read).map((notification) => notification.id),
    [notifications]
  )

  useEffect(() => {
    if (unreadIds.length === 0) {
      return
    }

    let cancelled = false

    const markRead = async () => {
      try {
        const res = await fetch("/api/notifications/read", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ notificationIds: unreadIds }),
        })

        if (!res.ok || cancelled) {
          return
        }

        setNotifications((current) =>
          current.map((notification) => ({
            ...notification,
            read: true,
          }))
        )
      } catch {
        // Non-blocking page sync.
      }
    }

    void markRead()

    return () => {
      cancelled = true
    }
  }, [unreadIds])

  if (notifications.length === 0) {
    return (
      <div className="rounded-lg border border-[#2e3446] bg-[#111626] p-8 text-center">
        <p className="font-arcade text-white">No notifications yet.</p>
        <p className="mt-2 text-sm font-arcade text-[#4a4a6a]">Follows, comments, ratings, and structured feedback will show up here.</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {notifications.map((notification) => {
        const content = (
          <div className={`border px-4 py-3 ${notification.read ? "border-[#2e3446] bg-[#111626]" : "border-[#ffff00]/40 bg-[#1a1a2e]"}`}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-arcade text-sm text-white">{notification.title}</p>
                <p className="mt-1 font-arcade text-sm text-[#8b93a6]">{notification.message}</p>
              </div>
              {!notification.read && <span className="font-arcade text-[10px] text-[#ffff00]">NEW</span>}
            </div>
            <p className="mt-2 font-arcade text-[10px] text-[#4a4a6a]">{timeAgo(new Date(notification.createdAt))}</p>
          </div>
        )

        return notification.link ? (
          <Link key={notification.id} href={notification.link} className="block hover:opacity-95 transition-opacity">
            {content}
          </Link>
        ) : (
          <div key={notification.id}>{content}</div>
        )
      })}
    </div>
  )
}
