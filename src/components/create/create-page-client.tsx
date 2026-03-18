"use client"

import Link from "next/link"
import Image from "next/image"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useSession } from "next-auth/react"
import { ExternalLink, ImagePlus, Loader2, Maximize2, Rocket, RotateCcw, Sparkles, Upload, Wand2 } from "lucide-react"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { GamePlayer, type GamePlayerHandle } from "@/components/games/game-player"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { timeAgo } from "@/lib/utils"

type Template = { key: string; label: string; eyebrow: string; description: string }
type QuickAction = { key: string; label: string }
type Summary = {
  id: string
  title: string
  description: string | null
  templateKey: string
  status: string
  tags: string[]
  supportsMobile: boolean
  mobileOrientation: "BOTH" | "PORTRAIT" | "LANDSCAPE"
  updatedAt: string
  currentRevision: { id: string; summary: string; previewPath: string } | null
  publishedGame: { slug: string; title: string } | null
}
type Detail = Summary & {
  currentRevision: {
    id: string
    summary: string
    prompt: string
    previewPath: string
    config: { title: string; description: string }
  }
  revisions: Array<{ id: string; summary: string; createdAt: string }>
  messages: Array<{ id: string; role: "USER" | "ASSISTANT" | "SYSTEM"; content: string; createdAt: string }>
}

async function getJson<T>(input: RequestInfo, init?: RequestInit) {
  const res = await fetch(input, init)
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.error || "Request failed")
  return data as T
}

