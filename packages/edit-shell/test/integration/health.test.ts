import { SELF } from "cloudflare:test"
import { describe, expect, it } from "vitest"

describe("GET /api/edit/health", () => {
  it("returns ok", async () => {
    const res = await SELF.fetch("https://sheets.wiki/api/edit/health")
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ ok: true })
  })
})
