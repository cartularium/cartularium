import { SELF } from "cloudflare:test"
import { describe, expect, it } from "vitest"

describe("origin middleware", () => {
  it("allows GET without origin", async () => {
    const res = await SELF.fetch("https://sheets.wiki/api/edit/health")
    expect(res.status).toBe(200)
  })

  it("rejects POST without origin", async () => {
    const res = await SELF.fetch("https://sheets.wiki/api/edit/health", {
      method: "POST",
    })
    expect(res.status).toBe(403)
  })

  it("rejects POST with disallowed origin", async () => {
    const res = await SELF.fetch("https://sheets.wiki/api/edit/health", {
      method: "POST",
      headers: { Origin: "https://evil.example" },
    })
    expect(res.status).toBe(403)
  })

  it("allows POST from whitelisted origin", async () => {
    const res = await SELF.fetch("https://sheets.wiki/api/edit/health", {
      method: "POST",
      headers: { Origin: "https://sheets.wiki" },
    })
    // 404/405 are fine; the assertion is "no 403 from origin middleware".
    expect([200, 404, 405]).toContain(res.status)
  })
})
