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
    { id: "BUGS", label: "Open problems", count: counts.BUGS },
    { id: "IDEAS", label: "Suggestions", count: counts.IDEAS },
    { id: "FIXED", label: "Recently fixed", count: counts.FIXED },
  ]

  return (
    <section
      id="feedback-inbox"
      className="scroll-mt-24 border border-border-strong bg-surface"
    >
      <div className="border-b border-border p-5 sm:p-6">
        <span className="vg-kicker">Player feedback</span>
        <h2 className="mt-3 text-xl font-semibold text-white">Feedback inbox</h2>
        <p className="mt-2 text-sm text-text-secondary">
          Review reported problems and useful improvement suggestions from players.
        </p>

        <div className="mt-5 grid grid-cols-3 border border-border-strong">
          {filters.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setFilter(item.id)}
              className={`border-r border-border-strong px-2 py-3 text-center transition-colors last:border-r-0 ${
                filter === item.id
                  ? "bg-primary text-white"
                  : "bg-canvas text-text-secondary hover:bg-surface-2 hover:text-white"
              }`}
            >
              <span className="block text-base font-bold text-white">{item.count}</span>
              <span className="mt-1 block text-xs">
                {item.label}
              </span>
            </button>
          ))}
        </div>
      </div>

      {error ? (
        <p className="border-b border-border px-5 py-3 text-sm text-danger-text">
          {error}
        </p>
      ) : null}

      <div className="divide-y divide-border">
        {visibleItems.length > 0 ? (
          visibleItems.slice(0, 20).map((item) => {
            const { message, context } = splitDescription(item.description)
            const isUpdating = updatingId === item.id

            return (
              <article key={item.id} className="p-5 transition-colors hover:bg-surface-2 sm:p-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      {item.reason === "BUG" ? (
                        <Bug className="h-4 w-4 text-arcade-red" />
                      ) : (
                        <Lightbulb className="h-4 w-4 text-arcade-cyan" />
                      )}
                      <Link
                        href={`/play/${item.game.slug}`}
                        className="text-sm font-semibold text-white hover:text-primary-hover-text"
                      >
                        {item.game.title}
                      </Link>
                      {item.status === "REVIEWING" ? (
                        <span className="border border-arcade-yellow bg-canvas px-2 py-0.5 text-xs text-arcade-yellow">
                          Considering
                        </span>
                      ) : null}
                      <span className="text-xs text-text-tertiary">
                        {formatDate(item.createdAt)}
                      </span>
                    </div>

                    <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-text-secondary">
                      {message}
                    </p>

                    {item.reason === "BUG" && context ? (
                      <p className="mt-2 whitespace-pre-wrap text-xs leading-5 text-text-tertiary">
                        {context}
                      </p>
                    ) : null}
                  </div>

                  {filter !== "FIXED" ? (
                    <div className="flex shrink-0 flex-wrap gap-2">
                      {item.reason === "BUG" ? (
                        <Button
                          size="sm"
                          className="gap-2 rounded-sm"
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
                          Mark fixed
                        </Button>
                      ) : item.status === "PENDING" ? (
                        <Button
                          size="sm"
                          variant="arcade-outline"
                          className="gap-2 rounded-sm"
                          disabled={Boolean(updatingId)}
                          onClick={() => {
                            void updateStatus(item.id, "REVIEWING")
                          }}
                        >
                          <Lightbulb className="h-3.5 w-3.5" />
                          Consider
                        </Button>
                      ) : null}

                      <Button
                        size="sm"
                        variant="ghost"
                        className="gap-2 rounded-sm text-text-secondary"
                        disabled={Boolean(updatingId)}
                        onClick={() => {
                          void updateStatus(item.id, "DISMISSED")
                        }}
                      >
                        <Archive className="h-3.5 w-3.5" />
                        Archive
                      </Button>
                    </div>
                  ) : (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="gap-2 rounded-sm text-text-secondary"
                      disabled={Boolean(updatingId)}
                      onClick={() => {
                        void updateStatus(item.id, "PENDING")
                      }}
                    >
                      <RotateCcw className="h-3.5 w-3.5" />
                      Reopen
                    </Button>
                  )}
                </div>
              </article>
            )
          })
        ) : (
          <div className="p-10 text-center">
            <p className="text-sm font-medium text-white">
              {filter === "BUGS"
                ? "No open bugs."
                : filter === "IDEAS"
                  ? "No new ideas."
                  : "Nothing marked fixed yet."}
            </p>
            <p className="mt-2 text-xs text-text-tertiary">
              New player feedback will appear here.
            </p>
          </div>
        )}
      </div>
    </section>
  )
}
