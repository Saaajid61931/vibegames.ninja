"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { AlertTriangle, CheckCircle2, Clock3, Loader2, Save } from "lucide-react"
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

type RuntimeStatus = {
  enterEditModeBound: boolean
  editModeEntered: boolean
  loadLevelBound: boolean
  loadLevelSeen: boolean
  requestSaveBound: boolean
  requestSaveSeen: boolean
  savePayloadSeen: boolean
  saveThumbnailSeen: boolean
}

const INITIAL_RUNTIME_STATUS: RuntimeStatus = {
  enterEditModeBound: false,
  editModeEntered: false,
  loadLevelBound: false,
  loadLevelSeen: false,
  requestSaveBound: false,
  requestSaveSeen: false,
  savePayloadSeen: false,
  saveThumbnailSeen: false,
}

function isStructuredLevelData(data: unknown): boolean {
  if (Array.isArray(data)) {
    return true
  }

  return typeof data === "object" && data !== null
}

function summarizeLevelData(data: unknown): string {
  if (Array.isArray(data)) {
    return `Array with ${data.length} item${data.length === 1 ? "" : "s"}`
  }

  if (typeof data === "string") {
    return "String payload detected (valid JSON string will be parsed, but object/array is preferred)"
  }

  if (typeof data === "object" && data !== null) {
    const keys = Object.keys(data as Record<string, unknown>)
    return keys.length > 0
      ? `Object keys: ${keys.slice(0, 5).join(", ")}${keys.length > 5 ? ", ..." : ""}`
      : "Empty object payload"
  }

  return "No structured level data received yet"
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
  const [hint, setHint] = useState("")
  const [ready, setReady] = useState(false)
  const [runtimeStatus, setRuntimeStatus] = useState<RuntimeStatus>(INITIAL_RUNTIME_STATUS)

  const readyRef = useRef(false)
  const runtimeStatusRef = useRef<RuntimeStatus>(INITIAL_RUNTIME_STATUS)

  const levelData = useMemo(() => initialLevel?.data, [initialLevel?.data])
  const payloadSummary = summarizeLevelData(pendingSave?.data)
  const payloadLooksStructured = typeof pendingSave?.data !== "undefined" && (
    isStructuredLevelData(pendingSave.data) || typeof pendingSave.data === "string"
  )

  const patchRuntimeStatus = useCallback((patch: Partial<RuntimeStatus>) => {
    runtimeStatusRef.current = {
      ...runtimeStatusRef.current,
      ...patch,
    }
    setRuntimeStatus(runtimeStatusRef.current)
  }, [])

  useEffect(() => {
    if (ready) {
      setHint("")
      return
    }

    const timeoutId = window.setTimeout(() => {
      setHint("VG.notifyReady() has not been detected yet. If this stays stuck, make sure your game binds the SDK hooks and calls VG.notifyReady() once startup is complete.")
    }, 6000)

    return () => window.clearTimeout(timeoutId)
  }, [ready])

  const saveLevel = async (payload: SavePayload) => {
    const levelName = name.trim() || payload.name?.trim() || ""
    const levelDescription = description.trim() || payload.description?.trim() || undefined

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

    if (!isStructuredLevelData(normalizedData)) {
      setError("Level data must be an object or array. Update the game to export structured level data.")
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

  const requestInGameSave = () => {
    setError("")
    setHint("")
    setRequesting(true)
    patchRuntimeStatus({ requestSaveSeen: false, savePayloadSeen: false, saveThumbnailSeen: false })
    setRequestSaveNonce((prev) => prev + 1)

    window.setTimeout(() => {
      setRequesting((isStillRequesting) => {
        if (!isStillRequesting) {
          return isStillRequesting
        }

        const currentStatus = runtimeStatusRef.current

        if (!readyRef.current) {
          setError("The game never announced VG.notifyReady(). Bind the SDK hooks and call VG.notifyReady() after startup completes.")
        } else if (!currentStatus.requestSaveBound) {
          setError("The game did not register VG.onRequestSave(). Add that hook so the platform can ask the editor for a level payload.")
        } else if (!currentStatus.requestSaveSeen) {
          setError("The save request was sent, but the game did not acknowledge it. Make sure the SDK hooks are bound in the active game runtime.")
        } else {
          setError("The game received the save request but never called VG.saveLevel(...). Return structured data, plus thumbnail when possible.")
        }

        return false
      })
    }, 5000)
  }

  const saveMetadataOnly = () => {
    if (typeof pendingSave?.data === "undefined") {
      setError("No previous level payload is available yet. Request a fresh payload from the game first.")
      return
    }

    void saveLevel(pendingSave)
  }

  const statusCards = [
    {
      label: "VG ready",
      ok: ready,
      pendingLabel: "Waiting for VG.notifyReady()",
      successLabel: "Game reported ready",
    },
    {
      label: "Edit hook",
      ok: runtimeStatus.enterEditModeBound,
      pendingLabel: "VG.onEnterEditMode() not seen yet",
      successLabel: "Editor hook bound",
    },
    {
      label: "Editor mode",
      ok: runtimeStatus.editModeEntered,
      pendingLabel: "Waiting for editor mode signal",
      successLabel: "Editor mode entered",
    },
    {
      label: "Load hook",
      ok: runtimeStatus.loadLevelBound,
      pendingLabel: "VG.onLoadLevel() not seen yet",
      successLabel: "Load hook bound",
    },
    ...(initialLevel
      ? [{
          label: "Level load",
          ok: runtimeStatus.loadLevelSeen,
          pendingLabel: "Existing level has not been sent into the game yet",
          successLabel: "Existing level sent to the game",
        }]
      : []),
    {
      label: "Save hook",
      ok: runtimeStatus.requestSaveBound,
      pendingLabel: "VG.onRequestSave() not seen yet",
      successLabel: "Save hook bound",
    },
    {
      label: "Save payload",
      ok: runtimeStatus.savePayloadSeen && payloadLooksStructured,
      pendingLabel: runtimeStatus.savePayloadSeen ? "Payload needs object/array data" : "No VG.saveLevel payload yet",
      successLabel: runtimeStatus.saveThumbnailSeen ? "Payload and thumbnail received" : "Payload received",
    },
  ]

  return (
    <div className="space-y-4">
      <div className="border-2 border-[#4a4a6a] bg-[#11111d] p-4 sm:p-5">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="font-arcade text-[11px] text-[#ffff00]">LEVEL EDITOR WORKFLOW</p>
            <h1 className="mt-1 font-arcade text-sm text-white">Build inside the game, then save through the platform</h1>
            <p className="mt-2 font-arcade text-xs text-[#8b93a6]">
              1) wait for the SDK to go ready, 2) make sure the editor UI appears inside the game, 3) press save here to request a level payload from the game runtime.
            </p>
          </div>
          <div className="rounded border border-[#4a4a6a] bg-[#0d0d15] px-3 py-2 font-arcade text-[11px] text-[#8b93a6]">
            {initialLevel ? `Editing existing level: ${initialLevel.name}` : "Creating a new community level"}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <GamePlayer
            title={title}
            gameUrl={gameUrl}
            runtimeLabel={`${title.toLowerCase().replace(/\s+/g, "_")}.exe`}
            mode="editor"
            levelData={levelData}
            levelName={initialLevel?.name}
            levelDescription={initialLevel?.description}
            onReady={(nextReady) => {
              readyRef.current = nextReady
              setReady(nextReady)
              if (nextReady) {
                setHint("")
              }
            }}
            onEditorDiagnostic={(event) => {
              const payload = event.payload || {}
              const handlerCount = typeof payload.handlerCount === "number" ? payload.handlerCount : 0

              if (event.type === "VG_EDITOR_HOOK_BOUND") {
                if (payload.hook === "onEnterEditMode") {
                  patchRuntimeStatus({ enterEditModeBound: true })
                }
                if (payload.hook === "onLoadLevel") {
                  patchRuntimeStatus({ loadLevelBound: true })
                }
                if (payload.hook === "onRequestSave") {
                  patchRuntimeStatus({ requestSaveBound: true })
                }
                return
              }

              if (event.type === "VG_EDIT_MODE_ENTERED") {
                patchRuntimeStatus({
                  editModeEntered: true,
                  enterEditModeBound: runtimeStatusRef.current.enterEditModeBound || handlerCount > 0,
                })
                if (handlerCount === 0) {
                  setHint("The platform entered editor mode, but no VG.onEnterEditMode() handler was detected yet.")
                }
                return
              }

              if (event.type === "VG_LEVEL_LOAD_RECEIVED") {
                patchRuntimeStatus({
                  loadLevelSeen: true,
                  loadLevelBound: runtimeStatusRef.current.loadLevelBound || handlerCount > 0,
                })
                return
              }

              if (event.type === "VG_REQUEST_SAVE_RECEIVED") {
                patchRuntimeStatus({
                  requestSaveSeen: true,
                  requestSaveBound: runtimeStatusRef.current.requestSaveBound || handlerCount > 0,
                })
                if (handlerCount === 0) {
                  setHint("The save request reached the SDK, but the game has not registered VG.onRequestSave() yet.")
                }
              }
            }}
            requestSaveNonce={requestSaveNonce}
            onSaveLevel={(payload) => {
              setRequesting(false)
              setError("")
              setHint("")
              patchRuntimeStatus({
                requestSaveSeen: true,
                savePayloadSeen: typeof payload.data !== "undefined",
                saveThumbnailSeen: typeof payload.thumbnail === "string" && payload.thumbnail.startsWith("data:image/"),
              })
              setPendingSave(payload)

              if (!name.trim() && payload.name?.trim()) {
                setName(payload.name.trim())
              }
              if (!description.trim() && payload.description?.trim()) {
                setDescription(payload.description.trim())
              }

              void saveLevel(payload)
            }}
          />
        </div>

        <div className="space-y-4">
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
              onClick={requestInGameSave}
            >
              {saving || requesting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {requesting ? "REQUESTING PAYLOAD..." : "SAVING..."}
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  REQUEST + SAVE FROM GAME
                </>
              )}
            </Button>

            <Button
              type="button"
              variant="outline"
              className="w-full"
              disabled={saving || requesting || typeof pendingSave?.data === "undefined"}
              onClick={saveMetadataOnly}
            >
              Save metadata with last payload
            </Button>

            <p className="font-arcade text-[10px] text-[#8b93a6]">
              The primary button asks the game runtime for a fresh level payload. The game should answer with VG.saveLevel({`{ data, name, description, thumbnail }`}).
            </p>

            {hint && (
              <div className="border border-[#ffff00] bg-[#ffff00]/10 p-3">
                <div className="flex items-start gap-2">
                  <Clock3 className="mt-0.5 h-4 w-4 text-[#ffff00]" />
                  <p className="font-arcade text-[10px] text-[#fff2a8]">{hint}</p>
                </div>
              </div>
            )}

            {error && (
              <div className="border border-[#ff0040] bg-[#ff0040]/10 p-3">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="mt-0.5 h-4 w-4 text-[#ff0040]" />
                  <p className="font-arcade text-[10px] text-[#ffb3c0]">{error}</p>
                </div>
              </div>
            )}
          </div>

          <div className="border-2 border-[#4a4a6a] bg-[#1a1a2e] p-4">
            <h2 className="font-arcade text-xs text-[#00d1ff]">INTEGRATION CHECK</h2>
            <div className="mt-3 grid gap-2">
              {statusCards.map((item) => (
                <div key={item.label} className="flex items-center gap-3 border border-[#2e3446] bg-[#0d0d15] px-3 py-2">
                  {item.ok ? (
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-[#22c55e]" />
                  ) : (
                    <Clock3 className="h-4 w-4 shrink-0 text-[#8b93a6]" />
                  )}
                  <div className="min-w-0">
                    <p className="font-arcade text-[11px] text-white">{item.label}</p>
                    <p className="font-arcade text-[10px] text-[#8b93a6]">
                      {item.ok ? item.successLabel : item.pendingLabel}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="border-2 border-[#4a4a6a] bg-[#1a1a2e] p-4">
            <h2 className="font-arcade text-xs text-[#ffff00]">LAST PAYLOAD SNAPSHOT</h2>
            <div className="mt-3 space-y-2 font-arcade text-[10px] text-[#8b93a6]">
              <p>{payloadSummary}</p>
              <p>{runtimeStatus.saveThumbnailSeen ? "Thumbnail image received with the last save payload." : "No thumbnail received yet. The game should capture the main canvas when possible."}</p>
              {initialLevel && !runtimeStatus.loadLevelSeen && (
                <p>This editor opened with an existing level. If load never turns green, verify VG.onLoadLevel(...) is bound in the game runtime.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
