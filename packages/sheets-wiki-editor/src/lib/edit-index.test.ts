import { describe, it, expect, beforeEach, vi } from "vitest"
import { loadEditIndex, _resetForTests } from "./edit-index"
import { EDIT_INDEX_VERSION } from "@cartularium/contracts"

describe("loadEditIndex", () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    _resetForTests()
  })

  it("fetches and caches the index on first call; returns cache after", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          version: EDIT_INDEX_VERSION,
          generatedAt: "2026-05-02T00:00:00Z",
          entries: [
            { slug: "SUMIF", title: "SUMIF", kind: "function", status: "active" },
            { slug: "concept/Array", title: "Array", kind: "concept" },
          ],
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      ),
    )

    const a = await loadEditIndex()
    const b = await loadEditIndex()

    expect(a).toBe(b)
    expect(a.entries.length).toBe(2)
    expect(fetchSpy).toHaveBeenCalledTimes(1)
  })

  it("findEntry returns the matching entry", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          version: EDIT_INDEX_VERSION,
          generatedAt: "2026-05-02T00:00:00Z",
          entries: [
            { slug: "SUMIF", title: "SUMIF", kind: "function", status: "active" },
          ],
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      ),
    )

    const idx = await loadEditIndex()
    expect(idx.findEntry("SUMIF")?.kind).toBe("function")
    expect(idx.findEntry("nonexistent")).toBeUndefined()
  })

  it("throws on version mismatch with diagnostic source", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          version: 999,
          generatedAt: "2026-05-02T00:00:00Z",
          entries: [],
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      ),
    )
    try {
      await loadEditIndex()
      throw new Error("expected loadEditIndex to throw")
    } catch (e) {
      expect((e as Error).message).toMatch(/unsupported edit index version/)
    }
  })
})
