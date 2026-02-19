"use client"

import { useEffect, useState } from "react"
import { NinjaConsole } from "@/components/icons/ninja-console"

const NINJA_MESSAGES = [
  "SHARPENING SHURIKEN...",
  "PRACTICING STEALTH...",
  "CHANNELING CHI...",
  "VANISHING INTO SHADOWS...",
  "MASTERING JUTSU...",
  "PREPARING SMOKE BOMBS...",
  "TRAINING IN THE DOJO...",
  "LOADING NINJUTSU...",
]

interface LoadingScreenProps {
  message?: string
  fullScreen?: boolean
}

/** Inline SVG shuriken (4-pointed throwing star) */
function Shuriken({ size = 20 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
      style={{ animation: "shurikenSpin 0.4s linear infinite" }}
    >
      <path d="M12 2 L14 10 L12 8 L10 10 Z" fill="var(--color-primary)" opacity="0.7" />
      <path d="M22 12 L14 14 L16 12 L14 10 Z" fill="var(--color-primary)" opacity="0.7" />
      <path d="M12 22 L10 14 L12 16 L14 14 Z" fill="var(--color-primary)" opacity="0.7" />
      <path d="M2 12 L10 10 L8 12 L10 14 Z" fill="var(--color-primary)" opacity="0.7" />
      <circle cx="12" cy="12" r="2" fill="var(--color-primary-hover)" />
    </svg>
  )
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
    }, 2200)
    return () => clearInterval(interval)
  }, [message])

  const displayMessage = message || NINJA_MESSAGES[msgIndex]

  return (
    <div
      className={`flex flex-col items-center justify-center overflow-hidden relative ${
        fullScreen ? "min-h-screen" : "min-h-[60vh]"
      }`}
      style={{ background: fullScreen ? "var(--color-base)" : "transparent" }}
    >
      {/* === Flying shuriken === */}
      {[0, 1, 2].map((i) => (
        <div
          key={`shuriken-${i}`}
          className="absolute pointer-events-none"
          style={{
            animation: `shurikenFly ${3 + i * 0.8}s linear infinite`,
            animationDelay: `${i * 1.4}s`,
            opacity: 0,
          }}
        >
          <Shuriken size={16 + i * 4} />
        </div>
      ))}

      {/* === Slash effects === */}
      {[0, 1, 2].map((i) => (
        <div
          key={`slash-${i}`}
          className="absolute pointer-events-none"
          style={{
            width: "140px",
            height: "2px",
            background:
              "linear-gradient(90deg, transparent, var(--color-primary), transparent)",
            animation: `slashEffect${i} 4s ease-in-out infinite`,
            animationDelay: `${i * 1.5}s`,
            opacity: 0,
          }}
        />
      ))}

      {/* === Smoke puffs rising from under mascot === */}
      {[0, 1, 2, 3, 4].map((i) => (
        <div
          key={`smoke-${i}`}
          className="absolute rounded-full pointer-events-none"
          style={{
            width: `${6 + i * 2}px`,
            height: `${6 + i * 2}px`,
            background: "var(--color-primary)",
            opacity: 0,
            animation: `smokeRise ${2.2 + i * 0.4}s ease-out infinite`,
            animationDelay: `${i * 0.6}s`,
            left: `${44 + i * 3}%`,
            bottom: "30%",
          }}
        />
      ))}

      {/* === Center content === */}
      <div className="flex flex-col items-center gap-6 relative z-10">
        {/* Mascot with ninja jump */}
        <div className="relative" style={{ animation: "ninjaJump 3s ease-in-out infinite" }}>
          <NinjaConsole className="h-24 w-24 sm:h-28 sm:w-28" animated />
        </div>

        {/* Shadow under mascot (squishes on land) */}
        <div
          className="rounded-full blur-md -mt-4"
          style={{
            width: "64px",
            height: "10px",
            background: "var(--color-primary)",
            animation: "shadowSquish 3s ease-in-out infinite",
          }}
        />

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

        {/* Cycling message */}
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

      {/* === Keyframes === */}
      <style>{`
        /* Loading bar slides across */
        @keyframes loadingBar {
          0% { width: 0%; margin-left: 0; }
          50% { width: 70%; margin-left: 15%; }
          100% { width: 0%; margin-left: 100%; }
        }

        /* Message pulses */
        @keyframes loadingPulse {
          0%, 100% { opacity: 0.4; }
          50% { opacity: 1; }
        }

        /* Mascot jumps up periodically */
        @keyframes ninjaJump {
          0%, 100% { transform: translateY(0) scaleY(1); }
          8%  { transform: translateY(0) scaleY(0.85) scaleX(1.1); }
          18% { transform: translateY(-28px) scaleY(1.08) scaleX(0.95); }
          30% { transform: translateY(-32px) scaleY(1) scaleX(1); }
          48% { transform: translateY(0) scaleY(0.88) scaleX(1.08); }
          56% { transform: translateY(0) scaleY(1) scaleX(1); }
        }

        /* Shadow scales with jump */
        @keyframes shadowSquish {
          0%, 100% { opacity: 0.3; transform: scaleX(1); }
          8%  { opacity: 0.4; transform: scaleX(1.3); }
          18% { opacity: 0.1; transform: scaleX(0.5); }
          30% { opacity: 0.08; transform: scaleX(0.4); }
          48% { opacity: 0.4; transform: scaleX(1.4); }
          56% { opacity: 0.3; transform: scaleX(1); }
        }

        /* Shuriken flies across the screen */
        @keyframes shurikenFly {
          0%   { left: -8%; top: 25%; opacity: 0; }
          5%   { opacity: 0.8; }
          50%  { top: 55%; }
          95%  { opacity: 0.8; }
          100% { left: 108%; top: 40%; opacity: 0; }
        }

        /* Shuriken spins fast */
        @keyframes shurikenSpin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        /* Slash effect #0 — top-left to bottom-right */
        @keyframes slashEffect0 {
          0%, 42% { opacity: 0; left: 20%; top: 25%; transform: rotate(-35deg) scaleX(0); }
          45% { opacity: 0.9; transform: rotate(-35deg) scaleX(1.2); }
          52% { opacity: 0; left: 20%; top: 25%; transform: rotate(-35deg) scaleX(1.5); }
          100% { opacity: 0; }
        }

        /* Slash effect #1 — right side downward */
        @keyframes slashEffect1 {
          0%, 42% { opacity: 0; right: 18%; top: 30%; left: auto; transform: rotate(40deg) scaleX(0); }
          45% { opacity: 0.9; transform: rotate(40deg) scaleX(1.2); }
          52% { opacity: 0; right: 18%; top: 30%; transform: rotate(40deg) scaleX(1.5); }
          100% { opacity: 0; }
        }

        /* Slash effect #2 — horizontal through center */
        @keyframes slashEffect2 {
          0%, 42% { opacity: 0; left: 30%; top: 48%; transform: rotate(-5deg) scaleX(0); }
          45% { opacity: 0.7; transform: rotate(-5deg) scaleX(1.4); }
          52% { opacity: 0; left: 30%; top: 48%; transform: rotate(-5deg) scaleX(1.8); }
          100% { opacity: 0; }
        }

        /* Smoke puffs rise and fade */
        @keyframes smokeRise {
          0% { opacity: 0; transform: translateY(0) scale(0.4); }
          15% { opacity: 0.25; }
          100% { opacity: 0; transform: translateY(-70px) scale(1.6); }
        }
      `}</style>
    </div>
  )
}
