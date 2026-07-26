"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import {
  ArrowDown,
  ArrowUpRight,
  Gamepad2,
  Play,
  UsersRound,
} from "lucide-react"
import {
  HomeGameBackdrop,
  type HomeBackdropGame,
} from "@/components/home/home-game-backdrop"
import { NinjaConsole } from "@/components/icons/ninja-console"
import type { HomePageData } from "@/lib/home-page-data"

type MobileHomeIntroSlideProps = {
  backgroundGames: HomeBackdropGame[]
  stats: HomePageData["stats"]
  onStart: () => void
}

const fallbackAccentHues = [190, 238, 340, 46] as const
const metricFormatter = new Intl.NumberFormat("en-US", {
  notation: "compact",
  maximumFractionDigits: 1,
})

function getFallbackAccentHue(source: string) {
  const hash = Array.from(source).reduce(
    (value, character) => (value * 31 + character.charCodeAt(0)) >>> 0,
    0
  )
  return fallbackAccentHues[hash % fallbackAccentHues.length]
}

export function MobileHomeIntroSlide({
  backgroundGames,
  stats,
  onStart,
}: MobileHomeIntroSlideProps) {
  const [activeThumbnail, setActiveThumbnail] = useState<string | null>(null)
  const [accent, setAccent] = useState({ source: "", hue: 238 })

  useEffect(() => {
    if (!activeThumbnail) return

    let cancelled = false
    const image = new Image()
    image.decoding = "async"

    image.onload = () => {
      if (cancelled) return

      try {
        const canvas = document.createElement("canvas")
        canvas.width = 24
        canvas.height = 24
        const context = canvas.getContext("2d", { willReadFrequently: true })
        if (!context) throw new Error("Canvas is unavailable")

        context.drawImage(image, 0, 0, canvas.width, canvas.height)
        const pixels = context.getImageData(
          0,
          0,
          canvas.width,
          canvas.height
        ).data
        const hueWeights = Array.from({ length: 24 }, () => 0)

        for (let index = 0; index < pixels.length; index += 4) {
          if (pixels[index + 3] < 180) continue

          const red = pixels[index] / 255
          const green = pixels[index + 1] / 255
          const blue = pixels[index + 2] / 255
          const maximum = Math.max(red, green, blue)
          const minimum = Math.min(red, green, blue)
          const chroma = maximum - minimum
          const lightness = (maximum + minimum) / 2
          if (chroma < 0.05 || lightness < 0.08 || lightness > 0.94) continue

          const saturation =
            chroma / Math.max(0.001, 1 - Math.abs(2 * lightness - 1))
          let hue = 0
          if (maximum === red) {
            hue = 60 * (((green - blue) / chroma) % 6)
          } else if (maximum === green) {
            hue = 60 * ((blue - red) / chroma + 2)
          } else {
            hue = 60 * ((red - green) / chroma + 4)
          }
          if (hue < 0) hue += 360

          const weight =
            Math.pow(saturation, 1.65) *
            (0.45 + Math.min(lightness, 0.72)) *
            (0.55 + chroma)
          hueWeights[Math.min(23, Math.floor(hue / 15))] += weight
        }

        const strongestWeight = Math.max(...hueWeights)
        const strongestHue =
          strongestWeight > 0.25
            ? hueWeights.indexOf(strongestWeight) * 15 + 7.5
            : getFallbackAccentHue(activeThumbnail)

        setAccent({ source: activeThumbnail, hue: strongestHue })
      } catch {
        setAccent({
          source: activeThumbnail,
          hue: getFallbackAccentHue(activeThumbnail),
        })
      }
    }

    image.onerror = () => {
      if (!cancelled) {
        setAccent({
          source: activeThumbnail,
          hue: getFallbackAccentHue(activeThumbnail),
        })
      }
    }
    image.src = `/_next/image?url=${encodeURIComponent(activeThumbnail)}&w=64&q=75`

    return () => {
      cancelled = true
      image.onload = null
      image.onerror = null
    }
  }, [activeThumbnail])

  const accentHue = accent.hue
  const communityMetrics = [
    {
      label: "GAMES",
      value: stats.games,
      icon: Gamepad2,
      color: "#facc15",
    },
    {
      label: "CREATORS",
      value: stats.creators,
      icon: UsersRound,
      color: "#00d1ff",
    },
    {
      label: "PLAYS",
      value: stats.plays,
      icon: Play,
      color: "#f43f5e",
    },
  ] as const

  return (
    <section
      data-index="-1"
      data-slide
      aria-labelledby="mobile-home-intro-title"
      className="relative isolate h-full w-full shrink-0 snap-start snap-always overflow-hidden bg-[#090b12] text-white"
      style={{ height: "100%" }}
    >
      <HomeGameBackdrop
        games={backgroundGames}
        variant="mobile"
        onActiveThumbnailChange={setActiveThumbnail}
      />

      <div
        className="pointer-events-none absolute -bottom-[5%] -left-[38%] z-30 h-[54%] w-[176%] origin-bottom opacity-36"
        aria-hidden="true"
        style={{
          backgroundImage:
            "linear-gradient(rgba(0,209,255,0.22) 1px, transparent 1px), linear-gradient(90deg, rgba(129,140,248,0.26) 1px, transparent 1px)",
          backgroundSize: "28px 28px",
          transform: "perspective(360px) rotateX(60deg)",
          maskImage:
            "linear-gradient(to top, black 4%, rgba(0,0,0,0.76) 42%, transparent 86%)",
        }}
      />

      {activeThumbnail ? (
        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 z-30 h-[22%] overflow-hidden"
          aria-hidden="true"
        >
          <div
            key={`${activeThumbnail}-${Math.round(accentHue)}`}
            className="home-game-accent-glow absolute -bottom-[85%] left-1/2 h-[160%] w-[128%] -translate-x-1/2 rounded-[50%] blur-[16px] mix-blend-screen"
            style={{
              background: `radial-gradient(ellipse at center, rgba(255,255,255,0.58) 0%, hsl(${accentHue} 100% 76% / 0.62) 8%, hsl(${accentHue} 96% 58% / 0.36) 28%, hsl(${accentHue} 90% 46% / 0.12) 52%, transparent 72%)`,
            }}
          />
          <div
            className="absolute inset-x-[34%] -bottom-px h-px bg-white/60 blur-[0.5px]"
            style={{
              boxShadow: `0 -2px 16px hsl(${accentHue} 100% 66% / 0.78)`,
            }}
          />
        </div>
      ) : null}

      <header className="absolute inset-x-0 top-0 z-50 flex items-center justify-between gap-3 pb-3 pl-[max(1.5rem,env(safe-area-inset-left))] pr-[max(1.5rem,env(safe-area-inset-right))] pt-[max(1.5rem,env(safe-area-inset-top))] [@media(max-height:650px)]:pt-4">
        <div className="flex min-w-0 items-center gap-2.5">
          <NinjaConsole
            className="h-10 w-10 shrink-0 drop-shadow-[0_7px_14px_rgba(0,0,0,0.55)]"
            animated
          />
          <div className="min-w-0">
            <p
              className="truncate font-pixel text-white"
              style={{ fontSize: "8px" }}
            >
              <span className="text-[#818cf8]">VIBE</span>GAMES
              <span className="text-[#aab2c4]">.NINJA</span>
            </p>
            <p
              className="mt-0.5 truncate font-pixel text-[#00d1ff]"
              style={{ fontSize: "6px" }}
            >
              COMMUNITY ARCADE
            </p>
          </div>
        </div>

        <Link
          href="/upload"
          prefetch={false}
          className="flex h-9 shrink-0 items-center gap-1 border border-[#596176] bg-[#090b12]/75 px-2.5 font-pixel text-white backdrop-blur-md transition-colors hover:border-[#facc15] hover:text-[#facc15]"
          style={{ fontSize: "7px" }}
        >
          BUILD <span className="hidden min-[330px]:inline">A GAME</span>
          <ArrowUpRight className="h-3 w-3" aria-hidden="true" />
        </Link>
      </header>

      <main className="absolute inset-x-0 top-[clamp(15.5rem,39dvh,20.5rem)] z-40 px-[max(1.5rem,env(safe-area-inset-left))]">
        <div className="mx-auto w-full max-w-sm text-center">
          <div className="inline-flex items-center gap-2">
            <span className="h-px w-5 bg-[#00d1ff]/75" aria-hidden="true" />
            <p
              className="font-pixel text-[#00d1ff] drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)]"
              style={{ fontSize: "7px" }}
            >
              THE COMMUNITY FOR AI GAMES
            </p>
            <span className="h-px w-5 bg-[#00d1ff]/75" aria-hidden="true" />
          </div>

          <h1
            id="mobile-home-intro-title"
            className="mt-2.5 font-pixel leading-none tracking-[0.02em] text-white drop-shadow-[0_3px_14px_rgba(0,0,0,0.95)]"
            style={{ fontSize: "clamp(1.55rem, min(8.6vw, 4.9vh), 2.5rem)" }}
          >
            PLAY. BUILD.
            <span className="mt-1 block text-[#facc15] drop-shadow-[3px_3px_0_#f43f5e]">
              INSPIRE.
            </span>
          </h1>

          <p className="mx-auto mt-2.5 max-w-xs text-[10px] leading-[1.45] text-[#e0e4ee] drop-shadow-[0_2px_8px_rgba(0,0,0,1)] min-[360px]:text-[11px] [@media(max-height:650px)]:hidden">
            Play games made with AI, discover what others are building, and
            share something that inspires what comes next.
          </p>

          <div
            className="mx-auto mt-3.5 grid max-w-[21rem] grid-cols-3 border-l border-t border-[#596176]/75 bg-[#080a11]/78 shadow-[0_14px_36px_rgba(0,0,0,0.3)] backdrop-blur-md [@media(max-height:650px)]:mt-2"
            aria-label="VibeGames community totals"
          >
            {communityMetrics.map((metric) => {
              const Icon = metric.icon
              return (
                <div
                  key={metric.label}
                  className="relative flex min-h-[3.4rem] items-center justify-center gap-2 border-b border-r border-[#596176]/75 px-2 py-1 [@media(max-height:650px)]:min-h-[3rem]"
                >
                  <span
                    className="absolute inset-x-0 top-0 h-0.5"
                    style={{ backgroundColor: metric.color }}
                    aria-hidden="true"
                  />
                  <Icon
                    className="h-3.5 w-3.5"
                    style={{ color: metric.color }}
                    aria-hidden="true"
                  />
                  <span className="text-left">
                    <span
                      className="block font-pixel leading-none text-white"
                      style={{ fontSize: "10px" }}
                    >
                      {metricFormatter.format(metric.value)}
                    </span>
                    <span
                      className="mt-1 block font-pixel leading-none text-[#aeb7ca]"
                      style={{ fontSize: "5.5px" }}
                    >
                      {metric.label}
                    </span>
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      </main>

      <button
        type="button"
        onClick={onStart}
        className="group absolute bottom-[max(1rem,env(safe-area-inset-bottom))] left-1/2 z-50 flex -translate-x-1/2 flex-col items-center gap-2 text-center [@media(max-height:650px)]:bottom-2 [@media(max-height:650px)]:gap-1"
        aria-label="Scroll to the first game"
      >
        <span
          className="font-pixel text-[#c8cedd] drop-shadow-[0_2px_8px_rgba(0,0,0,1)] transition-colors group-hover:text-white"
          style={{ fontSize: "7px" }}
        >
          SCROLL TO PLAY
        </span>
        <span className="relative flex h-11 w-11 items-center justify-center rounded-full border-2 border-white bg-[#6366f1] text-white shadow-[0_4px_0_#f43f5e,0_10px_30px_rgba(99,102,241,0.4)] transition-transform group-hover:translate-y-1 group-active:translate-y-2">
          <ArrowDown
            className="h-5 w-5 animate-bounce motion-reduce:animate-none"
            aria-hidden="true"
          />
        </span>
      </button>
    </section>
  )
}
