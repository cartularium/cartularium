import { describe, it, expect } from "vitest"
import { requestOrigin } from "./origin"

interface FakeContext {
  req: {
    url: string
    header: (name: string) => string | undefined
  }
}

function makeCtx(opts: {
  url: string
  xForwardedHost?: string
  xForwardedProto?: string
}): FakeContext {
  return {
    req: {
      url: opts.url,
      header(name: string) {
        if (name === "X-Forwarded-Host") return opts.xForwardedHost
        if (name === "X-Forwarded-Proto") return opts.xForwardedProto
        return undefined
      },
    },
  }
}

describe("requestOrigin", () => {
  it("returns the request URL's origin for production requests (sheets.wiki)", () => {
    const ctx = makeCtx({ url: "https://sheets.wiki/api/edit/auth/login" })
    expect(requestOrigin(ctx as unknown as Parameters<typeof requestOrigin>[0])).toBe(
      "https://sheets.wiki",
    )
  })

  it("ignores X-Forwarded-Host on production requests (security: prevents redirect_uri spoofing)", () => {
    const ctx = makeCtx({
      url: "https://sheets.wiki/api/edit/auth/login",
      xForwardedHost: "evil.example.com",
      xForwardedProto: "https",
    })
    expect(requestOrigin(ctx as unknown as Parameters<typeof requestOrigin>[0])).toBe(
      "https://sheets.wiki",
    )
  })

  it("honors X-Forwarded-Host when the request host is localhost (dev case)", () => {
    const ctx = makeCtx({
      url: "http://localhost:8787/api/edit/auth/login",
      xForwardedHost: "localhost:8083",
      xForwardedProto: "http",
    })
    expect(requestOrigin(ctx as unknown as Parameters<typeof requestOrigin>[0])).toBe(
      "http://localhost:8083",
    )
  })

  it("honors X-Forwarded-Host when the request host is 127.0.0.1", () => {
    const ctx = makeCtx({
      url: "http://127.0.0.1:8787/api/edit/auth/login",
      xForwardedHost: "127.0.0.1:8083",
      xForwardedProto: "http",
    })
    expect(requestOrigin(ctx as unknown as Parameters<typeof requestOrigin>[0])).toBe(
      "http://127.0.0.1:8083",
    )
  })

  it("defaults X-Forwarded-Proto to http when missing on a localhost request", () => {
    const ctx = makeCtx({
      url: "http://localhost:8787/api/edit/auth/login",
      xForwardedHost: "localhost:8083",
    })
    expect(requestOrigin(ctx as unknown as Parameters<typeof requestOrigin>[0])).toBe(
      "http://localhost:8083",
    )
  })

  it("falls back to the request URL when X-Forwarded-Host is absent on localhost", () => {
    const ctx = makeCtx({ url: "http://localhost:8787/api/edit/auth/login" })
    expect(requestOrigin(ctx as unknown as Parameters<typeof requestOrigin>[0])).toBe(
      "http://localhost:8787",
    )
  })

  it("honors X-Forwarded-Host when the URL host is the production route but X-Forwarded-Host is localhost (wrangler dev)", () => {
    const ctx = makeCtx({
      url: "http://sheets.wiki/api/edit/auth/login",
      xForwardedHost: "localhost:8083",
      xForwardedProto: "http",
    })
    expect(requestOrigin(ctx as unknown as Parameters<typeof requestOrigin>[0])).toBe(
      "http://localhost:8083",
    )
  })

  it("ignores a non-localhost X-Forwarded-Host on a real production request (security)", () => {
    const ctx = makeCtx({
      url: "https://sheets.wiki/api/edit/auth/login",
      xForwardedHost: "evil.example.com",
      xForwardedProto: "https",
    })
    expect(requestOrigin(ctx as unknown as Parameters<typeof requestOrigin>[0])).toBe(
      "https://sheets.wiki",
    )
  })
})
