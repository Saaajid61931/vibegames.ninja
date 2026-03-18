export function isRenderableImageSrc(src: string | null | undefined) {
  if (!src) {
    return false
  }

  const value = src.trim()
  if (!value) {
    return false
  }

  if (value.startsWith("/")) {
    return true
  }

  if (value.startsWith("data:image/")) {
    return true
  }

  try {
    const url = new URL(value)
    return url.protocol === "https:" || url.protocol === "http:"
  } catch {
    return false
  }
}
