"use client"

import { type ReactNode, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Calendar, Clock, Edit, ImageIcon, Loader2, Plus, Trash2, Trophy, Users, Vote, X, Zap } from "lucide-react"

type JamSummary = {
  id: string
  title: string
  slug: string
  description: string
  status: string
  theme: string | null
  rules: string | null
  bannerImage: string | null
  startDate: string
  endDate: string
  votingEndDate: string
  maxEntries: number
  entryCount: number
}

type JamFormState = {
  title: string
  description: string
  theme: string
  rules: string
  bannerImage: string
  startDate: string
  endDate: string
  votingEndDate: string
  maxEntries: number
}

function createEmptyForm(): JamFormState {
  return {
    title: "",
    description: "",
    theme: "",
    rules: "",
    bannerImage: "",
    startDate: "",
    endDate: "",
    votingEndDate: "",
    maxEntries: 1,
  }
}

function toDateTimeLocal(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return ""
  }

  const offsetMs = date.getTimezoneOffset() * 60 * 1000
  return new Date(date.getTime() - offsetMs).toISOString().slice(0, 16)
}

function toIsoString(value: string) {
  return new Date(value).toISOString()
}

function statusBadge(status: string) {
  const config: Record<string, { color: string; label: string; icon: ReactNode }> = {
    ACTIVE: { color: "#00ff40", label: "LIVE", icon: <Zap className="w-3 h-3" /> },
    UPCOMING: { color: "#00d4ff", label: "UPCOMING", icon: <Clock className="w-3 h-3" /> },
    VOTING: { color: "#ffff00", label: "VOTING", icon: <Vote className="w-3 h-3" /> },
    COMPLETED: { color: "#b0b0d0", label: "COMPLETED", icon: <Trophy className="w-3 h-3" /> },
  }

  const current = config[status] || config.COMPLETED
  return (
    <Badge
      className="font-pixel text-[10px] border"
      style={{
        color: current.color,
        borderColor: `${current.color}40`,
        backgroundColor: `${current.color}15`,
      }}
    >
      {current.icon}
      <span className="ml-1">{current.label}</span>
    </Badge>
  )
}

function formatDate(date: string) {
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })
}

function buildFormFromJam(jam: JamSummary): JamFormState {
  return {
    title: jam.title,
    description: jam.description,
    theme: jam.theme || "",
    rules: jam.rules || "",
    bannerImage: jam.bannerImage || "",
    startDate: toDateTimeLocal(jam.startDate),
    endDate: toDateTimeLocal(jam.endDate),
    votingEndDate: toDateTimeLocal(jam.votingEndDate),
    maxEntries: jam.maxEntries,
  }
}

