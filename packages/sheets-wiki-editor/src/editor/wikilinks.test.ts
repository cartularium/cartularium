import { describe, it, expect } from "vitest"
import {
  planWikilinkInsert,
  wikilinkCompletionSource,
  type LookupEntry,
} from "./wikilinks"

const entries: LookupEntry[] = [
  { slug: "SUMIF", title: "SUMIF", aliases: ["SUM_IF"] },
  { slug: "SUMIFS", title: "SUMIFS" },
  { slug: "concept/Array", title: "Array" },
  { slug: "concept/Range", title: "Range", aliases: ["Spreadsheet Range"] },
]

interface FakeContext {
  pos: number
  matchBefore(re: RegExp): { from: number; to: number; text: string } | null
  explicit: boolean
}

function makeCtx(opts: {
  text: string
  cursor?: number
  explicit?: boolean
}): FakeContext {
  const cursor = opts.cursor ?? opts.text.length
  return {
    pos: cursor,
    matchBefore(re: RegExp) {
      const before = opts.text.slice(0, cursor)
      const m = re.exec(before)
      if (!m) return null
      const from = before.length - m[0].length
      return { from, to: cursor, text: m[0] }
    },
    explicit: opts.explicit ?? false,
  }
}

describe("wikilinkCompletionSource", () => {
  const source = wikilinkCompletionSource(() => entries)

  it("returns null when not in a wikilink context", () => {
    const ctx = makeCtx({ text: "hello world" })
    expect(source(ctx as unknown as Parameters<typeof source>[0])).toBeNull()
  })

  it("returns matches by title prefix when typing after [[", () => {
    const ctx = makeCtx({ text: "[[SUMI" })
    const result = source(ctx as unknown as Parameters<typeof source>[0])
    expect(result).not.toBeNull()
    const labels = result!.options.map((o) => o.label)
    expect(labels).toContain("SUMIF")
    expect(labels).toContain("SUMIFS")
    expect(labels).not.toContain("Array")
  })

  it("matches by slug prefix as well as title", () => {
    const ctx = makeCtx({ text: "[[concept/" })
    const result = source(ctx as unknown as Parameters<typeof source>[0])
    expect(result).not.toBeNull()
    const labels = result!.options.map((o) => o.label)
    expect(labels).toContain("Array")
    expect(labels).toContain("Range")
  })

  it("matches aliases", () => {
    const ctx = makeCtx({ text: "[[Spreads" })
    const result = source(ctx as unknown as Parameters<typeof source>[0])
    expect(result).not.toBeNull()
    const labels = result!.options.map((o) => o.label)
    expect(labels).toContain("Range")
  })

  it("inserts the canonical title (not the alias-typed query)", () => {
    const ctx = makeCtx({ text: "[[SUM_I" })
    const result = source(ctx as unknown as Parameters<typeof source>[0])
    const sumif = result!.options.find((o) => o.label === "SUMIF")
    expect(sumif).toBeDefined()
    const view = makeStubView("[[SUM_I", 7)
    ;(sumif!.apply as ApplyFn)(
      view as unknown as ApplyView,
      sumif!,
      2,
      7,
    )
    expect(view.dispatched?.changes.insert).toBe("SUMIF]]")
  })

  it("when ]] already follows the cursor, consumes them instead of double-closing", () => {
    const ctx = makeCtx({ text: "[[SUM_I]]", cursor: 7 })
    const result = source(ctx as unknown as Parameters<typeof source>[0])
    const sumif = result!.options.find((o) => o.label === "SUMIF")!
    const view = makeStubView("[[SUM_I]]", 7)
    ;(sumif.apply as ApplyFn)(view as unknown as ApplyView, sumif, 2, 7)
    const dispatched = view.dispatched!
    expect(dispatched.changes.insert).toBe("SUMIF]]")
    expect(dispatched.changes.from).toBe(2)
    expect(dispatched.changes.to).toBe(9)
  })

  it("returns up to 20 results (cap, soft limit for performance)", () => {
    const big: LookupEntry[] = Array.from({ length: 100 }, (_, i) => ({
      slug: `function/X${i}`,
      title: `X${i}`,
    }))
    const bigSource = wikilinkCompletionSource(() => big)
    const ctx = makeCtx({ text: "[[X" })
    const result = bigSource(ctx as unknown as Parameters<typeof bigSource>[0])
    expect(result!.options.length).toBeLessThanOrEqual(20)
  })

  it("is case-insensitive on the typed prefix", () => {
    const ctx = makeCtx({ text: "[[sumif" })
    const result = source(ctx as unknown as Parameters<typeof source>[0])
    const labels = result!.options.map((o) => o.label)
    expect(labels).toContain("SUMIF")
  })

  it("matches by substring, not just prefix (so `[[lookup` finds XLOOKUP)", () => {
    const lookupEntries: LookupEntry[] = [
      { slug: "XLOOKUP", title: "XLOOKUP" },
      { slug: "VLOOKUP", title: "VLOOKUP" },
      { slug: "HLOOKUP", title: "HLOOKUP" },
      { slug: "SUMIF", title: "SUMIF" },
    ]
    const lookupSource = wikilinkCompletionSource(() => lookupEntries)
    const ctx = makeCtx({ text: "[[lookup" })
    const result = lookupSource(ctx as unknown as Parameters<typeof lookupSource>[0])
    const labels = result!.options.map((o) => o.label)
    expect(labels).toContain("XLOOKUP")
    expect(labels).toContain("VLOOKUP")
    expect(labels).toContain("HLOOKUP")
    expect(labels).not.toContain("SUMIF")
  })

  it("matches by substring on slugs (e.g. `[[lookup` finds an entry whose slug contains it mid-string)", () => {
    const slugEntries: LookupEntry[] = [
      { slug: "function/categories/lookup-and-reference", title: "Lookup & Reference" },
      { slug: "concept/Array", title: "Array" },
    ]
    const slugSource = wikilinkCompletionSource(() => slugEntries)
    const ctx = makeCtx({ text: "[[categories" })
    const result = slugSource(ctx as unknown as Parameters<typeof slugSource>[0])
    const labels = result!.options.map((o) => o.label)
    expect(labels).toContain("Lookup & Reference")
  })
})

