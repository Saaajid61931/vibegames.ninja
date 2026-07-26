"use client"

import Link from "next/link"
import { useMemo, useState } from "react"
import {
  Archive,
  Bug,
  Check,
  Lightbulb,
  Loader2,
  RotateCcw,
} from "lucide-react"
import { Button } from "@/components/ui/button"

type FeedbackStatus = "PENDING" | "REVIEWING" | "RESOLVED" | "DISMISSED"
type InboxFilter = "BUGS" | "IDEAS" | "FIXED"

export type CreatorFeedbackItem = {
  id: string
  reason: "BUG" | "IDEA"
  description: string | null
  status: FeedbackStatus
  createdAt: string
  resolvedAt: string | null
  game: {
    slug: string
    title: string
  }
}

interface CreatorFeedbackInboxProps {
  initialItems: CreatorFeedbackItem[]
}

const CONTEXT_SEPARATOR = "\n\n---\n"

function splitDescription(description: string | null) {
  const [message = "", context = ""] = (description || "").split(
    CONTEXT_SEPARATOR,
    2
  )
  return { message, context }
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  }).format(new Date(value))
}

export function CreatorFeedbackInbox({
  initialItems,
}: CreatorFeedbackInboxProps) {
  const [items, setItems] = useState(initialItems)
  const [filter, setFilter] = useState<InboxFilter>("BUGS")
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const [error, setError] = useState("")

  const counts = useMemo(
    () => ({
      BUGS: items.filter(
        (item) =>
          item.reason === "BUG" &&
          ["PENDING", "REVIEWING"].includes(item.status)
      ).length,
      IDEAS: items.filter(
        (item) =>
          item.reason === "IDEA" &&
          ["PENDING", "REVIEWING"].includes(item.status)
      ).length,
      FIXED: items.filter(
        (item) => item.reason === "BUG" && item.status === "RESOLVED"
      ).length,
    }),
    [items]
  )

  const visibleItems = useMemo(() => {
    if (filter === "FIXED") {
      return items.filter(
        (item) => item.reason === "BUG" && item.status === "RESOLVED"
      )
    }

    const reason = filter === "BUGS" ? "BUG" : "IDEA"
    return items.filter(
      (item) =>
        item.reason === reason &&
        ["PENDING", "REVIEWING"].includes(item.status)
    )
  }, [filter, items])

  const updateStatus = async (id: string, status: FeedbackStatus) => {
    if (updatingId) return

    setUpdatingId(id)
    setError("")

    try {
      const response = await fetch(`/api/creator/feedback/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      })
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Could not update feedback")
      }

      setItems((current) =>
        current.map((item) =>
          item.id === id
            ? {
                ...item,
                status: data.feedback.status,
                resolvedAt: data.feedback.resolvedAt,
              }
            : item
        )
      )
    } catch (updateError) {
      setError(
        updateError instanceof Error
          ? updateError.message
          : "Could not update feedback"
      )
    } finally {
      setUpdatingId(null)
    }
  }

  const filters: Array<{
    id: InboxFilter
    label: string
    count: number
  }> = [
    { id: "BUGS", label: "OPEN BUGS", count: counts.BUGS },
    { id: "IDEAS", label: "NEW IDEAS", count: counts.IDEAS },
    { id: "FIXED", label: "RECENTLY FIXED", count: counts.FIXED },
  ]

  return (
    <section
      id="feedback-inbox"
      className="mb-8 scroll-mt-24 border-2 border-[#4a4a6a] bg-[#0d0d15]"
    >
      <div className="border-b-2 border-[#4a4a6a] bg-[#1a1a2e] p-4">
        <h2 className="font-arcade text-sm text-white">FEEDBACK INBOX</h2>
        <p className="mt-1 font-arcade text-[10px] text-[#8b93a6]">
          Fix clear problems. Save useful ideas. Ignore the noise.
        </p>

        <div className="mt-4 grid grid-cols-3 gap-2">
          {filters.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setFilter(item.id)}
              className={`border px-2 py-3 text-center transition-colors ${
                filter === item.id
                  ? "border-[#00d1ff] bg-[#00d1ff]/10 text-[#00d1ff]"
                  : "border-[#2e3446] text-[#8b93a6] hover:border-[#596176] hover:text-white"
              }`}
            >
              <span className="block font-pixel text-base">{item.count}</span>
              <span className="mt-1 block font-arcade text-[9px]">
                {item.label}
              </span>
            </button>
          ))}
        </div>
      </div>

      {error ? (
        <p className="border-b border-[#2e3446] px-4 py-3 font-arcade text-xs text-[#ff8b8b]">
          {error}
        </p>
      ) : null}

      <div className="divide-y divide-[#222]">
        {visibleItems.length > 0 ? (
          visibleItems.slice(0, 20).map((item) => {
            const { message, context } = splitDescription(item.description)
            const isUpdating = updatingId === item.id

            return (
              <article key={item.id} className="p-4">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      {item.reason === "BUG" ? (
                        <Bug className="h-4 w-4 text-[#f43f5e]" />
                      ) : (
                        <Lightbulb className="h-4 w-4 text-[#00d1ff]" />
                      )}
                      <Link
                        href={`/play/${item.game.slug}`}
                        className="font-arcade text-sm text-white hover:text-[#ffff00]"
                      >
                        {item.game.title}
                      </Link>
                      {item.status === "REVIEWING" ? (
                        <span className="border border-[#facc15]/50 px-2 py-0.5 font-arcade text-[9px] text-[#facc15]">
                          CONSIDERING
                        </span>
                      ) : null}
                      <span className="font-arcade text-[9px] text-[#4a4a6a]">
                        {formatDate(item.createdAt)}
                      </span>
                    </div>

                    <p className="mt-3 whitespace-pre-wrap font-arcade text-xs leading-relaxed text-[#d4d9e5]">
                      {message}
                    </p>

                    {item.reason === "BUG" && context ? (
                      <p className="mt-2 whitespace-pre-wrap font-arcade text-[9px] leading-relaxed text-[#596176]">
                        {context}
                      </p>
                    ) : null}
                  </div>

                  {filter !== "FIXED" ? (
                    <div className="flex shrink-0 flex-wrap gap-2">
                      {item.reason === "BUG" ? (
                        <Button
                          size="sm"
                          className="gap-2 font-arcade"
                          disabled={Boolean(updatingId)}
                          onClick={() => {
                            void updateStatus(item.id, "RESOLVED")
                          }}
                        >
                          {isUpdating ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Check className="h-3.5 w-3.5" />
                          )}
                          FIXED
                        </Button>
                      ) : item.status === "PENDING" ? (
                        <Button
                          size="sm"
                          variant="arcade-outline"
                          className="gap-2 font-arcade"
                          disabled={Boolean(updatingId)}
                          onClick={() => {
                            void updateStatus(item.id, "REVIEWING")
                          }}
                        >
                          <Lightbulb className="h-3.5 w-3.5" />
                          CONSIDER
                        </Button>
                      ) : null}

                      <Button
                        size="sm"
                        variant="ghost"
                        className="gap-2 font-arcade text-[#8b93a6]"
                        disabled={Boolean(updatingId)}
                        onClick={() => {
                          void updateStatus(item.id, "DISMISSED")
                        }}
                      >
                        <Archive className="h-3.5 w-3.5" />
                        ARCHIVE
                      </Button>
                    </div>
                  ) : (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="gap-2 font-arcade text-[#8b93a6]"
                      disabled={Boolean(updatingId)}
                      onClick={() => {
                        void updateStatus(item.id, "PENDING")
                      }}
                    >
                      <RotateCcw className="h-3.5 w-3.5" />
                      REOPEN
                    </Button>
                  )}
                </div>
              </article>
            )
          })
        ) : (
          <div className="p-10 text-center">
            <p className="font-arcade text-sm text-white">
              {filter === "BUGS"
                ? "No open bugs."
                : filter === "IDEAS"
                  ? "No new ideas."
                  : "Nothing marked fixed yet."}
            </p>
            <p className="mt-2 font-arcade text-[10px] text-[#596176]">
              New player feedback will appear here.
            </p>
          </div>
        )}
      </div>
    </section>
  )
}
