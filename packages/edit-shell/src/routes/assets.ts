import { Hono } from "hono"
import type { Env } from "../env"
import { contentAddressedName } from "../util/asset-name"

const app = new Hono<{ Bindings: Env }>()

const PER_IMAGE_BYTES = 1 * 1024 * 1024
// SVG intentionally omitted — it can carry <script> and would be a stored-XSS
// channel against the cookie-shared *.sheets.wiki scope when rendered inline.
const ALLOWED_MIME = new Set([
  "image/png",
  "image/jpeg",
  "image/gif",
  "image/webp",
])

// First-bytes signatures keyed by declared MIME. Keep these short and exact —
// we're sniffing to reject mismatches, not to identify unknown bytes.
const SIGNATURES: Record<string, Uint8Array[]> = {
  "image/png": [Uint8Array.of(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a)],
  "image/jpeg": [Uint8Array.of(0xff, 0xd8, 0xff)],
  "image/gif": [
    Uint8Array.of(0x47, 0x49, 0x46, 0x38, 0x37, 0x61), // GIF87a
    Uint8Array.of(0x47, 0x49, 0x46, 0x38, 0x39, 0x61), // GIF89a
  ],
}

function sniffMime(buf: ArrayBuffer, declared: string): boolean {
  if (declared === "image/webp") return sniffWebP(buf)
  const sigs = SIGNATURES[declared]
  if (!sigs) return false
  const head = new Uint8Array(buf, 0, Math.min(16, buf.byteLength))
  return sigs.some((sig) => sig.every((b, i) => head[i] === b))
}

// WebP is RIFF-wrapped: bytes 0..3 = "RIFF", bytes 8..11 = "WEBP".
function sniffWebP(buf: ArrayBuffer): boolean {
  if (buf.byteLength < 12) return false
  const u = new Uint8Array(buf, 0, 12)
  return (
    u[0] === 0x52 &&
    u[1] === 0x49 &&
    u[2] === 0x46 &&
    u[3] === 0x46 &&
    u[8] === 0x57 &&
    u[9] === 0x45 &&
    u[10] === 0x42 &&
    u[11] === 0x50
  )
}

interface UploadedFile {
  type: string
  size: number
  name: string
  arrayBuffer(): Promise<ArrayBuffer>
}

function isUploadedFile(v: unknown): v is UploadedFile {
  if (v === null || typeof v !== "object") return false
  const o = v as Record<string, unknown>
  return (
    typeof o.type === "string" &&
    typeof o.size === "number" &&
    typeof o.name === "string" &&
    typeof o.arrayBuffer === "function"
  )
}

app.post("/", async (c) => {
  const form = await c.req.formData()
  const raw = form.get("file")
  // FormDataEntryValue is `File | string | null` at runtime; workers-types `File`
  // is a structural alias without a runtime constructor, so we structurally
  // verify the shape rather than `instanceof`. This rejects strings, null,
  // and any future variant that doesn't expose the four members we use.
  if (!isUploadedFile(raw)) return c.json({ error: "no_file" }, 400)
  const file = raw
  if (!ALLOWED_MIME.has(file.type)) return c.json({ error: "bad_mime" }, 415)
  if (file.size > PER_IMAGE_BYTES) return c.json({ error: "too_large" }, 413)

  const buf = await file.arrayBuffer()
  // file.type is client-controlled; verify the bytes match what's declared so
  // a malicious upload can't claim image/png and ship arbitrary content.
  if (!sniffMime(buf, file.type)) return c.json({ error: "mime_mismatch" }, 415)
  const key = await contentAddressedName(file.name, buf)
  await c.env.ASSETS.put(key, buf, {
    httpMetadata: { contentType: file.type },
  })

  const url = `https://assets.sheets.wiki/${key}`
  return c.json({ url, key }, 201)
})

export default app
