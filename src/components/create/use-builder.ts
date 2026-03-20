"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import type { Session } from "next-auth"
import { useRouter, useSearchParams } from "next/navigation"
import type { GamePlayerHandle } from "@/components/games/game-player"
import type {
  BuilderApplyPromptResponse,
  BuilderBusyState,
  BuilderClientQuickAction,
  BuilderOpenRouterConnectionResponse,
  BuilderClientTemplate,
  BuilderProjectDetail,
  BuilderProjectSummary,
} from "@/lib/builder/types"
import { DEFAULT_BUILDER_OPENROUTER_MODEL } from "@/lib/builder/types"

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const OPENROUTER_STORAGE_KEY = "vibegames.builder.openrouter.apiKey"
const OPENROUTER_MODEL_STORAGE_KEY = "vibegames.builder.openrouter.model"
const AUTO_DISMISS_MS = 5_000
const DEBOUNCE_MS = 400

type OpenRouterTestState = {
  status: "idle" | "testing" | "success" | "error"
  message: string
  model: string
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

async function getJson<T>(input: RequestInfo, init?: RequestInit) {
  const res = await fetch(input, init)
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.error || "Request failed")
  return data as T
}

/** Convert a full project detail into a lightweight sidebar summary. */
function toSummary(detail: BuilderProjectDetail): BuilderProjectSummary {
  return {
    id: detail.id,
    title: detail.title,
    description: detail.description,
    templateKey: detail.templateKey,
    status: detail.status,
    tags: detail.tags,
    supportsMobile: detail.supportsMobile,
    mobileOrientation: detail.mobileOrientation,
    updatedAt: new Date().toISOString(),
    currentRevision: detail.currentRevision
      ? {
          id: detail.currentRevision.id,
          summary: detail.currentRevision.summary,
          previewPath: detail.currentRevision.previewPath,
        }
      : null,
    publishedGame: detail.publishedGame,
  }
}

/* ------------------------------------------------------------------ */
/*  Hook                                                               */
/* ------------------------------------------------------------------ */

