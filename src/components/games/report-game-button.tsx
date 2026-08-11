"use client"

import { useId, useState } from "react"
import { Flag, Loader2, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

const REPORT_REASONS = [
  { value: "COPYRIGHT", label: "Copyright" },
  { value: "INAPPROPRIATE", label: "Inappropriate content" },
  { value: "MALWARE", label: "Malware or unsafe behavior" },
  { value: "SPAM", label: "Spam" },
  { value: "OTHER", label: "Other" },
] as const

interface ReportGameButtonProps {
  gameId: string
  gameTitle: string
}

export function ReportGameButton({ gameId, gameTitle }: ReportGameButtonProps) {
  const descriptionId = useId()
  const [open, setOpen] = useState(false)
  const [reason, setReason] = useState<string>("INAPPROPRIATE")
  const [description, setDescription] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  const resetForm = () => {
    setReason("INAPPROPRIATE")
    setDescription("")
    setError("")
    setSuccess("")
  }

  const close = () => {
    setOpen(false)
    setSubmitting(false)
    resetForm()
  }

  const handleSubmit = async () => {
    if (submitting) {
      return
    }

    setSubmitting(true)
    setError("")
    setSuccess("")

    try {
      const res = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          gameId,
          reason,
          description: description.trim() || undefined,
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || "Failed to submit report")
      }

      setSuccess(data.message || "Report submitted")
      setDescription("")
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Failed to submit report")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="h-auto gap-2 px-0 py-1 text-xs text-text-tertiary hover:bg-transparent hover:text-white"
        onClick={() => setOpen(true)}
      >
        <Flag className="h-4 w-4" />
        Report unsafe content
      </Button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 px-4 py-6">
          <div className="vg-panel w-full max-w-lg shadow-2xl" role="dialog" aria-modal="true" aria-labelledby={`${descriptionId}-title`}>
            <div className="flex items-center justify-between border-b border-border px-5 py-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-arcade-yellow">Safety report</p>
                <h2 id={`${descriptionId}-title`} className="mt-1 text-lg font-semibold text-white">Report {gameTitle}</h2>
              </div>
              <Button type="button" variant="ghost" size="icon" onClick={close} aria-label="Close report dialog">
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="space-y-4 p-5">
              <div className="space-y-2">
                <Label htmlFor={`${descriptionId}-reason`}>
                  Reason
                </Label>
                <Select value={reason} onValueChange={setReason}>
                  <SelectTrigger id={`${descriptionId}-reason`}>
                    <SelectValue placeholder="Select a reason" />
                  </SelectTrigger>
                  <SelectContent>
                    {REPORT_REASONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor={descriptionId}>
                  Details (optional)
                </Label>
                <Textarea
                  id={descriptionId}
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  maxLength={500}
                  placeholder="Tell us what happened so we can review faster..."
                  className="min-h-32 text-sm"
                  disabled={submitting || Boolean(success)}
                />
                <p className="text-right text-xs text-text-tertiary">{description.length}/500</p>
              </div>

              {error && <p className="text-sm text-danger-text">{error}</p>}
              {success && <p className="text-sm text-success-text">{success}</p>}

              <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                <Button type="button" variant="outline" onClick={close}>
                  {success ? "Done" : "Cancel"}
                </Button>
                {!success && (
                  <Button type="button" onClick={handleSubmit} disabled={submitting}>
                    {submitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <Flag className="mr-2 h-4 w-4" />
                        Submit Report
                      </>
                    )}
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
