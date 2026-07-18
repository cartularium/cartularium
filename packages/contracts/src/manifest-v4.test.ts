import test from "node:test"
import assert from "node:assert/strict"
import {
  ALL_PLATFORMS,
  assertSupportedManifestVersion,
  MANIFEST_VERSION,
  type ManifestEngineEntry,
  type ManifestV4,
  type Platform,
} from "./index.js"

const allAvailableEngines = {
  gsheets: { status: "available" },
  excel: { status: "available" },
  lattice: { status: "available" },
  ironcalc: { status: "available" },
  hyperformula: { status: "available" },
  libreoffice: { status: "available" },
  formulas: { status: "available" },
  pycel: { status: "available" },
} satisfies Record<Platform, ManifestEngineEntry>

test("Manifest v4 is the supported manifest version", () => {
  assert.equal(MANIFEST_VERSION, 4)
  assert.doesNotThrow(() => assertSupportedManifestVersion(4, "manifest.json"))
  assert.throws(
    () => assertSupportedManifestVersion(3, "manifest.json"),
    /unsupported manifest version 3/,
  )
})

test("ManifestV4 shape supports public refs, aliases, hashes, and tombstones", () => {
  const manifest = {
    version: 4,
    generatedAt: "2026-05-10T00:00:00.000Z",
    engines: ALL_PLATFORMS,
    dvs: {},
    tests: {
      "EXPAND/pad-value": {
        ref: "EXPAND/pad-value",
        subject: "EXPAND",
        subjectRef: "EXPAND",
        name: "pad-value",
        suite: "array-longtail",
        hash: "sha256:9e091174",
        url: "/test/EXPAND/pad-value/",
        aliases: ["EXPAND/pad-with"],
        engines: { excel: "match", gsheets: "match" },
      },
    },
    aliases: {
      "EXPAND/pad-with": { target: "EXPAND/pad-value", kind: "public-ref" },
    },
    tombstones: {
      "EXPAND/old-pad-rule": { reason: "replaced by a more precise case split" },
    },
    hashes: {
      "sha256:9e091174": "EXPAND/pad-value",
    },
    functions: {
      EXPAND: {
        engines: allAvailableEngines,
        divergences: [],
        tests: ["EXPAND/pad-value"],
      },
    },
  } satisfies ManifestV4

  assert.equal(manifest.version, 4)
  assert.deepEqual(manifest.engines, ALL_PLATFORMS)

  const testEntry = manifest.tests["EXPAND/pad-value"]
  assert.ok(testEntry)
  assert.equal(testEntry.ref, "EXPAND/pad-value")
  assert.equal(testEntry.subject, "EXPAND")
  assert.equal(testEntry.subjectRef, "EXPAND")
  assert.equal(testEntry.name, "pad-value")
  assert.equal(testEntry.suite, "array-longtail")
  assert.equal(testEntry.hash, "sha256:9e091174")
  assert.equal(testEntry.url, "/test/EXPAND/pad-value/")
  assert.deepEqual(testEntry.aliases, ["EXPAND/pad-with"])
  assert.deepEqual(testEntry.engines, { excel: "match", gsheets: "match" })

  const aliasEntry = manifest.aliases["EXPAND/pad-with"]
  assert.ok(aliasEntry)
  assert.deepEqual(aliasEntry, { target: "EXPAND/pad-value", kind: "public-ref" })
  assert.deepEqual(manifest.hashes, { "sha256:9e091174": "EXPAND/pad-value" })
  assert.deepEqual(manifest.tombstones["EXPAND/old-pad-rule"], {
    reason: "replaced by a more precise case split",
  })

  const expandFunction = manifest.functions.EXPAND
  assert.ok(expandFunction)
  assert.deepEqual(Object.keys(expandFunction.engines).sort(), [...ALL_PLATFORMS].sort())
  for (const platform of ALL_PLATFORMS) {
    assert.deepEqual(expandFunction.engines[platform], { status: "available" })
  }
  assert.deepEqual(expandFunction.tests, ["EXPAND/pad-value"])
})
