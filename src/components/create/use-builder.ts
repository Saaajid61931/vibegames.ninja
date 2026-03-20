"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import type { Session } from "next-auth"
import { useRouter, useSearchParams } from "next/navigation"
import type { GamePlayerHandle } from "@/components/games/game-player"
import {
  builderAiSettingsAreConfigured,
  getBuilderAiProviderOption,
  getBuilderDefaultModel,
  getBuilderProviderLabel,
  normalizeBuilderAiSettings,
} from "@/lib/builder/ai-providers"
import type { BuilderAiFieldKey } from "@/lib/builder/ai-providers"
import type {
  BuilderAiConnectionResponse,
  BuilderAiProviderId,
  BuilderAiSettings,
  BuilderApplyPromptResponse,
  BuilderBusyState,
  BuilderClientQuickAction,
  BuilderClientTemplate,
  BuilderProjectDetail,
  BuilderProjectSummary,
} from "@/lib/builder/types"
import { DEFAULT_BUILDER_AI_PROVIDER_ID } from "@/lib/builder/types"

const AI_SETTINGS_STORAGE_KEY = "vibegames.builder.ai.settings"
const LEGACY_OPENROUTER_STORAGE_KEY = "vibegames.builder.openrouter.apiKey"
const LEGACY_OPENROUTER_MODEL_STORAGE_KEY = "vibegames.builder.openrouter.model"
const AUTO_DISMISS_MS = 5_000
const DEBOUNCE_MS = 400

type AiTestState = {
  status: "idle" | "testing" | "success" | "error"
  message: string
  model: string
  providerId: BuilderAiProviderId
}

async function getJson<T>(input: RequestInfo, init?: RequestInit) {
  const res = await fetch(input, init)
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.error || "Request failed")
  return data as T
}

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

function getResolvedModel(settings: BuilderAiSettings) {
  return settings.model?.trim() || getBuilderDefaultModel(settings.providerId)
}

function createIdleAiTestState(settings: BuilderAiSettings): AiTestState {
  return {
    status: "idle",
    message: "",
    model: getResolvedModel(settings),
    providerId: settings.providerId,
  }
}

function getPersistableAiSettings(settings: BuilderAiSettings) {
  return normalizeBuilderAiSettings(settings)
}

