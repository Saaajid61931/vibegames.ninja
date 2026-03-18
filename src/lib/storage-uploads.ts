import JSZip from "jszip"
import {
  collectGhostSignals,
  collectLevelEditorSignals,
  createGhostIntegrationReport,
  createLevelEditorIntegrationReport,
  isInspectableScript,
} from "./storage-inspection"
import {
  getContentType,
  getImageExtensionFromContentType,
  normalizeZipPath,
  parseImageDataUrl,
} from "./storage-mime"
import {
  deleteGameThumbnailAssetsFromR2,
  deleteJamBannerAssetsFromR2,
  deleteUserAvatarAssetsFromR2,
} from "./storage-cleanup"
import {
  createAssetUrl,
  putObject,
} from "./storage-r2"
import { injectLevelEditorSdkIntoHtml } from "./storage-sdk"
import {
  RESPONSIVE_THUMBNAIL_QUERY,
  RESPONSIVE_THUMBNAIL_WIDTHS,
  type GhostIntegrationReport,
  type LevelEditorIntegrationReport,
  type ThumbnailSlideUpload,
  type UploadGameToR2Options,
} from "./storage-types"

function createResponsiveThumbnailUrl(key: string): string {
  return `${createAssetUrl(key)}?${RESPONSIVE_THUMBNAIL_QUERY}`
}

export async function uploadGameToR2(
  gameId: string,
  gameFile: File,
  options: UploadGameToR2Options = {}
): Promise<{
  gameUrl: string
  uploadedKeys: string[]
  levelEditorIntegration?: LevelEditorIntegrationReport
  ghostIntegration?: GhostIntegrationReport
}> {
  const gamePrefix = `games/${gameId}`
  const gameBuffer = Buffer.from(await gameFile.arrayBuffer())
  const levelEditorIntegration = options.inspectLevelEditorIntegration
    ? createLevelEditorIntegrationReport()
    : undefined
  const ghostIntegration = options.inspectGhostIntegration
    ? createGhostIntegrationReport()
    : undefined

  if (gameFile.name.toLowerCase().endsWith(".html")) {
    let html = gameBuffer.toString("utf8")
    if (levelEditorIntegration) {
      collectLevelEditorSignals(html, levelEditorIntegration)
    }
    if (ghostIntegration) {
      collectGhostSignals(html, ghostIntegration)
    }

    if (options.injectPlatformSdk) {
      html = injectLevelEditorSdkIntoHtml(html)
    }

    const key = `${gamePrefix}/index.html`
    await putObject({
      key,
      body: Buffer.from(html, "utf8"),
      contentType: "text/html; charset=utf-8",
      cacheControl: "public, max-age=300",
    })

    return {
      gameUrl: createAssetUrl(key),
      uploadedKeys: [key],
      levelEditorIntegration,
      ghostIntegration,
    }
  }

  if (!gameFile.name.toLowerCase().endsWith(".zip")) {
    throw new Error("Unsupported game file type. Use .html or .zip")
  }

  const zip = await JSZip.loadAsync(gameBuffer)
  const uploadPaths: string[] = []
  const uploadedKeys: string[] = []

  for (const [entryName, entry] of Object.entries(zip.files)) {
    if (entry.dir) {
      continue
    }

    const normalizedPath = normalizeZipPath(entryName)
    if (!normalizedPath) {
      continue
    }

    const normalizedPathLower = normalizedPath.toLowerCase()
    let entryBuffer: Buffer

    if (normalizedPathLower.endsWith(".html")) {
      let html = await entry.async("string")
      if (levelEditorIntegration) {
        collectLevelEditorSignals(html, levelEditorIntegration)
      }
      if (ghostIntegration) {
        collectGhostSignals(html, ghostIntegration)
      }

      if (options.injectPlatformSdk) {
        html = injectLevelEditorSdkIntoHtml(html)
      }

      entryBuffer = Buffer.from(html, "utf8")
    } else {
      entryBuffer = Buffer.from(await entry.async("uint8array"))
      if (isInspectableScript(normalizedPathLower)) {
        const sourceText = entryBuffer.toString("utf8")
        if (levelEditorIntegration) {
          collectLevelEditorSignals(sourceText, levelEditorIntegration)
        }
        if (ghostIntegration) {
          collectGhostSignals(sourceText, ghostIntegration)
        }
      }
    }

    const key = `${gamePrefix}/${normalizedPath}`

    await putObject({
      key,
      body: entryBuffer,
      contentType: getContentType(normalizedPath),
      cacheControl: "public, max-age=31536000, immutable",
    })

    uploadPaths.push(normalizedPath)
    uploadedKeys.push(key)
  }

  const lowercasePaths = uploadPaths.map((path) => path.toLowerCase())
  let indexPath = "index.html"

  if (!lowercasePaths.includes("index.html")) {
    const nestedIndexPaths = uploadPaths.filter((path) => path.toLowerCase().endsWith("/index.html"))
    if (nestedIndexPaths.length === 0) {
      throw new Error("ZIP archive must contain index.html")
    }
    nestedIndexPaths.sort((left, right) => left.length - right.length)
    indexPath = nestedIndexPaths[0]
  }

  return {
    gameUrl: createAssetUrl(`${gamePrefix}/${indexPath}`),
    uploadedKeys,
    levelEditorIntegration,
    ghostIntegration,
  }
}

