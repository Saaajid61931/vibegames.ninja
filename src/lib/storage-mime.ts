function getFileExtension(fileName: string) {
  return fileName.toLowerCase().split(".").pop() || ""
}

export function getContentType(fileName: string): string {
  switch (getFileExtension(fileName)) {
    case "html":
      return "text/html; charset=utf-8"
    case "js":
    case "mjs":
      return "text/javascript; charset=utf-8"
    case "css":
      return "text/css; charset=utf-8"
    case "json":
      return "application/json; charset=utf-8"
    case "wasm":
      return "application/wasm"
    case "png":
      return "image/png"
    case "jpg":
    case "jpeg":
      return "image/jpeg"
    case "webp":
      return "image/webp"
    case "gif":
      return "image/gif"
    case "svg":
      return "image/svg+xml"
    case "ico":
      return "image/x-icon"
    case "mp3":
      return "audio/mpeg"
    case "wav":
      return "audio/wav"
    case "ogg":
      return "audio/ogg"
    case "mp4":
      return "video/mp4"
    case "webm":
      return "video/webm"
    case "txt":
      return "text/plain; charset=utf-8"
    default:
      return "application/octet-stream"
  }
}

export function normalizeZipPath(entryName: string): string | null {
  const normalized = entryName.replace(/\\/g, "/").replace(/^\/+/, "")

  if (!normalized || normalized.includes("../") || normalized.endsWith("/..")) {
    return null
  }

  return normalized
}

export function getImageExtensionFromContentType(contentType: string): string {
  switch (contentType.toLowerCase()) {
    case "image/png":
      return "png"
    case "image/webp":
      return "webp"
    case "image/gif":
      return "gif"
    case "image/jpg":
    case "image/jpeg":
    default:
      return "jpg"
  }
}

export function parseImageDataUrl(dataUrl: string): { buffer: Buffer; contentType: string; extension: string } {
  const match = /^data:(image\/(?:png|jpeg|jpg|webp|gif));base64,([a-z0-9+/=]+)$/i.exec(dataUrl.trim())

  if (!match) {
    throw new Error("Invalid screenshot payload")
  }

  const contentType = match[1].toLowerCase()

  return {
    buffer: Buffer.from(match[2], "base64"),
    contentType,
    extension: getImageExtensionFromContentType(contentType),
  }
}
