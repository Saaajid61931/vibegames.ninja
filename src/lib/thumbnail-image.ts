export const THUMBNAIL_MAX_WIDTH = 1280
export const THUMBNAIL_MAX_HEIGHT = 720
export const THUMBNAIL_WEBP_QUALITY = 0.76

export type ThumbnailDimensions = {
  width: number
  height: number
}

export type OptimizedThumbnail = {
  file: File
  previewUrl: string
  originalBytes: number
  optimizedBytes: number
  format: "WebP" | "JPEG"
}

export type ThumbnailCrop = {
  zoom: number
  offsetX: number
  offsetY: number
}

export function getContainedThumbnailDimensions(
  source: ThumbnailDimensions,
  limits: ThumbnailDimensions,
): ThumbnailDimensions | null {
  const values = [source.width, source.height, limits.width, limits.height]
  if (!values.every((value) => Number.isFinite(value) && value > 0)) {
    return null
  }

  const scale = Math.min(1, limits.width / source.width, limits.height / source.height)
  return {
    width: Math.max(1, Math.round(source.width * scale)),
    height: Math.max(1, Math.round(source.height * scale)),
  }
}

function loadImageElement(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new window.Image()
    image.onload = () => resolve(image)
    image.onerror = () => reject(new Error("Could not prepare thumbnail image."))
    image.src = src
  })
}

function canvasToBlob(canvas: HTMLCanvasElement, type: string, quality: number) {
  return new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, type, quality))
}

export function getCroppedThumbnailDimensions(
  source: ThumbnailDimensions,
  zoom: number,
): ThumbnailDimensions | null {
  const values = [source.width, source.height, zoom]
  if (!values.every((value) => Number.isFinite(value) && value > 0)) {
    return null
  }

  const availableWidth = Math.min(source.width, source.height * (16 / 9)) / Math.max(1, zoom)
  const width = Math.max(16, Math.floor(Math.min(THUMBNAIL_MAX_WIDTH, availableWidth) / 16) * 16)
  return {
    width,
    height: Math.round(width * (9 / 16)),
  }
}

async function encodeImage(
  image: HTMLImageElement,
  limits: ThumbnailDimensions,
  quality: number,
) {
  const dimensions = getContainedThumbnailDimensions(
    { width: image.naturalWidth, height: image.naturalHeight },
    limits,
  )
  if (!dimensions) {
    throw new Error("The selected thumbnail has invalid dimensions.")
  }

  const canvas = document.createElement("canvas")
  canvas.width = dimensions.width
  canvas.height = dimensions.height
  const context = canvas.getContext("2d")
  if (!context) {
    throw new Error("This browser could not optimize the thumbnail.")
  }

  context.imageSmoothingEnabled = true
  context.imageSmoothingQuality = "high"
  context.drawImage(image, 0, 0, canvas.width, canvas.height)

  const webp = await canvasToBlob(canvas, "image/webp", quality)
  if (webp?.type === "image/webp") {
    return { blob: webp, format: "WebP" as const }
  }

  const jpeg = await canvasToBlob(canvas, "image/jpeg", quality)
  if (!jpeg) {
    throw new Error("This browser could not optimize the thumbnail.")
  }
  return { blob: jpeg, format: "JPEG" as const }
}

function optimizedFileName(originalName: string, format: "WebP" | "JPEG") {
  const stem = originalName.replace(/\.[^.]+$/, "").replace(/[^a-z0-9_-]+/gi, "-") || "thumbnail"
  return `${stem}.${format === "WebP" ? "webp" : "jpg"}`
}

