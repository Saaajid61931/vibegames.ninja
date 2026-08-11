"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Trash2, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import { useToast } from "@/components/ui/toast"

interface DeleteGameButtonProps {
  gameId: string
  gameTitle: string
}

export function DeleteGameButton({ gameId, gameTitle }: DeleteGameButtonProps) {
  const [deleting, setDeleting] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const router = useRouter()
  const showToast = useToast()

  const handleDelete = async () => {
    setDeleting(true)
    try {
      const res = await fetch(`/api/games/${gameId}`, {
        method: "DELETE",
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || "Failed to delete game")
      }

      showToast({
        title: "Game deleted",
        description: `“${gameTitle}” and its related data were removed.`,
        tone: "success",
      })
      router.push("/games")
      router.refresh()
    } catch (error) {
      console.error("Delete game failed:", error)
      showToast({
        title: "Delete failed",
        description: error instanceof Error ? error.message : "Failed to delete game.",
        tone: "error",
      })
    } finally {
      setDeleting(false)
    }
  }

  return (
    <>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="min-w-[108px] flex-1 gap-2 font-arcade text-danger hover:bg-danger/10 hover:text-white sm:flex-none"
        onClick={() => setConfirmOpen(true)}
        disabled={deleting}
      >
        {deleting ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Trash2 className="h-4 w-4" />
        )}
        [DELETE]
      </Button>
      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Delete this game?"
        description={`“${gameTitle}” will be permanently removed with its build, comments, favorites, and community levels. This cannot be undone.`}
        confirmLabel="Delete game"
        confirmVariant="arcade-red"
        onConfirm={handleDelete}
      />
    </>
  )
}
