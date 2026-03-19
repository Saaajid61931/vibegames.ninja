"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import { timeAgo } from "@/lib/utils"
import type { BuilderBusyState } from "@/lib/builder/types"

interface Revision {
  id: string
  summary: string
  createdAt: string
}

interface RevisionHistoryProps {
  revisions: Revision[]
  currentRevisionId: string | undefined
  busy: BuilderBusyState
  onRestore: (revisionId: string) => void
}

export function RevisionHistory({
  revisions,
  currentRevisionId,
  busy,
  onRestore,
}: RevisionHistoryProps) {
  // fix #8: confirmation dialog before restoring
  const [pendingRestore, setPendingRestore] = useState<string | null>(null)

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Revision History</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {revisions.length === 0 ? (
            <p className="text-sm text-[var(--color-text-secondary)]">No revisions yet.</p>
          ) : (
            revisions.map((rev) => {
              const isCurrent = currentRevisionId === rev.id
              const isRestoring = busy?.type === "restoring" && busy.revisionId === rev.id

              return (
                <div
                  key={rev.id}
                  className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-3"
                >
                  <p className="text-sm text-[var(--color-text)]">{rev.summary}</p>
                  <p className="mt-1 text-xs text-[var(--color-text-secondary)]">
                    {timeAgo(new Date(rev.createdAt))}
                  </p>
                  <Button
                    size="sm"
                    variant="outline"
                    className="mt-3"
                    disabled={isCurrent || isRestoring}
                    onClick={() => setPendingRestore(rev.id)}
                  >
                    {isCurrent ? "Current" : isRestoring ? "Restoring..." : "Restore"}
                  </Button>
                </div>
              )
            })
          )}
        </CardContent>
      </Card>

      <ConfirmDialog
        open={pendingRestore !== null}
        onOpenChange={(open) => {
          if (!open) setPendingRestore(null)
        }}
        title="Restore revision?"
        description="This will roll back to the selected revision. You can always switch again later."
        confirmLabel="Restore"
        onConfirm={() => {
          if (pendingRestore) onRestore(pendingRestore)
        }}
      />
    </>
  )
}
