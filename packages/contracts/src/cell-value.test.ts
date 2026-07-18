import { test } from "node:test"
import { strict as assert } from "node:assert"
import {
  projectPrimitive,
  projectScalarGrid,
  type RichCellValue,
  type RichGridValue,
} from "./cell-value.js"

const excelBase = { engine: { platform: "excel" } } as const
const gsheetsBase = { engine: { platform: "gsheets", wire_kind: "number" } } as const

test("projectPrimitive — number/string/boolean pass through", () => {
  assert.equal(
    projectPrimitive({ primitive: { kind: "number", value: 42 }, ...excelBase }),
    42,
  )
  assert.equal(
    projectPrimitive({ primitive: { kind: "string", value: "hi" }, ...excelBase }),
    "hi",
  )
  assert.equal(
    projectPrimitive({ primitive: { kind: "boolean", value: true }, ...excelBase }),
    true,
  )
})

test("projectPrimitive — classic error projects to {error: sentinel}", () => {
  assert.deepEqual(
    projectPrimitive({ primitive: { kind: "error", sentinel: "#DIV/0!" }, ...excelBase }),
    { error: "#DIV/0!" },
  )
})

test("projectPrimitive — extended-error projects same shape as classic error", () => {
  // The "extended" vs "classic" distinction is for the rich shape only;
  // the scalar projection collapses both to {error: sentinel}.
  assert.deepEqual(
    projectPrimitive({
      primitive: { kind: "extended-error", sentinel: "#SPILL!", error_type: 8 },
      ...excelBase,
    }),
    { error: "#SPILL!" },
  )
})

test("projectPrimitive — blank and null both collapse to scalar null", () => {
  // The kind distinction (Excel decay-through-formula vs gsheets propagatable
  // Null) is preserved in the rich shape; scalar callers see plain null.
  assert.equal(
    projectPrimitive({
      primitive: { kind: "blank", reason: "untouched" },
      ...excelBase,
    }),
    null,
  )
  assert.equal(
    projectPrimitive({
      primitive: { kind: "null", reason: "formula-returned-null" },
      ...gsheetsBase,
    }),
    null,
  )
})

test("projectPrimitive — rich-text projects to the collapsed string", () => {
  assert.equal(
    projectPrimitive({
      primitive: { kind: "rich-text", collapsed: "hello world" },
      ...excelBase,
    }),
    "hello world",
  )
})

test("projectPrimitive — opaque (rendered-rich) has no scalar value => null", () => {
  // Content-opaque circulating value (image/sparkline): the rich layer carries
  // primitive.kind/type_tag; the legacy scalar layer is kind-only => null.
  assert.equal(
    projectPrimitive({
      primitive: { kind: "opaque", type_tag: "image" },
      ...excelBase,
    }),
    null,
  )
  assert.equal(
    projectPrimitive({
      primitive: { kind: "opaque", type_tag: "sparkline" },
      ...excelBase,
    }),
    null,
  )
})

test("projectScalarGrid — applies projection cell-by-cell, preserves nulls", () => {
  const grid: RichGridValue = [
    [
      { primitive: { kind: "number", value: 1 }, ...excelBase },
      null,
      { primitive: { kind: "error", sentinel: "#N/A" }, ...excelBase },
    ],
    [
      { primitive: { kind: "blank", reason: "untouched" }, ...excelBase },
      { primitive: { kind: "string", value: "x" }, ...excelBase },
      null,
    ],
  ]
  assert.deepEqual(projectScalarGrid(grid), [
    [1, null, { error: "#N/A" }],
    [null, "x", null],
  ])
})

test("RichCellValue carries engine extras (type-shape sanity)", () => {
  // Sanity check: ExcelExtras and GSheetsExtras both satisfy the
  // discriminated-union constraint without compile error.
  const excelCell: RichCellValue = {
    primitive: { kind: "extended-error", sentinel: "#SPILL!", error_type: 8 },
    engine: {
      platform: "excel",
      modern_error_detail: { error_type: 8, sub_type: 1, extras: { colOffset: "2" } },
    },
  }
  const gsheetsCell: RichCellValue = {
    primitive: { kind: "null", reason: "formula-returned-null" },
    engine: { platform: "gsheets", wire_kind: "null" },
  }
  assert.equal(excelCell.engine.platform, "excel")
  assert.equal(gsheetsCell.engine.platform, "gsheets")
})
