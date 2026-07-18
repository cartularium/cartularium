import { env, SELF } from "cloudflare:test"
import { describe, expect, it } from "vitest"
import { createSession } from "../../src/auth/session"

describe("POST /api/edit/assets", () => {
  it("uploads an image and returns the URL", async () => {
    const id = await createSession(env.SESSIONS, {
      user_login: "alice",
      user_id: 1,
      user_token: "ghu_x",
      token_expiry: Date.now() + 3600_000,
      fork_repo: null,
    })
    const pngBytes = new Uint8Array([
      0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x01, 0x02, 0x03, 0x04,
    ])
    const file = new File([pngBytes], "photo.png", { type: "image/png" })
    const fd = new FormData()
    fd.append("file", file)

    const res = await SELF.fetch("https://sheets.wiki/api/edit/assets", {
      method: "POST",
      headers: { Cookie: `__cart_sess=${id}`, Origin: "https://sheets.wiki" },
      body: fd,
    })
    expect(res.status).toBe(201)
    const body = (await res.json()) as { url: string; key: string }
    expect(body.key).toMatch(/^[a-f0-9]{12}\/photo\.png$/)
    expect(body.url).toBe(`https://assets.sheets.wiki/${body.key}`)

    // Object should exist in R2. Read it back fully so the R2ObjectBody
    // RPC stub is consumed before the test finishes (miniflare isolated
    // storage requires all stubs disposed; see vitest-pool-workers known
    // issues).
    const obj = await env.ASSETS.get(body.key)
    expect(obj).not.toBeNull()
    await obj?.arrayBuffer()
  })

  it("rejects oversized uploads", async () => {
    const id = await createSession(env.SESSIONS, {
      user_login: "alice",
      user_id: 1,
      user_token: "ghu_x",
      token_expiry: Date.now() + 3600_000,
      fork_repo: null,
    })
    const big = new Uint8Array(2 * 1024 * 1024) // 2 MB > 1 MB limit
    const file = new File([big], "big.png", { type: "image/png" })
    const fd = new FormData()
    fd.append("file", file)
    const res = await SELF.fetch("https://sheets.wiki/api/edit/assets", {
      method: "POST",
      headers: { Cookie: `__cart_sess=${id}`, Origin: "https://sheets.wiki" },
      body: fd,
    })
    expect(res.status).toBe(413)
  })

  it("rejects uploads where bytes don't match declared MIME (mime_mismatch)", async () => {
    const id = await createSession(env.SESSIONS, {
      user_login: "alice",
      user_id: 1,
      user_token: "ghu_x",
      token_expiry: Date.now() + 3600_000,
      fork_repo: null,
    })
    // Claims PNG but ships arbitrary bytes — magic-byte sniff should reject.
    const file = new File([new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8])], "fake.png", {
      type: "image/png",
    })
    const fd = new FormData()
    fd.append("file", file)
    const res = await SELF.fetch("https://sheets.wiki/api/edit/assets", {
      method: "POST",
      headers: { Cookie: `__cart_sess=${id}`, Origin: "https://sheets.wiki" },
      body: fd,
    })
    expect(res.status).toBe(415)
    expect(await res.json()).toEqual({ error: "mime_mismatch" })
  })

  it("rejects SVG (dropped from the allowlist as a stored-XSS channel)", async () => {
    const id = await createSession(env.SESSIONS, {
      user_login: "alice",
      user_id: 1,
      user_token: "ghu_x",
      token_expiry: Date.now() + 3600_000,
      fork_repo: null,
    })
    const svg = '<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>'
    const file = new File([svg], "evil.svg", { type: "image/svg+xml" })
    const fd = new FormData()
    fd.append("file", file)
    const res = await SELF.fetch("https://sheets.wiki/api/edit/assets", {
      method: "POST",
      headers: { Cookie: `__cart_sess=${id}`, Origin: "https://sheets.wiki" },
      body: fd,
    })
    expect(res.status).toBe(415)
    expect(await res.json()).toEqual({ error: "bad_mime" })
  })
})
