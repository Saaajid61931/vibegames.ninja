/**
 * Add thumbnail capture to Geometry Jump's VG.onRequestSave handler.
 *
 * Run: npx tsx scripts/fix-geometry-jump-thumbnail.ts
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

  console.log("Fetching index.html from R2...")
  const getResult = await client.send(
    new GetObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME!,
      Key: KEY,
    })
  )
  const html = await getResult.Body!.transformToString("utf-8")
  console.log(`Fetched ${html.length} bytes`)

  // Replace the onRequestSave handler to include thumbnail capture
  // The game HTML uses \r\n line endings
  const oldHandler = `window.VG.onRequestSave(() => {\r\n            const data = exportLevelJSON();\r\n            window.VG.saveLevel({\r\n                name: currentLevelName || "Custom Level",\r\n                description: currentLevelDescription || "",\r\n                data: data,\r\n            });\r\n        });`

  const newHandler = `window.VG.onRequestSave(() => {\r\n            const data = exportLevelJSON();\r\n            var cvs = document.getElementById('gameCanvas');\r\n            var thumbnail;\r\n            try { thumbnail = cvs ? cvs.toDataURL('image/jpeg', 0.6) : undefined; } catch(e) {}\r\n            window.VG.saveLevel({\r\n                name: currentLevelName || "Custom Level",\r\n                description: currentLevelDescription || "",\r\n                data: data,\r\n                thumbnail: thumbnail,\r\n            });\r\n        });`

  if (!html.includes(oldHandler)) {
    console.log("Could not find the old onRequestSave handler. Checking if already patched...")
    if (html.includes("toDataURL")) {
      console.log("Already patched with thumbnail capture. Nothing to do.")
      return
    }
    console.error("Could not find onRequestSave handler in expected format. Aborting.")
    process.exit(1)
  }

  const patched = html.replace(oldHandler, newHandler)
  console.log(`Patched HTML: ${patched.length} bytes`)

  console.log("Uploading patched index.html to R2...")
  await client.send(
    new PutObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME!,
      Key: KEY,
      Body: Buffer.from(patched, "utf-8"),
      ContentType: "text/html; charset=utf-8",
      CacheControl: "public, max-age=300",
    })
  )

  console.log("Done! Geometry Jump now captures canvas thumbnails on save.")
}

main().catch((err) => {
  console.error("Failed:", err)
  process.exit(1)
})