export function useBuilder(session: Session) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const playerRef = useRef<GamePlayerHandle | null>(null)

  const [templates, setTemplates] = useState<BuilderClientTemplate[]>([])
  const [quickActions, setQuickActions] = useState<BuilderClientQuickAction[]>([])
  const [projects, setProjects] = useState<BuilderProjectSummary[]>([])
  const [project, setProject] = useState<BuilderProjectDetail | null>(null)

  const [prompt, setPrompt] = useState("")
  const [scratchPrompt, setScratchPrompt] = useState("")
  const [aiSettings, setAiSettings] = useState<BuilderAiSettings>(() =>
    normalizeBuilderAiSettings({ providerId: DEFAULT_BUILDER_AI_PROVIDER_ID }),
  )
  const [aiTestState, setAiTestState] = useState<AiTestState>(() =>
    createIdleAiTestState(normalizeBuilderAiSettings({ providerId: DEFAULT_BUILDER_AI_PROVIDER_ID })),
  )

  const [busy, setBusy] = useState<BuilderBusyState>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [info, setInfo] = useState("")

  const [captureStatus, setCaptureStatus] = useState("")
  const [capturedThumbnail, setCapturedThumbnail] = useState<string | null>(null)
  const [previewNonce, setPreviewNonce] = useState(0)

  const initRef = useRef(false)
  const initialProjectIdRef = useRef(searchParams.get("project"))
  const aiSettingsLoadedRef = useRef(false)
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const normalizedAiSettings = useMemo(() => normalizeBuilderAiSettings(aiSettings), [aiSettings])

  const activeAiProvider = useMemo(
    () => getBuilderAiProviderOption(normalizedAiSettings.providerId),
    [normalizedAiSettings.providerId],
  )

  const externalAiConfigured = useMemo(
    () =>
      normalizedAiSettings.providerId !== "local" &&
      builderAiSettingsAreConfigured(normalizedAiSettings),
    [normalizedAiSettings],
  )

  const activeTemplate = useMemo(
    () => templates.find((t) => t.key === project?.templateKey) ?? null,
    [project?.templateKey, templates],
  )

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(AI_SETTINGS_STORAGE_KEY)
      if (saved) {
        const parsed = JSON.parse(saved) as Partial<BuilderAiSettings>
        setAiSettings(normalizeBuilderAiSettings(parsed))
      } else {
        const legacyKey = window.localStorage.getItem(LEGACY_OPENROUTER_STORAGE_KEY)
        const legacyModel = window.localStorage.getItem(LEGACY_OPENROUTER_MODEL_STORAGE_KEY)
        if (legacyKey || legacyModel) {
          setAiSettings(
            normalizeBuilderAiSettings({
              providerId: "openrouter",
              apiKey: legacyKey || undefined,
              model: legacyModel || undefined,
            }),
          )
        }
      }
    } catch {
      setAiSettings(normalizeBuilderAiSettings({ providerId: DEFAULT_BUILDER_AI_PROVIDER_ID }))
    } finally {
      aiSettingsLoadedRef.current = true
    }
  }, [])

  useEffect(() => {
    if (!aiSettingsLoadedRef.current) return

    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current)
    debounceTimerRef.current = setTimeout(() => {
      const persisted = getPersistableAiSettings(normalizedAiSettings)
      window.localStorage.setItem(AI_SETTINGS_STORAGE_KEY, JSON.stringify(persisted))
      window.localStorage.removeItem(LEGACY_OPENROUTER_STORAGE_KEY)
      window.localStorage.removeItem(LEGACY_OPENROUTER_MODEL_STORAGE_KEY)
    }, DEBOUNCE_MS)

    return () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current)
    }
  }, [normalizedAiSettings])

  useEffect(() => {
    setAiTestState((prev) => {
      const nextIdleState = createIdleAiTestState(normalizedAiSettings)
      if (
        prev.status === "idle" &&
        !prev.message &&
        prev.providerId === nextIdleState.providerId &&
        prev.model === nextIdleState.model
      ) {
        return prev
      }

      return nextIdleState
    })
  }, [normalizedAiSettings])

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

  const loadProject = useCallback(
    async (id: string) => {
      try {
        const data = await getJson<{ project: BuilderProjectDetail }>(`/api/builder/projects/${id}`)
        setProject(data.project)
        router.replace(`/create?project=${id}`)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load project")
      }
    },
    [router],
  )

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

  const setAiProviderId = useCallback((providerId: BuilderAiProviderId) => {
    setAiSettings((prev) =>
      normalizeBuilderAiSettings({
        ...prev,
        providerId,
        model:
          providerId === "local"
            ? null
            : prev.providerId === providerId
              ? prev.model
              : getBuilderDefaultModel(providerId) || prev.model,
      }),
    )
  }, [])

  const updateAiSetting = useCallback((field: BuilderAiFieldKey, value: string) => {
    setAiSettings((prev) =>
      normalizeBuilderAiSettings({
        ...prev,
        [field]: value,
      }),
    )
  }, [])

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
        if (data.note) setInfo(data.note)
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

    const settings = normalizeBuilderAiSettings(aiSettings)
    const providerLabel = getBuilderProviderLabel(settings.providerId)
    const resolvedModel = getResolvedModel(settings)

    setBusy({ type: "creating-from-scratch" })
    setError("")
    setInfo("")

    try {
      const data = await getJson<{ project: BuilderProjectDetail; note?: string }>(
        "/api/builder/projects",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            prompt: concept,
            aiSettings: settings,
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

      if (settings.providerId !== "local") {
        if (data.note?.toLowerCase().includes("local generator instead")) {
          setAiTestState({
            status: "error",
            message: data.note,
            model: resolvedModel,
            providerId: settings.providerId,
          })
        } else {
          setAiTestState({
            status: "success",
            message: `Last draft creation succeeded with ${providerLabel}.`,
            model: resolvedModel,
            providerId: settings.providerId,
          })
        }
      }

      setInfo(data.note || "Created a first playable draft from your concept.")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate project")
    } finally {
      setBusy(null)
    }
  }, [aiSettings, router, scratchPrompt, upsertProjectInList])

  const applyPrompt = useCallback(
    async (actionKey?: string) => {
      if (!project || (!prompt.trim() && !actionKey)) return
      setBusy(actionKey ? { type: "prompting-action", actionKey } : { type: "prompting" })
      setError("")
      setInfo("")

      try {
        const data = await getJson<BuilderApplyPromptResponse>(
          `/api/builder/projects/${project.id}/messages`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              prompt:
                prompt.trim() ||
                quickActions.find((action) => action.key === actionKey)?.label ||
                "Quick action",
              actionKey,
              aiSettings: normalizeBuilderAiSettings(aiSettings),
            }),
          },
        )

        setProject(data.project)
        setPrompt("")
        setPreviewNonce((n) => n + 1)
        upsertProjectInList(data.project)

        if (data.provider.type !== "local" && data.provider.model) {
          const providerLabel = data.provider.label || getBuilderProviderLabel(data.provider.type)
          setAiTestState({
            status: "success",
            message: `Last generation succeeded with ${providerLabel}.`,
            model: data.provider.model,
            providerId: data.provider.type,
          })
          setInfo(`Prompt applied with ${providerLabel} model ${data.provider.model}.`)
        } else if (data.provider.fallbackFrom) {
          setAiTestState({
            status: "error",
            message:
              data.provider.message ||
              "The external AI provider was unavailable, so the local builder handled this prompt instead.",
            model:
              data.provider.model ||
              getResolvedModel(normalizeBuilderAiSettings({ ...aiSettings, providerId: data.provider.fallbackFrom })),
            providerId: data.provider.fallbackFrom,
          })
          setInfo(
            data.provider.message ||
              "The external AI provider was unavailable, so the local builder handled this prompt instead.",
          )
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to update project")
      } finally {
        setBusy(null)
      }
    },
    [aiSettings, project, prompt, quickActions, upsertProjectInList],
  )

  const testAiProvider = useCallback(async () => {
    const settings = normalizeBuilderAiSettings(aiSettings)
    const provider = getBuilderAiProviderOption(settings.providerId)
    const resolvedModel = getResolvedModel(settings)

    if (settings.providerId !== "local" && !builderAiSettingsAreConfigured(settings)) {
      setAiTestState({
        status: "error",
        message: `Complete the ${provider.label} setup first.`,
        model: resolvedModel,
        providerId: settings.providerId,
      })
      return
    }

    setAiTestState({
      status: "testing",
      message:
        settings.providerId === "local"
          ? "Checking the local builder..."
          : `Testing ${provider.label} connection...`,
      model: resolvedModel,
      providerId: settings.providerId,
    })

    try {
      const data = await getJson<BuilderAiConnectionResponse>("/api/builder/ai/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          aiSettings: settings,
        }),
      })

      setAiTestState({
        status: "success",
        message: data.message,
        model: data.model,
        providerId: data.providerId,
      })
    } catch (err) {
      setAiTestState({
        status: "error",
        message: err instanceof Error ? err.message : "AI provider test failed",
        model: resolvedModel,
        providerId: settings.providerId,
      })
    }
  }, [aiSettings])

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
  }, [capturedThumbnail, project, upsertProjectInList])

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

  return {
    session,
    templates,
    quickActions,
    projects,
    project,
    activeTemplate,
    activeAiProvider,
    externalAiConfigured,
    prompt,
    setPrompt,
    scratchPrompt,
    setScratchPrompt,
    aiSettings: normalizedAiSettings,
    setAiProviderId,
    updateAiSetting,
    aiTestState,
    testAiProvider,
    busy,
    loading,
    error,
    info,
    setError,
    setInfo,
    playerRef,
    previewNonce,
    restartPreview,
    enterFullscreen,
    captureStatus,
    setCaptureStatus,
    capturedThumbnail,
    setCapturedThumbnail,
    startCapture,
    loadProject,
    createProject,
    createProjectFromScratch,
    applyPrompt,
    restoreRevision,
    publishProject,
  }
}
