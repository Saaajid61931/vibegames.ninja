"use client"

import Link from "next/link"
import { useState } from "react"
import { Bug, Lightbulb, Loader2, MessageCircle, MessageSquarePlus } from "lucide-react"
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
    label: "Report a problem",
    description: "Something broke, glitched, or did not work as expected.",
    icon: Bug,
    color: "#f43f5e",
  },
  {
    kind: "IDEA",
    label: "Suggest an improvement",
    description: "Share one idea that could make the game better.",
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
      className="vg-panel scroll-mt-24 p-5 sm:p-6"
      aria-labelledby="player-feedback-title"
    >
      <span className="vg-kicker">
        <MessageSquarePlus className="h-4 w-4" />
        Player feedback
      </span>
      <h2 id="player-feedback-title" className="mt-3 text-xl font-semibold text-white">
        What would you like to share?
      </h2>
      <p className="mt-2 text-sm leading-6 text-[var(--color-text-secondary)]">
        Choose the option that best matches your message. Feedback goes directly to the creator.
      </p>

      <div className="mt-5 grid gap-3 sm:grid-cols-3">
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
              className={`flex min-h-32 items-start gap-3 rounded-xl border p-4 text-left transition-all ${
                selected
                  ? "border-current bg-white/[0.06] ring-1 ring-current"
                  : "border-[var(--color-border)] bg-black/15 hover:-translate-y-0.5 hover:border-[var(--color-border-strong)]"
              }`}
              style={{ color: choice.color }}
            >
              <Icon className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
              <span>
                <span className="block text-sm font-semibold text-white">
                  {choice.label}
                </span>
                <span className="mt-2 block text-xs leading-5 text-[var(--color-text-secondary)]">
                  {choice.description}
                </span>
              </span>
            </button>
          )
        })}

        <a
          href="#comments"
          className="flex min-h-32 items-start gap-3 rounded-xl border border-[var(--color-border)] bg-black/15 p-4 text-left text-[#a78bfa] transition-all hover:-translate-y-0.5 hover:border-[var(--color-border-strong)]"
        >
          <MessageCircle className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
          <span>
            <span className="block text-sm font-semibold text-white">Leave a comment</span>
            <span className="mt-2 block text-xs leading-5 text-[var(--color-text-secondary)]">
              Join the public conversation with a usual comment or reply.
            </span>
          </span>
        </a>
      </div>

      {kind ? (
        <div className="mt-5 space-y-3 rounded-xl border border-[var(--color-border)] bg-black/15 p-4">
          <div>
            <p className="text-sm font-semibold text-white">
              {kind === "BUG" ? "Describe the problem" : "Describe your suggestion"}
            </p>
            <p className="mt-1 text-xs text-[var(--color-text-tertiary)]">
              Clear, specific details help the creator act on it faster.
            </p>
          </div>
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
            className="min-h-28"
          />

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <span className="text-xs text-[var(--color-text-tertiary)]">
              {comment.length}/500
            </span>
            {isAuthenticated ? (
              <Button
                type="button"
                className="gap-2"
                disabled={comment.trim().length < 5 || saving}
                onClick={() => {
                  void handleSubmit()
                }}
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                {saving ? "Sending..." : "Send to creator"}
              </Button>
            ) : (
              <Button asChild>
                <Link
                  href={`/login?callbackUrl=${encodeURIComponent(
                    `/play/${slug}#feedback`
                  )}`}
                >
                  Sign in to send
                </Link>
              </Button>
            )}
          </div>
        </div>
      ) : null}

      {message ? (
        <p
          className={`mt-4 rounded-lg border px-3 py-2 text-sm ${
            message.toLowerCase().includes("could not") ||
            message.toLowerCase().includes("error")
              ? "border-[#f43f5e]/30 bg-[#f43f5e]/5 text-[#ff9ab1]"
              : "border-[#22c55e]/30 bg-[#22c55e]/5 text-[#7ee2a8]"
          }`}
        >
          {message}
        </p>
      ) : null}
    </section>
  )
}
