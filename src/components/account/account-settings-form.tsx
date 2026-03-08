"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { Loader2, Save } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { getInitials } from "@/lib/utils"

interface AccountSettingsFormProps {
  initialName: string
  initialBio: string
  initialImage: string
  email: string
  username: string | null
}

export function AccountSettingsForm({
  initialName,
  initialBio,
  initialImage,
  email,
  username,
}: AccountSettingsFormProps) {
  const router = useRouter()
  const { update } = useSession()
  const [savedName, setSavedName] = useState(initialName)
  const [savedUsername, setSavedUsername] = useState(username || "")
  const [savedBio, setSavedBio] = useState(initialBio)
  const [name, setName] = useState(initialName)
  const [usernameValue, setUsernameValue] = useState(username || "")
  const [bio, setBio] = useState(initialBio)
  const [avatarUrl, setAvatarUrl] = useState(initialImage)
  const [avatarStatus, setAvatarStatus] = useState<"idle" | "uploading" | "success" | "error">("idle")
  const [avatarMessage, setAvatarMessage] = useState("")
  const [status, setStatus] = useState<"idle" | "saving" | "success" | "error">("idle")
  const [message, setMessage] = useState("")

  const hasChanges =
    name.trim() !== savedName.trim() ||
    usernameValue.trim() !== savedUsername.trim() ||
    bio.trim() !== savedBio.trim()

  const uploadAvatar = async (file: File) => {
    setAvatarStatus("uploading")
    setAvatarMessage("Uploading avatar...")

    try {
      const formData = new FormData()
      formData.append("avatar", file)

      const res = await fetch("/api/account/avatar", {
        method: "POST",
        body: formData,
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.message || data.error || "Failed to upload avatar")
      }

      const nextImageUrl = typeof data.image === "string" ? data.image : ""
      setAvatarUrl(nextImageUrl)
      setAvatarStatus("success")
      setAvatarMessage("Avatar updated.")

      await update({
        image: nextImageUrl,
        name: name.trim() || null,
        username: usernameValue.trim() || null,
      })

      router.refresh()
    } catch (error) {
      setAvatarStatus("error")
      setAvatarMessage(error instanceof Error ? error.message : "Failed to upload avatar")
    }
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    setStatus("saving")
    setMessage("")

    try {
      const res = await fetch("/api/account/profile", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          username: usernameValue,
          bio,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.message || data.error || "Failed to update profile")
      }

      await update({
        name: data.user?.name || name.trim(),
        username: data.user?.username || null,
        image: avatarUrl || null,
      })

      setSavedName(data.user?.name || name.trim())
      setSavedUsername(data.user?.username || usernameValue.trim())
      setSavedBio(data.user?.bio || bio.trim())
      setName(data.user?.name || name.trim())
      setUsernameValue(data.user?.username || usernameValue.trim())
      setBio(data.user?.bio || bio.trim())
      setStatus("success")
      setMessage("Profile updated.")
      router.refresh()
    } catch (error) {
      setStatus("error")
      setMessage(error instanceof Error ? error.message : "Failed to update profile")
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-2)] p-4">
        <div className="flex flex-wrap items-center gap-4">
          <Avatar className="h-20 w-20 border border-[var(--color-border)]">
            <AvatarImage src={avatarUrl || undefined} />
            <AvatarFallback>{getInitials(name || usernameValue || "P")}</AvatarFallback>
          </Avatar>

          <div className="min-w-[240px] flex-1 space-y-2">
            <Label htmlFor="account-avatar">Avatar</Label>
            <Input
              id="account-avatar"
              type="file"
              accept="image/png,image/jpeg,image/webp,image/gif"
              onChange={(event) => {
                const file = event.target.files?.[0]
                event.currentTarget.value = ""
                if (!file) {
                  return
                }

                void uploadAvatar(file)
              }}
              disabled={avatarStatus === "uploading"}
              className="h-auto py-2"
            />
            <p className="text-xs text-[var(--color-text-tertiary)]">
              PNG, JPG, WEBP, or GIF up to 2MB.
            </p>
            {avatarMessage ? (
              <p
                className={`text-xs ${
                  avatarStatus === "error"
                    ? "text-[var(--color-danger)]"
                    : avatarStatus === "uploading"
                      ? "text-[var(--color-text-tertiary)]"
                      : "text-[var(--color-success)]"
                }`}
              >
                {avatarStatus === "uploading" ? "Uploading avatar..." : avatarMessage}
              </p>
            ) : null}
          </div>
        </div>
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="account-name">Display name</Label>
          <Input
            id="account-name"
            value={name}
            onChange={(event) => {
              setName(event.target.value)
              if (status !== "idle") {
                setStatus("idle")
                setMessage("")
              }
            }}
            placeholder="Your display name"
            maxLength={60}
          />
          <p className="text-xs text-[var(--color-text-tertiary)]">
            This is shown around the site when your full name is available.
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="account-email">Email</Label>
          <Input id="account-email" value={email} readOnly className="bg-[var(--color-surface)] text-[var(--color-text-secondary)]" />
          <p className="text-xs text-[var(--color-text-tertiary)]">
            Email changes are not editable yet.
          </p>
        </div>
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="account-username">Username</Label>
          <Input
            id="account-username"
            value={usernameValue}
            onChange={(event) => {
              setUsernameValue(event.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))
              if (status !== "idle") {
                setStatus("idle")
                setMessage("")
              }
            }}
            placeholder="Pick a username"
            minLength={3}
            maxLength={24}
          />
          <p className="text-xs text-[var(--color-text-tertiary)]">
            Letters, numbers, and underscores only. This controls your public creator URL.
          </p>
          <p className="text-xs text-[var(--color-primary)]">
            {usernameValue ? `Public profile: /creator/${usernameValue}` : "Set a username to get a public creator link."}
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="account-bio">Bio</Label>
          <Textarea
            id="account-bio"
            value={bio}
            onChange={(event) => {
              setBio(event.target.value)
              if (status !== "idle") {
                setStatus("idle")
                setMessage("")
              }
            }}
            placeholder="Tell players a little about yourself"
            maxLength={280}
            className="min-h-[140px]"
          />
          <div className="flex items-center justify-between text-xs text-[var(--color-text-tertiary)]">
            <span>Shown on your creator profile when you publish games.</span>
            <span>{bio.length}/280</span>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[var(--color-border)] pt-5">
        <div className="text-sm">
          {message ? (
            <p className={status === "error" ? "text-[var(--color-danger)]" : "text-[var(--color-success)]"}>
              {message}
            </p>
          ) : (
            <p className="text-[var(--color-text-tertiary)]">
              Save your display name and bio here.
            </p>
          )}
        </div>

        <Button type="submit" className="gap-2" disabled={status === "saving" || !hasChanges}>
          {status === "saving" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          {status === "saving" ? "Saving..." : "Save Changes"}
        </Button>
      </div>
    </form>
  )
}
