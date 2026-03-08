import { S3Client, PutObjectCommand, ListObjectsV2Command, DeleteObjectsCommand } from "@aws-sdk/client-s3"
import JSZip from "jszip"

const R2_REQUIRED_ENV = [
  "R2_ACCOUNT_ID",
  "R2_ACCESS_KEY_ID",
  "R2_SECRET_ACCESS_KEY",
  "R2_BUCKET_NAME",
  "R2_PUBLIC_BASE_URL",
] as const

let r2Client: S3Client | null = null

export type LevelEditorIntegrationReport = {
  notifyReady: boolean
  onEnterEditMode: boolean
  onLoadLevel: boolean
  onRequestSave: boolean
  saveLevel: boolean
}

type UploadGameToR2Options = {
  injectLevelEditorSdk?: boolean
  inspectLevelEditorIntegration?: boolean
}

const INLINE_LEVEL_EDITOR_SDK = `<script id="vibegames-sdk-inline">;(function () {
  if (window.VG) {
    return
  }

  var listeners = {
    loadLevel: [],
    enterEditMode: [],
    requestSave: [],
    requestScreenshot: [],
  }
  var MAX_SCREENSHOT_WIDTH = 960
  var SCREENSHOT_QUALITY = 0.68
  var mode = "play"
  var lastEnterEditPayload = {}

  function exportCanvasImage(canvas) {
    var width = canvas.width || 0
    var height = canvas.height || 0

    if (!width || !height) {
      return null
    }

    var scale = Math.min(1, MAX_SCREENSHOT_WIDTH / width)
    var targetCanvas = canvas

    if (scale < 1) {
      targetCanvas = document.createElement("canvas")
      targetCanvas.width = Math.max(1, Math.round(width * scale))
      targetCanvas.height = Math.max(1, Math.round(height * scale))

      var targetContext = targetCanvas.getContext("2d")
      if (!targetContext) {
        return null
      }

      targetContext.imageSmoothingEnabled = true
      targetContext.imageSmoothingQuality = "high"
      targetContext.drawImage(canvas, 0, 0, width, height, 0, 0, targetCanvas.width, targetCanvas.height)
    }

    var webpDataUrl = targetCanvas.toDataURL("image/webp", SCREENSHOT_QUALITY)
    if (webpDataUrl.indexOf("data:image/webp") === 0) {
      return webpDataUrl
    }

    return targetCanvas.toDataURL("image/jpeg", SCREENSHOT_QUALITY)
  }

  function emitSdkReady() {
    try {
      window.dispatchEvent(new CustomEvent("VG_SDK_READY", { detail: { mode: mode } }))
    } catch {}
  }

  function emitModeChange() {
    try {
      window.dispatchEvent(new CustomEvent("VG_MODE_CHANGE", { detail: { mode: mode } }))
    } catch {}
  }

  function setMode(nextMode) {
    var resolvedMode = nextMode === "editor" ? "editor" : "play"
    if (resolvedMode === mode) {
      return
    }

    mode = resolvedMode
    emitModeChange()
  }

  function emitEnterEditMode(payload) {
    lastEnterEditPayload = payload || {}
    post("VG_EDIT_MODE_ENTERED", {
      handlerCount: listeners.enterEditMode.length,
    })
    listeners.enterEditMode.forEach(function (fn) {
      try {
        fn(lastEnterEditPayload)
      } catch (error) {
        console.error("VG.onEnterEditMode handler failed", error)
      }
    })
  }

  async function captureScreenshot(payload) {
    var requestPayload = payload || {}
    var imageDataUrl = null

    for (var index = 0; index < listeners.requestScreenshot.length; index += 1) {
      var handler = listeners.requestScreenshot[index]

      try {
        var result = handler(requestPayload)
        if (result && typeof result.then === "function") {
          result = await result
        }

        if (typeof result === "string" && result.indexOf("data:image/") === 0) {
          imageDataUrl = result
          break
        }
      } catch (error) {
        console.error("VG.onRequestScreenshot handler failed", error)
      }
    }

    if (!imageDataUrl) {
      try {
        var canvas = document.querySelector("canvas")
        if (canvas && typeof canvas.toDataURL === "function") {
          imageDataUrl = exportCanvasImage(canvas)
        }
      } catch (error) {
        console.error("VG default screenshot capture failed", error)
      }
    }

    if (imageDataUrl) {
      post("VG_SCREENSHOT_CAPTURED", {
        captureId: requestPayload.captureId || null,
        imageDataUrl: imageDataUrl,
      })
      return
    }

    post("VG_SCREENSHOT_CAPTURED", {
      captureId: requestPayload.captureId || null,
      error: "Unable to capture screenshot. Render to a canvas or register VG.onRequestScreenshot().",
    })
  }

  function post(type, payload) {
    if (!window.parent || window.parent === window) {
      return
    }

    window.parent.postMessage(
      {
        source: "vibegames-sdk",
        type: type,
        payload: payload || {},
      },
      "*"
    )
  }

  function onMessage(event) {
    var message = event.data
    if (!message || message.source !== "vibegames-platform") {
      return
    }

    if (message.type === "VG_INIT") {
      var initPayload = message.payload || {}
      if (initPayload.mode === "editor" || initPayload.mode === "play") {
        var previousMode = mode
        setMode(initPayload.mode)
        if (mode === "editor" && previousMode !== "editor") {
          emitEnterEditMode(initPayload)
        }
      }
      return
    }

    if (message.type === "VG_LOAD_LEVEL") {
      post("VG_LEVEL_LOAD_RECEIVED", {
        handlerCount: listeners.loadLevel.length,
        hasLevel: Boolean((message.payload || {}).level),
      })
      listeners.loadLevel.forEach(function (fn) {
        try {
          fn(message.payload || {})
        } catch (error) {
          console.error("VG.onLoadLevel handler failed", error)
        }
      })
      return
    }

    if (message.type === "VG_ENTER_EDIT_MODE") {
      setMode("editor")
      emitEnterEditMode(message.payload || {})
      return
    }

    if (message.type === "VG_REQUEST_SAVE") {
      post("VG_REQUEST_SAVE_RECEIVED", {
        handlerCount: listeners.requestSave.length,
      })
      listeners.requestSave.forEach(function (fn) {
        try {
          fn(message.payload || {})
        } catch (error) {
          console.error("VG.onRequestSave handler failed", error)
        }
      })
      return
    }

    if (message.type === "VG_REQUEST_SCREENSHOT") {
      captureScreenshot(message.payload || {})
    }
  }

  window.addEventListener("message", onMessage)

  var api = {
    notifyReady: function notifyReady() {
      post("VG_READY")
    },
    saveLevel: function saveLevel(payload) {
      post("VG_SAVE_LEVEL", payload || {})
    },
    onLoadLevel: function onLoadLevel(handler) {
      if (typeof handler === "function") {
        listeners.loadLevel.push(handler)
        post("VG_EDITOR_HOOK_BOUND", {
          hook: "onLoadLevel",
          count: listeners.loadLevel.length,
        })
      }
      return function unsubscribe() {
        listeners.loadLevel = listeners.loadLevel.filter(function (fn) {
          return fn !== handler
        })
      }
    },
    onEnterEditMode: function onEnterEditMode(handler) {
      if (typeof handler === "function") {
        listeners.enterEditMode.push(handler)
        post("VG_EDITOR_HOOK_BOUND", {
          hook: "onEnterEditMode",
          count: listeners.enterEditMode.length,
        })
        if (mode === "editor") {
          try {
            handler(lastEnterEditPayload)
          } catch (error) {
            console.error("VG.onEnterEditMode handler failed", error)
          }
        }
      }
      return function unsubscribe() {
        listeners.enterEditMode = listeners.enterEditMode.filter(function (fn) {
          return fn !== handler
        })
      }
    },
    onRequestSave: function onRequestSave(handler) {
      if (typeof handler === "function") {
        listeners.requestSave.push(handler)
        post("VG_EDITOR_HOOK_BOUND", {
          hook: "onRequestSave",
          count: listeners.requestSave.length,
        })
      }
      return function unsubscribe() {
        listeners.requestSave = listeners.requestSave.filter(function (fn) {
          return fn !== handler
        })
      }
    },
    onRequestScreenshot: function onRequestScreenshot(handler) {
      if (typeof handler === "function") {
        listeners.requestScreenshot.push(handler)
      }
      return function unsubscribe() {
        listeners.requestScreenshot = listeners.requestScreenshot.filter(function (fn) {
          return fn !== handler
        })
      }
    },
  }

  Object.defineProperty(api, "mode", {
    enumerable: true,
    configurable: false,
    get: function getMode() {
      return mode
    },
  })

  window.VG = api
  emitSdkReady()
})()</script>`

