"use client"

import { useEffect, useState } from "react"

interface NinjaConsoleProps {
  className?: string
  animated?: boolean
}

export function NinjaConsole({ className = "h-6 w-6", animated = true }: NinjaConsoleProps) {
  const [mode, setMode] = useState<"happy" | "attack" | "surprised">("happy")
  const [isBlinking, setIsBlinking] = useState(false)
  const primaryColor = "var(--color-primary)"
  const primaryHoverColor = "var(--color-primary-hover)"

  useEffect(() => {
    if (!animated) return

    // Cycle expressions automatically so all mascot animations play without interaction.
    const modeCycle: Array<"happy" | "surprised" | "attack" | "happy"> = ["happy", "surprised", "attack", "happy"]
    let modeIndex = 0
    const modeInterval = setInterval(() => {
      modeIndex = (modeIndex + 1) % modeCycle.length
      setMode(modeCycle[modeIndex])
    }, 3400)

    // Blinking every 3-6 seconds.
    const blinkInterval = setInterval(() => {
      setIsBlinking(true)
      setTimeout(() => setIsBlinking(false), 150)
    }, 3000 + Math.random() * 3000)

    return () => {
      clearInterval(modeInterval)
      clearInterval(blinkInterval)
    }
  }, [animated])

  const displayMode = animated ? mode : "happy"
  const blinking = animated && isBlinking
  const eyeColor = displayMode === "attack" ? "#ff0055" : displayMode === "surprised" ? "#aa00ff" : "#00ff88"
  const screenOverlay = displayMode === "attack" ? "rgba(255, 0, 85, 0.14)" : displayMode === "surprised" ? "rgba(170, 0, 255, 0.1)" : "rgba(0, 255, 136, 0.08)"

  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      style={{ display: "block" }}
      aria-hidden="true"
      focusable="false"
    >
      <ellipse cx="12" cy="22.3" rx="4" ry="0.9" fill="#040611" opacity="0.55" />

      <g>
        {animated && (
          <animateTransform
            attributeName="transform"
            type="translate"
            values="0 0; 0 -0.7; 0 0"
            dur="4s"
            repeatCount="indefinite"
          />
        )}

        {/* Main body */}
        <rect x="4.5" y="2.2" width="15" height="18.6" rx="2.2" fill="#1a1f31" stroke="#252d46" strokeWidth="0.6" />
        <rect x="8.7" y="3.05" width="6.6" height="0.55" rx="0.27" fill="#0a0f1d" opacity="0.85" />

        {/* Headband */}
        <rect x="4.5" y="3.5" width="15" height="1.65" fill={primaryColor} />
        <rect x="4.5" y="5.05" width="15" height="0.45" fill={primaryHoverColor} />
        <circle cx="4.5" cy="4.3" r="0.85" fill={primaryColor} />

        {/* Headband tails */}
        <path d="M4.2 4.45 Q2.4 3.8 0.7 5.45 Q2.2 5.15 4.45 4.92 Z" fill={primaryColor}>
          {animated && (
            <animateTransform
              attributeName="transform"
              type="rotate"
              values="0 4.2 4.45; -14 4.2 4.45; 0 4.2 4.45"
              dur="3s"
              repeatCount="indefinite"
            />
          )}
        </path>
        <path d="M4.2 4.58 Q2.8 5.7 1 7.3 Q2.8 6.3 4.5 5.18 Z" fill={primaryHoverColor}>
          {animated && (
            <animateTransform
              attributeName="transform"
              type="rotate"
              values="0 4.2 4.58; -11 4.2 4.58; 0 4.2 4.58"
              dur="4s"
              repeatCount="indefinite"
            />
          )}
        </path>

        {/* Screen */}
        <rect x="6" y="5.85" width="12" height="5.85" rx="0.9" fill="#0d1117" stroke="#131a2b" strokeWidth="0.35" />
        <rect x="6" y="5.85" width="12" height="5.85" rx="0.9" fill={screenOverlay} />
        <path d="M6.25 6.1 L15.6 6.1 L8.8 11.45 L6.25 11.45 Z" fill="#ffffff" opacity="0.05" />

        {/* Expressions */}
        <g transform="translate(0 -0.85)">
          {blinking ? (
            <>
              <path d="M8.1 8.6 Q8.9 7.85 9.7 8.6" stroke={eyeColor} strokeWidth="0.65" strokeLinecap="round" fill="none" />
              <path d="M14.3 8.6 Q15.1 7.85 15.9 8.6" stroke={eyeColor} strokeWidth="0.65" strokeLinecap="round" fill="none" />
            </>
          ) : displayMode === "happy" ? (
            <>
              <path d="M7.95 8.62 Q8.85 7.25 9.85 8.62" stroke={eyeColor} strokeWidth="0.72" strokeLinecap="round" fill="none" />
              <path d="M14.15 8.62 Q15.15 7.25 16.05 8.62" stroke={eyeColor} strokeWidth="0.72" strokeLinecap="round" fill="none" />
              <ellipse cx="7.6" cy="9.5" rx="0.62" ry="0.38" fill={eyeColor} opacity="0.45" />
              <ellipse cx="16.4" cy="9.5" rx="0.62" ry="0.38" fill={eyeColor} opacity="0.45" />
            </>
          ) : displayMode === "surprised" ? (
            <>
              <circle cx="8.9" cy="8.55" r="0.8" fill="none" stroke={eyeColor} strokeWidth="0.55" />
              <circle cx="15.1" cy="8.55" r="0.8" fill="none" stroke={eyeColor} strokeWidth="0.55" />
              <circle cx="12" cy="9.85" r="0.35" fill={eyeColor} />
            </>
          ) : (
            <>
              <path d="M8 7.7 L10.05 8.58 L8.45 9.25 Z" fill={eyeColor} />
              <path d="M16 7.7 L13.95 8.58 L15.55 9.25 Z" fill={eyeColor} />
              <path d="M8.2 10.1 L7.65 10.75" stroke={eyeColor} strokeWidth="0.35" strokeLinecap="round" />
              <path d="M15.8 10.1 L16.35 10.75" stroke={eyeColor} strokeWidth="0.35" strokeLinecap="round" />
            </>
          )}
        </g>

        {/* Ninja mask */}
        <path d="M4.5 8.7 Q12 10.05 19.5 8.7 L19.5 12.7 Q12 14.05 4.5 12.7 Z" fill="#0f1017" />
        <path d="M6 8.95 Q12 10 18 8.95 L18 12.05 Q12 12.85 6 12.05 Z" fill="#05060a" />
        <path d="M10 9.45 Q10.95 10.6 10.4 11.95 M14 9.45 Q13.05 10.6 13.6 11.95" stroke="#232a3e" strokeWidth="0.24" strokeLinecap="round" fill="none" />

        {/* Controls */}
        <g transform="translate(8.2 15.2)">
          <path d="M0 -1.35 L0.38 -0.5 L1.25 0 L0.38 0.5 L0 1.35 L-0.38 0.5 L-1.25 0 L-0.38 -0.5 Z" fill="#20d8ff" />
          <path d="M0 -0.82 L0.22 -0.28 L0.82 0 L0.22 0.28 L0 0.82 L-0.22 0.28 L-0.82 0 L-0.22 -0.28 Z" fill="#ffffff" />
          <circle cx="0" cy="0" r="0.22" fill="#0d1117" />
        </g>

        <circle cx="15.15" cy="14.6" r="0.72" fill="#252d46" />
        <circle cx="15.15" cy="14.6" r="0.54" fill="#ff0055" />
        <text x="15.15" y="14.85" fontFamily="sans-serif" fontSize="0.55" fill="#ffffff" fontWeight="700" textAnchor="middle">A</text>

        <circle cx="13.35" cy="16.4" r="0.72" fill="#252d46" />
        <circle cx="13.35" cy="16.4" r="0.54" fill="#aa00ff" />
        <text x="13.35" y="16.65" fontFamily="sans-serif" fontSize="0.55" fill="#ffffff" fontWeight="700" textAnchor="middle">B</text>

        <rect x="7.1" y="18" width="1.35" height="0.36" rx="0.18" fill="#4a5568" transform="rotate(-24 7.1 18)" />
        <rect x="8.95" y="18" width="1.35" height="0.36" rx="0.18" fill="#4a5568" transform="rotate(-24 8.95 18)" />

        <g fill="#0d1117">
          <circle cx="14.45" cy="18.2" r="0.13" />
          <circle cx="15.05" cy="18.2" r="0.13" />
          <circle cx="15.65" cy="18.2" r="0.13" />
          <circle cx="14.15" cy="18.72" r="0.13" />
          <circle cx="14.75" cy="18.72" r="0.13" />
          <circle cx="15.35" cy="18.72" r="0.13" />
        </g>
      </g>
    </svg>
  )
}
