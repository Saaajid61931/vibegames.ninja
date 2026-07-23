"use client"

import { useState } from "react"
import { Share2, Copy, Check, QrCode, Code2, Trophy } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

interface ShareKitModalProps {
  gameId: string
  gameSlug: string
  gameTitle: string
  creatorName?: string
}

export function ShareKitModal({ gameId, gameSlug, gameTitle, creatorName }: ShareKitModalProps) {
  const [open, setOpen] = useState(false)
  const [copiedLink, setCopiedLink] = useState(false)
  const [copiedEmbed, setCopiedEmbed] = useState(false)
  const [copiedChallenge, setCopiedChallenge] = useState(false)
  
  const [targetScoreInput, setTargetScoreInput] = useState("1000")
  const [challengeUrl, setChallengeUrl] = useState("")
  const [creatingChallenge, setCreatingChallenge] = useState(false)

  const baseUrl = typeof window !== "undefined" ? window.location.origin : "https://vibegames.ninja"
  const gameUrl = `${baseUrl}/play/${gameSlug}`
  const embedCode = `<iframe src="${baseUrl}/play/${gameSlug}" width="800" height="600" frameborder="0" allow="fullscreen; gamepad; accelerometer; gyroscope"></iframe>`
  const qrCodeApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(gameUrl)}`

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(gameUrl)
      setCopiedLink(true)
      setTimeout(() => setCopiedLink(false), 2000)
    } catch {
      // ignore
    }
  }

  const handleCopyEmbed = async () => {
    try {
      await navigator.clipboard.writeText(embedCode)
      setCopiedEmbed(true)
      setTimeout(() => setCopiedEmbed(false), 2000)
    } catch {
      // ignore
    }
  }

  const handleCreateChallenge = async () => {
    const scoreNum = parseInt(targetScoreInput, 10)
    if (isNaN(scoreNum) || scoreNum <= 0) return

    try {
      setCreatingChallenge(true)
      const res = await fetch("/api/challenges", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ gameId, targetScore: scoreNum }),
      })
      if (res.ok) {
        const data = await res.json()
        setChallengeUrl(data.challengeUrl)
      }
    } catch {
      // ignore
    } finally {
      setCreatingChallenge(false)
    }
  }

  const handleCopyChallenge = async () => {
    if (!challengeUrl) return
    try {
      await navigator.clipboard.writeText(challengeUrl)
      setCopiedChallenge(true)
      setTimeout(() => setCopiedChallenge(false), 2000)
    } catch {
      // ignore
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5 font-arcade text-xs border-[#4a4a6a]">
          <Share2 className="w-3.5 h-3.5 text-[#ffff00]" />
          SHARE KIT
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-md bg-[#0d0d15] border-2 border-[#4a4a6a] text-white p-5 space-y-4">
        <DialogHeader>
          <DialogTitle className="font-pixel text-sm text-white flex items-center gap-2">
            <Share2 className="w-4 h-4 text-[#ffff00]" />
            Playable Post & Share Kit
          </DialogTitle>
        </DialogHeader>

        {/* 1. Instant Playable URL */}
        <div className="space-y-1.5">
          <label className="font-arcade text-[10px] text-[#8b93a6] block">CANONICAL PLAY LINK</label>
          <div className="flex gap-2">
            <Input
              readOnly
              value={gameUrl}
              className="bg-black border-[#2e3446] font-mono text-xs text-[#00d1ff]"
            />
            <Button type="button" size="sm" variant="arcade" onClick={() => void handleCopyLink()} className="shrink-0">
              {copiedLink ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            </Button>
          </div>
        </div>

        {/* 2. Score Challenge Builder */}
        <div className="space-y-2 p-3 bg-[#11111d] border border-[#2e3446] rounded">
          <label className="font-arcade text-[10px] text-[#ffff00] flex items-center gap-1.5">
            <Trophy className="w-3.5 h-3.5" />
            CREATE HIGH-SCORE CHALLENGE
          </label>
          <div className="flex gap-2">
            <Input
              type="number"
              value={targetScoreInput}
              onChange={(e) => setTargetScoreInput(e.target.value)}
              placeholder="Target score"
              className="bg-black border-[#2e3446] font-mono text-xs w-28"
            />
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={creatingChallenge}
              onClick={() => void handleCreateChallenge()}
              className="font-arcade text-xs"
            >
              GENERATE LINK
            </Button>
          </div>

          {challengeUrl && (
            <div className="flex gap-2 pt-1">
              <Input
                readOnly
                value={challengeUrl}
                className="bg-black border-[#2e3446] font-mono text-[11px] text-[#ffff00]"
              />
              <Button type="button" size="sm" variant="arcade" onClick={() => void handleCopyChallenge()}>
                {copiedChallenge ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              </Button>
            </div>
          )}
        </div>

        {/* 3. Embed Code & QR Code Row */}
        <div className="grid grid-cols-2 gap-3 pt-1">
          <div className="space-y-1.5">
            <label className="font-arcade text-[10px] text-[#8b93a6] flex items-center gap-1">
              <Code2 className="w-3 h-3" />
              WEB EMBED CODE
            </label>
            <textarea
              readOnly
              rows={4}
              value={embedCode}
              className="w-full bg-black border border-[#2e3446] p-2 font-mono text-[10px] text-[#8b93a6] rounded resize-none"
            />
            <Button type="button" size="sm" variant="outline" className="w-full text-xs font-arcade" onClick={() => void handleCopyEmbed()}>
              {copiedEmbed ? "COPIED!" : "COPY EMBED CODE"}
            </Button>
          </div>

          <div className="space-y-1.5 flex flex-col items-center justify-center text-center p-2 bg-[#11111d] border border-[#2e3446] rounded">
            <label className="font-arcade text-[10px] text-[#8b93a6] flex items-center gap-1">
              <QrCode className="w-3 h-3" />
              SCAN TO PLAY
            </label>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={qrCodeApiUrl}
              alt={`QR Code for ${gameTitle}`}
              className="w-24 h-24 border border-[#4a4a6a] rounded p-1 bg-white"
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
