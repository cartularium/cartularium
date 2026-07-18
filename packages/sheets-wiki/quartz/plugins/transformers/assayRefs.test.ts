import test from "node:test"
import assert from "node:assert/strict"
import { unified } from "unified"
import remarkParse from "remark-parse"
import { AssayRefs, resolveAssayRefForTest } from "./assayRefs.js"
import Related from "../../components/Related.js"

const manifest = {
  version: 4,
  generatedAt: "2026-05-10T00:00:00.000Z",
  engines: ["excel"],
  tests: {
    "EXPAND/pad-value": {
      ref: "EXPAND/pad-value",
      subject: "EXPAND",
      subjectRef: "EXPAND",
      name: "pad-value",
      suite: "array-longtail",
      hash: "sha256:abc",
      url: "/test/EXPAND/pad-value/",
      engines: { excel: "match" },
    },
  },
  aliases: {
    "EXPAND/pad-with": { target: "EXPAND/pad-value", kind: "public-ref" },
  },
  tombstones: {
    "EXPAND/old-pad-rule": { reason: "retired" },
  },
  hashes: {
    "sha256:abc": "EXPAND/pad-value",
  },
  functions: {
    EXPAND: {
      engines: { excel: { status: "available" } },
      divergences: [],
      tests: ["EXPAND/pad-value"],
    },
  },
} as const

test("resolves canonical assay refs", () => {
  assert.equal(
    resolveAssayRefForTest("EXPAND/pad-value", manifest, "public").url,
    "/test/EXPAND/pad-value/",
  )
})

test("resolves public aliases", () => {
  assert.equal(
    resolveAssayRefForTest("EXPAND/pad-with", manifest, "public").ref,
    "EXPAND/pad-value",
  )
})

test("rejects preview refs in public mode", () => {
  assert.throws(
    () => resolveAssayRefForTest("preview:abc", manifest, "public"),
    /preview refs are not allowed/,
  )
})

test("rejects preview refs in review mode until submitted-case resolution exists", () => {
  assert.throws(
    () => resolveAssayRefForTest("preview:abc", manifest, "review"),
    /preview refs are not supported in review mode/,
  )
})

test("rejects tombstoned refs in public mode", () => {
  assert.throws(
    () => resolveAssayRefForTest("EXPAND/old-pad-rule", manifest, "public"),
    /tombstoned/,
  )
})

test("replaces assay ref markers with links", async () => {
  const plugin = AssayRefs({ manifest })
  const markdownPlugins = plugin.markdownPlugins?.({} as never) ?? []
  const processor = unified().use(remarkParse).use(markdownPlugins)

  const tree = await processor.run(processor.parse("See {{assay EXPAND/pad-value}}."))
  const html = firstHtmlNodeValue(tree)

  assert.match(html, /^<a class="assay-ref"/)
  assert.match(html, /href="https:\/\/assay\.sheets\.wiki\/test\/EXPAND\/pad-value\/"/)
  assert.match(html, /data-assay-ref="EXPAND\/pad-value"/)
  assert.match(html, /assay: EXPAND\/pad-value/)
})

test("marks degraded assay ref output as non-releaseable", async () => {
  const plugin = AssayRefs({ manifest, mode: "degraded" })
  const markdownPlugins = plugin.markdownPlugins?.({} as never) ?? []
  const processor = unified().use(remarkParse).use(markdownPlugins)

  const tree = await processor.run(processor.parse("See {{assay EXPAND/not-in-manifest}}."))
  const html = firstHtmlNodeValue(tree)

  assert.match(html, /^<span class="assay-ref assay-ref--missing assay-ref--degraded"/)
  assert.match(html, /data-assay-ref-mode="degraded"/)
  assert.match(html, /data-cartularium-release-blocker="assay-ref-degraded"/)
})

test("Related refuses to guess assay test links when v4 URL metadata is missing", () => {
  const Component = Related({ hideWhenEmpty: false })

  assert.throws(
    () =>
      Component({
        fileData: {
          slug: "functions/EXPAND",
          frontmatter: {
            tests: ["EXPAND/missing-meta"],
            testVerdicts: {
              "EXPAND/missing-meta": { excel: "match" },
            },
          },
        },
        allFiles: [],
        children: [],
      } as never),
    /missing v4 assay URL metadata for related test EXPAND\/missing-meta/,
  )
})

function firstHtmlNodeValue(node: unknown): string {
  if (!node || typeof node !== "object") return ""
  const record = node as { type?: unknown; value?: unknown; children?: unknown }
  if (record.type === "html") return typeof record.value === "string" ? record.value : ""
  if (!Array.isArray(record.children)) return ""
  for (const child of record.children) {
    const value = firstHtmlNodeValue(child)
    if (value) return value
  }
  return ""
}
