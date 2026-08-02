import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { SITE_URL } from "@/lib/site"

export const dynamic = "force-dynamic"

const CACHE_CONTROL = "public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800"

function fallbackImage(request: Request) {
  return fetch(new URL("/opengraph-image", request.url))
}

function isAllowedThumbnailUrl(url: URL) {
  const allowedOrigins = new Set([new URL(SITE_URL).origin])
  const r2BaseUrl = process.env.R2_PUBLIC_BASE_URL?.trim()

  if (r2BaseUrl) {
    try {
      const normalizedR2Url = r2BaseUrl.startsWith("http") ? r2BaseUrl : `https://${r2BaseUrl}`
      allowedOrigins.add(new URL(normalizedR2Url).origin)
    } catch {
      // Invalid storage configuration is handled by the branded fallback.
    }
  }

  return url.protocol === "https:" && allowedOrigins.has(url.origin)
}

async function proxyRemoteThumbnail(request: Request, thumbnail: string) {
  try {
    const imageUrl = new URL(thumbnail, SITE_URL)
    if (!isAllowedThumbnailUrl(imageUrl)) {
      return fallbackImage(request)
    }

    const response = await fetch(imageUrl, {
      headers: { Accept: "image/webp,image/png,image/jpeg,image/gif,image/*" },
      redirect: "follow",
    })
    const contentType = response.headers.get("content-type")?.split(";", 1)[0]?.trim()

    if (!response.ok || !response.body || !contentType?.startsWith("image/")) {
      return fallbackImage(request)
    }

    const contentLength = response.headers.get("content-length")
    const headers: Record<string, string> = {
      "Cache-Control": CACHE_CONTROL,
      "Content-Type": contentType,
    }
    if (contentLength) {
      headers["Content-Length"] = contentLength
    }

    return new NextResponse(response.body, { headers })
  } catch {
    return fallbackImage(request)
  }
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params
  const game = await prisma.game.findUnique({
    where: { slug },
    select: { thumbnail: true, status: true },
  })

  if (!game || game.status !== "PUBLISHED" || typeof game.thumbnail !== "string") {
    return fallbackImage(request)
  }

  const thumbnail = game.thumbnail.trim()
  const match = thumbnail.match(/^data:(image\/(?:png|jpeg|jpg|gif|webp));base64,([\s\S]+)$/)

  if (!match) {
    return proxyRemoteThumbnail(request, thumbnail)
  }

  try {
    const image = Buffer.from(match[2], "base64")
    return new NextResponse(image, {
      headers: {
        "Cache-Control": CACHE_CONTROL,
        "Content-Length": String(image.byteLength),
        "Content-Type": match[1] === "image/jpg" ? "image/jpeg" : match[1],
      },
    })
  } catch {
    return fallbackImage(request)
  }
}
