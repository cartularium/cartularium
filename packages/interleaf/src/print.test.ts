import assert from "node:assert/strict"
import { test } from "node:test"
import {
  array,
  booleanLiteral,
  call,
  cell,
  columnRange,
  errorLiteral,
  implicitIntersection,
  intersection,
  missingArgument,
  namedReference,
  number,
  printExcelFormula,
  printGoogleSheetsFormula,
  range,
  rowRange,
  sheetReference,
  sheetRangeReference,
  spillReference,
  structuredReference,
  text,
  unionReference,
} from "./index.js"

test("printExcelFormula prints formula IR canonically", () => {
  const result = printExcelFormula(call("sum", [range(cell("a1"), cell("a3"))]))

  assert.equal(result.formula, "=SUM(A1:A3)")
  assert.deepEqual(result.diagnostics, [])
})

test("printExcelFormula prints reference intersection as Excel space syntax", () => {
  const result = printExcelFormula(
    intersection(range(cell("A1"), cell("A3")), range(cell("B1"), cell("B3"))),
  )

  assert.equal(result.formula, "=A1:A3 B1:B3")
  assert.deepEqual(result.diagnostics, [])
})

test("printExcelFormula prints implicit intersection as Excel at syntax", () => {
  const result = printExcelFormula(implicitIntersection(cell("A1")))

  assert.equal(result.formula, "=@A1")
  assert.deepEqual(result.diagnostics, [])
})

test("printExcelFormula prints array literals", () => {
  const result = printExcelFormula(
    array([
      [cell("A1"), cell("B1")],
      [text("x"), call("SUM", [cell("C1")])],
    ]),
  )

  assert.equal(result.formula, '={A1,B1;"x",SUM(C1)}')
  assert.deepEqual(result.diagnostics, [])
})

test("printExcelFormula prints boolean and error literals", () => {
  assert.deepEqual(printExcelFormula(booleanLiteral(true)), {
    formula: "=TRUE",
    diagnostics: [],
  })
  assert.deepEqual(printExcelFormula(errorLiteral("#N/A")), {
    formula: "=#N/A",
    diagnostics: [],
  })
})

test("printExcelFormula prints named references", () => {
  const result = printExcelFormula(namedReference("Revenue_Q1"))

  assert.equal(result.formula, "=Revenue_Q1")
  assert.deepEqual(result.diagnostics, [])
})

test("printExcelFormula prints omitted function arguments", () => {
  const result = printExcelFormula(call("IF", [cell("A1"), missingArgument(), number(0)]))

  assert.equal(result.formula, "=IF(A1,,0)")
  assert.deepEqual(result.diagnostics, [])
})

test("printExcelFormula prints spill references", () => {
  const result = printExcelFormula(spillReference(cell("A1")))

  assert.equal(result.formula, "=A1#")
  assert.deepEqual(result.diagnostics, [])
})

test("printExcelFormula prints whole row and column ranges", () => {
  assert.deepEqual(printExcelFormula(columnRange("A", "C")), {
    formula: "=A:C",
    diagnostics: [],
  })
  assert.deepEqual(printExcelFormula(rowRange("1", "3")), {
    formula: "=1:3",
    diagnostics: [],
  })
})

test("printExcelFormula prints union references", () => {
  const result = printExcelFormula(unionReference([columnRange("A", "A"), columnRange("C", "C")]))

  assert.equal(result.formula, "=(A:A,C:C)")
  assert.deepEqual(result.diagnostics, [])
})

test("printExcelFormula prints structured references", () => {
  const result = printExcelFormula(structuredReference("Table1", ["Amount"]))

  assert.equal(result.formula, "=Table1[Amount]")
  assert.deepEqual(result.diagnostics, [])
})

test("printExcelFormula prints structured references with multiple selectors", () => {
  const result = printExcelFormula(structuredReference("Table1", ["#Headers", "Amount"]))

  assert.equal(result.formula, "=Table1[[#Headers],[Amount]]")
  assert.deepEqual(result.diagnostics, [])
})

test("printGoogleSheetsFormula rejects reference intersection", () => {
  const result = printGoogleSheetsFormula(
    intersection(range(cell("A1"), cell("A3")), range(cell("B1"), cell("B3"))),
  )

  assert.equal(result.formula, undefined)
  assert.deepEqual(result.diagnostics, [
    {
      code: "unsupported-operator",
      severity: "error",
      message: "Excel intersection cannot be printed as a Google Sheets formula.",
    },
  ])
})

test("printGoogleSheetsFormula rejects implicit intersection", () => {
  const result = printGoogleSheetsFormula(implicitIntersection(cell("A1")))

  assert.equal(result.formula, undefined)
  assert.deepEqual(result.diagnostics, [
    {
      code: "unsupported-operator",
      severity: "error",
      message: "Excel implicit intersection cannot be printed as a Google Sheets formula.",
    },
  ])
})

test("printGoogleSheetsFormula rejects structured references", () => {
  const result = printGoogleSheetsFormula(structuredReference("Table1", ["Amount"]))

  assert.equal(result.formula, undefined)
  assert.deepEqual(result.diagnostics, [
    {
      code: "unsupported-reference",
      severity: "error",
      message: "Excel structured references cannot be printed as a Google Sheets formula.",
    },
  ])
})

test("printGoogleSheetsFormula rejects spill references", () => {
  const result = printGoogleSheetsFormula(spillReference(cell("A1")))

  assert.equal(result.formula, undefined)
  assert.deepEqual(result.diagnostics, [
    {
      code: "unsupported-reference",
      severity: "error",
      message: "Excel spill references cannot be printed as a Google Sheets formula.",
    },
  ])
})

test("printGoogleSheetsFormula rejects union references", () => {
  const result = printGoogleSheetsFormula(unionReference([cell("A1"), cell("C1")]))

  assert.equal(result.formula, undefined)
  assert.deepEqual(result.diagnostics, [
    {
      code: "unsupported-reference",
      severity: "error",
      message: "Excel reference unions cannot be printed as a Google Sheets formula.",
    },
  ])
})

test("printExcelFormula quotes sheet names when needed", () => {
  const result = printExcelFormula(sheetReference("Q1 Sales", cell("C3")))

  assert.equal(result.formula, "='Q1 Sales'!C3")
  assert.deepEqual(result.diagnostics, [])
})

test("printExcelFormula prints 3D sheet references", () => {
  const result = printExcelFormula(sheetRangeReference("Sheet1", "Sheet3", cell("A1")))

  assert.equal(result.formula, "=Sheet1:Sheet3!A1")
  assert.deepEqual(result.diagnostics, [])
})

test("printGoogleSheetsFormula rejects 3D sheet references", () => {
  const result = printGoogleSheetsFormula(sheetRangeReference("Sheet1", "Sheet3", cell("A1")))

  assert.equal(result.formula, undefined)
  assert.deepEqual(result.diagnostics, [
    {
      code: "unsupported-reference",
      severity: "error",
      message: "Excel 3D sheet references cannot be printed as a Google Sheets formula.",
    },
  ])
})

test("printExcelFormula escapes strings", () => {
  const result = printExcelFormula(call("CONCAT", [text('a "quote"')]))

  assert.equal(result.formula, '=CONCAT("a ""quote""")')
  assert.deepEqual(result.diagnostics, [])
})
