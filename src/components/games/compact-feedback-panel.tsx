"use client"

import Link from "next/link"
import { useState } from "react"
import { Bug, Lightbulb, Loader2, MessageSquarePlus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"

type FeedbackKind = "BUG" | "IDEA"

interface CompactFeedbackPanelProps {
  gameId: string
  slug: string
  isAuthenticated: boolean
}

const feedbackChoices = [
  {
    kind: "BUG",
    label: "REPORT A BUG",
    description: "Something broke, glitched, or did not work.",
    icon: Bug,
    color: "#f43f5e",
  },
  {
    kind: "IDEA",
    label: "SHARE AN IDEA",
    description: "Suggest an improvement or a different direction.",
    icon: Lightbulb,
    color: "#00d1ff",
  },
] as const

export function CompactFeedbackPanel({
  gameId,
  slug,
  isAuthenticated,
}: CompactFeedbackPanelProps) {
  const [kind, setKind] = useState<FeedbackKind | null>(null)
  const [comment, setComment] = useState("")
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState("")

  const handleSubmit = async () => {
    if (!kind || comment.trim().length < 5 || saving) return

    setSaving(true)
    setMessage("")

    try {
      const response = await fetch(`/api/games/${gameId}/feedback`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kind,
          comment: comment.trim(),
          context: {
            userAgent: navigator.userAgent,
            viewport: `${window.innerWidth}x${window.innerHeight}`,
          },
        }),
      })
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Could not send feedback")
      }

      setMessage(data.message || "Feedback sent to the creator.")
      setComment("")
      setKind(null)
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Could not send feedback"
      )
    } finally {
      setSaving(false)
    }
  }

  return (
    <section
      id="feedback"
      className="border-2 border-[#4a4a6a] bg-[#11111d] p-4 sm:p-5"
      aria-labelledby="player-feedback-title"
    >
      <div className="flex items-center gap-2">
        <MessageSquarePlus className="h-4 w-4 text-[#00d1ff]" />
        <h3
          id="player-feedback-title"
          className="font-arcade text-sm text-white"
        >
          HELP IMPROVE THIS GAME
        </h3>
      </div>
      <p className="mt-2 font-arcade text-xs text-[#8b93a6]">
        Send the creator one useful bug report or idea.
      </p>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {feedbackChoices.map((choice) => {
          const Icon = choice.icon
          const selected = kind === choice.kind

          return (
            <button
              key={choice.kind}
              type="button"
              onClick={() => {
                setKind(choice.kind)
                setMessage("")
              }}
              className={`flex items-start gap-3 border p-3 text-left transition-colors ${
                selected
                  ? "border-current bg-white/5"
                  : "border-[#2e3446] bg-[#0d0d15] hover:border-[#596176]"
              }`}
              style={{ color: choice.color }}
            >
              <Icon className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
              <span>
                <span className="block font-arcade text-xs">
                  {choice.label}
                </span>
                <span className="mt-1 block font-arcade text-[10px] leading-relaxed text-[#8b93a6]">
                  {choice.description}
                </span>
              </span>
            </button>
          )
        })}
      </div>

      {kind ? (
        <div className="mt-4 space-y-3">
          <Textarea
            value={comment}
            onChange={(event) => {
              setComment(event.target.value)
              setMessage("")
            }}
            maxLength={500}
            placeholder={
              kind === "BUG"
                ? "What happened, and what were you doing?"
                : "What would make this game better or more interesting?"
            }
            className="min-h-24 font-arcade"
          />

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <span className="font-arcade text-[10px] text-[#4a4a6a]">
              {comment.length}/500
            </span>
            {isAuthenticated ? (
              <Button
                type="button"
                className="gap-2 font-arcade"
                disabled={comment.trim().length < 5 || saving}
                onClick={() => {
                  void handleSubmit()
                }}
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                {saving ? "SENDING..." : "SEND TO CREATOR"}
              </Button>
            ) : (
              <Button asChild className="font-arcade">
                <Link
                  href={`/login?callbackUrl=${encodeURIComponent(
                    `/play/${slug}#feedback`
                  )}`}
                >
                  LOG IN TO SEND
                </Link>
              </Button>
            )}
          </div>
        </div>
      ) : null}

      {message ? (
        <p
          className={`mt-3 font-arcade text-xs ${
            message.toLowerCase().includes("could not") ||
            message.toLowerCase().includes("error")
              ? "text-[#ff8b8b]"
              : "text-[#00ff40]"
          }`}
        >
          {message}
        </p>
      ) : null}
    </section>
  )
}
