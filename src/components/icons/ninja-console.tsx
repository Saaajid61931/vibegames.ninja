"use client"

import { useEffect, useState } from "react"

interface NinjaConsoleProps {
  className?: string
  animated?: boolean
}

export function NinjaConsole({ className = "h-6 w-6", animated = true }: NinjaConsoleProps) {
  const [mode, setMode] = useState<"relaxed" | "attack">("relaxed")
  const [isBlinking, setIsBlinking] = useState(false)

  useEffect(() => {
    if (!animated) return

    // Mode shifting: switch between relaxed and attack every 8-15 seconds
    const modeInterval = setInterval(() => {
      setMode((prev) => (prev === "relaxed" ? "attack" : "relaxed"))
    }, 8000 + Math.random() * 7000)

    // Blinking: blink every 3-6 seconds
    const blinkInterval = setInterval(() => {
      setIsBlinking(true)
      setTimeout(() => setIsBlinking(false), 150)
    }, 3000 + Math.random() * 3000)

    return () => {
      clearInterval(modeInterval)
      clearInterval(blinkInterval)
    }
  }, [animated])

  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      style={{ display: "block" }}
    >
      <defs>
        <filter id="screenGlow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="0.5" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>

      {/* Body */}
      <rect
        x="3"
        y="2"
        width="18"
        height="20"
        rx="2"
        fill="#1e1e2e"
        stroke="#2a2a3e"
        strokeWidth="0.5"
      />

      {/* Headband */}
      <rect x="3" y="2" width="18" height="4" rx="2" fill="#6366f1" />
      <rect x="3" y="4" width="18" height="2" fill="#6366f1" />

      {/* Headband tails flowing to the right */}
      <path
        d="M19 4 L23 3 L21 4 L23 5 Z"
        fill="#6366f1"
        style={{
          transformOrigin: "19px 4px",
          animation: animated ? "tailWag 2s ease-in-out infinite" : "none",
        }}
      />

      {/* Screen/face area */}
      <rect x="5" y="7" width="14" height="8" rx="1" fill="#0f0f1a" stroke="#1a1a2e" strokeWidth="0.5" />

      {/* Face expression - changes with mode */}
      {isBlinking ? (
        // Blinking - peaceful closed eyes for both modes
        <>
          {/* Closed eyes - curved lines showing contentment */}
          <path d="M8 10.5 Q9 9.5 10 10.5" stroke="#ffffff" strokeWidth="0.7" strokeLinecap="round" fill="none" />
          <path d="M14 10.5 Q15 9.5 16 10.5" stroke="#ffffff" strokeWidth="0.7" strokeLinecap="round" fill="none" />
          {/* Relaxed smile even when blinking */}
          <path d="M10 12.5 Q12 13.5 14 12.5" stroke="#ffffff" strokeWidth="0.6" strokeLinecap="round" fill="none" />
        </>
      ) : mode === "relaxed" ? (
        // Relaxed mode - peaceful and content
        <>
          {/* Soft happy eyes - curved like upside-down U */}
          <path d="M8 10.5 Q9 9.3 10 10.5" stroke="#ffffff" strokeWidth="0.8" strokeLinecap="round" fill="none" filter="url(#screenGlow)" />
          <path d="M14 10.5 Q15 9.3 16 10.5" stroke="#ffffff" strokeWidth="0.8" strokeLinecap="round" fill="none" filter="url(#screenGlow)" />
          {/* Gentle content smile - wider and softer */}
          <path d="M9.5 12.5 Q12 14 14.5 12.5" stroke="#ffffff" strokeWidth="0.6" strokeLinecap="round" fill="none" />
          {/* Small cheek highlights for extra cuteness */}
          <circle cx="7.5" cy="11.5" r="0.4" fill="#ffffff" opacity="0.3" />
          <circle cx="16.5" cy="11.5" r="0.4" fill="#ffffff" opacity="0.3" />
        </>
      ) : (
        // Attack mode - fierce and determined
        <>
          {/* Angry eyebrows - slanted down toward center */}
          <line x1="7.5" y1="9.5" x2="10" y2="10.5" stroke="#6366f1" strokeWidth="0.9" strokeLinecap="round" />
          <line x1="14" y1="10.5" x2="16.5" y2="9.5" stroke="#6366f1" strokeWidth="0.9" strokeLinecap="round" />
          {/* Fierce eyes - sharp angled shapes */}
          <path d="M8 11 L10 10 L10 12 Z" fill="#6366f1" />
          <path d="M16 11 L14 10 L14 12 Z" fill="#6366f1" />
          {/* Intense gritted teeth mouth - zigzag pattern */}
          <path d="M10 13.5 L10.5 13 L11 13.5 L11.5 13 L12 13.5 L12.5 13 L13 13.5 L13.5 13 L14 13.5" stroke="#6366f1" strokeWidth="0.7" strokeLinecap="round" strokeLinejoin="round" fill="none" />
          {/* Intensity lines near eyes */}
          <line x1="7" y1="11" x2="6" y2="10.5" stroke="#6366f1" strokeWidth="0.5" strokeLinecap="round" opacity="0.6" />
          <line x1="17" y1="11" x2="18" y2="10.5" stroke="#6366f1" strokeWidth="0.5" strokeLinecap="round" opacity="0.6" />
        </>
      )}

      {/* D-pad */}
      <rect x="6" y="17" width="4" height="1.2" rx="0.3" fill="#3a3a50" />
      <rect x="7.4" y="15.6" width="1.2" height="4" rx="0.3" fill="#3a3a50" />

      {/* Action buttons */}
      <circle cx="16" cy="17" r="1" fill="#6366f1" />
      <circle cx="18" cy="18.5" r="1" fill="#818cf8" />

      <style>{`
        @keyframes tailWag {
          0%, 100% { transform: rotate(0deg); }
          50% { transform: rotate(-5deg); }
        }
      `}</style>
    </svg>
  )
}
