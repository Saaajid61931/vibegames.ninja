import { ImageResponse } from "next/og"

export const runtime = "edge"
export const contentType = "image/png"
export const size = {
  width: 1200,
  height: 630,
}

interface ImageProps {
  params: Promise<{ slug: string }>
}

function formatTitle(slug: string): string {
  return slug
    .split("-")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ")
}

export default async function OpengraphImage({ params }: ImageProps) {
  const { slug } = await params
  const title = formatTitle(slug)

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "linear-gradient(135deg, #0d0d15 0%, #1a1a2e 50%, #141424 100%)",
          padding: "56px",
          color: "#ffffff",
        }}
      >
        <div
          style={{
            display: "inline-flex",
            alignSelf: "flex-start",
            border: "4px solid #ffff00",
            padding: "10px 18px",
            color: "#ffff00",
            fontSize: 30,
            letterSpacing: 2,
          }}
        >
          AI ARCADE
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "20px", maxWidth: "1000px" }}>
          <div style={{ fontSize: 68, fontWeight: 800, lineHeight: 1.05 }}>{title}</div>
          <div style={{ fontSize: 28, color: "#9ea0cc" }}>Play this game on vibegames.ninja</div>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ color: "#ff0040", fontSize: 24, letterSpacing: 2 }}>BROWSER GAME</div>
          <div style={{ color: "#ffff00", fontSize: 28, fontWeight: 700 }}>VibeGames.ai</div>
        </div>
      </div>
    ),
    {
      ...size,
    }
  )
}
