import { describe, expect, it } from "vitest"
import { parseCookie, serializeSessionCookie } from "../../src/auth/cookie"

describe("cookie helpers", () => {
  describe("serializeSessionCookie", () => {
    it("emits domain-scoped Secure HttpOnly SameSite=Lax with 30d max-age (production)", () => {
      const out = serializeSessionCookie("abc123", { domain: ".sheets.wiki", secure: true })
      expect(out).toContain("__cart_sess=abc123")
      expect(out).toContain("Domain=.sheets.wiki")
      expect(out).toContain("Path=/")
      expect(out).toContain("Secure")
      expect(out).toContain("HttpOnly")
      expect(out).toContain("SameSite=Lax")
      expect(out).toMatch(/Max-Age=\d+/)
    })

    it("emits Max-Age=0 for clear", () => {
      const out = serializeSessionCookie("", {
        domain: ".sheets.wiki",
        secure: true,
        clear: true,
      })
      expect(out).toContain("Max-Age=0")
    })

    it("omits Domain attribute when domain is empty (localhost dev)", () => {
      const out = serializeSessionCookie("abc123", { domain: "", secure: false })
      expect(out).toContain("__cart_sess=abc123")
      expect(out).not.toMatch(/Domain=/)
    })

    it("omits Secure when secure is false (http localhost)", () => {
      const out = serializeSessionCookie("abc123", { domain: "", secure: false })
      expect(out).not.toMatch(/(?:^|; )Secure(?:;|$)/)
      // HttpOnly + SameSite remain regardless of Secure flag
      expect(out).toContain("HttpOnly")
      expect(out).toContain("SameSite=Lax")
    })
  })

  describe("parseCookie", () => {
    it("returns the value for a known cookie", () => {
      expect(parseCookie("a=1; __cart_sess=xyz; b=2", "__cart_sess")).toBe("xyz")
    })

    it("returns null when missing", () => {
      expect(parseCookie("a=1", "__cart_sess")).toBeNull()
    })

    it("returns null on empty header", () => {
      expect(parseCookie(null, "__cart_sess")).toBeNull()
    })
  })
})
