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
  gameFile: File
): Promise<{ gameUrl: string; uploadedKeys: string[] }> {
  const gamePrefix = `games/${gameId}`
  const gameBuffer = Buffer.from(await gameFile.arrayBuffer())

  if (gameFile.name.toLowerCase().endsWith(".html")) {
    const key = `${gamePrefix}/index.html`
    await putObject({
      key,
      body: gameBuffer,
      contentType: "text/html; charset=utf-8",
      cacheControl: "public, max-age=300",
    })
    return { gameUrl: createAssetUrl(key), uploadedKeys: [key] }
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

    const entryBuffer = Buffer.from(await entry.async("uint8array"))
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

  return { gameUrl: createAssetUrl(`${gamePrefix}/${indexPath}`), uploadedKeys }
}

function isRootThumbnailAsset(key: string, prefix: string): boolean {
  if (!key.startsWith(prefix)) {
    return false
  }

  const relativePath = key.slice(prefix.length)
  return /^thumbnail\.[^/]+$/i.test(relativePath)
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

  await putObject({
    key,
    body: buffer,
    contentType: getContentType(`thumbnail.${extension}`),
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
