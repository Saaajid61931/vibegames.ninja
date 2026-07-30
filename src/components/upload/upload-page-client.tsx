"use client"

import { useState, useCallback, useEffect, useMemo, useRef } from "react"
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
} from "lucide-react"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { GamePlayer, type GamePlayerHandle } from "@/components/games/game-player"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { GhostSharingSetupGuide } from "@/components/games/ghost-sharing-setup-guide"
import { LevelEditorSetupGuide } from "@/components/games/level-editor-setup-guide"
import { MOBILE_ORIENTATION_OPTIONS } from "@/lib/mobile-orientation"
import { CATEGORIES } from "@/lib/utils"

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
      <div className="vg-shell flex min-h-screen flex-col">
        <Header />
        <main className="flex flex-1 items-center justify-center px-4 py-10">
          <section className="vg-panel w-full max-w-2xl p-6 text-center sm:p-8">
            <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl border border-[#22c55e]/40 bg-[#22c55e]/10 text-[#6ee7a0]">
              <CheckCircle className="h-7 w-7" />
            </span>
            <span className="vg-kicker mt-6 text-[#6ee7a0]">Published</span>
            <h1 className="mt-4 text-3xl font-bold text-white">
              {createdGame?.title || "Your game"} is live
            </h1>
            <p className="mx-auto mt-3 max-w-lg text-sm leading-6 text-[var(--color-text-secondary)]">
              Players can now discover, play, like, and share your game.
            </p>

            {createdGame?.submittedJam ? (
              <div className="mt-5 rounded-xl border border-[#22c55e]/30 bg-[#22c55e]/5 p-3 text-sm text-[#7ee2a8]">
                Submitted to {createdGame.submittedJam.title}
              </div>
            ) : null}

            {uploadWarnings.length > 0 ? (
              <div className="mt-5 rounded-xl border border-[#facc15]/30 bg-[#facc15]/5 p-4 text-left text-sm text-[#f8dd72]">
                <p className="font-semibold">Published with a few notes</p>
                <ul className="mt-2 list-disc space-y-1 pl-5">
                  {uploadWarnings.map((warning) => (
                    <li key={warning}>{warning}</li>
                  ))}
                </ul>
              </div>
            ) : null}

            <div className="mt-7 flex flex-col justify-center gap-2 sm:flex-row">
              {createdGame ? (
                <Button onClick={() => router.push("/play/" + createdGame.slug)}>
                  Play your game
                </Button>
              ) : null}
              {createdGame?.submittedJam ? (
                <Button
                  variant="outline"
                  onClick={() => router.push("/jams/" + createdGame.submittedJam!.slug)}
                >
                  View jam entry
                </Button>
              ) : null}
              <Button variant="outline" onClick={() => router.push("/creator")}>
                Creator studio
              </Button>
            </div>
          </section>
        </main>
        <Footer />
      </div>
    )
  }

  const readinessItems = [
    { label: "Game added", complete: hasGameSource },
    { label: "Title added", complete: formData.title.trim().length > 0 },
    { label: "Description added", complete: formData.description.trim().length > 0 },
    { label: "Category selected", complete: Boolean(formData.category) },
  ]

  return (
    <div className="vg-shell flex min-h-screen flex-col text-white">
      <Header />

      <main id="main-content" className="container mx-auto max-w-7xl flex-1 px-4 py-6 sm:py-10">
        <div className="mb-6">
          <span className="vg-kicker">Creator upload</span>
          <div className="mt-4 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
                Publish a game in three steps
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--color-text-secondary)] sm:text-base">
                Add a ZIP or HTML file, tell players what it is, then preview and publish. Everything else is optional.
              </p>
            </div>
            <div className="grid grid-cols-3 gap-2 sm:min-w-[28rem]">
              {[
                { number: 1, label: "Add game" },
                { number: 2, label: "Details" },
                { number: 3, label: "Publish" },
              ].map((step) => (
                <div key={step.number} className="rounded-xl border border-[var(--color-border)] bg-black/15 p-3">
                  <span className="grid h-7 w-7 place-items-center rounded-lg bg-[var(--color-primary)] text-xs font-bold text-white">
                    {step.number}
                  </span>
                  <p className="mt-2 text-xs text-[var(--color-text-secondary)]">{step.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {draftNotice ? (
          <div className="mb-5 flex flex-col gap-3 rounded-xl border border-[#facc15]/30 bg-[#facc15]/5 p-4 text-sm text-[#f8dd72] sm:flex-row sm:items-center sm:justify-between">
            <p>{draftNotice}</p>
            <Button type="button" variant="ghost" size="sm" onClick={clearSavedDraft}>
              Clear saved draft
            </Button>
          </div>
        ) : null}

        {error ? (
          <div className="mb-5 flex items-start gap-3 rounded-xl border border-[var(--color-danger)]/35 bg-[var(--color-danger)]/10 p-4 text-sm text-[#ff9ab1]">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
            <p>{error}</p>
          </div>
        ) : null}

        {jamSelectionNotice ? (
          <div className="mb-5 rounded-xl border border-[var(--color-warning)]/30 bg-[var(--color-warning)]/5 p-4 text-sm text-[#f8dd72]">
            {jamSelectionNotice}
          </div>
        ) : null}

        <form onSubmit={handleSubmit} className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
          <div className="min-w-0 space-y-6">
            <section className="vg-panel p-5 sm:p-6" aria-labelledby="upload-source-title">
              <div className="flex items-start gap-3">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[#20d8ff]/10 text-[#7ee7ff]">
                  <span className="text-sm font-bold">1</span>
                </span>
                <div>
                  <h2 id="upload-source-title" className="text-xl font-semibold text-white">Add your game</h2>
                  <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
                    Upload a complete project or paste a self-contained HTML game.
                  </p>
                </div>
              </div>

              <Tabs
                value={gameSourceMode}
                onValueChange={(value) => setGameSourceMode(value as GameSourceMode)}
                className="mt-5"
              >
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="upload" disabled={uploading || autoThumbnailState === "capturing"}>
                    <Upload className="mr-2 h-4 w-4" />
                    Upload file
                  </TabsTrigger>
                  <TabsTrigger value="paste" disabled={uploading || autoThumbnailState === "capturing"}>
                    <Code2 className="mr-2 h-4 w-4" />
                    Paste HTML
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="upload" className="space-y-3">
                  <div
                    {...getGameRootProps()}
                    className={
                      "cursor-pointer rounded-2xl border-2 border-dashed p-7 text-center transition-colors sm:p-10 " +
                      (isGameDragActive
                        ? "border-[var(--color-primary)] bg-[var(--color-primary)]/10"
                        : gameFile
                          ? "border-[#22c55e]/50 bg-[#22c55e]/5"
                          : "border-[var(--color-border-strong)] bg-black/15 hover:border-[var(--color-primary)]")
                    }
                  >
                    <input {...getGameInputProps()} />
                    {gameFile ? (
                      <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
                        <FileArchive className="h-10 w-10 text-[#6ee7a0]" />
                        <div className="min-w-0 text-center sm:text-left">
                          <p className="truncate font-medium text-white">{gameFile.name}</p>
                          <p className="mt-1 text-xs text-[var(--color-text-tertiary)]">
                            {(gameFile.size / 1024 / 1024).toFixed(2)} MB
                          </p>
                        </div>
                        <button
                          type="button"
                          aria-label="Remove game file"
                          onClick={(event) => {
                            event.stopPropagation()
                            setGameFile(null)
                          }}
                          className="grid h-9 w-9 place-items-center rounded-lg text-[var(--color-text-tertiary)] hover:bg-white/[0.05] hover:text-white"
                        >
                          <X className="h-5 w-5" />
                        </button>
                      </div>
                    ) : (
                      <>
                        <Upload className="mx-auto h-10 w-10 text-[var(--color-text-tertiary)]" />
                        <p className="mt-4 font-medium text-white">Drop a ZIP or HTML file here</p>
                        <p className="mt-2 text-sm text-[var(--color-text-secondary)]">
                          or click to choose a file · up to 50 MB
                        </p>
                      </>
                    )}
                  </div>
                  <p className="text-xs leading-5 text-[var(--color-text-tertiary)]">
                    Use ZIP for games with images, audio, scripts, or multiple files. A single HTML file can be previewed before publishing.
                  </p>
                </TabsContent>

                <TabsContent value="paste" className="space-y-2">
                  <Label htmlFor="pasted-html">HTML code</Label>
                  <Textarea
                    id="pasted-html"
                    value={pastedGameHtml}
                    onChange={(event) => setPastedGameHtml(event.target.value)}
                    placeholder="Paste your complete index.html here..."
                    className="min-h-64 font-mono text-xs"
                    disabled={uploading || autoThumbnailState === "capturing"}
                  />
                  <p className="text-xs leading-5 text-[var(--color-text-tertiary)]">
                    Best for a self-contained HTML document. If the game uses local assets, upload a ZIP instead.
                  </p>
                </TabsContent>
              </Tabs>
            </section>

            <section className="vg-panel p-5 sm:p-6" aria-labelledby="upload-details-title">
              <div className="flex items-start gap-3">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[#facc15]/10 text-[#f8dd72]">
                  <span className="text-sm font-bold">2</span>
                </span>
                <div>
                  <h2 id="upload-details-title" className="text-xl font-semibold text-white">Add the essentials</h2>
                  <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
                    Players only need a clear title, description, category, and controls.
                  </p>
                </div>
              </div>

              <div className="mt-5 space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="title">Game title *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(event) => setFormData({ ...formData, title: event.target.value })}
                    placeholder="My awesome game"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description *</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(event) => setFormData({ ...formData, description: event.target.value })}
                    placeholder="What is the game, and what makes it fun?"
                    className="min-h-28"
                    required
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Category *</Label>
                    <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
                      <SelectTrigger><SelectValue placeholder="Choose a category" /></SelectTrigger>
                      <SelectContent>
                        {CATEGORIES.map((category) => (
                          <SelectItem key={category.value} value={category.value}>
                            {category.icon} {category.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="instructions">How to play</Label>
                    <Input
                      id="instructions"
                      value={formData.instructions}
                      onChange={(event) => setFormData({ ...formData, instructions: event.target.value })}
                      placeholder="Arrow keys to move, Space to jump"
                    />
                  </div>
                </div>

                <details className="rounded-2xl border border-[var(--color-border)] bg-black/15">
                  <summary className="cursor-pointer list-none px-4 py-4">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="font-medium text-white">Optional details and advanced features</p>
                        <p className="mt-1 text-xs text-[var(--color-text-tertiary)]">
                          Discovery, jams, identity, mobile, level editors, and ghost races
                        </p>
                      </div>
                      <span className="vg-chip">Optional</span>
                    </div>
                  </summary>

                  <div className="space-y-5 border-t border-[var(--color-border)] p-4">
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="aiModel">AI model used</Label>
                        <Input
                          id="aiModel"
                          value={formData.aiModel}
                          onChange={(event) => setFormData({ ...formData, aiModel: event.target.value })}
                          placeholder="e.g. GPT-5, Claude, Gemini"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="tags">Tags</Label>
                        <Input
                          id="tags"
                          value={formData.tags}
                          onChange={(event) => setFormData({ ...formData, tags: event.target.value })}
                          placeholder="platformer, retro, relaxing"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Game jam</Label>
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
                          <SelectItem value="__none__">Publish without a jam</SelectItem>
                          {activeJams.map((jam) => (
                            <SelectItem key={jam.slug} value={jam.slug}>
                              {jam.theme ? jam.title + " — " + jam.theme : jam.title}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {jamLoadError ? <p className="text-xs text-[#ff8aa8]">{jamLoadError}</p> : null}
                      {selectedJam ? (
                        <div className="rounded-xl border border-[#facc15]/25 bg-[#facc15]/5 p-3 text-xs leading-5 text-[var(--color-text-secondary)]">
                          <p className="font-medium text-white">{selectedJam.title}</p>
                          <p className="mt-1">
                            {selectedJam.theme ? "Theme: " + selectedJam.theme + ". " : ""}
                            Closes {new Date(selectedJam.endDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}.
                          </p>
                          <p className="mt-1">{selectedJam.remainingEntries} entries remaining.</p>
                          {!selectedJam.isEligibleToSubmit ? (
                            <p className="mt-2 text-[#f8dd72]">This jam cannot accept another entry from you right now.</p>
                          ) : null}
                        </div>
                      ) : null}
                    </div>

                    <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-[var(--color-border)] bg-black/15 p-4">
                      <input
                        type="checkbox"
                        checked={formData.supportsMobile}
                        onChange={(event) =>
                          setFormData({
                            ...formData,
                            supportsMobile: event.target.checked,
                            mobileOrientation: event.target.checked ? formData.mobileOrientation : "BOTH",
                          })
                        }
                        className="mt-0.5 h-5 w-5 accent-[var(--color-primary)]"
                      />
                      <span>
                        <span className="block text-sm font-medium text-white">Works on phones and tablets</span>
                        <span className="mt-1 block text-xs text-[var(--color-text-tertiary)]">
                          Show mobile players that touch devices are supported.
                        </span>
                      </span>
                    </label>

                    {formData.supportsMobile ? (
                      <div className="space-y-2">
                        <Label>Mobile orientation</Label>
                        <Select
                          value={formData.mobileOrientation}
                          onValueChange={(value) => setFormData({ ...formData, mobileOrientation: value })}
                        >
                          <SelectTrigger><SelectValue placeholder="Choose orientation" /></SelectTrigger>
                          <SelectContent>
                            {MOBILE_ORIENTATION_OPTIONS.map((option) => (
                              <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    ) : null}

                    {session.user.id ? (
                      <div className="space-y-4 rounded-xl border border-[var(--color-border)] bg-black/15 p-4">
                        <div>
                          <p className="text-sm font-medium text-white">Publishing identity</p>
                          <p className="mt-1 text-xs text-[var(--color-text-tertiary)]">
                            Use your account or publish under a saved studio name.
                          </p>
                        </div>
                        <div className="grid gap-4 md:grid-cols-2">
                          <div className="space-y-2">
                            <Label>Publish as</Label>
                            <Select
                              value={formData.studioProfileId || "__none__"}
                              onValueChange={(value) =>
                                setFormData((current) => ({
                                  ...current,
                                  studioProfileId: value === "__none__" ? "" : value,
                                }))
                              }
                            >
                              <SelectTrigger><SelectValue placeholder="Your account" /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="__none__">Your account</SelectItem>
                                {studioProfiles.map((profile) => (
                                  <SelectItem key={profile.id} value={profile.id}>
                                    {profile.displayName} (@{profile.handle})
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="new-studio-name">New studio name</Label>
                            <Input
                              id="new-studio-name"
                              value={newStudio.displayName}
                              onChange={(event) => setNewStudio({ ...newStudio, displayName: event.target.value })}
                              placeholder="Neon Arcade Labs"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="new-studio-handle">Studio handle</Label>
                            <Input
                              id="new-studio-handle"
                              value={newStudio.handle}
                              onChange={(event) => setNewStudio({ ...newStudio, handle: event.target.value })}
                              placeholder="neon-arcade"
                            />
                          </div>
                          <div className="flex items-end">
                            <Button
                              type="button"
                              variant="outline"
                              className="w-full"
                              onClick={async () => {
                                setStudioError("")
                                setCreatingStudio(true)
                                try {
                                  const response = await fetch("/api/studio-profiles", {
                                    method: "POST",
                                    headers: { "Content-Type": "application/json" },
                                    body: JSON.stringify({
                                      displayName: newStudio.displayName,
                                      handle: newStudio.handle || undefined,
                                    }),
                                  })
                                  const data = await response.json()
                                  if (!response.ok) {
                                    throw new Error(data.message || data.error || "Failed to create studio")
                                  }
                                  const created = data.profile
                                  setStudioProfiles((current) => [created, ...current])
                                  setFormData((current) => ({ ...current, studioProfileId: created.id }))
                                  setNewStudio({ displayName: "", handle: "" })
                                } catch (studioCreationError) {
                                  setStudioError(
                                    studioCreationError instanceof Error
                                      ? studioCreationError.message
                                      : "Failed to create studio"
                                  )
                                } finally {
                                  setCreatingStudio(false)
                                }
                              }}
                              disabled={creatingStudio || !newStudio.displayName.trim()}
                            >
                              {creatingStudio ? "Creating..." : "Create studio"}
                            </Button>
                          </div>
                        </div>
                        {studioError ? <p className="text-sm text-[#ff8aa8]">{studioError}</p> : null}
                      </div>
                    ) : null}

                    <div className="space-y-2">
                      <Label htmlFor="update-note">Launch or update note</Label>
                      <Textarea
                        id="update-note"
                        value={formData.latestUpdateNote}
                        onChange={(event) => setFormData({ ...formData, latestUpdateNote: event.target.value })}
                        placeholder="What should players notice in this version?"
                        maxLength={280}
                      />
                    </div>

                    <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-[var(--color-border)] bg-black/15 p-4">
                      <input
                        type="checkbox"
                        checked={formData.seekingFeedback}
                        onChange={(event) => setFormData({ ...formData, seekingFeedback: event.target.checked })}
                        className="mt-0.5 h-5 w-5 accent-[var(--color-primary)]"
                      />
                      <span>
                        <span className="block text-sm font-medium text-white">Highlight this game for feedback</span>
                        <span className="mt-1 block text-xs text-[var(--color-text-tertiary)]">
                          Put this game in the feedback discovery lane.
                        </span>
                      </span>
                    </label>

                    <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-[var(--color-border)] bg-black/15 p-4">
                      <input
                        type="checkbox"
                        checked={formData.hasLevelEditor}
                        onChange={(event) => setFormData({ ...formData, hasLevelEditor: event.target.checked })}
                        className="mt-0.5 h-5 w-5 accent-[var(--color-primary)]"
                      />
                      <span>
                        <span className="block text-sm font-medium text-white">Community level editor</span>
                        <span className="mt-1 block text-xs text-[var(--color-text-tertiary)]">Let players build and share custom levels.</span>
                      </span>
                    </label>
                    {formData.hasLevelEditor ? <LevelEditorSetupGuide /> : null}

                    <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-[var(--color-border)] bg-black/15 p-4">
                      <input
                        type="checkbox"
                        checked={formData.hasGhostSharing}
                        onChange={(event) => setFormData({ ...formData, hasGhostSharing: event.target.checked })}
                        className="mt-0.5 h-5 w-5 accent-[var(--color-primary)]"
                      />
                      <span>
                        <span className="block text-sm font-medium text-white">Ghost races and time leaderboard</span>
                        <span className="mt-1 block text-xs text-[var(--color-text-tertiary)]">
                          Enable replay ghosts for deterministic run data.
                        </span>
                      </span>
                    </label>
                    {formData.hasGhostSharing ? <GhostSharingSetupGuide /> : null}
                  </div>
                </details>
              </div>
            </section>

            <section className="vg-panel p-5 sm:p-6" aria-labelledby="upload-preview-title">
              <div className="flex items-start gap-3">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[#ff3d6e]/10 text-[#ff8aa8]">
                  <span className="text-sm font-bold">3</span>
                </span>
                <div>
                  <h2 id="upload-preview-title" className="text-xl font-semibold text-white">Preview and present it</h2>
                  <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
                    Preview compatible HTML games and add a thumbnail. Both are optional for ZIP uploads.
                  </p>
                </div>
              </div>

              <div className="mt-5 space-y-5">
                {previewGameUrl ? (
                  <div className="space-y-4">
                    <GamePlayer
                      key={previewGameUrl}
                      ref={previewPlayerRef}
                      title={formData.title || "Game preview"}
                      gameUrl={previewGameUrl}
                      runtimeLabel="Local preview"
                      mode="preview"
                      onAutoThumbnailCaptureProgress={handleAutoThumbnailCaptureProgress}
                      onAutoThumbnailCaptureComplete={handleAutoThumbnailCaptureComplete}
                      onAutoThumbnailCaptureError={handleAutoThumbnailCaptureError}
                    />
                    <div className="flex flex-col gap-3 rounded-xl border border-[var(--color-border)] bg-black/15 p-4 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="text-sm font-medium text-white">Automatic screenshots</p>
                        <p className="mt-1 text-xs leading-5 text-[var(--color-text-tertiary)]">{autoThumbnailMessage}</p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Button
                          type="button"
                          variant={autoThumbnailState === "ready" ? "outline" : "default"}
                          className="gap-2"
                          onClick={startAutoThumbnailCapture}
                          disabled={uploading || autoThumbnailState === "capturing"}
                        >
                          {autoThumbnailState === "capturing" ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Camera className="h-4 w-4" />
                          )}
                          {autoThumbnailState === "capturing"
                            ? "Capturing..."
                            : autoThumbnailState === "ready"
                              ? "Capture again"
                              : "Capture screenshots"}
                        </Button>
                        {autoThumbnailImages.length > 0 ? (
                          <Button
                            type="button"
                            variant="ghost"
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
                        ) : null}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start gap-3 rounded-xl border border-[var(--color-border)] bg-black/15 p-4">
                    <MonitorPlay className="mt-0.5 h-5 w-5 shrink-0 text-[var(--color-text-tertiary)]" />
                    <div>
                      <p className="text-sm font-medium text-white">Preview is optional</p>
                      <p className="mt-1 text-xs leading-5 text-[var(--color-text-tertiary)]">
                        {previewSourceDescription} ZIP projects still publish normally.
                      </p>
                    </div>
                  </div>
                )}

                {autoThumbnailImages.length > 0 ? (
                  <div>
                    <div className="mb-3 flex items-center justify-between gap-3">
                      <p className="text-sm font-medium text-white">Captured screenshots</p>
                      <span className="text-xs text-[var(--color-text-tertiary)]">{autoThumbnailImages.length} ready</span>
                    </div>
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
                      {autoThumbnailImages.map((image, index) => (
                        <div key={String(index) + image.slice(0, 24)} className="overflow-hidden rounded-lg border border-[var(--color-border)]">
                          <Image
                            src={image}
                            alt={"Automatic thumbnail " + String(index + 1)}
                            width={640}
                            height={360}
                            unoptimized
                            className="aspect-video h-full w-full object-cover"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}

                <div className="space-y-3">
                  <div>
                    <Label>Game thumbnail</Label>
                    <p className="mt-1 text-xs text-[var(--color-text-tertiary)]">
                      Optional · 16:9 works best, for example 800 × 450 pixels.
                    </p>
                  </div>
                  <div
                    {...getThumbnailRootProps()}
                    className={
                      "cursor-pointer rounded-2xl border-2 border-dashed p-5 text-center transition-colors " +
                      (thumbnailPreview
                        ? "border-[#22c55e]/50 bg-[#22c55e]/5"
                        : "border-[var(--color-border-strong)] bg-black/15 hover:border-[var(--color-primary)]")
                    }
                  >
                    <input {...getThumbnailInputProps()} />
                    {thumbnailPreview ? (
                      <div className="relative mx-auto max-w-lg">
                        <Image
                          src={thumbnailPreview}
                          alt={"Thumbnail preview for " + (formData.title || "your game")}
                          width={800}
                          height={450}
                          unoptimized
                          className="aspect-video w-full rounded-xl border border-[var(--color-border)] object-cover"
                        />
                        <button
                          type="button"
                          aria-label="Remove thumbnail"
                          onClick={(event) => {
                            event.stopPropagation()
                            setThumbnailFile(null)
                            setThumbnailPreview(null)
                          }}
                          className="absolute right-2 top-2 grid h-9 w-9 place-items-center rounded-lg bg-black/75 text-white"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ) : (
                      <>
                        <Camera className="mx-auto h-8 w-8 text-[var(--color-text-tertiary)]" />
                        <p className="mt-3 text-sm font-medium text-white">Drop a thumbnail here</p>
                        <p className="mt-1 text-xs text-[var(--color-text-tertiary)]">or click to choose an image</p>
                      </>
                    )}
                  </div>
                  <p className="text-xs text-[var(--color-text-tertiary)]">{thumbnailStatusLabel}</p>
                </div>
              </div>
            </section>
          </div>

          <aside className="space-y-4 lg:sticky lg:top-24">
            <section className="vg-panel p-5">
              <span className="vg-kicker text-[#facc15]">Ready to publish?</span>
              <h2 className="mt-3 text-xl font-semibold text-white">Final check</h2>
              <p className="mt-2 text-sm leading-6 text-[var(--color-text-secondary)]">
                Complete the four essentials. Preview, thumbnail, and advanced options are optional.
              </p>

              <div className="mt-5 space-y-2">
                {readinessItems.map((item) => (
                  <div key={item.label} className="flex items-center gap-3 rounded-xl border border-[var(--color-border)] bg-black/15 px-3 py-2.5">
                    <span
                      className={
                        "grid h-6 w-6 place-items-center rounded-full text-xs " +
                        (item.complete
                          ? "bg-[#22c55e]/15 text-[#6ee7a0]"
                          : "bg-white/[0.05] text-[var(--color-text-tertiary)]")
                      }
                    >
                      {item.complete ? "✓" : "·"}
                    </span>
                    <span className={item.complete ? "text-sm text-white" : "text-sm text-[var(--color-text-secondary)]"}>
                      {item.label}
                    </span>
                  </div>
                ))}
              </div>

              {selectedJam ? (
                <div className="mt-4 rounded-xl border border-[#facc15]/25 bg-[#facc15]/5 p-3">
                  <div className="flex gap-2">
                    <Trophy className="mt-0.5 h-4 w-4 shrink-0 text-[#facc15]" />
                    <div>
                      <p className="text-sm font-medium text-white">{selectedJam.title}</p>
                      <p className="mt-1 text-xs text-[var(--color-text-tertiary)]">
                        This game will be submitted automatically.
                      </p>
                    </div>
                  </div>
                </div>
              ) : null}

              {uploading ? (
                <div className="mt-4 rounded-xl border border-[var(--color-primary)]/30 bg-[var(--color-primary)]/5 p-4">
                  <div className="flex items-center gap-2 text-sm font-medium text-white">
                    <Loader2 className="h-4 w-4 animate-spin text-[var(--color-primary-hover)]" />
                    {uploadStage === "uploading"
                      ? "Uploading files..."
                      : uploadStage === "publishing"
                        ? "Publishing game..."
                        : uploadStage === "submittingJam"
                          ? "Submitting to jam..."
                          : "Finishing..."}
                  </div>
                  <p className="mt-2 text-xs text-[var(--color-text-tertiary)]">Keep this page open until publishing finishes.</p>
                </div>
              ) : null}

              <Button
                type="submit"
                size="lg"
                className="mt-5 w-full gap-2 rounded-xl"
                disabled={uploading || !hasGameSource || autoThumbnailState === "capturing"}
              >
                {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                {uploading ? "Publishing..." : "Publish game"}
              </Button>
              <Button
                type="button"
                variant="ghost"
                className="mt-2 w-full"
                onClick={() => router.back()}
                disabled={uploading}
              >
                Cancel
              </Button>
              <p className="mt-4 text-center text-xs leading-5 text-[var(--color-text-tertiary)]">
                Your local draft is saved automatically while you work.
              </p>
            </section>
          </aside>
        </form>
      </main>

      <Footer />
    </div>
  )
}