function createLevelEditorIntegrationReport(): LevelEditorIntegrationReport {
  return {
    notifyReady: false,
    onEnterEditMode: false,
    onLoadLevel: false,
    onRequestSave: false,
    saveLevel: false,
  }
}

function collectLevelEditorSignals(sourceText: string, report: LevelEditorIntegrationReport) {
  if (!sourceText) {
    return
  }

  report.notifyReady = report.notifyReady || /\bVG\.notifyReady\s*\(/.test(sourceText)
  report.onEnterEditMode = report.onEnterEditMode || /\bVG\.onEnterEditMode\s*\(/.test(sourceText)
  report.onLoadLevel = report.onLoadLevel || /\bVG\.onLoadLevel\s*\(/.test(sourceText)
  report.onRequestSave = report.onRequestSave || /\bVG\.onRequestSave\s*\(/.test(sourceText)
  report.saveLevel = report.saveLevel || /\bVG\.saveLevel\s*\(/.test(sourceText)
}

const INLINE_LEVEL_EDITOR_SDK_REGEX =
  /<script[^>]*id=["']vibegames-sdk-inline["'][^>]*>[\s\S]*?<\/script>\s*/gi

const EXTERNAL_LEVEL_EDITOR_SDK_REGEX =
  /<script[^>]+src=["'][^"']*vibegames-sdk(?:\.min)?\.js[^"']*["'][^>]*>/i

function injectLevelEditorSdkIntoHtml(html: string): string {
  let normalizedHtml = html || ""

  normalizedHtml = normalizedHtml.replace(INLINE_LEVEL_EDITOR_SDK_REGEX, "")

  if (EXTERNAL_LEVEL_EDITOR_SDK_REGEX.test(normalizedHtml)) {
    return normalizedHtml
  }

  const openingHeadRegex = /<head[^>]*>/i
  if (openingHeadRegex.test(normalizedHtml)) {
    return normalizedHtml.replace(openingHeadRegex, (match) => `${match}\n${INLINE_LEVEL_EDITOR_SDK}`)
  }

  const closingHeadRegex = /<\/head>/i
  if (closingHeadRegex.test(normalizedHtml)) {
    return normalizedHtml.replace(closingHeadRegex, `${INLINE_LEVEL_EDITOR_SDK}\n</head>`)
  }

  const openingBodyRegex = /<body[^>]*>/i
  if (openingBodyRegex.test(normalizedHtml)) {
    return normalizedHtml.replace(openingBodyRegex, (match) => `${match}\n${INLINE_LEVEL_EDITOR_SDK}`)
  }

  return `${INLINE_LEVEL_EDITOR_SDK}\n${normalizedHtml}`
}

function isInspectableScript(path: string): boolean {
  return path.endsWith(".js") || path.endsWith(".mjs") || path.endsWith(".cjs") || path.endsWith(".ts")
}

function getEnv(name: (typeof R2_REQUIRED_ENV)[number]): string {
  const value = process.env[name]?.trim()
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`)
  }
  return value
}

function getR2Client(): S3Client {
  if (r2Client) {
    return r2Client
  }

  const accountId = getEnv("R2_ACCOUNT_ID")
  const accessKeyId = getEnv("R2_ACCESS_KEY_ID")
  const secretAccessKey = getEnv("R2_SECRET_ACCESS_KEY")

  r2Client = new S3Client({
    region: "auto",
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId, secretAccessKey },
  })

  return r2Client
}

function getBucketName(): string {
  return getEnv("R2_BUCKET_NAME")
}

function getPublicBaseUrl(): string {
  return getEnv("R2_PUBLIC_BASE_URL").replace(/\/+$/, "")
}

function createAssetUrl(key: string): string {
  return `${getPublicBaseUrl()}/${key}`
}

function getContentType(fileName: string): string {
  const ext = fileName.toLowerCase().split(".").pop() || ""

  switch (ext) {
    case "html":
      return "text/html; charset=utf-8"
    case "js":
      return "text/javascript; charset=utf-8"
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

function normalizeZipPath(entryName: string): string | null {
  const normalized = entryName.replace(/\\/g, "/").replace(/^\/+/, "")

  if (!normalized || normalized.includes("../") || normalized.endsWith("/..")) {
    return null
  }

  return normalized
}

function getImageExtensionFromContentType(contentType: string): string {
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

function parseImageDataUrl(dataUrl: string): { buffer: Buffer; contentType: string; extension: string } {
  const match = /^data:(image\/(?:png|jpeg|jpg|webp|gif));base64,([a-z0-9+/=]+)$/i.exec(dataUrl.trim())

  if (!match) {
    throw new Error("Invalid screenshot payload")
  }

  const contentType = match[1].toLowerCase()
  const extension = getImageExtensionFromContentType(contentType)

  return {
    buffer: Buffer.from(match[2], "base64"),
    contentType,
    extension,
  }
}

async function putObject(params: {
  key: string
  body: Buffer
  contentType: string
  cacheControl?: string
}): Promise<void> {
  await getR2Client().send(
    new PutObjectCommand({
      Bucket: getBucketName(),
      Key: params.key,
      Body: params.body,
      ContentType: params.contentType,
      CacheControl: params.cacheControl,
    })
  )
}

export async function uploadGameToR2(
  gameId: string,
  gameFile: File,
  options: UploadGameToR2Options = {}
): Promise<{ gameUrl: string; uploadedKeys: string[]; levelEditorIntegration?: LevelEditorIntegrationReport }> {
  const gamePrefix = `games/${gameId}`
  const gameBuffer = Buffer.from(await gameFile.arrayBuffer())
  const integration = options.inspectLevelEditorIntegration
    ? createLevelEditorIntegrationReport()
    : undefined

  if (gameFile.name.toLowerCase().endsWith(".html")) {
    let html = gameBuffer.toString("utf8")
    if (integration) {
      collectLevelEditorSignals(html, integration)
    }

    if (options.injectLevelEditorSdk) {
      html = injectLevelEditorSdkIntoHtml(html)
    }

    const key = `${gamePrefix}/index.html`
    await putObject({
      key,
      body: Buffer.from(html, "utf8"),
      contentType: "text/html; charset=utf-8",
      cacheControl: "public, max-age=300",
    })
    return { gameUrl: createAssetUrl(key), uploadedKeys: [key], levelEditorIntegration: integration }
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
      if (integration) {
        collectLevelEditorSignals(html, integration)
      }

      if (options.injectLevelEditorSdk) {
        html = injectLevelEditorSdkIntoHtml(html)
      }

      entryBuffer = Buffer.from(html, "utf8")
    } else {
      entryBuffer = Buffer.from(await entry.async("uint8array"))
      if (integration && isInspectableScript(normalizedPathLower)) {
        collectLevelEditorSignals(entryBuffer.toString("utf8"), integration)
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
    nestedIndexPaths.sort((a, b) => a.length - b.length)
    indexPath = nestedIndexPaths[0]
  }

  return {
    gameUrl: createAssetUrl(`${gamePrefix}/${indexPath}`),
    uploadedKeys,
    levelEditorIntegration: integration,
  }
}

function isRootThumbnailAsset(key: string, prefix: string): boolean {
  if (!key.startsWith(prefix)) {
    return false
  }

  const relativePath = key.slice(prefix.length)
  return /^thumbnail(?:-\d+)?(?:-w\d+)?\.[^/]+$/i.test(relativePath)
}

type ThumbnailSlideUpload = {
  original: string
  variants?: Array<{
    width: number
    image: string
  }>
}

const RESPONSIVE_THUMBNAIL_WIDTHS = new Set([320, 640])
const RESPONSIVE_THUMBNAIL_QUERY = "rv=1"

function createResponsiveThumbnailUrl(key: string): string {
  return `${createAssetUrl(key)}?${RESPONSIVE_THUMBNAIL_QUERY}`
}

function isRootUserAvatarAsset(key: string, prefix: string): boolean {
  if (!key.startsWith(prefix)) {
    return false
  }

  const relativePath = key.slice(prefix.length)
  return /^avatar\.[^/]+$/i.test(relativePath)
}

export async function deleteGameThumbnailAssetsFromR2(gameId: string): Promise<number> {
  const prefix = `games/${gameId}/`
  const client = getR2Client()
  const bucket = getBucketName()

  let continuationToken: string | undefined
  let deletedCount = 0

  do {
    const listed = await client.send(
      new ListObjectsV2Command({
        Bucket: bucket,
        Prefix: prefix,
        ContinuationToken: continuationToken,
      })
    )

    const objectsToDelete =
      listed.Contents?.map((obj) => obj.Key)
        .filter((key): key is string => Boolean(key))
        .filter((key) => isRootThumbnailAsset(key, prefix))
        .map((key) => ({ Key: key })) || []

    if (objectsToDelete.length > 0) {
      await client.send(
        new DeleteObjectsCommand({
          Bucket: bucket,
          Delete: {
            Objects: objectsToDelete,
            Quiet: true,
          },
        })
      )
      deletedCount += objectsToDelete.length
    }

    continuationToken = listed.IsTruncated ? listed.NextContinuationToken : undefined
  } while (continuationToken)

  return deletedCount
}

export async function deleteUserAvatarAssetsFromR2(userId: string): Promise<number> {
  const prefix = `users/${userId}/`
  const client = getR2Client()
  const bucket = getBucketName()

  let continuationToken: string | undefined
  let deletedCount = 0

  do {
    const listed = await client.send(
      new ListObjectsV2Command({
        Bucket: bucket,
        Prefix: prefix,
        ContinuationToken: continuationToken,
      })
    )

    const objectsToDelete =
      listed.Contents?.map((obj) => obj.Key)
        .filter((key): key is string => Boolean(key))
        .filter((key) => isRootUserAvatarAsset(key, prefix))
        .map((key) => ({ Key: key })) || []

    if (objectsToDelete.length > 0) {
      await client.send(
        new DeleteObjectsCommand({
          Bucket: bucket,
          Delete: {
            Objects: objectsToDelete,
            Quiet: true,
          },
        })
      )
      deletedCount += objectsToDelete.length
    }

    continuationToken = listed.IsTruncated ? listed.NextContinuationToken : undefined
  } while (continuationToken)

  return deletedCount
}

export async function deleteStaleGameAssetsFromR2(gameId: string, keepKeys: string[]): Promise<number> {
  const prefix = `games/${gameId}/`
  const keepSet = new Set(keepKeys)
  const client = getR2Client()
  const bucket = getBucketName()

  let continuationToken: string | undefined
  let deletedCount = 0

  do {
    const listed = await client.send(
      new ListObjectsV2Command({
        Bucket: bucket,
        Prefix: prefix,
        ContinuationToken: continuationToken,
      })
    )

    const objectsToDelete =
      listed.Contents?.map((obj) => obj.Key)
        .filter((key): key is string => Boolean(key))
        .filter((key) => !keepSet.has(key) && !isRootThumbnailAsset(key, prefix))
        .map((key) => ({ Key: key })) || []

    if (objectsToDelete.length > 0) {
      await client.send(
        new DeleteObjectsCommand({
          Bucket: bucket,
          Delete: {
            Objects: objectsToDelete,
            Quiet: true,
          },
        })
      )
      deletedCount += objectsToDelete.length
    }

    continuationToken = listed.IsTruncated ? listed.NextContinuationToken : undefined
  } while (continuationToken)

  return deletedCount
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
    const fileName = `${fileStem}.${parsed.extension}`
    const key = `games/${gameId}/${fileName}`

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

export async function deleteGameAssetsFromR2(gameId: string): Promise<number> {
  const prefix = `games/${gameId}/`
  const client = getR2Client()
  const bucket = getBucketName()

  let continuationToken: string | undefined
  let deletedCount = 0

  do {
    const listed = await client.send(
      new ListObjectsV2Command({
        Bucket: bucket,
        Prefix: prefix,
        ContinuationToken: continuationToken,
      })
    )

    const objects = listed.Contents?.map((obj) => ({ Key: obj.Key })).filter((obj) => !!obj.Key) || []

    if (objects.length > 0) {
      await client.send(
        new DeleteObjectsCommand({
          Bucket: bucket,
          Delete: {
            Objects: objects,
            Quiet: true,
          },
        })
      )
      deletedCount += objects.length
    }

    continuationToken = listed.IsTruncated ? listed.NextContinuationToken : undefined
  } while (continuationToken)

  return deletedCount
}

export function validateR2Config(): { valid: boolean; missing: string[] } {
  const missing = R2_REQUIRED_ENV.filter((name) => !process.env[name]?.trim())
  return {
    valid: missing.length === 0,
    missing,
  }
}
