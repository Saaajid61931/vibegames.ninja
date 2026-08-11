"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { Bell } from "lucide-react"
import { Button } from "@/components/ui/button"
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
      <div className="border-3 border-dashed border-border-strong bg-surface p-10 text-center shadow-hard-4">
        <Bell className="mx-auto h-12 w-12 text-arcade-yellow" />
        <h2 className="heading-pixel-md mt-5 text-white">All quiet in the arcade</h2>
        <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-text-secondary">Follows, comments, ratings, and structured feedback will show up here.</p>
        <Button asChild variant="arcade" className="mt-6">
          <Link href="/games">Discover games</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {notifications.map((notification) => {
        const content = (
          <div className={`border px-4 py-3 ${notification.read ? "border-border bg-surface" : "border-arcade-yellow/40 bg-surface-2"}`}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-arcade text-sm text-white">{notification.title}</p>
                <p className="mt-1 font-arcade text-sm text-text-secondary">{notification.message}</p>
              </div>
              {!notification.read && <span className="font-arcade text-xs text-arcade-yellow">NEW</span>}
            </div>
            <p className="mt-2 font-arcade text-xs text-text-secondary">{timeAgo(new Date(notification.createdAt))}</p>
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
