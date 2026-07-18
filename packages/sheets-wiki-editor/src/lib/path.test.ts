import { describe, it, expect } from "vitest"
import { slugToContentPath, parseEditPath, kebab } from "./path"
import type { EditIndexEntry } from "@cartularium/contracts"

const fnEntry: EditIndexEntry = { slug: "SUMIF", title: "SUMIF", kind: "function" }
const conceptEntry: EditIndexEntry = { slug: "concept/Array", title: "Array", kind: "concept" }
const blogEntry: EditIndexEntry = {
  slug: "blog/2026-some-post",
  title: "Some Post",
  kind: "blog",
}
const otherEntry: EditIndexEntry = { slug: "misc/whatever", title: "Whatever", kind: "other" }

describe("slugToContentPath", () => {
  it("maps a function entry to packages/sheets-wiki/content/function/<slug>.md (Quartz flattens function slugs)", () => {
    expect(slugToContentPath(fnEntry)).toBe("packages/sheets-wiki/content/function/SUMIF.md")
  })

  it("maps a concept entry preserving the prefix", () => {
    expect(slugToContentPath(conceptEntry)).toBe("packages/sheets-wiki/content/concept/Array.md")
  })

  it("maps a blog entry with a long slug", () => {
    expect(slugToContentPath(blogEntry)).toBe("packages/sheets-wiki/content/blog/2026-some-post.md")
  })

  it("uses the slug verbatim under packages/sheets-wiki/content/ for an 'other' kind", () => {
    expect(slugToContentPath(otherEntry)).toBe("packages/sheets-wiki/content/misc/whatever.md")
  })

  it("prefers entry.path when set (Quartz slugifies spaces; filename ≠ slug)", () => {
    const spacedEntry: EditIndexEntry = {
      slug: "blog/Asking-Questions",
      title: "Asking Questions",
      kind: "blog",
      path: "blog/Asking Questions.md",
    }
    expect(slugToContentPath(spacedEntry)).toBe(
      "packages/sheets-wiki/content/blog/Asking Questions.md",
    )
  })
})

describe("parseEditPath", () => {
  it("extracts a flat function slug", () => {
    expect(parseEditPath("/edit/SUMIF")).toEqual({ slug: "SUMIF" })
  })

  it("extracts a multi-segment slug", () => {
    expect(parseEditPath("/edit/concept/Array")).toEqual({ slug: "concept/Array" })
  })

  it("strips trailing slash", () => {
    expect(parseEditPath("/edit/SUMIF/")).toEqual({ slug: "SUMIF" })
  })

  it("returns { landing: true } for /edit/ root", () => {
    expect(parseEditPath("/edit/")).toEqual({ landing: true })
    expect(parseEditPath("/edit")).toEqual({ landing: true })
  })

  it("returns null for /edit/<slug>/preview (Phase E handles preview)", () => {
    expect(parseEditPath("/edit/SUMIF/preview")).toBeNull()
  })

  it("returns null for non-/edit paths", () => {
    expect(parseEditPath("/")).toBeNull()
    expect(parseEditPath("/concept/Array")).toBeNull()
  })

  it("returns 'drafts' marker for /edit/drafts (Phase D handles drafts)", () => {
    expect(parseEditPath("/edit/drafts")).toEqual({ drafts: true })
  })

  it("returns 'assay' marker for /edit/assay", () => {
    expect(parseEditPath("/edit/assay")).toEqual({ assay: true })
  })
})

describe("kebab", () => {
  it("replaces whitespace with hyphens", () => {
    expect(kebab("Volatile functions")).toBe("Volatile-functions")
  })

  it("preserves case (slugs are case-sensitive)", () => {
    expect(kebab("SUMIF")).toBe("SUMIF")
  })

  it("collapses runs of whitespace into single hyphens", () => {
    expect(kebab("a   b   c")).toBe("a-b-c")
  })

  it("strips non-alphanumeric characters (other than - _ /)", () => {
    expect(kebab("hello, world!")).toBe("hello-world")
    expect(kebab("a/b_c-d")).toBe("a/b_c-d")
  })

  it("trims leading and trailing whitespace", () => {
    expect(kebab("  spaced  ")).toBe("spaced")
  })
})