export function CreatePageClient() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { data: session, status } = useSession()
  const playerRef = useRef<GamePlayerHandle | null>(null)
  const [templates, setTemplates] = useState<Template[]>([])
  const [quickActions, setQuickActions] = useState<QuickAction[]>([])
  const [projects, setProjects] = useState<Summary[]>([])
  const [project, setProject] = useState<Detail | null>(null)
  const [prompt, setPrompt] = useState("")
  const [busy, setBusy] = useState("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [info, setInfo] = useState("")
  const [captureStatus, setCaptureStatus] = useState("")
  const [capturedThumbnail, setCapturedThumbnail] = useState<string | null>(null)
  const [previewNonce, setPreviewNonce] = useState(0)

  const activeTemplate = useMemo(() => templates.find((item) => item.key === project?.templateKey) || null, [project?.templateKey, templates])

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push(`/login?callbackUrl=${encodeURIComponent("/create")}`)
    }
  }, [router, status])

  async function refreshProjects() {
    const data = await getJson<{ projects: Summary[] }>("/api/builder/projects")
    setProjects(data.projects)
    return data.projects
  }

  const loadProject = useCallback(async (id: string) => {
    try {
      const data = await getJson<{ project: Detail }>(`/api/builder/projects/${id}`)
      setProject(data.project)
      router.replace(`/create?project=${id}`)
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Failed to load project")
    }
  }, [router])

  useEffect(() => {
    if (status !== "authenticated") return
    let cancelled = false
    ;(async () => {
      try {
        setLoading(true)
        const [templateData, projectData] = await Promise.all([
          getJson<{ templates: Template[]; quickActions: QuickAction[] }>("/api/builder/templates"),
          getJson<{ projects: Summary[] }>("/api/builder/projects"),
        ])
        if (cancelled) return
        setTemplates(templateData.templates)
        setQuickActions(templateData.quickActions)
        setProjects(projectData.projects)
        const wanted = searchParams.get("project") || projectData.projects[0]?.id
        if (wanted) await loadProject(wanted)
      } catch (loadError) {
        if (!cancelled) setError(loadError instanceof Error ? loadError.message : "Failed to load builder")
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [loadProject, searchParams, status])

  async function createProject(templateKey: string) {
    setBusy(`create:${templateKey}`)
    setError("")
    try {
      const data = await getJson<{ project: Detail }>("/api/builder/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ templateKey }),
      })
      setProject(data.project)
      setPrompt("")
      setCapturedThumbnail(null)
      await refreshProjects()
      router.replace(`/create?project=${data.project.id}`)
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : "Failed to create project")
    } finally {
      setBusy("")
    }
  }

  async function applyPrompt(actionKey?: string) {
    if (!project || (!prompt.trim() && !actionKey)) return
    setBusy(actionKey || "prompt")
    setError("")
    try {
      const data = await getJson<{ project: Detail }>(`/api/builder/projects/${project.id}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: prompt.trim() || quickActions.find((action) => action.key === actionKey)?.label || "Quick action",
          actionKey,
        }),
      })
      setProject(data.project)
      setPrompt("")
      setPreviewNonce((value) => value + 1)
      await refreshProjects()
    } catch (applyError) {
      setError(applyError instanceof Error ? applyError.message : "Failed to update project")
    } finally {
      setBusy("")
    }
  }

  async function restoreRevision(revisionId: string) {
    if (!project) return
    setBusy(`restore:${revisionId}`)
    try {
      const data = await getJson<{ project: Detail }>(`/api/builder/projects/${project.id}/restore`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ revisionId }),
      })
      setProject(data.project)
      setPreviewNonce((value) => value + 1)
      await refreshProjects()
    } catch (restoreError) {
      setError(restoreError instanceof Error ? restoreError.message : "Failed to restore revision")
    } finally {
      setBusy("")
    }
  }

  async function publishProject() {
    if (!project) return
    setBusy("publish")
    try {
      const data = await getJson<{ project: Detail }>(`/api/builder/projects/${project.id}/publish`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ thumbnail: capturedThumbnail || undefined }),
      })
      setProject(data.project)
      await refreshProjects()
      setInfo("Current revision published. Your live game page is ready.")
    } catch (publishError) {
      setError(publishError instanceof Error ? publishError.message : "Failed to publish project")
    } finally {
      setBusy("")
    }
  }

  if (status === "loading" || loading) {
    return <div className="min-h-screen flex items-center justify-center bg-[#0d0d15]"><Loader2 className="h-8 w-8 animate-spin text-[var(--color-primary)]" /></div>
  }

  if (!session) return null

  return (
    <div className="min-h-screen flex flex-col bg-[#0d0d15]">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-6 sm:py-8">
        <div className="mx-auto max-w-7xl">
          <div className="mb-6 rounded-[28px] border-2 border-[#27314a] bg-[radial-gradient(circle_at_top,_rgba(0,229,255,0.12),_transparent_40%),linear-gradient(180deg,#0f1728,#0b1020)] p-5 sm:p-8">
            <div className="flex items-center gap-2 text-[11px] font-arcade text-[#8ec5ff]"><Sparkles className="h-4 w-4 text-[#00e5ff]" />VIBEGAMES BUILDER</div>
            <h1 className="mt-3 font-pixel text-2xl leading-tight text-white sm:text-4xl">Prompt a game. Play it instantly. Ship it when it feels hot.</h1>
            <p className="mt-3 max-w-2xl text-sm text-[#b8c4e3]">Start from a game-native template, steer it with quick actions or natural prompts, and publish straight into VibeGames when the run feels ready.</p>
          </div>

          {error ? <div className="mb-4 rounded-lg border border-[#ff5d73]/40 bg-[#ff5d73]/10 px-4 py-3 text-sm text-[#ffd6dc]">{error}</div> : null}
          {info ? <div className="mb-4 rounded-lg border border-[#00e5ff]/40 bg-[#00e5ff]/10 px-4 py-3 text-sm text-[#d9fbff]">{info}</div> : null}

          <Tabs defaultValue="builder">
            <TabsList variant="arcade" className="w-full justify-start overflow-x-auto">
              <TabsTrigger value="builder" variant="arcade">Builder</TabsTrigger>
              <TabsTrigger value="import" variant="arcade">Import Existing Game</TabsTrigger>
            </TabsList>

            <TabsContent value="builder">
              <div className="grid gap-5 xl:grid-cols-[320px_minmax(0,1fr)]">
                <div className="space-y-5">
                  <Card variant="arcade">
                    <CardHeader variant="arcade">
                      <CardTitle className="font-arcade text-sm text-white">Start Fresh</CardTitle>
                      <CardDescription>Pick a starter that already behaves like a game.</CardDescription>
                    </CardHeader>
                    <CardContent className="grid gap-3">
                      {templates.map((template) => (
                        <button key={template.key} type="button" className="rounded-xl border border-[#2b3753] bg-[#121a2d] p-4 text-left transition hover:border-[#00e5ff] hover:bg-[#17233c]" onClick={() => void createProject(template.key)} disabled={busy.startsWith("create:")}>
                          <p className="text-[10px] font-arcade text-[#00e5ff]">{template.eyebrow}</p>
                          <p className="mt-2 font-arcade text-sm text-white">{template.label}</p>
                          <p className="mt-2 text-xs text-[#9eb0d6]">{template.description}</p>
                        </button>
                      ))}
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Recent Drafts</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {projects.length === 0 ? <p className="text-sm text-[var(--color-text-secondary)]">No builder projects yet.</p> : projects.map((item) => (
                        <button key={item.id} type="button" className={`w-full rounded-xl border px-3 py-3 text-left transition ${project?.id === item.id ? "border-[#00e5ff] bg-[#0f1c32]" : "border-[var(--color-border)] bg-[var(--color-surface)] hover:border-[#00e5ff]/60"}`} onClick={() => void loadProject(item.id)}>
                          <p className="font-medium text-[var(--color-text)]">{item.title}</p>
                          <p className="mt-1 text-xs text-[var(--color-text-secondary)]">{item.currentRevision?.summary || "Fresh starter ready to tune."}</p>
                          <p className="mt-2 text-[10px] uppercase tracking-wide text-[var(--color-text-tertiary)]">{timeAgo(new Date(item.updatedAt))} • {item.status}</p>
                        </button>
                      ))}
                    </CardContent>
                  </Card>
                </div>

                <div className="space-y-5">
                  {!project ? (
                    <Card variant="arcade"><CardHeader variant="arcade"><CardTitle className="font-arcade text-xl text-white">Choose a starter to begin</CardTitle><CardDescription>Once you pick a template, the builder will create a playable draft right away.</CardDescription></CardHeader></Card>
                  ) : (
                    <Card variant="arcade">
                      <CardHeader variant="arcade">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div>
                            <p className="text-[10px] font-arcade text-[#00e5ff]">{activeTemplate?.label || project.templateKey}</p>
                            <CardTitle className="font-arcade text-xl text-white">{project.title}</CardTitle>
                            <CardDescription className="mt-2 text-[#b8c4e3]">{project.description}</CardDescription>
                          </div>
                          {project.publishedGame ? <Link href={`/play/${project.publishedGame.slug}`} className="inline-flex items-center gap-2 text-sm text-[#00e5ff] hover:underline">Open live page<ExternalLink className="h-4 w-4" /></Link> : null}
                        </div>
                      </CardHeader>
                      <CardContent className="grid gap-5 xl:grid-cols-[320px_minmax(0,1fr)]">
                        <div className="space-y-4">
                          <div className="grid gap-2">
                            {quickActions.map((action) => (
                              <Button key={action.key} variant="outline" className="justify-start h-auto whitespace-normal py-3" disabled={Boolean(busy)} onClick={() => void applyPrompt(action.key)}>
                                <Wand2 className="mr-2 h-4 w-4" />{action.label}
                              </Button>
                            ))}
                          </div>
                          <Textarea value={prompt} onChange={(event) => setPrompt(event.target.value)} className="min-h-[150px]" placeholder="Example: make this feel cozy and easier, add a candy theme, and optimize it for portrait mobile." />
                          <Button className="w-full" disabled={Boolean(busy) || prompt.trim().length < 2} onClick={() => void applyPrompt()}>
                            {busy === "prompt" ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Rocket className="mr-2 h-4 w-4" />}Apply Prompt
                          </Button>
                          {capturedThumbnail ? <Image src={capturedThumbnail} alt="Captured builder thumbnail" width={1200} height={675} className="rounded-xl border border-[var(--color-border)]" /> : null}
                          {captureStatus ? <p className="text-xs text-[var(--color-text-secondary)]">{captureStatus}</p> : null}
                          <div className="grid gap-2 sm:grid-cols-2">
                            <Button
                              variant="outline"
                              disabled={Boolean(busy)}
                              onClick={() => {
                                setCaptureStatus("Capturing screenshots from the live preview...")
                                void playerRef.current?.startAutoThumbnailCapture().catch(() => undefined)
                              }}
                            >
                              <ImagePlus className="mr-2 h-4 w-4" />Capture
                            </Button>
                            <Button disabled={busy === "publish"} onClick={() => void publishProject()}>
                              {busy === "publish" ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Rocket className="mr-2 h-4 w-4" />}Publish
                            </Button>
                          </div>
                        </div>

                        <div className="space-y-4">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div>
                              <p className="text-xs font-medium uppercase tracking-wide text-[var(--color-text-secondary)]">Playable Preview</p>
                              <p className="text-sm text-[var(--color-text-secondary)]">{project.currentRevision?.summary}</p>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              <Button variant="outline" onClick={() => setPreviewNonce((value) => value + 1)}><RotateCcw className="mr-2 h-4 w-4" />Restart</Button>
                              <Button variant="outline" onClick={() => void playerRef.current?.enterFullscreen()}><Maximize2 className="mr-2 h-4 w-4" />Fullscreen</Button>
                            </div>
                          </div>

                          <GamePlayer
                            key={`${project.id}-${project.currentRevision?.id}-${previewNonce}`}
                            ref={playerRef}
                            title={project.title}
                            gameUrl={project.currentRevision?.previewPath || ""}
                            runtimeLabel={activeTemplate?.label || "Builder preview"}
                            supportsMobile={project.supportsMobile}
                            mobileOrientation={project.mobileOrientation}
                            onAutoThumbnailCaptureProgress={({ captured, total }) => setCaptureStatus(`Captured ${captured} of ${total} preview frames...`)}
                            onAutoThumbnailCaptureComplete={(images) => { setCapturedThumbnail(images[0] || null); setCaptureStatus(images[0] ? "Thumbnail captured from the live preview." : "Capture finished with no frames returned."); }}
                            onAutoThumbnailCaptureError={(message) => setCaptureStatus(message)}
                          />

                          <div className="grid gap-4 xl:grid-cols-2">
                            <Card>
                              <CardHeader><CardTitle className="text-base">Conversation</CardTitle></CardHeader>
                              <CardContent className="space-y-3">{project.messages.map((message) => <div key={message.id} className={`rounded-xl px-3 py-3 ${message.role === "USER" ? "bg-[#122037] text-[#d9efff]" : message.role === "ASSISTANT" ? "bg-[var(--color-surface)] text-[var(--color-text)]" : "bg-[#101726] text-[#9eb0d6]"}`}><p className="text-[10px] uppercase tracking-wide opacity-70">{message.role}</p><p className="mt-1 text-sm leading-6">{message.content}</p></div>)}</CardContent>
                            </Card>
                            <Card>
                              <CardHeader><CardTitle className="text-base">Revision History</CardTitle></CardHeader>
                              <CardContent className="space-y-3">{project.revisions.map((revision) => <div key={revision.id} className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-3"><p className="text-sm text-[var(--color-text)]">{revision.summary}</p><p className="mt-1 text-xs text-[var(--color-text-secondary)]">{timeAgo(new Date(revision.createdAt))}</p><Button size="sm" variant="outline" className="mt-3" disabled={busy === `restore:${revision.id}` || project.currentRevision?.id === revision.id} onClick={() => void restoreRevision(revision.id)}>Restore</Button></div>)}</CardContent>
                            </Card>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="import">
              <Card variant="arcade">
                <CardHeader variant="arcade">
                  <CardTitle className="font-arcade text-xl text-white">Bring Your Own Build</CardTitle>
                  <CardDescription>Already vibecoding somewhere else? Use the classic upload flow and keep the builder for prompt-native drafts.</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="text-sm text-[var(--color-text-secondary)]">
                    Upload finished HTML or zip builds, then use VibeGames for publish, thumbnails, ghost hooks, level-editor hooks, and game-page discovery.
                  </div>
                  <Link href="/upload"><Button><Upload className="mr-2 h-4 w-4" />Open Upload Flow</Button></Link>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
      <Footer />
    </div>
  )
}
