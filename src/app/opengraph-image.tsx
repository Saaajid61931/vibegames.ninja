import { ImageResponse } from "next/og"

export const runtime = "edge"
export const alt = "VibeGames.Ninja - Play, build, and share AI-made browser games"
export const size = { width: 1200, height: 630 }
export const contentType = "image/png"

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "64px 72px",
          color: "#f6f7fb",
          background: "#0d0d15",
          fontFamily: "Arial",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
          <div
            style={{
              width: "72px",
              height: "72px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              borderRadius: "18px",
              border: "4px solid #00ff88",
              color: "#00ff88",
              fontSize: "42px",
              fontWeight: 900,
            }}
          >
            VG
          </div>
          <div style={{ display: "flex", color: "#00ff88", fontSize: "30px", fontWeight: 800 }}>
            VIBEGAMES.NINJA
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "22px" }}>
          <div style={{ display: "flex", fontSize: "72px", lineHeight: 1.05, fontWeight: 900 }}>
            PLAY. BUILD. INSPIRE.
          </div>
          <div style={{ display: "flex", color: "#b9c1d8", fontSize: "32px" }}>
            Discover AI-made browser games and publish your own.
          </div>
        </div>

        <div style={{ display: "flex", gap: "18px", color: "#20d8ff", fontSize: "24px", fontWeight: 700 }}>
          AI ARCADE  /  GAME JAMS  /  NO DOWNLOADS
        </div>
      </div>
    ),
    { ...size }
  )
}
