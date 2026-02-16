"use client"

import { useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Plus, Trophy, Trash2, Edit, Calendar, Users, Zap, Vote, Clock, X, Loader2 } from "lucide-react"

type JamSummary = {
  id: string
  title: string
  slug: string
  status: string
  theme: string | null
  startDate: string
  endDate: string
  votingEndDate: string
  entryCount: number
}

function statusBadge(status: string) {
  const config: Record<string, { color: string; label: string; icon: React.ReactNode }> = {
    ACTIVE: { color: "#00ff40", label: "LIVE", icon: <Zap className="w-3 h-3" /> },
    UPCOMING: { color: "#00d4ff", label: "UPCOMING", icon: <Clock className="w-3 h-3" /> },
    VOTING: { color: "#ffff00", label: "VOTING", icon: <Vote className="w-3 h-3" /> },
    COMPLETED: { color: "#b0b0d0", label: "COMPLETED", icon: <Trophy className="w-3 h-3" /> },
  }
  const c = config[status] || config.COMPLETED
  return (
    <Badge
      className="font-pixel text-[10px] border"
      style={{ color: c.color, borderColor: c.color + "40", backgroundColor: c.color + "15" }}
    >
      {c.icon}
      <span className="ml-1">{c.label}</span>
    </Badge>
  )
}

function formatDate(date: string) {
  return new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
}

export function JamManager({ initialJams }: { initialJams: JamSummary[] }) {
  const router = useRouter()
  const [jams, setJams] = useState(initialJams)
  const [showForm, setShowForm] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [deletingSlug, setDeletingSlug] = useState<string | null>(null)
  const [error, setError] = useState("")
  const [form, setForm] = useState({
    title: "",
    description: "",
    theme: "",
    rules: "",
    bannerImage: "",
    startDate: "",
    endDate: "",
    votingEndDate: "",
    maxEntries: 1,
  })

  const handleCreate = useCallback(async () => {
    setSubmitting(true)
    setError("")

    try {
      const payload = {
        ...form,
        startDate: new Date(form.startDate).toISOString(),
        endDate: new Date(form.endDate).toISOString(),
        votingEndDate: new Date(form.votingEndDate).toISOString(),
        theme: form.theme || undefined,
        rules: form.rules || undefined,
        bannerImage: form.bannerImage || undefined,
      }

      const res = await fetch("/api/jams", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const data = await res.json()
        setError(data.error || "Failed to create jam")
        return
      }

      setShowForm(false)
      setForm({
        title: "",
        description: "",
        theme: "",
        rules: "",
        bannerImage: "",
        startDate: "",
        endDate: "",
        votingEndDate: "",
        maxEntries: 1,
      })
      router.refresh()
    } catch {
      setError("Failed to create jam")
    } finally {
      setSubmitting(false)
    }
  }, [form, router])

  const handleDelete = useCallback(async (slug: string) => {
    if (!confirm("Delete this jam? This will also delete all entries and votes.")) return

    setDeletingSlug(slug)
    try {
      const res = await fetch(`/api/jams/${slug}`, { method: "DELETE" })
      if (res.ok) {
        setJams((prev) => prev.filter((j) => j.slug !== slug))
        router.refresh()
      }
    } catch {
      // silent
    } finally {
      setDeletingSlug(null)
    }
  }, [router])

  return (
    <div className="space-y-4">
      {!showForm ? (
        <Button onClick={() => setShowForm(true)} className="gap-2">
          <Plus className="w-4 h-4" />
          Create Game Jam
        </Button>
      ) : (
        <Card className="bg-[#1a1a2e] border-[#2a2a4a] p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-pixel text-sm text-white">NEW GAME JAM</h3>
            <button onClick={() => setShowForm(false)} className="text-[#8080a0] hover:text-white">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Label htmlFor="jam-title">Title *</Label>
              <Input
                id="jam-title"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="e.g. AI Arcade Challenge #1"
              />
            </div>
            <div>
              <Label htmlFor="jam-theme">Theme</Label>
              <Input
                id="jam-theme"
                value={form.theme}
                onChange={(e) => setForm({ ...form, theme: e.target.value })}
                placeholder="e.g. Gravity"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="jam-description">Description *</Label>
            <Textarea
              id="jam-description"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="What's this jam about?"
              rows={3}
            />
          </div>

          <div>
            <Label htmlFor="jam-rules">Rules</Label>
            <Textarea
              id="jam-rules"
              value={form.rules}
              onChange={(e) => setForm({ ...form, rules: e.target.value })}
              placeholder="Any specific rules for participants"
              rows={3}
            />
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <Label htmlFor="jam-start">Start Date *</Label>
              <Input
                id="jam-start"
                type="datetime-local"
                value={form.startDate}
                onChange={(e) => setForm({ ...form, startDate: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="jam-end">Submission End Date *</Label>
              <Input
                id="jam-end"
                type="datetime-local"
                value={form.endDate}
                onChange={(e) => setForm({ ...form, endDate: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="jam-voting-end">Voting End Date *</Label>
              <Input
                id="jam-voting-end"
                type="datetime-local"
                value={form.votingEndDate}
                onChange={(e) => setForm({ ...form, votingEndDate: e.target.value })}
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
                onChange={(e) => setForm({ ...form, maxEntries: parseInt(e.target.value) || 1 })}
              />
            </div>
            <div>
              <Label htmlFor="jam-banner">Banner Image URL</Label>
              <Input
                id="jam-banner"
                value={form.bannerImage}
                onChange={(e) => setForm({ ...form, bannerImage: e.target.value })}
                placeholder="https://..."
              />
            </div>
          </div>

          {error && <p className="text-[#ff0040] text-sm">{error}</p>}

          <div className="flex gap-2">
            <Button onClick={handleCreate} disabled={submitting || !form.title || !form.description || !form.startDate || !form.endDate || !form.votingEndDate}>
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-1" />
                  Creating...
                </>
              ) : (
                "Create Jam"
              )}
            </Button>
            <Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
          </div>
        </Card>
      )}

      {/* Jams list */}
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
              className="flex items-center gap-4 p-4 bg-[#1a1a2e] border-2 border-[#4a4a6a] rounded"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-pixel text-xs text-white truncate">{jam.title}</h4>
                  {statusBadge(jam.status)}
                </div>
                <div className="flex items-center gap-4 text-xs text-[#8080a0]">
                  {jam.theme && <span>Theme: {jam.theme}</span>}
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {formatDate(jam.startDate)} - {formatDate(jam.endDate)}
                  </span>
                  <span className="flex items-center gap-1">
                    <Users className="w-3 h-3" />
                    {jam.entryCount} entries
                  </span>
                </div>
              </div>
              <div className="flex gap-2 flex-shrink-0">
                <a href={`/jams/${jam.slug}`} target="_blank" rel="noopener noreferrer">
                  <Button variant="ghost" size="sm" className="gap-1">
                    <Edit className="w-3 h-3" />
                    View
                  </Button>
                </a>
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
          ))}
        </div>
      )}
    </div>
  )
}
