"use client"

import Link from "next/link"
import type { Session } from "next-auth"
import { ExternalLink, Gamepad2, Layers3, Loader2, Sparkles, Upload } from "lucide-react"
import { ConversationPanel } from "@/components/create/conversation-panel"
import { ProjectEditor } from "@/components/create/project-editor"
import { ProjectPreview } from "@/components/create/project-preview"
import { ProjectSidebar } from "@/components/create/project-sidebar"
import { RevisionHistory } from "@/components/create/revision-history"
import { ScratchGenerator } from "@/components/create/scratch-generator"
import { TemplateSelector } from "@/components/create/template-selector"
import { useBuilder } from "@/components/create/use-builder"
import { Footer } from "@/components/layout/footer"
import { Header } from "@/components/layout/header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

type OpenRouterTestState = {
  status: "idle" | "testing" | "success" | "error"
  message: string
  model: string
}

function EmptyState({
  openRouterConfigured,
  openRouterTestState,
}: {
  openRouterConfigured: boolean
  openRouterTestState: OpenRouterTestState
}) {
  const aiStatus =
    openRouterTestState.status === "success"
      ? openRouterTestState.message
      : openRouterConfigured
        ? "Your OpenRouter key is present. Pick a starter, then generate your first playable draft."
        : "You can start with the local builder now, or add an OpenRouter key in the side panel for external AI generation."

  return (
    <Card variant="arcade">
      <CardHeader variant="arcade">
        <div className="flex items-center gap-2 text-[10px] font-arcade text-[#8ec5ff]">
          <Sparkles className="h-4 w-4 text-[#00e5ff]" />
          START YOUR FIRST RUN
        </div>
        <CardTitle className="font-arcade text-xl text-white">Build a playable game in 3 steps</CardTitle>
        <CardDescription>{aiStatus}</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-white/10 bg-[#10192d] p-4">
          <p className="text-[11px] uppercase tracking-[0.24em] text-[#8ec5ff]">Step 1</p>
          <p className="mt-2 text-base font-semibold text-white">Describe or choose</p>
          <p className="mt-2 text-sm leading-6 text-[#9eb0d6]">
            Start from scratch with a concept prompt, or pick a starter yourself if you already
            know the loop you want.
          </p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-[#10192d] p-4">
          <p className="text-[11px] uppercase tracking-[0.24em] text-[#8ec5ff]">Step 2</p>
          <p className="mt-2 text-base font-semibold text-white">Set your AI</p>
          <p className="mt-2 text-sm leading-6 text-[#9eb0d6]">
            Add and test your OpenRouter model if you want external generation, or stay on the
            local builder.
          </p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-[#10192d] p-4">
          <p className="text-[11px] uppercase tracking-[0.24em] text-[#8ec5ff]">Step 3</p>
          <p className="mt-2 text-base font-semibold text-white">Describe the vibe</p>
          <p className="mt-2 text-sm leading-6 text-[#9eb0d6]">
            Ask for a theme, pacing, feedback, controls, or monetizable hook and iterate from the
            live preview.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}

type CreatePageClientProps = {
  session: Session
}

export function CreatePageClient({ session }: CreatePageClientProps) {
  const b = useBuilder(session)
  const openRouterConfigured = b.openRouterApiKey.trim().length > 0
  const heroStatus =
    b.openRouterTestState.status === "success"
      ? `AI ready on ${b.openRouterTestState.model}`
      : b.openRouterTestState.status === "error"
        ? "OpenRouter needs attention"
        : openRouterConfigured
          ? "OpenRouter key added"
          : "Local builder ready"

  if (b.loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0d0d15]">
        <Loader2 className="h-8 w-8 animate-spin text-[var(--color-primary)]" />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#0d0d15]">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-6 sm:py-8">
        <div className="mx-auto max-w-7xl">
          <div className="mb-6 rounded-[32px] border-2 border-[#27314a] bg-[radial-gradient(circle_at_top,_rgba(0,229,255,0.16),_transparent_38%),linear-gradient(135deg,#111a2e,#0a0f1c_72%)] p-5 sm:p-8">
            <div className="flex flex-wrap items-center gap-2 text-[11px] font-arcade text-[#8ec5ff]">
              <Sparkles className="h-4 w-4 text-[#00e5ff]" />
              VIBEGAMES AI GAME STUDIO
            </div>
            <div className="mt-4 flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
              <div>
                <h1 className="font-pixel text-2xl leading-tight text-white sm:text-4xl">
                  Create, test, and tune a game from one screen.
                </h1>
                <p className="mt-3 max-w-3xl text-sm leading-6 text-[#b8c4e3]">
                  Pick a starter, connect your model, describe the experience you want, then judge
                  the result in the live preview before you publish.
                </p>
              </div>
              <div className="grid gap-3 sm:grid-cols-3 xl:min-w-[440px]">
                <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                  <p className="text-[10px] uppercase tracking-[0.24em] text-[#8ec5ff]">Mode</p>
                  <p className="mt-2 text-sm font-semibold text-white">{heroStatus}</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                  <p className="text-[10px] uppercase tracking-[0.24em] text-[#8ec5ff]">Starter</p>
                  <p className="mt-2 text-sm font-semibold text-white">
                    {b.activeTemplate?.label || "Choose one"}
                  </p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                  <p className="text-[10px] uppercase tracking-[0.24em] text-[#8ec5ff]">Drafts</p>
                  <p className="mt-2 text-sm font-semibold text-white">{b.projects.length} saved</p>
                </div>
              </div>
            </div>
          </div>

          {b.error ? (
            <div
              role="alert"
              className="mb-4 rounded-lg border border-[#ff5d73]/40 bg-[#ff5d73]/10 px-4 py-3 text-sm text-[#ffd6dc]"
            >
              {b.error}
            </div>
          ) : null}

          {b.info ? (
            <div
              role="status"
              className="mb-4 rounded-lg border border-[#00e5ff]/40 bg-[#00e5ff]/10 px-4 py-3 text-sm text-[#d9fbff]"
            >
              {b.info}
            </div>
          ) : null}

          <Tabs defaultValue="builder">
            <TabsList variant="arcade" className="w-full justify-start overflow-x-auto">
              <TabsTrigger value="builder" variant="arcade">
                AI Builder
              </TabsTrigger>
              <TabsTrigger value="import" variant="arcade">
                Import Existing Game
              </TabsTrigger>
            </TabsList>

            <TabsContent value="builder">
              <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
                <div className="space-y-6">
                  {b.project ? (
                    <Card variant="arcade">
                      <CardHeader variant="arcade">
                        <div className="flex flex-wrap items-start justify-between gap-4">
                          <div>
                            <div className="flex flex-wrap items-center gap-2 text-[10px] font-arcade text-[#8ec5ff]">
                              <Gamepad2 className="h-4 w-4 text-[#00e5ff]" />
                              CURRENT DRAFT
                            </div>
                            <CardTitle className="mt-3 font-arcade text-xl text-white">
                              {b.project.title}
                            </CardTitle>
                            <CardDescription className="mt-2 max-w-2xl text-[#b8c4e3]">
                              {b.project.description}
                            </CardDescription>
                          </div>
                          {b.project.publishedGame ? (
                            <Link
                              href={`/play/${b.project.publishedGame.slug}`}
                              className="inline-flex items-center gap-2 rounded-full border border-[#00e5ff]/30 bg-[#00e5ff]/10 px-4 py-2 text-sm text-[#d9fbff] transition hover:bg-[#00e5ff]/20"
                            >
                              Open live page
                              <ExternalLink className="h-4 w-4" />
                            </Link>
                          ) : null}
                        </div>
                      </CardHeader>
                      <CardContent className="grid gap-4 md:grid-cols-3">
                        <div className="rounded-2xl border border-white/10 bg-[#10192d] p-4">
                          <p className="text-[10px] uppercase tracking-[0.24em] text-[#8ec5ff]">Template</p>
                          <p className="mt-2 text-sm font-semibold text-white">
                            {b.activeTemplate?.label || b.project.templateKey}
                          </p>
                        </div>
                        <div className="rounded-2xl border border-white/10 bg-[#10192d] p-4">
                          <p className="text-[10px] uppercase tracking-[0.24em] text-[#8ec5ff]">Revisions</p>
                          <p className="mt-2 text-sm font-semibold text-white">
                            {b.project.revisions.length} saved versions
                          </p>
                        </div>
                        <div className="rounded-2xl border border-white/10 bg-[#10192d] p-4">
                          <p className="text-[10px] uppercase tracking-[0.24em] text-[#8ec5ff]">Conversation</p>
                          <p className="mt-2 text-sm font-semibold text-white">
                            {b.project.messages.length} builder messages
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  ) : (
                    <EmptyState
                      openRouterConfigured={openRouterConfigured}
                      openRouterTestState={b.openRouterTestState}
                    />
                  )}

                  {b.project ? (
                    <div className="grid gap-6 2xl:grid-cols-[minmax(0,1.05fr)_minmax(360px,0.95fr)]">
                      <div className="space-y-6">
                        <ProjectEditor
                          projectTitle={b.project.title}
                          templateLabel={b.activeTemplate?.label || b.project.templateKey}
                          quickActions={b.quickActions}
                          prompt={b.prompt}
                          onPromptChange={b.setPrompt}
                          busy={b.busy}
                          openRouterConfigured={openRouterConfigured}
                          openRouterTestState={b.openRouterTestState}
                          captureStatus={b.captureStatus}
                          capturedThumbnail={b.capturedThumbnail}
                          onApplyPrompt={(actionKey) => void b.applyPrompt(actionKey)}
                          onCapture={b.startCapture}
                          onPublish={() => void b.publishProject()}
                        />
                        <ConversationPanel messages={b.project.messages} />
                      </div>

                      <div className="space-y-6">
                        <Card variant="arcade">
                          <CardHeader variant="arcade">
                            <div className="flex items-center gap-2 text-[10px] font-arcade text-[#8ec5ff]">
                              <Layers3 className="h-4 w-4 text-[#00e5ff]" />
                              LIVE PLAYTEST
                            </div>
                            <CardTitle className="font-arcade text-lg text-white">
                              Preview the current revision
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <ProjectPreview
                              projectId={b.project.id}
                              revisionId={b.project.currentRevision?.id}
                              previewNonce={b.previewNonce}
                              title={b.project.title}
                              gameUrl={b.project.currentRevision?.previewPath || ""}
                              runtimeLabel={b.activeTemplate?.label || "Builder preview"}
                              supportsMobile={b.project.supportsMobile}
                              mobileOrientation={b.project.mobileOrientation}
                              revisionSummary={b.project.currentRevision?.summary}
                              playerRef={b.playerRef}
                              onRestart={b.restartPreview}
                              onFullscreen={b.enterFullscreen}
                              onCaptureProgress={({ captured, total }) =>
                                b.setCaptureStatus(`Captured ${captured} of ${total} preview frames...`)
                              }
                              onCaptureComplete={(images) => {
                                b.setCapturedThumbnail(images[0] || null)
                                b.setCaptureStatus(
                                  images[0]
                                    ? "Thumbnail captured from the live preview."
                                    : "Capture finished with no frames returned.",
                                )
                              }}
                              onCaptureError={(message) => b.setCaptureStatus(message)}
                            />
                          </CardContent>
                        </Card>

                        <RevisionHistory
                          revisions={b.project.revisions}
                          currentRevisionId={b.project.currentRevision?.id}
                          busy={b.busy}
                          onRestore={(revisionId) => void b.restoreRevision(revisionId)}
                        />
                      </div>
                    </div>
                  ) : null}
                </div>

                <div className="space-y-6">
                  <ScratchGenerator
                    prompt={b.scratchPrompt}
                    onPromptChange={b.setScratchPrompt}
                    busy={b.busy}
                    openRouterConfigured={openRouterConfigured}
                    onGenerate={() => void b.createProjectFromScratch()}
                  />
                  <TemplateSelector
                    templates={b.templates}
                    busy={b.busy}
                    onSelect={(key) => void b.createProject(key)}
                  />
                  <ProjectSidebar
                    projects={b.projects}
                    activeProjectId={b.project?.id}
                    openRouterApiKey={b.openRouterApiKey}
                    onApiKeyChange={b.setOpenRouterApiKey}
                    openRouterModel={b.openRouterModel}
                    onOpenRouterModelChange={b.setOpenRouterModel}
                    openRouterTestState={b.openRouterTestState}
                    onTestOpenRouter={() => void b.testOpenRouter()}
                    onSelectProject={(id) => void b.loadProject(id)}
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="import">
              <Card variant="arcade">
                <CardHeader variant="arcade">
                  <div className="flex items-center gap-2 text-[10px] font-arcade text-[#8ec5ff]">
                    <Upload className="h-4 w-4 text-[#00e5ff]" />
                    BRING YOUR OWN BUILD
                  </div>
                  <CardTitle className="font-arcade text-xl text-white">Bring Your Own Build</CardTitle>
                  <CardDescription>
                    Already vibecoding somewhere else? Use the classic upload flow and keep the
                    builder for prompt-native drafts.
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="text-sm text-[var(--color-text-secondary)]">
                    Upload finished HTML or zip builds, then use VibeGames for publish, thumbnails,
                    ghost hooks, level-editor hooks, and game-page discovery.
                  </div>
                  <Link href="/upload">
                    <Button>
                      <Upload className="mr-2 h-4 w-4" />
                      Open Upload Flow
                    </Button>
                  </Link>
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
