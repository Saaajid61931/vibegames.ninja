"use client"

import { CheckCircle2, Circle } from "lucide-react"
import { getLaunchChecklist } from "@/lib/creator-magnet"

interface LaunchChecklistProps {
  title?: string | null
  description?: string | null
  instructions?: string | null
  thumbnail?: string | null
  supportsMobile?: boolean
  latestUpdateNote?: string | null
}

export function LaunchChecklist(props: LaunchChecklistProps) {
  const checklist = getLaunchChecklist(props)

  return (
    <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-primary)]">Launch Checklist</p>
          <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
            {checklist.completed}/{checklist.total} shipping signals ready
          </p>
        </div>
        <div className="rounded-full border border-[var(--color-border)] px-3 py-1 text-xs text-[var(--color-text)]">
          {Math.round((checklist.completed / checklist.total) * 100)}%
        </div>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-2">
        {checklist.items.map((item) => (
          <div key={item.id} className="rounded-lg border border-[var(--color-border)] bg-[var(--color-base)] p-3">
            <div className="flex items-start gap-3">
              {item.done ? (
                <CheckCircle2 className="mt-0.5 h-4 w-4 text-[var(--color-success)]" />
              ) : (
                <Circle className="mt-0.5 h-4 w-4 text-[var(--color-text-tertiary)]" />
              )}
              <div>
                <p className={`text-sm font-medium ${item.done ? "text-[var(--color-text)]" : "text-[var(--color-text-secondary)]"}`}>
                  {item.label}
                </p>
                <p className="mt-1 text-xs text-[var(--color-text-tertiary)]">{item.detail}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
