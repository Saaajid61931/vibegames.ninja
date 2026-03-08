import { NextRequest, NextResponse } from "next/server"
import { revalidateTag } from "next/cache"
import { auth } from "@/lib/auth"
import prisma from "@/lib/prisma"
import { uploadThumbnailSlidesToR2, validateR2Config } from "@/lib/storage"

const MAX_SCREENSHOT_COUNT = 5
const MAX_IMAGE_DATA_URL_LENGTH = 2_000_000
const ALLOWED_VARIANT_WIDTHS = new Set([320, 640])

type ThumbnailSlideInput = {
  original: string
  variants?: Array<{
    width: number
    image: string
  }>
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params
    const game = await prisma.game.findUnique({
      where: { id },
      select: { id: true, creatorId: true },
    })

    if (!game) {
      return NextResponse.json({ error: "Game not found" }, { status: 404 })
    }

    if (game.creatorId !== session.user.id) {
      return NextResponse.json({ error: "Not authorized to update thumbnails for this game" }, { status: 403 })
    }

    const body = await request.json()
    const images = Array.isArray(body?.images)
      ? body.images.filter((item: unknown): item is ThumbnailSlideInput => {
          if (!item || typeof item !== "object") {
            return false
          }

          const candidate = item as ThumbnailSlideInput
          return typeof candidate.original === "string"
        })
      : []

    if (images.length === 0 || images.length > MAX_SCREENSHOT_COUNT) {
      return NextResponse.json(
        { error: `Provide between 1 and ${MAX_SCREENSHOT_COUNT} screenshots` },
        { status: 400 }
      )
    }

    const hasInvalidImage = images.some((image: ThumbnailSlideInput) => {
      if (!image.original.startsWith("data:image/") || image.original.length > MAX_IMAGE_DATA_URL_LENGTH) {
        return true
      }

      return (image.variants || []).some(
        (variant: { width: number; image: string }) =>
          !ALLOWED_VARIANT_WIDTHS.has(variant.width) ||
          typeof variant.image !== "string" ||
          !variant.image.startsWith("data:image/") ||
          variant.image.length > MAX_IMAGE_DATA_URL_LENGTH
      )
    })
    if (hasInvalidImage) {
      return NextResponse.json({ error: "One or more screenshots are invalid or too large" }, { status: 400 })
    }

    const r2Config = validateR2Config()
    if (!r2Config.valid) {
      return NextResponse.json(
        { error: `R2 storage is not configured. Missing: ${r2Config.missing.join(", ")}` },
        { status: 500 }
      )
    }

    const screenshotUrls = await uploadThumbnailSlidesToR2(id, images)

    const updated = await prisma.game.update({
      where: { id },
      data: {
        thumbnail: screenshotUrls[0] || null,
        thumbnailSlides: screenshotUrls,
      },
      select: {
        id: true,
        slug: true,
        thumbnail: true,
        thumbnailSlides: true,
      },
    })

    revalidateTag("games", "max")

    return NextResponse.json({
      message: "Thumbnail slideshow updated",
      game: updated,
    })
  } catch (error) {
    console.error("Auto thumbnail upload error:", error)

    if (process.env.NODE_ENV !== "production" && error instanceof Error) {
      return NextResponse.json({ error: error.message || "Failed to update thumbnail slideshow" }, { status: 500 })
    }

    return NextResponse.json({ error: "Failed to update thumbnail slideshow" }, { status: 500 })
  }
}
