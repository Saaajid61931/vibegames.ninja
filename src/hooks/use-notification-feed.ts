"use client"

import { useCallback, useEffect, useRef, useState } from "react"

export type NotificationFeedItem = {
  id: string
  title: string
  message: string
  link: string | null
  read: boolean
  createdAt: string
}

type NotificationFeedState = {
  unreadCount: number
  notifications: NotificationFeedItem[]
}

const EMPTY_STATE: NotificationFeedState = {
  unreadCount: 0,
  notifications: [],
}

export function useNotificationFeed(userId?: string | null, pathname?: string) {
  const [state, setState] = useState<NotificationFeedState>(EMPTY_STATE)
  const [loading, setLoading] = useState(false)
  const abortControllerRef = useRef<AbortController | null>(null)
  const requestIdRef = useRef(0)

  const refresh = useCallback(async () => {
    if (!userId) {
      setState(EMPTY_STATE)
      setLoading(false)
      return
    }

    abortControllerRef.current?.abort()
    const controller = new AbortController()
    abortControllerRef.current = controller
    const requestId = requestIdRef.current + 1
    requestIdRef.current = requestId
    setLoading(true)

    try {
      const res = await fetch("/api/notifications/recent", {
        cache: "no-store",
        signal: controller.signal,
      })

      if (!res.ok) {
        return
      }

      const data = await res.json()
      if (requestId !== requestIdRef.current) {
        return
      }

      setState({
        unreadCount: typeof data.unreadCount === "number" ? data.unreadCount : 0,
        notifications: Array.isArray(data.notifications) ? data.notifications : [],
      })
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        return
      }
    } finally {
      if (requestId === requestIdRef.current) {
        setLoading(false)
      }
    }
  }, [userId])

  useEffect(() => {
    if (!userId) {
      abortControllerRef.current?.abort()
      setState(EMPTY_STATE)
      setLoading(false)
      return
    }

    const handleFocus = () => {
      void refresh()
    }

    void refresh()
    window.addEventListener("focus", handleFocus)

    return () => {
      abortControllerRef.current?.abort()
      window.removeEventListener("focus", handleFocus)
    }
  }, [userId, refresh, pathname])

  return {
    unreadCount: state.unreadCount,
    notifications: state.notifications,
    loading,
    refresh,
  }
}
