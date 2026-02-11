"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import Link from "next/link"
import { useDropzone } from "react-dropzone"
import {
  ChevronLeft,
  Save,
  Loader2,
  AlertCircle,
  CheckCircle,
  Gamepad2,
  Upload,
  FileArchive,
  X,
  Image,
} from "lucide-react"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { CATEGORIES, AI_TOOLS } from "@/lib/utils"

interface PageProps {
  params: Promise<{ id: string }>
}

interface GameData {
  id: string
  title: string
  description: string
  instructions: string | null
  category: string
  tags: string
  aiTool: string | null
  aiModel: string | null
  supportsMobile: boolean
  thumbnail: string | null
}

export default function EditGamePage({ params }: PageProps) {
  const router = useRouter()
  const { data: session, status } = useSession()
  const [gameId, setGameId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)
  const [game, setGame] = useState<GameData | null>(null)
  const [gameFile, setGameFile] = useState<File | null>(null)
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null)
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    instructions: "",
    category: "OTHER",
    tags: "",
    aiTool: "",
    aiModel: "",
    supportsMobile: false,
  })

  useEffect(() => {
    params.then((p) => setGameId(p.id))
  }, [params])

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login")
    }
  }, [status, router])

  const fetchGame = useCallback(async () => {
    if (!gameId) return

    try {
      const res = await fetch(`/api/games/${gameId}`)
      if (!res.ok) {
        if (res.status === 404) {
          setError("Game not found")
        } else {
          setError("Failed to load game")
        }
        return
      }

      const data = await res.json()
      setGame(data)

      setFormData({
        title: data.title || "",
        description: data.description || "",
        instructions: data.instructions || "",
        category: data.category || "OTHER",
        tags: data.tags || "",
        aiTool: data.aiTool || "",
        aiModel: data.aiModel || "",
        supportsMobile: data.supportsMobile || false,
      })
    } catch {
      setError("Failed to load game")
    } finally {
      setLoading(false)
    }
  }, [gameId])

  useEffect(() => {
    if (gameId && session?.user?.id) {
      fetchGame()
    }
  }, [gameId, session?.user?.id, fetchGame])

  const onDropGame = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0]
    if (!file) return

    const fileName = file.name.toLowerCase()
    if (fileName.endsWith(".zip") || fileName.endsWith(".html")) {
      setGameFile(file)
      setError("")
      return
    }

    setError("Please upload a .zip file containing your game or a single .html file")
  }, [])

  const onDropThumbnail = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0]
    if (!file) return

    const validTypes = ["image/png", "image/jpeg", "image/jpg", "image/gif", "image/webp"]
    if (!validTypes.includes(file.type)) {
      setError("Please upload an image file (PNG, JPG, GIF, or WebP)")
      return
    }

    setThumbnailFile(file)
    setThumbnailPreview(URL.createObjectURL(file))
    setError("")
  }, [])

  const {
    getRootProps: getGameRootProps,
    getInputProps: getGameInputProps,
    isDragActive: isGameDragActive,
  } = useDropzone({
    onDrop: onDropGame,
    accept: {
      "application/zip": [".zip"],
      "text/html": [".html"],
    },
    maxFiles: 1,
    maxSize: 50 * 1024 * 1024,
  })

  const {
    getRootProps: getThumbnailRootProps,
    getInputProps: getThumbnailInputProps,
    isDragActive: isThumbnailDragActive,
  } = useDropzone({
    onDrop: onDropThumbnail,
    accept: {
      "image/png": [".png"],
      "image/jpeg": [".jpg", ".jpeg"],
      "image/gif": [".gif"],
      "image/webp": [".webp"],
    },
    maxFiles: 1,
    maxSize: 5 * 1024 * 1024,
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setSaving(true)

    try {
      const buildUpdateData = () => {
        const nextData = new FormData()
        nextData.append("title", formData.title)
        nextData.append("description", formData.description)
        nextData.append("instructions", formData.instructions)
        nextData.append("category", formData.category)
        nextData.append("tags", formData.tags)
        nextData.append("aiTool", formData.aiTool)
        nextData.append("aiModel", formData.aiModel.trim())
        nextData.append("supportsMobile", String(formData.supportsMobile))

        if (gameFile) {
          nextData.append("gameFile", gameFile)
        }

        if (thumbnailFile) {
          nextData.append("thumbnail", thumbnailFile)
        }

        return nextData
      }

      const sendUpdate = async (method: "PATCH" | "POST") => {
        const res = await fetch(`/api/games/${gameId}`, {
          method,
          body: buildUpdateData(),
        })

        const data = await res.json()
        return { res, data }
      }

      let result = await sendUpdate("PATCH")

      // Some mobile browsers/networks can fail multipart PATCH requests.
      // Fallback to POST, handled by the same server update logic.
      if (!result.res.ok && result.res.status >= 500) {
        result = await sendUpdate("POST")
      }

      if (!result.res.ok) {
        throw new Error(result.data.error || "Failed to update game")
      }

      setSuccess(true)
      setGameFile(null)
      setThumbnailFile(null)
      setThumbnailPreview(null)
      setTimeout(() => {
        router.push("/creator")
      }, 1500)
    } catch (err) {
      if (err instanceof TypeError && (thumbnailFile || gameFile)) {
        try {
          const fallbackRes = await fetch(`/api/games/${gameId}`, {
            method: "POST",
            body: (() => {
              const nextData = new FormData()
              nextData.append("title", formData.title)
              nextData.append("description", formData.description)
              nextData.append("instructions", formData.instructions)
              nextData.append("category", formData.category)
              nextData.append("tags", formData.tags)
              nextData.append("aiTool", formData.aiTool)
              nextData.append("aiModel", formData.aiModel.trim())
              nextData.append("supportsMobile", String(formData.supportsMobile))
              if (gameFile) nextData.append("gameFile", gameFile)
              if (thumbnailFile) nextData.append("thumbnail", thumbnailFile)
              return nextData
            })(),
          })

          const fallbackData = await fallbackRes.json()
          if (!fallbackRes.ok) {
            throw new Error(fallbackData.error || "Failed to update game")
          }

          setSuccess(true)
          setGameFile(null)
          setThumbnailFile(null)
          setThumbnailPreview(null)
          setTimeout(() => {
            router.push("/creator")
          }, 1500)
        } catch (fallbackErr) {
          setError(fallbackErr instanceof Error ? fallbackErr.message : "Something went wrong")
        }
      } else {
        setError(err instanceof Error ? err.message : "Something went wrong")
      }
    } finally {
      setSaving(false)
    }
  }

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0d0d15]">
        <Loader2 className="h-8 w-8 animate-spin text-[#ffff00]" />
      </div>
    )
  }

  if (!session) {
    return null
  }

  if (error && !game) {
    return (
      <div className="min-h-screen flex flex-col bg-[#0d0d15]">
        <Header />
        <main className="flex-1 flex items-center justify-center px-4">
          <Card className="max-w-md w-full">
            <CardContent className="pt-6 text-center">
              <AlertCircle className="h-16 w-16 text-[#ff0040] mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-white mb-2 font-arcade">{error}</h2>
              <Link href="/creator">
                <Button variant="outline" className="mt-4">
                  Back to Dashboard
                </Button>
              </Link>
            </CardContent>
          </Card>
        </main>
        <Footer />
      </div>
    )
  }

  if (success) {
    return (
      <div className="min-h-screen flex flex-col bg-[#0d0d15]">
        <Header />
        <main className="flex-1 flex items-center justify-center px-4">
          <Card className="max-w-md w-full">
            <CardContent className="pt-6 text-center">
              <CheckCircle className="h-16 w-16 text-[#00ff40] mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-white mb-2 font-arcade">Game Updated!</h2>
              <p className="text-[#4a4a6a] text-sm font-arcade">Redirecting to dashboard...</p>
            </CardContent>
          </Card>
        </main>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#0d0d15]">
      <Header />

      <main className="flex-1 container mx-auto px-4 py-6 sm:py-8">
        <div className="max-w-3xl mx-auto">
          <Link
            href="/creator"
            className="inline-flex items-center gap-2 text-[#4a4a6a] hover:text-[#ffff00] mb-6 transition-colors font-arcade text-sm"
          >
            <ChevronLeft className="h-4 w-4" />
            BACK TO DASHBOARD
          </Link>

          <div className="mb-8">
            <h1 className="text-2xl font-semibold text-white flex items-center gap-3 font-arcade">
              <Gamepad2 className="h-6 w-6 text-[#ffff00]" />
              Edit Game
            </h1>
            <p className="text-[#4a4a6a] mt-2 font-arcade text-sm">
              Update your game details
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="p-4 border-2 border-[#ff0040] bg-[#ff0040]/10 text-[#ff0040] flex items-center gap-3 text-sm font-arcade">
                <AlertCircle className="h-5 w-5 flex-shrink-0" />
                {error}
              </div>
            )}

            <Card className="border-2 border-[#4a4a6a] bg-[#1a1a2e]">
              <CardHeader>
                <CardTitle className="font-arcade text-sm">Change Thumbnail (Optional)</CardTitle>
                <CardDescription className="font-arcade text-xs">
                  Upload a new thumbnail image. Max 5MB | PNG, JPG, GIF, or WebP
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div
                  {...getThumbnailRootProps()}
                  className={`border-2 border-dashed p-5 sm:p-6 text-center cursor-pointer transition-all ${
                    isThumbnailDragActive
                      ? "border-[#ffff00] bg-[#ffff00]/10"
                      : thumbnailFile
                      ? "border-[#00ff40] bg-[#00ff40]/10"
                      : "border-[#4a4a6a] hover:border-[#ffff00]"
                  }`}
                >
                  <input {...getThumbnailInputProps()} />
                  {thumbnailPreview || thumbnailFile ? (
                    <div className="flex flex-col items-center gap-3">
                      <img
                        src={thumbnailPreview || ""}
                        alt="New thumbnail preview"
                        className="max-h-48 rounded border border-[#4a4a6a]"
                      />
                      <div className="flex items-center gap-3">
                        <p className="font-arcade text-sm text-white">{thumbnailFile?.name}</p>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            setThumbnailFile(null)
                            setThumbnailPreview(null)
                          }}
                          className="p-1 text-[#4a4a6a] hover:text-white"
                        >
                          <X className="h-5 w-5" />
                        </button>
                      </div>
                    </div>
                  ) : game?.thumbnail ? (
                    <div className="flex flex-col items-center gap-3">
                      <img
                        src={game.thumbnail}
                        alt={game.title}
                        className="max-h-48 rounded border border-[#4a4a6a] opacity-60"
                      />
                      <p className="text-[#4a4a6a] text-xs font-arcade">
                        Current thumbnail - drag a new image to replace
                      </p>
                    </div>
                  ) : (
                    <>
                      <Image className="h-8 w-8 text-[#4a4a6a] mx-auto mb-2" />
                      <p className="text-white font-arcade text-xs sm:text-sm mb-1">
                        Drag and drop a thumbnail image
                      </p>
                      <p className="text-[#4a4a6a] text-xs font-arcade">Max 5MB | PNG, JPG, GIF, or WebP</p>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className="border-2 border-[#4a4a6a] bg-[#1a1a2e]">
              <CardHeader>
                <CardTitle className="font-arcade text-sm">Replace Game File (Optional)</CardTitle>
                <CardDescription className="font-arcade text-xs">
                  Upload a new .zip or .html version. Old game assets are removed after replacement to save
                  storage.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div
                  {...getGameRootProps()}
                  className={`border-2 border-dashed p-5 sm:p-6 text-center cursor-pointer transition-all ${
                    isGameDragActive
                      ? "border-[#ffff00] bg-[#ffff00]/10"
                      : gameFile
                      ? "border-[#00ff40] bg-[#00ff40]/10"
                      : "border-[#4a4a6a] hover:border-[#ffff00]"
                  }`}
                >
                  <input {...getGameInputProps()} />
                  {gameFile ? (
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                      <FileArchive className="h-10 w-10 text-[#00ff40]" />
                      <div className="text-center sm:text-left min-w-0">
                        <p className="font-arcade text-sm text-white break-all">{gameFile.name}</p>
                        <p className="text-xs text-[#4a4a6a] font-arcade">
                          {(gameFile.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          setGameFile(null)
                        }}
                        className="p-1 text-[#4a4a6a] hover:text-white"
                      >
                        <X className="h-5 w-5" />
                      </button>
                    </div>
                  ) : (
                    <>
                      <Upload className="h-8 w-8 text-[#4a4a6a] mx-auto mb-2" />
                      <p className="text-white font-arcade text-xs sm:text-sm mb-1">
                        Drag and drop to replace your game build
                      </p>
                      <p className="text-[#4a4a6a] text-xs font-arcade">Max 50MB | .zip or .html</p>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className="border-2 border-[#4a4a6a] bg-[#1a1a2e]">
              <CardHeader>
                <CardTitle className="font-arcade text-sm">Game Details</CardTitle>
                <CardDescription className="font-arcade text-xs">
                  Update information about your game
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label className="font-arcade text-xs">Game Title *</Label>
                  <Input
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="My Awesome Game"
                    required
                    className="font-arcade"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="font-arcade text-xs">Description *</Label>
                  <Textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Describe your game..."
                    className="min-h-[120px] font-arcade"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label className="font-arcade text-xs">How to Play (optional)</Label>
                  <Textarea
                    value={formData.instructions}
                    onChange={(e) => setFormData({ ...formData, instructions: e.target.value })}
                    placeholder="Controls: Arrow keys to move, Space to jump..."
                    className="font-arcade"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="font-arcade text-xs">Category *</Label>
                    <Select
                      value={formData.category}
                      onValueChange={(value) => setFormData({ ...formData, category: value })}
                    >
                      <SelectTrigger className="font-arcade">
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {CATEGORIES.map((cat) => (
                          <SelectItem key={cat.value} value={cat.value} className="font-arcade">
                            {cat.icon} {cat.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="font-arcade text-xs">AI Tool Used</Label>
                    <Select
                      value={formData.aiTool}
                      onValueChange={(value) => setFormData({ ...formData, aiTool: value })}
                    >
                      <SelectTrigger className="font-arcade">
                        <SelectValue placeholder="Select AI tool" />
                      </SelectTrigger>
                      <SelectContent>
                        {AI_TOOLS.map((tool) => (
                          <SelectItem key={tool.value} value={tool.value} className="font-arcade">
                            {tool.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="font-arcade text-xs">AI Model Used</Label>
                    <Input
                      value={formData.aiModel}
                      onChange={(e) => setFormData({ ...formData, aiModel: e.target.value })}
                      placeholder="e.g. gpt-5, claude-sonnet-4, gemini-2.0-flash"
                      className="font-arcade"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="font-arcade text-xs">Tags (comma-separated)</Label>
                  <Input
                    value={formData.tags}
                    onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                    placeholder="platformer, retro, fun, easy"
                    className="font-arcade"
                  />
                </div>

                <div className="border border-[#4a4a6a] bg-[#0d0d15] p-3">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.supportsMobile}
                      onChange={(e) =>
                        setFormData({ ...formData, supportsMobile: e.target.checked })
                      }
                      className="h-4 w-4 rounded border-[#4a4a6a] bg-[#0d0d15] text-[#ffff00] focus:ring-[#ffff00]"
                    />
                    <div>
                      <p className="text-sm font-medium text-white font-arcade">
                        Supports mobile devices
                      </p>
                      <p className="text-xs text-[#4a4a6a] font-arcade">
                        Show players that this game is playable on mobile
                      </p>
                    </div>
                  </label>
                </div>
              </CardContent>
            </Card>

            <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3">
              <Link href="/creator">
                <Button type="button" variant="outline" className="w-full sm:w-auto font-arcade">
                  Cancel
                </Button>
              </Link>
              <Button type="submit" disabled={saving} className="w-full sm:w-auto font-arcade">
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save Changes
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
