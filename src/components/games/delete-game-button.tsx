"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Trash2, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"

interface DeleteGameButtonProps {
  gameId: string
  gameTitle: string
}

export function DeleteGameButton({ gameId, gameTitle }: DeleteGameButtonProps) {
  const [deleting, setDeleting] = useState(false)
  const router = useRouter()

  const handleDelete = async () => {
    if (!window.confirm(`Are you sure you want to delete "${gameTitle}"? This will permanently remove the game build, comments, favorites, and all community levels. This cannot be undone.`)) {
      return
    }

    setDeleting(true)
    try {
      const res = await fetch(`/api/games/${gameId}`, {
        method: "DELETE",
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || "Failed to delete game")
      }

      alert("Game deleted successfully.")
      router.push("/games")
      router.refresh()
    } catch (error) {
      console.error("Delete game failed:", error)
      alert(error instanceof Error ? error.message : "Failed to delete game")
    } finally {
      setDeleting(false)
    }
  }

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      className="gap-2 text-[#ff6b6b] hover:text-white hover:bg-[#ff6b6b]/10 font-arcade flex-1 sm:flex-none min-w-[108px]"
      onClick={handleDelete}
      disabled={deleting}
    >
      {deleting ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Trash2 className="h-4 w-4" />
      )}
      [DELETE]
    </Button>
  )
}