export async function cropAndOptimizeThumbnailFile(
  file: File,
  crop: ThumbnailCrop,
): Promise<OptimizedThumbnail> {
  const sourceUrl = URL.createObjectURL(file)
  try {
    const image = await loadImageElement(sourceUrl)
    const dimensions = getCroppedThumbnailDimensions(
      { width: image.naturalWidth, height: image.naturalHeight },
      crop.zoom,
    )
    if (!dimensions) {
      throw new Error("The selected thumbnail has invalid dimensions.")
    }

    const canvas = document.createElement("canvas")
    canvas.width = dimensions.width
    canvas.height = dimensions.height
    const context = canvas.getContext("2d")
    if (!context) {
      throw new Error("This browser could not crop the thumbnail.")
    }

    const zoom = Math.min(3, Math.max(1, crop.zoom))
    const offsetX = Math.min(1, Math.max(-1, crop.offsetX))
    const offsetY = Math.min(1, Math.max(-1, crop.offsetY))
    const coverScale = Math.max(
      canvas.width / image.naturalWidth,
      canvas.height / image.naturalHeight,
    ) * zoom
    const drawnWidth = image.naturalWidth * coverScale
    const drawnHeight = image.naturalHeight * coverScale
    const overflowX = Math.max(0, (drawnWidth - canvas.width) / 2)
    const overflowY = Math.max(0, (drawnHeight - canvas.height) / 2)

    context.imageSmoothingEnabled = true
    context.imageSmoothingQuality = "high"
    context.drawImage(
      image,
      -overflowX + offsetX * overflowX,
      -overflowY + offsetY * overflowY,
      drawnWidth,
      drawnHeight,
    )

    const webp = await canvasToBlob(canvas, "image/webp", THUMBNAIL_WEBP_QUALITY)
    const encoded = webp?.type === "image/webp"
      ? { blob: webp, format: "WebP" as const }
      : {
          blob: await canvasToBlob(canvas, "image/jpeg", THUMBNAIL_WEBP_QUALITY),
          format: "JPEG" as const,
        }
    if (!encoded.blob) {
      throw new Error("This browser could not optimize the thumbnail.")
    }

    const optimizedFile = new File(
      [encoded.blob],
      optimizedFileName(file.name, encoded.format),
      { type: encoded.blob.type, lastModified: Date.now() },
    )
    return {
      file: optimizedFile,
      previewUrl: URL.createObjectURL(optimizedFile),
      originalBytes: file.size,
      optimizedBytes: optimizedFile.size,
      format: encoded.format,
    }
  } finally {
    URL.revokeObjectURL(sourceUrl)
  }
}

export async function optimizeThumbnailFile(file: File): Promise<OptimizedThumbnail> {
  const sourceUrl = URL.createObjectURL(file)
  try {
    const image = await loadImageElement(sourceUrl)
    const encoded = await encodeImage(
      image,
      { width: THUMBNAIL_MAX_WIDTH, height: THUMBNAIL_MAX_HEIGHT },
      THUMBNAIL_WEBP_QUALITY,
    )
    const optimizedFile = new File(
      [encoded.blob],
      optimizedFileName(file.name, encoded.format),
      { type: encoded.blob.type, lastModified: Date.now() },
    )

    return {
      file: optimizedFile,
      previewUrl: URL.createObjectURL(optimizedFile),
      originalBytes: file.size,
      optimizedBytes: optimizedFile.size,
      format: encoded.format,
    }
  } finally {
    URL.revokeObjectURL(sourceUrl)
  }
}

export async function optimizeThumbnailDataUrl(
  source: string,
  limits: ThumbnailDimensions,
  quality = THUMBNAIL_WEBP_QUALITY,
) {
  const image = await loadImageElement(source)
  const encoded = await encodeImage(image, limits, quality)
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result || ""))
    reader.onerror = () => reject(new Error("Could not encode thumbnail image."))
    reader.readAsDataURL(encoded.blob)
  })
}

export function formatThumbnailOptimization(result: OptimizedThumbnail) {
  const kilobytes = Math.max(1, Math.round(result.optimizedBytes / 1024))
  const saved = result.originalBytes > 0
    ? Math.max(0, Math.round((1 - result.optimizedBytes / result.originalBytes) * 100))
    : 0
  return `${result.format} · ${kilobytes.toLocaleString()} KB${saved > 0 ? ` · ${saved}% smaller` : ""}`
}