export function JamManager({ initialJams }: { initialJams: JamSummary[] }) {
  const router = useRouter()
  const [jams, setJams] = useState(initialJams)
  const [showForm, setShowForm] = useState(false)
  const [editingSlug, setEditingSlug] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [deletingSlug, setDeletingSlug] = useState<string | null>(null)
  const [error, setError] = useState("")
  const [form, setForm] = useState<JamFormState>(createEmptyForm())
  const [bannerFile, setBannerFile] = useState<File | null>(null)
  const [removeBanner, setRemoveBanner] = useState(false)

  useEffect(() => {
    setJams(initialJams)
  }, [initialJams])

  function resetForm() {
    setForm(createEmptyForm())
    setBannerFile(null)
    setRemoveBanner(false)
    setEditingSlug(null)
    setError("")
    setShowForm(false)
  }

  function openCreateForm() {
    setForm(createEmptyForm())
    setBannerFile(null)
    setRemoveBanner(false)
    setEditingSlug(null)
    setError("")
    setShowForm(true)
  }

  function openEditForm(jam: JamSummary) {
    setForm(buildFormFromJam(jam))
    setBannerFile(null)
    setRemoveBanner(false)
    setEditingSlug(jam.slug)
    setError("")
    setShowForm(true)
  }

  async function handleSubmit() {
    setSubmitting(true)
    setError("")

    try {
      const payload = new FormData()
      payload.append("title", form.title)
      payload.append("description", form.description)
      payload.append("theme", form.theme)
      payload.append("rules", form.rules)
      payload.append("bannerImage", form.bannerImage)
      payload.append("startDate", toIsoString(form.startDate))
      payload.append("endDate", toIsoString(form.endDate))
      payload.append("votingEndDate", toIsoString(form.votingEndDate))
      payload.append("maxEntries", String(form.maxEntries))

      if (bannerFile) {
        payload.append("bannerFile", bannerFile)
      }

      if (removeBanner) {
        payload.append("removeBanner", "true")
      }

      const isEditing = Boolean(editingSlug)
      const response = await fetch(isEditing ? `/api/jams/${editingSlug}` : "/api/jams", {
        method: isEditing ? "PATCH" : "POST",
        body: payload,
      })

      if (!response.ok) {
        const data = await response.json()
        setError(data.error || "Failed to save jam")
        return
      }

      resetForm()
      router.refresh()
    } catch {
      setError("Failed to save jam")
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDelete(slug: string) {
    if (!window.confirm("Delete this jam? This will also delete all entries and votes.")) {
      return
    }

    setDeletingSlug(slug)
    try {
      const response = await fetch(`/api/jams/${slug}`, { method: "DELETE" })
      if (response.ok) {
        setJams((prev) => prev.filter((jam) => jam.slug !== slug))
        router.refresh()
      }
    } finally {
      setDeletingSlug(null)
    }
  }

  const currentBanner = !removeBanner ? form.bannerImage.trim() : ""
  const isEditing = Boolean(editingSlug)

  return (
    <div className="space-y-4">
      {!showForm ? (
        <Button onClick={openCreateForm} className="gap-2">
          <Plus className="w-4 h-4" />
          Create Game Jam
        </Button>
      ) : (
        <Card className="bg-[#1a1a2e] border-[#2a2a4a] p-5 space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h3 className="font-pixel text-sm text-white">{isEditing ? "EDIT GAME JAM" : "NEW GAME JAM"}</h3>
              <p className="text-xs text-[#8080a0] mt-1">
                Admin controls the theme, banner, rules, timeline, and entry limits here.
              </p>
            </div>
            <button onClick={resetForm} className="text-[#8080a0] hover:text-white" type="button">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Label htmlFor="jam-title">Title *</Label>
              <Input
                id="jam-title"
                value={form.title}
                onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))}
                placeholder="e.g. AI Arcade Challenge #1"
              />
            </div>
            <div>
              <Label htmlFor="jam-theme">Theme *</Label>
              <Input
                id="jam-theme"
                value={form.theme}
                onChange={(event) => setForm((prev) => ({ ...prev, theme: event.target.value }))}
                placeholder="e.g. Gravity Shift"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="jam-description">Description *</Label>
            <Textarea
              id="jam-description"
              value={form.description}
              onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))}
              placeholder="What is the jam about? What should creators build toward?"
              rows={4}
            />
          </div>

          <div>
            <Label htmlFor="jam-rules">Rules</Label>
            <Textarea
              id="jam-rules"
              value={form.rules}
              onChange={(event) => setForm((prev) => ({ ...prev, rules: event.target.value }))}
              placeholder="Submission rules, judging notes, AI usage expectations, or platform constraints."
              rows={4}
            />
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <Label htmlFor="jam-start">Start Date *</Label>
              <Input
                id="jam-start"
                type="datetime-local"
                value={form.startDate}
                onChange={(event) => setForm((prev) => ({ ...prev, startDate: event.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="jam-end">Submission End Date *</Label>
              <Input
                id="jam-end"
                type="datetime-local"
                value={form.endDate}
                onChange={(event) => setForm((prev) => ({ ...prev, endDate: event.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="jam-voting-end">Voting End Date *</Label>
              <Input
                id="jam-voting-end"
                type="datetime-local"
                value={form.votingEndDate}
                onChange={(event) => setForm((prev) => ({ ...prev, votingEndDate: event.target.value }))}
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Label htmlFor="jam-max-entries">Max Entries Per User</Label>
              <Input
                id="jam-max-entries"
                type="number"
                min={1}
                max={10}
                value={form.maxEntries}
                onChange={(event) =>
                  setForm((prev) => ({
                    ...prev,
                    maxEntries: Number.parseInt(event.target.value, 10) || 1,
                  }))
                }
              />
            </div>
            <div className="rounded border border-[#2a2a4a] bg-[#12121c] px-3 py-2 text-xs text-[#8080a0]">
              Jam status is calculated from the dates:
              <div className="mt-2 text-white">Upcoming → Active → Voting → Completed</div>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="jam-banner-file">Banner Image Upload</Label>
              <input
                id="jam-banner-file"
                type="file"
                accept="image/png,image/jpeg,image/webp,image/gif"
                className="block w-full rounded-md border border-[#2a2a4a] bg-[#0d0d15] px-3 py-2 text-sm text-white file:mr-4 file:rounded file:border-0 file:bg-[#6c63ff] file:px-3 file:py-2 file:text-sm file:font-medium file:text-white hover:file:bg-[#7b73ff]"
                onChange={(event) => {
                  const file = event.target.files?.[0] || null
                  setBannerFile(file)
                  if (file) {
                    setRemoveBanner(false)
                  }
                }}
              />
              <p className="text-xs text-[#8080a0]">Use an uploaded banner for the jam page hero. Max size: 5MB.</p>
              {bannerFile && (
                <p className="text-xs text-[#00d4ff]">New file selected: {bannerFile.name}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="jam-banner-url">Banner Image URL</Label>
              <Input
                id="jam-banner-url"
                value={form.bannerImage}
                onChange={(event) => {
                  setForm((prev) => ({ ...prev, bannerImage: event.target.value }))
                  if (event.target.value.trim()) {
                    setRemoveBanner(false)
                  }
                }}
                placeholder="https://..."
              />
              <p className="text-xs text-[#8080a0]">Optional fallback if you prefer to host the jam banner elsewhere.</p>
            </div>
          </div>

          {(currentBanner || bannerFile || removeBanner) && (
            <div className="rounded border border-[#2a2a4a] bg-[#12121c] p-3 space-y-3">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-xs text-white">
                  <ImageIcon className="w-4 h-4 text-[#00d4ff]" />
                  Banner Preview
                </div>
                {isEditing && !removeBanner && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setRemoveBanner(true)
                      setBannerFile(null)
                      setForm((prev) => ({ ...prev, bannerImage: "" }))
                    }}
                  >
                    Remove Banner
                  </Button>
                )}
                {removeBanner && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setRemoveBanner(false)}
                  >
                    Undo Remove
                  </Button>
                )}
              </div>

              {removeBanner ? (
                <div className="rounded border border-dashed border-[#2a2a4a] px-4 py-6 text-sm text-[#8080a0]">
                  The current banner will be removed when you save this jam.
                </div>
              ) : currentBanner ? (
                <img
                  src={currentBanner}
                  alt=""
                  className="w-full max-h-48 rounded object-cover border border-[#2a2a4a]"
                />
              ) : bannerFile ? (
                <div className="rounded border border-dashed border-[#2a2a4a] px-4 py-6 text-sm text-[#8080a0]">
                  New banner file will be uploaded when you save this jam.
                </div>
              ) : null}
            </div>
          )}

          {error && <p className="text-[#ff0040] text-sm">{error}</p>}

          <div className="flex gap-2">
            <Button
              onClick={handleSubmit}
              disabled={
                submitting ||
                !form.title ||
                !form.description ||
                !form.theme ||
                !form.startDate ||
                !form.endDate ||
                !form.votingEndDate
              }
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-1" />
                  {isEditing ? "Saving..." : "Creating..."}
                </>
              ) : isEditing ? (
                "Save Changes"
              ) : (
                "Create Jam"
              )}
            </Button>
            <Button variant="outline" onClick={resetForm} type="button">
              Cancel
            </Button>
          </div>
        </Card>
      )}

      {jams.length === 0 ? (
        <div className="text-center py-8 text-[#4a4a6a]">
          <Trophy className="w-10 h-10 mx-auto mb-3" />
          <p className="font-pixel text-xs">No game jams yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {jams.map((jam) => (
            <div
              key={jam.id}
              className="p-4 bg-[#1a1a2e] border-2 border-[#4a4a6a] rounded space-y-3"
            >
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start">
                {jam.bannerImage ? (
                  <img
                    src={jam.bannerImage}
                    alt=""
                    className="w-full lg:w-48 h-28 rounded object-cover border border-[#2a2a4a] flex-shrink-0"
                  />
                ) : (
                  <div className="w-full lg:w-48 h-28 rounded border border-dashed border-[#2a2a4a] flex items-center justify-center text-[#4a4a6a] flex-shrink-0">
                    <ImageIcon className="w-5 h-5" />
                  </div>
                )}

                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <h4 className="font-pixel text-xs text-white">{jam.title}</h4>
                    {statusBadge(jam.status)}
                  </div>

                  <p className="text-sm text-[#c8c8d8] mb-2 line-clamp-2">{jam.description}</p>

                  <div className="flex flex-wrap items-center gap-4 text-xs text-[#8080a0]">
                    <span>{jam.theme ? `Theme: ${jam.theme}` : "No theme set"}</span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {formatDate(jam.startDate)} - {formatDate(jam.endDate)}
                    </span>
                    <span className="flex items-center gap-1">
                      <Users className="w-3 h-3" />
                      {jam.entryCount} entries
                    </span>
                    <span>Max {jam.maxEntries}/creator</span>
                  </div>
                </div>

                <div className="flex gap-2 flex-shrink-0">
                  <a href={`/jams/${jam.slug}`} target="_blank" rel="noopener noreferrer">
                    <Button variant="ghost" size="sm">
                      View
                    </Button>
                  </a>
                  <Button variant="ghost" size="sm" className="gap-1" onClick={() => openEditForm(jam)}>
                    <Edit className="w-3 h-3" />
                    Edit
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-[#ff0040] hover:text-[#ff0040] gap-1"
                    onClick={() => handleDelete(jam.slug)}
                    disabled={deletingSlug === jam.slug}
                  >
                    {deletingSlug === jam.slug ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <Trash2 className="w-3 h-3" />
                    )}
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
