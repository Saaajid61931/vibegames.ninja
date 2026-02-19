import { ImageResponse } from "next/og"

export const alt = "VibeGames.Ninja - AI Arcade"
export const size = { width: 1200, height: 630 }
export const contentType = "image/png"
export const runtime = "edge"

export default async function OGImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#0d0d15",
          backgroundImage:
            "radial-gradient(circle at 25% 25%, #1a1a2e 0%, transparent 50%), radial-gradient(circle at 75% 75%, #1a1a2e 0%, transparent 50%)",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "20px",
            marginBottom: "32px",
          }}
        >
          <div
            style={{
              width: "80px",
              height: "80px",
              backgroundColor: "#ffff00",
              borderRadius: "16px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "48px",
            }}
          >
            🎮
          </div>
        </div>
        <div
          style={{
            display: "flex",
            fontSize: "64px",
            fontWeight: 900,
            color: "white",
            letterSpacing: "-2px",
          }}
        >
          <span style={{ color: "#ffff00" }}>VIBE</span>
          <span>GAMES</span>
          <span style={{ color: "#4a4a6a", fontSize: "48px", marginLeft: "8px" }}>.ai</span>
        </div>
        <div
          style={{
            display: "flex",
            fontSize: "24px",
            color: "#4a4a6a",
            marginTop: "16px",
            letterSpacing: "4px",
          }}
        >
          AI-MADE GAMES COMMUNITY
        </div>
        <div
          style={{
            display: "flex",
            gap: "24px",
            marginTop: "48px",
          }}
        >
          {["BUILD", "PLAY", "GET INSPIRED"].map((label) => (
            <div
              key={label}
              style={{
                display: "flex",
                padding: "12px 32px",
                border: "2px solid #ffff00",
                color: "#ffff00",
                fontSize: "20px",
                letterSpacing: "2px",
              }}
            >
              {label}
            </div>
          ))}
        </div>
      </div>
    ),
    {
      ...size,
    }
  )
}
