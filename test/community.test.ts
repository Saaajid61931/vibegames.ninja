import test from "node:test"
import assert from "node:assert/strict"
import { createHmac } from "node:crypto"
import JSZip from "jszip"
import {
  safeSourcePath,
  sourceMetadataSchema,
  paymentMatchesOrder,
} from "../src/lib/source-projects"
import { verifyStripeSignature, platformFee } from "../src/lib/source-payments"
import { inspectSourceArchive } from "../src/lib/source-storage"

test("source paths reject traversal, credentials, Windows paths and executable binaries", () => {
  for (const name of [
    "../game.js",
    "../../secret",
    "C:/game.js",
    "/game.js",
    "src/../game.js",
    "src\\..\\secret",
    ".env",
    ".env.local",
    ".git/config",
    "node_modules/a.js",
    "setup.exe",
    "key.pem",
    "folder./game.js",
  ])
    assert.equal(safeSourcePath(name), false, name)
  for (const name of [
    "src/game.ts",
    "index.html",
    "README.md",
    ".env.example",
    "assets/sprite.png",
  ])
    assert.equal(safeSourcePath(name), true, name)
})

test("source metadata requires real documentation, consent and whole-cent prices", () => {
  const valid = {
    version: "1.0.0",
    description: "An editable version of this browser game.",
    readme: "Open index.html in a browser. Change the colors in game.js.",
    license:
      "Permission is granted to modify this project for personal use. Redistribution is not included.",
    format: "HTML + JavaScript",
    priceCents: 100,
    rightsConfirmed: true,
  }
  assert.equal(sourceMetadataSchema.safeParse(valid).success, true)
  for (const invalid of [
    { priceCents: 99 },
    { priceCents: 1.5 },
    { rightsConfirmed: false },
    { readme: "none" },
    { version: "../1" },
  ])
    assert.equal(sourceMetadataSchema.safeParse({ ...valid, ...invalid }).success, false)
})

test("webhook signatures require intact payloads, fresh timestamps and a matching signature", () => {
  const now = 1770000000,
    body = '{"type":"checkout.session.completed"}',
    secret = "whsec_local_test_only"
  const signature = createHmac("sha256", secret)
    .update(now + "." + body)
    .digest("hex")
  const header = "t=" + now + ",v1=" + signature
  assert.equal(verifyStripeSignature(body, header, secret, now), true)
  assert.equal(verifyStripeSignature(body + " ", header, secret, now), false)
  assert.equal(verifyStripeSignature(body, header, secret, now + 301), false)
  assert.equal(verifyStripeSignature(body, header, "wrong", now), false)
  assert.equal(
    verifyStripeSignature(body, "t=" + now + ",v1=invalid,v1=" + signature, secret, now),
    true,
  )
})

test("entitlement confirmation requires exact payment, currency and checkout matching", () => {
  const order = { amountCents: 100, currency: "usd", checkoutId: "cs_expected" }
  const checkout = { id: "cs_expected", amount_total: 100, currency: "usd", payment_status: "paid" }
  assert.equal(paymentMatchesOrder(order, checkout), true)
  for (const changed of [
    { id: "cs_other" },
    { amount_total: 1 },
    { currency: "eur" },
    { payment_status: "unpaid" },
  ])
    assert.equal(paymentMatchesOrder(order, { ...checkout, ...changed }), false)
})

test("source archives accept editable projects and reject missing README, wrappers and secrets", async () => {
  const good = new JSZip()
  good.file("README.md", "Open index.html to play and edit the script.")
  good.file("index.html", "<html><script>let score = 0;</script></html>")
  assert.equal(
    (await inspectSourceArchive(await good.generateAsync({ type: "nodebuffer" }))).length,
    2,
  )
  const missing = new JSZip()
  missing.file("index.html", "<html><script>let score=0</script></html>")
  await assert.rejects(() => inspectSourceArchive(Buffer.from("not a zip")))
  await assert.rejects(
    async () => inspectSourceArchive(await missing.generateAsync({ type: "nodebuffer" })),
    /README/,
  )
  const wrapper = new JSZip()
  wrapper.file("README.md", "Just an iframe.")
  wrapper.file("index.html", '<iframe src="https://example.com/game"></iframe>')
  await assert.rejects(
    async () => inspectSourceArchive(await wrapper.generateAsync({ type: "nodebuffer" })),
    /editable game project/,
  )
  const secret = new JSZip()
  secret.file("README.md", "Open the project.")
  secret.file("game.js", 'const key = "sk_live_abcdefghijklmnop";')
  await assert.rejects(
    async () => inspectSourceArchive(await secret.generateAsync({ type: "nodebuffer" })),
    /possible secret/,
  )
})

test("platform fee uses integer cents and rejects invalid configuration", () => {
  const previous = process.env.SOURCE_PLATFORM_FEE_BPS
  try {
    process.env.SOURCE_PLATFORM_FEE_BPS = "1500"
    assert.equal(platformFee(101), 15)
    process.env.SOURCE_PLATFORM_FEE_BPS = "9000"
    assert.throws(() => platformFee(100))
  } finally {
    if (previous === undefined) delete process.env.SOURCE_PLATFORM_FEE_BPS
    else process.env.SOURCE_PLATFORM_FEE_BPS = previous
  }
})
