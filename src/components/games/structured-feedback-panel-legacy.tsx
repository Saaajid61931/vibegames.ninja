"use client"

import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
import { Loader2, MessageSquarePlus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { FEEDBACK_SIGNAL_KEYS, FEEDBACK_SIGNAL_LABELS, type FeedbackSignalKey } from "@/lib/creator-magnet"

type FeedbackSummary = {
  counts: Record<FeedbackSignalKey | "total", number>
  topSignals: Array<{
    key: FeedbackSignalKey
    label: string
    count: number
  }>
}

type UserFeedback = Partial<Record<FeedbackSignalKey, boolean>> & {
  comment?: string | null
}

interface StructuredFeedbackPanelProps {
  gameId: string
  slug: string
  initialSummary: FeedbackSummary
  initialUserFeedback: UserFeedback | null
  recentComments: Array<{
    comment: string | null
    createdAt: string | Date
  }>
  isAuthenticated: boolean
}

const PROMPT_DELAY_MS = 45000

export function StructuredFeedbackPanel({
  gameId,
  slug,
  initialSummary,
  initialUserFeedback,
  recentComments,
  isAuthenticated,
}: StructuredFeedbackPanelProps) {
  const [summary, setSummary] = useState(initialSummary)
  const [selectedSignals, setSelectedSignals] = useState<Record<FeedbackSignalKey, boolean>>({
    fun: Boolean(initialUserFeedback?.fun),
    confusing: Boolean(initialUserFeedback?.confusing),
    tooHard: Boolean(initialUserFeedback?.tooHard),
    buggy: Boolean(initialUserFeedback?.buggy),
  })
  const [comment, setComment] = useState(initialUserFeedback?.comment || "")
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState("")
  const [showPrompt, setShowPrompt] = useState(Boolean(initialUserFeedback))

  useEffect(() => {
    if (initialUserFeedback) {
      return
    }

    const timeoutId = window.setTimeout(() => {
      setShowPrompt(true)
    }, PROMPT_DELAY_MS)

    return () => window.clearTimeout(timeoutId)
  }, [initialUserFeedback])

  const hasSelection = useMemo(() => {
    return FEEDBACK_SIGNAL_KEYS.some((key) => selectedSignals[key]) || comment.trim().length > 0
  }, [comment, selectedSignals])

  const handleToggle = (key: FeedbackSignalKey) => {
    setSelectedSignals((prev) => ({
      ...prev,
      [key]: !prev[key],
    }))
    if (message) {
      setMessage("")
    }
  }

  const handleSubmit = async () => {
    if (!hasSelection || saving) {
      return
    }

    setSaving(true)
    setMessage("")

    try {
      const res = await fetch(`/api/games/${gameId}/feedback`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...selectedSignals,
          comment: comment.trim(),
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || "Failed to send feedback")
      }

      setSummary(data.summary)
      setMessage("Feedback sent. Creators can now act on it faster.")
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Failed to send feedback")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="border-2 border-[#4a4a6a] bg-[#11111d] p-4 sm:p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <MessageSquarePlus className="h-4 w-4 text-[#00d1ff]" />
            <span className="font-arcade text-[11px] text-[#00d1ff]">STRUCTURED FEEDBACK</span>
          </div>
          <h3 className="mt-2 font-arcade text-sm text-white">Help the creator improve this game</h3>
          <p className="mt-2 font-arcade text-xs text-[#8b93a6]">
            Quick signals work better than silence. Mark what stood out and optionally leave one short note.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {FEEDBACK_SIGNAL_KEYS.map((key) => (
            <div key={key} className="border border-[#2e3446] bg-[#0d0d15] px-3 py-2 text-center">
              <p className="font-arcade text-[10px] text-[#4a4a6a]">{FEEDBACK_SIGNAL_LABELS[key].toUpperCase()}</p>
              <p className="mt-1 font-arcade text-sm text-white">{summary.counts[key] || 0}</p>
            </div>
          ))}
        </div>
      </div>

      {summary.topSignals.length > 0 && (
        <p className="mt-4 font-arcade text-[11px] text-[#8b93a6]">
          Most common notes so far: {summary.topSignals.slice(0, 2).map((item) => `${item.label} (${item.count})`).join(" • ")}
        </p>
      )}

      {recentComments.length > 0 && (
        <div className="mt-4 grid gap-2 sm:grid-cols-3">
          {recentComments.map((entry, index) => (
            <div key={`${index}-${entry.createdAt}`} className="border border-[#2e3446] bg-[#0d0d15] p-3">
              <p className="font-arcade text-[10px] text-[#4a4a6a]">PLAYER NOTE</p>
              <p className="mt-2 font-arcade text-xs text-white line-clamp-4">{entry.comment}</p>
            </div>
          ))}
        </div>
      )}

      {showPrompt && (
        <div className="mt-5 space-y-3 border-t border-[#2e3446] pt-4">
          <div className="flex flex-wrap gap-2">
            {FEEDBACK_SIGNAL_KEYS.map((key) => (
              <button
                key={key}
                type="button"
                className={`border px-3 py-2 text-xs font-arcade transition-colors ${
                  selectedSignals[key]
                    ? "border-[#00d1ff] bg-[#00d1ff]/10 text-[#00d1ff]"
                    : "border-[#2e3446] bg-[#0d0d15] text-[#8b93a6] hover:border-[#4a4a6a] hover:text-white"
                }`}
                onClick={() => handleToggle(key)}
              >
                {FEEDBACK_SIGNAL_LABELS[key].toUpperCase()}
              </button>
            ))}
          </div>

          <Textarea
            value={comment}
            onChange={(event) => {
              setComment(event.target.value)
              if (message) {
                setMessage("")
              }
            }}
            maxLength={280}
            placeholder="Optional note: what should the creator keep, fix, or try next?"
            className="min-h-[100px] font-arcade"
          />

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="font-arcade text-[10px] text-[#4a4a6a]">{comment.length}/280</p>
            {isAuthenticated ? (
              <Button
                type="button"
                className="gap-2 font-arcade"
                disabled={!hasSelection || saving}
                onClick={() => {
                  void handleSubmit()
                }}
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                {saving ? "SENDING..." : initialUserFeedback ? "UPDATE FEEDBACK" : "SEND FEEDBACK"}
              </Button>
            ) : (
              <Button asChild className="font-arcade">
                <Link href={`/login?callbackUrl=${encodeURIComponent(`/play/${slug}`)}`}>LOG IN TO SEND FEEDBACK</Link>
              </Button>
            )}
          </div>

          {message && (
            <p className={`font-arcade text-xs ${message.includes("Failed") ? "text-[#ff8b8b]" : "text-[#00ff40]"}`}>
              {message}
            </p>
          )}
        </div>
      )}
    </div>
  )
}
