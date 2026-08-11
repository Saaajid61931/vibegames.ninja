"use client"

import { type ReactNode, useEffect, useState } from "react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/components/ui/toast"
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
    ACTIVE: { color: "var(--color-arcade-green)", label: "LIVE", icon: <Zap className="w-3 h-3" /> },
    UPCOMING: { color: "var(--color-arcade-cyan)", label: "UPCOMING", icon: <Clock className="w-3 h-3" /> },
    VOTING: { color: "var(--color-arcade-yellow)", label: "VOTING", icon: <Vote className="w-3 h-3" /> },
    COMPLETED: { color: "var(--color-text-secondary)", label: "COMPLETED", icon: <Trophy className="w-3 h-3" /> },
  }

  const current = config[status] || config.COMPLETED
  return (
    <Badge
      className="border text-xs font-bold uppercase tracking-wide"
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

const BANNER_ASPECT_RATIO = 3
const BANNER_ASPECT_TOLERANCE = 0.05

async function isThreeToOneBanner(source: string) {
  if (typeof window === "undefined") {
    return true
  }

  return new Promise<boolean>((resolve) => {
    const image = new window.Image()

    image.onload = () => {
      const aspectRatio = image.naturalWidth / image.naturalHeight
      resolve(Math.abs(aspectRatio - BANNER_ASPECT_RATIO) <= BANNER_ASPECT_TOLERANCE)
    }

    image.onerror = () => resolve(false)
    image.src = source
  })
}

export function JamManager({ initialJams }: { initialJams: JamSummary[] }) {
  const router = useRouter()
  const showToast = useToast()
  const [jams, setJams] = useState(initialJams)
  const [showForm, setShowForm] = useState(false)
  const [editingSlug, setEditingSlug] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [deletingSlug, setDeletingSlug] = useState<string | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<JamSummary | null>(null)
  const [error, setError] = useState("")
  const [bannerAspectError, setBannerAspectError] = useState("")
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
    setBannerAspectError("")
    setShowForm(false)
  }

  function openCreateForm() {
    setForm(createEmptyForm())
    setBannerFile(null)
    setRemoveBanner(false)
    setEditingSlug(null)
    setError("")
    setBannerAspectError("")
    setShowForm(true)
  }

  function openEditForm(jam: JamSummary) {
    setForm(buildFormFromJam(jam))
    setBannerFile(null)
    setRemoveBanner(false)
    setEditingSlug(jam.slug)
    setError("")
    setBannerAspectError("")
    setShowForm(true)
  }

  async function validateBannerSource(source: string, message: string) {
    const isValid = await isThreeToOneBanner(source)
    setBannerAspectError(isValid ? "" : message)
    return isValid
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

  async function handleDelete() {
    const slug = deleteTarget?.slug
    if (!slug) return

    setDeletingSlug(slug)
    try {
      const response = await fetch(`/api/jams/${slug}`, { method: "DELETE" })
      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        throw new Error(data.error || "Failed to delete game jam")
      }

      setJams((prev) => prev.filter((jam) => jam.slug !== slug))
      showToast({
        title: "Game jam deleted",
        description: "The jam, entries, and votes were removed.",
        tone: "success",
      })
      router.refresh()
    } catch (deleteError) {
      showToast({
        title: "Delete failed",
        description: deleteError instanceof Error ? deleteError.message : "Failed to delete game jam.",
        tone: "error",
      })
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
        <Card className="bg-surface-2 border-border p-5 space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h3 className="heading-pixel-sm text-white">{isEditing ? "EDIT GAME JAM" : "NEW GAME JAM"}</h3>
              <p className="text-xs text-text-secondary mt-1">
                Admin controls the theme, banner, rules, timeline, and entry limits here.
              </p>
            </div>
            <button onClick={resetForm} className="text-text-secondary hover:text-white" type="button" aria-label="Close jam form">
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
            <div className="rounded border border-border bg-surface px-3 py-2 text-xs text-text-secondary">
              Jam status is calculated from the dates:
              <div className="mt-2 text-white">
                Upcoming {"->"} Active {"->"} Voting {"->"} Completed
              </div>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="jam-banner-file">Banner Image Upload</Label>
              <input
                id="jam-banner-file"
                type="file"
                accept="image/png,image/jpeg,image/webp,image/gif"
                className="block w-full rounded-md border border-border bg-canvas px-3 py-2 text-sm text-white file:mr-4 file:rounded file:border-0 file:bg-primary file:px-3 file:py-2 file:text-sm file:font-medium file:text-white hover:file:bg-primary-hover"
                onChange={(event) => {
                  const file = event.target.files?.[0] || null
                  setBannerFile(file)
                  if (file) {
                    setRemoveBanner(false)
                    const objectUrl = URL.createObjectURL(file)
                    void validateBannerSource(
                      objectUrl,
                      "Banner image must use a 3:1 ratio, like 1500x500."
                    ).finally(() => URL.revokeObjectURL(objectUrl))
                  } else {
                    setBannerAspectError("")
                  }
                }}
              />
              <p className="text-xs text-text-secondary">Use a 3:1 banner for desktop and mobile, like 1500x500. Max size: 5MB.</p>
              {bannerFile && (
                <p className="text-xs text-arcade-cyan">New file selected: {bannerFile.name}</p>
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
                  } else {
                    setBannerAspectError("")
                  }
                }}
                onBlur={() => {
                  const bannerUrl = form.bannerImage.trim()
                  if (!bannerUrl || bannerFile) {
                    return
                  }

                  void validateBannerSource(
                    bannerUrl,
                    "Banner image URL must point to a 3:1 image, like 1500x500."
                  )
                }}
                placeholder="https://..."
              />
              <p className="text-xs text-text-secondary">Optional fallback if you prefer to host the jam banner elsewhere. Keep it 3:1.</p>
            </div>
          </div>

          {bannerAspectError && <p className="text-arcade-red text-sm">{bannerAspectError}</p>}

          {(currentBanner || bannerFile || removeBanner) && (
            <div className="rounded border border-border bg-surface p-3 space-y-3">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-xs text-white">
                  <ImageIcon className="w-4 h-4 text-arcade-cyan" />
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
                      setBannerAspectError("")
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
                    onClick={() => {
                      setRemoveBanner(false)
                      setBannerAspectError("")
                    }}
                  >
                    Undo Remove
                  </Button>
                )}
              </div>

              {removeBanner ? (
                <div className="rounded border border-dashed border-border px-4 py-6 text-sm text-text-secondary">
                  The current banner will be removed when you save this jam.
                </div>
              ) : currentBanner ? (
                <Image
                  src={currentBanner}
                  alt={`${form.title || "Jam"} banner preview`}
                  width={1500}
                  height={500}
                  unoptimized
                  className="aspect-[3/1] w-full rounded object-cover border border-border"
                />
              ) : bannerFile ? (
                <div className="rounded border border-dashed border-border px-4 py-6 text-sm text-text-secondary">
                  New banner file will be uploaded when you save this jam.
                </div>
              ) : null}
            </div>
          )}

          {error && <p className="text-arcade-red text-sm">{error}</p>}

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
                !form.votingEndDate ||
                Boolean(bannerAspectError)
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
        <div className="text-center py-8 text-text-secondary">
          <Trophy className="w-10 h-10 mx-auto mb-3" />
          <p className="text-xs font-bold uppercase tracking-wide">No game jams yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {jams.map((jam) => (
            <div
              key={jam.id}
              className="p-4 bg-surface-2 border-2 border-border-strong rounded space-y-3"
            >
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start">
                {jam.bannerImage ? (
                  <Image
                    src={jam.bannerImage}
                    alt={`${jam.title} banner`}
                    width={960}
                    height={320}
                    className="aspect-[3/1] w-full rounded object-cover border border-border flex-shrink-0 lg:w-48"
                  />
                ) : (
                  <div className="aspect-[3/1] w-full rounded border border-dashed border-border flex items-center justify-center text-text-secondary flex-shrink-0 lg:w-48">
                    <ImageIcon className="w-5 h-5" />
                  </div>
                )}

                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <h4 className="heading-pixel-sm text-white">{jam.title}</h4>
                    {statusBadge(jam.status)}
                  </div>

                  <p className="text-sm text-text-secondary mb-2 line-clamp-2">{jam.description}</p>

                  <div className="flex flex-wrap items-center gap-4 text-xs text-text-secondary">
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
                    className="text-arcade-red hover:text-arcade-red gap-1"
                    onClick={() => setDeleteTarget(jam)}
                    disabled={deletingSlug === jam.slug}
                    aria-label={`Delete ${jam.title}`}
                    title={`Delete ${jam.title}`}
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

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => {
          if (!open && !deletingSlug) setDeleteTarget(null)
        }}
        title="Delete this game jam?"
        description="This also removes every entry and vote. This action cannot be undone."
        confirmLabel="Delete jam"
        confirmVariant="arcade-red"
        onConfirm={handleDelete}
      />
    </div>
  )
}
