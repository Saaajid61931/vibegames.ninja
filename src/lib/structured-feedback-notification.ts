import { FEEDBACK_SIGNAL_KEYS, FEEDBACK_SIGNAL_LABELS } from "@/lib/creator-magnet"

export type StructuredFeedbackNotificationInput = {
  fun: boolean
  confusing: boolean
  tooHard: boolean
  buggy: boolean
  comment?: string | null
}

export function shouldNotifyStructuredFeedback(options: {
  existingFeedback: boolean
  creatorId: string
  actorId: string
}) {
  return !options.existingFeedback && options.creatorId !== options.actorId
}

export function buildStructuredFeedbackNotificationMessage(options: {
  gameTitle: string
  actorLabel: string
  feedback: StructuredFeedbackNotificationInput
}) {
  const signalSummary = FEEDBACK_SIGNAL_KEYS
    .filter((key) => options.feedback[key])
    .map((key) => FEEDBACK_SIGNAL_LABELS[key])

  if (options.feedback.comment?.trim()) {
    return `${options.actorLabel} left quick feedback on ${options.gameTitle}: ${options.feedback.comment.trim()}`
  }

  return `${options.actorLabel} marked ${options.gameTitle} as ${signalSummary.join(", ").toLowerCase() || "worth revisiting"}.`
}
