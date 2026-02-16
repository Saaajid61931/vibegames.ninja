/**
 * Fix Geometry Jump: Hide the local "LEVEL EDITOR" button on the start screen
 * so players can't bypass the platform's /play/[slug]/editor page.
 *
 * Run: npx tsx scripts/fix-geometry-jump-editor.ts
 */
import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3"
import dotenv from "dotenv"
dotenv.config()

const GAME_ID = "5fc80ea1-3c6f-4889-b451-37c60b7df30b"
const KEY = `games/${GAME_ID}/index.html`

async function main() {
  const client = new S3Client({
    region: "auto",
    endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID!,
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
    },
  })

  // 1. Fetch current HTML from R2
  console.log("Fetching index.html from R2...")
  const getResult = await client.send(
    new GetObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME!,
      Key: KEY,
    })
  )
  const html = await getResult.Body!.transformToString("utf-8")
  console.log(`Fetched ${html.length} bytes`)

  // 2. Patch: add "hidden" class to #btn-start-editor
  const oldBtnHtml = `<button class="control-btn" id="btn-start-editor"`
  const newBtnHtml = `<button class="control-btn hidden" id="btn-start-editor"`

  if (!html.includes(oldBtnHtml)) {
    if (html.includes(newBtnHtml)) {
      console.log("Already patched — btn-start-editor already has hidden class. Nothing to do.")
      return
    }
    console.error("Could not find btn-start-editor in the expected format. Aborting.")
    process.exit(1)
  }

  const patched = html.replace(oldBtnHtml, newBtnHtml)

  // Also remove the dynamically-created EXIT button that shows the start screen
  // (in editor mode it doesn't make sense with platform integration).
  // We do this by modifying the JS that creates the EXIT button to only create it
  // when NOT running inside the VG platform (i.e., when window.parent === window).
  const oldExitCode = `const backToMenuBtn = document.createElement('button');`
  const newExitCode = `const backToMenuBtn = document.createElement('button'); if (window.parent !== window) backToMenuBtn.classList.add('hidden');`
  const patched2 = patched.replace(oldExitCode, newExitCode)

  console.log(`Patched HTML: ${patched2.length} bytes`)

  // 3. Upload back to R2
  console.log("Uploading patched index.html to R2...")
  await client.send(
    new PutObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME!,
      Key: KEY,
      Body: Buffer.from(patched2, "utf-8"),
      ContentType: "text/html; charset=utf-8",
      CacheControl: "public, max-age=300",
    })
  )

  console.log("Done! Geometry Jump index.html has been patched:")
  console.log("  - #btn-start-editor now has 'hidden' class (players can't enter editor from start screen)")
  console.log("  - EXIT button hidden when running inside VG platform iframe")
}

main().catch((err) => {
  console.error("Failed:", err)
  process.exit(1)
})
