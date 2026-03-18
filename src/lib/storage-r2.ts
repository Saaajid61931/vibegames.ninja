import {
  DeleteObjectsCommand,
  ListObjectsV2Command,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3"

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

export function getR2Client(): S3Client {
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

export function getBucketName(): string {
  return getEnv("R2_BUCKET_NAME")
}

export function getPublicBaseUrl(): string {
  return getEnv("R2_PUBLIC_BASE_URL").replace(/\/+$/, "")
}

export function createAssetUrl(key: string): string {
  return `${getPublicBaseUrl()}/${key}`
}

export async function putObject(params: {
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

export async function deleteObjectsByPredicate(prefix: string, predicate: (key: string) => boolean): Promise<number> {
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
        .filter(predicate)
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

export async function deleteAllObjectsUnderPrefix(prefix: string): Promise<number> {
  return deleteObjectsByPredicate(prefix, () => true)
}

export function validateR2Config(): { valid: boolean; missing: string[] } {
  const missing = R2_REQUIRED_ENV.filter((name) => !process.env[name]?.trim())
  return {
    valid: missing.length === 0,
    missing,
  }
}
