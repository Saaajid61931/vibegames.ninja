import { createHash, randomUUID } from "node:crypto"
import JSZip from "jszip"
import { PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3"
import { getR2Client } from "@/lib/storage-r2"
import { CommunityError } from "@/lib/community-api"
import { safeSourcePath } from "@/lib/source-projects"
export function sourceStorageReady() {
  return Boolean(
    process.env.R2_ACCOUNT_ID &&
    process.env.R2_ACCESS_KEY_ID &&
    process.env.R2_SECRET_ACCESS_KEY &&
    process.env.R2_SOURCE_BUCKET_NAME &&
    process.env.R2_SOURCE_BUCKET_PRIVATE_CONFIRMED === "true" &&
    process.env.R2_SOURCE_BUCKET_NAME !== process.env.R2_BUCKET_NAME,
  )
}
function bucket() {
  if (!sourceStorageReady()) throw new CommunityError("Source uploads are not available yet.", 503)
  return process.env.R2_SOURCE_BUCKET_NAME!
}
export async function inspectSourceArchive(bytes: Buffer) {
  if (bytes.length > 20 * 1024 * 1024) throw new CommunityError("Please keep the ZIP below 20 MB.")
  let zip: JSZip
  try {
    zip = await JSZip.loadAsync(bytes)
  } catch {
    throw new CommunityError("Upload a valid ZIP archive.")
  }
  const entries = Object.values(zip.files).filter((e) => !e.dir)
  if (!entries.length || entries.length > 400)
    throw new CommunityError(
      "Use a ZIP with 1–400 project files, without dependencies or build caches.",
    )
  let expanded = 0
  const manifest: { path: string; bytes: number }[] = []
  let sourceFiles = 0,
    readme = false
  for (const entry of entries) {
    const internal = entry as typeof entry & {
      unsafeOriginalName?: string
      _data?: { uncompressedSize?: number }
    }
    if (!safeSourcePath(internal.unsafeOriginalName || entry.name))
      throw new CommunityError(
        "Remove unsafe paths, credentials, dependencies, or executable binaries from the ZIP.",
      )
    const size = internal._data?.uncompressedSize
    if (typeof size !== "number" || size < 0 || size > 10 * 1024 * 1024)
      throw new CommunityError("Each expanded file must be below 10 MB.")
    expanded += size
    if (expanded > 50 * 1024 * 1024)
      throw new CommunityError("Expanded project must be below 50 MB.")
    if (/(^|\/)readme(\.md|\.txt)?$/i.test(entry.name)) readme = true
    if (/\.(html|js|ts|tsx|jsx|gd|cs|lua|py)$/i.test(entry.name)) sourceFiles++
    if (
      size < 500000 &&
      /\.(html|js|ts|tsx|jsx|json|txt|md|yaml|yml|toml|env)$/i.test(entry.name)
    ) {
      const text = await entry.async("string")
      if (
        /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----|sk_live_[a-zA-Z0-9]{12,}|AKIA[0-9A-Z]{16}/.test(
          text,
        )
      )
        throw new CommunityError("A possible secret was found. Remove it before uploading.")
      if (
        entries.length <= 3 &&
        /\.html$/i.test(entry.name) &&
        /<iframe\b/i.test(text) &&
        !/<script\b/i.test(text)
      )
        throw new CommunityError(
          "Upload the editable game project, not a page embedding another game.",
        )
    }
    manifest.push({ path: entry.name, bytes: size })
  }
  if (!readme || !sourceFiles)
    throw new CommunityError("Include a README and actual editable source files.")
  return manifest
}
export async function storeSourceArchive(bytes: Buffer) {
  const manifest = await inspectSourceArchive(bytes)
  const storageKey = "source-projects/" + randomUUID() + ".zip"
  await getR2Client().send(
    new PutObjectCommand({
      Bucket: bucket(),
      Key: storageKey,
      Body: bytes,
      ContentType: "application/zip",
      CacheControl: "private, no-store",
    }),
  )
  return { storageKey, manifest, sha256: createHash("sha256").update(bytes).digest("hex") }
}
export async function removeSourceArchive(key: string) {
  await getR2Client().send(new DeleteObjectCommand({ Bucket: bucket(), Key: key }))
}
export async function readSourceArchive(key: string) {
  const result = await getR2Client().send(new GetObjectCommand({ Bucket: bucket(), Key: key }))
  if (!result.Body)
    throw new CommunityError("The project could not be downloaded. Please contact support.", 503)
  return result.Body.transformToByteArray()
}
