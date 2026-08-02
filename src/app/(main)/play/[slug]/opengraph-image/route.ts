import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"

export const dynamic = "force-dynamic"

function fallbackImage(request: Request) {
  return fetch(new URL("/opengraph-image", request.url))
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
    return fallbackImage(request)
  }

  try {
    const image = Buffer.from(match[2], "base64")
    return new NextResponse(image, {
      headers: {
        "Cache-Control": "public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800",
        "Content-Length": String(image.byteLength),
        "Content-Type": match[1] === "image/jpg" ? "image/jpeg" : match[1],
      },
    })
  } catch {
    return fallbackImage(request)
  }
}
