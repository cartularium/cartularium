import { describe, it, expect } from "vitest"
import { parseFrontmatter, diffLockedFields } from "./frontmatter"

const SAMPLE_FN = `---
title: SUMIF
category: math
engines: [gsheets, excel, lattice]
aliases: []
status: active
dek: Sum cells matching a single criterion.
tags: [aggregation]
---

The body.
`

describe("parseFrontmatter", () => {
  it("parses YAML frontmatter into an object", () => {
    const fm = parseFrontmatter(SAMPLE_FN)
    expect(fm).toEqual({
      title: "SUMIF",
      category: "math",
      engines: ["gsheets", "excel", "lattice"],
      aliases: [],
      status: "active",
      dek: "Sum cells matching a single criterion.",
      tags: ["aggregation"],
    })
  })

  it("returns null when no frontmatter present", () => {
    expect(parseFrontmatter("just body content\n")).toBeNull()
  })

  it("returns null when frontmatter delimiters are malformed", () => {
    expect(parseFrontmatter("---\nfoo: bar\n")).toBeNull()
  })

  it("handles empty frontmatter", () => {
    expect(parseFrontmatter("---\n---\nbody\n")).toEqual({})
  })
})

describe("diffLockedFields", () => {
  it("returns the keys whose values differ between two frontmatters", () => {
    const before = { title: "SUMIF", category: "math", dek: "old" }
    const after = { title: "SUMIF Sum-If", category: "math", dek: "new" }
    expect(diffLockedFields(before, after, ["title", "category"])).toEqual(["title"])
  })

  it("treats missing-vs-present as a change", () => {
    const before = { title: "SUMIF" }
    const after = { title: "SUMIF", category: "math" }
    expect(diffLockedFields(before, after, ["category"])).toEqual(["category"])
  })

  it("compares arrays by deep equality", () => {
    const before = { engines: ["gsheets", "excel"] }
    const after = { engines: ["gsheets", "excel", "lattice"] }
    expect(diffLockedFields(before, after, ["engines"])).toEqual(["engines"])
  })

  it("returns [] when no locked fields changed", () => {
    const before = { title: "SUMIF", dek: "old" }
    const after = { title: "SUMIF", dek: "new" }
    expect(diffLockedFields(before, after, ["title"])).toEqual([])
  })

  it("handles null inputs gracefully", () => {
    expect(diffLockedFields(null, { title: "x" }, ["title"])).toEqual(["title"])
    expect(diffLockedFields({ title: "x" }, null, ["title"])).toEqual(["title"])
    expect(diffLockedFields(null, null, ["title"])).toEqual([])
  })
})
