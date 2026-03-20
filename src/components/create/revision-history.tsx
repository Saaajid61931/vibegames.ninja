"use client"

import { useState } from "react"
import { Clock, RotateCcw } from "lucide-react"
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
  const [pendingRestore, setPendingRestore] = useState<string | null>(null)

  if (revisions.length === 0) {
    return (
      <p className="px-2 py-3 font-pixel text-[9px] text-[#6b7fa3]">
        NO REVISIONS YET. GENERATE SOMETHING FIRST.
      </p>
    )
  }

  return (
    <>
      <div className="space-y-2">
        {revisions.map((rev) => {
          const isCurrent = currentRevisionId === rev.id
          const isRestoring = busy?.type === "restoring" && busy.revisionId === rev.id

          return (
            <div
              key={rev.id}
              className={`group flex items-start gap-3 border-2 p-2.5 transition-all ${
                isCurrent
                  ? "bg-[#1a1a2e] border-[#ffff00] shadow-[3px_3px_0_#000]"
                  : "border-[#4a4a6a] hover:border-[#6b7fa3] bg-transparent"
              }`}
            >
              <Clock className="mt-0.5 h-3 w-3 shrink-0 text-[#6b7fa3]" />
              <div className="min-w-0 flex-1">
                <p className={`truncate font-pixel text-[10px] ${isCurrent ? "text-white" : "text-[#d7e2ff]"}`}>{rev.summary.toUpperCase()}</p>
                <p className="mt-0.5 font-pixel text-[8px] text-[#6b7fa3]">{timeAgo(new Date(rev.createdAt)).toUpperCase()}</p>
              </div>
              {!isCurrent && (
                <button
                  type="button"
                  className="shrink-0 border border-[#4a4a6a] p-1 text-[#6b7fa3] opacity-0 transition-opacity hover:border-[#0080ff] hover:text-[#0080ff] group-hover:opacity-100 cursor-pointer disabled:opacity-30"
                  disabled={!!busy}
                  onClick={() => setPendingRestore(rev.id)}
                  title="Restore this revision"
                >
                  {isRestoring ? (
                    <span className="font-pixel text-[8px]">...</span>
                  ) : (
                    <RotateCcw className="h-3 w-3" />
                  )}
                </button>
              )}
              {isCurrent && (
                <span className="shrink-0 font-pixel text-[8px] font-bold text-[#ffff00]">
                  ACTIVE
                </span>
              )}
            </div>
          )
        })}
      </div>


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
