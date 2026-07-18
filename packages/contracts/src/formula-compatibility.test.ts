import test from "node:test"
import assert from "node:assert/strict"
import {
  ALL_PLATFORMS,
  FORMULA_COMPATIBILITY_MANIFEST_VERSION,
  assertSupportedFormulaCompatibilityManifestVersion,
  type FormulaCompatibilityManifest,
} from "./index.js"

test("Formula compatibility manifest is the supported compatibility version", () => {
  assert.equal(FORMULA_COMPATIBILITY_MANIFEST_VERSION, 1)
  assert.doesNotThrow(() =>
    assertSupportedFormulaCompatibilityManifestVersion(1, "formula-compatibility.json"),
  )
  assert.throws(
    () => assertSupportedFormulaCompatibilityManifestVersion(2, "formula-compatibility.json"),
    /unsupported formula compatibility manifest version 2/,
  )
})

test("FormulaCompatibilityManifest shape supports function platform metadata", () => {
  const manifest = {
    version: 1,
    generatedAt: "2026-05-16T00:00:00.000Z",
    platforms: ALL_PLATFORMS,
    functions: {
      IMPORTXML: {
        name: "IMPORTXML",
        platforms: {
          gsheets: {
            support: "external-service",
            note: "Google Sheets XML/HTML import.",
          },
          excel: {
            support: "absent",
            note: "Excel has no compatible formula function.",
            causes: ["missing-function"],
          },
        },
        tags: ["external-io", "web"],
        evidence: [
          {
            source: "assay",
            ref: "external/importxml",
            url: "/test/external/importxml/",
          },
        ],
      },
    },
  } satisfies FormulaCompatibilityManifest

  assert.equal(manifest.version, 1)
  assert.deepEqual(manifest.platforms, ALL_PLATFORMS)
  assert.equal(manifest.functions.IMPORTXML.platforms.gsheets?.support, "external-service")
  assert.equal(manifest.functions.IMPORTXML.platforms.excel?.support, "absent")
})
