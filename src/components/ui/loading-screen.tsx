"use client"

import { useEffect, useState } from "react"
import { NinjaConsole } from "@/components/icons/ninja-console"

const NINJA_MESSAGES = [
  "SHARPENING SHURIKEN...",
  "PRACTICING STEALTH...",
  "CHANNELING CHI...",
  "VANISHING INTO SHADOWS...",
  "MASTERING JUTSU...",
  "LOADING NINJUTSU...",
]

interface LoadingScreenProps {
  message?: string
  fullScreen?: boolean
}

export function LoadingScreen({
  message,
  fullScreen = true,
}: LoadingScreenProps) {
  const [msgIndex, setMsgIndex] = useState(0)

  useEffect(() => {
    if (message) return
    const interval = setInterval(() => {
      setMsgIndex((i) => (i + 1) % NINJA_MESSAGES.length)
    }, 2400)
    return () => clearInterval(interval)
  }, [message])

  const displayMessage = message || NINJA_MESSAGES[msgIndex]

  return (
    <div
      className={`flex flex-col items-center justify-center ${
        fullScreen ? "min-h-screen" : "min-h-[60vh]"
      }`}
      style={{ background: fullScreen ? "var(--color-base)" : "transparent" }}
    >
      <div className="flex flex-col items-center gap-6">
        {/* Mascot */}
        <div>
          <NinjaConsole className="h-24 w-24 sm:h-28 sm:w-28" animated />
        </div>

        {/* Loading bar */}
        <div className="w-40 sm:w-48">
          <div
            className="h-1.5 rounded-full overflow-hidden"
            style={{ background: "var(--color-surface)" }}
          >
            <div
              className="h-full rounded-full"
              style={{
                background: "var(--color-primary)",
                animation: "loadingBar 1.6s ease-in-out infinite",
              }}
            />
          </div>
        </div>

        {/* Message */}
        <p
          className="font-pixel text-xs tracking-widest"
          style={{
            color: "var(--color-text-tertiary)",
            animation: "loadingPulse 2s ease-in-out infinite",
          }}
        >
          {displayMessage}
        </p>
      </div>

      <style>{`
        @keyframes loadingBar {
          0% { width: 0%; margin-left: 0; }
          50% { width: 70%; margin-left: 15%; }
          100% { width: 0%; margin-left: 100%; }
        }
        @keyframes loadingPulse {
          0%, 100% { opacity: 0.4; }
          50% { opacity: 1; }
        }
      `}</style>
    </div>
  )
}
