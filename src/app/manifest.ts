import type { MetadataRoute } from "next"

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "VibeGames.Ninja",
    short_name: "VibeGames",
    description: "Build, play, and remix AI-made browser games.",
    start_url: "/",
    display: "standalone",
    background_color: "#0d0d15",
    theme_color: "#0f1219",
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
      },
      {
        src: "/apple-icon",
        sizes: "180x180",
        type: "image/png",
      },
    ],
  }
}
