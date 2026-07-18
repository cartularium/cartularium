import { describe, it, expect } from "vitest"
import { insertImageMarkdown } from "./imageUpload"

describe("insertImageMarkdown", () => {
  it("returns a transaction spec inserting [alt](url) at the given position", () => {
    const spec = insertImageMarkdown(5, "https://assets.sheets.wiki/abc/foo.png")
    expect(spec).toEqual({
      changes: { from: 5, insert: "![](https://assets.sheets.wiki/abc/foo.png)" },
    })
  })

  it("uses the same form for cursor inserts and drop-position inserts", () => {
    const a = insertImageMarkdown(0, "url-a")
    const b = insertImageMarkdown(42, "url-b")
    expect(a.changes.insert).toBe("![](url-a)")
    expect(b.changes.insert).toBe("![](url-b)")
  })
})
