"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import Link from "next/link"
import { ChevronLeft, Save, Loader2, AlertCircle, CheckCircle, Gamepad2 } from "lucide-react"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { CATEGORIES, AI_MODELS, AI_TOOLS } from "@/lib/utils"

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

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    instructions: "",
    category: "OTHER",
    tags: "",
    aiTool: "",
    aiModel: "",
    customAiModel: "",
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

      const knownModels = AI_MODELS.map((m) => m.value)
      const isKnownModel = data.aiModel && knownModels.includes(data.aiModel)

      setFormData({
        title: data.title || "",
        description: data.description || "",
        instructions: data.instructions || "",
        category: data.category || "OTHER",
        tags: data.tags || "",
        aiTool: data.aiTool || "",
        aiModel: isKnownModel ? data.aiModel : data.aiModel ? "other" : "",
        customAiModel: isKnownModel ? "" : data.aiModel || "",
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setSaving(true)

    try {
      const selectedAiModel =
        formData.aiModel === "other" ? formData.customAiModel.trim() : formData.aiModel

      const res = await fetch(`/api/games/${gameId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: formData.title,
          description: formData.description,
          instructions: formData.instructions || null,
          category: formData.category,
          tags: formData.tags,
          aiTool: formData.aiTool || null,
          aiModel: selectedAiModel || null,
          supportsMobile: formData.supportsMobile,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || "Failed to update game")
      }

      setSuccess(true)
      setTimeout(() => {
        router.push("/creator")
      }, 1500)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong")
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

            {game?.thumbnail && (
              <Card className="border-2 border-[#4a4a6a] bg-[#1a1a2e]">
                <CardHeader>
                  <CardTitle className="font-arcade text-sm">Current Thumbnail</CardTitle>
                </CardHeader>
                <CardContent>
                  <img
                    src={game.thumbnail}
                    alt={game.title}
                    className="max-h-48 rounded border border-[#4a4a6a]"
                  />
                </CardContent>
              </Card>
            )}

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
                    <Select
                      value={formData.aiModel}
                      onValueChange={(value) =>
                        setFormData({
                          ...formData,
                          aiModel: value,
                          customAiModel: value === "other" ? formData.customAiModel : "",
                        })
                      }
                    >
                      <SelectTrigger className="font-arcade">
                        <SelectValue placeholder="Select AI model" />
                      </SelectTrigger>
                      <SelectContent>
                        {AI_MODELS.map((model) => (
                          <SelectItem key={model.value} value={model.value} className="font-arcade">
                            {model.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    {formData.aiModel === "other" && (
                      <Input
                        value={formData.customAiModel}
                        onChange={(e) => setFormData({ ...formData, customAiModel: e.target.value })}
                        placeholder="Enter model name"
                        className="font-arcade"
                      />
                    )}
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
