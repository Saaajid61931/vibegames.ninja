import type { MetadataRoute } from "next"
import prisma from "@/lib/prisma"
import { SITE_URL } from "@/lib/site"

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [games, creators, studios, jams] = await Promise.all([
    prisma.game.findMany({
      where: { status: "PUBLISHED" },
      select: { slug: true, updatedAt: true },
      orderBy: { updatedAt: "desc" },
    }),
    prisma.user.findMany({
      where: {
        username: { not: null },
        games: {
          some: { status: "PUBLISHED" },
        },
      },
      select: { username: true, updatedAt: true },
      orderBy: { updatedAt: "desc" },
    }),
    prisma.studioProfile.findMany({
      where: {
        games: {
          some: { status: "PUBLISHED" },
        },
      },
      select: { handle: true, updatedAt: true },
      orderBy: { updatedAt: "desc" },
    }),
    prisma.gameJam.findMany({
      select: { slug: true, updatedAt: true },
      orderBy: { updatedAt: "desc" },
    }),
  ])

  const staticPages: MetadataRoute.Sitemap = [
    {
      url: `${SITE_URL}/`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: `${SITE_URL}/games`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${SITE_URL}/jams`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.8,
    },
    {
      url: `${SITE_URL}/privacy`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.3,
    },
    {
      url: `${SITE_URL}/terms`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.3,
    },
  ]

  const gamePages: MetadataRoute.Sitemap = games.map((game) => ({
    url: `${SITE_URL}/play/${game.slug}`,
    lastModified: game.updatedAt,
    changeFrequency: "daily",
    priority: 0.8,
  }))

  const creatorPages: MetadataRoute.Sitemap = creators
    .filter((creator) => Boolean(creator.username))
    .map((creator) => ({
      url: `${SITE_URL}/creator/${creator.username}`,
      lastModified: creator.updatedAt,
      changeFrequency: "weekly",
      priority: 0.6,
    }))

  const studioPages: MetadataRoute.Sitemap = studios.map((studio) => ({
    url: `${SITE_URL}/studio/${studio.handle}`,
    lastModified: studio.updatedAt,
    changeFrequency: "weekly",
    priority: 0.6,
  }))

  const jamPages: MetadataRoute.Sitemap = jams.map((jam) => ({
    url: `${SITE_URL}/jams/${jam.slug}`,
    lastModified: jam.updatedAt,
    changeFrequency: "daily",
    priority: 0.7,
  }))

  return [...staticPages, ...gamePages, ...creatorPages, ...studioPages, ...jamPages]
}
