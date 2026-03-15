"use client"

import Link from "next/link"
import { Bell, ExternalLink, Loader2 } from "lucide-react"
import { useEffect, useMemo, useState } from "react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { timeAgo } from "@/lib/utils"

type NotificationSummary = {
  id: string
  title: string
  message: string
  link: string | null
  read: boolean
  createdAt: string
}

interface NotificationsMenuProps {
  pathname: string
}

export function NotificationsMenu({ pathname }: NotificationsMenuProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [notifications, setNotifications] = useState<NotificationSummary[]>([])
  const [unreadCount, setUnreadCount] = useState(0)

  const isNotificationsPage = pathname.startsWith("/notifications")
  const displayedUnreadCount = isNotificationsPage ? 0 : unreadCount
  const unreadLabel = displayedUnreadCount > 99 ? "99+" : String(displayedUnreadCount)

  const loadNotifications = async () => {
    setLoading(true)

    try {
      const res = await fetch("/api/notifications/recent", { cache: "no-store" })
      if (!res.ok) {
        return
      }

      const data = await res.json()
      setUnreadCount(typeof data.unreadCount === "number" ? data.unreadCount : 0)
      setNotifications(Array.isArray(data.notifications) ? data.notifications : [])
    } catch {
      // Non-blocking header data.
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadNotifications()

    const handleFocus = () => {
      void loadNotifications()
    }

    window.addEventListener("focus", handleFocus)

    return () => {
      window.removeEventListener("focus", handleFocus)
    }
  }, [pathname])

  const buttonLabel = useMemo(() => {
    if (displayedUnreadCount === 0) {
      return "Notifications"
    }

    return `${unreadLabel} unread notifications`
  }, [displayedUnreadCount, unreadLabel])

  return (
    <DropdownMenu
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen)
        if (nextOpen) {
          void loadNotifications()
        }
      }}
    >
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className="relative border-[var(--color-border)] bg-[var(--color-surface)]"
          aria-label={buttonLabel}
        >
          <Bell className="h-4 w-4 text-[var(--color-primary)]" />
          {displayedUnreadCount > 0 ? (
            <span className="absolute -right-1 -top-1 inline-flex min-w-5 items-center justify-center rounded-full bg-[#ff0040] px-1.5 py-0.5 text-[10px] font-bold text-white">
              {unreadLabel}
            </span>
          ) : null}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-[360px] p-0">
        <div className="flex items-center justify-between px-4 py-3">
          <div>
            <p className="text-sm font-semibold text-[var(--color-text)]">Notifications</p>
            <p className="text-xs text-[var(--color-text-tertiary)]">Latest activity across your games and profile.</p>
          </div>
          {loading ? <Loader2 className="h-4 w-4 animate-spin text-[var(--color-text-tertiary)]" /> : null}
        </div>

        <DropdownMenuSeparator className="my-0" />

        {notifications.length === 0 ? (
          <div className="px-4 py-6 text-center">
            <p className="text-sm font-medium text-[var(--color-text)]">No notifications yet</p>
            <p className="mt-1 text-xs text-[var(--color-text-tertiary)]">Follows, comments, ratings, and structured feedback will show up here.</p>
          </div>
        ) : (
          <div className="max-h-[360px] overflow-y-auto">
            {notifications.map((notification, index) => {
              const itemContent = (
                <div
                  className={`px-4 py-3 transition-colors hover:bg-[var(--color-surface-2)] ${
                    !notification.read ? "bg-[var(--color-primary)]/5" : ""
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <span
                      className={`mt-1 h-2 w-2 flex-shrink-0 rounded-full ${
                        notification.read ? "bg-[var(--color-border-strong)]" : "bg-[#ff0040]"
                      }`}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-3">
                        <p className="text-sm font-medium leading-5 text-[var(--color-text)]">{notification.title}</p>
                        <span className="whitespace-nowrap text-[11px] text-[var(--color-text-tertiary)]">
                          {timeAgo(new Date(notification.createdAt))}
                        </span>
                      </div>
                      <p className="mt-1 line-clamp-2 text-xs leading-5 text-[var(--color-text-secondary)]">
                        {notification.message}
                      </p>
                    </div>
                  </div>
                </div>
              )

              return (
                <div key={notification.id}>
                  {notification.link ? (
                    <Link href={notification.link} className="block">
                      {itemContent}
                    </Link>
                  ) : (
                    itemContent
                  )}
                  {index < notifications.length - 1 ? <DropdownMenuSeparator className="my-0" /> : null}
                </div>
              )
            })}
          </div>
        )}

        <DropdownMenuSeparator className="my-0" />

        <div className="p-3">
          <Button asChild variant="outline" className="w-full gap-2">
            <Link href="/notifications" target="_blank" rel="noreferrer">
              View All
              <ExternalLink className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
