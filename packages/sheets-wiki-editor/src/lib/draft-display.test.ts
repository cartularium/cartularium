import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { shortName, deriveSlug, formatAgo } from "./draft-display"

describe("shortName", () => {
  it("strips directory and .md extension", () => {
    expect(shortName("packages/sheets-wiki/content/function/SUMIF.md")).toBe(
      "SUMIF",
    )
  })

  it("handles a bare filename", () => {
    expect(shortName("SUMIF.md")).toBe("SUMIF")
  })

  it("falls back to the input when path has no .md extension", () => {
    expect(shortName("packages/sheets-wiki/content/function/SUMIF")).toBe(
      "packages/sheets-wiki/content/function/SUMIF",
    )
  })

  it("keeps the .md when withExtension is true (file-like surfaces)", () => {
    expect(
      shortName("packages/sheets-wiki/content/function/SUMIF.md", { withExtension: true }),
    ).toBe("SUMIF.md")
  })
})

describe("deriveSlug", () => {
  it("flattens function pages (Quartz emits without kind prefix)", () => {
    expect(
      deriveSlug("packages/sheets-wiki/content/function/SUMIF.md"),
    ).toBe("SUMIF")
  })

  it("preserves kind prefix for concept pages", () => {
    expect(
      deriveSlug(
        "packages/sheets-wiki/content/concept/Volatile-functions.md",
      ),
    ).toBe("concept/Volatile-functions")
  })

  it("preserves nested rest paths", () => {
    expect(
      deriveSlug("packages/sheets-wiki/content/blog/2026-some-post.md"),
    ).toBe("blog/2026-some-post")
  })

  it("returns null for an empty path (avoids producing /edit/)", () => {
    expect(deriveSlug("")).toBeNull()
  })

  it("returns null for a path that doesn't match content/<kind>/<rest>.md", () => {
    expect(deriveSlug("README.md")).toBeNull()
    expect(deriveSlug("packages/sheets-wiki/index.md")).toBeNull()
    expect(deriveSlug("not-a-markdown-file.txt")).toBeNull()
  })
})

describe("formatAgo", () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date("2026-05-03T12:00:00Z"))
  })
  afterEach(() => {
    vi.useRealTimers()
  })

  it("returns em-dash for empty input", () => {
    expect(formatAgo("")).toBe("—")
  })

  it("returns 'just now' for sub-minute deltas", () => {
    expect(formatAgo("2026-05-03T11:59:30Z")).toBe("just now")
  })

  it("returns minutes for sub-hour deltas", () => {
    expect(formatAgo("2026-05-03T11:45:00Z")).toBe("15m ago")
  })

  it("returns hours for sub-day deltas", () => {
    expect(formatAgo("2026-05-03T05:00:00Z")).toBe("7h ago")
  })

  it("returns days for older timestamps", () => {
    expect(formatAgo("2026-04-30T12:00:00Z")).toBe("3d ago")
  })
})
