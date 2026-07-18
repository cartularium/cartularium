import { test } from "node:test"
import assert from "node:assert/strict"
import {
  createCompatibilityIndex,
  FORMULA_COMPATIBILITY_MANIFEST,
  getFunctionMetadata,
  transpileFormula,
} from "./index.js"

test("transpileFormula canonically prints safe same-dialect formulas", () => {
  const result = transpileFormula("=sum( 1 , a1 )", { from: "gsheets", to: "gsheets" })

  assert.equal(result.formula, "=SUM(1,A1)")
  assert.deepEqual(result.diagnostics, [])
})

test("transpileFormula preserves Excel intersection as semantic syntax", () => {
  const result = transpileFormula("=A1:A3 B1:B3", { from: "excel", to: "excel" })

  assert.equal(result.formula, "=A1:A3 B1:B3")
  assert.deepEqual(result.diagnostics, [])
})

test("transpileFormula refuses Excel intersection when targeting Google Sheets", () => {
  const result = transpileFormula("=A1:A3 B1:B3", { from: "excel", to: "gsheets" })

  assert.equal(result.formula, undefined)
  assert.deepEqual(result.diagnostics, [
    {
      code: "unsupported-operator",
      severity: "error",
      message: "Excel intersection cannot be printed as a Google Sheets formula.",
    },
  ])
})

test("transpileFormula preserves Excel implicit intersection marker", () => {
  const result = transpileFormula("=@A1", { from: "excel", to: "excel" })

  assert.equal(result.formula, "=@A1")
  assert.deepEqual(result.diagnostics, [])
})

test("transpileFormula canonically prints absolute references", () => {
  const result = transpileFormula("=$a$1+B$2", { from: "excel", to: "excel" })

  assert.equal(result.formula, "=$A$1+B$2")
  assert.deepEqual(result.diagnostics, [])
})

test("transpileFormula preserves quoted sheet references", () => {
  const result = transpileFormula("='Q1 Sales'!c3", { from: "excel", to: "excel" })

  assert.equal(result.formula, "='Q1 Sales'!C3")
  assert.deepEqual(result.diagnostics, [])
})

test("transpileFormula refuses Excel implicit intersection when targeting Google Sheets", () => {
  const result = transpileFormula("=@A1", { from: "excel", to: "gsheets" })

  assert.equal(result.formula, undefined)
  assert.deepEqual(result.diagnostics, [
    {
      code: "unsupported-operator",
      severity: "error",
      message: "Excel implicit intersection cannot be printed as a Google Sheets formula.",
    },
  ])
})

test("transpileFormula reports external Google Sheets functions as unsupported", () => {
  const result = transpileFormula('=GOOGLEFINANCE("NASDAQ:GOOG")', {
    from: "gsheets",
    to: "excel",
  })

  assert.equal(result.formula, undefined)
  assert.deepEqual(result.diagnostics, [
    {
      code: "unsupported-function",
      severity: "error",
      message: "GOOGLEFINANCE requires Google Sheets external service context.",
    },
  ])
})

test("transpileFormula uses compatibility metadata for Google Sheets external imports", () => {
  const result = transpileFormula('=IMPORTXML("https://example.com","//title")', {
    from: "gsheets",
    to: "excel",
  })

  assert.equal(result.formula, undefined)
  assert.deepEqual(result.diagnostics, [
    {
      code: "unsupported-function",
      severity: "error",
      message: "IMPORTXML requires Google Sheets external service context.",
    },
  ])
})

test("function compatibility metadata is queryable by canonical function name", () => {
  assert.deepEqual(getFunctionMetadata("encodeurl"), {
    name: "ENCODEURL",
    platforms: {
      gsheets: {
        support: "native",
        note: "Google Sheets URL encoding helper.",
      },
      excel: {
        support: "absent",
        note: "Excel has no compatible text formula function.",
      },
    },
    tags: ["web"],
  })
})

test("function compatibility metadata is indexed from a manifest-shaped feed", () => {
  const index = createCompatibilityIndex(FORMULA_COMPATIBILITY_MANIFEST)

  assert.equal(FORMULA_COMPATIBILITY_MANIFEST.version, 1)
  assert.deepEqual(FORMULA_COMPATIBILITY_MANIFEST.functions.ENCODEURL, index.functions.get("encodeurl"))
  assert.deepEqual(index.functions.get("ENCODEURL")?.platforms.excel, {
    support: "absent",
    note: "Excel has no compatible text formula function.",
  })
})
