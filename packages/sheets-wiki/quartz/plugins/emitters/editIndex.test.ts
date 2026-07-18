import { test } from "node:test"
import { strict as assert } from "node:assert"
import { deriveEditIndexEntry, kindFromSlug } from "./editIndex.js"

test("kindFromSlug picks the top-level segment", () => {
  assert.equal(kindFromSlug("function/SUMIF"), "function")
  assert.equal(kindFromSlug("concept/Array"), "concept")
  assert.equal(kindFromSlug("blog/2025-09-something"), "blog")
})

test("kindFromSlug returns 'other' for unknown top-level segments", () => {
  assert.equal(kindFromSlug("misc/whatever"), "other")
  assert.equal(kindFromSlug("README"), "other")
})

test("deriveEditIndexEntry pulls title + dek + aliases from frontmatter", () => {
  const entry = deriveEditIndexEntry({
    slug: "function/SUMIF" as any,
    frontmatter: {
      title: "SUMIF",
      description: "Returns a conditional sum across a range.",
      aliases: ["SUM_IF"],
      status: "imported",
    },
  })
  assert.equal(entry.slug, "function/SUMIF")
  assert.equal(entry.title, "SUMIF")
  assert.equal(entry.kind, "function")
  assert.equal(entry.dek, "Returns a conditional sum across a range.")
  assert.deepEqual(entry.aliases, ["SUM_IF"])
})

test("deriveEditIndexEntry uses slug-derived title when frontmatter title missing", () => {
  const entry = deriveEditIndexEntry({
    slug: "concept/Array" as any,
    frontmatter: {},
  })
  assert.equal(entry.title, "Array")
})

test("deriveEditIndexEntry maps function-page lifecycle status to active|deprecated|hidden", () => {
  const active = deriveEditIndexEntry({
    slug: "function/SUM" as any,
    frontmatter: { status: "imported" },
  })
  // 'imported' is treated as active for the editor's autocomplete purposes
  assert.equal(active.status, "active")

  const deprecated = deriveEditIndexEntry({
    slug: "function/OLDFUNC" as any,
    frontmatter: { status: "deprecated" },
  })
  assert.equal(deprecated.status, "deprecated")

  const hidden = deriveEditIndexEntry({
    slug: "function/SECRET" as any,
    frontmatter: { status: "hidden" },
  })
  assert.equal(hidden.status, "hidden")
})

test("deriveEditIndexEntry uses relativePath for kind when slug is flattened", () => {
  // Quartz flattens function-page slugs (function/SUMIF.md → slug "SUMIF"), so the
  // emitter passes relativePath for correct kind derivation. Verify the helper
  // honors it even when slug alone would resolve to "other".
  const entry = deriveEditIndexEntry({
    slug: "SUMIF" as any,
    relativePath: "function/SUMIF.md",
    frontmatter: { name: "SUMIF" },
  })
  assert.equal(entry.kind, "function")
  assert.equal(entry.slug, "SUMIF")
  assert.equal(entry.title, "SUMIF") // name fallback (no title in frontmatter)
  assert.equal(entry.status, "active") // status emitted because kind is function
})

test("deriveEditIndexEntry omits status for non-function kinds", () => {
  const entry = deriveEditIndexEntry({
    slug: "concept/Array" as any,
    frontmatter: { title: "Array", status: "deprecated" },
  })
  assert.equal(entry.kind, "concept")
  assert.equal(entry.status, undefined)
})

test("deriveEditIndexEntry forwards relativePath as path so editor can read files with spaced names", () => {
  const entry = deriveEditIndexEntry({
    slug: "blog/Asking-Questions" as any,
    relativePath: "blog/Asking Questions.md",
    frontmatter: { title: "Asking Questions" },
  })
  assert.equal(entry.path, "blog/Asking Questions.md")
})

test("deriveEditIndexEntry omits path when relativePath isn't supplied", () => {
  const entry = deriveEditIndexEntry({
    slug: "concept/Array" as any,
    frontmatter: { title: "Array" },
  })
  assert.equal(entry.path, undefined)
})
