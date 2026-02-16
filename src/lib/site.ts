const rawSiteUrl = process.env.NEXT_PUBLIC_APP_URL || "https://vibegames.ai"

const normalizedSiteUrl = rawSiteUrl.startsWith("http") ? rawSiteUrl : `https://${rawSiteUrl}`

export const SITE_URL = normalizedSiteUrl.replace(/\/$/, "")
export const SITE_NAME = "VibeGames.ai"
export const SITE_DESCRIPTION = "A community for AI-made games. Build, play, and get inspired."
