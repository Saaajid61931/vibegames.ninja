"use client"

import Link from "next/link"
import type { Session } from "next-auth"
import { ExternalLink, Loader2, Sparkles, Upload } from "lucide-react"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { TemplateSelector } from "@/components/create/template-selector"
import { ProjectSidebar } from "@/components/create/project-sidebar"
import { ProjectEditor } from "@/components/create/project-editor"
import { ProjectPreview } from "@/components/create/project-preview"
import { ConversationPanel } from "@/components/create/conversation-panel"
import { RevisionHistory } from "@/components/create/revision-history"
import { useBuilder } from "@/components/create/use-builder"

/* ------------------------------------------------------------------ */
/*  Empty state (fix #15)                                              */
/* ------------------------------------------------------------------ */

function EmptyState() {
  return (
    <Card variant="arcade">
      <CardHeader variant="arcade">
        <CardTitle className="font-arcade text-xl text-white">
          Choose a starter to begin
        </CardTitle>
        <CardDescription>
          Once you pick a template, the builder will create a playable draft right away. You can
          then steer it with quick actions or write a custom prompt.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-[#9eb0d6]">
          Tip: each template already has a running game loop — no code needed to get started.
        </p>
      </CardContent>
    </Card>
  )
}

/* ------------------------------------------------------------------ */
/*  Main page component                                                */
/* ------------------------------------------------------------------ */

type CreatePageClientProps = {
  session: Session
}

export function CreatePageClient({ session }: CreatePageClientProps) {
  const b = useBuilder(session)

  /* ---- Guards ---- */
  if (b.loading) return <div className="min-h-screen flex items-center justify-center bg-[#0d0d15]"><Loader2 className="h-8 w-8 animate-spin text-[var(--color-primary)]" /></div>

  return (
    <div className="min-h-screen flex flex-col bg-[#0d0d15]">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-6 sm:py-8">
        <div className="mx-auto max-w-7xl">
          {/* Hero */}
          <div className="mb-6 rounded-[28px] border-2 border-[#27314a] bg-[radial-gradient(circle_at_top,_rgba(0,229,255,0.12),_transparent_40%),linear-gradient(180deg,#0f1728,#0b1020)] p-5 sm:p-8">
            <div className="flex items-center gap-2 text-[11px] font-arcade text-[#8ec5ff]">
              <Sparkles className="h-4 w-4 text-[#00e5ff]" />
              VIBEGAMES BUILDER
            </div>
            <h1 className="mt-3 font-pixel text-2xl leading-tight text-white sm:text-4xl">
              Prompt a game. Play it instantly. Ship it when it feels hot.
            </h1>
            <p className="mt-3 max-w-2xl text-sm text-[#b8c4e3]">
              Start from a game-native template, steer it with quick actions or natural prompts,
              and publish straight into VibeGames when the run feels ready.
            </p>
          </div>

          {/* Feedback banners (fix #4: role="alert") */}
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
                Builder
              </TabsTrigger>
              <TabsTrigger value="import" variant="arcade">
                Import Existing Game
              </TabsTrigger>
            </TabsList>

            <TabsContent value="builder">
              <div className="grid gap-5 xl:grid-cols-[320px_minmax(0,1fr)]">
                {/* Left sidebar */}
                <div className="space-y-5">
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
                    onSelectProject={(id) => void b.loadProject(id)}
                  />
                </div>

                {/* Right content */}
                <div className="space-y-5">
                  {!b.project ? (
                    <EmptyState />
                  ) : (
                    <Card variant="arcade">
                      <CardHeader variant="arcade">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div>
                            <p className="text-[10px] font-arcade text-[#00e5ff]">
                              {b.activeTemplate?.label || b.project.templateKey}
                            </p>
                            <CardTitle className="font-arcade text-xl text-white">
                              {b.project.title}
                            </CardTitle>
                            <CardDescription className="mt-2 text-[#b8c4e3]">
                              {b.project.description}
                            </CardDescription>
                          </div>
                          {b.project.publishedGame ? (
                            <Link
                              href={`/play/${b.project.publishedGame.slug}`}
                              className="inline-flex items-center gap-2 text-sm text-[#00e5ff] hover:underline"
                            >
                              Open live page
                              <ExternalLink className="h-4 w-4" />
                            </Link>
                          ) : null}
                        </div>
                      </CardHeader>

                      <CardContent className="grid gap-5 xl:grid-cols-[320px_minmax(0,1fr)]">
                        {/* Editor panel */}
                        <ProjectEditor
                          quickActions={b.quickActions}
                          prompt={b.prompt}
                          onPromptChange={b.setPrompt}
                          busy={b.busy}
                          captureStatus={b.captureStatus}
                          capturedThumbnail={b.capturedThumbnail}
                          onApplyPrompt={(actionKey) => void b.applyPrompt(actionKey)}
                          onCapture={b.startCapture}
                          onPublish={() => void b.publishProject()}
                        />

                        {/* Preview + history */}
                        <div className="space-y-4">
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
                              b.setCaptureStatus(
                                `Captured ${captured} of ${total} preview frames...`,
                              )
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

                          <div className="grid gap-4 xl:grid-cols-2">
                            <ConversationPanel messages={b.project.messages} />
                            <RevisionHistory
                              revisions={b.project.revisions}
                              currentRevisionId={b.project.currentRevision?.id}
                              busy={b.busy}
                              onRestore={(revisionId) => void b.restoreRevision(revisionId)}
                            />
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
                  <CardTitle className="font-arcade text-xl text-white">
                    Bring Your Own Build
                  </CardTitle>
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
