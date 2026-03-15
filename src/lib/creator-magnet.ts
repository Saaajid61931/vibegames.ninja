export type LaunchChecklistItem = {
  id: string
  label: string
  done: boolean
  detail: string
}

export function getLaunchChecklist(input: {
  title?: string | null
  description?: string | null
  instructions?: string | null
  thumbnail?: string | null
  supportsMobile?: boolean
  latestUpdateNote?: string | null
}) {
  const description = (input.description || "").trim()
  const instructions = (input.instructions || "").trim()
  const title = (input.title || "").trim()
  const latestUpdateNote = (input.latestUpdateNote || "").trim()
  const hasThumbnail = Boolean(input.thumbnail)

  const items: LaunchChecklistItem[] = [
    {
      id: "title",
      label: "Strong title",
      done: title.length >= 3,
      detail: "Make the name distinctive enough to stand out in discovery lanes.",
    },
    {
      id: "description",
      label: "Description quality",
      done: description.length >= 80,
      detail: "Aim for a short pitch, what makes it fun, and the first thing to try.",
    },
    {
      id: "controls",
      label: "Controls or how-to-play",
      done: instructions.length >= 12,
      detail: "Reduce bounce by telling players how to start in one glance.",
    },
    {
      id: "thumbnail",
      label: "Thumbnail ready",
      done: hasThumbnail,
      detail: "Games with cover art feel more finished and clickworthy.",
    },
    {
      id: "share",
      label: "Share card ready",
      done: hasThumbnail && title.length >= 3 && description.length >= 40,
      detail: "A title, thumbnail, and decent summary create a much better social preview.",
    },
    {
      id: "mobile",
      label: "Mobile badge decided",
      done: typeof input.supportsMobile === "boolean",
      detail: "Explicit mobile support helps players choose and helps discovery lanes feel trustworthy.",
    },
    {
      id: "update",
      label: "Launch or update note",
      done: latestUpdateNote.length >= 20,
      detail: "A short update note makes creator pages feel alive and more portfolio-like.",
    },
  ]

  return {
    items,
    completed: items.filter((item) => item.done).length,
    total: items.length,
  }
}

export const FEEDBACK_SIGNAL_KEYS = ["fun", "confusing", "tooHard", "buggy"] as const
export type FeedbackSignalKey = (typeof FEEDBACK_SIGNAL_KEYS)[number]

export const FEEDBACK_SIGNAL_LABELS: Record<FeedbackSignalKey, string> = {
  fun: "Fun",
  confusing: "Confusing",
  tooHard: "Too hard",
  buggy: "Buggy",
}

export function summarizeFeedback<T extends Partial<Record<FeedbackSignalKey, boolean>>>(feedbackItems: T[]) {
  const counts = {
    total: feedbackItems.length,
    fun: 0,
    confusing: 0,
    tooHard: 0,
    buggy: 0,
  }

  for (const item of feedbackItems) {
    for (const key of FEEDBACK_SIGNAL_KEYS) {
      if (item[key]) {
        counts[key] += 1
      }
    }
  }

  const topSignals = FEEDBACK_SIGNAL_KEYS
    .map((key) => ({
      key,
      label: FEEDBACK_SIGNAL_LABELS[key],
      count: counts[key],
    }))
    .filter((item) => item.count > 0)
    .sort((a, b) => b.count - a.count)

  return {
    counts,
    topSignals,
  }
}
