import { describe, it, expect } from "vitest"
import { resolveSlug } from "./useEditorLoad"
import type { EditIndexEntry } from "@cartularium/contracts"

const entries: readonly EditIndexEntry[] = [
  { slug: "SUMIF", title: "SUMIF", kind: "function" },
  { slug: "concept/Aggregation", title: "Aggregation", kind: "concept" },
]
const findEntry = (s: string) => entries.find((e) => e.slug === s)

describe("resolveSlug", () => {
  it("returns an existing flat-slug entry", () => {
    const r = resolveSlug("SUMIF", entries, findEntry)
    expect(r.kind).toBe("entry")
    if (r.kind === "entry") expect(r.entry.slug).toBe("SUMIF")
  })

  it("synthesizes a new-page entry for valid open-kind/slug", () => {
    const r = resolveSlug("concept/Brand-New", entries, findEntry)
    expect(r.kind).toBe("entry")
    if (r.kind === "entry") {
      expect(r.entry.kind).toBe("concept")
      expect(r.entry.slug).toBe("concept/Brand-New")
      expect(r.entry.title).toBe("Brand-New")
    }
  })

  it("rejects closed-kind hand-typed slugs as missing", () => {
    expect(resolveSlug("function/MAGICSUM", entries, findEntry).kind).toBe("missing")
  })

  it("rejects unknown-kind slugs as missing", () => {
    expect(resolveSlug("garbage/My-Page", entries, findEntry).kind).toBe("missing")
  })

  it("treats unknown flat slugs as missing", () => {
    expect(resolveSlug("DEFINITELY-NOT-A-PAGE", entries, findEntry).kind).toBe("missing")
  })
})
