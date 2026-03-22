"use client"

import { useState, useCallback, useEffect, useMemo, useRef } from "react"
import Link from "next/link"
import Image from "next/image"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useSession } from "next-auth/react"
import { useDropzone } from "react-dropzone"
import {
  Upload,
  FileArchive,
  X,
  CheckCircle,
  AlertCircle,
  Loader2,
  Trophy,
  Camera,
  MonitorPlay,
  Code2,
  Sparkles,
} from "lucide-react"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { GamePlayer, type GamePlayerHandle } from "@/components/games/game-player"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { GhostSharingSetupGuide } from "@/components/games/ghost-sharing-setup-guide"
import { LevelEditorSetupGuide } from "@/components/games/level-editor-setup-guide"
import { MOBILE_ORIENTATION_OPTIONS } from "@/lib/mobile-orientation"
import { CATEGORIES, AI_MODELS, AI_TOOLS } from "@/lib/utils"

type ActiveJamOption = {
  id: string
  slug: string
  title: string
  theme: string | null
  endDate: string
  maxEntries: number
  userEntryCount: number
  remainingEntries: number
  isEligibleToSubmit: boolean
}

type UploadStage = "idle" | "uploading" | "publishing" | "submittingJam" | "done"
type GameSourceMode = "upload" | "paste"
type AutoThumbnailState = "idle" | "capturing" | "ready" | "error"

type ResponsiveSlideUpload = {
  original: string
  variants: Array<{
    width: number
    image: string
  }>
}

const UPLOAD_DRAFT_STORAGE_KEY = "vg-upload-draft:v1"
const PREVIEW_CAPTURE_BRIDGE_ID = "vg-upload-preview-bridge"
const RESPONSIVE_SLIDE_WIDTHS = [320, 640]

function injectPreviewCaptureBridgeIntoHtml(html: string) {
  const normalizedHtml = html || ""
  if (normalizedHtml.includes(PREVIEW_CAPTURE_BRIDGE_ID)) {
    return normalizedHtml
  }

  const bridge = `<script id="${PREVIEW_CAPTURE_BRIDGE_ID}">
;(function () {
  function post(type, payload) {
    if (!window.parent || window.parent === window) {
      return
    }

    window.parent.postMessage(
      {
        source: "vibegames-sdk",
        type: type,
        payload: payload || {},
      },
      "*"
    )
  }

  function exportCanvasImage(canvas) {
    var width = canvas.width || 0
    var height = canvas.height || 0

    if (!width || !height) {
      return null
    }

    try {
      var webpDataUrl = canvas.toDataURL("image/webp", 0.82)
      if (webpDataUrl.indexOf("data:image/webp") === 0) {
        return webpDataUrl
      }
    } catch {}

    try {
      return canvas.toDataURL("image/jpeg", 0.82)
    } catch {
      return null
    }
  }

  window.addEventListener("message", function (event) {
    var message = event.data
    if (!message || message.source !== "vibegames-platform" || message.type !== "VG_REQUEST_SCREENSHOT") {
      return
    }

    var captureId = message.payload && typeof message.payload.captureId === "string" ? message.payload.captureId : ""
    var imageDataUrl = null

    try {
      var canvas = document.querySelector("canvas")
      if (canvas && typeof canvas.toDataURL === "function") {
        imageDataUrl = exportCanvasImage(canvas)
      }
    } catch (error) {
      console.error("Preview screenshot capture failed", error)
    }

    if (imageDataUrl) {
      post("VG_SCREENSHOT_CAPTURED", {
        captureId: captureId,
        imageDataUrl: imageDataUrl,
      })
      return
    }

    post("VG_SCREENSHOT_CAPTURED", {
      captureId: captureId,
      error: "Unable to capture preview screenshot. Render to a canvas or use browser tab capture.",
    })
  })
})()
</script>`

  const headRegex = /<head[^>]*>/i
  if (headRegex.test(normalizedHtml)) {
    return normalizedHtml.replace(headRegex, (match) => `${match}\n${bridge}`)
  }

  const closingHeadRegex = /<\/head>/i
  if (closingHeadRegex.test(normalizedHtml)) {
    return normalizedHtml.replace(closingHeadRegex, `${bridge}\n</head>`)
  }

  const bodyRegex = /<body[^>]*>/i
  if (bodyRegex.test(normalizedHtml)) {
    return normalizedHtml.replace(bodyRegex, (match) => `${match}\n${bridge}`)
  }

  return `${bridge}\n${normalizedHtml}`
}

async function loadImageElement(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new window.Image()
    image.onload = () => resolve(image)
    image.onerror = () => reject(new Error("Could not prepare thumbnail image."))
    image.src = src
  })
}

async function buildResponsiveSlidePayload(imageDataUrl: string): Promise<ResponsiveSlideUpload> {
  const image = await loadImageElement(imageDataUrl)
  const variants: ResponsiveSlideUpload["variants"] = []

  for (const targetWidth of RESPONSIVE_SLIDE_WIDTHS) {
    if (!image.naturalWidth || image.naturalWidth <= targetWidth) {
      continue
    }

    const scale = targetWidth / image.naturalWidth
    const canvas = document.createElement("canvas")
    canvas.width = targetWidth
    canvas.height = Math.max(1, Math.round(image.naturalHeight * scale))

    const context = canvas.getContext("2d")
    if (!context) {
      continue
    }

    context.imageSmoothingEnabled = true
    context.imageSmoothingQuality = "high"
    context.drawImage(image, 0, 0, canvas.width, canvas.height)

    const webpDataUrl = canvas.toDataURL("image/webp", 0.64)
    variants.push({
      width: targetWidth,
      image: webpDataUrl.startsWith("data:image/webp")
        ? webpDataUrl
        : canvas.toDataURL("image/jpeg", 0.64),
    })
  }

  return {
    original: imageDataUrl,
    variants,
  }
}

