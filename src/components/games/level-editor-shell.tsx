"use client"

import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { Save, Loader2 } from "lucide-react"
import { GamePlayer } from "@/components/games/game-player"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"

interface LevelEditorShellProps {
  gameId: string
  slug: string
  title: string
  gameUrl: string
  initialLevel?: {
    id: string
    name: string
    description: string | null
    data: unknown
  } | null
}

interface SavePayload {
  name?: string
  description?: string
  data?: unknown
  thumbnail?: string
}

export function LevelEditorShell({
  gameId,
  slug,
  title,
  gameUrl,
  initialLevel,
}: LevelEditorShellProps) {
  const router = useRouter()
  const [name, setName] = useState(initialLevel?.name || "")
  const [description, setDescription] = useState(initialLevel?.description || "")
  const [pendingSave, setPendingSave] = useState<SavePayload | null>(
    initialLevel
      ? {
          name: initialLevel.name,
          description: initialLevel.description || undefined,
          data: initialLevel.data,
        }
      : null
  )
  const [saving, setSaving] = useState(false)
  const [requesting, setRequesting] = useState(false)
  const [requestSaveNonce, setRequestSaveNonce] = useState(0)
  const [error, setError] = useState("")
  const [ready, setReady] = useState(false)

  const levelData = useMemo(() => initialLevel?.data, [initialLevel?.data])

  const saveLevel = async (payload: SavePayload) => {
    const levelName = payload.name?.trim() || name.trim()
    const levelDescription = payload.description?.trim() || description.trim() || undefined

    if (!levelName) {
      setError("Add a level name before saving")
      return
    }

    if (typeof payload.data === "undefined") {
      setError("Game did not provide level data. Use VG.saveLevel({ data }) from your game.")
      return
    }

    let normalizedData: unknown = payload.data
    if (typeof normalizedData === "string") {
      try {
        normalizedData = JSON.parse(normalizedData)
      } catch {
        setError("Game returned invalid level JSON. Make sure VG.saveLevel({ data }) sends valid JSON data.")
        return
      }
    }

    if (!Array.isArray(normalizedData) && (typeof normalizedData !== "object" || normalizedData === null)) {
      setError("Level data must be an object or array. Update the game to export structured JSON data.")
      return
    }

    setSaving(true)
    setError("")
    try {
      const endpoint = initialLevel ? `/api/levels/${initialLevel.id}` : `/api/games/${gameId}/levels`
      const method = initialLevel ? "PATCH" : "POST"
      const res = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: levelName,
          description: levelDescription,
          data: normalizedData,
          thumbnail: payload.thumbnail,
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || "Failed to save level")
      }

      const levelId = data.level?.id || initialLevel?.id
      if (levelId) {
        router.push(`/play/${slug}?level=${levelId}`)
        return
      }

      router.push(`/play/${slug}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save level")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <GamePlayer
            title={title}
            gameUrl={gameUrl}
            runtimeLabel={`${title.toLowerCase().replace(/\s+/g, "_")}.exe`}
            mode="editor"
            levelData={levelData}
            onReady={setReady}
            requestSaveNonce={requestSaveNonce}
            onSaveLevel={(payload) => {
              setRequesting(false)
              setError("")
              setPendingSave(payload)
              void saveLevel(payload)
            }}
          />
        </div>

        <div className="border-2 border-[#4a4a6a] bg-[#1a1a2e] p-4 space-y-3">
          <h2 className="font-arcade text-xs text-[#ffff00]">LEVEL METADATA</h2>
          <div className="space-y-2">
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Level name" className="font-arcade" />
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Description (optional)"
              className="font-arcade"
            />
          </div>

          <Button
            type="button"
            variant="arcade"
            className="w-full"
            disabled={saving || requesting}
            onClick={() => {
              if (pendingSave?.data !== undefined) {
                void saveLevel(pendingSave)
                return
              }

              setError("")
              setRequesting(true)
              setRequestSaveNonce((prev) => prev + 1)

              window.setTimeout(() => {
                setRequesting((isRequesting) => {
                  if (!isRequesting) {
                    return isRequesting
                  }

                  setError("This game did not return level data. Integrate VG SDK and call VG.saveLevel from the game editor.")
                  return false
                })
              }, 5000)
            }}
          >
            {saving || requesting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                {requesting ? "REQUESTING DATA..." : "SAVING..."}
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                SAVE LEVEL
              </>
            )}
          </Button>

          {!ready && (
            <p className="font-arcade text-[10px] text-[#4a4a6a]">
              Tip: when level editor is enabled, VibeGames injects the VG SDK automatically. Your game should call VG.notifyReady().
            </p>
          )}

          <p className="font-arcade text-[10px] text-[#4a4a6a]">
            Your game must call VG.saveLevel with name, description, and data when the creator presses in-game save.
          </p>

          <p className="font-arcade text-[10px] text-[#4a4a6a]">
            Better integration: handle VG_REQUEST_SAVE and respond by calling VG.saveLevel with a data field.
          </p>

          {error && <p className="font-arcade text-[10px] text-[#ff0040]">{error}</p>}
        </div>
      </div>
    </div>
  )
}