describe("planWikilinkInsert", () => {
  it("returns `<title>]]` with no consumeAfter when nothing follows", () => {
    expect(planWikilinkInsert("", "SUMIF")).toEqual({
      insert: "SUMIF]]",
      consumeAfter: 0,
    })
  })

  it("consumes the trailing `]]` when they're already present (closeBrackets autopair)", () => {
    expect(planWikilinkInsert("]]", "SUMIF")).toEqual({
      insert: "SUMIF]]",
      consumeAfter: 2,
    })
  })

  it("consumes `]]` even when followed by other content", () => {
    expect(planWikilinkInsert("]] more text", "Array")).toEqual({
      insert: "Array]]",
      consumeAfter: 2,
    })
  })

  it("does NOT consume a single `]` (only the closeBrackets pair counts)", () => {
    expect(planWikilinkInsert("]", "X")).toEqual({
      insert: "X]]",
      consumeAfter: 0,
    })
  })

  it("does NOT consume when a single `]` is followed by non-`]` text", () => {
    expect(planWikilinkInsert("]a", "X")).toEqual({
      insert: "X]]",
      consumeAfter: 0,
    })
  })
})

interface DispatchedChange {
  changes: { from: number; to: number; insert: string }
  selection?: { anchor: number }
}

interface ApplyView {
  state: { doc: { sliceString(from: number, to: number): string } }
  dispatch(change: DispatchedChange): void
}

type ApplyFn = (
  view: ApplyView,
  completion: { label: string },
  from: number,
  to: number,
) => void

function makeStubView(docText: string, _cursor: number) {
  const view = {
    state: {
      doc: {
        sliceString(from: number, to: number) {
          return docText.slice(from, to)
        },
      },
    },
    dispatched: undefined as DispatchedChange | undefined,
    dispatch(change: DispatchedChange) {
      this.dispatched = change
    },
  }
  return view
}
