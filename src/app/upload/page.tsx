"use client"

import { useState, useCallback, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { useDropzone } from "react-dropzone"
import { Upload, FileArchive, X, CheckCircle, AlertCircle, Loader2 } from "lucide-react"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { CATEGORIES, AI_TOOLS } from "@/lib/utils"

export default function UploadPage() {
  const router = useRouter()
  const { data: session, status } = useSession()
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)
  const [gameFile, setGameFile] = useState<File | null>(null)
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null)
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null)

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
    isAIGenerated: true,
    studioProfileId: "",
  })

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login")
    }
  }, [status, router])

  useEffect(() => {
    const loadStudioProfiles = async () => {
      if (!session?.user?.id) return
      if (session.user.role !== "ADMIN") return

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

  const onDropGame = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0]
    if (file) {
      if (file.name.endsWith(".zip") || file.name.endsWith(".html")) {
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
  })

  const { getRootProps: getThumbnailRootProps, getInputProps: getThumbnailInputProps } = useDropzone({
    onDrop: onDropThumbnail,
    accept: {
      "image/*": [".png", ".jpg", ".jpeg", ".gif", ".webp"],
    },
    maxFiles: 1,
    maxSize: 5 * 1024 * 1024, // 5MB
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setUploading(true)

    try {
      if (!session?.user?.id) {
        throw new Error("Unauthorized")
      }

      if (!gameFile) {
        setError("Please upload your game file")
        setUploading(false)
        return
      }

      const uploadData = new FormData()
      uploadData.append("gameFile", gameFile)
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
      uploadData.append("isAIGenerated", String(formData.isAIGenerated))
      if (session.user.role === "ADMIN" && formData.studioProfileId) {
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

      setSuccess(true)
      setTimeout(() => {
        router.push(`/creator`)
      }, 2000)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong")
    } finally {
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
          <Card className="max-w-md w-full">
            <CardContent className="pt-6 text-center">
              <CheckCircle className="h-16 w-16 text-[var(--color-success)] mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-[var(--color-text)] mb-2">Game Uploaded!</h2>
              <p className="text-[var(--color-text-secondary)] text-sm">
                Your game has been submitted for review. Redirecting to dashboard...
              </p>
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
        <div className="max-w-3xl mx-auto">
          {/* Page Header */}
          <div className="mb-8">
            <h1 className="text-2xl font-semibold text-[var(--color-text)] flex items-center gap-3">
              <Upload className="h-6 w-6 text-[var(--color-primary)]" />
              Upload Your Game
            </h1>
            <p className="text-[var(--color-text-secondary)] mt-2">
              Share your AI-made HTML5 game with the world
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="p-4 rounded-md bg-[var(--color-danger)]/10 border border-[var(--color-danger)] text-[var(--color-danger)] flex items-center gap-3 text-sm">
                <AlertCircle className="h-5 w-5 flex-shrink-0" />
                {error}
              </div>
            )}

            {/* Game File Upload */}
            <Card>
              <CardHeader>
                <CardTitle>Game Files</CardTitle>
                <CardDescription>
                  Upload a .zip file containing your HTML5 game (index.html + assets) or a single .html file
                </CardDescription>
              </CardHeader>
              <CardContent>
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
              </CardContent>
            </Card>

            {/* Game Details */}
            <Card>
              <CardHeader>
                <CardTitle>Game Details</CardTitle>
                <CardDescription>Tell players about your game</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {session.user.role === "ADMIN" && (
                  <div className="space-y-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
                    <div className="flex flex-col gap-1">
                      <Label>Publish as</Label>
                      <p className="text-xs text-[var(--color-text-tertiary)]">
                        Studio profiles let you publish games under a saved brand name.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
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

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
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
                    <Input
                      value={formData.aiModel}
                      onChange={(e) => setFormData({ ...formData, aiModel: e.target.value })}
                      placeholder="e.g. gpt-5, claude-sonnet-4, gemini-2.0-flash"
                    />
                  </div>
                </div>

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
                      onChange={(e) => setFormData({ ...formData, supportsMobile: e.target.checked })}
                      className="h-4 w-4 rounded border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-primary)] focus:ring-[var(--color-primary)]"
                    />
                    <div>
                      <p className="text-sm font-medium text-[var(--color-text)]">Supports mobile devices</p>
                      <p className="text-xs text-[var(--color-text-secondary)]">Show players that this game is playable on mobile</p>
                    </div>
                  </label>
                </div>
              </CardContent>
            </Card>

            {/* Thumbnail */}
            <Card>
              <CardHeader>
                <CardTitle>Thumbnail</CardTitle>
                <CardDescription>Upload an eye-catching image for your game (recommended: 800x450px)</CardDescription>
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
                      <img
                        src={thumbnailPreview}
                        alt="Thumbnail preview"
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
              </CardContent>
            </Card>

            {/* Actions */}
            <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3">
              <Button type="button" variant="outline" onClick={() => router.back()} className="w-full sm:w-auto">
                Cancel
              </Button>
              <Button type="submit" disabled={uploading || !gameFile} className="w-full sm:w-auto">
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