export function useBuilder(session: Session) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const playerRef = useRef<GamePlayerHandle | null>(null)

  // ---- Data state ----
  const [templates, setTemplates] = useState<BuilderClientTemplate[]>([])
  const [quickActions, setQuickActions] = useState<BuilderClientQuickAction[]>([])
  const [projects, setProjects] = useState<BuilderProjectSummary[]>([])
  const [project, setProject] = useState<BuilderProjectDetail | null>(null)

  // ---- Form state ----
  const [prompt, setPrompt] = useState("")
  const [scratchPrompt, setScratchPrompt] = useState("")
  const [openRouterApiKey, setOpenRouterApiKey] = useState("")
  const [openRouterModel, setOpenRouterModel] = useState("")
  const [openRouterTestState, setOpenRouterTestState] = useState<OpenRouterTestState>({
    status: "idle",
    message: "",
    model: DEFAULT_BUILDER_OPENROUTER_MODEL,
  })

  // ---- Busy / loading / feedback ---- (fix #7: discriminated union)
  const [busy, setBusy] = useState<BuilderBusyState>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [info, setInfo] = useState("")

  // ---- Preview / capture ----
  const [captureStatus, setCaptureStatus] = useState("")
  const [capturedThumbnail, setCapturedThumbnail] = useState<string | null>(null)
  const [previewNonce, setPreviewNonce] = useState(0)

  // ---- Refs ---- (fix #9: initRef prevents searchParams re-render loop)
  const initRef = useRef(false)
  const initialProjectIdRef = useRef(searchParams.get("project"))
  const openRouterSettingsLoadedRef = useRef(false)
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const activeTemplate = useMemo(
    () => templates.find((t) => t.key === project?.templateKey) ?? null,
    [project?.templateKey, templates],
  )

  /* ------ Load OpenRouter key from localStorage (fix #5: no typeof window guard) ------ */

  useEffect(() => {
    const savedKey = window.localStorage.getItem(OPENROUTER_STORAGE_KEY)
    if (savedKey) setOpenRouterApiKey(savedKey)
    const savedModel = window.localStorage.getItem(OPENROUTER_MODEL_STORAGE_KEY)
    if (savedModel) setOpenRouterModel(savedModel)
    openRouterSettingsLoadedRef.current = true
  }, [])

  /* ------ Persist OpenRouter key with debounce (fix #13) ------ */

  useEffect(() => {
    if (!openRouterSettingsLoadedRef.current) return

    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current)
    debounceTimerRef.current = setTimeout(() => {
      const trimmedKey = openRouterApiKey.trim()
      const trimmedModel = openRouterModel.trim()

      if (trimmedKey) {
        window.localStorage.setItem(OPENROUTER_STORAGE_KEY, trimmedKey)
      } else {
        window.localStorage.removeItem(OPENROUTER_STORAGE_KEY)
      }

      if (trimmedModel && trimmedModel !== DEFAULT_BUILDER_OPENROUTER_MODEL) {
        window.localStorage.setItem(OPENROUTER_MODEL_STORAGE_KEY, trimmedModel)
      } else {
        window.localStorage.removeItem(OPENROUTER_MODEL_STORAGE_KEY)
      }
    }, DEBOUNCE_MS)

    return () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current)
    }
  }, [openRouterApiKey, openRouterModel])

  useEffect(() => {
    setOpenRouterTestState((prev) => {
      if (prev.status === "idle" && !prev.message) {
        return prev
      }

      return {
        status: "idle",
        message: "",
        model: openRouterModel.trim() || DEFAULT_BUILDER_OPENROUTER_MODEL,
      }
    })
  }, [openRouterApiKey, openRouterModel])

  /* ------ Auto-dismiss error / info (fix #3) ------ */

  useEffect(() => {
    if (!error) return
    const timer = setTimeout(() => setError(""), AUTO_DISMISS_MS)
    return () => clearTimeout(timer)
  }, [error])

  useEffect(() => {
    if (!info) return
    const timer = setTimeout(() => setInfo(""), AUTO_DISMISS_MS)
    return () => clearTimeout(timer)
  }, [info])

  /* ------ Update sidebar list locally (fix #14: no redundant refreshProjects) ------ */

  const upsertProjectInList = useCallback((detail: BuilderProjectDetail) => {
    setProjects((prev) => {
      const summary = toSummary(detail)
      const idx = prev.findIndex((p) => p.id === detail.id)
      if (idx >= 0) {
        const next = [...prev]
        next[idx] = summary
        return next
      }
      return [summary, ...prev]
    })
  }, [])

  /* ------ Load a single project ------ */

  const loadProject = useCallback(
    async (id: string) => {
      try {
        const data = await getJson<{ project: BuilderProjectDetail }>(
          `/api/builder/projects/${id}`,
        )
        setProject(data.project)
        router.replace(`/create?project=${id}`)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load project")
      }
    },
    [router],
  )

  /* ------ Initial data load (fix #9: initRef guard) ------ */

  useEffect(() => {
    if (initRef.current) return
    initRef.current = true
    let cancelled = false
    ;(async () => {
      try {
        setLoading(true)
        const [templateData, projectData] = await Promise.all([
          getJson<{ templates: BuilderClientTemplate[]; quickActions: BuilderClientQuickAction[] }>(
            "/api/builder/templates",
          ),
          getJson<{ projects: BuilderProjectSummary[] }>("/api/builder/projects"),
        ])
        if (cancelled) return
        setTemplates(templateData.templates)
        setQuickActions(templateData.quickActions)
        setProjects(projectData.projects)

        const wanted = initialProjectIdRef.current || projectData.projects[0]?.id
        if (wanted) await loadProject(wanted)
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Failed to load builder")
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [loadProject])

  /* ------ Actions (fix #6: all wrapped in useCallback) ------ */

  const createProject = useCallback(
    async (templateKey: string) => {
      setBusy({ type: "creating", templateKey })
      setError("")
      try {
        const data = await getJson<{ project: BuilderProjectDetail; note?: string }>(
          "/api/builder/projects",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ templateKey }),
          },
        )
        setProject(data.project)
        setPrompt("")
        setScratchPrompt("")
        setCapturedThumbnail(null)
        upsertProjectInList(data.project)
        router.replace(`/create?project=${data.project.id}`)
        if (data.note) {
          setInfo(data.note)
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to create project")
      } finally {
        setBusy(null)
      }
    },
    [router, upsertProjectInList],
  )

  const createProjectFromScratch = useCallback(async () => {
    const concept = scratchPrompt.trim()
    if (concept.length < 8) {
      setError("Describe the game idea in a bit more detail first.")
      return
    }

    setBusy({ type: "creating-from-scratch" })
    setError("")
    setInfo("")

    try {
      const headers: HeadersInit = { "Content-Type": "application/json" }
      const trimmedKey = openRouterApiKey.trim()
      const trimmedModel = openRouterModel.trim()

      if (trimmedKey) {
        headers["x-openrouter-api-key"] = trimmedKey
      }

      const data = await getJson<{ project: BuilderProjectDetail; note?: string }>(
        "/api/builder/projects",
        {
          method: "POST",
          headers,
          body: JSON.stringify({
            prompt: concept,
            openRouterModel: trimmedModel || undefined,
          }),
        },
      )

      setProject(data.project)
      setPrompt("")
      setScratchPrompt("")
      setCapturedThumbnail(null)
      setPreviewNonce((n) => n + 1)
      upsertProjectInList(data.project)
      router.replace(`/create?project=${data.project.id}`)
      if (trimmedKey) {
        if (data.note?.includes("OpenRouter model")) {
          setOpenRouterTestState({
            status: "success",
            message: `Last draft creation succeeded with ${trimmedModel || DEFAULT_BUILDER_OPENROUTER_MODEL}.`,
            model: trimmedModel || DEFAULT_BUILDER_OPENROUTER_MODEL,
          })
        } else if (data.note?.includes("local generator instead")) {
          setOpenRouterTestState({
            status: "error",
            message: data.note,
            model: trimmedModel || DEFAULT_BUILDER_OPENROUTER_MODEL,
          })
        }
      }
      setInfo(data.note || "Created a first playable draft from your concept.")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate project")
    } finally {
      setBusy(null)
    }
  }, [scratchPrompt, openRouterApiKey, openRouterModel, router, upsertProjectInList])

  const applyPrompt = useCallback(
    async (actionKey?: string) => {
      if (!project || (!prompt.trim() && !actionKey)) return
      setBusy(actionKey ? { type: "prompting-action", actionKey } : { type: "prompting" })
      setError("")
      setInfo("")
      try {
        const headers: HeadersInit = { "Content-Type": "application/json" }
        const trimmedKey = openRouterApiKey.trim()
        const trimmedModel = openRouterModel.trim()
        if (trimmedKey) headers["x-openrouter-api-key"] = trimmedKey

        const data = await getJson<BuilderApplyPromptResponse>(
          `/api/builder/projects/${project.id}/messages`,
          {
            method: "POST",
            headers,
            body: JSON.stringify({
              prompt:
                prompt.trim() ||
                quickActions.find((a) => a.key === actionKey)?.label ||
                "Quick action",
              actionKey,
              openRouterModel: trimmedModel || undefined,
            }),
          },
        )
        setProject(data.project)
        setPrompt("")
        setPreviewNonce((n) => n + 1)
        upsertProjectInList(data.project)

        if (data.provider.type === "openrouter" && data.provider.model) {
          setOpenRouterTestState({
            status: "success",
            message: `Last generation succeeded with ${data.provider.model}.`,
            model: data.provider.model,
          })
          setInfo(`Prompt applied with OpenRouter model ${data.provider.model}.`)
        } else if (data.provider.fallbackFrom === "openrouter") {
          setOpenRouterTestState({
            status: "error",
            message:
              data.provider.message ||
              "OpenRouter was unavailable, so the local builder handled this prompt instead.",
            model: data.provider.model || trimmedModel || DEFAULT_BUILDER_OPENROUTER_MODEL,
          })
          setInfo(
            data.provider.message ||
              "OpenRouter was unavailable, so the local builder handled this prompt instead.",
          )
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to update project")
      } finally {
        setBusy(null)
      }
    },
    [project, prompt, openRouterApiKey, openRouterModel, quickActions, upsertProjectInList],
  )

  const testOpenRouter = useCallback(async () => {
    const trimmedKey = openRouterApiKey.trim()
    const trimmedModel = openRouterModel.trim() || DEFAULT_BUILDER_OPENROUTER_MODEL

    if (!trimmedKey) {
      setOpenRouterTestState({
        status: "error",
        message: "Add your OpenRouter API key first.",
        model: trimmedModel,
      })
      return
    }

    setOpenRouterTestState({
      status: "testing",
      message: "Testing OpenRouter connection...",
      model: trimmedModel,
    })

    try {
      const data = await getJson<BuilderOpenRouterConnectionResponse>(
        "/api/builder/openrouter/test",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-openrouter-api-key": trimmedKey,
          },
          body: JSON.stringify({
            openRouterModel: openRouterModel.trim() || undefined,
          }),
        },
      )

      setOpenRouterTestState({
        status: "success",
        message: data.message,
        model: data.model,
      })
    } catch (err) {
      setOpenRouterTestState({
        status: "error",
        message: err instanceof Error ? err.message : "OpenRouter test failed",
        model: trimmedModel,
      })
    }
  }, [openRouterApiKey, openRouterModel])

  const restoreRevision = useCallback(
    async (revisionId: string) => {
      if (!project) return
      setBusy({ type: "restoring", revisionId })
      try {
        const data = await getJson<{ project: BuilderProjectDetail }>(
          `/api/builder/projects/${project.id}/restore`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ revisionId }),
          },
        )
        setProject(data.project)
        setPreviewNonce((n) => n + 1)
        upsertProjectInList(data.project)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to restore revision")
      } finally {
        setBusy(null)
      }
    },
    [project, upsertProjectInList],
  )

  const publishProject = useCallback(async () => {
    if (!project) return
    setBusy({ type: "publishing" })
    try {
      const data = await getJson<{ project: BuilderProjectDetail }>(
        `/api/builder/projects/${project.id}/publish`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ thumbnail: capturedThumbnail || undefined }),
        },
      )
      setProject(data.project)
      upsertProjectInList(data.project)
      setInfo("Current revision published. Your live game page is ready.")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to publish project")
    } finally {
      setBusy(null)
    }
  }, [project, capturedThumbnail, upsertProjectInList])

  const restartPreview = useCallback(() => {
    setPreviewNonce((n) => n + 1)
  }, [])

  const startCapture = useCallback(() => {
    setCaptureStatus("Capturing screenshots from the live preview...")
    void playerRef.current?.startAutoThumbnailCapture().catch(() => undefined)
  }, [])

  const enterFullscreen = useCallback(() => {
    void playerRef.current?.enterFullscreen()
  }, [])

  /* ------ Public API ------ */

  return {
    // Auth
    session,
    // Data
    templates,
    quickActions,
    projects,
    project,
    activeTemplate,
    // Form state
    prompt,
    setPrompt,
    scratchPrompt,
    setScratchPrompt,
    openRouterApiKey,
    setOpenRouterApiKey,
    openRouterModel,
    setOpenRouterModel,
    openRouterTestState,
    testOpenRouter,
    // Busy / loading / feedback
    busy,
    loading,
    error,
    info,
    setError,
    setInfo,
    // Preview
    playerRef,
    previewNonce,
    restartPreview,
    enterFullscreen,
    // Capture
    captureStatus,
    setCaptureStatus,
    capturedThumbnail,
    setCapturedThumbnail,
    startCapture,
    // Actions
    loadProject,
    createProject,
    createProjectFromScratch,
    applyPrompt,
    restoreRevision,
    publishProject,
  }
}

export type UseBuilderReturn = ReturnType<typeof useBuilder>
