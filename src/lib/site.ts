const rawSiteUrl = process.env.NEXT_PUBLIC_APP_URL || "https://vibegames.ninja"

const normalizedSiteUrl = rawSiteUrl.startsWith("http") ? rawSiteUrl : `https://${rawSiteUrl}`

export const SITE_URL = normalizedSiteUrl.replace(/\/$/, "")
export const SITE_NAME = "VibeGames.Ninja"
export const SITE_DESCRIPTION = "Discover and share games made with AI. Meet creators, collect ideas, and share what you make."
