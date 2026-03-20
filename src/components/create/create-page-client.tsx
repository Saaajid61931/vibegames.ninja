"use client"

import { useState } from "react"
import Link from "next/link"
import type { Session } from "next-auth"
import {
  ExternalLink,
  Gamepad2,
  Loader2,
} from "lucide-react"
import { ConversationPanel } from "@/components/create/conversation-panel"
import { ProjectEditor } from "@/components/create/project-editor"
import { ProjectPreview } from "@/components/create/project-preview"
import { ProjectSidebar } from "@/components/create/project-sidebar"
import { ScratchGenerator } from "@/components/create/scratch-generator"
import { useBuilder } from "@/components/create/use-builder"

type CreatePageClientProps = {
  session: Session
}

export function CreatePageClient({ session }: CreatePageClientProps) {
  const b = useBuilder(session)
  const openRouterConfigured = b.openRouterApiKey.trim().length > 0
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  /* ---- Loading state ---- */
  if (b.loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#0a0e17]">
        <div className="absolute inset-0 pixel-bg opacity-20" />
        <div className="relative text-center">
          <Loader2 className="mx-auto h-10 w-10 animate-spin text-[#0080ff]" />
          <p className="mt-4 font-pixel text-sm tracking-widest text-[#0080ff] drop-shadow-[0_0_8px_rgba(0,128,255,0.4)]">
            LOADING ARCADE BUILDER...
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-[#0a0e17]">
      {/* ============================================ */}
      {/*  TOP BAR - Retro arcade header               */}
      {/* ============================================ */}
      <header className="relative z-20 flex h-14 shrink-0 items-center justify-between border-b-2 border-[#4a4a6a] bg-[#0d1420] px-4 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-[#0080ff]/10 via-transparent to-[#ff0040]/10" />
        
        {/* Left: Logo */}
        <div className="relative flex items-center gap-4">
          <Link href="/" className="flex items-center gap-2.5 transition-opacity hover:opacity-80">
            <div className="flex h-8 w-8 items-center justify-center border-2 border-[#0080ff] bg-[#1a1a2e] shadow-[2px_2px_0_#000]">
              <Gamepad2 className="h-4 w-4 text-[#0080ff]" />
            </div>
            <span 
              className="font-pixel text-base text-white drop-shadow-[2px_2px_0_#ff0040]"
              style={{ fontFamily: "var(--font-pixel), monospace" }}
            >
              ARCADE BUILDER
            </span>
          </Link>

          {/* Neon separator */}
          <div className="h-6 w-0.5 bg-[#4a4a6a]" />

          {/* Provider pill */}
          <span
            className={`font-pixel rounded border-2 px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-wider shadow-[1px_1px_0_#000] ${
              b.openRouterTestState.status === "success"
                ? "border-emerald-500 bg-emerald-500/10 text-emerald-400"
                : openRouterConfigured
                  ? "border-[#0080ff] bg-[#0080ff]/10 text-[#0080ff]"
                  : "border-[#4a4a6a] bg-[#1a1a2e] text-[#6b7fa3]"
            }`}
          >
            {b.openRouterTestState.status === "success"
              ? `AI: ${b.openRouterTestState.model.split("/").pop()}`
              : openRouterConfigured
                ? "OpenRouter"
                : "Local"}
          </span>
        </div>

        {/* Center: Project title */}
        {b.project && (
          <div className="absolute left-1/2 flex -translate-x-1/2 items-center gap-3">
            <span className="max-w-[300px] truncate font-pixel text-xs text-white">
              {b.project.title}
            </span>
            <span className="border-2 border-[#4a4a6a] bg-[#1a1a2e] px-2 py-0.5 font-pixel text-[9px] text-[#ffff00]">
              {b.activeTemplate?.label || b.project.templateKey}
            </span>
            {b.project.publishedGame && (
              <Link
                href={`/play/${b.project.publishedGame.slug}`}
                className="flex items-center gap-1 border-2 border-emerald-500 bg-emerald-500/10 px-2 py-0.5 font-pixel text-[9px] text-emerald-400 transition-colors hover:bg-emerald-500/20"
              >
                LIVE
                <ExternalLink className="h-2.5 w-2.5" />
              </Link>
            )}
          </div>
        )}

        {/* Right: Status */}
        <div className="relative flex items-center gap-3">
          {b.project && (
            <div className="flex items-center gap-2 border-2 border-[#4a4a6a] bg-[#1a1a2e] px-2.5 py-1">
              <span className="font-pixel text-[9px] text-[#6b7fa3]">REVISIONS</span>
              <span className="font-pixel text-[11px] font-bold text-[#ffff00]">
                {b.project.revisions.length.toString().padStart(2, "0")}
              </span>
            </div>
          )}
        </div>
      </header>

      {/* Notification bar for error/info */}
      {(b.error || b.info) && (
        <div
          className={`shrink-0 px-4 py-2 font-pixel text-[10px] tracking-wider ${
            b.error
              ? "border-b-2 border-rose-500/40 bg-rose-500/10 text-rose-300"
              : "border-b-2 border-[#0080ff]/40 bg-[#0080ff]/10 text-[#d9fbff]"
          }`}
        >
          {b.error || b.info}
        </div>
      )}

      {/* ============================================ */}
      {/*  MAIN WORKSPACE - 3-column Lovable layout    */}
      {/* ============================================ */}
      <div className="flex min-h-0 flex-1">
        {/* ---- LEFT: Sidebar ---- */}
        <ProjectSidebar
          projects={b.projects}
          activeProjectId={b.project?.id}
          activeProject={b.project}
          templates={b.templates}
          busy={b.busy}
          openRouterApiKey={b.openRouterApiKey}
          onApiKeyChange={b.setOpenRouterApiKey}
          openRouterModel={b.openRouterModel}
          onOpenRouterModelChange={b.setOpenRouterModel}
          openRouterTestState={b.openRouterTestState}
          onTestOpenRouter={() => void b.testOpenRouter()}
          onSelectProject={(id) => void b.loadProject(id)}
          onCreateFromTemplate={(key) => void b.createProject(key)}
          onNewProject={() => {
            // Clear active project to show welcome screen
            // The user can then pick a starter or type a concept
          }}
          onRestoreRevision={(revisionId) => void b.restoreRevision(revisionId)}
          collapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        />

        {/* ---- CENTER: Chat panel ---- */}
        <div className="flex min-w-0 flex-1 flex-col border-r-2 border-[#4a4a6a]">
          {b.project ? (
            <>
              {/* Conversation area - scrollable */}
              <ConversationPanel messages={b.project.messages} />

              {/* Editor at the bottom */}
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
            </>
          ) : (
            /* Welcome / scratch generator when no project is active */
            <ScratchGenerator
              prompt={b.scratchPrompt}
              onPromptChange={b.setScratchPrompt}
              busy={b.busy}
              openRouterConfigured={openRouterConfigured}
              onGenerate={() => void b.createProjectFromScratch()}
            />
          )}
        </div>

        {/* ---- RIGHT: Preview panel ---- */}
        <div className="hidden flex-[1.4] lg:flex lg:flex-col bg-[#080b13] relative">
          <div className="absolute inset-0 pixel-bg opacity-5" />
          {b.project ? (
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
          ) : (
            /* Empty state for preview */
            <div className="relative flex flex-1 items-center justify-center">
              <div className="text-center">
                <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center border-4 border-[#4a4a6a] bg-[#1a1a2e] shadow-[4px_4px_0_#000]">
                  <Gamepad2 className="h-10 w-10 text-[#4a4a6a]" />
                </div>
                <p className="font-pixel text-base text-[#4a4a6a]">INSERT COIN TO START</p>
                <p className="mt-4 max-w-xs font-pixel text-[10px] uppercase tracking-widest text-[#2d3a52]">
                  Create or select a project to see the live preview here.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>

  )
}
