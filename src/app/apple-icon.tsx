import { ImageResponse } from "next/og"

export const size = {
  width: 180,
  height: 180,
}

export const contentType = "image/png"

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          height: "100%",
          width: "100%",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #0d0d15 0%, #1a1a2e 100%)",
          color: "#ffff00",
          fontSize: 72,
          fontWeight: 800,
          letterSpacing: 2,
        }}
      >
        VG
      </div>
    ),
    size
  )
}