export async function uploadThumbnailToR2(gameId: string, thumbnail: File): Promise<string> {
  const extension = thumbnail.name.split(".").pop()?.toLowerCase() || "png"
  const key = `games/${gameId}/thumbnail.${extension}`
  const buffer = Buffer.from(await thumbnail.arrayBuffer())

  await deleteGameThumbnailAssetsFromR2(gameId)

  await putObject({
    key,
    body: buffer,
    contentType: getContentType(`thumbnail.${extension}`),
    cacheControl: "public, max-age=31536000, immutable",
  })

  return createAssetUrl(key)
}

export async function uploadThumbnailSlidesToR2(gameId: string, screenshots: ThumbnailSlideUpload[]): Promise<string[]> {
  if (screenshots.length === 0) {
    return []
  }

  await deleteGameThumbnailAssetsFromR2(gameId)

  const uploadedUrls: string[] = []

  for (const [index, screenshot] of screenshots.entries()) {
    const parsed = parseImageDataUrl(screenshot.original)
    const fileStem = index === 0 ? "thumbnail" : `thumbnail-${index + 1}`
    const key = `games/${gameId}/${fileStem}.${parsed.extension}`

    await putObject({
      key,
      body: parsed.buffer,
      contentType: parsed.contentType,
      cacheControl: "public, max-age=31536000, immutable",
    })

    for (const variant of screenshot.variants || []) {
      if (!RESPONSIVE_THUMBNAIL_WIDTHS.has(variant.width)) {
        continue
      }

      const parsedVariant = parseImageDataUrl(variant.image)
      const variantKey = `games/${gameId}/${fileStem}-w${variant.width}.${parsedVariant.extension}`

      await putObject({
        key: variantKey,
        body: parsedVariant.buffer,
        contentType: parsedVariant.contentType,
        cacheControl: "public, max-age=31536000, immutable",
      })
    }

    uploadedUrls.push(createResponsiveThumbnailUrl(key))
  }

  return uploadedUrls
}

export async function uploadUserAvatarToR2(userId: string, avatar: File): Promise<string> {
  const contentType = avatar.type.toLowerCase()
  if (!["image/png", "image/jpeg", "image/jpg", "image/webp", "image/gif"].includes(contentType)) {
    throw new Error("Unsupported avatar format. Use PNG, JPG, WEBP, or GIF.")
  }

  const extension = getImageExtensionFromContentType(contentType)
  const key = `users/${userId}/avatar.${extension}`
  const buffer = Buffer.from(await avatar.arrayBuffer())

  await deleteUserAvatarAssetsFromR2(userId)

  await putObject({
    key,
    body: buffer,
    contentType,
    cacheControl: "public, max-age=31536000, immutable",
  })

  return createAssetUrl(key)
}

export async function uploadJamBannerToR2(jamId: string, banner: File): Promise<string> {
  const contentType = banner.type.toLowerCase()
  if (!["image/png", "image/jpeg", "image/jpg", "image/webp", "image/gif"].includes(contentType)) {
    throw new Error("Unsupported banner format. Use PNG, JPG, WEBP, or GIF.")
  }

  const extension = getImageExtensionFromContentType(contentType)
  const key = `jams/${jamId}/banner.${extension}`
  const buffer = Buffer.from(await banner.arrayBuffer())

  await deleteJamBannerAssetsFromR2(jamId)

  await putObject({
    key,
    body: buffer,
    contentType,
    cacheControl: "public, max-age=31536000, immutable",
  })

  return createAssetUrl(key)
}
