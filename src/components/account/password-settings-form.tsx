"use client"

import { useState } from "react"
import { Eye, EyeOff, KeyRound, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface PasswordSettingsFormProps {
  hasPassword: boolean
}

export function PasswordSettingsForm({ hasPassword }: PasswordSettingsFormProps) {
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [status, setStatus] = useState<"idle" | "saving" | "success" | "error">("idle")
  const [message, setMessage] = useState("")
  const [showCurrent, setShowCurrent] = useState(false)
  const [showNext, setShowNext] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  if (!hasPassword) {
    return (
      <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 sm:p-6">
        <h2 className="text-lg font-semibold text-[var(--color-text)]">Password</h2>
        <p className="mt-2 text-sm text-[var(--color-text-secondary)]">
          This account currently signs in with Google/GitHub. Password setup is not available yet.
        </p>
      </div>
    )
  }

  const canSubmit = currentPassword.length > 0 && newPassword.length >= 8 && confirmPassword.length > 0

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    setStatus("saving")
    setMessage("")

    try {
      const res = await fetch("/api/account/password", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          currentPassword,
          newPassword,
          confirmPassword,
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.message || data.error || "Failed to update password")
      }

      setCurrentPassword("")
      setNewPassword("")
      setConfirmPassword("")
      setStatus("success")
      setMessage("Password updated.")
    } catch (error) {
      setStatus("error")
      setMessage(error instanceof Error ? error.message : "Failed to update password")
    }
  }

  return (
    <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 sm:p-6">
      <div className="mb-5 flex items-center gap-2">
        <KeyRound className="h-4 w-4 text-[var(--color-primary)]" />
        <h2 className="text-lg font-semibold text-[var(--color-text)]">Password</h2>
      </div>

      <form onSubmit={submit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="current-password">Current password</Label>
          <div className="relative">
            <Input
              id="current-password"
              type={showCurrent ? "text" : "password"}
              value={currentPassword}
              onChange={(event) => {
                setCurrentPassword(event.target.value)
                if (status !== "idle") {
                  setStatus("idle")
                  setMessage("")
                }
              }}
              autoComplete="current-password"
              placeholder="Enter current password"
            />
            <button
              type="button"
              onClick={() => setShowCurrent((value) => !value)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-text-tertiary)] hover:text-[var(--color-text)]"
              aria-label={showCurrent ? "Hide current password" : "Show current password"}
            >
              {showCurrent ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="new-password">New password</Label>
            <div className="relative">
              <Input
                id="new-password"
                type={showNext ? "text" : "password"}
                minLength={8}
                value={newPassword}
                onChange={(event) => {
                  setNewPassword(event.target.value)
                  if (status !== "idle") {
                    setStatus("idle")
                    setMessage("")
                  }
                }}
                autoComplete="new-password"
                placeholder="At least 8 characters"
              />
              <button
                type="button"
                onClick={() => setShowNext((value) => !value)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-text-tertiary)] hover:text-[var(--color-text)]"
                aria-label={showNext ? "Hide new password" : "Show new password"}
              >
                {showNext ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirm-password">Confirm new password</Label>
            <div className="relative">
              <Input
                id="confirm-password"
                type={showConfirm ? "text" : "password"}
                minLength={8}
                value={confirmPassword}
                onChange={(event) => {
                  setConfirmPassword(event.target.value)
                  if (status !== "idle") {
                    setStatus("idle")
                    setMessage("")
                  }
                }}
                autoComplete="new-password"
                placeholder="Repeat new password"
              />
              <button
                type="button"
                onClick={() => setShowConfirm((value) => !value)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-text-tertiary)] hover:text-[var(--color-text)]"
                aria-label={showConfirm ? "Hide confirm password" : "Show confirm password"}
              >
                {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[var(--color-border)] pt-4">
          <p className={`text-sm ${status === "error" ? "text-[var(--color-danger)]" : status === "success" ? "text-[var(--color-success)]" : "text-[var(--color-text-tertiary)]"}`}>
            {message || "Use a strong password you do not reuse elsewhere."}
          </p>

          <Button type="submit" disabled={status === "saving" || !canSubmit} className="gap-2">
            {status === "saving" ? <Loader2 className="h-4 w-4 animate-spin" /> : <KeyRound className="h-4 w-4" />}
            {status === "saving" ? "Updating..." : "Update Password"}
          </Button>
        </div>
      </form>
    </div>
  )
}