export function UploadPageClient() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const { data: session, status } = useSession()
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)
  const [createdGame, setCreatedGame] = useState<{
    slug: string
    title: string
    submittedJam?: { slug: string; title: string } | null
  } | null>(null)
  const [uploadWarnings, setUploadWarnings] = useState<string[]>([])
  const [gameSourceMode, setGameSourceMode] = useState<GameSourceMode>("upload")
  const [pastedGameHtml, setPastedGameHtml] = useState("")
  const [gameFile, setGameFile] = useState<File | null>(null)
  const [previewGameUrl, setPreviewGameUrl] = useState<string | null>(null)
  const [autoThumbnailImages, setAutoThumbnailImages] = useState<string[]>([])
  const [autoThumbnailState, setAutoThumbnailState] = useState<AutoThumbnailState>("idle")
  const [autoThumbnailMessage, setAutoThumbnailMessage] = useState(
    "Capture 5 live screenshots from the preview. We'll keep the preview in this tab while the browser shares the game."
  )
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null)
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null)
  const [activeJams, setActiveJams] = useState<ActiveJamOption[]>([])
  const [selectedJamSlug, setSelectedJamSlug] = useState("")
  const [loadingJams, setLoadingJams] = useState(true)
  const [jamLoadError, setJamLoadError] = useState("")
  const [jamSelectionNotice, setJamSelectionNotice] = useState("")
  const [draftNotice, setDraftNotice] = useState("")
  const [uploadStage, setUploadStage] = useState<UploadStage>("idle")
  const jamQueryAppliedRef = useRef(false)
  const uploadStageTimeoutsRef = useRef<number[]>([])
  const draftHydratedRef = useRef(false)
  const previewPlayerRef = useRef<GamePlayerHandle | null>(null)
  const previewObjectUrlRef = useRef<string | null>(null)

  const [studioProfiles, setStudioProfiles] = useState<
    { id: string; handle: string; displayName: string; image?: string | null }[]
  >([])
  const [creatingStudio, setCreatingStudio] = useState(false)
  const [studioError, setStudioError] = useState("")
  const [newStudio, setNewStudio] = useState({ displayName: "", handle: "" })
  
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    instructions: "",
    category: "OTHER",
    tags: "",
    aiTool: "",
    aiModel: "",
    supportsMobile: false,
    mobileOrientation: "BOTH",
    hasLevelEditor: false,
    hasGhostSharing: false,
    seekingFeedback: false,
    latestUpdateNote: "",
    isAIGenerated: true,
    studioProfileId: "",
  })

  const jamQuerySlug = searchParams.get("jam")?.trim() ?? ""
  const currentPathWithQuery = useMemo(() => {
    const query = searchParams.toString()
    return query ? `${pathname}?${query}` : pathname
  }, [pathname, searchParams])
  const selectedJam = activeJams.find((jam) => jam.slug === selectedJamSlug) ?? null

  const clearUploadStageTimers = useCallback(() => {
    for (const timer of uploadStageTimeoutsRef.current) {
      window.clearTimeout(timer)
    }
    uploadStageTimeoutsRef.current = []
  }, [])

  const clearSavedDraft = useCallback(() => {
    if (typeof window === "undefined") {
      return
    }

    window.localStorage.removeItem(UPLOAD_DRAFT_STORAGE_KEY)
    setDraftNotice("")
  }, [])

  useEffect(() => {
    jamQueryAppliedRef.current = false
  }, [jamQuerySlug])

  useEffect(() => {
    if (typeof window === "undefined") {
      return
    }

    try {
      const rawDraft = window.localStorage.getItem(UPLOAD_DRAFT_STORAGE_KEY)
      if (!rawDraft) {
        draftHydratedRef.current = true
        return
      }

      const parsed = JSON.parse(rawDraft) as {
        formData?: typeof formData
        selectedJamSlug?: string
        newStudio?: typeof newStudio
        gameSourceMode?: GameSourceMode
        pastedGameHtml?: string
      }

      if (parsed.formData) {
        setFormData((current) => ({
          ...current,
          ...parsed.formData,
        }))
      }

      if (parsed.selectedJamSlug) {
        setSelectedJamSlug(parsed.selectedJamSlug)
      }

      if (parsed.newStudio) {
        setNewStudio((current) => ({
          ...current,
          ...parsed.newStudio,
        }))
      }

      if (parsed.gameSourceMode === "paste" || parsed.gameSourceMode === "upload") {
        setGameSourceMode(parsed.gameSourceMode)
      }

      if (typeof parsed.pastedGameHtml === "string") {
        setPastedGameHtml(parsed.pastedGameHtml)
      }

      setDraftNotice("Restored your last upload draft.")
    } catch {
      // Non-blocking local draft restore.
    } finally {
      draftHydratedRef.current = true
    }
  }, [])

  useEffect(() => {
    if (typeof window === "undefined" || !draftHydratedRef.current || success) {
      return
    }

    window.localStorage.setItem(
      UPLOAD_DRAFT_STORAGE_KEY,
      JSON.stringify({
        formData,
        selectedJamSlug,
        newStudio,
        gameSourceMode,
        pastedGameHtml: gameSourceMode === "paste" && pastedGameHtml.length <= 100_000 ? pastedGameHtml : "",
      })
    )
  }, [formData, selectedJamSlug, newStudio, gameSourceMode, pastedGameHtml, success])

  useEffect(() => {
    setAutoThumbnailImages([])
    setAutoThumbnailState("idle")
    setAutoThumbnailMessage(
      "Capture 5 live screenshots from the preview. We'll keep the preview in this tab while the browser shares the game."
    )
  }, [gameSourceMode, gameFile?.name, gameFile?.size, gameFile?.lastModified, pastedGameHtml])

  useEffect(() => {
    let cancelled = false
    const currentPreviewUrl = previewObjectUrlRef.current

    const setUrl = (nextUrl: string | null) => {
      if (cancelled) {
        if (nextUrl) {
          URL.revokeObjectURL(nextUrl)
        }
        return
      }

      if (currentPreviewUrl && currentPreviewUrl !== nextUrl) {
        URL.revokeObjectURL(currentPreviewUrl)
      }

      previewObjectUrlRef.current = nextUrl
      setPreviewGameUrl(nextUrl)
    }

    const buildPreview = async () => {
      if (gameSourceMode === "paste") {
        const html = pastedGameHtml.trim()
        if (!html) {
          setUrl(null)
          return
        }

        const blob = new Blob([injectPreviewCaptureBridgeIntoHtml(html)], {
          type: "text/html;charset=utf-8",
        })
        setUrl(URL.createObjectURL(blob))
        return
      }

      if (!gameFile || !gameFile.name.toLowerCase().endsWith(".html")) {
        setUrl(null)
        return
      }

      try {
        const html = await gameFile.text()
        if (cancelled) {
          return
        }

        const blob = new Blob([injectPreviewCaptureBridgeIntoHtml(html)], {
          type: "text/html;charset=utf-8",
        })
        setUrl(URL.createObjectURL(blob))
      } catch {
        setUrl(null)
      }
    }

    void buildPreview()

    return () => {
      cancelled = true
    }
  }, [gameFile, gameSourceMode, pastedGameHtml])

  useEffect(() => {
    return () => {
      if (previewObjectUrlRef.current) {
        URL.revokeObjectURL(previewObjectUrlRef.current)
        previewObjectUrlRef.current = null
      }
      clearUploadStageTimers()
    }
  }, [clearUploadStageTimers])

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push(`/login?callbackUrl=${encodeURIComponent(currentPathWithQuery)}`)
    }
  }, [status, router, currentPathWithQuery])

  useEffect(() => {
    const loadStudioProfiles = async () => {
      if (!session?.user?.id) return

      try {
        const res = await fetch("/api/studio-profiles")
        const data = await res.json()
        if (!res.ok) {
          throw new Error(data.error || "Failed to load studio profiles")
        }
        setStudioProfiles(Array.isArray(data.profiles) ? data.profiles : [])
      } catch {
        // Non-blocking. Upload still works as normal.
      }
    }

    loadStudioProfiles()
  }, [session?.user?.id, session?.user?.role])

  useEffect(() => {
    let cancelled = false

    const loadActiveJams = async () => {
      setLoadingJams(true)
      setJamLoadError("")

      try {
        const res = await fetch("/api/jams", { cache: "no-store" })
        const data = await res.json()

        if (!res.ok) {
          throw new Error(data.error || "Failed to load jams")
        }

        const jams: ActiveJamOption[] = Array.isArray(data.active)
          ? data.active.map((jam: ActiveJamOption) => ({
              id: jam.id,
              slug: jam.slug,
              title: jam.title,
              theme: jam.theme,
              endDate: jam.endDate,
              maxEntries: jam.maxEntries,
              userEntryCount: jam.userEntryCount,
              remainingEntries: jam.remainingEntries,
              isEligibleToSubmit: jam.isEligibleToSubmit,
            }))
          : []

        if (cancelled) {
          return
        }

        setActiveJams(jams)

        if (jamQuerySlug && !jamQueryAppliedRef.current) {
          jamQueryAppliedRef.current = true
          const preselectedJam = jams.find((jam) => jam.slug === jamQuerySlug)
          if (preselectedJam) {
            setSelectedJamSlug(preselectedJam.slug)
            setJamSelectionNotice("")
          } else {
            setJamSelectionNotice("That jam is not actively accepting direct submissions right now. You can still publish normally or choose another active jam.")
          }
        }
      } catch {
        if (!cancelled) {
          setJamLoadError("Couldn't load active game jams right now. You can still publish normally.")
        }
      } finally {
        if (!cancelled) {
          setLoadingJams(false)
        }
      }
    }

    loadActiveJams()

    return () => {
      cancelled = true
    }
  }, [jamQuerySlug])

  const onDropGame = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0]
    if (file) {
      if (file.name.endsWith(".zip") || file.name.endsWith(".html")) {
        setGameSourceMode("upload")
        setGameFile(file)
        setError("")
      } else {
        setError("Please upload a .zip file containing your game or a single .html file")
      }
    }
  }, [])

  const onDropThumbnail = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0]
    if (file) {
      if (file.type.startsWith("image/")) {
        setThumbnailFile(file)
        const reader = new FileReader()
        reader.onload = (e) => setThumbnailPreview(e.target?.result as string)
        reader.readAsDataURL(file)
      } else {
        setError("Please upload an image file for the thumbnail")
      }
    }
  }, [])

  const { getRootProps: getGameRootProps, getInputProps: getGameInputProps, isDragActive: isGameDragActive } = useDropzone({
    onDrop: onDropGame,
    accept: {
      "application/zip": [".zip"],
      "text/html": [".html"],
    },
    maxFiles: 1,
    maxSize: 50 * 1024 * 1024, // 50MB
    disabled: uploading || autoThumbnailState === "capturing",
  })

  const { getRootProps: getThumbnailRootProps, getInputProps: getThumbnailInputProps } = useDropzone({
    onDrop: onDropThumbnail,
    accept: {
      "image/*": [".png", ".jpg", ".jpeg", ".gif", ".webp"],
    },
    maxFiles: 1,
    maxSize: 5 * 1024 * 1024, // 5MB
    disabled: uploading || autoThumbnailState === "capturing",
  })

  const hasGameSource = useMemo(() => {
    if (gameSourceMode === "paste") {
      return pastedGameHtml.trim().length > 0
    }

    return Boolean(gameFile)
  }, [gameFile, gameSourceMode, pastedGameHtml])

  const previewSourceDescription = useMemo(() => {
    if (gameSourceMode === "paste") {
      return pastedGameHtml.trim()
        ? "Previewing pasted HTML"
        : "Paste your HTML code to unlock preview and auto thumbnails."
    }

    if (!gameFile) {
      return "Upload a .zip or .html game file to continue."
    }

    if (gameFile.name.toLowerCase().endsWith(".html")) {
      return `Previewing ${gameFile.name}`
    }

    return `ZIP selected: ${gameFile.name}. Preview is available for single .html files or pasted HTML.`
  }, [gameFile, gameSourceMode, pastedGameHtml])

  const thumbnailStatusLabel =
    autoThumbnailImages.length > 0
      ? `${autoThumbnailImages.length} auto screenshot${autoThumbnailImages.length === 1 ? "" : "s"} ready`
      : thumbnailPreview
        ? "Manual thumbnail uploaded"
        : "No thumbnail selected yet"

  const startAutoThumbnailCapture = useCallback(() => {
    if (!previewGameUrl || !previewPlayerRef.current || autoThumbnailState === "capturing") {
      return
    }

    setAutoThumbnailImages([])
    setAutoThumbnailState("capturing")
    setAutoThumbnailMessage(
      "Your browser may ask to share this tab. Keep the game running while screenshots are captured."
    )
    void previewPlayerRef.current.startAutoThumbnailCapture()
  }, [autoThumbnailState, previewGameUrl])

  const handleAutoThumbnailCaptureProgress = useCallback(({ captured, total }: { captured: number; total: number }) => {
    setAutoThumbnailState("capturing")
    setAutoThumbnailMessage(`Captured ${captured}/${total} screenshots. Keep playing until the capture finishes.`)
  }, [])

  const handleAutoThumbnailCaptureComplete = useCallback((images: string[]) => {
    setAutoThumbnailImages(images)
    setAutoThumbnailState(images.length > 0 ? "ready" : "error")
    setAutoThumbnailMessage(
      images.length > 0
        ? `Captured ${images.length} screenshot${images.length === 1 ? "" : "s"}. They will be uploaded with your game.`
        : "No screenshots were captured."
    )
  }, [])

  const handleAutoThumbnailCaptureError = useCallback((message: string) => {
    setAutoThumbnailImages([])
    setAutoThumbnailState("error")
    setAutoThumbnailMessage(message)
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setUploadWarnings([])
    setUploading(true)
    setUploadStage("uploading")

    try {
      if (!session?.user?.id) {
        throw new Error("Unauthorized")
      }

      const sourceGameHtml = gameSourceMode === "paste" ? pastedGameHtml.trim() : ""
      const effectiveGameFile = gameSourceMode === "upload" ? gameFile : null

      if (!effectiveGameFile && !sourceGameHtml) {
        setError(gameSourceMode === "paste" ? "Please paste your HTML code" : "Please upload your game file")
        setUploading(false)
        return
      }

      if (selectedJam && !selectedJam.isEligibleToSubmit) {
        setError("This jam cannot accept another entry from you right now. Deselect it to publish normally or choose another active jam.")
        setUploading(false)
        setUploadStage("idle")
        return
      }

      clearUploadStageTimers()
      uploadStageTimeoutsRef.current.push(window.setTimeout(() => setUploadStage("publishing"), 400))
      if (selectedJamSlug) {
        uploadStageTimeoutsRef.current.push(window.setTimeout(() => setUploadStage("submittingJam"), 1200))
      }

      const uploadData = new FormData()
      if (effectiveGameFile) {
        uploadData.append("gameFile", effectiveGameFile)
      }
      if (sourceGameHtml) {
        uploadData.append("gameHtml", sourceGameHtml)
      }
      if (thumbnailFile) {
        uploadData.append("thumbnail", thumbnailFile)
      }

      uploadData.append("title", formData.title)
      uploadData.append("description", formData.description)
      uploadData.append("instructions", formData.instructions)
      uploadData.append("category", formData.category)
      uploadData.append("tags", formData.tags)
      uploadData.append("aiTool", formData.aiTool)
      uploadData.append("aiModel", formData.aiModel.trim())
      uploadData.append("supportsMobile", String(formData.supportsMobile))
      uploadData.append("mobileOrientation", formData.mobileOrientation)
      uploadData.append("hasLevelEditor", String(formData.hasLevelEditor))
      uploadData.append("hasGhostSharing", String(formData.hasGhostSharing))
      uploadData.append("seekingFeedback", String(formData.seekingFeedback))
      uploadData.append("latestUpdateNote", formData.latestUpdateNote)
      uploadData.append("isAIGenerated", String(formData.isAIGenerated))
      if (selectedJamSlug) {
        uploadData.append("jamSlug", selectedJamSlug)
      }
      if (formData.studioProfileId) {
        uploadData.append("studioProfileId", formData.studioProfileId)
      }

      const res = await fetch("/api/upload", {
        method: "POST",
        body: uploadData,
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || "Upload failed")
      }

      const warnings = Array.isArray(data.warnings)
        ? data.warnings.filter((item: unknown): item is string => typeof item === "string")
        : []

      if (autoThumbnailImages.length > 0 && data.game?.id) {
        try {
          const payloadImages = await Promise.all(
            autoThumbnailImages.map((image) => buildResponsiveSlidePayload(image))
          )

          const thumbnailRes = await fetch(`/api/games/${data.game.id}/thumbnail-slides`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ images: payloadImages }),
          })
          const thumbnailData = await thumbnailRes.json()

          if (!thumbnailRes.ok) {
            throw new Error(thumbnailData.error || "Failed to save auto thumbnails")
          }
        } catch (thumbnailError) {
          warnings.push(
            thumbnailError instanceof Error
              ? `Auto thumbnails were not saved: ${thumbnailError.message}`
              : "Auto thumbnails were not saved."
          )
        }
      }

      setUploadWarnings(warnings)
      setCreatedGame(
        data.game
          ? {
              ...data.game,
              submittedJam: data.jamSubmission || null,
            }
          : null
      )
      clearSavedDraft()
      setUploadStage("done")

      setSuccess(true)
      if (warnings.length === 0) {
        const nextPath = data.jamSubmission ? `/jams/${data.jamSubmission.slug}` : "/creator"
        setTimeout(() => {
          router.push(nextPath)
        }, 2000)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong")
      setUploadStage("idle")
    } finally {
      clearUploadStageTimers()
      setUploading(false)
    }
  }

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[var(--color-primary)]" />
      </div>
    )
  }

  if (!session) {
    return null
  }

  if (success) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center px-4">
          <Card className="max-w-2xl w-full">
            <CardContent className="pt-6">
              <CheckCircle className="h-16 w-16 text-[var(--color-success)] mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-[var(--color-text)] mb-2 text-center">Your Game is Live! Let&apos;s Go!</h2>

              {createdGame?.submittedJam && (
                <div className="mt-4 rounded-md border border-[var(--color-primary)] bg-[var(--color-primary)]/10 p-3 text-sm text-[var(--color-text)]">
                  Submitted to <span className="font-semibold">{createdGame.submittedJam.title}</span>.
                </div>
              )}

              {uploadWarnings.length > 0 && (
                <div className="mt-4 rounded-md border border-[var(--color-primary)] bg-[var(--color-primary)]/10 p-3 text-xs text-[var(--color-text)]">
                  {uploadWarnings.map((warning) => (
                    <p key={warning}>{warning}</p>
                  ))}
                </div>
              )}

              <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                {createdGame && (
                  <Button className="w-full" onClick={() => router.push(`/play/${createdGame.slug}`)}>
                    Open Play Page
                  </Button>
                )}
                {createdGame?.submittedJam && (
                  <Button variant="outline" className="w-full" onClick={() => router.push(`/jams/${createdGame.submittedJam!.slug}`)}>
                    Open Jam Page
                  </Button>
                )}
                <Button variant="outline" className="w-full" onClick={() => router.push("/creator")}>
                  Go to Dashboard
                </Button>
              </div>
            </CardContent>
          </Card>
        </main>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1 container mx-auto px-4 py-6 sm:py-8">
        <div className="max-w-5xl mx-auto">
          {/* Page Header */}
          <div className="mb-8 overflow-hidden rounded-[28px] border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(125,92,255,0.16),transparent_35%),radial-gradient(circle_at_80%_20%,rgba(0,196,255,0.12),transparent_24%),linear-gradient(180deg,rgba(14,18,32,0.96),rgba(10,14,24,0.98))] p-6 shadow-[0_18px_60px_rgba(5,10,24,0.22)] sm:p-8">
            <h1 className="flex items-center gap-3 text-3xl font-semibold text-white sm:text-4xl">
              <Upload className="h-6 w-6 text-[var(--color-primary)]" />
              Upload Your Game
            </h1>
            <p className="text-[var(--color-text-secondary)] mt-2">
              Share your AI-made HTML5 game with the world
            </p>
            {draftNotice && (
              <div className="mt-4 flex flex-col gap-3 rounded-md border border-[var(--color-primary)] bg-[var(--color-primary)]/10 p-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-[var(--color-text)]">{draftNotice}</p>
                <Button type="button" variant="outline" size="sm" onClick={clearSavedDraft}>
                  Clear saved draft
                </Button>
              </div>
            )}
            {selectedJam && (
              <div className="mt-4 rounded-lg border border-[var(--color-primary)] bg-[var(--color-primary)]/10 p-4">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm font-medium text-[var(--color-text)]">Publishing into {selectedJam.title}</p>
                    <p className="text-xs text-[var(--color-text-secondary)]">
                      {selectedJam.theme ? `Theme: ${selectedJam.theme}. ` : ""}This game will be submitted automatically after publish.
                    </p>
                  </div>
                  <Link href={`/jams/${selectedJam.slug}`} className="text-sm text-[var(--color-primary)] hover:underline">
                    View jam details
                  </Link>
                </div>
              </div>
            )}
            {jamSelectionNotice && (
              <div className="mt-4 rounded-md border border-[var(--color-warning)] bg-[var(--color-warning)]/10 p-3 text-sm text-[var(--color-text)]">
                {jamSelectionNotice}
              </div>
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="p-4 rounded-md bg-[var(--color-danger)]/10 border border-[var(--color-danger)] text-[var(--color-danger)] flex items-center gap-3 text-sm">
                <AlertCircle className="h-5 w-5 flex-shrink-0" />
                {error}
              </div>
            )}

            {uploading && (
              <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-base)] p-4">
                <p className="text-sm font-semibold text-[var(--color-text)]">Publishing pipeline</p>
                <div className="mt-3 grid gap-2 sm:grid-cols-4">
                  {[
                    { id: "uploading", label: "Uploading files" },
                    { id: "publishing", label: "Publishing game" },
                    ...(selectedJamSlug ? [{ id: "submittingJam", label: "Submitting to jam" }] : []),
                    { id: "done", label: "Done" },
                  ].map((step, index, allSteps) => {
                    const stepIndex = allSteps.findIndex((item) => item.id === step.id)
                    const activeIndex = allSteps.findIndex((item) => item.id === uploadStage)
                    const isDone = activeIndex > stepIndex || uploadStage === "done"
                    const isActive = uploadStage === step.id

                    return (
                      <div
                        key={step.id}
                        className={`rounded border px-3 py-2 text-xs ${
                          isActive
                            ? "border-[var(--color-primary)] bg-[var(--color-primary)]/10 text-[var(--color-primary)]"
                            : isDone
                              ? "border-[var(--color-success)] bg-[var(--color-success)]/10 text-[var(--color-success)]"
                              : "border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-tertiary)]"
                        }`}
                      >
                        {step.label}
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Code2 className="h-5 w-5 text-[var(--color-primary)]" />
                  Game Source
                </CardTitle>
                <CardDescription>
                  Upload a .zip file, upload a single .html file, or paste your HTML code directly.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Tabs
                  value={gameSourceMode}
                  onValueChange={(value) => setGameSourceMode(value as GameSourceMode)}
                  className="space-y-4"
                >
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="upload" disabled={uploading || autoThumbnailState === "capturing"}>
                      <Upload className="mr-2 h-4 w-4" />
                      Upload File
                    </TabsTrigger>
                    <TabsTrigger value="paste" disabled={uploading || autoThumbnailState === "capturing"}>
                      <Code2 className="mr-2 h-4 w-4" />
                      Paste HTML
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="upload" className="mt-0 space-y-3">
                    <div
                      {...getGameRootProps()}
                      className={`border-2 border-dashed rounded-lg p-5 sm:p-8 text-center cursor-pointer transition-all ${
                        isGameDragActive
                          ? "border-[var(--color-primary)] bg-[var(--color-primary)]/5"
                          : gameFile
                            ? "border-[var(--color-success)] bg-[var(--color-success)]/5"
                            : "border-[var(--color-border)] hover:border-[var(--color-primary)]"
                      }`}
                    >
                      <input {...getGameInputProps()} />
                      {gameFile ? (
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                          <FileArchive className="h-10 w-10 text-[var(--color-success)]" />
                          <div className="text-center sm:text-left min-w-0">
                            <p className="font-medium text-[var(--color-text)]">{gameFile.name}</p>
                            <p className="text-sm text-[var(--color-text-secondary)]">
                              {(gameFile.size / 1024 / 1024).toFixed(2)} MB
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation()
                              setGameFile(null)
                            }}
                            className="p-1 text-[var(--color-text-tertiary)] hover:text-[var(--color-text)]"
                          >
                            <X className="h-5 w-5" />
                          </button>
                        </div>
                      ) : (
                        <>
                          <Upload className="h-12 w-12 text-[var(--color-text-tertiary)] mx-auto mb-4" />
                          <p className="text-[var(--color-text)] mb-2">
                            Drag & drop your game file here, or click to browse
                          </p>
                          <p className="text-sm text-[var(--color-text-tertiary)]">
                            Max file size: 50MB | Supported: .zip, .html
                          </p>
                        </>
                      )}
                    </div>

                    <p className="text-xs text-[var(--color-text-secondary)]">
                      ZIP uploads work for complete projects. Preview and auto thumbnails are available for pasted HTML or a single .html file.
                    </p>
                  </TabsContent>

                  <TabsContent value="paste" className="mt-0 space-y-3">
                    <div className="space-y-2">
                      <Label htmlFor="pasted-html">Paste HTML code</Label>
                      <Textarea
                        id="pasted-html"
                        value={pastedGameHtml}
                        onChange={(e) => setPastedGameHtml(e.target.value)}
                        placeholder="Paste your full index.html here..."
                        className="min-h-[260px] font-mono text-xs"
                        disabled={uploading || autoThumbnailState === "capturing"}
                      />
                      <p className="text-xs text-[var(--color-text-secondary)]">
                        Paste a complete HTML document for the best preview. If your game depends on local assets, ZIP upload is still the safest option.
                      </p>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MonitorPlay className="h-5 w-5 text-[var(--color-primary)]" />
                  Preview & Auto Thumbnails
                </CardTitle>
                <CardDescription>{previewSourceDescription}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {previewGameUrl ? (
                  <>
                    <GamePlayer
                      key={previewGameUrl}
                      ref={previewPlayerRef}
                      title={formData.title || "Game Preview"}
                      gameUrl={previewGameUrl}
                      runtimeLabel="LOCAL PREVIEW"
                      mode="preview"
                      onAutoThumbnailCaptureProgress={handleAutoThumbnailCaptureProgress}
                      onAutoThumbnailCaptureComplete={handleAutoThumbnailCaptureComplete}
                      onAutoThumbnailCaptureError={handleAutoThumbnailCaptureError}
                    />

                    <div className="flex flex-col gap-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-base)] p-4 sm:flex-row sm:items-center sm:justify-between">
                      <div className="space-y-1">
                        <p className="text-sm font-medium text-[var(--color-text)]">Auto thumbnails</p>
                        <p className="text-xs text-[var(--color-text-secondary)]">{autoThumbnailMessage}</p>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        <Button
                          type="button"
                          variant={autoThumbnailState === "ready" ? "outline" : "default"}
                          className="gap-2"
                          onClick={startAutoThumbnailCapture}
                          disabled={!previewGameUrl || uploading || autoThumbnailState === "capturing"}
                        >
                          {autoThumbnailState === "capturing" ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Camera className="h-4 w-4" />
                          )}
                          {autoThumbnailState === "ready" ? "Recapture" : "Capture"}
                        </Button>

                        {autoThumbnailImages.length > 0 && (
                          <Button
                            type="button"
                            variant="outline"
                            className="gap-2"
                            onClick={() => {
                              setAutoThumbnailImages([])
                              setAutoThumbnailState("idle")
                              setAutoThumbnailMessage(
                                "Capture 5 live screenshots from the preview. We'll keep the preview in this tab while the browser shares the game."
                              )
                            }}
                            disabled={uploading}
                          >
                            Clear
                          </Button>
                        )}
                      </div>
                    </div>

                    {autoThumbnailImages.length > 0 && (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between gap-3">
                          <p className="text-sm font-medium text-[var(--color-text)]">Captured thumbnails</p>
                          <p className="text-xs text-[var(--color-text-secondary)]">
                            {autoThumbnailImages.length} screenshot{autoThumbnailImages.length === 1 ? "" : "s"} ready for upload
                          </p>
                        </div>
                        <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
                          {autoThumbnailImages.map((image, index) => (
                            <div
                              key={`${index}-${image.slice(0, 32)}`}
                              className="overflow-hidden rounded-md border border-[var(--color-border)] bg-[var(--color-surface)]"
                            >
                              <Image
                                src={image}
                                alt={`Auto thumbnail ${index + 1}`}
                                width={640}
                                height={360}
                                unoptimized
                                className="h-full w-full object-cover"
                              />
                            </div>
                          ))}
                        </div>
                        <p className="text-xs text-[var(--color-text-secondary)]">
                          These captured shots will be uploaded as a thumbnail slideshow when you publish.
                        </p>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-[var(--color-border)] bg-[var(--color-base)] px-6 py-10 text-center">
                    <Sparkles className="h-10 w-10 text-[var(--color-text-tertiary)]" />
                    <p className="mt-3 text-sm font-medium text-[var(--color-text)]">
                      Preview appears here once you upload a single .html file or paste your HTML code.
                    </p>
                    <p className="mt-2 max-w-xl text-xs text-[var(--color-text-secondary)]">
                      ZIP uploads still publish normally. If you want preview and auto thumbnails, switch to Paste HTML or upload a standalone .html file.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Game Details */}
            <Card className="border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.03),rgba(255,255,255,0.01))] shadow-[0_18px_50px_rgba(5,10,24,0.16)]">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-[var(--color-primary)]" />
                  Game Details
                </CardTitle>
                <CardDescription>Tell players about your game</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Game Title *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="My Awesome Game"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label>Description *</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Describe your game, what makes it fun, and how to play..."
                    className="min-h-[120px]"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label>How to Play (optional)</Label>
                  <Textarea
                    id="instructions"
                    value={formData.instructions}
                    onChange={(e) => setFormData({ ...formData, instructions: e.target.value })}
                    placeholder="Controls: Arrow keys to move, Space to jump..."
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Category *</Label>
                    <Select
                      value={formData.category}
                      onValueChange={(value) => setFormData({ ...formData, category: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {CATEGORIES.map((cat) => (
                          <SelectItem key={cat.value} value={cat.value}>
                            {cat.icon} {cat.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>AI Tool Used</Label>
                    <Select
                      value={formData.aiTool}
                      onValueChange={(value) => setFormData({ ...formData, aiTool: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select AI tool" />
                      </SelectTrigger>
                      <SelectContent>
                        {AI_TOOLS.map((tool) => (
                          <SelectItem key={tool.value} value={tool.value}>
                            {tool.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>AI Model Used</Label>
                    <Select
                      value={formData.aiModel}
                      onValueChange={(value) => setFormData({ ...formData, aiModel: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select AI model" />
                      </SelectTrigger>
                      <SelectContent>
                        {AI_MODELS.map((model) => (
                          <SelectItem key={model.value} value={model.value}>
                            {model.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Game Jam</Label>
                    <Select
                      value={selectedJamSlug || "__none__"}
                      onValueChange={(value) => {
                        setSelectedJamSlug(value === "__none__" ? "" : value)
                        setJamSelectionNotice("")
                      }}
                      disabled={loadingJams}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={loadingJams ? "Loading active jams..." : "No jam selected"} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__none__">No jam selected</SelectItem>
                        {activeJams.map((jam) => (
                          <SelectItem key={jam.slug} value={jam.slug}>
                            {jam.theme ? `${jam.title} - ${jam.theme}` : jam.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-[var(--color-text-secondary)]">
                      Choose an active jam to auto-submit this game as soon as it is published.
                    </p>
                    {jamLoadError && (
                      <p className="text-xs text-[var(--color-danger)]">{jamLoadError}</p>
                    )}
                  </div>
                </div>

                {selectedJam && (
                  <div className="rounded-md border border-[var(--color-border)] bg-[var(--color-base)] p-3">
                    <div className="flex items-start gap-3">
                      <Trophy className="mt-0.5 h-4 w-4 text-[var(--color-primary)]" />
                      <div className="space-y-1">
                        <p className="text-sm font-medium text-[var(--color-text)]">{selectedJam.title}</p>
                        <p className="text-xs text-[var(--color-text-secondary)]">
                          {selectedJam.theme ? `Theme: ${selectedJam.theme}. ` : ""}
                          Submissions close on {new Date(selectedJam.endDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}.
                        </p>
                        <p className="text-xs text-[var(--color-text-tertiary)]">
                          You have used {selectedJam.userEntryCount} of {selectedJam.maxEntries} {selectedJam.maxEntries === 1 ? "slot" : "slots"}. {selectedJam.remainingEntries} left.
                        </p>
                        <p className={`text-xs ${selectedJam.isEligibleToSubmit ? "text-[var(--color-success)]" : "text-[var(--color-warning)]"}`}>
                          {selectedJam.isEligibleToSubmit ? "Eligible for auto-submission right now." : "This jam will not accept another entry from you right now."}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <Label>Tags (comma-separated)</Label>
                  <Input
                    id="tags"
                    value={formData.tags}
                    onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                    placeholder="platformer, retro, fun, easy"
                  />
                </div>

                <div className="rounded-md border border-[var(--color-border)] bg-[var(--color-base)] p-3">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.supportsMobile}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          supportsMobile: e.target.checked,
                          mobileOrientation: e.target.checked ? formData.mobileOrientation : "BOTH",
                        })
                      }
                      className="h-4 w-4 rounded border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-primary)] focus:ring-[var(--color-primary)]"
                    />
                    <div>
                      <p className="text-sm font-medium text-[var(--color-text)]">Supports mobile devices</p>
                      <p className="text-xs text-[var(--color-text-secondary)]">Show players that this game is playable on mobile</p>
                    </div>
                  </label>
                </div>

                {formData.supportsMobile && (
                  <div className="space-y-2 rounded-md border border-[var(--color-border)] bg-[var(--color-base)] p-3">
                    <Label>Mobile orientation</Label>
                    <Select
                      value={formData.mobileOrientation}
                      onValueChange={(value) =>
                        setFormData({
                          ...formData,
                          mobileOrientation: value,
                        })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Choose orientation support" />
                      </SelectTrigger>
                      <SelectContent>
                        {MOBILE_ORIENTATION_OPTIONS.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-[var(--color-text-secondary)]">
                      Choose whether the fullscreen game should run in portrait, landscape, or both on mobile.
                    </p>
                  </div>
                )}

                <details className="rounded-lg border border-[var(--color-border)] bg-[var(--color-base)]">
                  <summary className="cursor-pointer list-none px-4 py-3">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-medium text-[var(--color-text)]">Advanced Settings</p>
                        <p className="text-xs text-[var(--color-text-secondary)]">
                          Optional discovery, creator, and community features.
                        </p>
                      </div>
                      <span className="text-xs text-[var(--color-text-tertiary)]">Optional</span>
                    </div>
                  </summary>

                  <div className="space-y-4 border-t border-[var(--color-border)] px-4 py-4">
                    {session.user.id && (
                      <div className="space-y-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
                        <div className="flex flex-col gap-1">
                          <Label>Publish as</Label>
                          <p className="text-xs text-[var(--color-text-tertiary)]">
                            Studio profiles let you publish games under a saved brand name.
                          </p>
                        </div>

                        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                          <div className="space-y-2">
                            <Label>Studio profile (optional)</Label>
                            <Select
                              value={formData.studioProfileId}
                              onValueChange={(value) =>
                                setFormData((prev) => ({
                                  ...prev,
                                  studioProfileId: value === "__none__" ? "" : value,
                                }))
                              }
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Your account" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="__none__">Your account</SelectItem>
                                {studioProfiles.map((p) => (
                                  <SelectItem key={p.id} value={p.id}>
                                    {p.displayName} (@{p.handle})
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="space-y-2">
                            <Label>Create new studio</Label>
                            <div className="flex gap-2">
                              <Button
                                type="button"
                                variant="outline"
                                className="w-full"
                                onClick={async () => {
                                  setStudioError("")
                                  setCreatingStudio(true)
                                  try {
                                    const res = await fetch("/api/studio-profiles", {
                                      method: "POST",
                                      headers: { "Content-Type": "application/json" },
                                      body: JSON.stringify({
                                        displayName: newStudio.displayName,
                                        handle: newStudio.handle || undefined,
                                      }),
                                    })
                                    const data = await res.json()
                                    if (!res.ok) {
                                      throw new Error(data.message || data.error || "Failed to create studio")
                                    }

                                    const created = data.profile
                                    setStudioProfiles((prev) => [created, ...prev])
                                    setFormData((prev) => ({ ...prev, studioProfileId: created.id }))
                                    setNewStudio({ displayName: "", handle: "" })
                                  } catch (err) {
                                    setStudioError(err instanceof Error ? err.message : "Failed to create studio")
                                  } finally {
                                    setCreatingStudio(false)
                                  }
                                }}
                                disabled={creatingStudio || !newStudio.displayName.trim()}
                              >
                                {creatingStudio ? "Creating..." : "Create"}
                              </Button>
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                          <div className="space-y-2">
                            <Label>Studio display name</Label>
                            <Input
                              value={newStudio.displayName}
                              onChange={(e) => setNewStudio({ ...newStudio, displayName: e.target.value })}
                              placeholder="e.g. Neon Arcade Labs"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Studio handle (optional)</Label>
                            <Input
                              value={newStudio.handle}
                              onChange={(e) => setNewStudio({ ...newStudio, handle: e.target.value })}
                              placeholder="e.g. neon-arcade"
                            />
                          </div>
                        </div>

                        {studioError && (
                          <div className="text-sm text-[var(--color-danger)]">{studioError}</div>
                        )}
                      </div>
                    )}

                    <div className="space-y-2">
                      <Label>Launch / update note</Label>
                      <Textarea
                        value={formData.latestUpdateNote}
                        onChange={(e) => setFormData({ ...formData, latestUpdateNote: e.target.value })}
                        placeholder="What changed, what should players notice, or what kind of feedback do you want?"
                        maxLength={280}
                      />
                      <p className="text-xs text-[var(--color-text-tertiary)]">
                        Shown on the play page and creator portfolio so your profile feels active.
                      </p>
                    </div>

                    <div className="rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] p-3">
                      <label className="flex items-center gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.seekingFeedback}
                          onChange={(e) => setFormData({ ...formData, seekingFeedback: e.target.checked })}
                          className="h-4 w-4 rounded border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-primary)] focus:ring-[var(--color-primary)]"
                        />
                        <div>
                          <p className="text-sm font-medium text-[var(--color-text)]">Put this in the feedback lane</p>
                          <p className="text-xs text-[var(--color-text-secondary)]">Only one of your games can be marked this way at a time, which helps smaller launches get eyes quickly.</p>
                        </div>
                      </label>
                    </div>

                    <div className="rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] p-3">
                      <label className="flex items-center gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.hasLevelEditor}
                          onChange={(e) => setFormData({ ...formData, hasLevelEditor: e.target.checked })}
                          className="h-4 w-4 rounded border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-primary)] focus:ring-[var(--color-primary)]"
                        />
                        <div>
                          <p className="text-sm font-medium text-[var(--color-text)]">Community level editor</p>
                          <p className="text-xs text-[var(--color-text-secondary)]">Turn this game into a remixable playground where players can build, save, rate, and share custom levels.</p>
                        </div>
                      </label>
                    </div>

                    {formData.hasLevelEditor && (
                      <div className="space-y-2">
                        <p className="text-xs text-[var(--color-text-secondary)]">
                          Level editor is for games where players should build and share custom stages.
                        </p>
                        <LevelEditorSetupGuide />
                      </div>
                    )}

                    <div className="rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] p-3">
                      <label className="flex items-center gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.hasGhostSharing}
                          onChange={(e) => setFormData({ ...formData, hasGhostSharing: e.target.checked })}
                          className="h-4 w-4 rounded border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-primary)] focus:ring-[var(--color-primary)]"
                        />
                        <div>
                          <p className="text-sm font-medium text-[var(--color-text)]">Ghost races + time leaderboard</p>
                          <p className="text-xs text-[var(--color-text-secondary)]">Best for games that can deterministically replay a run from structured data. Players can race ghosts and climb a time board.</p>
                        </div>
                      </label>
                    </div>

                    {formData.hasGhostSharing && (
                      <div className="space-y-2">
                        <p className="text-xs text-[var(--color-text-secondary)]">
                          Ghost races are separate from level editor and work for any game with deterministic replay data.
                        </p>
                        <GhostSharingSetupGuide />
                      </div>
                    )}
                  </div>
                </details>
              </CardContent>
            </Card>

            {/* Thumbnail */}
            <Card className="border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.03),rgba(255,255,255,0.01))] shadow-[0_18px_50px_rgba(5,10,24,0.16)]">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Camera className="h-5 w-5 text-[var(--color-primary)]" />
                  Thumbnail
                </CardTitle>
                <CardDescription>
                  Upload an eye-catching image for your game (recommended: 800x450px). If you captured auto thumbnails, they will take priority when you publish.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div
                  {...getThumbnailRootProps()}
                  className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-all ${
                    thumbnailPreview
                      ? "border-[var(--color-success)]"
                      : "border-[var(--color-border)] hover:border-[var(--color-primary)]"
                  }`}
                >
                  <input {...getThumbnailInputProps()} />
                  {thumbnailPreview ? (
                    <div className="relative inline-block">
                      <Image
                        src={thumbnailPreview}
                        alt={`Thumbnail preview for ${formData.title || "your game"}`}
                        width={800}
                        height={450}
                        unoptimized
                        className="max-h-48 mx-auto rounded-md border border-[var(--color-border)]"
                      />
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          setThumbnailFile(null)
                          setThumbnailPreview(null)
                        }}
                        className="absolute top-2 right-2 p-1 bg-[var(--color-surface)] rounded-md border border-[var(--color-border)] text-[var(--color-text-tertiary)] hover:text-[var(--color-text)]"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ) : (
                    <>
                      <Upload className="h-8 w-8 text-[var(--color-text-tertiary)] mx-auto mb-2" />
                      <p className="text-[var(--color-text-secondary)] text-sm">Click or drag to upload thumbnail</p>
                    </>
                  )}
                </div>
                <p className="mt-3 text-xs text-[var(--color-text-secondary)]">
                  Thumbnail status: {thumbnailStatusLabel}
                </p>
                {autoThumbnailImages.length > 0 && (
                  <p className="mt-2 text-xs text-[var(--color-text-secondary)]">
                    Auto thumbnails are ready, so the slideshow from the preview will be used on publish.
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Actions */}
            <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3">
              <Button type="button" variant="outline" onClick={() => router.back()} className="w-full sm:w-auto">
                Cancel
              </Button>
              <Button type="submit" disabled={uploading || !hasGameSource || autoThumbnailState === "capturing"} className="w-full sm:w-auto">
                {uploading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    Publish Game
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>
      </main>
      
      <Footer />
    </div>
  )
}
